import { createFileRoute, Link } from "@tanstack/react-router"
import { Heart, MessageSquare, Users, Zap } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import laugh1 from "@/assets/laugh-1.png"
import laugh2 from "@/assets/laugh-2.png"
import laugh3 from "@/assets/laugh-3.png"
import laugh4 from "@/assets/laugh-4.png"
import laugh5 from "@/assets/laugh-5.png"

const laughFrames = [laugh1, laugh2, laugh3, laugh4, laugh5]

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="min-h-screen pt-14">
			<div className="flex justify-center items-center min-h-[calc(100vh-3.5rem)] p-8">
				<div className="w-full max-w-3xl text-center space-y-16">
					<Hero />
					<Features />
					<SamplePrompts />
				</div>
			</div>
		</div>
	)
}

function Hero() {
	return (
		<div className="space-y-6">
			<div className="flex justify-center mb-6">
				<LaughingDadAvatar />
			</div>
			<h1 className="text-5xl md:text-6xl font-bold text-balance tracking-tight">
				Welcome to Dadbot
			</h1>
			<p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
				The most groan-worthy AI chat bot on the internet. I'm not just artificially intelligent -
				I'm
				<span className="font-semibold text-primary"> artificially hilarious</span>! Prepare
				yourself for puns, wordplay, and jokes so bad they're good!
			</p>
		</div>
	)
}

function LaughingDadAvatar() {
	const [frameIndex, setFrameIndex] = React.useState(0)

	React.useEffect(() => {
		const interval = setInterval(() => {
			setFrameIndex((prev) => (prev + 1) % laughFrames.length)
		}, 1000 / 6) // 6 FPS like the main DadAvatar component

		return () => clearInterval(interval)
	}, [])

	return (
		<img
			src={laughFrames[frameIndex]}
			alt="Laughing Dad"
			className="h-48 md:h-64 w-auto hover:scale-110 transition-transform cursor-default"
			style={{ imageRendering: "crisp-edges" }}
		/>
	)
}

const FEATURES = [
	{
		icon: () => (
			<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
				<MessageSquare className="h-5 w-5 text-primary" />
			</div>
		),
		heading: "Un-bear-ably Funny",
		subheading: "Fresh puns and jokes on demand",
	},
	{
		icon: () => (
			<div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
				<Zap className="h-5 w-5 text-accent" />
			</div>
		),
		heading: "Shockingly Fast",
		subheading: "Instant groan-inducing responses",
	},
	{
		icon: () => (
			<div className="h-10 w-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
				<Users className="h-5 w-5 text-chart-1" />
			</div>
		),
		heading: "Family Tree-mendous",
		subheading: "Clean humor for all ages",
	},
	{
		icon: () => (
			<div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
				<Heart className="h-5 w-5 text-chart-2" />
			</div>
		),
		heading: "Love-ably Dorky",
		subheading: "Embracing the dad joke spirit",
	},
]

function Features() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			{FEATURES.map(({ heading, subheading, icon: Icon }) => (
				<Card
					key={heading}
					className="p-5 hover:shadow-md transition-all hover:border-primary/20 cursor-default"
				>
					<CardContent className="flex items-center gap-4 p-0">
						<Icon />
						<div className="text-left">
							<h3 className="font-semibold text-base">{heading}</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">{subheading}</p>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}

const SAMPLE_PROMPTS = [
	"Tell me a programming dad joke",
	"What's your cheesiest joke?",
	"Give me a coffee pun",
	"Make me groan with a joke",
	"Tell me a banana joke",
	"Share a construction pun",
]

function SamplePrompts() {
	return (
		<div className="space-y-6">
			<h3 className="text-xl md:text-2xl font-semibold">Ask me something - I'm all ears 🌽</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{SAMPLE_PROMPTS.map((prompt) => (
					<Button
						key={prompt}
						variant="outline"
						className="h-auto py-4 px-4 text-center cursor-pointer text-base"
						asChild
					>
						<Link to="/chat" search={{ prompt }}>
							{prompt}
						</Link>
					</Button>
				))}
			</div>
		</div>
	)
}
