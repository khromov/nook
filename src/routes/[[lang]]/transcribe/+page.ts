import type { PageLoad } from './$types';

export const ssr = true;

export const load: PageLoad = ({ parent }) => {
	return parent().then((data) => ({
		...data,
		seo: {
			...data.seo,
			title: 'Audio Transcription - Nook',
			description:
				'Convert speech to text using Whisper AI. Upload any existing audio file and export as text or subtitle file. High accuracy with multiple formats and local processing.'
		}
	}));
};
