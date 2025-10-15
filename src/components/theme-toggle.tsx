import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme()

	return (
		<Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 cursor-pointer">
			{theme === "light" ? (
				<Moon className="h-4 w-4 transition-all" />
			) : (
				<Sun className="h-4 w-4 transition-all" />
			)}
			<span className="sr-only">Toggle theme</span>
		</Button>
	)
}
