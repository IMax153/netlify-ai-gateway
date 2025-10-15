"use client"

import { useEffect, useState } from "react"
import { allBabyImages } from "@/hooks/use-dad-images-preloader"
import { cn } from "@/lib/utils"

const FPS = 1

type BabyAvatarProps = {
	className?: string
}

/**
 * Baby Avatar component that cycles through 3 baby images at low frame rate
 */
export const BabyAvatar = ({ className }: BabyAvatarProps) => {
	const [frameIndex, setFrameIndex] = useState(0)

	// Cycle through frames at FPS rate
	useEffect(() => {
		const interval = setInterval(() => {
			setFrameIndex((prev) => (prev + 1) % allBabyImages.length)
		}, 1000 / FPS)

		return () => clearInterval(interval)
	}, [])

	return (
		<img
			src={allBabyImages[frameIndex]}
			alt="Baby avatar"
			className={cn("h-16 w-auto shrink-0 object-contain", className)}
			style={{ imageRendering: "crisp-edges" }}
		/>
	)
}
