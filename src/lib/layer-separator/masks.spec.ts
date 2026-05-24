import { describe, it, expect } from 'vitest';
import { evenLayers, assignPixelsToLayers, buildCumulativeMasks, depthToMasks } from './masks';

describe('evenLayers', () => {
	it('rejects fewer than 2 layers', () => {
		expect(() => evenLayers(1)).toThrow();
	});

	it('covers the full depth range', () => {
		const layers = evenLayers(3);
		expect(layers[0].depthMin).toBe(0);
		expect(layers[layers.length - 1].depthMax).toBe(256);
	});

	it('partitions the range without gaps or overlap', () => {
		const layers = evenLayers(4);
		for (let i = 1; i < layers.length; i++) {
			expect(layers[i].depthMin).toBe(layers[i - 1].depthMax);
		}
	});

	it('produces empty overrides', () => {
		const layers = evenLayers(3);
		for (const l of layers) expect(l.overrides).toEqual([]);
	});
});

describe('assignPixelsToLayers', () => {
	it('puts pixel in the correct depth bin', () => {
		const layers = evenLayers(3);
		// 3 layers → [0..85), [85..171), [171..256)
		const depth = new Uint8Array([0, 50, 85, 100, 170, 171, 200, 255]);
		const result = assignPixelsToLayers(depth, layers);
		expect(Array.from(result)).toEqual([0, 0, 1, 1, 1, 2, 2, 2]);
	});

	it('applies override masks over depth thresholds', () => {
		const layers = evenLayers(3);
		// Force pixel 0 (which depth says is layer 0) into layer 2.
		layers[2].overrides.push({
			source: 'sam-override',
			mask: new Uint8Array([255, 0, 0, 0])
		});
		const depth = new Uint8Array([0, 0, 200, 200]);
		const result = assignPixelsToLayers(depth, layers);
		expect(Array.from(result)).toEqual([2, 0, 2, 2]);
	});

	it('lets a later layer override an earlier override on the same pixel', () => {
		const layers = evenLayers(3);
		layers[1].overrides.push({ source: 'sam-override', mask: new Uint8Array([255]) });
		layers[2].overrides.push({ source: 'sam-override', mask: new Uint8Array([255]) });
		const depth = new Uint8Array([0]);
		expect(Array.from(assignPixelsToLayers(depth, layers))).toEqual([2]);
	});

	it('throws when an override mask length mismatches depth', () => {
		const layers = evenLayers(2);
		layers[0].overrides.push({ source: 'sam-override', mask: new Uint8Array([255, 255]) });
		expect(() => assignPixelsToLayers(new Uint8Array([0, 0, 0]), layers)).toThrow();
	});
});

describe('buildCumulativeMasks', () => {
	it('returns N-1 masks for N layers', () => {
		const pixelLayers = new Uint8Array([0, 1, 2]);
		expect(buildCumulativeMasks(pixelLayers, 3)).toHaveLength(2);
	});

	it('returns empty for fewer than 2 layers', () => {
		expect(buildCumulativeMasks(new Uint8Array([0]), 1)).toEqual([]);
	});

	it('mask k is black for pixels in layers 0..k, white for k+1..N-1', () => {
		// 4 pixels in layers [0, 1, 2, 2] across 3 layers → 2 masks
		const pixelLayers = new Uint8Array([0, 1, 2, 2]);
		const [m0, m1] = buildCumulativeMasks(pixelLayers, 3);
		// m0: layer 0 black, layers 1+2 white
		expect(Array.from(m0)).toEqual([0, 255, 255, 255]);
		// m1: layers 0+1 black, layer 2 white
		expect(Array.from(m1)).toEqual([0, 0, 255, 255]);
	});

	it('matches the contract on the README example (sky, mid, foreground)', () => {
		// Pretend 6 pixels: sky, sky, mid, mid, fg, fg → layers 0, 0, 1, 1, 2, 2
		const pixelLayers = new Uint8Array([0, 0, 1, 1, 2, 2]);
		const [maskSky, maskSkyPlusMid] = buildCumulativeMasks(pixelLayers, 3);
		// maskSky: sky black, the rest white
		expect(Array.from(maskSky)).toEqual([0, 0, 255, 255, 255, 255]);
		// maskSkyPlusMid: sky+mid black, foreground white
		expect(Array.from(maskSkyPlusMid)).toEqual([0, 0, 0, 0, 255, 255]);
	});
});

describe('depthToMasks (integration)', () => {
	it('chains assignment + cumulative correctly', () => {
		const layers = evenLayers(3);
		const depth = new Uint8Array([0, 100, 200]);
		const masks = depthToMasks(depth, layers);
		expect(masks).toHaveLength(2);
		// pixel layers: [0, 1, 2]
		expect(Array.from(masks[0])).toEqual([0, 255, 255]);
		expect(Array.from(masks[1])).toEqual([0, 0, 255]);
	});
});
