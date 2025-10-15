"use client"

import * as React from "react"
import {
	PromptInput,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	type PromptInputMessage,
	PromptInputModelSelect,
	PromptInputModelSelectContent,
	PromptInputModelSelectItem,
	PromptInputModelSelectTrigger,
	PromptInputModelSelectValue,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import type { ChatModelOption, ChatStatus } from "./types"

export interface ChatInputPanelProps {
	readonly inputValue: string
	readonly onInputChange: (value: string) => void
	readonly onSubmit: (message: PromptInputMessage) => void
	readonly textareaRef: React.RefObject<HTMLTextAreaElement | null>
	readonly status: ChatStatus
	readonly models: readonly ChatModelOption[]
	readonly currentModelId: string
	readonly onModelChange: (modelId: string) => void
}

export const ChatInputPanel = React.forwardRef<HTMLDivElement, ChatInputPanelProps>(
	(
		{
			inputValue,
			onInputChange,
			onSubmit,
			textareaRef,
			status,
			models,
			currentModelId,
			onModelChange,
		},
		ref,
	) => {
		const handleChange = React.useCallback(
			(event: React.ChangeEvent<HTMLTextAreaElement>) => {
				onInputChange(event.target.value)
			},
			[onInputChange],
		)

		return (
			<div ref={ref} className="bg-background">
				<PromptInput
					onSubmit={onSubmit}
					className="max-w-screen-md mx-auto mb-4"
					globalDrop
					multiple
				>
					<PromptInputBody>
						<PromptInputTextarea
							autoFocus
							onChange={handleChange}
							ref={textareaRef}
							value={inputValue}
						/>
					</PromptInputBody>
					<PromptInputToolbar>
						<PromptInputTools>
							<PromptInputActionMenu>
								<PromptInputActionMenuTrigger />
								<PromptInputActionMenuContent>No actions at this time</PromptInputActionMenuContent>
							</PromptInputActionMenu>
							<ModelSelect models={models} value={currentModelId} onValueChange={onModelChange} />
						</PromptInputTools>
						<PromptInputSubmit
							disabled={!inputValue && status !== "streaming" && status !== "submitted"}
							status={status}
						/>
					</PromptInputToolbar>
				</PromptInput>
			</div>
		)
	},
)

ChatInputPanel.displayName = "ChatInputPanel"

interface ModelSelectProps {
	readonly models: readonly ChatModelOption[]
	readonly value: string
	readonly onValueChange: (value: string) => void
}

function ModelSelect({ models, value, onValueChange }: ModelSelectProps) {
	return (
		<PromptInputModelSelect onValueChange={onValueChange} value={value}>
			<PromptInputModelSelectTrigger>
				<PromptInputModelSelectValue />
			</PromptInputModelSelectTrigger>
			<PromptInputModelSelectContent>
				{models.map((model) => (
					<PromptInputModelSelectItem key={model.value} value={model.value}>
						{model.name}
					</PromptInputModelSelectItem>
				))}
			</PromptInputModelSelectContent>
		</PromptInputModelSelect>
	)
}
