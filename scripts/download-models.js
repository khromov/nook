#!/usr/bin/env node
/**
 * Download all model files from the CDN into a local directory.
 * The directory structure mirrors CDN paths so the files can be served
 * from the same origin, eliminating CORS issues in self-hosted deployments.
 *
 * Usage:
 *   node scripts/download-models.js [options]
 *
 * Options:
 *   --output-dir <path>   Output directory (default: ./local-models)
 *   --skip-chat           Skip chat models (LLM)
 *   --skip-whisper        Skip Whisper speech-to-text models
 *   --skip-tts            Skip text-to-speech models
 *   --skip-bgremoval      Skip background removal models
 */

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const BASE_URL = 'https://sta-public.fra1.cdn.digitaloceanspaces.com';

// --- Model file lists ---

const CHAT_MODELS = [
	'models/google_gemma-3-1b-it-qat-Q4_0.gguf',
	'models/smollm2-360m-instruct-q8_0.gguf'
];

const WHISPER_MODELS = [
	'whisper/ggml-tiny-q5_1.bin',
	'whisper/ggml-tiny.en-q5_1.bin',
	'whisper/ggml-small-q5_1.bin',
	'whisper/ggml-small.en-q5_1.bin',
	'whisper/ggml-medium-q5_0.bin',
	'whisper/ggml-medium.en-q5_0.bin',
	'whisper/ggml-large-v2-q5_0.bin'
];

const TTS_MODELS = [
	// KittenTTS
	'tts-models/kitten-tts/model_quantized.onnx',
	'tts-models/kitten-tts/voices.json',
	'tts-models/kitten-tts/tokenizer.json',
	// Piper TTS
	'tts-models/piper/en_US-libritts_r-medium.onnx',
	'tts-models/piper/en_US-libritts_r-medium.onnx.json',
	// Kokoro TTS – model + tokenizer
	'tts-models/kokoro/model_quantized.onnx',
	'tts-models/kokoro/tokenizer.json',
	// Kokoro voice embeddings
	'tts-models/kokoro/voices/af.bin',
	'tts-models/kokoro/voices/af_alloy.bin',
	'tts-models/kokoro/voices/af_aoede.bin',
	'tts-models/kokoro/voices/af_bella.bin',
	'tts-models/kokoro/voices/af_heart.bin',
	'tts-models/kokoro/voices/af_jessica.bin',
	'tts-models/kokoro/voices/af_kore.bin',
	'tts-models/kokoro/voices/af_nicole.bin',
	'tts-models/kokoro/voices/af_nova.bin',
	'tts-models/kokoro/voices/af_river.bin',
	'tts-models/kokoro/voices/af_sarah.bin',
	'tts-models/kokoro/voices/af_sky.bin',
	'tts-models/kokoro/voices/am_adam.bin',
	'tts-models/kokoro/voices/am_echo.bin',
	'tts-models/kokoro/voices/am_eric.bin',
	'tts-models/kokoro/voices/am_fenrir.bin',
	'tts-models/kokoro/voices/am_liam.bin',
	'tts-models/kokoro/voices/am_michael.bin',
	'tts-models/kokoro/voices/am_onyx.bin',
	'tts-models/kokoro/voices/am_puck.bin',
	'tts-models/kokoro/voices/am_santa.bin'
];

const BGREMOVAL_MODELS = [
	// RMBG-1.4
	'bgremoval/RMBG-1.4/config.json',
	'bgremoval/RMBG-1.4/preprocessor_config.json',
	'bgremoval/RMBG-1.4/onnx/model_quantized.onnx',
	'bgremoval/RMBG-1.4/onnx/quantize_config.json',
	// BEN2-ONNX
	'bgremoval/BEN2-ONNX/config.json',
	'bgremoval/BEN2-ONNX/preprocessor_config.json',
	'bgremoval/BEN2-ONNX/onnx/model_fp16.onnx'
];

// --- CLI argument parsing ---

