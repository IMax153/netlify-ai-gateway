import { Message, MessageAvatar, MessageContent } from "./message"

export default {
	"User Message - Contained": (
		<div className="w-full max-w-2xl">
			<Message from="user">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
					name="User"
				/>
				<MessageContent variant="contained">
					Hello! Can you tell me a dad joke about programming?
				</MessageContent>
			</Message>
		</div>
	),

	"Assistant Message - Contained": (
		<div className="w-full max-w-2xl">
			<Message from="assistant">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/bottts/svg?seed=DadBot"
					name="AI"
				/>
				<MessageContent variant="contained">
					Why do programmers prefer dark mode? Because light attracts bugs! 🐛
				</MessageContent>
			</Message>
		</div>
	),

	"User Message - Flat": (
		<div className="w-full max-w-2xl">
			<Message from="user">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
					name="User"
				/>
				<MessageContent variant="flat">
					Tell me another joke about TypeScript!
				</MessageContent>
			</Message>
		</div>
	),

	"Assistant Message - Flat": (
		<div className="w-full max-w-2xl">
			<Message from="assistant">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/bottts/svg?seed=DadBot"
					name="AI"
				/>
				<MessageContent variant="flat">
					Why did the TypeScript developer break up with JavaScript? They needed more type safety in their relationship!
				</MessageContent>
			</Message>
		</div>
	),

	"Long User Message": (
		<div className="w-full max-w-2xl">
			<Message from="user">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
					name="User"
				/>
				<MessageContent variant="contained">
					I'm working on a React application using TanStack Start, Effect, and TypeScript. I need
					help understanding how to properly structure my API routes to handle streaming responses
					from an AI model. Can you walk me through the best practices for this?
				</MessageContent>
			</Message>
		</div>
	),

	"Long Assistant Message": (
		<div className="w-full max-w-2xl">
			<Message from="assistant">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/bottts/svg?seed=DadBot"
					name="AI"
				/>
				<MessageContent variant="contained">
					Absolutely! When working with TanStack Start and streaming AI responses, you'll want to use
					Server-Sent Events (SSE) for real-time data streaming. Here's a comprehensive approach:
					First, set up your API route to return a ReadableStream. Then, use Effect's Stream
					utilities to transform your AI responses into chunks. Finally, on the client side, use
					the fetch API with the stream option to consume the data progressively. This pattern
					ensures efficient memory usage and provides a smooth user experience with incremental
					updates.
				</MessageContent>
			</Message>
		</div>
	),

	"Conversation Thread": (
		<div className="w-full max-w-2xl space-y-0">
			<Message from="user">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
					name="User"
				/>
				<MessageContent variant="contained">What's the weather like today?</MessageContent>
			</Message>
			<Message from="assistant">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/bottts/svg?seed=DadBot"
					name="AI"
				/>
				<MessageContent variant="contained">
					I don't have access to real-time weather data, but I can tell you a weather joke! Why did
					the weather go to school? To become a little brighter! ☀️
				</MessageContent>
			</Message>
			<Message from="user">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
					name="User"
				/>
				<MessageContent variant="contained">That was terrible! 😂</MessageContent>
			</Message>
		</div>
	),

	"Custom Avatar Seeds": (
		<div className="w-full max-w-2xl space-y-0">
			<Message from="user">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/personas/svg?seed=CustomUser"
					name="CU"
				/>
				<MessageContent variant="contained">Testing different avatar styles</MessageContent>
			</Message>
			<Message from="assistant">
				<MessageAvatar
					src="https://api.dicebear.com/7.x/shapes/svg?seed=AI"
					name="AI"
				/>
				<MessageContent variant="contained">
					The DiceBear API provides many avatar styles to choose from!
				</MessageContent>
			</Message>
		</div>
	),
}
