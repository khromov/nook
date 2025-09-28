import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../routes/sitemap.xml/+server';

// Mock the environment and i18n-utils
vi.mock('$app/environment', () => ({
	dev: false
}));

vi.mock('$lib/i18n-utils', () => ({
	createLocalizedLink: vi.fn((path: string, lang: string) => {
		if (lang === 'en') {
			return path === '/' ? '/' : `${path}/`;
		}
		return path === '/' ? `/${lang}/` : `/${lang}${path}/`;
	}),
	locales: ['en', 'es', 'ja', 'sv', 'uk']
}));

describe('Sitemap XML endpoint', () => {
	beforeEach(() => {
		// Mock Date to have consistent timestamps in tests
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
	});

	it('returns XML content with correct headers', async () => {
		const response = await GET({} as any);

		expect(response.headers.get('Content-Type')).toBe('application/xml');
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
	});

	it('generates valid XML sitemap structure', async () => {
		const response = await GET({} as any);
		const xml = await response.text();

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml).toContain('</urlset>');
	});

	it('includes all main tool routes with priority 1.0', async () => {
		const response = await GET({} as any);
		const xml = await response.text();

		// Check main tools have priority 1.0
		const toolRoutes = [
			'/chat',
			'/transcribe',
			'/text-to-speech',
			'/background-remover',
			'/count-tokens'
		];

		for (const route of toolRoutes) {
			expect(xml).toContain(`<loc>https://nook.software${route}/</loc>`);
			// Check that this URL has priority 1.0
			const urlBlock = xml.match(
				new RegExp(
					`<url>.*?<loc>https://nook\\.software${route.replace(/[/]/g, '\\/')}/</loc>.*?</url>`,
					's'
				)
			);
			expect(urlBlock?.[0]).toContain('<priority>1.0</priority>');
		}
	});

	it('includes localized versions of all routes', async () => {
		const response = await GET({} as any);
		const xml = await response.text();

		// Check English (clean URLs with trailing slashes)
		expect(xml).toContain('<loc>https://nook.software</loc>');
		expect(xml).toContain('<loc>https://nook.software/chat/</loc>');

		// Check other languages (with prefixes and trailing slashes)
		expect(xml).toContain('<loc>https://nook.software/es/</loc>');
		expect(xml).toContain('<loc>https://nook.software/es/chat/</loc>');
		expect(xml).toContain('<loc>https://nook.software/ja/transcribe/</loc>');
		expect(xml).toContain('<loc>https://nook.software/sv/text-to-speech/</loc>');
		expect(xml).toContain('<loc>https://nook.software/uk/background-remover/</loc>');
	});

	it('includes count-tokens sub-routes', async () => {
		const response = await GET({} as any);
		const xml = await response.text();

		expect(xml).toContain('<loc>https://nook.software/count-tokens/anthropic-claude/</loc>');
		expect(xml).toContain('<loc>https://nook.software/count-tokens/openai-chatgpt/</loc>');
		expect(xml).toContain('<loc>https://nook.software/es/count-tokens/anthropic-claude/</loc>');
	});

	it('sets correct lastmod timestamps', async () => {
		const response = await GET({} as any);
		const xml = await response.text();

		expect(xml).toContain('<lastmod>2024-01-01T12:00:00.000Z</lastmod>');
	});

	it('sets appropriate changefreq values', async () => {
		const response = await GET({} as any);
		const xml = await response.text();

		expect(xml).toContain('<changefreq>daily</changefreq>'); // home page
		expect(xml).toContain('<changefreq>weekly</changefreq>'); // tools
		expect(xml).toContain('<changefreq>monthly</changefreq>'); // language page
	});

	it('generates correct number of URLs', async () => {
		const response = await GET({} as any);
		const xml = await response.text();

		// Count URL blocks
		const urlBlocks = xml.match(/<url>/g);

		// 9 routes × 5 languages = 45 URLs
		expect(urlBlocks).toHaveLength(45);
	});

	it('formats priority values correctly', async () => {
		const response = await GET({} as any);
		const xml = await response.text();

		// Check that priorities are formatted as decimals, not integers
		expect(xml).toContain('<priority>1.0</priority>');
		expect(xml).toContain('<priority>0.8</priority>');
		expect(xml).not.toContain('<priority>1</priority>'); // Should not have integer format
	});

	it('validates all priority values are within 0.0-1.0 range', async () => {
		const response = await GET({} as any);
		const xml = await response.text();

		// Extract all priority values using regex
		const priorityMatches = xml.match(/<priority>([\d.]+)<\/priority>/g);
		expect(priorityMatches).toBeTruthy();

		const priorities = priorityMatches!.map((match) => {
			const value = match.match(/<priority>([\d.]+)<\/priority>/)?.[1];
			return parseFloat(value!);
		});

		// Check that all priorities are within valid range
		for (const priority of priorities) {
			expect(priority).toBeGreaterThanOrEqual(0.0);
			expect(priority).toBeLessThanOrEqual(1.0);
		}

		// Check that we have the expected priority values
		expect(priorities).toContain(1.0); // Main tools and home page
		expect(priorities).toContain(0.8); // Language page
	});
});
