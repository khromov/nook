<script lang="ts">
	import { pipeline, env, RawImage } from '@huggingface/transformers';
	import { onMount, onDestroy } from 'svelte';
	import ImageIcon from 'virtual:icons/lucide/image';
	import DownloadIcon from 'virtual:icons/lucide/download';
	import RefreshCcwIcon from 'virtual:icons/lucide/refresh-ccw';

	import CardInterface from '$lib/components/common/CardInterface.svelte';
	import Toolbar from '$lib/components/common/Toolbar.svelte';
	import ContentArea from '$lib/components/common/ContentArea.svelte';
	import SectionCard from '$lib/components/common/SectionCard.svelte';
	import StepHeader from '$lib/components/common/StepHeader.svelte';
	import ActionButton from '$lib/components/common/ActionButton.svelte';
	import LoadingProgress from '$lib/components/common/LoadingProgress.svelte';
	import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
	import { useWakeLock } from '$lib/wakeLock.svelte';

	import MaskCanvas from '$lib/components/layer-separator/MaskCanvas.svelte';
	import DepthHistogram from '$lib/components/layer-separator/DepthHistogram.svelte';
	import {
		depthToMasks,
		depthHistogram,
		evenThresholds,
		layersFromThresholds,
		resizeThresholds
	} from '$lib/layer-separator/masks';
	import { grayscaleToBlobUrl, downloadBlobUrl } from '$lib/layer-separator/canvas';

	type DepthOutput = { depth: RawImage };
	type DepthPipeline = (input: string) => Promise<DepthOutput>;
	type ProgressEvent = { status: string; progress?: number };

	const MODEL_ID = 'onnx-community/depth-anything-v2-small';
	const MIN_LAYERS = 2;
	const MAX_LAYERS = 5;

	let isModelLoaded = $state(false);
	let isLoadingModel = $state(false);
	let isProcessing = $state(false);
	let modelLoadProgress = $state(0);
	let error = $state(false);
	let errorMessage = $state('');

	let originalImageUrl = $state<string | null>(null);
	let sourceFileName = $state<string>('image');

	// Source-of-truth depth data after inference.
	let depthData = $state<Uint8Array | null>(null);
	let depthW = $state(0);
	let depthH = $state(0);

	let layerCount = $state(3);
	let thresholds = $state<number[]>(evenThresholds(3));

	const histogram = $derived.by(() =>
		depthData ? depthHistogram(depthData) : new Uint32Array(256)
	);

	const layers = $derived.by(() => layersFromThresholds(thresholds));

	const masks = $derived.by(() => {
		if (!depthData) return [];
		return depthToMasks(depthData, layers);
	});

	let depthEstimator: DepthPipeline | null = null;
	const { requestWakeLock, releaseWakeLock, setupWakeLock } = useWakeLock();

	onMount(() => {
		if (env.backends?.onnx?.wasm) {
			env.backends.onnx.wasm.wasmPaths = '/transformers/';
		}
		env.remoteHost = 'https://huggingface.co/';
		env.remotePathTemplate = '{model}/resolve/{revision}/';
		const cleanup = setupWakeLock(() => isProcessing || isLoadingModel);
		loadModel();
		return cleanup;
	});

	async function loadModel() {
		try {
			isLoadingModel = true;
			error = false;
			modelLoadProgress = 0;
			await requestWakeLock();

			depthEstimator = (await pipeline('depth-estimation', MODEL_ID, {
				progress_callback: (progress: ProgressEvent) => {
					if (progress.status === 'progress') {
						modelLoadProgress = Math.round(progress.progress ?? 0);
					} else if (progress.status === 'ready') {
						modelLoadProgress = 100;
					}
				}
			})) as unknown as DepthPipeline;

			modelLoadProgress = 100;
			isModelLoaded = true;
		} catch (err) {
			console.error('Model loading error:', err);
			error = true;
			errorMessage = 'Failed to load depth model. Please check your connection and try again.';
		} finally {
			isLoadingModel = false;
			await releaseWakeLock();
		}
	}

	async function processImage(imageUrl: string) {
		if (!depthEstimator) return;
		try {
			isProcessing = true;
			error = false;
			await requestWakeLock();

			const out = await depthEstimator(imageUrl);
			const depthRaw = out.depth;
			depthW = depthRaw.width;
			depthH = depthRaw.height;
			depthData =
				depthRaw.data instanceof Uint8Array
					? depthRaw.data
					: new Uint8Array(depthRaw.data as ArrayLike<number>);

			// Reset thresholds to even cuts for the new image.
			thresholds = evenThresholds(layerCount);
		} catch (err) {
			console.error('Processing error:', err);
			error = true;
			errorMessage = 'Failed to process image. Please try again.';
		} finally {
			isProcessing = false;
			await releaseWakeLock();
		}
	}

	function handleFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		sourceFileName = file.name.replace(/\.[^.]+$/, '');
		const url = URL.createObjectURL(file);
		if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
			URL.revokeObjectURL(originalImageUrl);
		}
		originalImageUrl = url;
		processImage(url);
	}

	function setLayerCount(n: number) {
		thresholds = resizeThresholds(thresholds, n);
		layerCount = n;
	}

	function onThresholdsChange(next: number[]) {
		thresholds = next;
	}

	async function downloadMask(index: number) {
		if (!depthData) return;
		const url = await grayscaleToBlobUrl(masks[index], depthW, depthH);
		downloadBlobUrl(url, `${sourceFileName}_mask_${index + 1}.png`);
		// Revoke after the click handler so the download has time to start.
		setTimeout(() => URL.revokeObjectURL(url), 5000);
	}

	async function downloadDepth() {
		if (!depthData) return;
		const url = await grayscaleToBlobUrl(depthData, depthW, depthH);
		downloadBlobUrl(url, `${sourceFileName}_depth.png`);
		setTimeout(() => URL.revokeObjectURL(url), 5000);
	}

	function reset() {
		depthData = null;
		depthW = 0;
		depthH = 0;
		if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
			URL.revokeObjectURL(originalImageUrl);
		}
		originalImageUrl = null;
		thresholds = evenThresholds(layerCount);
		error = false;
	}

	function retry() {
		error = false;
		if (!isModelLoaded) loadModel();
	}

	onDestroy(() => {
		if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
			URL.revokeObjectURL(originalImageUrl);
		}
	});
