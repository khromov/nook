import adapterStatic from '@sveltejs/adapter-static';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const adapter = process.env.ADAPTER === 'static' ? adapterStatic : adapterNode;

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		output: {
			bundleStrategy: 'single'
		}
	}
};

export default config;
