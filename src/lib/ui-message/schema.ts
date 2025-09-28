import type * as Tool from "@effect/ai/Tool"
import type * as Toolkit from "@effect/ai/Toolkit"
import * as Schema from "effect/Schema"
import { type DeepPartial, deepPartial } from "../types"

export type JSONValue = string | number | boolean | JSONObject | JSONArray

export interface JSONObject {
	[x: string]: JSONValue
}

export interface JSONArray extends Array<JSONValue> {}

export const JSONValue: Schema.Schema<JSONValue> = Schema.Union(
	Schema.String,
	Schema.Number,
	Schema.Boolean,
	Schema.mutable(Schema.Record({ key: Schema.String, value: Schema.suspend(() => JSONValue) })),
	Schema.mutable(Schema.Array(Schema.suspend(() => JSONValue))),
)

export const ProviderMetadata = Schema.Record({
	key: Schema.String,
	value: Schema.Record({
		key: Schema.String,
		value: JSONValue,
	}),
})

export type ProviderMetadata = typeof ProviderMetadata.Type
export type ProviderMetadataEncoded = typeof ProviderMetadata.Encoded

export const UIStepStartPart = Schema.Struct({
	type: Schema.Literal("step-start"),
}).annotations({ identifier: "UIStepStartPart" })

export type UIStepStartPart = typeof UIStepStartPart.Type
export type UIStepStartPartEncoded = typeof UIStepStartPart.Encoded

export const UITextPart = Schema.Struct({
	type: Schema.Literal("text"),
	text: Schema.String,
	state: Schema.optional(Schema.Literal("streaming", "done")),
	providerMetadata: Schema.optional(ProviderMetadata),
}).annotations({ identifier: "UITextPart" })

export type UITextPart = typeof UITextPart.Type
export type UITextPartEncoded = typeof UITextPart.Encoded

export const UIReasoningPart = Schema.Struct({
	type: Schema.Literal("reasoning"),
	text: Schema.String,
	state: Schema.optional(Schema.Literal("streaming", "done")),
	providerMetadata: Schema.optional(ProviderMetadata),
}).annotations({ identifier: "UIReasoningPart" })

export type UIReasoningPart = typeof UIReasoningPart.Type
export type UIReasoningPartEncoded = typeof UIReasoningPart.Encoded

export const UIFilePart = Schema.Struct({
	type: Schema.Literal("file"),
	mediaType: Schema.String,
	filename: Schema.optional(Schema.String),
	url: Schema.String,
	providerMetadata: Schema.optional(ProviderMetadata),
}).annotations({ identifier: "UIFilePart" })

export type UIFilePart = typeof UIFilePart.Type
export type UIFilePartEncoded = typeof UIFilePart.Encoded

export const UIDocumentSourcePart = Schema.Struct({
	type: Schema.Literal("source-document"),
	sourceId: Schema.String,
	mediaType: Schema.String,
	title: Schema.String,
	filename: Schema.optional(Schema.String),
	providerMetadata: Schema.optional(ProviderMetadata),
}).annotations({ identifier: "UIDocumentSourcePart" })

export type UIDocumentSourcePart = typeof UIDocumentSourcePart.Type
export type UIDocumentSourcePartEncoded = typeof UIDocumentSourcePart.Encoded

export const UIUrlSourcePart = Schema.Struct({
	type: Schema.Literal("source-url"),
	sourceId: Schema.String,
	url: Schema.String,
	title: Schema.optional(Schema.String),
	providerMetadata: Schema.optional(ProviderMetadata),
}).annotations({ identifier: "UIUrlSourcePart" })

export type UIUrlSourcePart = typeof UIUrlSourcePart.Type
export type UIUrlSourcePartEncoded = typeof UIUrlSourcePart.Encoded

export interface UIDataPart<Name extends string, Data> {
	readonly type: `data-${Name}`
	readonly id?: string
	readonly data: Data
}

type UIDataParts<Data extends Record<string, unknown>> = {
	[Name in keyof Data & string]: UIDataPart<Name, Data[Name]>
}[keyof Data & string]

