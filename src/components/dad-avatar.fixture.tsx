import { useState } from "react"
import { DadAvatar, type DadState } from "./dad-avatar"

function InteractiveDadAvatar() {
	const [state, setState] = useState<DadState>("idle")

	return (
		<div className="flex flex-col items-center gap-6 p-8">
			<DadAvatar state={state} className="h-44" />

			<div className="flex gap-3">
				<button
					type="button"
					onClick={() => setState("idle")}
					className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
				>
					Set Idle
				</button>
				<button
					type="button"
					onClick={() => setState("thinking")}
					className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
				>
					Set Thinking
				</button>
			</div>

			<div className="text-sm text-gray-600">
				Current state: <span className="font-mono font-bold">{state}</span>
			</div>

			<div className="text-xs text-gray-500 max-w-md text-center">
				Try switching from "Thinking" to "Idle" to see the laugh animation play automatically!
			</div>
		</div>
	)
}

export default {
	Interactive: <InteractiveDadAvatar />,

	"Idle State": <DadAvatar state="idle" className="h-44" />,

	"Thinking State": <DadAvatar state="thinking" className="h-44" />,

	"Small Idle": <DadAvatar state="idle" className="h-24" />,

	"Small Thinking": <DadAvatar state="thinking" className="h-24" />,
}
