/// <reference types="vite/client" />
import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useLocation,
} from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ThemeProvider, useTheme } from "@/components/theme-provider"
import { TopBar } from "@/components/top-bar"

import appCss from "../styles/root.css?url"

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Dadbot" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootComponent,
})

function RootComponent() {
	const location = useLocation()
	const isOnChatPage = location.pathname === "/chat"

	return (
		<ThemeProvider>
			<RootDocument>
				<TopBar
					left={<h2 className="font-semibold">Dadbot</h2>}
					right={
						<Button size="sm" variant="ghost" className="text-sm cursor-pointer" asChild>
							{isOnChatPage ? <Link to="/">Home</Link> : <Link to="/chat">Go to chat</Link>}
						</Button>
					}
				/>
				<Outlet />
			</RootDocument>
		</ThemeProvider>
	)
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	const { theme } = useTheme()

	return (
		<html lang="en" className={theme}>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	)
}
