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
import { preloadImages } from "@/lib/image-cache"

export const allDadImages = {
	idle: [idle1, idle2, idle3, idle4, idle5, idle6],
	thinking: [think1, think2, think3, think4, think5],
	laughing: [laugh1, laugh2, laugh3, laugh4, laugh5],
} as const

export const allBabyImages = ["/baby-1.png", "/baby-2.png", "/baby-3.png"] as const

/**
 * Preloads all avatar images (dad + baby) to prevent repeated network requests.
 * Uses a global image cache to store references and prevent garbage collection.
 *
 * This hook can be called from multiple components - the global cache ensures
 * images are only loaded once and references are preserved.
 */
export function useAvatarImagesPreloader() {
	const [isLoaded, setIsLoaded] = useState(false)

	useEffect(() => {
		const allImages = [
			...allDadImages.idle,
			...allDadImages.thinking,
			...allDadImages.laughing,
			...allBabyImages,
		]

		preloadImages(allImages)
			.then(() => {
				setIsLoaded(true)
			})
			.catch((error) => {
				console.error("Failed to preload avatar images:", error)
				setIsLoaded(true) // Still mark as loaded to prevent hanging
			})
	}, [])

	return { isLoaded, dadImages: allDadImages, babyImages: allBabyImages }
}
