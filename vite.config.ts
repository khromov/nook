import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';
import { wuchale } from '@wuchale/vite-plugin';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
	server: {
		proxy: {
			// In dev, proxy /models to CDN so relative model URLs work without a local-models dir.
			'/models': {
				target: 'https://sta-public.fra1.cdn.digitaloceanspaces.com',
				changeOrigin: true
			}
		}
	},
	plugins: [
		{
			name: 'configure-response-headers',
			configureServer(server) {
				// For Transcribe.js
				server.middlewares.use((req, res, next) => {
					res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
					res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
					next();
				});
			}
		},
		wuchale(),
		sveltekit(),
		Icons({
			compiler: 'svelte'
		}),
		devtoolsJson(),
		visualizer({
			emitFile: true,
			filename: 'stats.html'
		})
	],
	optimizeDeps: { exclude: ['@transcribe/shout'] },
	worker: { format: 'es' },
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
