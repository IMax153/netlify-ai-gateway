import { createFileRoute, Link } from "@tanstack/react-router"
import * as React from "react"
import { ToolCall } from "@/components/tool-call"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ChatUIMessage } from "@/lib/domain/chat-message"
import type * as UIMessage from "@/lib/domain/ui-message"

const TOOL_STATES = [
	{ value: "input-streaming", label: "Input Streaming" },
	{ value: "input-available", label: "Input Available" },
	{ value: "output-available", label: "Output Available" },
	{ value: "output-error", label: "Output Error" },
] satisfies ReadonlyArray<{ value: ToolState; label: string }>

type ToolState = UIMessage.UIToolParts<UIMessage.Tools<typeof ChatUIMessage>>["state"]

const TOOL_STATE_VALUES = TOOL_STATES.map((option) => option.value) as ToolState[]

const cycleToolState = (current: ToolState, direction: "next" | "previous"): ToolState => {
	const currentIndex = TOOL_STATE_VALUES.indexOf(current)
	const safeIndex = currentIndex === -1 ? 0 : currentIndex
	const offset = direction === "next" ? 1 : -1
	const nextIndex = (safeIndex + offset + TOOL_STATE_VALUES.length) % TOOL_STATE_VALUES.length
	return TOOL_STATE_VALUES[nextIndex]
}

export const Route = createFileRoute("/tool-preview")({
	component: RouteComponent,
})

function RouteComponent() {
	const [toolName, setToolName] = React.useState("GetDadJoke")
	const [toolState, setToolState] = React.useState<ToolState>("input-streaming")
	const [inputText, setInputText] = React.useState('{"topic":"programming"}')
	const [outputText, setOutputText] = React.useState(
		JSON.stringify(
			{
				joke: "Why do programmers prefer dark mode? Because light attracts bugs!",
			},
			null,
			2,
		),
	)
	const [errorText, setErrorText] = React.useState("Unable to fetch a joke right now.")

	const parsedInput = React.useMemo(() => safeParse(inputText), [inputText])
	const parsedOutput = React.useMemo(() => safeParse(outputText), [outputText])

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
				return
			}

			const target = event.target as HTMLElement | null
			if (
				target &&
				(target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
			) {
				return
			}

			event.preventDefault()
			setToolState((current) =>
				cycleToolState(current, event.key === "ArrowRight" ? "next" : "previous"),
			)
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [])

	const part = React.useMemo(() => {
		const safeToolName = toolName.trim() === "" ? "PreviewTool" : toolName.trim()
		const base = {
			type: `tool-${safeToolName}` as const,
			toolCallId: "demo-tool-call",
			input: parsedInput.value,
		}

		switch (toolState) {
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
					errorText,
				}
			case "output-available":
			default:
				return {
					...base,
					state: "output-available" as const,
					output: parsedOutput.value,
				}
		}
	}, [toolState, toolName, errorText, parsedInput, parsedOutput])

	return (
		<div className="min-h-screen w-full bg-background py-10">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6">
				<section className="space-y-3">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="text-lg font-semibold tracking-wide text-muted-foreground">
								Tool Call Playground
							</h1>
							<p className="text-sm text-muted-foreground/80">
								Inspect motion and state transitions without triggering a live AI flow.
							</p>
						</div>
						<div className="flex gap-2">
							<Button asChild variant="outline" size="sm">
								<Link to="/">Home</Link>
							</Button>
							<Button asChild size="sm">
								<Link to="/chat">Chat</Link>
							</Button>
						</div>
					</div>
				</section>

				<section className="space-y-3">
					<div>
						<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
							Live Preview
						</h2>
						<p className="text-xs text-muted-foreground/80">
							The component below uses the same implementation that powers the chat tool calls.
						</p>
					</div>
					<ToolCall
						part={part as UIMessage.UIToolParts<UIMessage.Tools<typeof ChatUIMessage>>}
						collapsibleProps={{ defaultOpen: true }}
					/>
				</section>

				<section className="space-y-3">
					<div>
						<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
							Controls
						</h2>
						<p className="text-xs text-muted-foreground/80">
							Swap states, update payloads, or preview error output.
						</p>
					</div>
					<ControlsCard
						toolName={toolName}
						onToolNameChange={setToolName}
						toolState={toolState}
						onToolStateChange={setToolState}
						inputText={inputText}
						onInputTextChange={setInputText}
						outputText={outputText}
						onOutputTextChange={setOutputText}
						errorText={errorText}
						onErrorTextChange={setErrorText}
						parsedInputError={parsedInput.error}
						parsedOutputError={parsedOutput.error}
					/>
				</section>
			</div>
		</div>
	)
}

