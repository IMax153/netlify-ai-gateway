"use client"

import { ToolHeaderStatic } from "@/components/ai-elements/tool"
import type { ChatUIMessage } from "@/lib/domain/chat-message"
import type * as UIMessage from "@/lib/domain/ui-message"

export type ToolCallProps = {
	readonly part: UIMessage.UIToolParts<UIMessage.Tools<typeof ChatUIMessage>>
}

export function ToolCall({ part }: ToolCallProps) {
	return (
		<div className="not-prose mb-4 w-full rounded-md border">
			<ToolHeaderStatic type={part.type.replace("tool-", "")} state={part.state} />
		</div>
	)
}
