import type * as Tool from "@effect/ai/Tool"
import type * as Toolkit from "@effect/ai/Toolkit"
import * as Schema from "effect/Schema"
import { ProviderMetadata } from "./provider-metadata"
import type * as UIMessage from "./ui-message"

export const UIStartStepPart = Schema.Struct({
	type: Schema.Literal("start-step"),
}).annotations({ identifier: "UIStartStepPart" })

export type UIStartStepPart = typeof UIStartStepPart.Type
export type UIStartStepPartEncoded = typeof UIStartStepPart.Encoded

export const UIFinishStepPart = Schema.Struct({
	type: Schema.Literal("finish-step"),
}).annotations({ identifier: "UIFinishStepPart" })

export type UIFinishStepPart = typeof UIFinishStepPart.Type
export type UIFinishStepPartEncoded = typeof UIFinishStepPart.Encoded

export interface UIStartPart<Metadata> {
	readonly type: "start"
	readonly messageId?: string
	readonly messageMetadata?: Metadata
}

export interface UIStartPartEncoded<MetadataEncoded> {
	readonly type: "start"
	readonly messageId?: string
	readonly messageMetadata?: MetadataEncoded
}

export const UIStartPart = <Metadata, MetadataEncoded>(
	messageMetadata: Schema.Schema<Metadata, MetadataEncoded>,
): Schema.Schema<UIStartPart<Metadata>, UIStartPartEncoded<MetadataEncoded>> =>
	Schema.Struct({
		type: Schema.Literal("start"),
		messageId: Schema.optionalWith(Schema.String, { exact: true }),
		messageMetadata: Schema.optionalWith(messageMetadata, { exact: true }),
	}).annotations({ identifier: "UIStartPart" })

export interface UIFinishPart<Metadata> {
	readonly type: "finish"
	readonly messageMetadata?: Metadata
}

export interface UIFinishPartEncoded<MetadataEncoded> {
	readonly type: "finish"
	readonly messageMetadata?: MetadataEncoded
}

export const UIFinishPart = <Metadata, MetadataEncoded>(
	messageMetadata: Schema.Schema<Metadata, MetadataEncoded>,
): Schema.Schema<UIFinishPart<Metadata>, UIFinishPartEncoded<MetadataEncoded>> =>
	Schema.Struct({
		type: Schema.Literal("finish"),
		messageMetadata: Schema.optionalWith(messageMetadata, { exact: true }),
	}).annotations({ identifier: "UIFinishPart" })

export const UIAbortPart = Schema.Struct({
	type: Schema.Literal("abort"),
}).annotations({ identifier: "UIAbortPart" })

export type UIAbortPart = typeof UIAbortPart.Type
export type UIAbortPartEncoded = typeof UIAbortPart.Encoded

export const UITextStartPart = Schema.Struct({
	type: Schema.Literal("text-start"),
	id: Schema.String,
	providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
}).annotations({ identifier: "UITextStartPart" })

export type UITextStartPart = typeof UITextStartPart.Type
export type UITextStartPartEncoded = typeof UITextStartPart.Encoded

export const UITextDeltaPart = Schema.Struct({
	type: Schema.Literal("text-delta"),
	id: Schema.String,
	delta: Schema.String,
	providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
}).annotations({ identifier: "UITextDeltaPart" })

export type UITextDeltaPart = typeof UITextDeltaPart.Type
export type UITextDeltaPartEncoded = typeof UITextDeltaPart.Encoded

export const UITextEndPart = Schema.Struct({
	type: Schema.Literal("text-end"),
	id: Schema.String,
	providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
}).annotations({ identifier: "UITextEndPart" })

export type UITextEndPart = typeof UITextEndPart.Type
export type UITextEndPartEncoded = typeof UITextEndPart.Encoded

export const UIReasoningStartPart = Schema.Struct({
	type: Schema.Literal("reasoning-start"),
	id: Schema.String,
	providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
}).annotations({ identifier: "UIReasoningStartPart" })

export type UIReasoningStartPart = typeof UIReasoningStartPart.Type
export type UIReasoningStartPartEncoded = typeof UIReasoningStartPart.Encoded

export const UIReasoningDeltaPart = Schema.Struct({
	type: Schema.Literal("reasoning-delta"),
	id: Schema.String,
	delta: Schema.String,
	providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
}).annotations({ identifier: "UIReasoningDeltaPart" })

