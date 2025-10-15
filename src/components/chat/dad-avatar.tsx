"use client"

import { motion } from "motion/react"
import * as React from "react"
import useMeasure, { type RectReadOnly } from "react-use-measure"
import { createPortal } from "react-dom"
import { DadAvatar } from "@/components/dad-avatar"
import type { ChatStatus } from "./types"
import type { ChatUIMessage } from "@/lib/domain/chat-message"

const DAD_AVATAR_HEIGHT = 80

export interface ChatDadAvatarProps {
	readonly status: ChatStatus
	readonly isEmptyConversation: boolean
	readonly messages: readonly ChatUIMessage[]
	readonly inputPanelTop: number
}

export function ChatDadAvatar({ status, isEmptyConversation, messages, inputPanelTop }: ChatDadAvatarProps) {
	const [anchorRef, anchorBounds, updateAnchorBounds] = useMeasure({
		scroll: true,
		offsetSize: true,
	})

	const viewportHeight = useViewportHeight(updateAnchorBounds)

	const { position, isReady } = useDadAvatarPlacement({
		anchorBounds,
		inputPanelTop,
		isEmptyConversation,
		viewportHeight,
	})

	const anchorUpdateKey = React.useMemo(() => createAnchorUpdateKey(messages), [messages])

	React.useEffect(() => {
		void anchorUpdateKey
		const rafId = requestAnimationFrame(updateAnchorBounds)
		return () => cancelAnimationFrame(rafId)
	}, [anchorUpdateKey, updateAnchorBounds])

	return (
		<React.Fragment>
			<div className={isEmptyConversation ? "flex justify-center" : "flex justify-start"}>
				<div
					ref={anchorRef}
					className="h-20 w-20 invisible pointer-events-none"
					aria-hidden="true"
				/>
			</div>

			<DadAvatarPortal
				isEmptyConversation={isEmptyConversation}
				isReady={isReady}
				position={position}
				status={status}
			/>
		</React.Fragment>
	)
}

function createAnchorUpdateKey(messages: readonly ChatUIMessage[]): string {
	return messages
		.map((message) => {
			const partSignature = message.parts.map(getPartSignature).join(",")
			return `${message.id}:${message.role}:${partSignature}`
		})
		.join("|")
}

type ChatMessagePart = ChatUIMessage["parts"][number]

function getPartSignature(part: ChatMessagePart): string {
	switch (part.type) {
		case "text":
		case "reasoning":
			return `${part.type}:${part.text.length}`
		case "source-url":
			return `${part.type}:${part.sourceId ?? part.url}`
		default:
			return `${part.type}:${"toolCallId" in part ? part.toolCallId : ""}`
	}
}

export function useDadAvatarInputPanel() {
	const [inputPanelRef, inputPanelBounds] = useMeasure({
		scroll: true,
		offsetSize: true,
	})

	return React.useMemo(
		() => ({
			inputPanelRef,
			inputPanelBounds,
		}),
		[inputPanelBounds, inputPanelRef],
	)
}

interface DadAvatarPosition {
	readonly left: number
	readonly top: number
	readonly width: number
	readonly height: number
}

interface DadAvatarPlacementArgs {
	readonly anchorBounds: RectReadOnly
	readonly inputPanelTop: number
	readonly viewportHeight: number | null
	readonly isEmptyConversation: boolean
}

interface DadAvatarPlacementResult {
	readonly position: DadAvatarPosition
	readonly isReady: boolean
}

function useDadAvatarPlacement({
	anchorBounds,
	inputPanelTop,
	isEmptyConversation,
	viewportHeight,
}: DadAvatarPlacementArgs): DadAvatarPlacementResult {
	const position = React.useMemo<DadAvatarPosition>(() => {
		const { left, width, height, top } = anchorBounds

		if (isEmptyConversation && viewportHeight !== null && height > 0) {
			const centeredTop = Math.max(0, (viewportHeight - height) / 2)

			return {
				left,
				width,
				height,
				top: centeredTop,
			}
		}

		const maxTop = inputPanelTop > 0 ? inputPanelTop - DAD_AVATAR_HEIGHT : Number.POSITIVE_INFINITY

		return {
			left,
			width,
			height,
			top: Math.min(top, maxTop),
		}
	}, [anchorBounds, inputPanelTop, isEmptyConversation, viewportHeight])

	const isReady = React.useMemo(() => {
		const hasSize = anchorBounds.width > 0 && anchorBounds.height > 0

		if (!hasSize) {
			return false
		}

		if (!isEmptyConversation) {
			return true
		}

		return viewportHeight !== null
	}, [anchorBounds.height, anchorBounds.width, isEmptyConversation, viewportHeight])

	return React.useMemo(
		() => ({
			position,
			isReady,
		}),
		[isReady, position],
	)
}

function useViewportHeight(onResize: () => void) {
	const [viewportHeight, setViewportHeight] = React.useState<number | null>(() =>
		typeof window === "undefined" ? null : window.innerHeight,
	)

	React.useEffect(() => {
		if (typeof window === "undefined") {
			return
		}

		const handleResize = () => {
			setViewportHeight(window.innerHeight)
			onResize()
		}

		handleResize()

		window.addEventListener("resize", handleResize)
		return () => {
			window.removeEventListener("resize", handleResize)
		}
	}, [onResize])

	return viewportHeight
}

interface DadAvatarPortalProps {
	readonly position: DadAvatarPosition
	readonly status: ChatStatus
	readonly isReady: boolean
	readonly isEmptyConversation: boolean
}

function DadAvatarPortal({ position, status, isReady, isEmptyConversation }: DadAvatarPortalProps) {
	if (typeof document === "undefined" || !isReady) {
		return null
	}

	return createPortal(
		<motion.div
			key="dad-avatar-portal"
			className="fixed pointer-events-none z-50"
			initial={{
				left: position.left,
				top: position.top,
				width: position.width,
				height: position.height,
				opacity: 0,
				filter: "blur(8px)",
				scale: 0.5,
			}}
			animate={{
				left: position.left,
				top: position.top,
				width: position.width,
				height: position.height,
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
			<DadAvatar state={status === "streaming" || status === "submitted" ? "thinking" : "idle"} className="h-20 w-20" />
		</motion.div>,
		document.body,
	)
}
