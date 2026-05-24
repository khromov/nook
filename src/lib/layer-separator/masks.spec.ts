import { describe, it, expect } from 'vitest';
import {
	evenLayers,
	assignPixelsToLayers,
	buildCumulativeMasks,
	depthToMasks,
	evenThresholds,
	layersFromThresholds,
	depthHistogram,
	resizeThresholds
} from './masks';

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

describe('evenThresholds', () => {
	it('returns layerCount - 1 cuts', () => {
		expect(evenThresholds(2)).toHaveLength(1);
		expect(evenThresholds(3)).toHaveLength(2);
		expect(evenThresholds(5)).toHaveLength(4);
	});

	it('matches evenLayers boundaries', () => {
		const layers = evenLayers(4);
		const cuts = evenThresholds(4);
		expect(cuts).toEqual(layers.slice(0, -1).map((l) => l.depthMax));
	});
});

describe('layersFromThresholds', () => {
	it('produces layers that partition 0..256', () => {
		const layers = layersFromThresholds([50, 150]);
		expect(layers).toHaveLength(3);
		expect(layers[0]).toMatchObject({ depthMin: 0, depthMax: 50 });
		expect(layers[1]).toMatchObject({ depthMin: 50, depthMax: 150 });
		expect(layers[2]).toMatchObject({ depthMin: 150, depthMax: 256 });
	});

	it('rejects non-ascending thresholds', () => {
		expect(() => layersFromThresholds([100, 100])).toThrow();
		expect(() => layersFromThresholds([100, 50])).toThrow();
	});

	it('works with a single threshold (2 layers)', () => {
		const layers = layersFromThresholds([128]);
		expect(layers).toHaveLength(2);
		expect(layers[0].depthMax).toBe(128);
		expect(layers[1].depthMin).toBe(128);
	});
});

describe('resizeThresholds', () => {
	it('returns empty for target < 2 layers', () => {
		expect(resizeThresholds([100], 1)).toEqual([]);
	});

	it('returns unchanged when target matches current', () => {
		expect(resizeThresholds([85, 170], 3)).toEqual([85, 170]);
	});

	it('preserves user cuts when growing', () => {
		const grown = resizeThresholds([30, 180], 4);
		expect(grown).toHaveLength(3);
		expect(grown).toContain(30);
		expect(grown).toContain(180);
	});

	it('splits the widest gap when growing', () => {
		// gaps: [0..30]=30, [30..180]=150, [180..256]=76 → widest is 150
		// new cut should be at (30+180)/2 = 105
		const grown = resizeThresholds([30, 180], 4);
		expect(grown).toContain(105);
	});

	it('shrinks by always dropping the foreground (highest) cut', () => {
		expect(resizeThresholds([30, 80, 200], 3)).toEqual([30, 80]);
		expect(resizeThresholds([51, 102, 154, 205], 4)).toEqual([51, 102, 154]);
		expect(resizeThresholds([30, 100, 150, 213], 3)).toEqual([30, 100]);
	});

	it('grow-then-shrink restores original when the new cut went to the right', () => {
		// [50, 150] → grown to 4: widest gap is [150..256], new cut at 203 → [50, 150, 203]
		// Shrunk to 3: pops 203 → [50, 150] ✓
		const grown = resizeThresholds([50, 150], 4);
		expect(resizeThresholds(grown, 3)).toEqual([50, 150]);
	});

	it("user's drag survives growth (chain: even 3 → drag → grow to 5)", () => {
		// User adjusts thresholds from even [85, 170] to dragged [30, 170], then grows to 5.
		const result = resizeThresholds([30, 170], 5);
		expect(result).toHaveLength(4);
		expect(result).toContain(30);
		expect(result).toContain(170);
	});
});

describe('depthHistogram', () => {
	it('counts pixel occurrences per depth bin', () => {
		const depth = new Uint8Array([0, 0, 128, 128, 128, 255]);
		const hist = depthHistogram(depth);
		expect(hist.length).toBe(256);
		expect(hist[0]).toBe(2);
		expect(hist[128]).toBe(3);
		expect(hist[255]).toBe(1);
		expect(hist[42]).toBe(0);
	});

	it('returns all zeros for empty depth', () => {
		const hist = depthHistogram(new Uint8Array(0));
		expect(Array.from(hist)).toEqual(Array(256).fill(0));
	});
});
