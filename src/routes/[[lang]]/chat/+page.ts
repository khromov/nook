import type { PageLoad } from './$types';

export const load: PageLoad = ({ parent }) => {
	return parent().then((data) => ({
		...data,
		seo: {
			...data.seo,
			title: 'AI Chat - Nook',
			description:
				'Chat with Large Language Models like Gemma3, completely on-device thanks to llama.cpp. Private, secure, and works offline with no data sharing.'
		}
	}));
};
