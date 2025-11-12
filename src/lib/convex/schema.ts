import { defineSchema, defineTable, Id } from "@rjdellecese/confect/server"
import * as Schema from "effect/Schema"

export const schema = defineSchema({
	chats: defineTable(
		Schema.Struct({
			id: Schema.optional(Id.Id("chats")),
		}),
	),
})
