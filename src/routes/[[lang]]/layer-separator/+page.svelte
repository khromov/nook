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
	import JSZip from 'jszip';

	import MaskCanvas from '$lib/components/layer-separator/MaskCanvas.svelte';
	import DepthHistogram from '$lib/components/layer-separator/DepthHistogram.svelte';
	import SamPicker from '$lib/components/layer-separator/SamPicker.svelte';
	import {
		depthToMasks,
		depthHistogram,
		evenThresholds,
		layersFromThresholds,
		resizeThresholds
	} from '$lib/layer-separator/masks';
	import { grayscaleToBlobUrl, downloadBlobUrl } from '$lib/layer-separator/canvas';
	import {
		loadSam,
		encodeImage,
		predictMask,
		type SamCore,
		type SamSession,
		type SamPoint
	} from '$lib/layer-separator/sam';
	import type { LayerOverride } from '$lib/layer-separator/types';

	type DepthOutput = { depth: RawImage };
	type DepthPipeline = (input: string) => Promise<DepthOutput>;
	type ProgressEvent = { status: string; progress?: number };

	const DEPTH_MODELS = [
		{
			id: 'onnx-community/depth-anything-v2-small',
			name: 'Depth Anything V2 small',
			size: '~100 MB',
			description: 'Faster, good for most images'
		},
		{
			id: 'onnx-community/depth-anything-v2-base',
			name: 'Depth Anything V2 base',
			size: '~390 MB',
			description: 'Slower, sharper edges'
		}
	];
	const MIN_LAYERS = 2;
	const MAX_LAYERS = 5;

	let selectedDepthModelId = $state(DEPTH_MODELS[0].id);
	const selectedDepthModelName = $derived(
		DEPTH_MODELS.find((m) => m.id === selectedDepthModelId)?.name ?? selectedDepthModelId
	);

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
	// Debounced copy of thresholds that drives the (expensive) mask recomputation.
	// Lets the histogram markers drag smoothly without waiting for masks to redraw on
	// every frame. Commits ~150ms after the last threshold change.
	let committedThresholds = $state<number[]>(evenThresholds(3));
	const COMMIT_DELAY_MS = 150;
	// Per-layer overrides, parallel to layers (overridesByLayer[i] applies to layer i).
	let overridesByLayer = $state<LayerOverride[][]>([[], [], []]);

	// SAM state
	let samCore = $state<SamCore | null>(null);
	let samSession = $state<SamSession | null>(null);
	let samStatus = $state<'idle' | 'loading' | 'encoding' | 'ready' | 'error'>('idle');
	let samLoadProgress = $state(0);
	let samErrorMessage = $state('');
	let editingLayerIndex = $state<number | null>(null);
	let pendingMask = $state<Uint8Array | null>(null);
	let pickedPoints = $state<SamPoint[]>([]);
	let isPredicting = $state(false);

	const histogram = $derived.by(() =>
		depthData ? depthHistogram(depthData) : new Uint32Array(256)
	);

	const layers = $derived.by(() => {
		const base = layersFromThresholds(committedThresholds);
		for (let i = 0; i < base.length; i++) {
			base[i].overrides = overridesByLayer[i] ?? [];
		}
		return base;
	});

	let commitTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		const snapshot = thresholds;
		if (commitTimer) clearTimeout(commitTimer);
		commitTimer = setTimeout(() => {
			committedThresholds = [...snapshot];
			commitTimer = null;
		}, COMMIT_DELAY_MS);
		return () => {
			if (commitTimer) {
				clearTimeout(commitTimer);
				commitTimer = null;
			}
		};
	});

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

			depthEstimator = (await pipeline('depth-estimation', selectedDepthModelId, {
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

			// Reset per-image state.
			thresholds = evenThresholds(layerCount);
			overridesByLayer = Array.from({ length: layerCount }, () => []);
			samSession = null;
			cancelEdit();
		} catch (err) {
			console.error('Processing error:', err);
			error = true;
			errorMessage = 'Failed to process image. Please try again.';
		} finally {
			isProcessing = false;
			await releaseWakeLock();
		}
	}

	async function ensureSamReady() {
		if (!originalImageUrl) return;
		if (samStatus === 'idle' || samStatus === 'error') {
			samStatus = 'loading';
			samLoadProgress = 0;
			samErrorMessage = '';
			try {
				if (!samCore) {
					samCore = await loadSam((pct) => (samLoadProgress = pct));
				}
				samStatus = 'encoding';
				samSession = await encodeImage(samCore, originalImageUrl);
				samStatus = 'ready';
			} catch (err) {
				console.error('SAM load/encode error:', err);
				samStatus = 'error';
				samErrorMessage =
					'Failed to load the segmentation model. Check your connection and try again.';
			}
			return;
		}
		// Already loaded, but session may be stale (different image).
		if (samStatus === 'ready' && !samSession && samCore) {
			samStatus = 'encoding';
			try {
				samSession = await encodeImage(samCore, originalImageUrl);
				samStatus = 'ready';
			} catch (err) {
				console.error('SAM encode error:', err);
				samStatus = 'error';
				samErrorMessage = 'Failed to prepare the image for segmentation.';
			}
		}
	}

	async function enterEdit(layerIndex: number) {
		editingLayerIndex = layerIndex;
		pendingMask = null;
		pickedPoints = [];
		await ensureSamReady();
	}

	function cancelEdit() {
		editingLayerIndex = null;
		pendingMask = null;
		pickedPoints = [];
		isPredicting = false;
	}

	async function handleSamClick(x: number, y: number, label: 0 | 1) {
		if (!samSession || editingLayerIndex === null) return;
		pickedPoints = [...pickedPoints, { x, y, label }];
		await runPrediction();
	}

	async function runPrediction() {
		if (!samSession || pickedPoints.length === 0) {
			pendingMask = null;
			return;
		}
		isPredicting = true;
		try {
			const result = await predictMask(samSession, pickedPoints);
			if (result.width !== depthW || result.height !== depthH) {
				console.warn('SAM mask resolution mismatch', result.width, result.height, depthW, depthH);
			}
			pendingMask = result.mask;
		} catch (err) {
			console.error('SAM prediction failed:', err);
			pendingMask = null;
		} finally {
			isPredicting = false;
		}
	}

	function acceptOverride() {
		if (editingLayerIndex === null || !pendingMask) return;
		const idx = editingLayerIndex;
		const next = overridesByLayer.map((arr, i) =>
			i === idx ? [...arr, { source: 'sam-override', mask: pendingMask! } as LayerOverride] : arr
		);
		overridesByLayer = next;
		cancelEdit();
	}

	function clearPoints() {
		pickedPoints = [];
		pendingMask = null;
	}

	async function undoLastPoint() {
		if (pickedPoints.length === 0) return;
		pickedPoints = pickedPoints.slice(0, -1);
		await runPrediction();
	}

	$effect(() => {
		if (editingLayerIndex === null) return;
		function onKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
				e.preventDefault();
				undoLastPoint();
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});

	function removeOverride(layerIdx: number, overrideIdx: number) {
		overridesByLayer = overridesByLayer.map((arr, i) =>
			i === layerIdx ? arr.filter((_, j) => j !== overrideIdx) : arr
		);
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
		// Keep overrides for layers that still exist; new layers get empty arrays.
		const next: LayerOverride[][] = [];
		for (let i = 0; i < n; i++) next.push(overridesByLayer[i] ?? []);
		overridesByLayer = next;
		layerCount = n;
		// If we were editing a layer that no longer exists, cancel.
		if (editingLayerIndex !== null && editingLayerIndex >= n) cancelEdit();
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

	async function downloadAllAsZip() {
		if (masks.length === 0 || !depthData) return;
		const zip = new JSZip();
		// Each mask as a PNG.
		for (let i = 0; i < masks.length; i++) {
			const url = await grayscaleToBlobUrl(masks[i], depthW, depthH);
			try {
				const blob = await (await fetch(url)).blob();
				zip.file(`${sourceFileName}_mask_${i + 1}.png`, blob);
			} finally {
				URL.revokeObjectURL(url);
			}
		}
		// Also include the depth map for reference.
		const depthUrl = await grayscaleToBlobUrl(depthData, depthW, depthH);
		try {
			const depthBlob = await (await fetch(depthUrl)).blob();
			zip.file(`${sourceFileName}_depth.png`, depthBlob);
		} finally {
			URL.revokeObjectURL(depthUrl);
		}
		const zipBlob = await zip.generateAsync({ type: 'blob' });
		const zipUrl = URL.createObjectURL(zipBlob);
		downloadBlobUrl(zipUrl, `${sourceFileName}_layers.zip`);
		setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
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
		overridesByLayer = Array.from({ length: layerCount }, () => []);
		samSession = null;
		cancelEdit();
		error = false;
	}

	function retry() {
		error = false;
		if (!isModelLoaded) loadModel();
	}

	function handleDepthModelChange(modelId: string) {
		if (modelId === selectedDepthModelId) return;
		selectedDepthModelId = modelId;
		reset();
		isModelLoaded = false;
		depthEstimator = null;
		loadModel();
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
		<Toolbar modelInfo="Layer Separator ({selectedDepthModelName})" ModelIcon={ImageIcon}>
			{#if depthData}
				<ActionButton onClick={reset} variant="danger" Icon={RefreshCcwIcon}>Restart</ActionButton>
			{/if}
		</Toolbar>

		<ContentArea>
			{#if !depthData}
				<SectionCard rotation={0.2} animationDelay={0}>
					<StepHeader stepNumber={1} title="Depth Model" backgroundColor="#ff69b4" />
					<div class="model-buttons">
						{#each DEPTH_MODELS as model (model.id)}
							<button
								class="model-btn"
								class:active={selectedDepthModelId === model.id}
								onclick={() => handleDepthModelChange(model.id)}
								disabled={isLoadingModel}
							>
								<span class="model-name">{model.name}</span>
								<span class="model-size">{model.size}</span>
								<span class="model-desc">{model.description}</span>
							</button>
						{/each}
					</div>
				</SectionCard>

				<SectionCard rotation={-0.1} animationDelay={0.1}>
					<StepHeader stepNumber={2} title="Upload Image" backgroundColor="#98fb98" />
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
					<StepHeader stepNumber={3} title="Source & Depth" />
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
					<StepHeader stepNumber={4} title="Layers & Thresholds" backgroundColor="#ffd93d" />

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

				<SectionCard rotation={0.15} animationDelay={0.15}>
					<StepHeader stepNumber={5} title="Refine with object clicks" backgroundColor="#ff69b4" />
					<p class="hint">
						Depth gets some objects wrong (e.g. the building grouped with the foreground leaves).
						Click <strong>Add object</strong> on a layer, then click that object on the image — a segmentation
						model picks out the shape and forces it into the layer you chose.
					</p>

					<div class="layer-overrides">
						{#each layers as layer, i (i)}
							{@const isFar = i === 0}
							{@const isNear = i === layers.length - 1}
							<div class="layer-row" class:active={editingLayerIndex === i}>
								<div class="layer-row-label">
									Layer {i + 1}
									<span class="depth-range">depth {layer.depthMin}–{layer.depthMax}</span>
									{#if isFar}<span class="tag">farthest</span>{:else if isNear}<span class="tag"
											>nearest</span
										>{/if}
								</div>
								<div class="layer-row-overrides">
									{#each overridesByLayer[i] ?? [] as ov, j (j)}
										<span class="override-chip" title={ov.source}>
											Object {j + 1}
											<button
												class="chip-remove"
												aria-label="Remove object {j + 1} from layer {i + 1}"
												onclick={() => removeOverride(i, j)}
											>
												×
											</button>
										</span>
									{/each}
								</div>
								<button
									class="add-override-btn"
									onclick={() => enterEdit(i)}
									disabled={editingLayerIndex !== null && editingLayerIndex !== i}
								>
									{editingLayerIndex === i ? 'Editing…' : '+ Add object'}
								</button>
							</div>
						{/each}
					</div>

					{#if editingLayerIndex !== null}
						<div class="sam-editor">
							{#if samStatus === 'loading'}
								<p>Loading segmentation model… {samLoadProgress}%</p>
							{:else if samStatus === 'encoding'}
								<p>Preparing image…</p>
							{:else if samStatus === 'error'}
								<p class="sam-error">
									{samErrorMessage}
									<button onclick={() => enterEdit(editingLayerIndex!)}>Retry</button>
								</p>
							{:else if samStatus === 'ready' && originalImageUrl}
								<p class="sam-instr">
									Click anywhere on the image to build a mask for
									<strong>Layer {editingLayerIndex + 1}</strong>. Each click refines the previous
									result.
								</p>
								<SamPicker
									imageUrl={originalImageUrl}
									{pendingMask}
									maskWidth={depthW}
									maskHeight={depthH}
									points={pickedPoints}
									{isPredicting}
									onPick={handleSamClick}
								/>
								<div class="sam-actions">
									{#if pendingMask}
										<ActionButton onClick={acceptOverride} variant="success">
											Accept ({pickedPoints.length} point{pickedPoints.length === 1 ? '' : 's'}
											→ layer {editingLayerIndex + 1})
										</ActionButton>
									{/if}
									{#if pickedPoints.length > 0}
										<button
											class="link-btn"
											onclick={undoLastPoint}
											title="Remove the last point (⌘Z)"
										>
											Undo last point
										</button>
										<button class="link-btn" onclick={clearPoints}>Clear points</button>
									{/if}
									<button class="link-btn" onclick={cancelEdit}>Cancel</button>
								</div>
							{/if}
						</div>
					{/if}
				</SectionCard>

				<SectionCard rotation={0.1} animationDelay={0.2}>
					<StepHeader stepNumber={6} title="Cumulative Masks" />
					<p class="hint">
						{masks.length} mask{masks.length === 1 ? '' : 's'} for {layers.length} layers. Mask k is BLACK
						where layers 1..k live; the frontmost layer has no mask.
					</p>
					<div class="masks-actions">
						<ActionButton onClick={downloadAllAsZip} variant="success" Icon={DownloadIcon}>
							Download all as zip
						</ActionButton>
					</div>
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
	.layer-overrides {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 1rem 0;
	}
	.layer-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border: 2px solid #000;
		background: #fff;
		flex-wrap: wrap;
	}
	.layer-row.active {
		background: #ffe5f1;
		border-color: #ff69b4;
	}
	.layer-row-label {
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.tag {
		font-size: 0.7rem;
		color: #555;
		background: #f0f0f0;
		padding: 0.1rem 0.4rem;
		text-transform: lowercase;
		letter-spacing: 0;
		font-weight: 600;
	}
	.depth-range {
		font-size: 0.7rem;
		color: #888;
		font-weight: 400;
		text-transform: none;
		letter-spacing: 0;
		font-family: monospace;
	}
	.layer-row-overrides {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		flex: 1;
	}
	.override-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.2rem 0.5rem;
		background: #ff69b4;
		color: #000;
		border: 2px solid #000;
		font-size: 0.75rem;
		font-weight: 700;
	}
	.chip-remove {
		background: none;
		border: none;
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		color: #000;
	}
	.add-override-btn {
		padding: 0.4rem 0.75rem;
		background: #98fb98;
		border: 2px solid #000;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		box-shadow: 3px 3px 0 #000;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.add-override-btn:not(:disabled):hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 #000;
	}
	.add-override-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.sam-editor {
		margin-top: 1rem;
		padding: 1rem;
		border: 3px dashed #ff69b4;
		background: #fff;
	}
	.sam-instr {
		font-weight: 600;
		margin: 0 0 0.75rem;
	}
	.sam-error {
		color: #800;
		font-weight: 600;
	}
	.sam-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-top: 0.75rem;
		flex-wrap: wrap;
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
	.masks-actions {
		display: flex;
		justify-content: center;
		margin: 1rem 0;
	}
	.model-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	.model-btn {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 1rem 1.25rem;
		background: #f8f8f8;
		border: 3px solid #000;
		border-radius: 8px;
		cursor: pointer;
		font-family: inherit;
		box-shadow: 4px 4px 0 #000;
		min-width: 200px;
		text-align: left;
	}
	.model-btn:hover:not(:disabled) {
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0 #000;
	}
	.model-btn.active {
		background: #ffd93d;
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0 #000;
	}
	.model-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.model-name {
		font-weight: 700;
		font-size: 0.95rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.model-size {
		font-size: 0.75rem;
		color: #555;
		font-family: monospace;
	}
	.model-desc {
		font-size: 0.8rem;
		color: #444;
	}
	@media (max-width: 700px) {
		.grid {
			grid-template-columns: 1fr;
		}
		.layer-row {
			padding: 0.5rem;
			gap: 0.5rem;
		}
		.layer-row-label {
			width: 100%;
			justify-content: flex-start;
		}
		.add-override-btn {
			width: 100%;
		}
		.depth-range {
			display: none;
		}
	}
</style>
