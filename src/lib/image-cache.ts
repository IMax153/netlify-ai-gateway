/**
 * Global image cache to prevent repeated network requests for preloaded images.
 *
 * The key insight: Image() objects must be stored in a persistent reference
 * to prevent garbage collection. Otherwise, the browser will re-request images
 * even after they've been "preloaded", causing repeated 304 requests.
 */

// Global cache to store Image references
const imageCache = new Map<string, HTMLImageElement>()

// Singleton promise to ensure preloading only happens once
let preloadPromise: Promise<void> | null = null

/**
 * Preloads an array of image sources and stores them in the global cache.
 * Returns a Promise that resolves when all images are loaded.
 *
 * This function is idempotent - calling it multiple times will return
 * the same promise and only preload images once.
 */
export function preloadImages(sources: string[]): Promise<void> {
	// If we've already started preloading, return the existing promise
	if (preloadPromise !== null) {
		return preloadPromise
	}

	preloadPromise = new Promise((resolve, reject) => {
		const promises = sources.map((src) => {
			// Skip if already cached
			if (imageCache.has(src)) {
				return Promise.resolve()
			}

			return new Promise<void>((resolveImage, rejectImage) => {
				const img = new Image()
				img.onload = () => {
					// Store the Image object to prevent garbage collection
					imageCache.set(src, img)
					resolveImage()
				}
				img.onerror = () => {
					console.error(`Failed to preload image: ${src}`)
					// Still resolve to avoid blocking other images
					resolveImage()
				}
				img.src = src
			})
		})

		Promise.all(promises)
			.then(() => resolve())
			.catch(reject)
	})

	return preloadPromise
}

/**
 * Checks if an image has been cached.
 */
export function isImageCached(src: string): boolean {
	return imageCache.has(src)
}

/**
 * Gets the number of cached images.
 */
export function getCacheSize(): number {
	return imageCache.size
}

/**
 * Clears the image cache. Use with caution - primarily for testing.
 */
export function clearImageCache(): void {
	imageCache.clear()
	preloadPromise = null
}
