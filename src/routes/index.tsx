import { useChat } from "@ai-sdk/react"
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ui/shadcn-io/ai/conversation"
import {
	Message,
	MessageAvatar,
	MessageContent,
} from "@/components/ui/shadcn-io/ai/message"
import {
	PromptInput,
	PromptInputButton,
	PromptInputModelSelect,
	PromptInputModelSelectContent,
	PromptInputModelSelectItem,
	PromptInputModelSelectTrigger,
	PromptInputModelSelectValue,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "@/components/ui/shadcn-io/ai/prompt-input"
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ui/shadcn-io/ai/reasoning"
import { Response } from "@/components/ai-elements/response"
import { Button } from "@/components/ui/button"
import { MicIcon, PaperclipIcon, RotateCcwIcon } from "lucide-react"
import { type FormEventHandler, useCallback, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { DefaultChatTransport } from "ai"

const models = [
	{ id: "gpt-4o", name: "GPT-4o" },
	{ id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
	{ id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
	{ id: "llama-3.1-70b", name: "Llama 3.1 70B" },
]

const Example = () => {
	const { messages, setMessages, sendMessage } = useChat({
		transport: new DefaultChatTransport({
			api: "/api/chat",
		}),
	})

	const [inputValue, setInputValue] = useState("")
	const [selectedModel, setSelectedModel] = useState(models[0].id)
	const [isTyping, setIsTyping] = useState(false)
	const [_, setStreamingMessageId] = useState<string | null>(null)

	const simulateTyping = useCallback(
		(
			messageId: string,
			content: string,
			reasoning?: string,
			sources?: Array<{ title: string; url: string }>,
		) => {
			let currentIndex = 0
			const typeInterval = setInterval(() => {
				setMessages((prev) =>
					prev.map((msg) => {
						if (msg.id === messageId) {
							const currentContent = content.slice(0, currentIndex)
							return {
								...msg,
								content: currentContent,
								isStreaming: currentIndex < content.length,
								reasoning:
									currentIndex >= content.length ? reasoning : undefined,
								sources: currentIndex >= content.length ? sources : undefined,
							}
						}
						return msg
					}),
				)
				currentIndex += Math.random() > 0.1 ? 1 : 0 // Simulate variable typing speed

				if (currentIndex >= content.length) {
					clearInterval(typeInterval)
					setIsTyping(false)
					setStreamingMessageId(null)
				}
			}, 5)
			return () => clearInterval(typeInterval)
		},
		[],
	)
	const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
		(event) => {
			event.preventDefault()

			if (!inputValue.trim() || isTyping) return

			sendMessage({ text: inputValue })

			setInputValue("")
			// Simulate AI response with delay
		},
		[inputValue, isTyping, simulateTyping],
	)

	const handleReset = useCallback(() => {
		setMessages([])
		setInputValue("")
		setIsTyping(false)
		setStreamingMessageId(null)
	}, [])

	return (
		<div className="flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<div className="size-2 rounded-full bg-green-500" />
						<span className="font-medium text-sm">AI Assistant</span>
					</div>
					<div className="h-4 w-px bg-border" />
					<span className="text-muted-foreground text-xs">
						{models.find((m) => m.id === selectedModel)?.name}
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleReset}
					className="h-8 px-2"
				>
					<RotateCcwIcon className="size-4" />
					<span className="ml-1">Reset</span>
				</Button>
			</div>
			{/* Conversation Area */}
			<Conversation className="flex-1">
				<ConversationContent className="space-y-4">
					{messages.map((message) => (
						<div key={message.id} className="space-y-3">
							{/* Text Content */}
							<Message from={message.role}>
								<MessageContent>
									{message.parts
										.filter((part) => part.type === "text")
										.map((part, index) => (
											<Response key={index}>{part.text}</Response>
										))}
								</MessageContent>
								<MessageAvatar
									src={
										message.role === "user"
											? "https://github.com/IMax153.png"
											: "https://github.com/Effect-TS.png"
									}
									name={message.role === "user" ? "User" : "AI"}
								/>
							</Message>

							{/* Reasoning Content */}
							{message.parts
								.filter((part) => part.type === "reasoning")
								.map((part) => (
									<div className="ml-10">
										<Reasoning
											isStreaming={part.state === "streaming"}
											defaultOpen={false}
										>
											<ReasoningTrigger />
											<ReasoningContent>{part.text}</ReasoningContent>
										</Reasoning>
									</div>
								))}
						</div>
					))}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>
			{/* Input Area */}
			<div className="border-t p-4">
				<PromptInput onSubmit={handleSubmit}>
					<PromptInputTextarea
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						placeholder="Ask me anything about development, coding, or technology..."
						disabled={isTyping}
					/>
					<PromptInputToolbar>
						<PromptInputTools>
							<PromptInputButton disabled={isTyping}>
								<PaperclipIcon size={16} />
							</PromptInputButton>
							<PromptInputButton disabled={isTyping}>
								<MicIcon size={16} />
								<span>Voice</span>
							</PromptInputButton>
							<PromptInputModelSelect
								value={selectedModel}
								onValueChange={setSelectedModel}
								disabled={isTyping}
							>
								<PromptInputModelSelectTrigger>
									<PromptInputModelSelectValue />
								</PromptInputModelSelectTrigger>
								<PromptInputModelSelectContent>
									{models.map((model) => (
										<PromptInputModelSelectItem key={model.id} value={model.id}>
											{model.name}
										</PromptInputModelSelectItem>
									))}
								</PromptInputModelSelectContent>
							</PromptInputModelSelect>
						</PromptInputTools>
						<PromptInputSubmit
							disabled={!inputValue.trim() || isTyping}
							status={isTyping ? "streaming" : "ready"}
						/>
					</PromptInputToolbar>
				</PromptInput>
			</div>
		</div>
	)
}

export const Route = createFileRoute("/")({
	component: Example,
})
