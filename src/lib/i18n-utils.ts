import { locales } from 'virtual:wuchale/locales';
import { resolve } from '$app/paths';

/**
 * Extract the current language from a URL pathname
 * @param pathname - The URL pathname (e.g., '/es/chat' or '/chat')
 * @returns The current language code or 'en' as default
 */
export function getCurrentLanguage(pathname: string): string {
	const pathSegments = pathname.split('/').filter(Boolean);
	const firstSegment = pathSegments[0];
	return locales.includes(firstSegment) ? firstSegment : 'en';
}

/**
 * Create a localized link by prepending the language code
 * @param path - The base path (e.g., '/chat')
 * @param lang - The language code (e.g., 'es')
 * @returns The localized path (e.g., '/es/chat/' or '/chat/' for English)
 */
export function createLocalizedLink(path: string, lang: string): string {
	// Add trailing slash to all paths except root
	const pathWithSlash = path === '/' ? path : path.endsWith('/') ? path : `${path}/`;

	let localizedPath: string;
	if (lang === 'en') {
		localizedPath = pathWithSlash; // English uses clean URLs without prefix
	} else {
		// Handle root path specially to avoid double slash
		if (pathWithSlash === '/') {
			localizedPath = `/${lang}/`;
		} else {
			localizedPath = `/${lang}${pathWithSlash}`;
		}
	}

	return resolve(localizedPath);
}

/**
 * Get the current language from a page store (for use in components)
 * @param page - The page store object from $app/stores
 * @returns The current language code
 */
export function getCurrentLanguageFromPage(page: { url: { pathname: string } }): string {
	return getCurrentLanguage(page.url.pathname);
}

/**
 * Create localized links for specific tokenizer paths
 * @param currentLang - The current language code
 * @returns Object with localized tokenizer paths
 */
export function getTokenizerPaths(currentLang: string) {
	return {
		openai: createLocalizedLink('/count-tokens/openai-chatgpt', currentLang),
		anthropic: createLocalizedLink('/count-tokens/anthropic-claude', currentLang),
		gemini: createLocalizedLink('/count-tokens/google-gemini', currentLang)
	};
}

/**
 * Export the available locales from Wuchale for use in other components
 */
export { locales };
