import { useCallback, useEffect, useRef, useState } from "react"

type SoundType = "greeting" | "think" | "laugh"

const soundFiles: Record<SoundType, string[]> = {
	greeting: [
		"/sounds/greeting-1.mp3",
		"/sounds/greeting-2.mp3",
		"/sounds/greeting-3.mp3",
		"/sounds/greeting-4.mp3",
	],
	think: [
		"/sounds/think-1.mp3",
		"/sounds/think-2.mp3",
		"/sounds/think-3.mp3",
		"/sounds/think-4.mp3",
	],
	laugh: [
		"/sounds/laugh-1.mp3",
		"/sounds/laugh-2.mp3",
		"/sounds/laugh-3.mp3",
		"/sounds/laugh-4.mp3",
	],
}

const VOLUME_STORAGE_KEY = "dadbot-sounds-enabled"

export function useSounds() {
	const [enabled, setEnabled] = useState(() => {
		if (typeof window === "undefined") return true
		const stored = localStorage.getItem(VOLUME_STORAGE_KEY)
		return stored === null ? true : stored === "true"
	})

	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem(VOLUME_STORAGE_KEY, String(enabled))
		}
	}, [enabled])

	const playSound = useCallback(
		(type: SoundType) => {
			if (!enabled) return

			// Stop any currently playing sound
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current.currentTime = 0
			}

			// Pick a random sound from the type
			const sounds = soundFiles[type]
			const randomSound = sounds[Math.floor(Math.random() * sounds.length)]

			// Create and play new audio
			const audio = new Audio(randomSound)
			audioRef.current = audio
			audio.volume = 0.35 // Set default volume to 35% (70% of original 50%)
			audio.play().catch((error) => {
				console.warn(`Failed to play ${type} sound:`, error)
			})
		},
		[enabled],
	)

	const toggleEnabled = useCallback(() => {
		setEnabled((prev) => !prev)
	}, [])

	return {
		enabled,
		toggleEnabled,
		playSound,
	}
}
