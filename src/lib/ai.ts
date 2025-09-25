import { type AiError, Chat, Prompt, type Response, type Tool } from "@effect/ai"
import type { JSONValue, ProviderMetadata, UIDataTypes, UIMessage, UIMessageChunk } from "ai"
import { Cause, Effect, Encoding, Option, Predicate, Ref, Stream } from "effect"
import { dual } from "effect/Function"
import type { Mutable, NoExcessProperties } from "effect/Types"

// type ToUITool<Tool extends Tool.Any> = {
// 	readonly input: Tool.Parameters<Tool>
// 	readonly output: Tool.Success<Tool> | undefined
// }
//
// type ToUITools<Tools extends Record<string, Tool.Any>> = {
// 	[Name in keyof Tools & string]: ToUITool<Tools[Name]>
// }

// TODO: metadata
export const promptFromUIMessages = (uiMessages: ReadonlyArray<UIMessage>): Prompt.Prompt => {
	const messages: Array<Prompt.Message> = []
	for (const uiMessage of uiMessages) {
		switch (uiMessage.role) {
			case "system": {
				let text = ""
				for (const part of uiMessage.parts) {
					if (part.type === "text") {
						text += part.text
					}
				}
				messages.push(
					Prompt.makeMessage("system", {
						content: text,
					}),
				)
				break
			}

			case "user": {
				const parts: Array<Prompt.UserMessagePart> = []
				for (const part of uiMessage.parts) {
					if (part.type === "text") {
						parts.push(
							Prompt.makePart("text", {
								text: part.text,
							}),
						)
					}
					if (part.type === "file") {
						parts.push(
							Prompt.makePart("file", {
								mediaType: part.mediaType,
								fileName: part.filename,
								data: part.url,
							}),
						)
					}
				}
				messages.push(
					Prompt.makeMessage("user", {
						content: parts,
					}),
				)
				break
			}

			case "assistant": {
				const parts: Array<Prompt.AssistantMessagePart> = []
				for (const part of uiMessage.parts) {
					if (part.type === "text") {
						parts.push(
							Prompt.makePart("text", {
								text: part.text,
							}),
						)
					}
					if (part.type === "file") {
						parts.push(
							Prompt.makePart("file", {
								mediaType: part.mediaType,
								fileName: part.filename,
								data: part.url,
							}),
						)
					}
					if (part.type === "reasoning") {
						parts.push(
							Prompt.makePart("reasoning", {
								text: part.text,
							}),
						)
					}
					// TODO: tool calls
					// TODO: tool results
				}
				messages.push(
					Prompt.makeMessage("assistant", {
						content: parts,
					}),
				)
				break
			}
		}
	}
	return Prompt.fromMessages(messages)
}

export type ToUIMessageStreamOptions = {
	readonly history?: Prompt.Prompt | Ref.Ref<Prompt.Prompt> | undefined
	readonly sendReasoning?: boolean | undefined
	readonly sendSources?: boolean | undefined
}

export const toUIMessageStream = dual<
	<Tools extends Record<string, Tool.Any>, Options extends ToUIMessageStreamOptions>(
		options?: NoExcessProperties<ToUIMessageStreamOptions, Options> | undefined,
	) => (
		self: Stream.Stream<Response.StreamPart<Tools>, AiError.AiError>,
	) => Stream.Stream<UIMessageChunk<unknown, UIDataTypes>, AiError.AiError>,
	<Tools extends Record<string, Tool.Any>, Options extends ToUIMessageStreamOptions>(
		self: Stream.Stream<Response.StreamPart<Tools>, AiError.AiError>,
		options?: NoExcessProperties<ToUIMessageStreamOptions, Options> | undefined,
	) => Stream.Stream<UIMessageChunk<unknown, UIDataTypes>, AiError.AiError>
