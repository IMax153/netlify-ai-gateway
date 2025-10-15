import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import idle1 from "@/assets/idle-1.png"
import idle2 from "@/assets/idle-2.png"
import idle3 from "@/assets/idle-3.png"
import idle4 from "@/assets/idle-4.png"
import idle5 from "@/assets/idle-5.png"
import idle6 from "@/assets/idle-6.png"
import laugh1 from "@/assets/laugh-1.png"
import laugh2 from "@/assets/laugh-2.png"
import laugh3 from "@/assets/laugh-3.png"
import laugh4 from "@/assets/laugh-4.png"
import laugh5 from "@/assets/laugh-5.png"
import think1 from "@/assets/think-1.png"
import think2 from "@/assets/think-2.png"
import think3 from "@/assets/think-3.png"
import think4 from "@/assets/think-4.png"
import think5 from "@/assets/think-5.png"

const idleFrames = [idle1, idle2, idle3, idle4, idle5, idle6]
const laughFrames = [laugh1, laugh2, laugh3, laugh4, laugh5]
const thinkingFrames = [think1, think2, think3, think4, think5]
const allFrames = [...idleFrames, ...laughFrames, ...thinkingFrames]

export type DadState = "idle" | "thinking"

type DadAnimationState = "idle" | "thinking" | "laughing"

type DadAvatarProps = {
	state?: DadState
	className?: string
}

/**
 * Dad Avatar component with three animated states:
 * - thinking: Actively thinking (shows thinking animation)
 * - laughing: Transitional state when finishing thinking (shows laugh animation then goes to idle)
 * - idle: Resting state (shows idle animation)
 *
 * When state changes from "thinking" to "idle", it automatically plays the laugh animation
 * for 1 second before settling into the idle animation.
 */
export const DadAvatar = ({ state = "idle", className }: DadAvatarProps) => {
	const [frameIndex, setFrameIndex] = useState(0)
	const [imagesLoaded, setImagesLoaded] = useState(false)
	const [animationState, setAnimationState] = useState<DadAnimationState>("idle")
	const frameRef = useRef(0)
	const lastFrameTimeRef = useRef(0)
	const animationFrameIdRef = useRef<number | undefined>(undefined)
	const previousStateRef = useRef<DadState>(state)

	// Preload all images
	useEffect(() => {
		const loadImages = async () => {
			const imagePromises = allFrames.map((src) => {
				return new Promise((resolve, reject) => {
					const img = new Image()
					img.onload = resolve
					img.onerror = reject
					img.src = src
				})
			})

			try {
				await Promise.all(imagePromises)
				setImagesLoaded(true)
			} catch (error) {
				console.error("Failed to preload images:", error)
				setImagesLoaded(true) // Still try to show the images
			}
		}

		loadImages()
	}, [])

	// Handle state transitions with laugh animation
	useEffect(() => {
		const wasThinking = previousStateRef.current === "thinking"
		const isNowIdle = state === "idle"

		if (wasThinking && isNowIdle) {
			// Transition: thinking -> laughing -> idle
			setAnimationState("laughing")
			const timer = setTimeout(() => {
				setAnimationState("idle")
			}, 1000)

			previousStateRef.current = state
			return () => clearTimeout(timer)
		}

		// Direct state change (no laugh transition needed)
		if (state === "thinking") {
			setAnimationState("thinking")
		} else {
			// Go directly to idle (no previous thinking state)
			setAnimationState("idle")
		}

		previousStateRef.current = state
	}, [state])

	// Animation loop
	useEffect(() => {
		if (!imagesLoaded) {
			return
		}

		// Reset frame when animation state changes
		setFrameIndex(0)
		frameRef.current = 0
		lastFrameTimeRef.current = 0

		// Get current frames based on animation state
		const currentFrames =
			animationState === "idle"
				? idleFrames
				: animationState === "thinking"
					? thinkingFrames
					: laughFrames

		// Frame duration (idle: slower at ~3 FPS, thinking/laughing: faster at ~6.67 FPS)
		const frameDuration = animationState === "idle" ? 333 : 150

		const animate = (timestamp: number) => {
			if (!lastFrameTimeRef.current) {
				lastFrameTimeRef.current = timestamp
			}

			const elapsed = timestamp - lastFrameTimeRef.current

			if (elapsed >= frameDuration) {
				frameRef.current = (frameRef.current + 1) % currentFrames.length
				setFrameIndex(frameRef.current)
				lastFrameTimeRef.current = timestamp
			}

			animationFrameIdRef.current = requestAnimationFrame(animate)
		}

		animationFrameIdRef.current = requestAnimationFrame(animate)

		return () => {
			if (animationFrameIdRef.current) {
				cancelAnimationFrame(animationFrameIdRef.current)
			}
			lastFrameTimeRef.current = 0
		}
	}, [animationState, imagesLoaded])

	// Get current frame source
	const currentFrames =
		animationState === "idle"
			? idleFrames
			: animationState === "thinking"
				? thinkingFrames
				: laughFrames

	return (
		<img
			src={currentFrames[frameIndex]}
			alt={`Dad ${animationState}`}
			className={cn("h-24 w-auto", className)}
			style={{ imageRendering: "crisp-edges" }}
		/>
	)
}
