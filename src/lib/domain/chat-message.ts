import * as Schema from "effect/Schema"
import { DadJokeTools } from "@/lib/ai/tools/dad-joke"
import * as UIMessage from "./ui-message"

export const ChatUIMessage = UIMessage.make({
	toolkit: DadJokeTools,
	data: {
		notification: Schema.Struct({
			message: Schema.String,
			level: Schema.Literal("info"),
		}),
		weather: Schema.Union(
			Schema.Struct({
				city: Schema.String,
				status: Schema.Literal("loading"),
			}),
			Schema.Struct({
				city: Schema.String,
				weather: Schema.String,
				status: Schema.Literal("success"),
			}),
		),
	},
})

export type ChatUIMessage = typeof ChatUIMessage.Type