export type UIReasoningDeltaPart = typeof UIReasoningDeltaPart.Type
export type UIReasoningDeltaPartEncoded = typeof UIReasoningDeltaPart.Encoded

export const UIReasoningEndPart = Schema.Struct({
	type: Schema.Literal("reasoning-end"),
	id: Schema.String,
	providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
}).annotations({ identifier: "UIReasoningEndPart" })

export type UIReasoningEndPart = typeof UIReasoningEndPart.Type
export type UIReasoningEndPartEncoded = typeof UIReasoningEndPart.Encoded

export const UIToolInputStartPart = Schema.Struct({
	type: Schema.Literal("tool-input-start"),
	toolCallId: Schema.String,
	toolName: Schema.String,
	dynamic: Schema.optionalWith(Schema.Boolean, { exact: true }),
	providerExecuted: Schema.optionalWith(Schema.Boolean, { exact: true }),
}).annotations({ identifier: "UIToolInputStartPart" })

export type UIToolInputStartPart = typeof UIToolInputStartPart.Type
export type UIToolInputStartPartEncoded = typeof UIToolInputStartPart.Encoded

export const UIToolInputDeltaPart = Schema.Struct({
	type: Schema.Literal("tool-input-delta"),
	toolCallId: Schema.String,
	inputTextDelta: Schema.String,
}).annotations({ identifier: "UIToolInputDeltaPart" })

export type UIToolInputDeltaPart = typeof UIToolInputDeltaPart.Type
export type UIToolInputDeltaPartEncoded = typeof UIToolInputDeltaPart.Encoded

export interface UIToolInputAvailablePart<Name extends string, Input> {
	readonly type: "tool-input-available"
	readonly toolCallId: string
	readonly toolName: Name
	readonly input: Input
	readonly providerExecuted?: boolean
	readonly providerMetadata?: ProviderMetadata
	readonly dynamic?: boolean
}

export interface UIToolInputAvailablePartEncoded<Name extends string, InputEncoded> {
	readonly type: "tool-input-available"
	readonly toolCallId: string
	readonly toolName: Name
	readonly input: InputEncoded
	readonly providerExecuted?: boolean
	readonly providerMetadata?: ProviderMetadata
	readonly dynamic?: boolean
}

export const UIToolInputAvailablePart = <T extends Tool.Any>(
	tool: T,
): Schema.Schema<
	UIToolInputAvailablePart<Tool.Name<T>, Tool.Parameters<T>>,
	UIToolInputAvailablePart<Tool.Name<T>, Tool.ParametersEncoded<T>>,
	Tool.Requirements<T>
> =>
	Schema.Struct({
		type: Schema.Literal("tool-input-available"),
		toolCallId: Schema.String,
		toolName: Schema.Literal(tool.name as Tool.Name<T>),
		input: tool.parametersSchema as Schema.Schema<
			Tool.Parameters<T>,
			Tool.ParametersEncoded<T>,
			Tool.Requirements<T>
		>,
		providerExecuted: Schema.optionalWith(Schema.Boolean, { exact: true }),
		providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
		dynamic: Schema.optionalWith(Schema.Boolean, { exact: true }),
	}).annotations({ identifier: `UIToolInputAvailablePart(${tool.name})` })

export interface UIToolInputErrorPart<Name extends string, Input> {
	readonly type: "tool-input-error"
	readonly toolCallId: string
	readonly toolName: Name
	readonly input: Input
	readonly errorText: string
	readonly providerExecuted?: boolean
	readonly providerMetadata?: ProviderMetadata
	readonly dynamic?: boolean
}

export interface UIToolInputErrorPartEncoded<Name extends string, InputEncoded> {
	readonly type: "tool-input-error"
	readonly toolCallId: string
	readonly toolName: Name
	readonly input: InputEncoded
	readonly errorText: string
	readonly providerExecuted?: boolean
	readonly providerMetadata?: ProviderMetadata
	readonly dynamic?: boolean
}

export const UIToolInputErrorPart = <T extends Tool.Any>(
	tool: T,
): Schema.Schema<
	UIToolInputErrorPart<Tool.Name<T>, Tool.Parameters<T>>,
	UIToolInputErrorPart<Tool.Name<T>, Tool.ParametersEncoded<T>>,
	Tool.Requirements<T>
