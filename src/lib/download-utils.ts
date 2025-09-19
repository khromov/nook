declare global {
	interface FileSystemDirectoryHandle {
		entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
	}
	interface FileSystemFileHandle {
		getFile(): Promise<File>;
	}
}

function getModelFileName(url: string): string {
	return url.split('/').pop() || 'downloaded-model';
}

export function isOPFSSupported(forceDisable = false): boolean {
	if (forceDisable) {
		return false;
	}

	return 'navigator' in globalThis && 'storage' in navigator && 'getDirectory' in navigator.storage;
}

async function getCachedModel(fileName: string): Promise<File | null> {
	if (!isOPFSSupported()) {
		return null;
	}

	try {
		const opfsRoot = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle(fileName);
		const file = await fileHandle.getFile();
		console.log(`Found cached model: ${fileName}`);
		return file;
	} catch {
		console.log(`Model not cached: ${fileName}`);
		return null;
	}
}

async function cacheModel(fileName: string, data: Uint8Array): Promise<void> {
	if (!isOPFSSupported()) {
		return;
	}

	try {
		const opfsRoot = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle(fileName, { create: true });
		const writable = await fileHandle.createWritable();
		await writable.write(new Uint8Array(data));
		await writable.close();
		console.log(`Cached model: ${fileName}`);
	} catch (error) {
		console.error('Failed to cache model:', error);
	}
}

export async function downloadModelWithProgress(
	url: string,
	onProgress: (progress: number, cached?: boolean) => void
): Promise<File> {
	const fileName = getModelFileName(url);

	const cachedModel = await getCachedModel(fileName);
	if (cachedModel) {
		onProgress(100, true);
		console.log(`Using cached model: ${fileName}`);
		return cachedModel;
	}

	onProgress(0);
	console.log(`Downloading model from: ${url}`);

	if (!isOPFSSupported()) {
		console.log('OPFS not supported, using simple fetch');
		onProgress(-1);
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to download model: ${response.statusText}`);
		}

		const blob = await response.blob();
		onProgress(100);
		console.log(`Downloaded model without progress tracking: ${fileName}`);
		return new File([blob], fileName);
	}

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to download model: ${response.statusText}`);
	}

	// Get total file size from Content-Length header
	const contentLength = /* @wc-ignore */ response.headers.get('Content-Length');
	const total = contentLength ? parseInt(contentLength, 10) : 0;

	const reader = response.body?.getReader();

	if (!reader) {
		throw new Error('Failed to read response body');
	}

	const chunks: Uint8Array[] = [];
	let receivedLength = 0;

	while (true) {
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		chunks.push(value);
		receivedLength += value.length;

		if (total) {
			const progress = Math.round((receivedLength / total) * 100);
			onProgress(progress);
			console.log(`Model download progress: ${progress}%`);
		}
	}

	const allChunks = new Uint8Array(receivedLength);
	let position = 0;

	for (const chunk of chunks) {
		allChunks.set(chunk, position);
		position += chunk.length;
	}

	await cacheModel(fileName, allChunks);

	const blob = new Blob([allChunks]);

	onProgress(100);

	return new File([blob], fileName);
}

export async function clearModelCache(): Promise<void> {
	if (!isOPFSSupported()) {
		console.log('OPFS not supported, cannot clear cache');
		return;
	}

	try {
		const opfsRoot = await navigator.storage.getDirectory();

		for await (const [name, handle] of opfsRoot.entries()) {
			if (handle.kind === 'file' && name.endsWith('.bin')) {
				await opfsRoot.removeEntry(name);
				console.log(`Removed cached model: ${name}`);
			}
		}

		console.log('Model cache cleared');
	} catch (error) {
		console.error('Failed to clear model cache:', error);
	}
}

export async function isModelCached(url: string): Promise<boolean> {
	const fileName = getModelFileName(url);
	const cachedModel = await getCachedModel(fileName);
	return cachedModel !== null;
}

export async function getCacheInfo(): Promise<{ fileName: string; size: number }[]> {
	if (!isOPFSSupported()) {
		return [];
	}

	const cacheInfo: { fileName: string; size: number }[] = [];

	try {
		const opfsRoot = await navigator.storage.getDirectory();

		for await (const [name, handle] of opfsRoot.entries()) {
			if (handle.kind === 'file' && name.endsWith('.bin')) {
				const file = await (handle as FileSystemFileHandle).getFile();
				cacheInfo.push({
					fileName: name,
					size: file.size
				});
			}
		}
	} catch (error) {
		console.error('Failed to get cache info:', error);
	}

	return cacheInfo;
}

export async function cachedFetch(url: string): Promise<Response> {
	// const file = await downloadModelWithProgress(url, () => {});
	//return new Response(file);
	return fetch(url);
}
