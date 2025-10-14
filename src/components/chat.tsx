import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { CopyIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { Action, Actions } from "@/components/ai-elements/actions"
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Loader } from "@/components/ai-elements/loader"
import { Message, MessageAvatar, MessageContent } from "@/components/ai-elements/message"
import {
	PromptInput,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	type PromptInputMessage,
	PromptInputModelSelect,
	PromptInputModelSelectContent,
	PromptInputModelSelectItem,
	PromptInputModelSelectTrigger,
	PromptInputModelSelectValue,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning"
import { Response } from "@/components/ai-elements/response"
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources"
import { ToolCall } from "@/components/tool-call"
import type { ChatUIMessage } from "@/lib/domain/chat-message"

const models = [
	{ value: "gpt-4o-mini", name: "GPT-4o Mini" },
	{ value: "gpt-4o", name: "GPT-4o" },
]

export function Chat({ initialPrompt = "" }: { readonly initialPrompt?: string | undefined }) {
	const [input, setInput] = React.useState(initialPrompt)
	const [currentModelId, setCurrentModelId] = React.useState(models[0].value)
	const textareaRef = React.useRef<HTMLTextAreaElement>(null)

	// Ensure we are never using a stale reference to the selected model when
	// the request to the server is prepared / sent
	const currentModelIdRef = React.useRef(currentModelId)
	React.useEffect(() => {
		currentModelIdRef.current = currentModelId
	}, [currentModelId])

	// Set cursor to end of text on mount if there's initial content
	React.useEffect(() => {
		if (textareaRef.current && initialPrompt) {
			const length = initialPrompt.length
			textareaRef.current.setSelectionRange(length, length)
		}
	}, [initialPrompt])

	const { messages, sendMessage, status, regenerate, stop } = useChat<ChatUIMessage>({
		experimental_throttle: 50,
		transport: new DefaultChatTransport({
			api: "/api/chat",
			prepareSendMessagesRequest(request) {
				return {
					body: {
						// TODO: Use the api/chat.ts Schema for this structure
						id: request.id,
						message: request.messages.at(-1),
						selectedChatModel: currentModelIdRef.current,
						...request.body,
					},
				}
			},
		}),
	})

	// if the last message parts contains a tool-call where the state is input-available, log it!
	const lastMessage = messages.at(-1)
	if (lastMessage?.role === "assistant") {
		const toolCallParts = lastMessage.parts.filter(
			(part) => part.type === "tool-GetDadJoke" && part.state === "input-available",
		)
		console.dir(toolCallParts, { depth: null })
	}

	const handleSubmit = (message: PromptInputMessage) => {
		if (status === "submitted" || status === "streaming") {
			stop()
			return
		}

		const hasText = Boolean(message.text)
		const hasAttachments = Boolean(message.files?.length)

		if (!(hasText || hasAttachments)) {
			return
		}

		sendMessage(
			{
				text: message.text || "Sent with attachments",
				...(message.files !== undefined ? { files: message.files } : {}),
			},
			{
				body: { model: currentModelId },
			},
		)

		setInput("")
	}

	return (
		<div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
			<div className="flex flex-col h-full">
				<Conversation className="h-full">
					<ConversationContent>
						{messages.map((message, index) => (
							<div key={`${message.id}-${index}`}>
								{message.role === "assistant" &&
									message.parts.filter((part) => part.type === "source-url").length > 0 && (
										<Sources>
											<SourcesTrigger
												count={message.parts.filter((part) => part.type === "source-url").length}
											/>
											{message.parts
												.filter((part) => part.type === "source-url")
												.map((part, i) => (
													<SourcesContent key={`${message.id}-${i}`}>
														<Source key={`${message.id}-${i}`} href={part.url} title={part.url} />
													</SourcesContent>
												))}
										</Sources>
									)}
								{message.parts.map((part, i) => {
									switch (part.type) {
										case "text":
											return (
												<React.Fragment key={`${message.id}-${i}`}>
													<Message from={message.role}>
														<MessageContent>
															<Response>{part.text}</Response>
														</MessageContent>
														<MessageAvatar
															className="h-10 w-10"
															src={
																message.role === "user"
																	? "https://github.com/IMax153.png"
																	: "https://github.com/Effect-TS.png"
															}
														/>
													</Message>
													{message.role === "assistant" && i === messages.length - 1 && (
														<Actions className="mt-2">
															<Action onClick={() => regenerate()} label="Retry">
																<RefreshCcwIcon className="size-3" />
															</Action>
															<Action
																onClick={() => navigator.clipboard.writeText(part.text)}
																label="Copy"
															>
																<CopyIcon className="size-3" />
															</Action>
														</Actions>
													)}
												</React.Fragment>
											)
										case "reasoning":
											return (
												<Reasoning
													key={`${message.id}-${i}`}
													className="w-full"
													isStreaming={
														status === "streaming" &&
														i === message.parts.length - 1 &&
														message.id === messages.at(-1)?.id
													}
												>
													<ReasoningTrigger />
													<ReasoningContent>{part.text}</ReasoningContent>
												</Reasoning>
											)
										case "tool-GetDadJoke": {
											return <ToolCall key={`${message.id}-${i}`} part={part} />
										}
										default:
											return null
									}
								})}
							</div>
						))}
						{status === "submitted" && <Loader />}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>

				<PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
					<PromptInputBody>
						<PromptInputTextarea
							autoFocus
							onChange={(e) => setInput(e.target.value)}
							ref={textareaRef}
							value={input}
						/>
					</PromptInputBody>
					<PromptInputToolbar>
						<PromptInputTools>
							<PromptInputActionMenu>
								<PromptInputActionMenuTrigger />
								<PromptInputActionMenuContent>No actions at this time</PromptInputActionMenuContent>
							</PromptInputActionMenu>
							<PromptInputModelSelect
								onValueChange={(value) => {
									setCurrentModelId(value)
								}}
								value={currentModelId}
							>
								<PromptInputModelSelectTrigger>
									<PromptInputModelSelectValue />
								</PromptInputModelSelectTrigger>
								<PromptInputModelSelectContent>
									{models.map((model) => (
										<PromptInputModelSelectItem key={model.value} value={model.value}>
											{model.name}
										</PromptInputModelSelectItem>
									))}
								</PromptInputModelSelectContent>
							</PromptInputModelSelect>
						</PromptInputTools>
						<PromptInputSubmit disabled={!input && !status} status={status} />
					</PromptInputToolbar>
				</PromptInput>
			</div>
		</div>
	)
}
