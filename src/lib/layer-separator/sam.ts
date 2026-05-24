import { SamModel, AutoProcessor, RawImage, Tensor } from '@huggingface/transformers';

export const SAM_MODEL_ID = 'Xenova/slimsam-77-uniform';

type ProgressEvent = { status: string; progress?: number };

export interface SamCore {
	model: any;
	processor: any;
}

export interface SamSession {
	core: SamCore;
	processed: any;
	embeddings: any;
	width: number;
	height: number;
}

export async function loadSam(onProgress: (pct: number) => void = () => {}): Promise<SamCore> {
	const [model, processor] = await Promise.all([
		SamModel.from_pretrained(SAM_MODEL_ID, {
			dtype: 'fp32',
			progress_callback: (p: ProgressEvent) => {
				if (p.status === 'progress') onProgress(Math.round(p.progress ?? 0));
			}
		}),
		AutoProcessor.from_pretrained(SAM_MODEL_ID)
	]);
	return { model, processor };
}

export async function encodeImage(core: SamCore, imageUrl: string): Promise<SamSession> {
	const image = await RawImage.read(imageUrl);
	const processed = await core.processor(image);
	const embeddings = await core.model.get_image_embeddings(processed);
	return {
		core,
		processed,
		embeddings,
		width: image.width,
		height: image.height
	};
}

export interface SamPrediction {
	mask: Uint8Array; // binary 0/255 at session resolution
	width: number;
	height: number;
	score: number;
}

/**
 * Run a single-point prompt and return the best of the 3 candidate masks.
 * Coords are in original-image pixel space (NOT model/reshaped space).
 */
export async function predictMask(
	session: SamSession,
	x: number,
	y: number
): Promise<SamPrediction> {
	const [origH, origW] = session.processed.original_sizes[0];
	const [reshapedH, reshapedW] = session.processed.reshaped_input_sizes[0];
	const px = (x / origW) * reshapedW;
	const py = (y / origH) * reshapedH;

	const input_points = new Tensor('float32', [px, py], [1, 1, 1, 2]);
	const input_labels = new Tensor('int64', [1n], [1, 1, 1]);

	const { pred_masks, iou_scores } = await session.core.model({
		...session.embeddings,
		input_points,
		input_labels
	});

	const masks = await session.core.processor.post_process_masks(
		pred_masks,
		session.processed.original_sizes,
		session.processed.reshaped_input_sizes
	);

	const scores = iou_scores.data as Float32Array;
	const numMasks = scores.length;
	let best = 0;
	for (let i = 1; i < numMasks; i++) if (scores[i] > scores[best]) best = i;

	// post_process_masks returns masks[batch][prompt] — for 1 batch / 1 prompt: masks[0][0].
	// That tensor has dims [numMasks, H, W] with data interleaved as numMasks * pixel + maskIdx.
	const tensor = masks[0][0];
	const dims = tensor.dims as number[];
	const H = dims[dims.length - 2];
	const W = dims[dims.length - 1];
	const data = tensor.data as Uint8Array | Int8Array;

	const bin = new Uint8Array(H * W);
	for (let i = 0; i < H * W; i++) {
		bin[i] = data[i * numMasks + best] ? 255 : 0;
	}
	return { mask: bin, width: W, height: H, score: scores[best] };
}
