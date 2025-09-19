import { browser, building } from '$app/environment';
import type { PageLoad } from './$types';

export const load = (async () => {
	if (building || !browser) {
		return {
			tokenizer: null
		};
	} else {
		console.log('Loading Gemini tokenizer in browser');
		const { fromPreTrained } = await import('@lenml/tokenizer-gemini');
		const tokenizer = fromPreTrained();
		return {
			tokenizer
		};
	}
}) satisfies PageLoad;
