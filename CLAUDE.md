# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Netlify-deployed AI chatbot application (named "dadbot") that speaks in dad jokes and demonstrates the Netlify AI Gateway. It's built with Effect, TanStack Start, React, and integrates with OpenAI's API (or other LLM providers via Netlify AI Gateway in production).

## Package Manager

**Use `bun` for all operations in this project, not npm or node.**

## Common Commands

- `bun run dev` - Start development server on port 3000
- `bun run build` - Build the application
- `bun run check` - Run TypeScript type checking (no emit)

## Code Quality

**Linting & Formatting:**
- Biome is configured with:
  - Tab indentation
  - 100 character line width
  - Double quotes
  - Semicolons as needed (asNeeded)
  - Organize imports on save
- Run biome via `bunx biome check` for linting
- Run biome via `bunx biome format` for formatting

## Architecture

### Stack
- **Frontend Framework**: React 19 with TanStack Router/Start
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Backend**: TanStack Start API routes (server-side rendering)
- **Effect Ecosystem**: Heavily uses Effect for functional programming patterns
  - `@effect/ai` - AI SDK abstractions
  - `@effect/ai-openai` - OpenAI integration
  - `@effect/platform` - Platform abstractions
  - `@effect/experimental` - Experimental features like Persistence

### Key Architectural Patterns

**1. Effect-based Request Handling**
The API routes use Effect's `HttpApp` pattern rather than traditional Express-style handlers. See `src/routes/api/chat.ts` for the canonical example.

**2. UI Message System**
The app uses a custom streaming UI message protocol that bridges Effect AI's streaming responses with React components:
- **Domain Models**: `src/lib/domain/ui-message.ts` defines type-safe message schemas
- **Stream Conversion**: `src/lib/ai/ui-message/to-ui-message-stream.ts` converts Effect AI responses to UI messages
- **Message Creation**: `src/lib/ai/ui-message/create-ui-message-stream.ts` handles streaming with mailboxes
- **Chunks**: `src/lib/domain/ui-message-chunk.ts` handles incremental message updates

**3. Persistence & Storage**
- **Development**: Uses filesystem-based key-value store (persisted to `./chats/` directory)
- **Production**: Uses Netlify Blobs for persistent storage
- **Abstraction**: `src/services/kvs.ts` provides a unified interface that switches based on `NODE_ENV`
- Chat persistence is handled via `@effect/experimental/Persistence` with Effect AI's `Chat.layerPersisted`

**4. Layer-based Dependency Injection**
Effect's Layer system is used for dependency injection:
- `OpenAiClientLayer` - Provides OpenAI API access
- `PersistenceLayer` - Provides chat persistence
- `DadJokeToolsLayer` - Provides tool implementations
- `MainLayer` - Merges all layers together in `src/routes/api/chat.ts`

**5. Tools & Toolkits**
- Tools are defined using `@effect/ai/Tool` (see `src/lib/ai/tools/dad-joke.ts`)
- Tools are bundled into toolkits using `@effect/ai/Toolkit`
- Tool schemas are integrated into the UI message system for type-safe rendering

### File Structure Highlights

**Components:**
- `src/components/ai-elements/` - Reusable AI UI components (message, tool, reasoning, etc.)
- `src/components/ui/` - Generic UI components (shadcn/ui style)
- `src/components/chat.tsx` - Main chat interface using `@ai-sdk/react`'s `useChat` hook

**API Routes:**
- `src/routes/api/chat.ts` - Main chat endpoint that handles streaming responses

**Services:**
- `src/services/kvs.ts` - Key-value store abstraction (Netlify Blobs vs filesystem)
- `src/services/icanhazdadjoke.ts` - Integration with ICanHazDadJoke API

**Domain Models:**
- `src/lib/domain/ui-message.ts` - Core UI message schema
- `src/lib/domain/ui-message-chunk.ts` - Streaming chunk schema
- `src/lib/domain/chat-message.ts` - Chat message types for the client

### Environment Variables

**Development:**
- `OPENAI_API_KEY` - Required for OpenAI API access (stored in `.env`)

**Production (Netlify):**
- `OPENAI_BASE_URL` - Netlify AI Gateway URL (injected automatically)
- `OPENAI_API_KEY` - API key (injected automatically by Netlify)
- `NETLIFY_CHATS_BLOB_STORE_ID` - Blob store identifier (defaults to "chats")

### Streaming & Server-Sent Events
- `src/lib/sse.ts` - Converts Effect streams to Server-Sent Events
- The chat endpoint returns SSE streams with encoded UI message chunks
- Client uses Vercel AI SDK's transport mechanism to consume the stream

### Multi-turn Conversations
The chat API supports multi-turn tool calling:
- Limited to 5 consecutive turns (see `src/routes/api/chat.ts:179-196`)
- Uses Effect's mailbox pattern to merge tool execution streams
- History is maintained through Effect AI's chat persistence

## Important Notes

- The system prompt is defined in `src/routes/api/chat.ts` (lines 24-46)
- Path aliases: `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- TypeScript is configured with strict settings (`exactOptionalPropertyTypes`, `strictNullChecks`)
- The app uses React 19's new features (ensure compatibility when updating dependencies)