function parseArgs(argv) {
	const args = argv.slice(2);
	const opts = {
		outputDir: './local-models',
		skipChat: false,
		skipWhisper: false,
		skipTts: false,
		skipBgremoval: false
	};

	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case '--output-dir':
				opts.outputDir = args[++i];
				break;
			case '--skip-chat':
				opts.skipChat = true;
				break;
			case '--skip-whisper':
				opts.skipWhisper = true;
				break;
			case '--skip-tts':
				opts.skipTts = true;
				break;
			case '--skip-bgremoval':
				opts.skipBgremoval = true;
				break;
			case '--help':
			case '-h':
				printHelp();
				process.exit(0);
		}
	}

	return opts;
}

function printHelp() {
	console.log(`
Download Nook model files for local serving.

Usage: node scripts/download-models.js [options]

Options:
  --output-dir <path>   Output directory (default: ./local-models)
  --skip-chat           Skip LLM chat models
  --skip-whisper        Skip Whisper speech-to-text models
  --skip-tts            Skip text-to-speech models
  --skip-bgremoval      Skip background removal models
  -h, --help            Show this help message

After downloading, build with PUBLIC_BASE_MODEL_URL='' and start with
LOCAL_MODELS_PATH=./local-models node server.js
`);
}

// --- Download helpers ---

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

async function downloadFile(url, destPath) {
	if (existsSync(destPath)) {
		console.log(`  [skip] ${destPath} (already exists)`);
		return;
	}

	mkdirSync(dirname(destPath), { recursive: true });

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
	}

	const total = parseInt(res.headers.get('content-length') || '0', 10);
	let downloaded = 0;
	let lastPrint = Date.now();

	const tempPath = destPath + '.tmp';
	const fileStream = createWriteStream(tempPath);

	const progressStream = new Readable({ read() {} });

	const reader = res.body.getReader();
	const pump = async () => {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				progressStream.push(null);
				break;
			}
			downloaded += value.length;
			const now = Date.now();
			if (total > 0 && now - lastPrint > 500) {
				const pct = ((downloaded / total) * 100).toFixed(1);
				process.stdout.write(
					`\r  [get] ${destPath} — ${formatBytes(downloaded)} / ${formatBytes(total)} (${pct}%)`
				);
				lastPrint = now;
			}
			progressStream.push(Buffer.from(value));
		}
	};

	await Promise.all([pump(), pipeline(progressStream, fileStream)]);

	if (total > 0) {
		process.stdout.write(
			`\r  [done] ${destPath} — ${formatBytes(downloaded)} / ${formatBytes(total)} (100%)\n`
		);
	} else {
		console.log(`  [done] ${destPath} — ${formatBytes(downloaded)}`);
	}

	// Atomically rename temp file to final destination
	const { rename } = await import('fs/promises');
	await rename(tempPath, destPath);
}

async function downloadGroup(label, files, outputDir) {
	console.log(`\n=== ${label} (${files.length} files) ===`);
	let ok = 0;
	let failed = 0;
	for (const file of files) {
		const url = `${BASE_URL}/${file}`;
		const dest = join(outputDir, file);
		try {
			await downloadFile(url, dest);
			ok++;
		} catch (err) {
			console.error(`\n  [error] ${file}: ${err.message}`);
			failed++;
		}
	}
	console.log(`  => ${ok} ok, ${failed} failed`);
}

// --- Main ---

async function main() {
	const opts = parseArgs(process.argv);

	console.log(`Output directory: ${opts.outputDir}`);
	console.log(`Source CDN:       ${BASE_URL}`);

	const groups = [];
	if (!opts.skipChat) groups.push(['Chat models (LLM)', CHAT_MODELS]);
	if (!opts.skipWhisper) groups.push(['Whisper models', WHISPER_MODELS]);
	if (!opts.skipTts) groups.push(['TTS models', TTS_MODELS]);
	if (!opts.skipBgremoval) groups.push(['Background removal models', BGREMOVAL_MODELS]);

	if (groups.length === 0) {
		console.log('Nothing to download (all groups skipped).');
		return;
	}

	for (const [label, files] of groups) {
		await downloadGroup(label, files, opts.outputDir);
	}

	console.log('\nDone!');
	console.log('\nNext steps:');
	console.log("  1. Build: PUBLIC_BASE_MODEL_URL='' npm run build");
	console.log(`  2. Start: LOCAL_MODELS_PATH=${opts.outputDir} node server.js`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
