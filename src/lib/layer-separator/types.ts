export type LayerSource = 'depth-threshold' | 'sam-override' | 'paint';

export interface LayerOverride {
	source: LayerSource;
	mask: Uint8Array;
}

export interface Layer {
	depthMin: number;
	depthMax: number;
	overrides: LayerOverride[];
}
