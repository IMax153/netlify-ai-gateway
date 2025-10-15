# DadBot

A Netlify-deployed AI chatbot application that speaks in dad jokes and demonstrates the Netlify AI Gateway. Built with Effect, TanStack Start, React, and integrates with OpenAI's API.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (package manager)
- OpenAI API key (for development)

### Installation

```bash
bun install
```

### Development

Start the development server:

```bash
bun run dev
```

The app will be available at http://localhost:3000

### Type Checking

Run TypeScript type checking:

```bash
bun run check
```

## Component Development

This project uses [React Cosmos](https://reactcosmos.org/) for isolated component development and testing.

### Running Cosmos

Start the React Cosmos dev server:

```bash
bun run cosmos
```

Cosmos will be available at http://localhost:5000 (or the next available port).

**Quick Navigation:**
- Press `⌘ + K` (Mac) or `Ctrl + K` (Windows/Linux) to open fuzzy fixture search
- **Keyboard Shortcuts in Playground:**
  - `←` / `→` arrow keys to cycle through tool states
  - `↑` / `↓` arrow keys also work
  - Click the pill buttons for instant state switching
- Use the Control Panel (right sidebar) to change tool names and other properties
- Dark mode is enabled by default

### Creating Fixtures

Fixtures are component examples that can be rendered in isolation. Create a fixture file next to your component:

```tsx
// src/components/my-component.fixture.tsx
import { MyComponent } from './my-component'

export default {
  'Default State': (
    <MyComponent prop="value" />
  ),

  'Loading State': (
    <MyComponent prop="value" loading />
  ),
}
```

React Cosmos will automatically discover and display all `*.fixture.tsx` files in your project.

### Existing Fixtures

The project includes fixtures for key AI UI components:

- **ToolCall** (`src/components/tool-call.fixture.tsx`) - Tool execution states
- **Message** (`src/components/ai-elements/message.fixture.tsx`) - Chat message variants
- **CodeBlock** (`src/components/ai-elements/code-block.fixture.tsx`) - Code syntax highlighting

### Exporting Static Cosmos

To create a static build of your component library:

```bash
bun run cosmos:export
```

This generates a standalone HTML bundle in the `cosmos-export/` directory that can be deployed to any static hosting service.

## Project Structure

- `src/components/ai-elements/` - Reusable AI UI components
- `src/components/ui/` - Generic UI components (shadcn/ui style)
- `src/routes/` - TanStack Start routes and API endpoints
- `src/lib/` - Shared utilities, domain models, and AI helpers
- `src/services/` - Service layer (KVS, external APIs)

## Tech Stack

- **Frontend**: React 19, TanStack Router/Start, Tailwind CSS 4
- **Backend**: TanStack Start API routes
- **AI**: Effect AI (@effect/ai, @effect/ai-openai)
- **Effect Ecosystem**: Effect, @effect/platform, @effect/experimental
- **Dev Tools**: Biome (linting/formatting), React Cosmos (component development)

## Environment Variables

### Development

Create a `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key
```

### Production (Netlify)

Environment variables are automatically injected by Netlify:

- `OPENAI_BASE_URL` - Netlify AI Gateway URL
- `OPENAI_API_KEY` - API key (managed by Netlify)
- `NETLIFY_CHATS_BLOB_STORE_ID` - Blob store identifier (defaults to "chats")

## Code Quality

### Linting

```bash
bunx biome check
```

### Formatting

```bash
bunx biome format
```

Biome is configured with:
- Tab indentation
- 100 character line width
- Double quotes
- Organize imports on save

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation, including:
- Effect-based request handling patterns
- UI message system
- Persistence and storage abstraction
- Layer-based dependency injection
- Tool and toolkit system

## License

MIT
