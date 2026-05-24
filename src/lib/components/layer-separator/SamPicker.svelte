<script lang="ts">
	import type { SamPoint } from '$lib/layer-separator/sam';

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

	function handleClick(e: MouseEvent) {
		if (!imgEl) return;
		const rect = imgEl.getBoundingClientRect();
		const displayX = e.clientX - rect.left;
		const displayY = e.clientY - rect.top;
		const x = (displayX / rect.width) * imgEl.naturalWidth;
		const y = (displayY / rect.height) * imgEl.naturalHeight;
		// Shift = subtract (background), normal = add (foreground)
		const label: 0 | 1 = e.shiftKey ? 0 : 1;
		onPick(Math.round(x), Math.round(y), label);
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
	<div class="image-wrap">
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
			<div class="spinner" aria-label="Predicting mask">…</div>
		{/if}
	</div>
	<p class="hint">
		<strong>Click</strong> = add to mask · <strong>Shift+click</strong> = remove from mask
	</p>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.image-wrap {
		position: relative;
		display: inline-block;
		border: 2px solid #000;
		background: #fff;
		max-width: 100%;
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
		background: #000;
		color: #fff;
		padding: 0.4rem 0.8rem;
		font-weight: 700;
		letter-spacing: 2px;
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
