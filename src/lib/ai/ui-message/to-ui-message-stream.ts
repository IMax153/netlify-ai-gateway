import type * as AiError from "@effect/ai/AiError"
import * as Chat from "@effect/ai/Chat"
import type * as Prompt from "@effect/ai/Prompt"
import type * as Response from "@effect/ai/Response"
import type * as Tool from "@effect/ai/Tool"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Encoding from "effect/Encoding"
import { dual } from "effect/Function"
import * as Predicate from "effect/Predicate"
import * as Ref from "effect/Ref"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import type { Mutable, NoExcessProperties } from "effect/Types"
import type { JSONValue } from "@/lib/domain/json-value"
import type { ProviderMetadata } from "@/lib/domain/provider-metadata"
import type * as UIMessage from "@/lib/domain/ui-message"
import * as UIMessageChunk from "@/lib/domain/ui-message-chunk"

export type ToUIMessageStreamOptions = {
	readonly history?: Prompt.Prompt | Ref.Ref<Prompt.Prompt> | undefined
	readonly sendReasoning?: boolean | undefined
	readonly sendSources?: boolean | undefined
}

export const toUIMessageStream: {
	<Message extends UIMessage.Any, Options extends ToUIMessageStreamOptions>(
		message: Message,
		options?: NoExcessProperties<ToUIMessageStreamOptions, Options> | undefined,
	): (
		self: Stream.Stream<Response.StreamPart<UIMessage.Tools<Message>>, AiError.AiError>,
	) => Stream.Stream<UIMessageChunk.FromUIMessage<Message>["Encoded"], AiError.AiError>
	<Message extends UIMessage.Any, Options extends ToUIMessageStreamOptions>(
		self: Stream.Stream<Response.StreamPart<UIMessage.Tools<Message>>, AiError.AiError>,
		message: Message,
		options?: NoExcessProperties<ToUIMessageStreamOptions, Options> | undefined,
	): Stream.Stream<UIMessageChunk.FromUIMessage<Message>["Encoded"], AiError.AiError>
} = dual(
	(args) => Predicate.hasProperty(args[0], Stream.StreamTypeId),
	Effect.fnUntraced(function* <Message extends UIMessage.Any>(
		self: Stream.Stream<Response.StreamPart<UIMessage.Tools<Message>>, AiError.AiError>,
		message: Message,
		{
			history = undefined,
			sendReasoning = true,
			sendSources = false,
		}: ToUIMessageStreamOptions = {},
	) {
		// If a message history was provided, attempt to retrieve the message
		// persistence identifier
		const messageId = Predicate.isNotUndefined(history) ? yield* getMessageId(history) : undefined

		// Create the schema for the UI message chunks
		const ChunkSchema = UIMessageChunk.fromUIMessage(message)

		const toUIMessageChunk = (
			part: Response.StreamPart<UIMessage.Tools<Message>>,
		): ReadonlyArray<(typeof ChunkSchema)["Type"]> => {
			switch (part.type) {
				case "response-metadata": {
					return [
						{
							type: "start",
							...withMessageId(messageId),
						},
						{ type: "start-step" },
					]
				}

				case "text-start": {
					return [
						{
							type: "text-start",
							id: part.id,
							...withProviderMetadata(part),
						},
					]
				}

				case "text-delta": {
					return [
						{
							type: "text-delta",
							id: part.id,
							delta: part.delta,
							...withProviderMetadata(part),
						},
					]
				}

				case "text-end": {
					return [
						{
							type: "text-end",
							id: part.id,
							...withProviderMetadata(part),
						},
					]
				}

				case "reasoning-start": {
					return [
						{
							type: "reasoning-start",
							id: part.id,
							...withProviderMetadata(part),
						},
					]
				}

				case "reasoning-delta": {
					if (sendReasoning) {
						return [
							{
								type: "reasoning-delta",
								id: part.id,
								delta: part.delta,
								...withProviderMetadata(part),
							},
						]
					}
					return []
				}

				case "reasoning-end": {
					return [
						{
							type: "reasoning-end",
							id: part.id,
							...withProviderMetadata(part),
						},
					]
				}

				case "tool-params-start": {
					return [
						{
							type: "tool-input-start",
							toolCallId: part.id,
							toolName: part.providerName ?? part.name,
							providerExecuted: part.providerExecuted,
							...withProviderExecuted(part),
						},
					]
				}

				case "tool-params-delta": {
					return [
						{
							type: "tool-input-delta",
							toolCallId: part.id,
							inputTextDelta: part.delta,
						},
					]
				}

				case "tool-params-end": {
					return []
				}

				case "tool-call": {
					// Casting to any is required here because dynamically created
					// message parts cannot infer properly over generic data parts
					return [
						{
							type: "tool-input-available",
							toolCallId: part.id,
							toolName: part.name,
							input: part.params,
							...withProviderExecuted(part),
							...withProviderMetadata(part),
						} as any,
					]
				}

				case "tool-result": {
					// Casting to any is required here because dynamically created
					// message parts cannot infer properly over generic data parts
					return [
						{
							type: "tool-output-available",
							toolCallId: part.id,
							output: part.encodedResult,
							...withProviderExecuted(part),
						} as any,
					]
				}

				case "file": {
					const base64 = Encoding.encodeBase64(part.data)
					return [
						{
							type: "file",
							mediaType: part.mediaType,
							url: `data:${part.mediaType};base64,${base64}`,
							...withProviderMetadata(part),
						},
					]
				}

				case "source": {
					if (sendSources) {
						switch (part.sourceType) {
							case "document": {
								return [
									{
										type: "source-document",
										sourceId: part.id,
										mediaType: part.mediaType,
										title: part.title,
										...(part.fileName ? { filename: part.fileName } : {}),
										...withProviderMetadata(part),
									},
								]
							}

							case "url": {
								return [
									{
										type: "source-url",
										sourceId: part.id,
										url: part.url.toString(),
										title: part.title,
										...withProviderMetadata(part),
									},
								]
							}
						}
					}
					return []
				}

				case "error": {
					return [
						{
							type: "error",
							errorText: Cause.pretty(Cause.fail(part.error)),
						},
					]
				}

				case "finish": {
					// TODO(Max): figure out how to handle response metadata
					return [{ type: "finish-step" }, { type: "finish" }]
				}

				default: {
					return []
				}
			}
		}

		return self.pipe(
			Stream.mapConcat(toUIMessageChunk),
			Stream.mapEffect(Schema.encode(ChunkSchema)),
		)
	}, Stream.unwrap),
)

