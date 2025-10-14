import type { ReactNode } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

type TopBarProps = {
	left?: ReactNode
	right?: ReactNode
}

export function TopBar({ left, right }: TopBarProps) {
	return (
		<div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
			<div className="container flex h-14 items-center justify-between px-4 max-w-screen-md mx-auto">
				<div className="flex items-center gap-4">{left}</div>
				<div className="flex items-center gap-4">
					{right}
					<ThemeToggle />
				</div>
			</div>
		</div>
	)
}
