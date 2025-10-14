import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

type Theme = "light" | "dark"

type ThemeProviderProps = {
	children: ReactNode
	defaultTheme?: Theme
}

type ThemeContextType = {
	theme: Theme
	setTheme: (theme: Theme) => void
	toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children, defaultTheme = "dark" }: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(defaultTheme)

	useEffect(() => {
		const storedTheme = localStorage.getItem("theme") as Theme | null
		if (storedTheme) {
			setThemeState(storedTheme)
		}
	}, [])

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme)
		localStorage.setItem("theme", newTheme)
	}

	const toggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light")
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider")
	}
	return context
}