export interface UIDataPartEncoded<Name extends string, DataEncoded> {
	readonly type: `data-${Name}`
	readonly id?: string
	readonly data: DataEncoded
}

type UIDataPartsEncoded<DataEncoded extends Record<string, unknown>> = {
	[Name in keyof DataEncoded & string]: UIDataPart<Name, DataEncoded[Name]>
}[keyof DataEncoded & string]

export const UIDataPart = <Name extends string, Data, DataEncoded>(
	name: Name,
	data: Schema.Schema<Data, DataEncoded>,
): Schema.Schema<UIDataPart<Name, Data>, UIDataPartEncoded<Name, DataEncoded>> =>
	Schema.Struct({
		type: Schema.TemplateLiteral(Schema.Literal("data-"), Schema.Literal(name)),
		id: Schema.optional(Schema.String),
		data,
	}).annotations({ identifier: `UIDataPart(${name})` })

export interface UIToolInputStreamingPart<Name extends string, Input> {
	readonly type: `tool-${Name}`
	readonly state: "input-streaming"
	readonly toolCallId: string
	readonly input: DeepPartial<Input> | undefined
	readonly providerExecuted?: boolean
}

export interface UIToolInputStreamingPartEncoded<Name extends string, InputEncoded> {
	readonly type: `tool-${Name}`
	readonly state: "input-streaming"
	readonly toolCallId: string
	readonly input: DeepPartial<InputEncoded> | undefined
	readonly providerExecuted?: boolean
}

export const UIToolInputStreamingPart = <T extends Tool.Any>(
	tool: T,
): Schema.Schema<
	UIToolInputStreamingPart<Tool.Name<T>, Tool.Parameters<T>>,
	UIToolInputStreamingPartEncoded<Tool.Name<T>, Tool.ParametersEncoded<T>>,
	Tool.Requirements<T>
> => {
	const input = Schema.make(deepPartial(tool.parametersSchema.ast))
	return Schema.Struct({
		type: Schema.TemplateLiteral(
			Schema.Literal("tool-"),
			Schema.Literal(tool.name as Tool.Name<T>),
		),
		state: Schema.Literal("input-streaming"),
		toolCallId: Schema.String,
		input: Schema.UndefinedOr(input) as Schema.Schema<
			DeepPartial<Tool.Parameters<T>> | undefined,
			DeepPartial<Tool.ParametersEncoded<T>> | undefined,
			Tool.Requirements<T>
		>,
		providerExecuted: Schema.optional(Schema.Boolean),
	}).annotations({ identifier: `UIToolInputStreamingPart(${tool.name})` })
}

export interface UIToolInputAvailablePart<Name extends string, Input> {
	readonly type: `tool-${Name}`
	readonly state: "input-available"
	readonly toolCallId: string
	readonly input: Input
	readonly providerExecuted?: boolean
	readonly callProviderMetadata?: ProviderMetadata
}

export interface UIToolInputAvailablePartEncoded<Name extends string, InputEncoded> {
	readonly type: `tool-${Name}`
	readonly state: "input-available"
	readonly toolCallId: string
	readonly input: InputEncoded
	readonly providerExecuted?: boolean
	readonly callProviderMetadata?: ProviderMetadata
}

export const UIToolInputAvailablePart = <T extends Tool.Any>(
	tool: T,
): Schema.Schema<
	UIToolInputAvailablePart<Tool.Name<T>, Tool.Parameters<T>>,
	UIToolInputAvailablePartEncoded<Tool.Name<T>, Tool.ParametersEncoded<T>>,
	Tool.Requirements<T>
> =>
	Schema.Struct({
		type: Schema.TemplateLiteral(
			Schema.Literal("tool-"),
			Schema.Literal(tool.name as Tool.Name<T>),
		),
		state: Schema.Literal("input-available"),
		toolCallId: Schema.String,
		input: tool.parametersSchema as Schema.Schema<
			Tool.Parameters<T>,
			Tool.ParametersEncoded<T>,
			Tool.Requirements<T>
		>,
		providerExecuted: Schema.optional(Schema.Boolean),
		callProviderMetadata: Schema.optional(ProviderMetadata),
	}).annotations({ identifier: `UIToolInputAvailablePart(${tool.name})` })

