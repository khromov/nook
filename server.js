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

// Serve locally downloaded models when LOCAL_MODELS_PATH is set.
// Files are served at the root so /models/file.gguf maps to
// LOCAL_MODELS_PATH/models/file.gguf, matching the CDN path structure.
const localModelsPath = process.env.LOCAL_MODELS_PATH;
if (localModelsPath) {
	console.log(`Serving local models from: ${localModelsPath}`);
	app.use(express.static(localModelsPath, { maxAge: '7d', immutable: true }));
}

app.use(handler);

app.listen(3000, () => {
	console.log('listening on port 3000');
});
