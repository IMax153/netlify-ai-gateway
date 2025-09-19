import { LanguageModel, Prompt } from "@effect/ai"
import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai"
import { Sse } from "@effect/experimental"
import { FetchHttpClient, HttpApp, HttpServerResponse } from "@effect/platform"
import { createServerFileRoute } from "@tanstack/react-start/server"
import type { UIMessage } from "ai"
import { Config, Effect, Layer, Stream } from "effect"
import { toUIMessageStream } from "../../lib/testing"

const MainLayer = OpenAiLanguageModel.model("gpt-4o-mini").pipe(
	Layer.provide(
		OpenAiClient.layerConfig({
			apiUrl: Config.string("OPENAI_BASE_URL").pipe(
				Config.withDefault(undefined),
			),
			apiKey: Config.redacted("OPENAI_API_KEY"),
		}),
	),
	Layer.provide(FetchHttpClient.layer),
)

const createStream = Effect.fnUntraced(function* (prompt: Prompt.Prompt) {
	return LanguageModel.streamText({ prompt }).pipe(
		toUIMessageStream({}),
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
		Stream.provideLayer(MainLayer),
		HttpServerResponse.stream,
	)
})

export const ServerRoute = createServerFileRoute("/api/chat").methods({
	POST: async ({ request }) => {
		const { messages }: { messages: UIMessage[] } = await request.json()

		const parts: Array<Prompt.UserMessagePart> = []
		for (const message of messages) {
			for (const part of message.parts) {
				switch (part.type) {
					case "text": {
						parts.push(
							Prompt.makePart("text", {
								text: part.text,
							}),
						)
					}
				}
			}
		}

		const prompt = Prompt.fromMessages([
			Prompt.makeMessage("user", { content: parts }),
		])

		const handler = createStream(prompt).pipe(
			Effect.provide(MainLayer),
			HttpApp.toWebHandler,
		)

		return handler(request)
	},
})
