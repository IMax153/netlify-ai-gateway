"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

const babyFrames = ["/baby-1.png", "/baby-2.png", "/baby-3.png"]

const FPS = 1

type BabyAvatarProps = {
	className?: string
}

/**
 * Baby Avatar component that cycles through 3 baby images at low frame rate
 */
export const BabyAvatar = ({ className }: BabyAvatarProps) => {
	const [frameIndex, setFrameIndex] = useState(0)
	const [imagesLoaded, setImagesLoaded] = useState(false)

	// Preload all images
	useEffect(() => {
		const loadImages = async () => {
			const imagePromises = babyFrames.map((src) => {
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
				console.error("Failed to preload baby images:", error)
				setImagesLoaded(true) // Still try to show the images
			}
		}

		loadImages()
	}, [])

	// Cycle through frames at FPS rate
	useEffect(() => {
		if (!imagesLoaded) return

		const interval = setInterval(() => {
			setFrameIndex((prev) => (prev + 1) % babyFrames.length)
		}, 1000 / FPS)

		return () => clearInterval(interval)
	}, [imagesLoaded])

	// Don't render until images are loaded
	if (!imagesLoaded) {
		return <div className={cn("h-16 w-auto", className)} />
	}

	return (
		<img
			src={babyFrames[frameIndex]}
			alt="Baby avatar"
			className={cn("h-16 w-auto shrink-0 object-contain", className)}
			style={{ imageRendering: "crisp-edges" }}
		/>
	)
}
