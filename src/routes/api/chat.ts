import * as Chat from "@effect/ai/Chat"
import * as Prompt from "@effect/ai/Prompt"
import * as OpenAiClient from "@effect/ai-openai/OpenAiClient"
import * as OpenAiLanguageModel from "@effect/ai-openai/OpenAiLanguageModel"
import * as Persistence from "@effect/experimental/Persistence"
import * as FetchHttpClient from "@effect/platform/FetchHttpClient"
import * as HttpApp from "@effect/platform/HttpApp"
import * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import * as NodeContext from "@effect/platform-node/NodeContext"
import { createFileRoute } from "@tanstack/react-router"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import { DadJokeTools, DadJokeToolsLayer } from "@/lib/ai/tools/dad-joke"
import {
	createUIMessageStream,
	createUIMessageStreamResponse,
} from "@/lib/ai/ui-message/create-ui-message-stream"
import { promptFromUIMessages } from "@/lib/ai/ui-message/prompt-from-ui-messages"
import * as UIMessage from "@/lib/domain/ui-message"
import { NetlifyOrFileSystemKVS } from "@/services/kvs"

const SYSTEM_PROMPT = `You are a chatbot who always speaks as a stereotypical 
dad, full of groan-inducing puns, cheesy one-liners, and dorky humor. Your 
mission is to make the user roll their eyes and groan, but secretly smile.

**Core Rules:**

* Always respond in the tone of a corny dad who thinks they are way funnier than they actually are.
* Where appropriate, weave in a dad joke, pun, or silly quip—even if it’s unrelated to the topic.
* Keep your delivery wholesome, friendly, and slightly embarrassing, like a dad trying to be “cool.”
* If the user asks a serious question, you should still *attempt* to answer it, but slip in a pun or dad joke along the way.
* Occasionally call out your own jokes with phrases like “Eh? Get it?” or “I’ll see myself out…”
* Never break character: you are always the dorky dad.

**Examples of style:**

* User: “What’s the weather like?”
  You: “Well, it’s partly cloudy… but I’d say it’s 100% punny with a chance of dad jokes. Better wear your *son*-screen. Eh? Get it?”

* User: “Can you help me with programming?”
  You: “Of course, kiddo! But remember, 90% of coding is figuring out why your semicolon walked out on you… it just couldn’t *commit*.”

* User: “Tell me a joke.”
  You: “Sure thing! Why don’t skeletons ever fight each other? … Because they don’t have the guts. Classic.”`

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
})

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
)

// Merge together all the layers that our program needs
const MainLayer = Layer.mergeAll(OpenAiClientLayer, PersistenceLayer, DadJokeToolsLayer).pipe(
	// Accessing the OpenAI API and the DadJokes API both require an HTTP client
	// to be available. Given this Netlify function has access to fetch, we can
	// provide the `HttpClient` implementation that uses fetch to our program.
	Layer.provide(FetchHttpClient.layer),
	// Given that we use a filesystem-backed key / value store in development, we
	// must provide an implementation of a filesystem. Since we will be running in
	// a NodeJS environment, we provide an implementation of a file system that is
	// backed by the NodeJS `fs` module via the `NodeContext` module.
	Layer.provide(NodeContext.layer),
)

// Create a schema for the type of `UIMessage`s that the chat endpoint expects.
const ChatUIMessage = UIMessage.make({
	toolkit: DadJokeTools,
	data: {
		notification: Schema.Struct({
			message: Schema.String,
			level: Schema.Literal("info"),
		}),
		weather: Schema.Union(
			Schema.Struct({
				city: Schema.String,
				status: Schema.Literal("loading"),
			}),
			Schema.Struct({
				city: Schema.String,
				weather: Schema.String,
				status: Schema.Literal("success"),
			}),
		),
	},
})

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
const App = Effect.gen(function* () {
	// Extract the chat persistence service from the Effect environment
	const persistence = yield* Chat.Persistence

	// Parse the incoming request from the client. The request is injected
	// into the Effect environment from the route handler so we do not need to
	// pass it around explicitly.
	const {
		id: chatId,
		message,
		selectedChatModel,
	} = yield* HttpServerRequest.schemaBodyJson(
		Schema.Struct({
			id: Schema.String,
			message: ChatUIMessage,
			selectedChatModel: Schema.String,
		}),
	)

	// Setup the OpenAI language model to use for the request to the model
	// TODO: Make the model type-safe
	const model = yield* OpenAiLanguageModel.model(selectedChatModel)

	// Get or create a new persistence store for the requested chat
	const chat = yield* persistence.getOrCreate(chatId)

	// Get the previous messages exchanged during the conversation
	const history = yield* chat.history

	// Construct a prompt from the user message sent by the client
	let prompt = promptFromUIMessages([message])

	// If this is the first message in the chat, set the system prompt
	if (history.content.length === 0) {
		// NOTE: Is there a TS lint for discardin a value?
		prompt = Prompt.setSystem(prompt, SYSTEM_PROMPT)
	}

	// Create a stream of UI messages to send back to the client
	const stream = yield* createUIMessageStream(ChatUIMessage, {
		history,
		execute: Effect.fnUntraced(function* ({ mailbox, mergeStream }) {
			yield* mailbox.offer({
				type: "data-notification",
				data: { level: "info", message: "hi" },
			})

			// Restrict to a maximum of five consecutive turns
			let turn = 0
			// Get the initial response from the language model
			let response = yield* mergeStream(
				chat.streamText({
					prompt,
					toolkit: DadJokeTools,
				}),
			)
			while (response.finishReason === "tool-calls" && turn < 5) {
				response = yield* mergeStream(
					chat.streamText({
						prompt: [],
						toolkit: DadJokeTools,
					}),
				)
				turn++
			}
		}),
	}).pipe(Effect.provide(model))

	// Convert the stream into a response stream
	return createUIMessageStreamResponse(ChatUIMessage, {
		stream,
	})
}).pipe(
	// TODO: implement a proper error domain for our route handler
	Effect.tapErrorCause(Effect.logError),
	Effect.orDie,
)

// Convert our `HttpApp` into a standard web request handler
const { handler } = HttpApp.toWebHandlerLayer(App, MainLayer)

export const Route = createFileRoute("/api/chat")({
	server: {
		handlers: {
			POST: ({ request }) => handler(request),
		},
	},
})
