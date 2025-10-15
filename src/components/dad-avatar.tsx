import { cn } from "@/lib/utils"
import { Atom, Result, useAtom, useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import { Schedule, Stream } from "effect"
import { useEffect, useState } from "react"
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

const getFrames = (state: DadAnimationState) => {
	switch (state) {
		case "idle":
			return idleFrames
		case "thinking":
			return thinkingFrames
		case "laughing":
			return laughFrames
	}
}

const dadStateAtom = Atom.make<DadState>("idle")
const previousDadStateAtom = Atom.make<DadState>("idle")

/**
 * Singleton atom that manages the animation state stream.
 * Handles the thinking → laughing → idle transition automatically.
 */
const animationStateStreamAtom = Atom.make<DadAnimationState, never>((get) => {
	console.log("getting animation state stream")
	const currentDadState = get(dadStateAtom)
	const previousDadState = get(previousDadStateAtom)

	console.log("currentDadState", currentDadState)
	console.log("previousDadState", previousDadState)

	const wasThinking = previousDadState === "thinking"
	const isNowIdle = currentDadState === "idle"

	// Transition: thinking → laughing → idle
	if (wasThinking && isNowIdle) {
		return Stream.make("laughing" as DadAnimationState).pipe(
			Stream.concat(
				Stream.fromSchedule(Schedule.spaced(1000)).pipe(
					Stream.take(1),
					Stream.as("idle" as DadAnimationState),
				),
			),
		)
	}

	// Direct mapping: thinking stays thinking, idle stays idle
	const animationState: DadAnimationState = currentDadState === "thinking" ? "thinking" : "idle"
	return Stream.make(animationState)
})

const FPS = 6

/**
 * Singleton atom that emits frame indexes based on the current animation state.
 */
const frameIndexAtom = Atom.make((get) => {
	const animationState = Result.getOrElse(
		get(animationStateStreamAtom),
		() => "idle" as DadAnimationState,
	)
	const frameCount = getFrames(animationState).length

	// Create a stream that emits frame indexes at the correct FPS
	return Stream.fromSchedule(Schedule.spaced(1000 / FPS)).pipe(
		Stream.scan(0, (frame) => (frame + 1) % frameCount),
	)
}).pipe(Atom.map(Result.getOrElse(() => 0)))

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
	const [imagesLoaded, setImagesLoaded] = useState(false)
	const [dadState, setDadState] = useAtom(dadStateAtom)
	const setPreviousDadState = useAtomSet(previousDadStateAtom)

	// Update the singleton atoms when state changes
	useEffect(() => {
		if (dadState !== state) {
			console.log("setting state", state)
			setPreviousDadState(dadState)
			setDadState(state)
		}
	}, [state, dadState, setDadState, setPreviousDadState])

	// Get current animation state from singleton atoms
	const animationStateValue = useAtomValue(animationStateStreamAtom)
	const animationState = Result.getOrElse(animationStateValue, () => "idle" as DadAnimationState)
	const frameIndex = useAtomValue(frameIndexAtom)

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

	// Don't render until images are loaded
	if (!imagesLoaded) {
		return <div className={cn("h-24 w-auto", className)} />
	}
	const frames = getFrames(animationState)
	return (
		<div className="flex flex-col items-center justify-center">
			<div>DAD STATE: {dadState}</div>
			<div>ANIMATION STATE: {animationState}</div>
			<div>FRAME INDEX: {frameIndex}</div>
			<div>FRAMES: {frames.length}</div>
			<img
				src={frames[frameIndex]}
				alt={`Dad ${animationState}`}
				className={cn("h-24 w-auto", className)}
				style={{ imageRendering: "crisp-edges" }}
			/>
			<div className="text-sm text-gray-500">{animationState}</div>
		</div>
	)
}