</script>

{#if !isModelLoaded}
	<div class="loading">
		{#if error}
			<ErrorDisplay
				message={errorMessage}
				buttonText={isLoadingModel ? 'Loading...' : 'Retry'}
				onRetry={retry}
				isRetrying={isLoadingModel}
			/>
		{:else if isLoadingModel}
			<LoadingProgress
				title="Loading Depth Model"
				progress={modelLoadProgress}
				message="Downloading Depth Anything V2 (~100 MB). Cached after first load."
			/>
		{/if}
	</div>
{:else}
	<CardInterface>
		<Toolbar modelInfo="Layer Separator (Depth Anything V2 small)" ModelIcon={ImageIcon}>
			{#if depthData}
				<ActionButton onClick={reset} variant="danger" Icon={RefreshCcwIcon}>Restart</ActionButton>
			{/if}
		</Toolbar>

		<ContentArea>
			{#if !depthData}
				<SectionCard rotation={-0.1} animationDelay={0}>
					<StepHeader stepNumber={1} title="Upload Image" backgroundColor="#98fb98" />
					<div class="upload">
						<label class="upload-label">
							Choose an image
							<input type="file" accept="image/*" onchange={handleFile} disabled={isProcessing} />
						</label>
						<p class="hint">
							Output is N-1 cumulative B&W masks at source resolution, ready to drop into Photoshop
							as layer masks.
						</p>
					</div>
				</SectionCard>
			{/if}

			{#if isProcessing}
				<div class="processing">Running depth estimation…</div>
			{/if}

			{#if error}
				<ErrorDisplay message={errorMessage} buttonText="Try Again" onRetry={retry} />
			{/if}

			{#if depthData && originalImageUrl && !isProcessing}
				<SectionCard rotation={0.2} animationDelay={0}>
					<StepHeader stepNumber={2} title="Source & Depth" />
					<div class="grid">
						<figure>
							<figcaption>Original</figcaption>
							<img src={originalImageUrl} alt="Original" />
						</figure>
						<figure>
							<figcaption>Depth map (white = near)</figcaption>
							<MaskCanvas mask={depthData} width={depthW} height={depthH} alt="Depth map" />
							<button class="link-btn" onclick={downloadDepth}>Download depth map</button>
						</figure>
					</div>
				</SectionCard>

				<SectionCard rotation={-0.2} animationDelay={0.1}>
					<StepHeader stepNumber={3} title="Layers & Thresholds" backgroundColor="#ffd93d" />

					<div class="layer-count">
						<span class="layer-count-label">Layers:</span>
						{#each Array.from({ length: MAX_LAYERS - MIN_LAYERS + 1 }, (_, i) => MIN_LAYERS + i) as n (n)}
							<button
								class="count-btn"
								class:active={layerCount === n}
								onclick={() => setLayerCount(n)}
							>
								{n}
							</button>
						{/each}
					</div>

					<DepthHistogram {histogram} {thresholds} onChange={onThresholdsChange} />
					<p class="hint">
						Drag the markers on the histogram to adjust where layers split. Each cut is the depth
						value where the layer boundary sits (0 = far, 255 = near).
					</p>
				</SectionCard>

				<SectionCard rotation={0.1} animationDelay={0.2}>
					<StepHeader stepNumber={4} title="Cumulative Masks" />
					<p class="hint">
						{masks.length} mask{masks.length === 1 ? '' : 's'} for {layers.length} layers. Mask k is BLACK
						where layers 1..k live; the frontmost layer has no mask.
					</p>
					<div class="masks-grid">
						{#each masks as mask, i (i)}
							<figure>
								<figcaption>Mask {i + 1} — covers layers 1–{i + 1}</figcaption>
								<MaskCanvas {mask} width={depthW} height={depthH} alt="Mask {i + 1}" />
								<ActionButton onClick={() => downloadMask(i)} Icon={DownloadIcon}>
									Download mask {i + 1}
								</ActionButton>
							</figure>
						{/each}
					</div>
				</SectionCard>
			{/if}
		</ContentArea>
	</CardInterface>
{/if}

<style>
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		margin: 2rem 0;
	}
	.upload {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	.upload-label {
		padding: 0.75rem 1.5rem;
		background: #ffd93d;
		border: 3px solid #000;
		font-weight: 700;
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-family: 'Space Grotesk', system-ui, sans-serif;
		box-shadow: 4px 4px 0 #000;
	}
	.upload-label:hover {
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0 #000;
	}
	.upload-label input {
		display: none;
	}
	.hint {
		color: #555;
		max-width: 60ch;
		text-align: center;
		font-size: 0.9rem;
		line-height: 1.5;
		margin: 1rem auto;
	}
	.processing {
		text-align: center;
		padding: 2rem;
		font-weight: 600;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-top: 1rem;
	}
	.layer-count {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}
	.layer-count-label {
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-size: 0.875rem;
	}
	.count-btn {
		min-width: 2.5rem;
		padding: 0.4rem 0.6rem;
		background: #f0f0f0;
		border: 2px solid #000;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		box-shadow: 3px 3px 0 #000;
	}
	.count-btn:hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 #000;
	}
	.count-btn.active {
		background: #ffd93d;
	}
	.masks-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-top: 1rem;
	}
	figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	figcaption {
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-size: 0.875rem;
	}
	figure img {
		width: 100%;
		height: auto;
		display: block;
		border: 2px solid #000;
		background: #fff;
	}
	.link-btn {
		background: none;
		border: none;
		color: #00f;
		text-decoration: underline;
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0;
		align-self: flex-start;
	}
	@media (max-width: 700px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
