import { depthToMasks } from './masks';
import type { Layer } from './types';

export interface MasksRequest {
	id: number;
	depth: Uint8Array;
	layers: Layer[];
}

export interface MasksResponse {
	id: number;
	masks: Uint8Array[];
}

// Runs the full-resolution pixel loop off the main thread so the editor stays
// responsive (and the "Updating masks…" indicator keeps animating) on large images.
self.onmessage = (e: MessageEvent) => {
	const { id, depth, layers } = e.data as MasksRequest;
	const masks = depthToMasks(depth, layers);
	// Transfer the mask buffers back instead of cloning them.
	const transfer = masks.map((m) => m.buffer);
	(self as unknown as Worker).postMessage({ id, masks } satisfies MasksResponse, transfer);
};
