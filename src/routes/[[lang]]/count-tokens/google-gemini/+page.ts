import { browser, building } from '$app/environment';
import type { PageLoad } from './$types';

export const load = (async () => {
	if (building || !browser) {
		return {
			tokenizer: null
		};
	} else {
		try {
			console.log('Loading Gemini tokenizer in browser');
			const { AutoTokenizer } = await import('@huggingface/transformers');
			console.log('AutoTokenizer imported successfully');
			const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gemma-tokenizer');
			console.log('Gemini tokenizer loaded successfully:', tokenizer);
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
