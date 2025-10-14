import type { ReactNode } from "react"
import { useEffect } from "react"
import "./src/styles/root.css"

export default function CosmosDecorator({ children }: { children: ReactNode }) {
	useEffect(() => {
		// Set dark mode by default
		document.documentElement.classList.add("dark")
	}, [])

	return <div className="min-h-screen bg-background font-sans antialiased">{children}</div>
}
