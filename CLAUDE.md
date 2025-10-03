# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Always start each question by looking up relevant documentation sections in the Svelte MCP.
Always run "npm run format" followed by "npm run checks" before finishing a task, and fix any linting issues.

## Project Overview

This is a browser-based AI chat and transcription application that runs entirely client-side without sending data to external servers. The application uses Svelte 5, SvelteKit, WebAssembly, the Wllama library for chat completions, and @transcribe/transcriber for audio transcription.

## Development Commands

### Core Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (with OPFS enabled by default)
- `npm run preview` - Preview production build
- `npm run check` - Type check with svelte-check
- `npm run check:watch` - Type check in watch mode
- `npm run lint` - Run ESLint and Prettier checks
- `npm run lint:fix` - Fix ESLint and Prettier issues automatically
- `npm run format` - Format code with Prettier
- `npm run checks` - Run format, lint, and check in sequence
- `npm run copy-wasm` - Manually copy WASM files from npm packages

### Testing Commands

- `npm run test` - Run unit tests once
- `npm run test:unit` - Run unit tests in watch mode

### Docker Commands

- `docker build -t sveltekit-local-ai .` - Build Docker image
- `docker run -p 3000:3000 sveltekit-local-ai` - Run container

## Architecture & Key Concepts

### Application Structure

- **Routes**: Main pages in `src/routes/` with route groups for apps `(apps)/`
- **Components**: Reusable UI components in `src/lib/components/`
- **State Management**: Persisted stores using `svelte-persisted-store` in `src/lib/stores.ts`
- **AI Integration**: Wllama configuration and models in `src/lib/wllama-config.ts`

### WebAssembly Integration

- Uses Wllama library for local LLM inference
- Models are downloaded and cached in browser (OPFS when supported)
- Cross-Origin headers required for WebAssembly: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`

### Svelte 5 Features

- Uses `$state()` for reactive variables instead of legacy syntax
- Component props use the `$props()` rune
- Snippets used for component children patterns

### Model Management

- Available models configured in `AVAILABLE_MODELS` array in `src/lib/wllama-config.ts`
- Models are downloaded with progress tracking and cached locally
- Support for both single-threaded and multi-threaded WebAssembly builds

### State Persistence

Key persisted stores:

- `messages`: Chat message history
- `inferenceParams`: AI model parameters (temperature, context length, etc.)
- `whisperModel`: Selected Whisper model for transcription

### Component Organization

- **Chat components**: `src/lib/components/chat/` (ModelSelector, ChatMessages, MessageInput, Message)
- **Whisper components**: `src/lib/components/whisper/` (file upload, model selection, transcription)
- **TTS components**: `src/lib/components/tts/` (voice selection, speed control, sample rate, WebGPU toggle)
- **Background Remover components**: `src/lib/components/background-remover/` (upload, progress, results)
- **Common components**: `src/lib/components/common/` (LoadingProgress, ErrorDisplay, ProgressBar, CardInterface, etc.)

## Key Technical Details

### AI Model Configuration

- Default chat template uses ChatML format (`<|im_start|>` tokens)
- Inference parameters: 4096 context, temperature 0.2, auto-threading
- Models served from external CDN (configured via BASE_MODEL_URL in src/lib/config.ts)

### Browser Compatibility

- Requires modern browsers with WebAssembly and SharedArrayBuffer support
- OPFS (Origin Private File System) used for model caching when available
- Fallback storage mechanisms for browsers without OPFS

### Development Notes

- TypeScript used throughout the codebase
- ESLint configuration includes Svelte-specific rules
- Prettier for code formatting
- Uses SvelteKit's adapter-node for production builds
- Express server with health check endpoint at `/_health`

### ONNX Runtime Web Integration

- ONNX Runtime Web is used for TTS models (kitten-tts, piper-tts, kokoro-tts) and background removal
- WASM and bundle files are automatically copied from npm packages to ensure version compatibility
- Use `npm run copy-wasm` to manually update files from `onnxruntime-web` and `@huggingface/transformers`
- Files are located in `static/onnx-runtime/` (for TTS) and `static/transformers/` (for background removal)
- Both `dev` and `build` scripts automatically copy files before starting
- Static ONNX Runtime directories are gitignored since they're generated from npm packages

### Internationalization (i18n)

- Uses **Wuchale** for internationalization with support for multiple languages
- Configured locales: `en` (default), `es`, `ja`, `sv`, `uk` (defined in `wuchale.config.js`)
- Route structure uses optional `[[lang]]` parameter for language-specific URLs
- Language detection in `hooks.server.ts` extracts language from URL path, defaults to 'en'
- Language switching available at `/language` page with cards for each supported locale
- All internal navigation links should include language prefix to maintain language context
- Language context is available via URL path parsing in components

### Application Features

- **Chat**: LLM conversations using Wllama with models like Gemma3
- **Transcribe**: Speech-to-text using Whisper AI with subtitle export capabilities
- **Text-to-Speech**: Voice synthesis with multiple TTS models and WebGPU acceleration
- **Background Remover**: AI-powered background removal for images
- All features run entirely client-side without external server dependencies

## Environment Variables

- `PUBLIC_DISABLE_OPFS=true` - Disable OPFS caching for testing fallback behavior

## Code Style Guidelines

- Use TypeScript for all new code
- Follow existing naming conventions (camelCase for variables, PascalCase for components)
- Use Svelte 5 `$state()` syntax for reactive variables
- Maintain responsive design patterns with mobile-first approach
- Include loading states and error handling for async operations
- Follow existing component structure and prop patterns

IMPORTANT: Run "npm run checks" after you finish a task to make sure there are no issues.

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
