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

	import { depthToMasks, evenLayers } from '$lib/layer-separator/masks';
	import { grayscaleToBlobUrl, downloadBlobUrl } from '$lib/layer-separator/canvas';

	type DepthOutput = { depth: RawImage };
	type DepthPipeline = (input: string) => Promise<DepthOutput>;
	type ProgressEvent = { status: string; progress?: number };

	const MODEL_ID = 'onnx-community/depth-anything-v2-small';
	const LAYER_COUNT = 3;

	let isModelLoaded = $state(false);
	let isLoadingModel = $state(false);
	let isProcessing = $state(false);
	let modelLoadProgress = $state(0);
	let error = $state(false);
	let errorMessage = $state('');

	let originalImageUrl = $state<string | null>(null);
	let depthMapUrl = $state<string | null>(null);
	let maskUrls = $state<string[]>([]);
	let sourceFileName = $state<string>('image');

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
			revokeMaskUrls();

			const out = await depthEstimator(imageUrl);
			const depthRaw = out.depth;
			const w = depthRaw.width;
			const h = depthRaw.height;
			// depth-estimation returns a single-channel image; .data is length w*h.
			const depthData =
				depthRaw.data instanceof Uint8Array
					? depthRaw.data
					: new Uint8Array(depthRaw.data as ArrayLike<number>);

			const layers = evenLayers(LAYER_COUNT);
			const masks = depthToMasks(depthData, layers);

			if (depthMapUrl) URL.revokeObjectURL(depthMapUrl);
			depthMapUrl = await grayscaleToBlobUrl(depthData, w, h);

			const urls: string[] = [];
			for (const mask of masks) {
				urls.push(await grayscaleToBlobUrl(mask, w, h));
			}
			maskUrls = urls;
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

	function downloadMask(index: number) {
		downloadBlobUrl(maskUrls[index], `${sourceFileName}_mask_${index + 1}.png`);
	}

	function downloadDepth() {
		if (depthMapUrl) downloadBlobUrl(depthMapUrl, `${sourceFileName}_depth.png`);
	}

	function revokeMaskUrls() {
		for (const url of maskUrls) URL.revokeObjectURL(url);
		maskUrls = [];
	}

	function reset() {
		revokeMaskUrls();
		if (depthMapUrl) {
			URL.revokeObjectURL(depthMapUrl);
			depthMapUrl = null;
		}
		if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
			URL.revokeObjectURL(originalImageUrl);
		}
		originalImageUrl = null;
		error = false;
	}

	function retry() {
		error = false;
		if (!isModelLoaded) loadModel();
	}

	onDestroy(() => {
		revokeMaskUrls();
		if (depthMapUrl) URL.revokeObjectURL(depthMapUrl);
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
			{#if originalImageUrl}
				<ActionButton onClick={reset} variant="danger" Icon={RefreshCcwIcon}>Restart</ActionButton>
			{/if}
		</Toolbar>

		<ContentArea>
			{#if !originalImageUrl}
				<SectionCard rotation={-0.1} animationDelay={0}>
					<StepHeader stepNumber={1} title="Upload Image" backgroundColor="#98fb98" />
					<div class="upload">
						<label class="upload-label">
							Choose an image
							<input type="file" accept="image/*" onchange={handleFile} disabled={isProcessing} />
						</label>
						<p class="hint">
							Depth model runs locally in your browser. Output is {LAYER_COUNT - 1} cumulative B&W masks
							at source resolution, ready to drop into Photoshop as layer masks.
						</p>
					</div>
				</SectionCard>
			{/if}

			{#if isProcessing}
				<div class="processing">Running depth estimation and building masks…</div>
			{/if}

			{#if error}
				<ErrorDisplay message={errorMessage} buttonText="Try Again" onRetry={retry} />
			{/if}

			{#if originalImageUrl && !isProcessing && maskUrls.length > 0}
				<SectionCard rotation={0.2} animationDelay={0}>
					<StepHeader stepNumber={2} title="Source & Depth" />
					<div class="grid">
						<figure>
							<figcaption>Original</figcaption>
							<img src={originalImageUrl} alt="Original" />
						</figure>
						<figure>
							<figcaption>Depth map (white = near)</figcaption>
							{#if depthMapUrl}
								<img src={depthMapUrl} alt="Depth map" />
								<button class="link-btn" onclick={downloadDepth}>Download depth map</button>
							{/if}
						</figure>
					</div>
				</SectionCard>

				<SectionCard rotation={-0.2} animationDelay={0.1}>
					<StepHeader stepNumber={3} title="Cumulative Layer Masks" backgroundColor="#ffd93d" />
					<p class="hint">
						{maskUrls.length} mask{maskUrls.length === 1 ? '' : 's'} for {LAYER_COUNT} layers. Mask k
						is BLACK where layers 1..k live (apply it to extract those layers in Photoshop); the frontmost
						layer has no mask — it's what remains.
					</p>
					<div class="masks-grid">
						{#each maskUrls as url, i (i)}
							<figure>
								<figcaption>Mask {i + 1}</figcaption>
								<img src={url} alt="Mask {i + 1}" />
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
		width: 100%;
		box-sizing: border-box;
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
