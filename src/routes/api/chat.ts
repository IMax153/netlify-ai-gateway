import { Chat } from "@effect/ai"
import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai"
import { Persistence, Sse } from "@effect/experimental"
import { FetchHttpClient, HttpServerResponse } from "@effect/platform"
import { NodeContext } from "@effect/platform-node"
import { createFileRoute } from "@tanstack/react-router"
import type { UIMessage } from "ai"
import { Config, Effect, Layer, Stream } from "effect"
import { promptFromUIMessages, toUIMessageStream } from "@/lib/ai"

const OpenAiLayer = OpenAiClient.layerConfig({
	apiUrl: Config.string("OPENAI_BASE_URL").pipe(Config.withDefault(undefined)),
	apiKey: Config.redacted("OPENAI_API_KEY"),
}).pipe(Layer.provide(FetchHttpClient.layer))

const PersistenceLayer = Chat.layerPersisted({ storeId: "chat-" }).pipe(
	Layer.provide(Persistence.layerMemory),
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
