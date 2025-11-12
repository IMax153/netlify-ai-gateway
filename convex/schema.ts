import { defineSchema, defineTable, Id } from "@rjdellecese/confect/server"
import * as Schema from "effect/Schema"

export type JsonValue = string | number | boolean | JsonObject | JsonArray

export interface JsonObject {
	readonly [x: string]: JsonValue
}

export interface JsonArray extends Array<JsonValue> {}

export const JsonValue: Schema.Schema<JsonValue> = Schema.Union(
	Schema.String,
	Schema.Number,
	Schema.Boolean,
	Schema.mutable(Schema.Record({ key: Schema.String, value: Schema.suspend(() => JsonValue) })),
	Schema.mutable(Schema.Array(Schema.suspend(() => JsonValue))),
)

export const confectSchema = defineSchema({
	chats: defineTable(
		Schema.Struct({
			id: Schema.optional(Id.Id("chats")),
			title: Schema.String,
		}),
	),
	messages: defineTable(
		Schema.Struct({
			id: Schema.optional(Id.Id("messages")),
			chatId: Id.Id("chats"),
			role: Schema.Literal("assistant", "user"),
			parts: JsonValue,
		}),
	),
})

export default confectSchema.convexSchemaDefinition
