import { AIDevtools } from "@ai-sdk-tools/devtools"
import { createFileRoute } from "@tanstack/react-router"
import { ChatBot } from "@/components/chat-bot"

export const Route = createFileRoute("/")({
	component: () => (
		<>
			<ChatBot />,
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
	),
})
