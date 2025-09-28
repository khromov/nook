import type { PageLoad } from './$types';

export const load: PageLoad = ({ parent }) => {
	return parent().then((data) => ({
		...data,
		seo: {
			...data.seo,
			title: 'Nook - Private, Offline AI in Your Browser',
			description:
				'Free, private AI tools that run entirely in your browser - and even offline! Chat with LLMs, transcribe audio, and remove backgrounds using WebAssembly.'
		}
	}));
};
