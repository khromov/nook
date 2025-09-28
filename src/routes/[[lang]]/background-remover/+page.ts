import type { PageLoad } from './$types';

export const ssr = true;

export const load: PageLoad = ({ parent }) => {
	return parent().then((data) => ({
		...data,
		seo: {
			...data.seo,
			title: 'Background Remover - Nook',
			description:
				'Remove backgrounds from images using AI. Powered by the RMBG v1.4 model from BRIA AI for professional results. AI-powered, high quality.'
		}
	}));
};
