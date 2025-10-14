import { CodeBlock, CodeBlockCopyButton } from "./code-block"

const typescriptCode = `import { Effect, Schema } from "effect"
import * as AI from "@effect/ai"

const prompt = "Tell me a dad joke"

const program = Effect.gen(function* () {
  const ai = yield* AI.AI
  const response = yield* ai.generateText(prompt)

  console.log(response.text)
  return response
})

export default program`

const pythonCode = `def fibonacci(n: int) -> int:
    """Calculate the nth Fibonacci number recursively."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Example usage
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")`

const jsonCode = `{
  "name": "dadbot",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "cosmos": "cosmos"
  },
  "dependencies": {
    "react": "^19.2.0",
    "effect": "^3.18.4"
  }
}`

const bashCode = `#!/bin/bash

# Deploy to Netlify
echo "Building application..."
bun run build

echo "Deploying to Netlify..."
netlify deploy --prod

echo "Deployment complete!"
`

const sqlCode = `SELECT
  users.id,
  users.name,
  COUNT(posts.id) as post_count
FROM users
LEFT JOIN posts ON users.id = posts.user_id
WHERE users.created_at > '2024-01-01'
GROUP BY users.id, users.name
HAVING COUNT(posts.id) > 5
ORDER BY post_count DESC
LIMIT 10;`

const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DadBot - AI Dad Jokes</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`

export default {
	"TypeScript - Basic": (
		<div className="w-full max-w-2xl">
			<CodeBlock code={typescriptCode} language="typescript">
				<CodeBlockCopyButton />
			</CodeBlock>
		</div>
	),

	"TypeScript - With Line Numbers": (
		<div className="w-full max-w-2xl">
			<CodeBlock code={typescriptCode} language="typescript" showLineNumbers>
				<CodeBlockCopyButton />
			</CodeBlock>
		</div>
	),

	"Python": (
		<div className="w-full max-w-2xl">
			<CodeBlock code={pythonCode} language="python" showLineNumbers>
				<CodeBlockCopyButton />
			</CodeBlock>
		</div>
	),

	JSON: (
		<div className="w-full max-w-2xl">
			<CodeBlock code={jsonCode} language="json">
				<CodeBlockCopyButton />
			</CodeBlock>
		</div>
	),

	"Bash Script": (
		<div className="w-full max-w-2xl">
			<CodeBlock code={bashCode} language="bash" showLineNumbers>
				<CodeBlockCopyButton />
			</CodeBlock>
		</div>
	),

	"SQL Query": (
		<div className="w-full max-w-2xl">
			<CodeBlock code={sqlCode} language="sql" showLineNumbers>
				<CodeBlockCopyButton />
			</CodeBlock>
		</div>
	),

	"HTML": (
		<div className="w-full max-w-2xl">
			<CodeBlock code={htmlCode} language="html" showLineNumbers>
				<CodeBlockCopyButton />
			</CodeBlock>
		</div>
	),

	"Without Copy Button": (
		<div className="w-full max-w-2xl">
			<CodeBlock code={typescriptCode} language="typescript" />
		</div>
	),

	"One-liner": (
		<div className="w-full max-w-2xl">
			<CodeBlock code="bun run dev" language="bash">
				<CodeBlockCopyButton />
			</CodeBlock>
		</div>
	),

	"Long Code": (
		<div className="w-full max-w-2xl">
			<CodeBlock
				code={`import { createFileRoute } from "@tanstack/react-router"
import { HttpApp, HttpServerResponse } from "@effect/platform"
import { Effect, Layer, Stream } from "effect"
import * as AI from "@effect/ai"
import * as OpenAI from "@effect/ai-openai"
import { Persistence } from "@effect/experimental"
import { createUIMessageStream } from "@/lib/ai/ui-message/create-ui-message-stream"
import { toSSE } from "@/lib/sse"
import { DadJokeToolsLayer } from "@/lib/ai/tools/dad-joke"
import { PersistenceLayer } from "@/services/kvs"

const systemPrompt = \`You are DadBot, an AI assistant that speaks exclusively in dad jokes.
Every response must include at least one dad joke, pun, or play on words.
You have access to tools to fetch real dad jokes from the ICanHazDadJoke API.\`

export const Route = createFileRoute("/api/chat")({
  handler: HttpApp.make(
    Effect.gen(function* () {
      const ai = yield* AI.AI
      const chat = yield* ai.chat

      const messages = yield* Effect.tryPromise(() => request.json())

      const stream = yield* chat.generateStream({
        messages,
        systemPrompt,
        temperature: 0.8,
      })

      const uiStream = yield* createUIMessageStream(stream)

      return yield* HttpServerResponse.stream(
        Stream.map(uiStream, toSSE)
      )
    }).pipe(
      Effect.provide(MainLayer)
    )
  )
})`}
				language="typescript"
				showLineNumbers
			>
				<CodeBlockCopyButton />
			</CodeBlock>
		</div>
	),
}
