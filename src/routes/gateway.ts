import { LanguageModel } from "@effect/ai"
import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai"
import { FetchHttpClient } from "@effect/platform"
import { createServerFileRoute } from "@tanstack/react-start/server"
import { Config, Effect, Layer } from "effect"

const program = Effect.gen(function* () {
	const response = yield* LanguageModel.generateText({
		prompt: "Why is the sky blue?",
	})
	return new Response(response.text)
}).pipe(Effect.provide(OpenAiLanguageModel.model("gpt-5-nano-2025-08-07")))

const MainLayer = OpenAiClient.layerConfig({
	apiUrl: Config.string("OPENAI_BASE_URL"),
	apiKey: Config.redacted("OPENAI_API_KEY"),
}).pipe(Layer.provide(FetchHttpClient.layer))

export const ServerRoute = createServerFileRoute("/gateway").methods({
	GET: () => program.pipe(Effect.provide(MainLayer), Effect.runPromise),
})
