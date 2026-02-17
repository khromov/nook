/**
 * Application configuration constants
 */

export const BASE_MODEL_URL =
	import.meta.env.PUBLIC_BASE_MODEL_URL || // import.meta to work with Web Workers
	'https://sta-public.fra1.cdn.digitaloceanspaces.com';
