export type ChatStatus = "submitted" | "streaming" | "ready" | "error"

export interface ChatModelOption {
	readonly value: string
	readonly name: string
}