export interface UIToolOutputAvailablePart<Name extends string, Input, Output> {
	readonly type: `tool-${Name}`
	readonly state: "output-available"
	readonly toolCallId: string
	readonly input: Input
	readonly output: Output
	readonly providerExecuted?: boolean
	readonly preliminary?: boolean
	readonly callProviderMetadata?: ProviderMetadata
}

export interface UIToolOutputAvailablePartEncoded<
	Name extends string,
	InputEncoded,
	OutputEncoded,
> {
	readonly type: `tool-${Name}`
	readonly state: "output-available"
	readonly toolCallId: string
	readonly input: InputEncoded
	readonly output: OutputEncoded
	readonly providerExecuted?: boolean
	readonly preliminary?: boolean
	readonly callProviderMetadata?: ProviderMetadata
}

export const UIToolOutputAvailablePart = <T extends Tool.Any>(
	tool: T,
): Schema.Schema<
	UIToolOutputAvailablePart<Tool.Name<T>, Tool.Parameters<T>, Tool.Success<T>>,
	UIToolOutputAvailablePartEncoded<Tool.Name<T>, Tool.ParametersEncoded<T>, Tool.SuccessEncoded<T>>,
	Tool.Requirements<T>
> =>
	Schema.Struct({
		type: Schema.TemplateLiteral(
			Schema.Literal("tool-"),
			Schema.Literal(tool.name as Tool.Name<T>),
		),
		state: Schema.Literal("output-available"),
		toolCallId: Schema.String,
		input: tool.parametersSchema as Schema.Schema<
			Tool.Parameters<T>,
			Tool.ParametersEncoded<T>,
			Tool.Requirements<T>
		>,
		output: tool.successSchema as Schema.Schema<
			Tool.Success<T>,
			Tool.SuccessEncoded<T>,
			Tool.Requirements<T>
		>,
		providerExecuted: Schema.optional(Schema.Boolean),
		preliminary: Schema.optional(Schema.Boolean),
		callProviderMetadata: Schema.optional(ProviderMetadata),
	}).annotations({ identifier: `UIToolOutputAvailablePart(${tool.name})` })

export interface UIToolOutputErrorPart<Name extends string, Input> {
	readonly type: `tool-${Name}`
	readonly state: "output-error"
	readonly toolCallId: string
	readonly input: Input | undefined
	readonly rawInput?: unknown
	readonly errorText: string
	readonly providerExecuted?: boolean
	readonly callProviderMetadata?: ProviderMetadata
}

export interface UIToolOutputErrorPartEncoded<Name extends string, InputEncoded> {
	readonly type: `tool-${Name}`
	readonly state: "output-error"
	readonly toolCallId: string
	readonly input: InputEncoded | undefined
	readonly rawInput?: unknown
	readonly errorText: string
	readonly providerExecuted?: boolean
	readonly callProviderMetadata?: ProviderMetadata
}

export type UIToolParts<Tools extends Record<string, Tool.Any>> = {
	[Name in keyof Tools & string]:
		| UIToolInputStreamingPart<Tool.Name<Tools[Name]>, Tool.Parameters<Tools[Name]>>
		| UIToolInputAvailablePart<Tool.Name<Tools[Name]>, Tool.Parameters<Tools[Name]>>
		| UIToolOutputErrorPart<Tool.Name<Tools[Name]>, Tool.Parameters<Tools[Name]>>
		| UIToolOutputAvailablePart<
				Tool.Name<Tools[Name]>,
				Tool.Parameters<Tools[Name]>,
				Tool.Success<Tools[Name]>
		  >
}[keyof Tools & string]

export type UIToolPartsEncoded<Tools extends Record<string, Tool.Any>> = {
	[Name in keyof Tools & string]:
		| UIToolInputStreamingPartEncoded<Tool.Name<Tools[Name]>, Tool.ParametersEncoded<Tools[Name]>>
		| UIToolInputAvailablePartEncoded<Tool.Name<Tools[Name]>, Tool.ParametersEncoded<Tools[Name]>>
		| UIToolOutputErrorPartEncoded<Tool.Name<Tools[Name]>, Tool.ParametersEncoded<Tools[Name]>>
		| UIToolOutputAvailablePartEncoded<
				Tool.Name<Tools[Name]>,
				Tool.ParametersEncoded<Tools[Name]>,
				Tool.SuccessEncoded<Tools[Name]>
		  >
}[keyof Tools & string]

