<script lang="ts">
	import type { SamPoint } from '$lib/layer-separator/sam';
	import ZoomInIcon from 'virtual:icons/lucide/zoom-in';
	import ZoomOutIcon from 'virtual:icons/lucide/zoom-out';

	interface Props {
		imageUrl: string;
		pendingMask: Uint8Array | null;
		maskWidth: number;
		maskHeight: number;
		points: SamPoint[];
		isPredicting: boolean;
		onPick: (x: number, y: number, label: 0 | 1) => void;
		overlayColor?: string;
	}

	let {
		imageUrl,
		pendingMask,
		maskWidth,
		maskHeight,
		points,
		isPredicting,
		onPick,
		overlayColor = '255, 105, 180'
	}: Props = $props();

	let imgEl: HTMLImageElement | undefined = $state();
	let overlayCanvasEl: HTMLCanvasElement | undefined = $state();
	let zoom = $state(1);

	const ZOOM_LEVELS = [1, 1.5, 2, 3, 4];

	function handleClick(e: MouseEvent) {
		if (!imgEl) return;
		const rect = imgEl.getBoundingClientRect();
		const displayX = e.clientX - rect.left;
		const displayY = e.clientY - rect.top;
		// rect.width already reflects the zoom, so this stays correct at any zoom.
		const x = (displayX / rect.width) * imgEl.naturalWidth;
		const y = (displayY / rect.height) * imgEl.naturalHeight;
		const label: 0 | 1 = e.shiftKey ? 0 : 1;
		onPick(Math.round(x), Math.round(y), label);
	}

	function zoomIn() {
		const idx = ZOOM_LEVELS.indexOf(zoom);
		if (idx < ZOOM_LEVELS.length - 1) zoom = ZOOM_LEVELS[idx + 1];
	}

	function zoomOut() {
		const idx = ZOOM_LEVELS.indexOf(zoom);
		if (idx > 0) zoom = ZOOM_LEVELS[idx - 1];
	}

	function fitZoom() {
		zoom = 1;
	}

	$effect(() => {
		if (!overlayCanvasEl || !pendingMask) return;
		overlayCanvasEl.width = maskWidth;
		overlayCanvasEl.height = maskHeight;
		const ctx = overlayCanvasEl.getContext('2d');
		if (!ctx) return;
		const imageData = ctx.createImageData(maskWidth, maskHeight);
		const [r, g, b] = overlayColor.split(',').map((s) => parseInt(s.trim(), 10));
		for (let i = 0; i < pendingMask.length; i++) {
			const j = i * 4;
			if (pendingMask[i] > 0) {
				imageData.data[j] = r;
				imageData.data[j + 1] = g;
				imageData.data[j + 2] = b;
				imageData.data[j + 3] = 140;
			}
		}
		ctx.putImageData(imageData, 0, 0);
	});
</script>

<div class="picker" class:predicting={isPredicting}>
	<div class="zoom-bar">
		<button
			class="zoom-btn"
			onclick={zoomOut}
			disabled={zoom === ZOOM_LEVELS[0]}
			aria-label="Zoom out"
		>
			<ZoomOutIcon />
		</button>
		<button class="zoom-btn fit" onclick={fitZoom} aria-label="Fit to width">{zoom}×</button>
		<button
			class="zoom-btn"
			onclick={zoomIn}
			disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
			aria-label="Zoom in"
		>
			<ZoomInIcon />
		</button>
	</div>
	<div class="scroll-container">
		<div class="image-wrap" style:width="{zoom * 100}%">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<img
				bind:this={imgEl}
				src={imageUrl}
				alt="Click on the object you want to assign to this layer"
				onclick={handleClick}
				draggable="false"
			/>
			{#if pendingMask}
				<canvas class="overlay" bind:this={overlayCanvasEl} aria-hidden="true"></canvas>
			{/if}
			{#if imgEl}
				{#each points as p, i (i)}
					<span
						class="click-dot"
						class:bg={p.label === 0}
						style:left="{(p.x / imgEl.naturalWidth) * 100}%"
						style:top="{(p.y / imgEl.naturalHeight) * 100}%"
					></span>
				{/each}
			{/if}
			{#if isPredicting}
				<div class="spinner" role="status" aria-label="Segmenting object">
					<span class="spinner-dot" aria-hidden="true"></span>
					Segmenting…
				</div>
			{/if}
		</div>
	</div>
	<p class="hint">
		<strong>Click</strong> add · <strong>Shift+click</strong> subtract · zoom &amp; scroll to refine small
		areas
	</p>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.zoom-bar {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}
	.zoom-btn {
		padding: 0.3rem 0.6rem;
		background: #f0f0f0;
		border: 2px solid #000;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
	}
	.zoom-btn:hover:not(:disabled) {
		background: #ffd93d;
	}
	.zoom-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.zoom-btn.fit {
		min-width: 3rem;
		font-size: 0.85rem;
	}
	.zoom-btn :global(svg) {
		width: 1rem;
		height: 1rem;
	}
	.scroll-container {
		max-height: 80vh;
		overflow: auto;
		border: 2px solid #000;
		background: #fff;
	}
	.image-wrap {
		position: relative;
		display: block;
		width: 100%;
	}
	img {
		display: block;
		width: 100%;
		height: auto;
		cursor: crosshair;
		user-select: none;
		-webkit-user-drag: none;
	}
	.overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		mix-blend-mode: multiply;
	}
	.click-dot {
		position: absolute;
		width: 14px;
		height: 14px;
		background: #ff69b4;
		border: 2px solid #000;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		box-shadow: 0 0 0 2px #fff;
	}
	.click-dot.bg {
		background: #6090ff;
	}
	.spinner {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #000;
		color: #fff;
		padding: 0.4rem 0.8rem;
		font-weight: 700;
		letter-spacing: 1px;
	}
	.spinner-dot {
		width: 12px;
		height: 12px;
		border: 3px solid #fff;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spinner-rotate 0.6s linear infinite;
	}
	@keyframes spinner-rotate {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner-dot {
			animation: none;
		}
	}
	.picker.predicting img {
		cursor: wait;
	}
	.hint {
		font-size: 0.8rem;
		color: #555;
		margin: 0;
	}
</style>
