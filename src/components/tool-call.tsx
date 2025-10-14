"use client"

import { AnimatePresence, motion } from "motion/react"
import type { Transition } from "motion/react"
import type { ComponentProps } from "react"
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool"
import type { ChatUIMessage } from "@/lib/domain/chat-message"
import type * as UIMessage from "@/lib/domain/ui-message"

const SPRING: Transition & { visualDuration: number } = {
	type: "spring",
	visualDuration: 0.5,
	bounce: 0,
}

export type ToolCallProps = {
	readonly part: UIMessage.UIToolParts<UIMessage.Tools<typeof ChatUIMessage>>
	readonly collapsibleProps?: ComponentProps<typeof Tool>
}

export function ToolCall({ part, collapsibleProps }: ToolCallProps) {
	const processingState =
		part.state === "input-streaming" || part.state === "input-available" ? part.state : null
	const hasResult = part.state === "output-available" || part.state === "output-error"

	return (
		<Tool defaultOpen={false} {...collapsibleProps}>
			<ToolHeader type={part.type.replace("tool-", "")} state={part.state} />
			<ToolContent>
				<ToolInput input={part.input} />
				<AnimatePresence mode="popLayout">
					{processingState && (
						<motion.div
							key="tool-processing"
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 6 }}
							transition={SPRING}
						>
							<ToolProcessing state={processingState} />
						</motion.div>
					)}
					{hasResult && (
						<motion.div
							key="tool-result"
							initial={{ opacity: 0, scale: 0.97 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.98 }}
							transition={SPRING}
						>
							<ToolOutput
								errorText={part.state === "output-error" ? part.errorText : undefined}
								output={part.state === "output-available" ? (part.output as any) : undefined}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</ToolContent>
		</Tool>
	)
}

function ToolProcessing({ state }: { readonly state: "input-streaming" | "input-available" }) {
	const statusMessage =
		state === "input-streaming"
			? "Preparing call parameters..."
			: "Running tool and waiting for output..."

	return (
		<div className="relative">
			<motion.div
				className="pointer-events-none absolute inset-0 rounded-lg bg-muted/60"
				animate={{ opacity: [0.3, 0.55, 0.3] }}
				transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
			/>
			<div className="relative space-y-4 rounded-lg border border-muted/40 bg-background/90 p-4 text-xs text-muted-foreground shadow-sm">
				<h4 className="font-medium uppercase tracking-wide text-[0.65rem]">Processing</h4>
				<p>{statusMessage}</p>
				<div className="flex items-center gap-2">
					{[0, 1, 2].map((index) => (
						<motion.span
							// eslint-disable-next-line react/no-array-index-key
							key={index}
							className="h-2 w-2 rounded-full bg-muted-foreground/70"
							animate={{ scale: [0.85, 1.3, 0.85], opacity: [0.4, 1, 0.4] }}
							transition={{
								repeat: Infinity,
								duration: 1.1,
								ease: "easeInOut",
								delay: index * 0.15,
							}}
						/>
					))}
				</div>
				<motion.div
					layout
					className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50"
					aria-hidden="true"
				>
					<motion.div
						className="absolute inset-y-0 w-1/2 rounded-full bg-muted-foreground/70"
						animate={{ x: ["-100%", "100%"] }}
						transition={{ repeat: Infinity, duration: 1.3, ease: "linear" }}
					/>
				</motion.div>
			</div>
		</div>
	)
}
