import * as Tool from "@effect/ai/Tool"
import * as Toolkit from "@effect/ai/Toolkit"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import { ICanHazDadJoke } from "@/services/icanhazdadjoke"

export const GetDadJoke = Tool.make("GetDadJoke", {
	description: "Get a hilarious dad joke from the ICanHazDadJoke API",
	success: Schema.String,
	failure: Schema.Never,
	parameters: {
		searchTerm: Schema.String.annotations({
			description: "The search term to use to find dad jokes",
		}),
	},
})

export const DadJokeTools = Toolkit.make(GetDadJoke)

export const DadJokeToolsLayer = DadJokeTools.toLayer(
	Effect.gen(function* () {
		const icanhazdadjoke = yield* ICanHazDadJoke
		return {
			GetDadJoke: ({ searchTerm }) =>
				icanhazdadjoke.search(searchTerm).pipe(Effect.delay("10 seconds")),
		}
	}),
).pipe(Layer.provide(ICanHazDadJoke.Default))
