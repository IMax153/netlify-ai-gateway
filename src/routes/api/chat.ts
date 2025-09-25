import { Chat } from "@effect/ai"
import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai"
import { Persistence, Sse } from "@effect/experimental"
import { FetchHttpClient, HttpServerResponse, KeyValueStore } from "@effect/platform"
import { NodeContext } from "@effect/platform-node"
import { createFileRoute } from "@tanstack/react-router"
import type { UIMessage } from "ai"
import { promptFromUIMessages, toUIMessageStream } from "@/lib/ai"
import { Config, Console, Effect, Layer, Ref, Stream } from "effect"
// import {
// 	convertToModelMessages,
// 	createIdGenerator,
// 	generateId,
// 	streamText,
// 	validateUIMessages,
// } from "ai"
// import { openai } from "@ai-sdk/openai"
// import { existsSync, mkdirSync } from "node:fs"
// import { readFile, writeFile } from "node:fs/promises"
// import path from "node:path"

// class DadJoke extends Schema.Class<DadJoke>("DadJoke")({
// 	id: Schema.String,
// 	joke: Schema.String,
// }) {}
//
// class SearchResponse extends Schema.Class<SearchResponse>("SearchResponse")({
// 	results: Schema.Array(DadJoke),
// }) {}
//
// class ICanHazDadJoke extends Effect.Service<ICanHazDadJoke>()(
// 	"ICanHazDadJoke",
// 	{
// 		dependencies: [FetchHttpClient.layer],
// 		effect: Effect.gen(function* () {
// 			const httpClient = yield* HttpClient.HttpClient
// 			const httpClientOk = httpClient.pipe(
// 				HttpClient.filterStatusOk,
// 				HttpClient.mapRequest(
// 					HttpClientRequest.prependUrl("https://icanhazdadjoke.com"),
// 				),
// 			)
//
// 			const search = Effect.fn("ICanHazDadJoke.search")(function* (
// 				searchTerm: string,
// 			) {
// 				return yield* httpClientOk
// 					.get("/search", {
// 						acceptJson: true,
// 						urlParams: { searchTerm },
// 					})
// 					.pipe(
// 						Effect.flatMap(HttpClientResponse.schemaBodyJson(SearchResponse)),
// 						Effect.flatMap(({ results }) => Array.head(results)),
// 						Effect.map((joke) => joke.joke),
// 						Effect.scoped,
// 						Effect.orDie,
// 					)
// 			})
//
// 			return {
// 				search,
// 			} as const
// 		}),
// 	},
// ) {}
//
// const GetDadJoke = Tool.make("GetDadJoke", {
// 	description: "Get a hilarious dad joke from the ICanHazDadJoke API",
// 	success: Schema.String,
// 	failure: Schema.Never,
// 	parameters: {
// 		searchTerm: Schema.String.annotations({
// 			description: "The search term to use to find dad jokes",
// 		}),
// 	},
// })
//
// const DadJokeTools = Toolkit.make(GetDadJoke)
//
// const DadJokeToolHandlers = DadJokeTools.toLayer(
// 	Effect.gen(function* () {
// 		const icanhazdadjoke = yield* ICanHazDadJoke
// 		return {
// 			GetDadJoke: ({ searchTerm }) => icanhazdadjoke.search(searchTerm),
// 		}
// 	}),
// ).pipe(Layer.provide(ICanHazDadJoke.Default))

// const createStream = (prompt: Prompt.Prompt) =>
// 	LanguageModel.streamText({ prompt }).pipe(
// 		toUIMessageStream({}),
// 		Stream.map((part) =>
// 			Sse.encoder.write({
// 				_tag: "Event",
// 				id: undefined,
// 				event: "message",
// 				data: JSON.stringify(part),
// 			}),
// 		),
// 		Stream.concat(
// 			Stream.make(
// 				Sse.encoder.write({
// 					_tag: "Event",
// 					id: undefined,
// 					event: "message",
// 					data: "[DONE]",
// 				}),
// 			),
// 		),
// 		Stream.encodeText,
// 		Stream.provideLayer(MainLayer),
// 		HttpServerResponse.stream,
// 	)

// export async function createChat(): Promise<string> {
// 	const id = generateId() // generate a unique chat ID
// 	await writeFile(getChatFile(id), "[]") // create an empty chat file
// 	return id
// }
//
// function getChatFile(id: string): string {
// 	const chatDir = path.join(process.cwd(), ".chats")
// 	if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true })
// 	return path.join(chatDir, `${id}.json`)
// }
//
// export async function loadChat(id: string): Promise<UIMessage[]> {
// 	return JSON.parse(await readFile(getChatFile(id), "utf8"))
// }
//
// async function saveChat({
// 	chatId,
// 	messages,
// }: {
// 	chatId: string
// 	messages: UIMessage[]
// }): Promise<void> {
// 	const content = JSON.stringify(messages, null, 2)
// 	await writeFile(getChatFile(chatId), content)
// }

const OpenAiLayer = OpenAiClient.layerConfig({
	apiUrl: Config.string("OPENAI_BASE_URL").pipe(Config.withDefault(undefined)),
	apiKey: Config.redacted("OPENAI_API_KEY"),
}).pipe(Layer.provide(FetchHttpClient.layer))

const PersistenceLayer = Chat.layerPersisted({ storeId: "chat-" }).pipe(
	Layer.provide(Persistence.layerKeyValueStore),
	Layer.provide(KeyValueStore.layerFileSystem(".chats")),
	Layer.provide(NodeContext.layer),
)

const program = Effect.fnUntraced(
	function* (params: { readonly id: string; readonly message: UIMessage }) {
		const persistence = yield* Chat.Persistence
		const model = yield* OpenAiLanguageModel.model("gpt-4o-mini")

		const chat = yield* persistence.getOrCreate(params.id)

		return chat
			.streamText({
				prompt: promptFromUIMessages([params.message]),
			})
			.pipe(Stream.provideLayer(model), toUIMessageStream({ history: chat.history }))
	},
	Effect.provide([OpenAiLayer, PersistenceLayer]),
	Stream.unwrap,
)

export const Route = createFileRoute("/api/chat")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const json: { id: string; message: UIMessage } = await request.json()

				const stream = program(json).pipe(
					Stream.map((part) =>
						Sse.encoder.write({
							_tag: "Event",
							id: undefined,
							event: "message",
							data: JSON.stringify(part),
						}),
					),
					Stream.concat(
						Stream.make(
							Sse.encoder.write({
								_tag: "Event",
								id: undefined,
								event: "message",
								data: "[DONE]",
							}),
						),
					),
					Stream.encodeText,
				)

				return HttpServerResponse.toWeb(
					HttpServerResponse.stream(stream, {
						contentType: "text/event-stream",
					}),
				)
			},
		},
	},
})
