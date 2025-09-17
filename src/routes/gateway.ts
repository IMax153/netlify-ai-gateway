import { createServerFileRoute } from "@tanstack/react-start/server"

export const ServerRoute = createServerFileRoute("/gateway").methods({
	GET: async ({ request }) => {
		console.log(process.env.AI_GATEWAY_BASE_URL)
		console.log(process.env.AI_GATEWAY_OPENAI_KEY)
		console.log(process.env.OPENAI_BASE_URL)
		console.log(process.env.OPENAI_API_KEY)
		return new Response("Hello, World!")
	},
})
