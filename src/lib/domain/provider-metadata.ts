import * as Schema from "effect/Schema"
import { JSONValue } from "./json-value"

export const ProviderMetadata = Schema.Record({
	key: Schema.String,
	value: Schema.Record({
		key: Schema.String,
		value: JSONValue,
	}),
})

export type ProviderMetadata = typeof ProviderMetadata.Type

export type ProviderMetadataEncoded = typeof ProviderMetadata.Encoded
