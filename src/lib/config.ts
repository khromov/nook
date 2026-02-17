/**
 * Application configuration constants
 */

export const BASE_MODEL_URL =
	import.meta.env.PUBLIC_LOCAL_MODE === 'true'
		? ''
		: 'https://sta-public.fra1.cdn.digitaloceanspaces.com';