> =>
	Schema.Struct({
		type: Schema.Literal("tool-input-error"),
		toolCallId: Schema.String,
		toolName: Schema.Literal(tool.name as Tool.Name<T>),
		input: tool.parametersSchema as Schema.Schema<
			Tool.Parameters<T>,
			Tool.ParametersEncoded<T>,
			Tool.Requirements<T>
		>,
		errorText: Schema.String,
		providerExecuted: Schema.optionalWith(Schema.Boolean, { exact: true }),
		providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
		dynamic: Schema.optionalWith(Schema.Boolean, { exact: true }),
	}).annotations({ identifier: `UIToolInputErrorPart(${tool.name})` })

export interface UIToolOutputAvailablePart<Output> {
	readonly type: "tool-output-available"
	readonly toolCallId: string
	readonly output: Output
	readonly providerExecuted?: boolean
	readonly preliminary?: boolean
	readonly dynamic?: boolean
}

export interface UIToolOutputAvailablePartEncoded<OutputEncoded> {
	readonly type: "tool-output-available"
	readonly toolCallId: string
	readonly output: OutputEncoded
	readonly providerExecuted?: boolean
	readonly preliminary?: boolean
	readonly dynamic?: boolean
}

export const UIToolOutputAvailablePart = <T extends Tool.Any>(
	tool: T,
): Schema.Schema<
	UIToolOutputAvailablePart<Tool.Success<T>>,
	UIToolOutputAvailablePart<Tool.SuccessEncoded<T>>,
	Tool.Requirements<T>
> =>
	Schema.Struct({
		type: Schema.Literal("tool-output-available"),
		toolCallId: Schema.String,
		output: tool.successSchema as Schema.Schema<
			Tool.Success<T>,
			Tool.SuccessEncoded<T>,
			Tool.Requirements<T>
		>,
		providerExecuted: Schema.optionalWith(Schema.Boolean, { exact: true }),
		preliminary: Schema.optionalWith(Schema.Boolean, { exact: true }),
		dynamic: Schema.optionalWith(Schema.Boolean, { exact: true }),
	}).annotations({ identifier: `UIToolOutputAvailablePart(${tool.name})` })

export type UIToolParts<Tools extends Record<string, Tool.Any>> = {
	[Name in keyof Tools]: Name extends string
		?
				| UIToolInputAvailablePart<Tool.Name<Tools[Name]>, Tool.Parameters<Tools[Name]>>
				| UIToolInputErrorPart<Tool.Name<Tools[Name]>, Tool.Parameters<Tools[Name]>>
				| UIToolOutputAvailablePart<Tool.Success<Tools[Name]>>
		: never
}[keyof Tools]

export type UIToolPartsEncoded<Tools extends Record<string, Tool.Any>> = {
	[Name in keyof Tools]: Name extends string
		?
				| UIToolInputAvailablePartEncoded<
						Tool.Name<Tools[Name]>,
						Tool.ParametersEncoded<Tools[Name]>
				  >
				| UIToolInputErrorPartEncoded<Tool.Name<Tools[Name]>, Tool.ParametersEncoded<Tools[Name]>>
				| UIToolOutputAvailablePartEncoded<Tool.SuccessEncoded<Tools[Name]>>
		: never
}[keyof Tools]

export const UIToolOutputErrorPart = Schema.Struct({
	type: Schema.Literal("tool-output-error"),
	toolCallId: Schema.String,
	errorText: Schema.String,
	providerExecuted: Schema.optionalWith(Schema.Boolean, { exact: true }),
	dynamic: Schema.optionalWith(Schema.Boolean, { exact: true }),
}).annotations({ identifier: "UIToolOutputErrorPart" })

export type UIToolOutputErrorPart = typeof UIToolOutputErrorPart.Type
export type UIToolOutputErrorPartEncoded = typeof UIToolOutputErrorPart.Encoded

export interface UIDataPart<Name extends string, Data> {
	readonly type: `data-${Name}`
	readonly id?: string
	readonly data: Data
	readonly transient?: boolean
}