type ControlsCardProps = {
	readonly toolName: string
	readonly onToolNameChange: (value: string) => void
	readonly toolState: ToolState
	readonly onToolStateChange: (value: ToolState) => void
	readonly inputText: string
	readonly onInputTextChange: (value: string) => void
	readonly outputText: string
	readonly onOutputTextChange: (value: string) => void
	readonly errorText: string
	readonly onErrorTextChange: (value: string) => void
	readonly parsedInputError: string | null
	readonly parsedOutputError: string | null
}

function ControlsCard({
	toolName,
	onToolNameChange,
	toolState,
	onToolStateChange,
	inputText,
	onInputTextChange,
	outputText,
	onOutputTextChange,
	errorText,
	onErrorTextChange,
	parsedInputError,
	parsedOutputError,
}: ControlsCardProps) {
	const cycleState = React.useCallback(
		(direction: "next" | "previous") => {
			onToolStateChange(cycleToolState(toolState, direction))
		},
		[toolState, onToolStateChange],
	)

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">Tool Call Controls</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					<label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Tool Name
					</label>
					<Input
						value={toolName}
						onChange={(event) => onToolNameChange(event.target.value)}
						placeholder="GetDadJoke"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						State
					</label>
					<div className="flex flex-wrap items-center gap-2">
						<Button variant="outline" size="sm" type="button" onClick={() => cycleState("previous")}>
							← Prev
						</Button>
						{TOOL_STATES.map((option) => (
							<Button
								key={option.value}
								variant={toolState === option.value ? "default" : "outline"}
								size="sm"
								onClick={() => onToolStateChange(option.value)}
								type="button"
							>
								{option.label}
							</Button>
						))}
						<Button variant="outline" size="sm" type="button" onClick={() => cycleState("next")}>
							Next →
						</Button>
					</div>
				</div>

				<TextareaConfig
					label="Input Payload"
					value={inputText}
					onChange={onInputTextChange}
					error={parsedInputError}
					placeholder='{"topic":"programming"}'
				/>

				{toolState === "output-available" && (
					<TextareaConfig
						label="Output Payload"
						value={outputText}
						onChange={onOutputTextChange}
						error={parsedOutputError}
						placeholder='{"joke":"..."}'
					/>
				)}

				{toolState === "output-error" && (
					<div className="space-y-2">
						<label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Error Text
						</label>
						<Textarea
							value={errorText}
							onChange={(event) => onErrorTextChange(event.target.value)}
							rows={3}
							className="font-mono text-xs"
						/>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

type TextareaConfigProps = {
	readonly label: string
	readonly value: string
	readonly onChange: (value: string) => void
	readonly error: string | null
	readonly placeholder: string
}

function TextareaConfig({ label, value, onChange, error, placeholder }: TextareaConfigProps) {
	return (
		<div className="space-y-2">
			<label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</label>
			<Textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				rows={6}
				className="font-mono text-xs"
				placeholder={placeholder}
			/>
			<div className="text-xs text-muted-foreground">
				{error ? (
					<span className="text-destructive">Invalid JSON. Rendering as plain text.</span>
				) : (
					<span>Valid JSON payload.</span>
				)}
			</div>
		</div>
	)
}

function safeParse(value: string): { value: unknown; error: string | null } {
	try {
		return { value: JSON.parse(value), error: null }
	} catch {
		return { value, error: "Unable to parse JSON" }
	}
}
