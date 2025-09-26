import * as Chat from "@effect/ai/Chat"
import * as Tool from "@effect/ai/Tool"
import * as Toolkit from "@effect/ai/Toolkit"
import * as OpenAiClient from "@effect/ai-openai/OpenAiClient"
import * as OpenAiLanguageModel from "@effect/ai-openai/OpenAiLanguageModel"
import * as Persistence from "@effect/experimental/Persistence"
import * as FetchHttpClient from "@effect/platform/FetchHttpClient"
import * as HttpApp from "@effect/platform/HttpApp"
import * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import * as NodeContext from "@effect/platform-node/NodeContext"
import { createFileRoute } from "@tanstack/react-router"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import { promptFromUIMessages, toUIMessageStream } from "@/lib/ai"
import { toServerSentEventStream } from "@/lib/sse"
import { UIMessage } from "@/lib/ui-message"
import { NetlifyOrFileSystemKVS } from "@/services/kvs"

// In production, we use the Effect config module to load an environment variable
// that we have setup ourselves to determine the name of the blob store that we
// want to use to store our persisted chats. In development, this variable is
// not available, so we fallback to using the value `"chats"` as our store
// identifier.
const chatStoreId = Config.string("NETLIFY_CHATS_BLOB_STORE_ID").pipe(Config.withDefault("chats"))

// The OpenAI client layer will allow us to make calls to the OpenAI API
const OpenAiClientLayer = OpenAiClient.layerConfig({
	// In production, several environment variables will be injected into our
	// function which allows us to use the Netlify AI Gateway to connect to
	// different large language model providers.
	//
	// Here, we use Effect's config module to load the `OPENAI_BASE_URL` provided
	// to us by the Netlify AI Gateway.
	apiUrl: Config.string("OPENAI_BASE_URL").pipe(
		// In development, we use `undefined` to allow the Effect AI SDK to fallback
		// to the default OpenAI API URL
		Config.withDefault(undefined),
	),
	// Here, we use Effect's config module to load the `OPENAI_BASE_URL` provided
	// to us by the Netlify AI Gateway. We still need an API key in development
	// which is why there is no fallback.
	apiKey: Config.redacted("OPENAI_API_KEY"),
}).pipe(
	// Accessing the OpenAI API requires some implementation of an HTTP client
	// to be available. Given this function has access to fetch, we can just
	// provide the `HttpClient` implementation that uses fetch to our program.
	Layer.provide(FetchHttpClient.layer),
)

// The persisted chat layer allows our program to create persisted chats
const PersistenceLayer = Chat.layerPersisted({ storeId: "chat-" }).pipe(
	// A backing persistence store is required for persisted chats, so we provide
	// support for key / value store persistence to the chat persistence layer
	Layer.provide(Persistence.layerKeyValueStore),
	// Key / value store persistence requires an implementation of a key / value
	// store, so we provide a layer that swaps between a key / value store
	// implementation that uses Netlify Blobs in production and the filesystem
	// in development
	Layer.provide(NetlifyOrFileSystemKVS(chatStoreId)),
	// Given that we use a filesystem-backed key / value store in development, we
	// must provide an implementation of a filesystem. Since we will be running in
	// a NodeJS environment, we provide an implementation of a file system that is
	// backed by the NodeJS `fs` module via the `NodeContext` module.
	Layer.provide(NodeContext.layer),
)

const GetWeather = Tool.make("GetWeather", {
	description: "Get the weather information for a specific location",
	parameters: {
		location: Schema.String.annotations({
			description: "The city or location to get the weather for",
		}),
		units: Schema.NullOr(Schema.Literal("celsius", "farenheit")).annotations({
			description: "The units to use for the temperature. Defaults to celsius.",
		}),
	},
	success: Schema.Struct({
		location: Schema.String,
		temperature: Schema.String,
		conditions: Schema.String,
		humidity: Schema.String,
		windSpeed: Schema.String,
		lastUpdated: Schema.DateFromString,
	}),
})

const ChatToolkit = Toolkit.make(GetWeather)

const ChatToolkitLayer = ChatToolkit.toLayer({
	GetWeather: Effect.fnUntraced(function* ({ location, units }) {
		yield* Effect.sleep("2 seconds")

		const temp =
			units === "celsius" ? Math.floor(Math.random() * 35) + 5 : Math.floor(Math.random() * 63) + 41

		return {
			location,
			temperature: `${temp}°${units === "celsius" ? "C" : "F"}`,
			conditions: "Sunny",
			humidity: `12%`,
			windSpeed: `35 ${units === "celsius" ? "km/h" : "mph"}`,
			lastUpdated: new Date(),
		}
	}),
})

// Create a schema for the type of `UIMessage`s that the chat endpoint expects.
const ChatUIMessage = UIMessage()

// Construct an `HttpApp` to handle the request / response lifecycle of our
// Netlify function.
//
// An `HttpApp` is just a type-alias for an `Effect` which succeeds with
// an `HttpServerResponse`, may fail with some error, and requires an
// `HttpServerRequest` in order to be executed.
//
// ```
// Effect<HttpServerResponse, E, HttpServerRequest>
// ```
//
const App: HttpApp.Default = Effect.gen(function* () {
	// Extract the chat persistence service from the Effect environment
	const persistence = yield* Chat.Persistence

	// Setup the OpenAI language model to use for the request to the model
	const model = yield* OpenAiLanguageModel.model("gpt-4o-mini")

	// Parse the incoming request from the client. The request is injected
	// into the Effect environment from the route handler so we do not need to
	// pass it around explicitly.
	const { id: chatId, message } = yield* HttpServerRequest.schemaBodyJson(
		Schema.Struct({
			id: Schema.String,
			message: ChatUIMessage,
		}),
	)

	// Get or create a new persistence store for the requested chat
	const chat = yield* persistence.getOrCreate(chatId)

	// Construct a prompt from the user message send by the client
	const prompt = promptFromUIMessages([message])

	// Create a stream that will issue a request to the large language model
	// provider and stream back response parts. Also inject the model that we
	// want to use here (though it could be done at any point).
	const stream = chat
		.streamText({
			prompt,
			toolkit: ChatToolkit,
		})
		.pipe(Stream.provideSomeLayer(model))

	const sseStream = stream.pipe(
		// Convert the stream response parts into `UIMessage` parts. Specifying
		// the previous chat history will ensure that the correct message
		// identifier is returned to the client to support persistence.
		toUIMessageStream({ history: chat.history }),

		// Convert the `UIMessage` stream into a server-sent-event (SSE) stream.
		// The provided schema will be used to safely encode the elements of the
		// stream.
		//
		// **NOTE**: For now, we are using `Schema.Any` until we finish support
		// for serialization of `UIMessage`s via Effect Schema.
		toServerSentEventStream(Schema.Any),
	)

	// Convert the entire stream into a response stream.
	return HttpServerResponse.stream(sseStream, {
		contentType: "text/event-stream",
	})
}).pipe(
	// Provide the OpenAI client and persistence dependencies to our app
	Effect.provide([OpenAiClientLayer, PersistenceLayer, ChatToolkitLayer]),
	// TODO: implement a proper error domain for our route handler
	Effect.tapErrorCause(Effect.logError),
	Effect.orDie,
)

// Convert our `HttpApp` into a standard web request handler
const handler = HttpApp.toWebHandler(App)

export const Route = createFileRoute("/api/chat")({
	server: {
		handlers: {
			POST: ({ request }) => handler(request),
		},
	},
})
