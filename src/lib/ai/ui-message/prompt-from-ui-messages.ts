import * as Prompt from "@effect/ai/Prompt"
import * as Predicate from "effect/Predicate"
import type * as UIMessage from "@/lib/domain/ui-message"

export const promptFromUIMessages = (
	messages: ReadonlyArray<UIMessage.Any["Encoded"]>,
): Prompt.Prompt => {
	const content: Array<Prompt.Message> = []

	for (const message of messages) {
		switch (message.role) {
			case "system": {
				let text = ""

				let options = {}
				for (let i = 0; i < message.parts.length; i++) {
					const part = message.parts[i]

					if (part.type === "text") {
						text += part.text

						if (Predicate.isNotUndefined(part.providerMetadata)) {
							options = { ...options, ...part.providerMetadata }
						}
					}
				}

				content.push(
					Prompt.makeMessage("system", {
						content: text,
						options,
					}),
				)

				break
			}

			case "user": {
				const parts: Array<Prompt.UserMessagePart> = []

				for (let i = 0; i < message.parts.length; i++) {
					const part = message.parts[i]

					if (part.type === "text") {
						parts.push(
							Prompt.makePart("text", {
								text: part.text,
								options: part.providerMetadata,
							}),
						)
					}

					if (part.type === "file") {
						parts.push(
							Prompt.makePart("file", {
								mediaType: part.mediaType,
								fileName: part.filename,
								data: part.url,
								options: part.providerMetadata,
							}),
						)
					}
				}

				content.push(
					Prompt.makeMessage("user", {
						content: parts,
					}),
				)

				break
			}

			case "assistant": {
				const group: Array<
					| UIMessage.UITextPart
					| UIMessage.UIReasoningPart
					| UIMessage.UIFilePart
					| UIMessage.UIToolParts<any>
				> = []

				// Aggregate messages into groups, only triggering message processing
				// if a new step is encountered
				for (let i = 0; i < message.parts.length; i++) {
					const part = message.parts[i]

					if (
						part.type === "text" ||
						part.type === "reasoning" ||
						part.type === "file" ||
						part.type.startsWith("tool-")
					) {
						group.push(part as any)
					}

					if (part.type === "step-start") {
						processMessageGroup()
					}
				}

				// No more messages to group, trigger processing
				processMessageGroup()

				function processMessageGroup() {
					const assistantMessageParts: Array<Prompt.AssistantMessagePart> = []
					const toolMessageParts: Array<Prompt.ToolMessagePart> = []

					for (let i = 0; i < group.length; i++) {
						const part = group[i]

						if (part.type === "text") {
							assistantMessageParts.push(
								Prompt.makePart("text", {
									text: part.text,
									options: part.providerMetadata,
								}),
							)
						}

						if (part.type === "reasoning") {
							assistantMessageParts.push(
								Prompt.makePart("reasoning", {
									text: part.text,
									options: part.providerMetadata,
								}),
							)
						}

						if (part.type === "file") {
							assistantMessageParts.push(
								Prompt.makePart("file", {
									mediaType: part.mediaType,
									fileName: part.filename,
									data: part.url,
									options: part.providerMetadata,
								}),
							)
						}

						if (part.type.startsWith("tool-")) {
							const toolPart: UIMessage.UIToolParts<any> = part as any
							const toolName = toolPart.type.split("-").slice(1).join("-")

							if (toolPart.state !== "input-streaming") {
								assistantMessageParts.push(
									Prompt.makePart("tool-call", {
										id: toolPart.toolCallId,
										name: toolName,
										params:
											toolPart.state === "output-error"
												? (toolPart.input ?? toolPart.rawInput)
												: toolPart.input,
										providerExecuted: toolPart.providerExecuted ?? false,
										options: toolPart.callProviderMetadata,
									}),
								)
							}

							if (toolPart.state === "output-available" || toolPart.state === "output-error") {
								const part = Prompt.makePart("tool-result", {
									id: toolPart.toolCallId,
									name: toolName,
									isFailure: toolPart.state === "output-error",
									result: toolPart.state === "output-error" ? toolPart.errorText : toolPart.output,
									options: toolPart.callProviderMetadata,
								})

								if (toolPart.providerExecuted === true) {
									assistantMessageParts.push(part)
								} else {
									toolMessageParts.push(part)
								}
							}
						}
					}

					if (assistantMessageParts.length > 0) {
						content.push(
							Prompt.makeMessage("assistant", {
								content: assistantMessageParts,
							}),
						)
					}

					if (toolMessageParts.length > 0) {
						content.push(
							Prompt.makeMessage("tool", {
								content: toolMessageParts,
							}),
						)
					}

					// Reset for the next group of messages
					group.length = 0
				}

				break
			}
		}
	}

	return Prompt.fromMessages(content)
}
