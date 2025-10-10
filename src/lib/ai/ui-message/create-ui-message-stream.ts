import type * as AiError from "@effect/ai/AiError"
import * as LanguageModel from "@effect/ai/LanguageModel"
import type * as Prompt from "@effect/ai/Prompt"
import * as Response from "@effect/ai/Response"
import type * as Tool from "@effect/ai/Tool"
import * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import * as Effect from "effect/Effect"
import * as Mailbox from "effect/Mailbox"
import type * as ParseResult from "effect/ParseResult"
import * as Predicate from "effect/Predicate"
import type * as Ref from "effect/Ref"
import * as Schema from "effect/Schema"
import type * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import { toUIMessageStream } from "@/lib/ai/ui-message/to-ui-message-stream"
import type * as UIMessage from "@/lib/domain/ui-message"
import * as UIMessageChunk from "@/lib/domain/ui-message-chunk"
import { toServerSentEventStream } from "@/lib/sse"

export const createUIMessageStream: <Message extends UIMessage.Any, E, R>(
	schema: Message,
	options: {
		readonly history?: Prompt.Prompt | Ref.Ref<Prompt.Prompt>
		readonly execute: (context: {
			readonly mailbox: Mailbox.Mailbox<UIMessageChunk.FromUIMessage<Message>["Encoded"]>
			readonly mergeStream: <E2, R2>(
				stream: Stream.Stream<Response.StreamPart<UIMessage.Tools<Message>>, E2, R2>,
			) => Effect.Effect<
				LanguageModel.GenerateTextResponse<UIMessage.Tools<Message>>,
				E2 | AiError.AiError,
				R2
			>
		}) => Effect.Effect<void, E, R>
	},
) => Effect.Effect<
	Stream.Stream<
		UIMessageChunk.FromUIMessage<Message>["Encoded"],
		AiError.AiError | ParseResult.ParseError
	>,
	E,
	R | Scope.Scope | Tool.Requirements<UIMessage.Tools<Message>[keyof UIMessage.Tools<Message>]>
> = Effect.fnUntraced(function* <Message extends UIMessage.Any, E, R>(
	message: Message,
	options: {
		readonly history?: Prompt.Prompt | Ref.Ref<Prompt.Prompt>
		readonly execute: (context: {
			readonly mailbox: Mailbox.Mailbox<UIMessageChunk.FromUIMessage<Message>["Encoded"]>
			readonly mergeStream: <E2, R2>(
				stream: Stream.Stream<Response.StreamPart<UIMessage.Tools<Message>>, E2, R2>,
			) => Effect.Effect<
				LanguageModel.GenerateTextResponse<UIMessage.Tools<Message>>,
				E2 | AiError.AiError,
				R2
			>
		}) => Effect.Effect<void, E, R>
	},
) {
	const mailbox = yield* Mailbox.make<UIMessageChunk.FromUIMessage<Message>["Encoded"]>()

	const mergeStream = Effect.fnUntraced(function* <E2, R2>(
		stream: Stream.Stream<Response.StreamPart<UIMessage.Tools<Message>>, E2 | AiError.AiError, R2>,
	) {
		const content: Array<Response.Part<UIMessage.Tools<Message>>> = []

		const activeTextParts: Record<string, { text: string }> = {}
		const activeReasoningParts: Record<string, { text: string }> = {}

		const handleStreamPart = (part: Response.StreamPart<UIMessage.Tools<Message>>) => {
			switch (part.type) {
				case "response-metadata": {
					const responseMetadata = Response.makePart("response-metadata", {
						id: part.id,
						modelId: part.modelId,
						timestamp: part.timestamp,
					})
					content.push(responseMetadata)
					break
				}
				case "text-start": {
					activeTextParts[part.id] = { text: "" }
					break
				}
				case "text-delta": {
					const activeTextPart = activeTextParts[part.id]
					if (Predicate.isNotUndefined(activeTextPart)) {
						activeTextPart.text += part.delta
					}
					break
				}
				case "text-end": {
					const activeTextPart = activeTextParts[part.id]
					if (Predicate.isNotUndefined(activeTextPart)) {
						const reasoning = Response.makePart("text", {
							text: activeTextPart.text,
						})
						content.push(reasoning)
						delete activeTextParts[part.id]
					}
					break
				}
				case "reasoning-start": {
					activeReasoningParts[part.id] = { text: "" }
					break
				}
				case "reasoning-delta": {
					const activeReasoningPart = activeReasoningParts[part.id]
					if (Predicate.isNotUndefined(activeReasoningPart)) {
						activeReasoningPart.text += part.delta
					}
					break
				}
				case "reasoning-end": {
					const activeReasoningPart = activeReasoningParts[part.id]
					if (Predicate.isNotUndefined(activeReasoningPart)) {
						const reasoning = Response.makePart("reasoning", {
							text: activeReasoningPart.text,
						})
						content.push(reasoning)
						delete activeReasoningParts[part.id]
					}
					break
				}
				case "file": {
					const file = Response.makePart("file", {
						mediaType: part.mediaType,
						data: part.data,
					})
					content.push(file)
					break
				}
				case "tool-call": {
					const toolCall = Response.makePart("tool-call", {
						id: part.id,
						name: part.name,
						params: part.params,
						providerExecuted: part.providerExecuted,
						...(Predicate.isNotUndefined(part.providerName)
							? { providerName: part.providerName }
							: {}),
					})
					content.push(toolCall as any)
					break
				}
				case "tool-result": {
					const toolResult = Response.makePart("tool-result", {
						id: part.id,
						name: part.name,
						isFailure: part.isFailure,
						result: part.result,
						encodedResult: part.encodedResult,
						providerExecuted: part.providerExecuted,
						...(Predicate.isNotUndefined(part.providerName)
							? { providerName: part.providerName }
							: {}),
					})
					content.push(toolResult as any)
					break
				}
				case "source": {
					if (part.sourceType === "document") {
						const source = Response.documentSourcePart({
							id: part.id,
							title: part.title,
							mediaType: part.mediaType,
							...(Predicate.isNotUndefined(part.fileName) ? { fileName: part.fileName } : {}),
						})
						content.push(source)
					}
					if (part.sourceType === "url") {
						const source = Response.urlSourcePart({
							id: part.id,
							url: part.url,
							title: part.title,
						})
						content.push(source)
					}
					break
				}
				case "finish": {
					const finish = Response.makePart("finish", {
						reason: part.reason,
						usage: part.usage,
					})
					content.push(finish)
					break
				}
			}
		}

		return yield* stream.pipe(
			Stream.tap((part) => Effect.sync(() => handleStreamPart(part))),
			toUIMessageStream(message, { history: options.history }),
			Stream.runForEach((part) => mailbox.offer(part)),
			Effect.map(() => new LanguageModel.GenerateTextResponse(content)),
		)
	})

	yield* options.execute({ mailbox, mergeStream }).pipe(
		Effect.onExit(() => mailbox.end),
		Effect.forkScoped,
	)

	return Mailbox.toStream(mailbox)
})

export const createUIMessageStreamResponse = <Message extends UIMessage.Any>(
	message: Message,
	options: HttpServerResponse.Options & {
		readonly stream: Stream.Stream<
			UIMessageChunk.FromUIMessage<Message>["Encoded"],
			AiError.AiError | ParseResult.ParseError
		>
	},
) => {
	const ChunkSchema = Schema.encodedSchema(UIMessageChunk.make(message))
	const eventStream = toServerSentEventStream(options.stream, ChunkSchema)
	return HttpServerResponse.stream(eventStream, {
		contentType: "text/event-stream",
		...options,
	})
}
