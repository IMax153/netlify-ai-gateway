"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import * as React from "react"
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import { ChatDadAvatar, useDadAvatarInputPanel } from "@/components/chat/dad-avatar"
import { ChatInputPanel } from "@/components/chat/input-panel"
import { ChatMessageList } from "@/components/chat/message-list"
import type { ChatModelOption } from "@/components/chat/types"
import { useAvatarImagesPreloader } from "@/hooks/use-dad-images-preloader"
import { useSounds } from "@/hooks/use-sounds"
import type { ChatUIMessage } from "@/lib/domain/chat-message"

const MODELS: readonly ChatModelOption[] = [
	{ value: "gpt-4o-mini", name: "GPT-4o Mini" },
	{ value: "gpt-4o", name: "GPT-4o" },
] as const

export type ChatProps = {
	readonly initialPrompt?: string | undefined
}

export function Chat({ initialPrompt = "" }: ChatProps) {
	const { playSound } = useSounds()
	const { isLoaded: areImagesLoaded } = useAvatarImagesPreloader()
	const [input, setInput] = React.useState(initialPrompt)
	const [currentModelId, setCurrentModelId] = React.useState(MODELS[0].value)
	const textareaRef = React.useRef<HTMLTextAreaElement>(null)
	const { inputPanelRef, inputPanelBounds } = useDadAvatarInputPanel()

	const currentModelIdRef = React.useRef(currentModelId)
	React.useEffect(() => {
		currentModelIdRef.current = currentModelId
	}, [currentModelId])

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
	const latestMessageId = messages.at(-1)?.id

	React.useEffect(() => {
		playSound("greeting")
	}, [playSound])

	const previousStatusRef = React.useRef(status)
	React.useEffect(() => {
		const wasStreaming = previousStatusRef.current === "streaming"
		const isNowReady = status === "ready"
		const lastMessageIsAssistant = messages.at(-1)?.role === "assistant"

		if (wasStreaming && isNowReady && lastMessageIsAssistant) {
			playSound("laugh")
		}

		previousStatusRef.current = status
	}, [messages, playSound, status])

	const handleSubmit = React.useCallback(
		(message: PromptInputMessage) => {
			if (status === "submitted" || status === "streaming") {
				stop()
				return
			}

			const hasText = Boolean(message.text)
			const hasAttachments = Boolean(message.files?.length)

			if (!(hasText || hasAttachments)) {
				return
			}

			playSound("think")

			sendMessage(
				{
					text: message.text || "Sent with attachments",
					...(message.files !== undefined ? { files: message.files } : {}),
				},
				{ body: { model: currentModelId } },
			)

			setInput("")
		},
		[currentModelId, playSound, sendMessage, status, stop],
	)

	// Don't render until images are preloaded
	if (!areImagesLoaded) {
		return (
			<div className="flex flex-col h-screen pt-14">
				<div className="flex-1 overflow-hidden flex items-center justify-center">
					<div className="text-muted-foreground">Loading...</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col h-screen pt-14">
			<div className="flex-1 overflow-hidden">
				<Conversation className="h-full">
					<ConversationContent className="max-w-screen-md mx-auto px-6 py-6">
						<ChatMessageList
							latestMessageId={latestMessageId}
							messages={messages}
							onRegenerate={regenerate}
							status={status}
						/>

						<ChatDadAvatar
							inputPanelTop={inputPanelBounds.top}
							isEmptyConversation={isEmptyConversation}
							messages={messages}
							status={status}
						/>
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>
			</div>

			<ChatInputPanel
				ref={inputPanelRef}
				currentModelId={currentModelId}
				inputValue={input}
				models={MODELS}
				onInputChange={(value) => setInput(value)}
				onModelChange={setCurrentModelId}
				onSubmit={handleSubmit}
				status={status}
				textareaRef={textareaRef}
			/>
		</div>
	)
}