export const UIToolOutputErrorPart = <T extends Tool.Any>(
	tool: T,
): Schema.Schema<
	UIToolOutputErrorPart<Tool.Name<T>, Tool.Parameters<T>>,
	UIToolOutputErrorPartEncoded<Tool.Name<T>, Tool.ParametersEncoded<T>>
> =>
	Schema.Struct({
		type: Schema.TemplateLiteral(
			Schema.Literal("tool-"),
			Schema.Literal(tool.name as Tool.Name<T>),
		),
		state: Schema.Literal("output-error"),
		toolCallId: Schema.String,
		input: Schema.UndefinedOr(tool.parametersSchema) as Schema.Schema<
			Tool.Parameters<T> | undefined,
			Tool.ParametersEncoded<T> | undefined,
			Tool.Requirements<T>
		>,
		rawInput: Schema.optional(Schema.Unknown),
		errorText: Schema.String,
		providerExecuted: Schema.optional(Schema.Boolean),
		callProviderMetadata: Schema.optional(ProviderMetadata),
	}).annotations({ identifier: `UIToolOutputErrorPart(${tool.name})` })

export const UIDynamicToolInputStreamingPart = Schema.Struct({
	type: Schema.Literal("dynamic-tool"),
	toolName: Schema.String,
	toolCallId: Schema.String,
	state: Schema.Literal("input-streaming"),
	input: Schema.UndefinedOr(Schema.Unknown),
}).annotations({ identifier: "UIDynamicToolInputStreamingPart" })

export type UIDynamicToolInputStreamingPart = typeof UIDynamicToolInputStreamingPart.Type
export type UIDynamicToolInputStreamingPartEncoded = typeof UIDynamicToolInputStreamingPart.Encoded

export const UIDynamicToolInputAvailablePart = Schema.Struct({
	type: Schema.Literal("dynamic-tool"),
	toolName: Schema.String,
	toolCallId: Schema.String,
	state: Schema.Literal("input-available"),
	input: Schema.Unknown,
	callProviderMetadata: Schema.optional(ProviderMetadata),
}).annotations({ identifier: "UIDynamicToolInputAvailablePart" })

export type UIDynamicToolInputAvailablePart = typeof UIDynamicToolInputAvailablePart.Type
export type UIDynamicToolInputAvailablePartEncoded = typeof UIDynamicToolInputAvailablePart.Encoded

export const UIDynamicToolOutputAvailablePart = Schema.Struct({
	type: Schema.Literal("dynamic-tool"),
	toolName: Schema.String,
	toolCallId: Schema.String,
	state: Schema.Literal("output-available"),
	input: Schema.Unknown,
	output: Schema.Unknown,
	preliminary: Schema.optional(Schema.Boolean),
	callProviderMetadata: Schema.optional(ProviderMetadata),
}).annotations({ identifier: "UIDynamicToolOutputAvailablePart" })

export type UIDynamicToolOutputAvailablePart = typeof UIDynamicToolOutputAvailablePart.Type
export type UIDynamicToolOutputAvailablePartEncoded =
	typeof UIDynamicToolOutputAvailablePart.Encoded

export const UIDynamicToolOutputErrorPart = Schema.Struct({
	type: Schema.Literal("dynamic-tool"),
	toolName: Schema.String,
	toolCallId: Schema.String,
	state: Schema.Literal("output-error"),
	input: Schema.Unknown,
	errorText: Schema.String,
	callProviderMetadata: Schema.optional(ProviderMetadata),
}).annotations({ identifier: "UIDynamicToolOutputErrorPart" })

export type UIDynamicToolOutputErrorPart = typeof UIDynamicToolOutputErrorPart.Type
export type UIDynamicToolOutputErrorPartEncoded = typeof UIDynamicToolOutputErrorPart.Encoded