export type UIDataParts<Data extends Record<string, unknown>> = {
	[Name in keyof Data]: Name extends string ? UIDataPart<Name, Data[Name]> : never
}[keyof Data]

export interface UIDataPartEncoded<Name extends string, DataEncoded> {
	readonly type: `data-${Name}`
	readonly id?: string
	readonly data: DataEncoded
	readonly transient?: boolean
}

export type UIDataPartsEncoded<DataEncoded extends Record<string, unknown>> = {
	[Name in keyof DataEncoded]: Name extends string ? UIDataPart<Name, DataEncoded[Name]> : never
}[keyof DataEncoded]

export const UIDataPart = <const Name extends string, Data, DataEncoded>(
	name: Name,
	data: Schema.Schema<Data, DataEncoded>,
): Schema.Schema<UIDataPart<Name, Data>, UIDataPartEncoded<Name, DataEncoded>> =>
	Schema.Struct({
		type: Schema.TemplateLiteral(Schema.Literal("data-"), Schema.Literal(name)),
		id: Schema.optionalWith(Schema.String, { exact: true }),
		data,
		transient: Schema.optionalWith(Schema.Boolean, { exact: true }),
	}).annotations({ identifier: `UIDataPart(${name})` })

export const UIDocumentSourcePart = Schema.Struct({
	type: Schema.Literal("source-document"),
	sourceId: Schema.String,
	mediaType: Schema.String,
	title: Schema.String,
	filename: Schema.optionalWith(Schema.String, { exact: true }),
	providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
}).annotations({ identifier: "UIDocumentSourcePart" })

export type UIDocumentSourcePart = typeof UIDocumentSourcePart.Type
export type UIDocumentSourcePartEncoded = typeof UIDocumentSourcePart.Encoded

export const UIUrlSourcePart = Schema.Struct({
	type: Schema.Literal("source-url"),
	sourceId: Schema.String,
	url: Schema.String,
	title: Schema.optionalWith(Schema.String, { exact: true }),
	providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
}).annotations({ identifier: "UIUrlSourcePart" })

export type UIUrlSourcePart = typeof UIUrlSourcePart.Type
export type UIUrlSourcePartEncoded = typeof UIUrlSourcePart.Encoded

export const UIFilePart = Schema.Struct({
	type: Schema.Literal("file"),
	url: Schema.String,
	mediaType: Schema.String,
	providerMetadata: Schema.optionalWith(ProviderMetadata, { exact: true }),
}).annotations({ identifier: "UIFilePart" })

export type UIFilePart = typeof UIFilePart.Type
export type UIFilePartEncoded = typeof UIFilePart.Encoded

export interface UIMessageMetadataPart<Metadata> {
	readonly type: "message-metadata"
	readonly messageMetadata: Metadata
}

export interface UIMessageMetadataPartEncoded<MetadataEncoded> {
	readonly type: "message-metadata"
	readonly messageMetadata: MetadataEncoded
}

export const UIMessageMetadataPart = <Metadata, MetadataEncoded>(
	messageMetadata: Schema.Schema<Metadata, MetadataEncoded>,
): Schema.Schema<UIMessageMetadataPart<Metadata>, UIMessageMetadataPartEncoded<MetadataEncoded>> =>
	Schema.Struct({
		type: Schema.Literal("message-metadata"),
		messageMetadata,
	}).annotations({ identifier: "UIMessageMetadataPart" })

export const UIErrorPart = Schema.Struct({
	type: Schema.Literal("error"),
	errorText: Schema.String,
}).annotations({ identifier: "UIErrorPart" })

export type UIErrorPart = typeof UIErrorPart.Type
export type UIErrorPartEncoded = typeof UIErrorPart.Encoded

export type Parts<
	Metadata,
	Data extends Record<string, unknown>,
	Tools extends Record<string, Tool.Any>,
> = // Core Message Parts
| UIStartStepPart
| UIFinishStepPart
| UIMessageMetadataPart<Metadata>
| UIStartPart<Metadata>
| UIFinishPart<Metadata>
| UIAbortPart
| UIErrorPart
// Text Parts
| UITextStartPart
| UITextDeltaPart
| UITextEndPart
// Reasoning Parts
| UIReasoningStartPart
| UIReasoningDeltaPart
| UIReasoningEndPart
// File Parts
| UIFilePart
// Tool Parts
| UIToolInputStartPart
| UIToolInputDeltaPart
| UIToolParts<Tools>
| UIToolOutputErrorPart
// Data Parts
| UIDataParts<Data>
// Source Parts
| UIDocumentSourcePart
| UIUrlSourcePart

