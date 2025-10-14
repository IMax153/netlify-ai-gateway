import * as React from "react"
import { useFixtureSelect } from "react-cosmos/client"
import { ToolCall } from "./tool-call"
import type { ChatUIMessage } from "@/lib/domain/chat-message"
import type * as UIMessage from "@/lib/domain/ui-message"

type ToolState = UIMessage.UIToolParts<UIMessage.Tools<typeof ChatUIMessage>>["state"]

const TOOL_STATES: ToolState[] = [
	"input-streaming",
	"input-available",
	"output-available",
	"output-error",
]

function createToolPart(
	state: ToolState,
	options: {
		toolName?: string
		input?: unknown
		output?: unknown
		errorText?: string
	} = {},
): UIMessage.UIToolParts<UIMessage.Tools<typeof ChatUIMessage>> {
	const toolName = options.toolName ?? "GetDadJoke"
	const base = {
		type: `tool-${toolName}` as const,
		toolCallId: "demo-tool-call",
		input: options.input ?? { topic: "programming" },
	}

	switch (state) {
		case "input-streaming":
			return {
				...base,
				state: "input-streaming" as const,
			}
		case "input-available":
			return {
				...base,
				state: "input-available" as const,
			}
		case "output-error":
			return {
				...base,
				state: "output-error" as const,
				errorText: options.errorText ?? "Unable to fetch a joke right now.",
			}
		case "output-available":
		default:
			return {
				...base,
				state: "output-available" as const,
				output:
					options.output ??
					({
						joke: "Why do programmers prefer dark mode? Because light attracts bugs!",
					} as any),
			}
	}
}

function InteractivePlayground() {
	const [state, setState] = useFixtureSelect("state", {
		options: TOOL_STATES,
		defaultValue: "output-available",
	})

	const [toolName] = useFixtureSelect("toolName", {
		options: ["GetDadJoke", "GetWeather", "SearchWeb", "CalculateSum"],
		defaultValue: "GetDadJoke",
	})

	const [isOpen] = useFixtureSelect("collapsed", {
		options: [true, false],
		defaultValue: true,
	})

	// Keyboard shortcuts to cycle through states
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in an input
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return
			}

			const currentIndex = TOOL_STATES.indexOf(state)

			if (e.key === "ArrowRight" || e.key === "ArrowDown") {
				e.preventDefault()
				const nextIndex = (currentIndex + 1) % TOOL_STATES.length
				setState(TOOL_STATES[nextIndex])
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
				e.preventDefault()
				const prevIndex = (currentIndex - 1 + TOOL_STATES.length) % TOOL_STATES.length
				setState(TOOL_STATES[prevIndex])
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [state, setState])

	return (
		<div className="w-full max-w-2xl space-y-4">
			{/* Quick state switcher */}
			<div className="rounded-lg border border-border bg-card p-4">
				<div className="mb-2 flex items-center justify-between">
					<h3 className="text-sm font-medium text-muted-foreground">Quick Switch States</h3>
					<span className="text-xs text-muted-foreground">Use ← → arrow keys</span>
				</div>
				<div className="flex flex-wrap gap-2">
					{TOOL_STATES.map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => setState(s)}
							className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
								s === state
									? "bg-primary text-primary-foreground"
									: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
							}`}
						>
							{s.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
						</button>
					))}
				</div>
			</div>

			<ToolCall
				part={createToolPart(state, { toolName })}
				collapsibleProps={{ defaultOpen: isOpen }}
			/>
		</div>
	)
}

export default {
	Playground: <InteractivePlayground />,

	"Input Streaming": (
		<div className="w-full max-w-2xl">
			<ToolCall
				part={createToolPart("input-streaming")}
				collapsibleProps={{ defaultOpen: true }}
			/>
		</div>
	),

	"Input Available": (
		<div className="w-full max-w-2xl">
			<ToolCall
				part={createToolPart("input-available")}
				collapsibleProps={{ defaultOpen: true }}
			/>
		</div>
	),

	"Output Available": (
		<div className="w-full max-w-2xl">
			<ToolCall
				part={createToolPart("output-available")}
				collapsibleProps={{ defaultOpen: true }}
			/>
		</div>
	),

	"Output Error": (
		<div className="w-full max-w-2xl">
			<ToolCall
				part={createToolPart("output-error")}
				collapsibleProps={{ defaultOpen: true }}
			/>
		</div>
	),

	"Complex Input": (
		<div className="w-full max-w-2xl">
			<ToolCall
				part={createToolPart("output-available", {
					input: {
						topic: "artificial intelligence",
						tone: "sarcastic",
						maxLength: 100,
						includeEmoji: true,
					},
					output: {
						joke: "Why did the neural network go to therapy? It had too many issues with its layers! 😅",
					},
				})}
				collapsibleProps={{ defaultOpen: true }}
			/>
		</div>
	),

	"Long Error Message": (
		<div className="w-full max-w-2xl">
			<ToolCall
				part={createToolPart("output-error", {
					errorText:
						"Failed to fetch joke from ICanHazDadJoke API: Network timeout after 5000ms. The service may be temporarily unavailable. Please try again later or check your network connection.",
				})}
				collapsibleProps={{ defaultOpen: true }}
			/>
		</div>
	),

	"Different Tool - Weather": (
		<div className="w-full max-w-2xl">
			<ToolCall
				part={createToolPart("output-available", {
					toolName: "GetWeather",
					input: { location: "San Francisco, CA", units: "fahrenheit" },
					output: {
						temperature: 68,
						conditions: "Partly Cloudy",
						humidity: 65,
						windSpeed: 12,
					},
				})}
				collapsibleProps={{ defaultOpen: true }}
			/>
		</div>
	),

	Collapsed: (
		<div className="w-full max-w-2xl">
			<ToolCall
				part={createToolPart("output-available")}
				collapsibleProps={{ defaultOpen: false }}
			/>
		</div>
	),
}
