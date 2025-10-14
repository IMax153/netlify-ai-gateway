import { cn } from "@/lib/utils"
import { DadAvatar } from "@/components/dad-avatar"
import type { HTMLAttributes } from "react"

export type LoaderProps = HTMLAttributes<HTMLDivElement>

export const Loader = ({ className, ...props }: LoaderProps) => (
	<div
		className={cn("flex w-full items-end justify-end gap-2 py-4 flex-row-reverse", className)}
		{...props}
	>
		<DadAvatar className="h-10" thinking />
	</div>
)
