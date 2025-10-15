import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Arr from "effect/Array"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"

export class DadJoke extends Schema.Class<DadJoke>("DadJoke")({
	id: Schema.String,
	joke: Schema.String,
}) {}

export class SearchResponse extends Schema.Class<SearchResponse>("SearchResponse")({
	results: Schema.Array(DadJoke),
}) {}

export class ICanHazDadJoke extends Effect.Service<ICanHazDadJoke>()("ICanHazDadJoke", {
	effect: Effect.gen(function* () {
		const httpClient = yield* HttpClient.HttpClient
		const httpClientOk = httpClient.pipe(
			HttpClient.filterStatusOk,
			HttpClient.mapRequest(HttpClientRequest.prependUrl("https://icanhazdadjoke.com")),
		)

		const search = Effect.fn("ICanHazDadJoke.search")(function* (searchTerm: string) {
			return yield* httpClientOk
				.get("/search", {
					acceptJson: true,
					urlParams: { term: searchTerm },
				})
				.pipe(
					Effect.flatMap(HttpClientResponse.schemaBodyJson(SearchResponse)),
					Effect.map(({ results }) => Arr.head(results)),
					Effect.map(Option.map((joke) => joke.joke)),
					Effect.orDie,
				)
		})

		const random = Effect.fn("ICanHazDadJoke.random")(function* () {
			return yield* httpClientOk
				.get("/", {
					acceptJson: true,
				})
				.pipe(
					Effect.flatMap(HttpClientResponse.schemaBodyJson(DadJoke)),
					Effect.map((joke) => joke.joke),
					Effect.orDie,
				)
		})

		return {
			search,
			random,
		} as const
	}),
}) {}
