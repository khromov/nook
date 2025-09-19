import { browser, building } from '$app/environment';
import type { PageLoad } from './$types';

export const load = (async () => {
	if (building || !browser) {
		return {
			tokenizer: null
		};
	} else {
		console.log('Loading Gemini tokenizer in browser');
		const { AutoTokenizer } = await import('@huggingface/transformers');
		const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gemma-tokenizer');
		return {
			tokenizer
		};
	}
}) satisfies PageLoad;
