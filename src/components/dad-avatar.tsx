"use client"

import { Atom, Result, useAtom, useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import { Schedule, Stream } from "effect"
import { useEffect } from "react"
import { allDadImages } from "@/hooks/use-dad-images-preloader"
import { cn } from "@/lib/utils"

const idleFrames = allDadImages.idle
const laughFrames = allDadImages.laughing
const thinkingFrames = allDadImages.thinking

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

	const frames = getFrames(animationState)
	return (
		<img
			src={frames[frameIndex]}
			alt={`Dad ${animationState}`}
			className={cn("h-24 w-auto", className)}
			style={{ imageRendering: "crisp-edges" }}
		/>
	)
}
