import * as Prompt from "@effect/ai/Prompt"
import type * as UIMessage from "@/lib/domain/ui-message"

export const promptFromUIMessages = (
	uiMessages: ReadonlyArray<UIMessage.Any["Encoded"]>,
): Prompt.Prompt => {
	const messages: Array<Prompt.Message> = []

	for (const uiMessage of uiMessages) {
		switch (uiMessage.role) {
			case "system": {
				let text = ""

				for (const part of uiMessage.parts) {
					if (part.type === "text") {
						text += part.text
					}
				}

				messages.push(
					Prompt.makeMessage("system", {
						content: text,
					}),
				)

				break
			}

			case "user": {
				const parts: Array<Prompt.UserMessagePart> = []

				for (const part of uiMessage.parts) {
					if (part.type === "text") {
						parts.push(
							Prompt.makePart("text", {
								text: part.text,
							}),
						)
					}

					if (part.type === "file") {
						parts.push(
							Prompt.makePart("file", {
								mediaType: part.mediaType,
								fileName: part.filename,
								data: part.url,
							}),
						)
					}
				}

				messages.push(
					Prompt.makeMessage("user", {
						content: parts,
					}),
				)

				break
			}

			case "assistant": {
				const parts: Array<Prompt.AssistantMessagePart> = []

				for (const part of uiMessage.parts) {
					if (part.type === "text") {
						parts.push(
							Prompt.makePart("text", {
								text: part.text,
							}),
						)
					}

					if (part.type === "file") {
						parts.push(
							Prompt.makePart("file", {
								mediaType: part.mediaType,
								fileName: part.filename,
								data: part.url,
							}),
						)
					}

					if (part.type === "reasoning") {
						parts.push(
							Prompt.makePart("reasoning", {
								text: part.text,
							}),
						)
					}
					// TODO: tool calls
					// TODO: tool results
				}

				messages.push(
					Prompt.makeMessage("assistant", {
						content: parts,
					}),
				)

				break
			}
		}
	}

	return Prompt.fromMessages(messages)
}
