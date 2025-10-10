import type * as AiError from "@effect/ai/AiError"
import type * as Prompt from "@effect/ai/Prompt"
import type * as Response from "@effect/ai/Response"
import type * as Tool from "@effect/ai/Tool"
import * as Effect from "effect/Effect"
import * as Mailbox from "effect/Mailbox"
import type * as ParseResult from "effect/ParseResult"
import type * as Ref from "effect/Ref"
import type * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import { toUIMessageStream } from "@/lib/ai/ui-message/to-ui-message-stream"
import type * as UIMessage from "@/lib/domain/ui-message"
import type * as UIMessageChunk from "@/lib/domain/ui-message-chunk"

export const createUIMessageStream: <Message extends UIMessage.Any, E, R>(
	schema: Message,
	options: {
		readonly history?: Prompt.Prompt | Ref.Ref<Prompt.Prompt>
		readonly execute: (context: {
			readonly mailbox: Mailbox.Mailbox<UIMessageChunk.FromUIMessage<Message>["Encoded"]>
			readonly mergeStream: <E2, R2>(
				stream: Stream.Stream<Response.StreamPart<UIMessage.Tools<Message>>, E2, R2>,
			) => Effect.Effect<void, E2 | AiError.AiError, R2>
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
			) => Effect.Effect<void, E2 | AiError.AiError, R2>
		}) => Effect.Effect<void, E, R>
	},
) {
	const mailbox = yield* Mailbox.make<UIMessageChunk.FromUIMessage<Message>["Encoded"]>()

	const mergeStream = <E2, R2>(
		stream: Stream.Stream<Response.StreamPart<UIMessage.Tools<Message>>, E2 | AiError.AiError, R2>,
	): Effect.Effect<void, E2 | AiError.AiError, R2> =>
		stream.pipe(
			toUIMessageStream(message, { history: options.history }),
			Stream.runForEach((part) => mailbox.offer(part)),
		)

	yield* Effect.forkScoped(options.execute({ mailbox, mergeStream }))

	return Mailbox.toStream(mailbox)
})
