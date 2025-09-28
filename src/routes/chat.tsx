import { AIDevtools } from "@ai-sdk-tools/devtools"
import { createFileRoute } from "@tanstack/react-router"
import * as Schema from "effect/Schema"
import { Chat } from "@/components/chat"

const SearchParams = Schema.standardSchemaV1(
	Schema.Struct({ prompt: Schema.optional(Schema.String) }),
)

export const Route = createFileRoute("/chat")({
	validateSearch: SearchParams,
	component: () => {
		const { prompt } = Route.useSearch()
		return (
			<>
				<Chat initialPrompt={prompt} />,
				{process.env.NODE_ENV === "development" && (
					<AIDevtools
						config={{
							position: "right",
							throttle: {
								enabled: true,
								interval: 100, // ms
								includeTypes: ["text-delta"], // Only throttle high-frequency events
							},
						}}
					/>
				)}
			</>
		)
	},
})
