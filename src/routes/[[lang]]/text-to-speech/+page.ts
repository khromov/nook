import type { PageLoad } from './$types';

export const ssr = true;

export const load: PageLoad = ({ parent }) => {
	return parent().then((data) => ({
		...data,
		seo: {
			...data.seo,
			title: 'Text to Speech - Nook',
			description:
				'Convert text to natural-sounding speech using AI models. Choose from Kitten TTS, Piper, or Kokoro models for high-quality voice synthesis, all running locally in your browser.'
		}
	}));
};
