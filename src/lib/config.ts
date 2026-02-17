/**
 * Application configuration constants
 */

// Use an absolute origin so model URLs work inside Web Workers (blob: context can't resolve relative paths).
export const BASE_MODEL_URL = typeof window !== 'undefined' ? window.location.origin : '';
