import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export type LoaderProps = HTMLAttributes<HTMLDivElement>

export const Loader = ({ className, ...props }: LoaderProps) => (
	<div
		className={cn("flex w-full items-end justify-end gap-2 py-4 flex-row-reverse", className)}
		{...props}
	>
		<div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
		<div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.2s]" />
		<div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.4s]" />
	</div>
)
