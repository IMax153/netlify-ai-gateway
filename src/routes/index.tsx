import { createFileRoute, Link } from "@tanstack/react-router"
import { Heart, MessageSquare, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="h-screen">
			<div className="absolute top-4 right-4 z-10 flex items-center gap-2">
				<Button size="sm" className="text-sm cursor-pointer" asChild>
					<Link to="/chat">Go to chat</Link>
				</Button>
			</div>

			<div className="flex justify-center items-center p-8">
				<div className="w-full max-w-2xl text-center space-y-8">
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
		<div className="space-y-4">
			<div className="text-6xl mb-4 hover:scale-110 transition-transform cursor-default">👨‍💼</div>
			<h1 className="text-4xl font-bold text-balance">
				Welcome to Dad Joke AI
				{/*
              {userName && (
                <span className="block text-2xl text-muted-foreground mt-2">
                  Hi {userName}, I'm Dad! (And I'm not going anywhere... unlike when I went to get milk)
                </span>
              )}
            */}
			</h1>
			<p className="text-lg text-muted-foreground text-balance">
				The most groan-worthy AI assistant on the internet. I'm not just artificially intelligent -
				I'm
				<span className="font-semibold text-primary"> artificially hilarious</span>! Prepare
				yourself for puns, wordplay, and jokes so bad they're good!
			</p>
		</div>
	)
}

function Features() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Card className="p-4 hover:bg-accent/5 transition-colors">
				<CardContent className="flex items-center gap-3 p-0">
					<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
						<MessageSquare className="h-5 w-5 text-primary" />
					</div>
					<div className="text-left">
						<h3 className="font-semibold">Un-bear-ably Funny</h3>
						<p className="text-sm text-muted-foreground">Fresh puns and jokes on demand</p>
					</div>
				</CardContent>
			</Card>

			<Card className="p-4 hover:bg-accent/5 transition-colors">
				<CardContent className="flex items-center gap-3 p-0">
					<div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
						<Zap className="h-5 w-5 text-accent" />
					</div>
					<div className="text-left">
						<h3 className="font-semibold">Shockingly Fast</h3>
						<p className="text-sm text-muted-foreground">Instant groan-inducing responses</p>
					</div>
				</CardContent>
			</Card>

			<Card className="p-4 hover:bg-accent/5 transition-colors">
				<CardContent className="flex items-center gap-3 p-0">
					<div className="h-10 w-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
						<Users className="h-5 w-5 text-chart-1" />
					</div>
					<div className="text-left">
						<h3 className="font-semibold">Family Tree-mendous</h3>
						<p className="text-sm text-muted-foreground">Clean humor for all ages</p>
					</div>
				</CardContent>
			</Card>

			<Card className="p-4 hover:bg-accent/5 transition-colors">
				<CardContent className="flex items-center gap-3 p-0">
					<div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
						<Heart className="h-5 w-5 text-chart-2" />
					</div>
					<div className="text-left">
						<h3 className="font-semibold">Love-ably Dorky</h3>
						<p className="text-sm text-muted-foreground">Embracing the dad joke spirit</p>
					</div>
				</CardContent>
			</Card>
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
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">Ask me something - I'm all ears 🌽:</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
				{SAMPLE_PROMPTS.map((prompt) => (
					<Button
						key={prompt}
						variant="outline"
						className="h-auto p-3 bg-transparent text-center hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
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