export type PartsEncoded<
	MetadataEncoded,
	DataEncoded extends Record<string, unknown>,
	Tools extends Record<string, Tool.Any>,
> = // Core Message Parts
| UIStartStepPartEncoded
| UIFinishStepPartEncoded
| UIMessageMetadataPartEncoded<MetadataEncoded>
| UIStartPartEncoded<MetadataEncoded>
| UIFinishPartEncoded<MetadataEncoded>
| UIAbortPartEncoded
| UIErrorPartEncoded
// Text Parts
| UITextStartPartEncoded
| UITextDeltaPartEncoded
| UITextEndPartEncoded
// Reasoning Parts
| UIReasoningStartPartEncoded
| UIReasoningDeltaPartEncoded
| UIReasoningEndPartEncoded
// File Parts
| UIFilePartEncoded
// Tool Parts
| UIToolInputStartPartEncoded
| UIToolInputDeltaPartEncoded
| UIToolPartsEncoded<Tools>
| UIToolOutputErrorPartEncoded
// Data Parts
| UIDataPartsEncoded<DataEncoded>
// Source Parts
| UIDocumentSourcePartEncoded
| UIUrlSourcePartEncoded

export interface UIMessageChunk<
	Metadata extends Schema.Schema.Any,
	Data extends Schema.Struct.Fields,
	Tools extends Record<string, Tool.Any>,
> extends Schema.Schema<
		Parts<Metadata["Type"], Schema.Struct<Data>["Type"], Tools>,
		PartsEncoded<Metadata["Encoded"], Schema.Struct<Data>["Encoded"], Tools>,
		Tool.Requirements<Tools[keyof Tools]>
	> {
	readonly metadata: Metadata
	readonly data: Data
	readonly toolkit: Toolkit.Toolkit<Tools> | undefined
}

export const make = <
	Metadata extends Schema.Schema.Any = typeof Schema.Void,
	Data extends Schema.Struct.Fields = {},
	Tools extends Record<string, Tool.Any> = {},
>(options?: {
	readonly metadata?: Metadata | undefined
	readonly data?: Data | undefined
	readonly toolkit?: Toolkit.Toolkit<Tools> | undefined
}): UIMessageChunk<Metadata, Data, Tools> => {
	const metadata = options?.metadata ?? Schema.Void
	const data = options?.data
	const tools = options?.toolkit?.tools

	const members: Array<Schema.Schema.All> = [
		UIStartStepPart,
		UIFinishStepPart,
		UIMessageMetadataPart(metadata as any),
		UIStartPart(metadata as any),
		UIFinishPart(metadata as any),
		UIAbortPart,
		UITextStartPart,
		UITextDeltaPart,
		UITextEndPart,
		UIReasoningStartPart,
		UIReasoningDeltaPart,
		UIReasoningEndPart,
		UIToolInputStartPart,
		UIToolInputDeltaPart,
		UIToolOutputErrorPart,
		UIDocumentSourcePart,
		UIUrlSourcePart,
		UIFilePart,
		UIErrorPart,
	]

	if (data !== undefined) {
		for (const [key, value] of Object.entries(data)) {
			members.push(UIDataPart(key, value as any))
		}
	}

	if (tools !== undefined) {
		for (const tool of Object.values(tools)) {
			members.push(UIToolInputAvailablePart(tool))
			members.push(UIToolInputErrorPart(tool))
			members.push(UIToolOutputAvailablePart(tool))
		}
	}

	return Object.assign(Schema.Union(...members), {
		metadata,
		data,
		toolkit: options?.toolkit,
	}) as any
}

export type FromUIMessage<Message extends UIMessage.Any> = UIMessageChunk<
	UIMessage.MetadataSchema<Message>,
	UIMessage.DataSchema<Message>,
	UIMessage.Tools<Message>
>

export const fromUIMessage = <Message extends UIMessage.Any>(
	message: Message,
): FromUIMessage<Message> =>
	make({
		metadata: message.metadata,
		data: message.data,
		toolkit: message.toolkit,
	})
