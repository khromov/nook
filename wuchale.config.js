// @ts-check
import { adapter as svelte } from '@wuchale/svelte';
import { adapter as js } from 'wuchale/adapter-vanilla';
import { defineConfig } from 'wuchale';

export default defineConfig({
	// sourceLocale is en by default
	otherLocales: ['es', 'ja', 'sv', 'uk'],
	adapters: {
		main: svelte(),
		js: js({
			files: [
				'src/**/+{page,layout}.{js,ts}',
				'src/**/+{page,layout}.server.{js,ts}',
				'src/**/+server.{js,ts}',
				'src/lib/**/!(*.spec).{js,ts}'
			]
		})
	}
});
