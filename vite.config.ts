import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	ssr: { noExternal: ["streamdown"] },
	server: {
		port: 3000,
	},
	plugins: [
		tsConfigPaths(),
		tanstackStart({
			customViteReactPlugin: true,
			target: "netlify",
		}),
		viteReact(),
		tailwindcss(),
	],
})
