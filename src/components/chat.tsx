import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { CopyIcon, RefreshCcwIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
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
import { DadAvatar } from "@/components/dad-avatar"
import type { ChatUIMessage } from "@/lib/domain/chat-message"

const models = [
	{ value: "gpt-4o-mini", name: "GPT-4o Mini" },
	{ value: "gpt-4o", name: "GPT-4o" },
]

const chatItemAnimation = {
	initial: { opacity: 0, y: 20, filter: "blur(4px)" },
	animate: { opacity: 1, y: 0, filter: "blur(0px)" },
	exit: { opacity: 0, y: -20, filter: "blur(4px)" },
	transition: { type: "spring", visualDuration: 0.4, bounce: 0 },
} as const

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
		<div className="flex flex-col h-screen pt-14">
			<div className="flex-1 overflow-hidden">
				<Conversation className="h-full">
					<ConversationContent className="max-w-screen-md mx-auto px-6 py-6">
						<AnimatePresence mode="popLayout" initial={false}>
							{messages.map((message, index) => (
								<div key={`${message.id}-${index}`}>
									{message.role === "assistant" &&
										message.parts.filter((part) => part.type === "source-url").length > 0 && (
											<motion.div {...chatItemAnimation}>
												<Sources>
													<SourcesTrigger
														count={
															message.parts.filter((part) => part.type === "source-url").length
														}
													/>
													{message.parts
														.filter((part) => part.type === "source-url")
														.map((part, i) => (
															<SourcesContent key={`${message.id}-${i}`}>
																<Source
																	key={`${message.id}-${i}`}
																	href={part.url}
																	title={part.url}
																/>
															</SourcesContent>
														))}
												</Sources>
											</motion.div>
										)}
									{message.parts.map((part, i) => {
										switch (part.type) {
											case "text":
												return (
													<React.Fragment key={`${message.id}-${i}`}>
														<motion.div
															{...chatItemAnimation}
															transition={{ ...chatItemAnimation.transition, delay: i * 0.05 }}
														>
															<Message from={message.role}>
																<MessageContent>
																	<Response>{part.text}</Response>
																</MessageContent>
																{message.role === "user" && (
																	<MessageAvatar
																		className="h-10 w-10"
																		src="https://github.com/IMax153.png"
																	/>
																)}
															</Message>
														</motion.div>
														{message.role === "assistant" && i === messages.length - 1 && (
															<motion.div
																{...chatItemAnimation}
																transition={{ ...chatItemAnimation.transition, delay: 0.1 }}
															>
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
															</motion.div>
														)}
													</React.Fragment>
												)
											case "reasoning":
												return (
													<motion.div
														key={`${message.id}-${i}`}
														{...chatItemAnimation}
														transition={{ ...chatItemAnimation.transition, delay: i * 0.05 }}
													>
														<Reasoning
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
													</motion.div>
												)
											case "tool-SearchDadJoke":
											case "tool-GetRandomDadJoke": {
												return (
													<motion.div
														key={`${message.id}-${i}`}
														{...chatItemAnimation}
														transition={{ ...chatItemAnimation.transition, delay: i * 0.05 }}
													>
														<ToolCall part={part} />
													</motion.div>
												)
											}
											default:
												return null
										}
									})}
								</div>
							))}
						</AnimatePresence>
						{status === "submitted" && <Loader />}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>
			</div>

			<div className="bg-background pb-2">
				<div className="max-w-screen-md mx-auto px-6 flex justify-center">
					<DadAvatar
						state={status === "streaming" || status === "submitted" ? "thinking" : "idle"}
						className="h-20"
					/>
				</div>
			</div>

			<div className="bg-background">
				<PromptInput
					onSubmit={handleSubmit}
					className="max-w-screen-md mx-auto mb-4"
					globalDrop
					multiple
				>
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
