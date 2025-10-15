import * as Tool from "@effect/ai/Tool"
import * as Toolkit from "@effect/ai/Toolkit"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import { ICanHazDadJoke } from "@/services/icanhazdadjoke"

export const SearchDadJoke = Tool.make("SearchDadJoke", {
	description:
		"Search for a specific type of dad joke (e.g., 'dog', 'computer', 'food'). Use this when the user wants a joke about a specific topic.",
	success: Schema.String,
	failure: Schema.Never,
	parameters: {
		searchTerm: Schema.String.annotations({
			description: "The topic or keyword to search for in dad jokes",
		}),
	},
})

export const GetRandomDadJoke = Tool.make("GetRandomDadJoke", {
	description:
		"Get a random dad joke. Use this for general joke requests when no specific topic is requested.",
	success: Schema.String,
	failure: Schema.Never,
	parameters: {},
})

export const DadJokeTools = Toolkit.make(SearchDadJoke, GetRandomDadJoke)

export const DadJokeToolsLayer = DadJokeTools.toLayer(
	Effect.gen(function* () {
		const icanhazdadjoke = yield* ICanHazDadJoke
		return {
			SearchDadJoke: ({ searchTerm }) =>
				icanhazdadjoke.search(searchTerm).pipe(
					Effect.map((maybeJoke) =>
						Option.match(maybeJoke, {
							onNone: () => `No dad jokes found for "${searchTerm}". Try a different search term!`,
							onSome: (joke) => joke,
						}),
					),
					Effect.tapDefect((tapErrorCause) => Effect.logError("Searching dad joke", tapErrorCause)),
				),
			GetRandomDadJoke: () =>
				icanhazdadjoke
					.random()
					.pipe(
						Effect.tapDefect((tapErrorCause) =>
							Effect.logError("Getting random dad joke", tapErrorCause),
						),
					),
		}
	}),
).pipe(Layer.provide(ICanHazDadJoke.Default))
