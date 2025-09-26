import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { CopyIcon, GlobeIcon, MessageSquare, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { Action, Actions } from "@/components/ai-elements/actions"
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Loader } from "@/components/ai-elements/loader"
import { Message, MessageAvatar, MessageContent } from "@/components/ai-elements/message"
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	PromptInputButton,
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
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning"
import { Response } from "@/components/ai-elements/response"
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources"
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool"

const models = [
	{ value: "gpt-4o", name: "GPT-4o" },
	{ value: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
	{ value: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
	{ value: "llama-3.1-70b", name: "Llama 3.1 70B" },
]

export const ChatBot = () => {
	const [input, setInput] = React.useState("")
	const [model, setModel] = React.useState<string>(models[0].value)
	const [webSearch, setWebSearch] = React.useState(false)
	const { messages, sendMessage, status, regenerate } = useChat({
		experimental_throttle: 50,
		transport: new DefaultChatTransport({
			api: "/api/chat",
			prepareSendMessagesRequest({ messages, id }) {
				return { body: { message: messages[messages.length - 1], id } }
			},
		}),
	})

	const handleSubmit = (message: PromptInputMessage) => {
		const hasText = Boolean(message.text)
		const hasAttachments = Boolean(message.files?.length)

		if (!(hasText || hasAttachments)) {
			return
		}

		sendMessage(
			{
				text: message.text || "Sent with attachments",
				files: message.files,
			},
			{
				body: {
					model: model,
					webSearch: webSearch,
				},
			},
		)
		setInput("")
	}

	return (
		<div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
			<div className="flex flex-col h-full">
				<Conversation className="h-full">
					<ConversationContent>
						{messages.map((message, index) => (
							<div key={`${message.id}-${index}`}>
								{message.role === "assistant" &&
									message.parts.filter((part) => part.type === "source-url").length > 0 && (
										<Sources>
											<SourcesTrigger
												count={message.parts.filter((part) => part.type === "source-url").length}
											/>
											{message.parts
												.filter((part) => part.type === "source-url")
												.map((part, i) => (
													<SourcesContent key={`${message.id}-${i}`}>
														<Source key={`${message.id}-${i}`} href={part.url} title={part.url} />
													</SourcesContent>
												))}
										</Sources>
									)}
								{message.parts.map((part, i) => {
									switch (part.type) {
										case "text":
											return (
												<React.Fragment key={`${message.id}-${i}`}>
													<Message from={message.role}>
														<MessageContent>
															<Response>{part.text}</Response>
														</MessageContent>
														<MessageAvatar
															className="h-10 w-10"
															src={
																message.role === "user"
																	? "https://github.com/IMax153.png"
																	: "https://github.com/Effect-TS.png"
															}
														/>
													</Message>
													{message.role === "assistant" && i === messages.length - 1 && (
														<Actions className="mt-2">
															<Action onClick={() => regenerate()} label="Retry">
																<RefreshCcwIcon className="size-3" />
															</Action>
															<Action
																onClick={() => navigator.clipboard.writeText(part.text)}
																label="Copy"
															>
																<CopyIcon className="size-3" />
															</Action>
														</Actions>
													)}
												</React.Fragment>
											)
										case "reasoning":
											return (
												<Reasoning
													key={`${message.id}-${i}`}
													className="w-full"
													isStreaming={
														status === "streaming" &&
														i === message.parts.length - 1 &&
														message.id === messages.at(-1)?.id
													}
												>
													<ReasoningTrigger />
													<ReasoningContent>{part.text}</ReasoningContent>
												</Reasoning>
											)
										case "tool-GetWeather": {
											return (
												<Tool defaultOpen={true}>
													<ToolHeader type="GetWeather" state={part.state} />
													<ToolContent>
														<ToolInput input={part.input} />
														{part.state === "output-available" && (
															<ToolOutput
																errorText={part.errorText}
																output={
																	<Response className="p-2">
																		{formatWeatherResult(part.output as any)}
																	</Response>
																}
															/>
														)}
													</ToolContent>
												</Tool>
											)
										}
										default:
											return null
									}
								})}
							</div>
						))}
						{status === "submitted" && <Loader />}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>

				<PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
					<PromptInputBody>
						<PromptInputAttachments>
							{(attachment) => <PromptInputAttachment data={attachment} />}
						</PromptInputAttachments>
						<PromptInputTextarea onChange={(e) => setInput(e.target.value)} value={input} />
					</PromptInputBody>
					<PromptInputToolbar>
						<PromptInputTools>
							<PromptInputActionMenu>
								<PromptInputActionMenuTrigger />
								<PromptInputActionMenuContent>
									<PromptInputActionAddAttachments />
								</PromptInputActionMenuContent>
							</PromptInputActionMenu>
							<PromptInputButton
								variant={webSearch ? "default" : "ghost"}
								onClick={() => setWebSearch(!webSearch)}
							>
								<GlobeIcon size={16} />
								<span>Search</span>
							</PromptInputButton>
							<PromptInputModelSelect
								onValueChange={(value) => {
									setModel(value)
								}}
								value={model}
							>
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
						</PromptInputTools>
						<PromptInputSubmit disabled={!input && !status} status={status} />
					</PromptInputToolbar>
				</PromptInput>
			</div>
		</div>
	)
}

function formatWeatherResult(result: {
	readonly location: string
	readonly temperature: string
	readonly conditions: string
	readonly humidity: string
	readonly windSpeed: string
	readonly lastUpdated: string
}): string {
	return `**Weather for ${result.location}**

**Temperature:** ${result.temperature}  
**Conditions:** ${result.conditions}  
**Humidity:** ${result.humidity}  
**Wind Speed:** ${result.windSpeed}  

*Last updated: ${result.lastUpdated}*`
}
