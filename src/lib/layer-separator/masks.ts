import type { Layer } from './types';

export const DEPTH_MIN = 0;
export const DEPTH_MAX = 256;

/**
 * Build `count` evenly-spaced layers covering the full depth range, back-to-front.
 * Index 0 = farthest (lowest depth values), index count-1 = nearest.
 */
export function evenLayers(count: number): Layer[] {
	if (count < 2) throw new Error('Need at least 2 layers');
	const layers: Layer[] = [];
	for (let i = 0; i < count; i++) {
		const min = i === 0 ? DEPTH_MIN : Math.round((i * DEPTH_MAX) / count);
		const max = i === count - 1 ? DEPTH_MAX : Math.round(((i + 1) * DEPTH_MAX) / count);
		layers.push({ depthMin: min, depthMax: max, overrides: [] });
	}
	return layers;
}

/**
 * Assign each pixel to a layer index based on depth + overrides.
 * Depth values come from a single-channel depth map (0..255).
 *
 * Overrides win over depth thresholds. When a pixel is claimed by multiple
 * overrides, the later (more foreground) layer wins.
 */
export function assignPixelsToLayers(depth: Uint8Array, layers: Layer[]): Uint8Array {
	const n = depth.length;
	const out = new Uint8Array(n);

	for (let i = 0; i < n; i++) {
		const d = depth[i];
		let layer = layers.length - 1;
		for (let l = 0; l < layers.length; l++) {
			if (d >= layers[l].depthMin && d < layers[l].depthMax) {
				layer = l;
				break;
			}
		}
		out[i] = layer;
	}

	for (let l = 0; l < layers.length; l++) {
		for (const ov of layers[l].overrides) {
			if (ov.mask.length !== n) {
				throw new Error(`Override mask length ${ov.mask.length} does not match depth length ${n}`);
			}
			for (let i = 0; i < n; i++) {
				if (ov.mask[i] === 255) out[i] = l;
			}
		}
	}

	return out;
}

/**
 * Build cumulative B&W masks from per-pixel layer assignments.
 * Returns `layerCount - 1` masks — the frontmost layer has no mask.
 *
 * Mask k (0-indexed): pixels assigned to layers 0..k are BLACK (0),
 * pixels in layers k+1..N-1 are WHITE (255). White = "in front of this cut".
 */
export function buildCumulativeMasks(pixelLayers: Uint8Array, layerCount: number): Uint8Array[] {
	if (layerCount < 2) return [];
	const masks: Uint8Array[] = [];
	for (let k = 0; k < layerCount - 1; k++) {
		const m = new Uint8Array(pixelLayers.length);
		for (let i = 0; i < pixelLayers.length; i++) {
			m[i] = pixelLayers[i] <= k ? 0 : 255;
		}
		masks.push(m);
	}
	return masks;
}

/**
 * Convenience: depth map → cumulative masks in one call.
 */
export function depthToMasks(depth: Uint8Array, layers: Layer[]): Uint8Array[] {
	return buildCumulativeMasks(assignPixelsToLayers(depth, layers), layers.length);
}

/**
 * Build the initial threshold cuts for `layerCount` evenly-spaced layers.
 * Returns `layerCount - 1` cuts in 1..255.
 */
export function evenThresholds(layerCount: number): number[] {
	if (layerCount < 2) return [];
	const out: number[] = [];
	for (let i = 1; i < layerCount; i++) out.push(Math.round((i * DEPTH_MAX) / layerCount));
	return out;
}

/**
 * Construct layers from explicit threshold cuts (length = layerCount - 1).
 * Cuts must be sorted ascending and within [1, 255].
 */
export function layersFromThresholds(thresholds: number[]): Layer[] {
	const layers: Layer[] = [];
	let prev = DEPTH_MIN;
	for (const t of thresholds) {
		if (t <= prev) throw new Error('thresholds must be strictly ascending');
		layers.push({ depthMin: prev, depthMax: t, overrides: [] });
		prev = t;
	}
	layers.push({ depthMin: prev, depthMax: DEPTH_MAX, overrides: [] });
	return layers;
}

/**
 * Build a 256-bin histogram of depth values (count per depth bin).
 */
export function depthHistogram(depth: Uint8Array): Uint32Array {
	const hist = new Uint32Array(256);
	for (let i = 0; i < depth.length; i++) hist[depth[i]]++;
	return hist;
}
