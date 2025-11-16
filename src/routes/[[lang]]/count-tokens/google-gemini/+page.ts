import { browser, building } from '$app/environment';
import type { PageLoad } from './$types';

export const load = (async () => {
	if (building || !browser) {
		return {
			tokenizer: null
		};
	} else {
		try {
			const { AutoTokenizer, env } = await import('@huggingface/transformers');

			// Configure transformers.js to use local files instead of Huggingface
			env.allowLocalModels = true;
			env.allowRemoteModels = false;
			env.localModelPath = '/gemma-tokenizer/';
			if (env.backends.onnx.wasm) {
				env.backends.onnx.wasm.numThreads = 1;
			}

			const tokenizer = await AutoTokenizer.from_pretrained('/gemma-tokenizer');
			return {
				tokenizer
			};
		} catch (error) {
			console.error('Failed to load Gemini tokenizer:', error);
			return {
				tokenizer: null,
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}
}) satisfies PageLoad;
