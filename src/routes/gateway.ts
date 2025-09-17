import { createServerFileRoute } from "@tanstack/react-start/server"

export const ServerRoute = createServerFileRoute("/gateway").methods({
	GET: async ({ request }) => {
		console.log({ AI_GATEWAY_BASE_URL: process.env.AI_GATEWAY_BASE_URL })
		console.log({ AI_GATEWAY_OPENAI_KEY: process.env.AI_GATEWAY_OPENAI_KEY })
		console.log({ OPENAI_BASE_URL: process.env.OPENAI_BASE_URL })
		console.log({ OPENAI_API_KEY: process.env.OPENAI_API_KEY })
		return new Response("Hello, World!")
	},
})
