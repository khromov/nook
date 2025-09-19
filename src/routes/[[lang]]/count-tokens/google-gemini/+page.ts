import { browser, building } from '$app/environment';
import type { PageLoad } from './$types';

export const load = (async () => {
	if (building || !browser) {
		return {
			tokenizer: null
		};
	} else {
		try {
			const { AutoTokenizer } = await import('@huggingface/transformers');
			const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gemma-tokenizer');
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
