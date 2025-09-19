import type { AiError, Response, Tool } from "@effect/ai"
import type {
	JSONValue,
	ProviderMetadata,
	UIDataTypes,
	UIMessageChunk,
} from "ai"
import { Cause, Encoding, Option, Predicate, type Schema, Stream } from "effect"
import type { Mutable } from "effect/Types"

type ToUITool<Tool extends Tool.Any> = {
	readonly input: Tool.Parameters<Tool>
	readonly output: Tool.Success<Tool> | undefined
}

// type ToUITools<Tools extends Record<string, Tool.Any>> = {
// 	[Name in keyof Tools & string]: ToUITool<Tools[Name]>
// }

export const toUIMessageStream = <Tools extends Record<string, Tool.Any>>(
	self: Stream.Stream<Response.StreamPart<Tools>, AiError.AiError>,
	options: {
		readonly sendSources?: boolean
	},
): Stream.Stream<UIMessageChunk<unknown, UIDataTypes>, AiError.AiError> =>
	self.pipe(
		Stream.filterMap((part) => {
			switch (part.type) {
				case "response-metadata": {
					// TODO(Max): figure out how to handle
					return Option.none()
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
					return Option.some({
						type: "reasoning-delta",
						id: part.id,
						delta: part.delta,
						...withProviderMetadata(part),
					})
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
						...withProviderMetadata(part),
					})
				}

				case "tool-params-delta": {
					return Option.some({
						type: "tool-input-delta",
						toolCallId: part.id,
						inputTextDelta: part.delta,
						...withProviderMetadata(part),
					})
				}

				case "tool-params-end": {
					return Option.none()
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
					if (Predicate.isNotUndefined(options.sendSources)) {
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

				case "tool-call": {
					// TODO(Max): figure out how to handle
					return Option.none()
				}

				case "tool-result": {
					return Option.some({
						type: "tool-output-available",
						toolCallId: part.id,
						output: part.encodedResult,
						...withProviderExecuted(part),
						...withProviderMetadata(part),
					})
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

const withProviderExecuted = <
	const Name extends string,
	Result extends Schema.Schema.Any,
>(
	part: Response.ToolResultPart<Name, Result>,
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
