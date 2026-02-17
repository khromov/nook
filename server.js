import { existsSync } from 'fs';
import { resolve } from 'path';
import { handler } from './build/handler.js';
import express from 'express';

const CDN_URL = 'https://sta-public.fra1.cdn.digitaloceanspaces.com';

const app = express();

app.use((req, res, next) => {
	res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
	res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
	next();
});

app.get('/_health', (req, res) => {
	res.end('ok');
});

// Serve models from ./local-models if present, otherwise redirect to CDN.
const localModelsPath = resolve(process.env.LOCAL_MODELS_PATH || './local-models');
if (existsSync(localModelsPath)) {
	console.log(`Serving local models from: ${localModelsPath}`);
	app.use(express.static(localModelsPath, { maxAge: '7d', immutable: true }));
} else {
	console.log(`No local models found, redirecting to CDN: ${CDN_URL}`);
	app.use('/models', (req, res) => {
		res.redirect(302, `${CDN_URL}/models${req.path}`);
	});
}

app.use(handler);

app.listen(3003, () => {
	console.log('listening on port 3003');
});
