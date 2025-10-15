"use client"

import * as React from "react"
import {
	CheckCircleIcon,
	ChevronDownIcon,
	CircleIcon,
	ClockIcon,
	WrenchIcon,
	XCircleIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import type { Transition } from "motion/react"
import type { ComponentProps, ReactNode } from "react"
import useMeasure from "react-use-measure"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { ToolUIPart } from "ai"
import { CodeBlock } from "./code-block"

export type ToolProps = ComponentProps<typeof Collapsible>

export const Tool = ({ className, ...props }: ToolProps) => (
	<Collapsible className={cn("not-prose mb-4 w-full rounded-md border", className)} {...props} />
)

export type ToolHeaderProps = {
	type: string
	state: ToolUIPart["state"]
	className?: string
}

const STATUS_META: Record<
	ToolUIPart["state"],
	{
		label: string
		Icon: typeof CircleIcon
		iconClassName?: string
	}
> = {
	"input-streaming": { label: "Pending", Icon: CircleIcon },
	"input-available": { label: "Running", Icon: ClockIcon },
	"output-available": {
		label: "Completed",
		Icon: CheckCircleIcon,
		iconClassName: "text-green-600",
	},
	"output-error": { label: "Error", Icon: XCircleIcon, iconClassName: "text-red-600" },
}

const HEADER_SPRING: Transition = {
	type: "spring",
	visualDuration: 0.3,
	bounce: 0.0,
}

export const ToolHeader = ({ className, type, state, ...props }: ToolHeaderProps) => {
	const isProcessing = state === "input-streaming" || state === "input-available"

	return (
		<CollapsibleTrigger
			className={cn(
				"relative flex w-full items-center justify-between gap-4 overflow-hidden p-3 cursor-pointer",
				className,
			)}
			{...props}
		>
			<motion.span
				className="pointer-events-none absolute inset-0 bg-primary/10"
				initial={{ opacity: 0 }}
				animate={isProcessing ? { opacity: [0.2, 0.55, 0.2] } : { opacity: 0 }}
				transition={
					isProcessing
						? { repeat: Infinity, repeatType: "reverse", duration: 1.4, ease: "easeInOut" }
						: { duration: 0.2, ease: "easeOut" }
				}
				aria-hidden="true"
			/>
			<div className="relative flex items-center gap-3">
				<WrenchIcon className="size-4 text-muted-foreground" />
				<span className="font-medium text-sm">{type}</span>
				<AnimatedStatusBadge state={state} />
			</div>
			<ChevronDownIcon className="relative size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
		</CollapsibleTrigger>
	)
}

export const ToolHeaderStatic = ({ className, type, state, ...props }: ToolHeaderProps) => {
	const isProcessing = state === "input-streaming" || state === "input-available"

	return (
		<div
			className={cn(
				"relative flex w-full items-center justify-between gap-4 overflow-hidden p-3",
				className,
			)}
			{...props}
		>
			<motion.span
				className="pointer-events-none absolute inset-0 bg-primary/10"
				initial={{ opacity: 0 }}
				animate={isProcessing ? { opacity: [0.2, 0.55, 0.2] } : { opacity: 0 }}
				transition={
					isProcessing
						? { repeat: Infinity, repeatType: "reverse", duration: 1.4, ease: "easeInOut" }
						: { duration: 0.2, ease: "easeOut" }
				}
				aria-hidden="true"
			/>
			<div className="relative flex items-center gap-3">
				<WrenchIcon className="size-4 text-muted-foreground" />
				<span className="font-medium text-sm">{type}</span>
				<AnimatedStatusBadge state={state} />
			</div>
		</div>
	)
}

const AnimatedStatusBadge = ({ state }: { readonly state: ToolUIPart["state"] }) => {
	const { label, Icon, iconClassName } = STATUS_META[state]
	const [ref, bounds] = useMeasure()

	return (
		<Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
			<AnimatePresence initial={false} mode="popLayout">
				<motion.span
					key={`status-icon-${state}`}
					className="flex items-center"
					initial={{ opacity: 0, scale: 0.85, filter: "blur(2px)" }}
					animate={{
						opacity: 1,
						scale: 1,
						filter: "blur(0px)",
						transition: HEADER_SPRING,
					}}
					exit={{
						opacity: 0,
						scale: 0.85,
						filter: "blur(2px)",
						transition: HEADER_SPRING,
					}}
				>
					<Icon className={cn("size-4", iconClassName)} />
				</motion.span>
			</AnimatePresence>
			<motion.div
				animate={{ width: bounds.width > 0 ? bounds.width : "auto" }}
				transition={HEADER_SPRING}
				className="overflow-hidden"
			>
				<div ref={ref} className="w-fit">
					<AnimatePresence mode="popLayout" initial={false}>
						{label.split("").map((letter, index) => (
							<motion.span
								key={`${state}-${index}-${letter}`}
								className="inline-block"
								initial={{ opacity: 0, filter: "blur(2px)" }}
								animate={{
									opacity: 1,
									filter: "blur(0px)",
									transition: {
										...HEADER_SPRING,
										delay: index * 0.015,
									},
								}}
								exit={{
									opacity: 0,
									filter: "blur(2px)",
									transition: HEADER_SPRING,
								}}
							>
								{letter === " " ? "\u00A0" : letter}
							</motion.span>
						))}
					</AnimatePresence>
				</div>
			</motion.div>
		</Badge>
	)
}

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
	<CollapsibleContent className={className} {...props} />
)

export type ToolInputProps = ComponentProps<"div"> & {
	input: ToolUIPart["input"]
}

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
	<div className={cn("space-y-2 overflow-hidden p-4", className)} {...props}>
		<h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
			Parameters
		</h4>
		<div className="rounded-md bg-muted/50">
			<CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
		</div>
	</div>
)

export type ToolOutputProps = ComponentProps<"div"> & {
	output: ReactNode
	errorText: ToolUIPart["errorText"]
}

export const ToolOutput = ({ className, output, errorText, ...props }: ToolOutputProps) => {
	if (!(output || errorText)) {
		return null
	}

	let Output = output as ReactNode

	if (!React.isValidElement(output)) {
		if (typeof output === "object") {
			Output = <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />
		} else if (typeof output === "string") {
			Output = <CodeBlock code={output} language="json" className="[&_code]:!whitespace-pre-wrap" />
		}
	}

	return (
		<div className={cn("space-y-2 p-4", className)} {...props}>
			<h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{errorText ? "Error" : "Result"}
			</h4>
			<div
				className={cn(
					"overflow-x-auto rounded-md text-xs [&_table]:w-full",
					errorText ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-foreground",
				)}
			>
				{errorText && <div>{errorText}</div>}
				{Output}
			</div>
		</div>
	)
}