>(
	(args) => Predicate.hasProperty(args, Stream.StreamTypeId),
	Effect.fnUntraced(function* (
		self,
		{ history = undefined, sendReasoning = true, sendSources = false } = {},
	) {
		let messageId: string | undefined
		if (Predicate.isNotUndefined(history)) {
			const messages = Predicate.hasProperty(history, Ref.RefTypeId)
				? (yield* Ref.get(history)).content
				: history.content
			const lastMessage = messages[messages.length - 1]
			if (Predicate.isNotUndefined(lastMessage) && lastMessage.role === "assistant") {
				messageId = lastMessage.options[Chat.Persistence.key]?.messageId as string | undefined
			}
		}
		return self.pipe(
			Stream.filterMap((part): Option.Option<UIMessageChunk> => {
				switch (part.type) {
					case "response-metadata": {
						return Option.some({
							type: "start",
							messageId,
						})
					}

					case "text-start": {
						return Option.some({
							type: "text-start",
							id: part.id,
							...withProviderMetadata(part),
						})
					}

					case "text-delta": {
						return Option.some({
							type: "text-delta",
							id: part.id,
							delta: part.delta,
							...withProviderMetadata(part),
						})
					}

					case "text-end": {
						return Option.some({
							type: "text-end",
							id: part.id,
							...withProviderMetadata(part),
						})
					}

					case "reasoning-start": {
						return Option.some({
							type: "reasoning-start",
							id: part.id,
							...withProviderMetadata(part),
						})
					}

					case "reasoning-delta": {
						if (sendReasoning) {
							return Option.some({
								type: "reasoning-delta",
								id: part.id,
								delta: part.delta,
								...withProviderMetadata(part),
							})
						}
						return Option.none()
					}

					case "reasoning-end": {
						return Option.some({
							type: "reasoning-end",
							id: part.id,
							...withProviderMetadata(part),
						})
					}

					case "tool-params-start": {
						return Option.some({
							type: "tool-input-start",
							toolCallId: part.id,
							toolName: part.providerName ?? part.name,
							providerExecuted: part.providerExecuted,
							data: { toolkitName: part.name },
							...withProviderExecuted(part),
						})
					}

					case "tool-params-delta": {
						return Option.some({
							type: "tool-input-delta",
							toolCallId: part.id,
							inputTextDelta: part.delta,
						})
					}

					case "tool-params-end": {
						return Option.none()
					}

					case "tool-call": {
						return Option.some({
							type: "tool-input-available",
							toolCallId: part.id,
							toolName: part.name,
							input: part.params,
							...withProviderExecuted(part),
							...withProviderMetadata(part),
						})
					}

					case "tool-result": {
						return Option.some({
							type: "tool-output-available",
							toolCallId: part.id,
							output: part.encodedResult,
							...withProviderExecuted(part),
						})
					}

					case "file": {
						const base64 = Encoding.encodeBase64(part.data)
						return Option.some({
							type: "file",
							mediaType: part.mediaType,
							url: `data:${part.mediaType};base64,${base64}`,
							...withProviderMetadata(part),
						})
					}

					case "source": {
						if (sendSources) {
							switch (part.sourceType) {
								case "document": {
									return Option.some({
										type: "source-document",
										sourceId: part.id,
										mediaType: part.mediaType,
										title: part.title,
										filename: part.fileName,
										...withProviderMetadata(part),
									})
								}

								case "url": {
									return Option.some({
										type: "source-url",
										sourceId: part.id,
										url: part.url.toString(),
										title: part.title,
										...withProviderMetadata(part),
									})
								}
							}
						}
						return Option.none()
					}

					case "error": {
						return Option.some({
							type: "error",
							errorText: Cause.pretty(Cause.fail(part.error)),
						})
					}

					case "finish": {
						// TODO(Max): figure out how to handle
						return Option.none()
					}
				}
			}),
		)
	}, Stream.unwrap),
)

const withProviderExecuted = (
	part:
		| Response.ToolParamsStartPart
		| Response.ToolCallPart<string, any>
		| Response.ToolResultPart<string, any>,
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