export type UIDynamicToolParts =
	| UIDynamicToolInputStreamingPart
	| UIDynamicToolInputAvailablePart
	| UIDynamicToolOutputAvailablePart
	| UIDynamicToolOutputErrorPart

export type UIDynamicToolPartsEncoded =
	| UIDynamicToolInputStreamingPartEncoded
	| UIDynamicToolInputAvailablePartEncoded
	| UIDynamicToolOutputAvailablePartEncoded
	| UIDynamicToolOutputErrorPartEncoded

export type UIMessagePart<
	Data extends Record<string, unknown>,
	Tools extends Record<string, Tool.Any>,
> =
	| UIStepStartPart
	| UITextPart
	| UIReasoningPart
	| UIFilePart
	| UIDocumentSourcePart
	| UIUrlSourcePart
	| UIDataParts<Data>
	| UIToolParts<Tools>
	| UIDynamicToolParts

export type UIMessagePartEncoded<
	DataEncoded extends Record<string, unknown>,
	Tools extends Record<string, Tool.Any>,
> =
	| UIStepStartPartEncoded
	| UITextPartEncoded
	| UIReasoningPartEncoded
	| UIFilePartEncoded
	| UIDocumentSourcePartEncoded
	| UIUrlSourcePartEncoded
	| UIDataPartsEncoded<DataEncoded>
	| UIToolPartsEncoded<Tools>
	| UIDynamicToolPartsEncoded

export interface UIMessage<
	Metadata,
	Data extends Record<string, unknown>,
	Tools extends Record<string, Tool.Any>,
> {
	readonly id: string
	readonly role: "system" | "user" | "assistant"
	readonly metadata?: Metadata
	readonly parts: Array<UIMessagePart<Data, Tools>>
}

export interface UIMessageEncoded<
	MetadataEncoded,
	DataEncoded extends Record<string, unknown>,
	Tools extends Record<string, Tool.Any>,
> {
	readonly id: string
	readonly role: "system" | "user" | "assistant"
	readonly metadata?: MetadataEncoded
	readonly parts: Array<UIMessagePartEncoded<DataEncoded, Tools>>
}

export const UIMessage = <
	MetadataSchema extends Schema.Schema.Any = typeof Schema.Void,
	DataFields extends Schema.Struct.Fields = {},
	Tools extends Record<string, Tool.Any> = {},
>(options?: {
	readonly metadata?: MetadataSchema | undefined
	readonly data?: DataFields | undefined
	readonly toolkit?: Toolkit.Toolkit<Tools>
}): Schema.Schema<
	UIMessage<
		Schema.Schema.Type<MetadataSchema>,
		Schema.Schema.Type<Schema.Struct<DataFields>>,
		Tools
	>,
	UIMessageEncoded<
		Schema.Schema.Encoded<MetadataSchema>,
		Schema.Schema.Encoded<Schema.Struct<DataFields>>,
		Tools
	>,
	Tool.Requirements<Tools[keyof Tools]>
> => {
	const metadata = options?.metadata ?? Schema.Void
	const data = options?.data
	const tools = options?.toolkit?.tools

	const members: Array<Schema.Schema.All> = [
		UIStepStartPart,
		UITextPart,
		UIReasoningPart,
		UIFilePart,
		UIDocumentSourcePart,
		UIUrlSourcePart,
		UIDynamicToolInputAvailablePart,
		UIDynamicToolInputStreamingPart,
		UIDynamicToolOutputAvailablePart,
		UIDynamicToolOutputErrorPart,
	]

	if (data !== undefined) {
		for (const [key, value] of Object.entries(data)) {
			members.push(UIDataPart(key, value as any))
		}
	}

	if (tools !== undefined) {
		for (const tool of Object.values(tools)) {
			members.push(UIToolInputStreamingPart(tool))
			members.push(UIToolInputAvailablePart(tool))
			members.push(UIToolOutputAvailablePart(tool))
			members.push(UIToolOutputErrorPart(tool))
		}
	}

	return Schema.Struct({
		id: Schema.String,
		role: Schema.Literal("system", "user", "assistant"),
		metadata: Schema.optional(metadata),
		parts: Schema.Array(Schema.Union(...members)),
	}) as any
}