const getMessageId = Effect.fnUntraced(function* (history: Prompt.Prompt | Ref.Ref<Prompt.Prompt>) {
	// Retrieve the previously sent messages from the history
	const messages = Predicate.hasProperty(history, Ref.RefTypeId)
		? (yield* Ref.get(history)).content
		: history.content
	// Determine the most recent message exchanged
	const lastMessage = messages[messages.length - 1]
	// If the most recent message was an assistant message, try to extract the
	// message persistence identifier
	if (Predicate.isNotUndefined(lastMessage) && lastMessage.role === "assistant") {
		return lastMessage.options[Chat.Persistence.key]?.messageId as string | undefined
	}
	return undefined
})

const withMessageId = (messageId: string | undefined) =>
	Predicate.isNotUndefined(messageId) ? { messageId } : {}

const withProviderExecuted = (
	part:
		| Response.ToolParamsStartPart
		| Response.ToolCallPart<string, any>
		| Response.ToolResultPart<string, any, any>,
): { readonly providerExecuted: boolean } | undefined =>
	Predicate.isNotUndefined(part.providerExecuted)
		? { providerExecuted: part.providerExecuted }
		: undefined

const withProviderMetadata = <Tools extends Record<string, Tool.Any>>(
	part: Response.StreamPart<Tools>,
): { readonly providerMetadata: ProviderMetadata } | undefined => {
	const entries = Object.entries(part.metadata)
	if (entries.length > 0) {
		const metadata: Mutable<ProviderMetadata> = {}
		for (const [key, value] of entries) {
			if (Predicate.isNotUndefined(value)) {
				metadata[key] = value as Record<string, JSONValue>
			}
		}
		return { providerMetadata: metadata }
	}
	return undefined
}
