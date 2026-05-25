/**
 * Render a single-channel byte array (0..255) as a grayscale PNG Blob.
 * `data` must have length `width * height`.
 */
export function grayscaleToBlob(data: Uint8Array, width: number, height: number): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Could not get 2D context');

	const imageData = ctx.createImageData(width, height);
	for (let i = 0; i < data.length; i++) {
		const v = data[i];
		const j = i * 4;
		imageData.data[j] = v;
		imageData.data[j + 1] = v;
		imageData.data[j + 2] = v;
		imageData.data[j + 3] = 255;
	}
	ctx.putImageData(imageData, 0, 0);

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error('toBlob returned null'));
		}, 'image/png');
	});
}

/**
 * Convenience wrapper that creates a blob URL ready for an `<a download>` link.
 * Caller is responsible for revoking via `URL.revokeObjectURL`.
 */
export async function grayscaleToBlobUrl(
	data: Uint8Array,
	width: number,
	height: number
): Promise<string> {
	const blob = await grayscaleToBlob(data, width, height);
	return URL.createObjectURL(blob);
}

/**
 * Trigger a browser download for a blob URL.
 */
export function downloadBlobUrl(url: string, filename: string): void {
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}
