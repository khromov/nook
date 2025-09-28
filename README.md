# Nook

A browser-based AI application that runs entirely on your device without sending data to external servers. This project uses Svelte 5, SvelteKit, WebAssembly, and various AI libraries for chat, transcription, text-to-speech, and image processing!

## Live Demo

You can try the application at:
https://nook.software

![Screenshot](./.github/screenshot.png)

## Features

- **Chat** - LLM conversations using models like Gemma3 via llama.cpp
- **Transcribe** - Speech-to-text using Whisper AI with subtitle export
- **Text-to-Speech** - Voice synthesis with Kitten TTS, Piper, and Kokoro models
- **Background Remover** - AI-powered background removal

## Running Locally

1. Clone the repository

2. Install dependencies

   ```bash
   nvm use
   npm install
   ```

3. Configure environment variables

   ```bash
   cp .env.example .env
   ```

   Available variables:
   - `PUBLIC_DISABLE_OPFS=true` - Disable OPFS caching for testing fallback behavior

4. Start the development server

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Building for Production

```bash
npm run build
```

## Using Docker

```bash
# Build the Docker image
docker build -t nook .

# Run the container
docker run -p 3000:3000 nook
```

## How It Works

The application downloads AI models directly to your browser and runs inference using WebAssembly. Models are cached locally using OPFS when available. This approach ensures your data stays private and can work offline after the initial model download.

## Acknowledgements

- Thanks to the creator of https://clowerweb.github.io/tts-studio/ for excellent TTS examples!
- Thanks to the creators of Wllama and Transformers.js
