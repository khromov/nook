import { describe, it, expect, vi } from 'vitest';

// Mock the transformers SDK so we don't need WASM / ONNX in the test runner.
// Only the Tensor constructor is read from the module by predictMask; the
// rest is exercised through the fake session.
vi.mock('@huggingface/transformers', () => ({
	SamModel: { from_pretrained: vi.fn() },
	AutoProcessor: { from_pretrained: vi.fn() },
	RawImage: { read: vi.fn() },
	Tensor: class {
		type: string;
		data: ArrayLike<number> | BigInt64Array | Float32Array;
		dims: number[];
		constructor(
			type: string,
			data: ArrayLike<number> | BigInt64Array | Float32Array,
			dims: number[]
		) {
			this.type = type;
			this.data = data;
			this.dims = dims;
		}
	}
}));

import { predictMask, type SamSession } from './sam';

/**
 * Build a fake SamSession that returns a fabricated mask tensor with the
 * given dims and data, and a fabricated iou_scores vector. Lets us prove the
 * NCHW indexing in predictMask without running the real model.
 */
function makeFakeSession(opts: {
	dims: number[];
	maskData: Uint8Array;
	scores: number[];
	origSize?: [number, number];
	reshapedSize?: [number, number];
}): SamSession {
	const { dims, maskData, scores, origSize = [2, 2], reshapedSize = [2, 2] } = opts;
	const tensor = { dims, data: maskData };
	return {
		core: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			model: (async () => ({
				pred_masks: { dims: [1, 1, ...dims] },
				iou_scores: { data: new Float32Array(scores) }
			})) as any,
			processor: {
				post_process_masks: async () => [tensor]
			}
		},
		processed: {
			original_sizes: [origSize],
			reshaped_input_sizes: [reshapedSize]
		},
		embeddings: {},
		width: origSize[1],
		height: origSize[0]
	} as unknown as SamSession;
}

describe('predictMask', () => {
	it('reads the best mask from planar NCHW data (mask 1 wins)', async () => {
		// dims = [1, 3, 2, 2] → 3 candidate masks of 2x2 pixels each.
		// Memory layout NCHW: mask 0 first 4 bytes, mask 1 next 4, mask 2 last 4.
		const maskData = new Uint8Array([
			0,
			0,
			0,
			0, // mask 0 — empty
			1,
			1,
			1,
			1, // mask 1 — all foreground
			0,
			0,
			0,
			0 // mask 2 — empty
		]);
		const session = makeFakeSession({
			dims: [1, 3, 2, 2],
			maskData,
			scores: [0.1, 0.9, 0.2]
		});
		const result = await predictMask(session, [{ x: 0, y: 0, label: 1 }]);
		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(Array.from(result.mask)).toEqual([255, 255, 255, 255]);
		expect(result.score).toBeCloseTo(0.9);
	});

	it('picks mask 2 when its IOU is highest', async () => {
		const maskData = new Uint8Array([
			0,
			0,
			0,
			0, // mask 0
			0,
			0,
			0,
			0, // mask 1
			1,
			0,
			1,
			0 // mask 2
		]);
		const session = makeFakeSession({
			dims: [1, 3, 2, 2],
			maskData,
			scores: [0.1, 0.2, 0.9]
		});
		const result = await predictMask(session, [{ x: 0, y: 0, label: 1 }]);
		expect(Array.from(result.mask)).toEqual([255, 0, 255, 0]);
	});

	it('rejects an empty points array', async () => {
		const session = makeFakeSession({
			dims: [1, 3, 2, 2],
			maskData: new Uint8Array(12),
			scores: [0, 0, 0]
		});
		await expect(predictMask(session, [])).rejects.toThrow();
	});

	it('reads width/height from the last two dims (works for 3D tensors too)', async () => {
		// Some transformers.js versions strip the batch dim → dims [3, H, W].
		const maskData = new Uint8Array([0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0]);
		const session = makeFakeSession({
			dims: [3, 2, 2],
			maskData,
			scores: [0, 1, 0]
		});
		const result = await predictMask(session, [{ x: 0, y: 0, label: 1 }]);
		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(Array.from(result.mask)).toEqual([255, 255, 255, 255]);
	});
});
