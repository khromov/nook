import { existsSync } from 'fs';
import { resolve } from 'path';
import { handler } from './build/handler.js';
import express from 'express';

const app = express();

app.use((req, res, next) => {
	res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
	res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
	next();
});

app.get('/_health', (req, res) => {
	res.end('ok');
});

// Serve locally downloaded models from ./local-models if the directory exists,
// or from LOCAL_MODELS_PATH if set. Files are served at the root so
// /models/file.gguf maps to the local directory, matching the CDN path structure.
const localModelsPath = resolve(process.env.LOCAL_MODELS_PATH || './local-models');
if (existsSync(localModelsPath)) {
	console.log(`Serving local models from: ${localModelsPath}`);
	app.use(express.static(localModelsPath, { maxAge: '7d', immutable: true }));
}

app.use(handler);

app.listen(3002, () => {
	console.log('listening on port 3002');
});
