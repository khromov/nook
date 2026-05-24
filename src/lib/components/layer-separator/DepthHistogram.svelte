<script lang="ts">
	interface Props {
		histogram: Uint32Array;
		thresholds: number[];
		onChange: (next: number[]) => void;
		height?: number;
		minSpacing?: number;
	}

	let { histogram, thresholds, onChange, height = 100, minSpacing = 4 }: Props = $props();

	let containerEl: HTMLDivElement | undefined = $state();
	let containerWidth = $state(0);
	let activeIndex = $state<number | null>(null);

	// sqrt scale so a few dominant bins don't squash everything else flat
	const maxBin = $derived.by(() => {
		let m = 0;
		for (let i = 0; i < histogram.length; i++) if (histogram[i] > m) m = histogram[i];
		return Math.sqrt(m);
	});

	const barWidth = $derived(containerWidth > 0 ? containerWidth / 256 : 0);

	function depthToPx(d: number): number {
		return (d / 256) * containerWidth;
	}

	function pxToDepth(x: number): number {
		return Math.max(0, Math.min(256, Math.round((x / containerWidth) * 256)));
	}

	function startDrag(i: number, e: PointerEvent) {
		e.preventDefault();
		activeIndex = i;
		(e.target as Element).setPointerCapture(e.pointerId);
	}

	function onMove(e: PointerEvent) {
		if (activeIndex === null || !containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		const x = e.clientX - rect.left;
		let d = pxToDepth(x);
		const lower = activeIndex > 0 ? thresholds[activeIndex - 1] + minSpacing : 1;
		const upper =
			activeIndex < thresholds.length - 1 ? thresholds[activeIndex + 1] - minSpacing : 255;
		d = Math.max(lower, Math.min(upper, d));
		const next = [...thresholds];
		next[activeIndex] = d;
		onChange(next);
	}

	function endDrag(e: PointerEvent) {
		if (activeIndex === null) return;
		const target = e.target as Element;
		if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
		activeIndex = null;
	}
</script>

<div
	class="histogram"
	bind:this={containerEl}
	bind:clientWidth={containerWidth}
	style:height="{height}px"
	onpointermove={onMove}
	onpointerup={endDrag}
	onpointercancel={endDrag}
	role="group"
	aria-label="Depth histogram with draggable layer thresholds"
>
	{#if containerWidth > 0}
		<svg width={containerWidth} {height}>
			<rect x="0" y="0" width={containerWidth} {height} fill="#f0f0f0" />
			{#if maxBin > 0}
				{#each histogram as count, d (d)}
					{@const h = (Math.sqrt(count) / maxBin) * height}
					<rect
						x={depthToPx(d)}
						y={height - h}
						width={Math.max(1, barWidth)}
						height={h}
						fill="#666"
					/>
				{/each}
			{/if}
			{#each thresholds as t, i (i)}
				<g class:active={activeIndex === i}>
					<line
						class="marker-line"
						x1={depthToPx(t)}
						x2={depthToPx(t)}
						y1="0"
						y2={height}
						stroke="#000"
						stroke-width="2"
					/>
					<rect
						class="marker-hit"
						x={depthToPx(t) - 8}
						y="0"
						width="16"
						{height}
						fill="transparent"
						role="slider"
						tabindex="0"
						aria-label="Threshold {i + 1}"
						aria-valuemin={i > 0 ? thresholds[i - 1] + minSpacing : 1}
						aria-valuemax={i < thresholds.length - 1 ? thresholds[i + 1] - minSpacing : 255}
						aria-valuenow={t}
						onpointerdown={(e) => startDrag(i, e)}
					/>
					<text x={depthToPx(t)} y="14" text-anchor="middle" class="marker-label">
						{t}
					</text>
				</g>
			{/each}
		</svg>
	{/if}
</div>

<style>
	.histogram {
		position: relative;
		width: 100%;
		border: 2px solid #000;
		background: #fff;
		box-sizing: border-box;
		user-select: none;
		touch-action: none;
	}
	.marker-hit {
		cursor: ew-resize;
	}
	.marker-label {
		font-size: 11px;
		font-weight: 700;
		font-family: monospace;
		fill: #fff;
		paint-order: stroke;
		stroke: #000;
		stroke-width: 3px;
	}
	g.active .marker-line {
		stroke: #ff69b4;
	}
</style>
