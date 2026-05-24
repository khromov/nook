<script lang="ts">
	interface Props {
		mask: Uint8Array;
		width: number;
		height: number;
		alt?: string;
	}
	let { mask, width, height, alt = 'Mask' }: Props = $props();

	let canvasEl: HTMLCanvasElement | undefined = $state();

	$effect(() => {
		if (!canvasEl) return;
		canvasEl.width = width;
		canvasEl.height = height;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;
		const imageData = ctx.createImageData(width, height);
		for (let i = 0; i < mask.length; i++) {
			const v = mask[i];
			const j = i * 4;
			imageData.data[j] = v;
			imageData.data[j + 1] = v;
			imageData.data[j + 2] = v;
			imageData.data[j + 3] = 255;
		}
		ctx.putImageData(imageData, 0, 0);
	});
</script>

<canvas bind:this={canvasEl} aria-label={alt}></canvas>

<style>
	canvas {
		width: 100%;
		height: auto;
		display: block;
		border: 2px solid #000;
		background: #fff;
		image-rendering: pixelated;
	}
</style>
