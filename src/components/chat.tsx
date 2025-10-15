"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { CopyIcon, RefreshCcwIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import * as React from "react"
import { createPortal } from "react-dom"
import useMeasure from "react-use-measure"
import { useSounds } from "@/hooks/use-sounds"
import { Action, Actions } from "@/components/ai-elements/actions"
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation"
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
	const { playSound } = useSounds()
	const [input, setInput] = React.useState(initialPrompt)
	const [currentModelId, setCurrentModelId] = React.useState(models[0].value)
	const textareaRef = React.useRef<HTMLTextAreaElement>(null)
	const [targetRef, targetBounds, updateTargetBounds] = useMeasure({
		scroll: true,
		offsetSize: true,
	})
	const [inputPanelRef, inputPanelBounds] = useMeasure({
		scroll: true,
		offsetSize: true,
	})
	const [viewportHeight, setViewportHeight] = React.useState<number | null>(() =>
		typeof window === "undefined" ? null : window.innerHeight,
	)

	React.useEffect(() => {
		if (typeof window === "undefined") {
			return
		}

		const handleResize = () => {
			setViewportHeight(window.innerHeight)
			updateTargetBounds()
		}

		handleResize()

		window.addEventListener("resize", handleResize)
		return () => {
			window.removeEventListener("resize", handleResize)
		}
	}, [updateTargetBounds])

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
	const isEmptyConversation = messages.length === 0

	// Play greeting sound on mount (when chat first loads)
	React.useEffect(() => {
		// Try to play greeting when component mounts
		// Note: May be blocked by browser autoplay restrictions
		playSound("greeting")
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Track previous status to detect when AI finishes responding
	const prevStatusRef = React.useRef(status)

	React.useEffect(() => {
		const wasStreaming = prevStatusRef.current === "streaming"
		const isNowReady = status === "ready"
		const lastMessageIsAssistant = messages.length > 0 && messages[messages.length - 1].role === "assistant"

		// Play laugh sound when AI finishes responding
		if (wasStreaming && isNowReady && lastMessageIsAssistant) {
			playSound("laugh")
		}

		prevStatusRef.current = status
	}, [status, messages, playSound])

	const dadPosition = React.useMemo(() => {
		const { left, width, height, top } = targetBounds

		// For empty conversation, center the dad avatar
		if (isEmptyConversation && viewportHeight !== null && height > 0) {
			return {
				left,
				width,
				height,
				top: Math.max(0, (viewportHeight - height) / 2),
			}
		}

		// Calculate the maximum allowed top position (top of input panel minus dad height)
		// Use the actual measured input panel position if available
		const dadHeight = 80 // h-20 = 5rem = 80px
		const maxTop = inputPanelBounds.top > 0 ? inputPanelBounds.top - dadHeight : Infinity

		return {
			left,
			width,
			height,
			top: Math.min(top, maxTop),
		}
	}, [
		isEmptyConversation,
		targetBounds.height,
		targetBounds.left,
		targetBounds.top,
		targetBounds.width,
		viewportHeight,
		targetBounds,
		inputPanelBounds.top,
	])

	const dadIsReady =
		targetBounds.width > 0 &&
		targetBounds.height > 0 &&
		(!isEmptyConversation || viewportHeight !== null)

	// Force remeasure when messages change to ensure dad avatar follows
	// biome-ignore lint/correctness/useExhaustiveDependencies: we use messages to trigger the effect
	React.useEffect(() => {
		const rafId = requestAnimationFrame(updateTargetBounds)
		return () => cancelAnimationFrame(rafId)
	}, [messages, updateTargetBounds])

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

		// Play think sound when user submits a message
		playSound("think")

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

						{/* Invisible placeholder that defines where dad should be */}
						<div className={isEmptyConversation ? "flex justify-center" : "flex justify-start"}>
							<div
								ref={targetRef}
								className="h-20 w-20 invisible pointer-events-none"
								aria-hidden="true"
							/>
						</div>

						{/* Portal for dad avatar with smooth position animation */}
						{typeof document !== "undefined" &&
							dadIsReady &&
							createPortal(
								<motion.div
									key="dad-avatar-portal"
									className="fixed pointer-events-none z-50"
									initial={{
										left: dadPosition.left,
										top: dadPosition.top,
										width: dadPosition.width,
										height: dadPosition.height,
										opacity: 0,
										filter: "blur(8px)",
										scale: 0.5,
									}}
									animate={{
										left: dadPosition.left,
										top: dadPosition.top,
										width: dadPosition.width,
										height: dadPosition.height,
										opacity: 1,
										filter: "blur(0px)",
										scale: isEmptyConversation ? 3 : 1,
									}}
									transition={{
										type: "spring",
										visualDuration: 0.4,
										bounce: 0.1,
									}}
									style={{
										transformOrigin: "center center",
									}}
								>
									<DadAvatar
										state={status === "streaming" || status === "submitted" ? "thinking" : "idle"}
										className="h-20 w-20"
									/>
								</motion.div>,
								document.body,
							)}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>
			</div>

			<div ref={inputPanelRef} className="bg-background">
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
