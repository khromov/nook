import type { RequestHandler } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { createLocalizedLink, locales } from '$lib/i18n-utils';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const baseUrl = dev ? 'http://localhost:5173' : 'https://nook.software';
	const now = new Date().toISOString();

	// Define all routes with their priorities
	const routes = [
		{ path: '/', priority: 1.0, changefreq: 'daily' },
		{ path: '/chat', priority: 1.0, changefreq: 'weekly' },
		{ path: '/transcribe', priority: 1.0, changefreq: 'weekly' },
		{ path: '/text-to-speech', priority: 1.0, changefreq: 'weekly' },
		{ path: '/background-remover', priority: 1.0, changefreq: 'weekly' },
		{ path: '/count-tokens', priority: 1.0, changefreq: 'weekly' },
		{ path: '/count-tokens/anthropic-claude', priority: 1.0, changefreq: 'weekly' },
		{ path: '/count-tokens/openai-chatgpt', priority: 1.0, changefreq: 'weekly' },
		{ path: '/language', priority: 0.8, changefreq: 'monthly' }
	];

	// Generate URLs for all locales
	const urls: string[] = [];

	for (const route of routes) {
		for (const locale of locales) {
			const localizedPath = createLocalizedLink(route.path, locale);
			const url = `${baseUrl}${localizedPath === '/' ? '' : localizedPath}`;
			urls.push(`
    <url>
      <loc>${url}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>${route.changefreq}</changefreq>
      <priority>${route.priority.toFixed(1)}</priority>
    </url>`);
		}
	}

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join('')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			/* @wc-ignore */ 'Content-Type': 'application/xml',
			/* @wc-ignore */ 'Cache-Control': 'public, max-age=3600'
		}
	});
};
