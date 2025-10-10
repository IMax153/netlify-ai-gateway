import * as Schema from "effect/Schema"

export type JSONValue = string | number | boolean | JSONObject | JSONArray

export interface JSONObject {
	[x: string]: JSONValue
}

export interface JSONArray extends Array<JSONValue> {}

export const JSONValue: Schema.Schema<JSONValue> = Schema.Union(
	Schema.String,
	Schema.Number,
	Schema.Boolean,
	Schema.mutable(Schema.Array(Schema.suspend(() => JSONValue))),
	Schema.mutable(
		Schema.Record({
			key: Schema.String,
			value: Schema.suspend(() => JSONValue),
		}),
	),
)
