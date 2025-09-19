//import adapter from '@sveltejs/adapter-static';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		output: {
			/* TODO: Once we have a smaller alternative to @lenml/tokenizer-gemini */
			/*bundleStrategy: 'single'*/
		}
	}
};

export default config;
