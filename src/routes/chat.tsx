import { AIDevtools } from "@ai-sdk-tools/devtools"
import { createFileRoute } from "@tanstack/react-router"
import { Chat } from "@/components/chat"

export const Route = createFileRoute("/chat")({
	component: () => (
		<>
			<Chat />,
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
