import { DadAvatar } from "./dad-avatar"

export default function DadAvatarFixture() {
	return (
		<div className="flex flex-col gap-8 p-8">
			<div className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold">Static Dad Avatar</h2>
				<DadAvatar />
			</div>

			<div className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold">Thinking Dad Avatar</h2>
				<DadAvatar thinking />
			</div>

			<div className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold">Large Size (h-20)</h2>
				<DadAvatar className="h-20" thinking />
			</div>

			<div className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold">Small Size (h-6)</h2>
				<DadAvatar className="h-6" thinking />
			</div>
		</div>
	)
}
