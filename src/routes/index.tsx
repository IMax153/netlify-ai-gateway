import { createFileRoute } from "@tanstack/react-router"
import { ChatBot } from "@/components/chat-bot"

export const Route = createFileRoute("/")({
	component: () => <ChatBot />,
})
