import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import think1 from "@/assets/think-1.png"
import think2 from "@/assets/think-2.png"
import think3 from "@/assets/think-3.png"
import think4 from "@/assets/think-4.png"
import think5 from "@/assets/think-5.png"

const thinkingFrames = [think1, think2, think3, think4, think5]

type DadAvatarProps = {
	thinking?: boolean
	className?: string
}

export const DadAvatar = ({ thinking = false, className }: DadAvatarProps) => {
	const [frameIndex, setFrameIndex] = useState(0)
	const [imagesLoaded, setImagesLoaded] = useState(false)
	const frameRef = useRef(0)
	const lastFrameTimeRef = useRef(0)
	const animationFrameIdRef = useRef<number | undefined>(undefined)

	// Preload all images
	useEffect(() => {
		const loadImages = async () => {
			const imagePromises = thinkingFrames.map((src) => {
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

	useEffect(() => {
		if (!thinking || !imagesLoaded) {
			setFrameIndex(0)
			frameRef.current = 0
			if (animationFrameIdRef.current) {
				cancelAnimationFrame(animationFrameIdRef.current)
			}
			return
		}

		// Frame duration in milliseconds (150ms = ~6.67 FPS)
		const frameDuration = 150

		const animate = (timestamp: number) => {
			if (!lastFrameTimeRef.current) {
				lastFrameTimeRef.current = timestamp
			}

			const elapsed = timestamp - lastFrameTimeRef.current

			if (elapsed >= frameDuration) {
				frameRef.current = (frameRef.current + 1) % thinkingFrames.length
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
	}, [thinking, imagesLoaded])

	return (
		<img
			src={thinkingFrames[frameIndex]}
			alt="Dad thinking"
			className={cn("h-24 w-auto", className)}
			style={{ imageRendering: "crisp-edges" }}
		/>
	)
}
