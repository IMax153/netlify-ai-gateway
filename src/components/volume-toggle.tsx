import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSounds } from "@/hooks/use-sounds"

export function VolumeToggle() {
	const { enabled, toggleEnabled } = useSounds()

	return (
		<Button variant="ghost" size="icon" onClick={toggleEnabled} className="h-9 w-9 cursor-pointer">
			{enabled ? (
				<Volume2 className="h-4 w-4 transition-all" />
			) : (
				<VolumeX className="h-4 w-4 transition-all" />
			)}
			<span className="sr-only">Toggle sounds</span>
		</Button>
	)
}
