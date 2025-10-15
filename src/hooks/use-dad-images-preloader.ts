import { useEffect, useState } from "react"
import idle1 from "@/assets/idle-1.png"
import idle2 from "@/assets/idle-2.png"
import idle3 from "@/assets/idle-3.png"
import think1 from "@/assets/think-1.png"
import think2 from "@/assets/think-2.png"
import think3 from "@/assets/think-3.png"
import think4 from "@/assets/think-4.png"
import think5 from "@/assets/think-5.png"
import laugh1 from "@/assets/laugh-1.png"
import laugh2 from "@/assets/laugh-2.png"
import laugh3 from "@/assets/laugh-3.png"
import laugh4 from "@/assets/laugh-4.png"
import laugh5 from "@/assets/laugh-5.png"

export const allDadImages = {
	idle: [idle1, idle2, idle3],
	thinking: [think1, think2, think3, think4, think5],
	laughing: [laugh1, laugh2, laugh3, laugh4, laugh5],
} as const

/**
 * Preloads all dad avatar images to prevent white flashes during state transitions.
 * Uses the browser's Image() constructor to force loading and caching.
 */
export function useDadImagesPreloader() {
	const [isLoaded, setIsLoaded] = useState(false)

	useEffect(() => {
		const allImages = [...allDadImages.idle, ...allDadImages.thinking, ...allDadImages.laughing]

		let loadedCount = 0
		const total = allImages.length

		const checkAllLoaded = () => {
			loadedCount++
			if (loadedCount === total) {
				setIsLoaded(true)
			}
		}

		// Preload all images
		allImages.forEach((src) => {
			const img = new Image()
			img.onload = checkAllLoaded
			img.onerror = checkAllLoaded // Still mark as "loaded" even on error to prevent hanging
			img.src = src
		})
	}, [])

	return { isLoaded, images: allDadImages }
}
