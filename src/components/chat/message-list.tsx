"use client"

import { CopyIcon, RefreshCcwIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import * as React from "react"
import { Action, Actions } from "@/components/ai-elements/actions"
import { Message, MessageAvatar, MessageContent } from "@/components/ai-elements/message"
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning"
import { Response } from "@/components/ai-elements/response"
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources"
import { ToolCall } from "@/components/tool-call"
import type { ChatUIMessage } from "@/lib/domain/chat-message"
import type { ChatStatus } from "./types"

const chatItemAnimation = {
	initial: { opacity: 0, y: 20, filter: "blur(4px)" },
	animate: { opacity: 1, y: 0, filter: "blur(0px)" },
	exit: { opacity: 0, y: -20, filter: "blur(4px)" },
	transition: { type: "spring", visualDuration: 0.4, bounce: 0 },
} as const

type ChatMessagePart = ChatUIMessage["parts"][number]
type SourceUrlPart = Extract<ChatMessagePart, { type: "source-url" }>

export interface ChatMessageListProps {
	readonly messages: ChatUIMessage[]
	readonly status: ChatStatus
	readonly latestMessageId?: string | undefined
	readonly onRegenerate: () => void
}

export function ChatMessageList({
	messages,
	status,
	latestMessageId,
	onRegenerate,
}: ChatMessageListProps) {
	return (
		<AnimatePresence mode="popLayout" initial={false}>
			{messages.map((message, messageIndex) => {
				const sourceParts = getSourceParts(message.parts)
				const isLastMessage = messageIndex === messages.length - 1

				return (
					<div key={`${message.id}-${messageIndex}`}>
						<MessageSources messageId={message.id} sourceParts={sourceParts} />
						{message.parts.map((part, partIndex) => (
							<MessagePart
								key={`${message.id}-${partIndex}`}
								message={message}
								part={part}
								partIndex={partIndex}
								status={status}
								isLastMessage={isLastMessage}
								latestMessageId={latestMessageId}
								onRegenerate={onRegenerate}
							/>
						))}
					</div>
				)
			})}
		</AnimatePresence>
	)
}

interface MessagePartProps {
	readonly message: ChatUIMessage
	readonly part: ChatMessagePart
	readonly partIndex: number
	readonly status: ChatStatus
	readonly isLastMessage: boolean
	readonly latestMessageId?: string | undefined
	readonly onRegenerate: () => void
}

function MessagePart({
	message,
	part,
	partIndex,
	status,
	isLastMessage,
	latestMessageId,
	onRegenerate,
}: MessagePartProps) {
	const animationDelay = partIndex * 0.05
	const isLastPart = partIndex === message.parts.length - 1

	switch (part.type) {
		case "text":
			return (
				<TextPart
					animationDelay={animationDelay}
					isLastMessage={isLastMessage}
					isLastPart={isLastPart}
					message={message}
					onRegenerate={onRegenerate}
					part={part}
				/>
			)
		case "reasoning":
			return (
				<ReasoningPart
					animationDelay={animationDelay}
					isStreaming={status === "streaming" && isLastPart && message.id === latestMessageId}
					part={part}
				/>
			)
		case "tool-SearchDadJoke":
		case "tool-GetRandomDadJoke":
			return <ToolCallPart animationDelay={animationDelay} part={part} />
		default:
			return null
	}
}

interface TextPartProps {
	readonly animationDelay: number
	readonly message: ChatUIMessage
	readonly part: Extract<ChatMessagePart, { type: "text" }>
	readonly isLastMessage: boolean
	readonly isLastPart: boolean
	readonly onRegenerate: () => void
}

function TextPart({
	animationDelay,
	message,
	part,
	isLastMessage,
	isLastPart,
	onRegenerate,
}: TextPartProps) {
	const shouldShowActions = isLastMessage && isLastPart && message.role === "assistant"

	return (
		<React.Fragment>
			<motion.div
				{...chatItemAnimation}
				transition={{ ...chatItemAnimation.transition, delay: animationDelay }}
			>
				<Message from={message.role}>
					<MessageContent>
						<Response>{part.text}</Response>
					</MessageContent>
					{message.role === "user" && (
						<MessageAvatar className="h-10 w-10" src="https://github.com/IMax153.png" />
					)}
				</Message>
			</motion.div>
			{shouldShowActions && (
				<motion.div
					{...chatItemAnimation}
					transition={{ ...chatItemAnimation.transition, delay: animationDelay + 0.1 }}
				>
					<Actions className="mt-2">
						<Action onClick={onRegenerate} label="Retry">
							<RefreshCcwIcon className="size-3" />
						</Action>
						<Action onClick={() => copyToClipboard(part.text)} label="Copy">
							<CopyIcon className="size-3" />
						</Action>
					</Actions>
				</motion.div>
			)}
		</React.Fragment>
	)
}

interface ReasoningPartProps {
	readonly animationDelay: number
	readonly part: Extract<ChatMessagePart, { type: "reasoning" }>
	readonly isStreaming: boolean
}

function ReasoningPart({ animationDelay, part, isStreaming }: ReasoningPartProps) {
	return (
		<motion.div
			{...chatItemAnimation}
			transition={{ ...chatItemAnimation.transition, delay: animationDelay }}
		>
			<Reasoning className="w-full" isStreaming={isStreaming}>
				<ReasoningTrigger />
				<ReasoningContent>{part.text}</ReasoningContent>
			</Reasoning>
		</motion.div>
	)
}

interface ToolCallPartProps {
	readonly animationDelay: number
	readonly part: Extract<ChatMessagePart, { type: `tool-${string}` }>
}

function ToolCallPart({ animationDelay, part }: ToolCallPartProps) {
	return (
		<motion.div
			{...chatItemAnimation}
			transition={{ ...chatItemAnimation.transition, delay: animationDelay }}
		>
			<ToolCall part={part} />
		</motion.div>
	)
}

interface MessageSourcesProps {
	readonly messageId: string
	readonly sourceParts: SourceUrlPart[]
}

function MessageSources({ messageId, sourceParts }: MessageSourcesProps) {
	if (sourceParts.length === 0) {
		return null
	}

	return (
		<motion.div {...chatItemAnimation}>
			<Sources>
				<SourcesTrigger count={sourceParts.length} />
				{sourceParts.map((part) => (
					<SourcesContent key={`${messageId}-source-${part.sourceId ?? part.url}`}>
						<Source href={part.url} title={part.title ?? part.url} />
					</SourcesContent>
				))}
			</Sources>
		</motion.div>
	)
}

function getSourceParts(parts: ChatUIMessage["parts"]): SourceUrlPart[] {
	return parts.filter((part): part is SourceUrlPart => part.type === "source-url")
}

function copyToClipboard(text: string) {
	if (typeof navigator === "undefined" || typeof navigator.clipboard === "undefined") {
		return
	}

	void navigator.clipboard.writeText(text)
}
