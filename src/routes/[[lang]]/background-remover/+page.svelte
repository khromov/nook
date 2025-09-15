<script lang="ts">
	import { pipeline, env } from '@huggingface/transformers';
	import { onMount, onDestroy } from 'svelte';
	import { useWakeLock } from '$lib/wakeLock.svelte';
	import JSZip from 'jszip';
	import ImageIcon from 'virtual:icons/lucide/image';
	import RefreshCcwIcon from 'virtual:icons/lucide/refresh-ccw';
	import FolderIcon from 'virtual:icons/lucide/folder';

	import BackgroundRemoverUpload from '$lib/components/background-remover/BackgroundRemoverUpload.svelte';
	import BackgroundRemoverProgress from '$lib/components/background-remover/BackgroundRemoverProgress.svelte';
	import BackgroundRemoverResult from '$lib/components/background-remover/BackgroundRemoverResult.svelte';
	import BackgroundRemoverBatchResult from '$lib/components/background-remover/BackgroundRemoverBatchResult.svelte';
	import LoadingProgress from '$lib/components/common/LoadingProgress.svelte';
	import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
	import CardInterface from '$lib/components/common/CardInterface.svelte';
	import Toolbar from '$lib/components/common/Toolbar.svelte';
	import ContentArea from '$lib/components/common/ContentArea.svelte';
	import SectionCard from '$lib/components/common/SectionCard.svelte';
	import StepHeader from '$lib/components/common/StepHeader.svelte';
	import ActionButton from '$lib/components/common/ActionButton.svelte';
	import { BASE_MODEL_URL } from '$lib/config';

	let isModelLoaded = $state(false);
	let isLoadingModel = $state(false);
	let isProcessing = $state(false);
	let error = $state(false);
	let errorMessage = $state('');
	let modelLoadProgress = $state(0);
	let processingProgress = $state(0);

	// Configure custom model URL
	if (env.backends?.onnx?.wasm) {
		env.backends.onnx.wasm.wasmPaths = '/transformers/';
	}
	env.remoteHost = `${BASE_MODEL_URL}/bgremoval/`;
	env.remotePathTemplate = '{model}/';

	// Mode selection
	let processingMode = $state<'single' | 'batch'>('single');

	const getAvailableModels = () => {
		return [
			{
				id: 'RMBG-1.4', //briaai/
				name: 'RMBG v1.4',
				description: ['Small and fast', 'Runs on most devices'],
				size: '44MB',
				precision: 'QUANT'
			},
			{
				id: 'BEN2-ONNX', //briaai/
				name: 'BEN2',
				description: ['Large, very slow model', 'Generally provides better results'],
				size: '235MB',
				precision: 'FP16'
			}
		];
	};

	let selectedModelId = $state('RMBG-1.4');

	// Computed model info for display
	let modelInfo = $derived(
		`Background Remover (${getAvailableModels().find((m) => m.id === selectedModelId)?.name})`
	);

	// Single image mode
	let selectedFile: File | null = $state(null);
	let processedImageUrl = $state<string | null>(null);
	let originalImageUrl = $state<string | null>(null);

	// Batch mode
	let selectedFiles: File[] = $state([]);
	let batchResults: Array<{
		file: File;
		originalThumbnail: string;
		processedThumbnail: string | null;
		processedFullUrl: string | null; // Full size for download
		error?: string;
	}> = $state([]);
	let currentBatchIndex = $state(0);
	let totalBatchCount = $state(0);

	let segmenter: any = null;

	const EXAMPLE_URL = '/pexels-photo-5965592.jpeg';

	const { requestWakeLock, releaseWakeLock, setupWakeLock } = useWakeLock();

	onMount(() => {
		const cleanup = setupWakeLock(() => isProcessing || isLoadingModel);
		// Auto-load model when page loads
		loadModel();
		return cleanup;
	});

	async function loadModel() {
		try {
			isLoadingModel = true;
			error = false;
			modelLoadProgress = 0;

			await requestWakeLock();

			segmenter = await pipeline('background-removal', selectedModelId, {
				progress_callback: (progress: any) => {
					if (progress.status === 'initiate') {
						console.log('Initiating download of', progress);
					} else if (progress.status === 'progress') {
						modelLoadProgress = Math.round(progress.progress || 0);
					} else if (progress.status === 'ready') {
						modelLoadProgress = 100;
					}
				}
			});

			modelLoadProgress = 100;
			isModelLoaded = true;
		} catch (err) {
			console.error('Model loading error:', err);
			error = true;
			errorMessage =
				'Failed to load background removal model. Please check your connection and try again.';
		} finally {
			isLoadingModel = false;
			await releaseWakeLock();
		}
	}

	// Helper function to create a thumbnail from a blob URL
	async function createThumbnail(imageUrl: string, maxSize: number = 500): Promise<string | null> {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');

				// Calculate thumbnail dimensions
				let width = img.width;
				let height = img.height;
				if (width > height) {
					if (width > maxSize) {
						height = (height * maxSize) / width;
						width = maxSize;
					}
				} else {
					if (height > maxSize) {
						width = (width * maxSize) / height;
						height = maxSize;
					}
				}

				canvas.width = width;
				canvas.height = height;
				ctx?.drawImage(img, 0, 0, width, height);

				canvas.toBlob((blob) => {
					if (blob) {
						resolve(URL.createObjectURL(blob));
					} else {
						resolve(null);
					}
					// Canvas will be garbage collected when function exits
				}, 'image/png'); // Use PNG to preserve transparency
			};
			img.onerror = () => {
				resolve(null);
			};
			img.src = imageUrl;
		});
	}

	async function processImage(
		imageUrl: string
	): Promise<{ fullUrl: string | null; thumbnail: string | null }> {
		if (!segmenter) return { fullUrl: null, thumbnail: null };

		let tempCanvas: HTMLCanvasElement | null = null;
		let rawImage: any = null;

		try {
			// Process the image using the pipeline
			const output = await segmenter(imageUrl);

			// The pipeline returns an array with the processed image
			if (output && output.length > 0) {
				// The output is a RawImage, create a proper HTML canvas
				rawImage = output[0];
				tempCanvas = rawImage.toCanvas();

				// Create a new HTML canvas element
				const canvas = document.createElement('canvas');
				canvas.width = rawImage.width;
				canvas.height = rawImage.height;
				const ctx = canvas.getContext('2d');

				// Draw the image onto the HTML canvas
				if (ctx && tempCanvas) {
					ctx.drawImage(tempCanvas, 0, 0);
				}

				// Clean up temp canvas immediately
				if (tempCanvas && tempCanvas.parentNode) {
					tempCanvas.parentNode.removeChild(tempCanvas);
				}
				tempCanvas = null;

				// Dispose of RawImage if it has a dispose method
				if (rawImage && typeof rawImage.dispose === 'function') {
					rawImage.dispose();
				}
				rawImage = null;

				return new Promise((resolve) => {
					canvas.toBlob(async (blob) => {
						if (blob) {
							const fullUrl = URL.createObjectURL(blob);
							// Create thumbnail from the full image
							const thumbnail = await createThumbnail(fullUrl, 500);
							resolve({ fullUrl, thumbnail });
						} else {
							resolve({ fullUrl: null, thumbnail: null });
						}
					}, 'image/png');
				});
			}
			return { fullUrl: null, thumbnail: null };
		} catch (err) {
			console.error('Error processing image:', err);
			// Clean up on error
			if (tempCanvas && tempCanvas.parentNode) {
				tempCanvas.parentNode.removeChild(tempCanvas);
			}
			tempCanvas = null;
			if (rawImage && typeof rawImage.dispose === 'function') {
				rawImage.dispose();
			}
			rawImage = null;
			return { fullUrl: null, thumbnail: null };
		}
	}

	async function handleSingleImageProcessing(imageUrl: string) {
		try {
			isProcessing = true;
			processingProgress = 0;
			originalImageUrl = imageUrl;

			await requestWakeLock();

			// Simulate progress steps
			processingProgress = 25;
			await new Promise((resolve) => setTimeout(resolve, 100));

			processingProgress = 50;
			const result = await processImage(imageUrl);

			processingProgress = 100;

			if (processedImageUrl) {
				URL.revokeObjectURL(processedImageUrl);
			}
			processedImageUrl = result.fullUrl;
			// Clean up thumbnail since we don't use it in single mode
			if (result.thumbnail) {
				URL.revokeObjectURL(result.thumbnail);
			}
		} catch (err) {
			console.error('Processing error:', err);
			error = true;
			errorMessage = 'Failed to process image. Please try again.';
		} finally {
			isProcessing = false;
			await releaseWakeLock();
		}
	}

	async function handleBatchProcessing(files: File[]) {
		try {
			isProcessing = true;
			processingProgress = 0;
			currentBatchIndex = 0;
			totalBatchCount = files.length;

			// Initialize batch results with empty placeholders
			batchResults = files.map((file) => ({
				file,
				originalThumbnail: '',
				processedThumbnail: null,
				processedFullUrl: null
			}));

			await requestWakeLock();

			// Process each image
			for (let i = 0; i < files.length; i++) {
				currentBatchIndex = i + 1;
				processingProgress = Math.round((i / files.length) * 100);

				let originalUrl: string | null = null;
				try {
					// Create blob URL for the original file
					originalUrl = URL.createObjectURL(files[i]);

					// Create thumbnail for original
					const originalThumb = await createThumbnail(originalUrl, 500);
					if (originalThumb) {
						batchResults[i].originalThumbnail = originalThumb;
					}

					// Process the image
					const result = await processImage(originalUrl);

					// Store results
					batchResults[i].processedThumbnail = result.thumbnail;
					batchResults[i].processedFullUrl = result.fullUrl;

					// IMPORTANT: Immediately revoke the original blob URL to free memory
					URL.revokeObjectURL(originalUrl);
					originalUrl = null;
				} catch (err) {
					console.error(`Error processing image ${i + 1}:`, err);
					batchResults[i].error = 'Processing failed';
					// Clean up on error
					if (originalUrl) {
						URL.revokeObjectURL(originalUrl);
					}
				}

				// Update reactivity
				batchResults = [...batchResults];
			}

			processingProgress = 100;
		} catch (err) {
			console.error('Batch processing error:', err);
			error = true;
			errorMessage = 'Failed to process batch. Please try again.';
		} finally {
			isProcessing = false;
			await releaseWakeLock();
		}
	}

	function handleSingleFileSelect(file: File) {
		selectedFile = file;
		const url = URL.createObjectURL(file);
		handleSingleImageProcessing(url);
	}

	function handleBatchFileSelect(files: File[]) {
		selectedFiles = files;
		handleBatchProcessing(files);
	}

	function handleExampleUse() {
		if (processingMode === 'single') {
			handleSingleImageProcessing(EXAMPLE_URL);
		}
	}

	function clearResults() {
		if (processingMode === 'single') {
			if (processedImageUrl) {
				URL.revokeObjectURL(processedImageUrl);
				processedImageUrl = null;
			}
			if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
				URL.revokeObjectURL(originalImageUrl);
			}
			originalImageUrl = null;
			selectedFile = null;
		} else {
			// Clear batch results - revoke all URLs
			batchResults.forEach((result) => {
				if (result.originalThumbnail) {
					URL.revokeObjectURL(result.originalThumbnail);
				}
				if (result.processedThumbnail) {
					URL.revokeObjectURL(result.processedThumbnail);
				}
				if (result.processedFullUrl) {
					URL.revokeObjectURL(result.processedFullUrl);
				}
			});
			batchResults = [];
			selectedFiles = [];
		}
		error = false;
	}

	function switchMode(mode: 'single' | 'batch') {
		clearResults();
		processingMode = mode;
	}

	async function downloadBatchAsZip() {
		const zip = new JSZip();
		const successfulResults = batchResults.filter((r) => r.processedFullUrl && !r.error);

		for (let i = 0; i < successfulResults.length; i++) {
			const result = successfulResults[i];
			try {
				const response = await fetch(result.processedFullUrl!);
				const blob = await response.blob();
				const fileName = `${result.file.name.split('.')[0]}_bg_removed.png`;
				zip.file(fileName, blob);
			} catch (err) {
				console.error(`Failed to add ${result.file.name} to zip:`, err);
			}
		}

		const zipBlob = await zip.generateAsync({ type: 'blob' });
		const url = URL.createObjectURL(zipBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'background_removed_images.zip';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	function retry() {
		error = false;
		if (!isModelLoaded) {
			loadModel();
		}
	}

	function handleModelChange(newModelId: string) {
		if (newModelId !== selectedModelId) {
			selectedModelId = newModelId;
			// Clear existing results
			clearResults();
			// Reset model state
			isModelLoaded = false;
			segmenter = null;
			// Load new model
			loadModel();
		}
	}

	onDestroy(() => {
		if (processedImageUrl) {
			URL.revokeObjectURL(processedImageUrl);
		}
		if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
			URL.revokeObjectURL(originalImageUrl);
		}
		// Clean up batch results - all URLs
		batchResults.forEach((result) => {
			if (result.originalThumbnail) {
				URL.revokeObjectURL(result.originalThumbnail);
			}
			if (result.processedThumbnail) {
				URL.revokeObjectURL(result.processedThumbnail);
			}
			if (result.processedFullUrl) {
				URL.revokeObjectURL(result.processedFullUrl);
			}
		});
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
				title="Loading Background Removal Model"
				progress={modelLoadProgress}
				message="The AI model is being downloaded and initialized. This may take a few moments."
			/>
		{/if}
	</div>
{:else}
	<CardInterface>
		<Toolbar {modelInfo} ModelIcon={ImageIcon}>
			{#if (processingMode === 'single' && processedImageUrl) || (processingMode === 'batch' && batchResults.length > 0)}
				<ActionButton onClick={clearResults} variant="danger" Icon={RefreshCcwIcon}
					>Restart</ActionButton
				>
			{/if}
		</Toolbar>

		<ContentArea>
			<!-- Model Selection -->
			{#if !isProcessing && !processedImageUrl && batchResults.length === 0}
				<SectionCard rotation={0.2} animationDelay={0}>
					<StepHeader stepNumber={1} title="Model Selection" backgroundColor="#ff69b4" />
					<div class="model-buttons">
						{#each getAvailableModels() as modelOption (modelOption.id)}
							<button
								class="model-btn"
								class:active={selectedModelId === modelOption.id}
								onclick={() => handleModelChange(modelOption.id)}
								disabled={isLoadingModel}
							>
								<span class="model-name">{modelOption.name}</span>
								<div class="model-badges">
									<span class="model-size">{modelOption.size}</span>
									<span class="model-precision">{modelOption.precision}</span>
								</div>
								<div class="model-description">
									{#each modelOption.description as line, index (index)}
										<div>{line}</div>
									{/each}
								</div>
							</button>
						{/each}
					</div>
				</SectionCard>
			{/if}

			<!-- Mode Selection -->
			{#if !isProcessing && !processedImageUrl && batchResults.length === 0}
				<SectionCard rotation={-0.3} animationDelay={0.1}>
					<StepHeader stepNumber={2} title="Processing Mode" />
					<div class="mode-buttons">
						<button
							class="mode-btn"
							class:active={processingMode === 'single'}
							onclick={() => switchMode('single')}
						>
							<span class="mode-icon"><ImageIcon /></span>
							Single Image
						</button>
						<button
							class="mode-btn"
							class:active={processingMode === 'batch'}
							onclick={() => switchMode('batch')}
						>
							<span class="mode-icon"><FolderIcon /></span>
							Multiple images
						</button>
					</div>
				</SectionCard>
			{/if}

			{#if !isProcessing && !processedImageUrl && batchResults.length === 0}
				<SectionCard rotation={-0.1} animationDelay={0.2}>
					<StepHeader stepNumber={3} title="Upload Images" backgroundColor="#98fb98" />
					<BackgroundRemoverUpload
						mode={processingMode}
						{selectedFile}
						{selectedFiles}
						onFileSelect={handleSingleFileSelect}
						onFilesSelect={handleBatchFileSelect}
						onExampleUse={handleExampleUse}
						disabled={isProcessing}
					/>
				</SectionCard>
			{/if}

			{#if isProcessing}
				<BackgroundRemoverProgress
					progress={processingProgress}
					message={processingMode === 'single'
						? 'Processing image and removing background...'
						: `Processing image ${currentBatchIndex} of ${totalBatchCount}...`}
				/>
			{/if}

			{#if error}
				<ErrorDisplay message={errorMessage} buttonText="Try Again" onRetry={retry} />
			{/if}

			{#if processingMode === 'single' && processedImageUrl && originalImageUrl && !isProcessing}
				<BackgroundRemoverResult
					{originalImageUrl}
					{processedImageUrl}
					onProcessAnother={clearResults}
				/>
			{/if}

			{#if processingMode === 'batch' && batchResults.length > 0 && !isProcessing}
				<BackgroundRemoverBatchResult
					{batchResults}
					onProcessAnother={clearResults}
					onDownloadZip={downloadBatchAsZip}
				/>
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
		animation: fadeIn 0.4s ease-out;
		width: 100%;
		box-sizing: border-box;
		overflow-x: hidden;
		padding: 0;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Mode Selection */
	.mode-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.mode-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		background: #f0f0f0;
		border: 3px solid #000;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 700;
		transition: all 0.2s;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-family: 'Space Grotesk', system-ui, sans-serif;
		box-shadow: 4px 4px 0 #000;
		min-width: 140px;
	}

	.mode-btn:hover {
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0 #000;
		background: #e0e0e0;
	}

	.mode-btn.active {
		background: #98fb98;
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0 #000;
	}

	.mode-btn.active:hover {
		background: #90ee90;
	}

	.mode-icon {
		font-size: 2rem;
		display: flex;
		align-items: center;
		color: #000;
	}

	.mode-icon :global(svg) {
		width: 2rem;
		height: 2rem;
	}

	/* Model Selection */
	.model-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.model-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		background: #f8f8f8;
		border: 3px solid #000;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 600;
		transition: all 0.2s;
		font-family: 'Space Grotesk', system-ui, sans-serif;
		box-shadow: 4px 4px 0 #000;
		min-width: 160px;
		text-align: center;
	}

	.model-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.model-btn:not(:disabled):hover {
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0 #000;
		background: #e8e8e8;
	}

	.model-btn.active {
		background: #ffd93d;
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0 #000;
	}

	.model-btn.active:not(:disabled):hover {
		background: #ffcc00;
	}

	.model-name {
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #000;
	}

	.model-badges {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.model-size {
		font-size: 0.8rem;
		font-weight: 600;
		color: #333;
		background: rgba(0, 0, 0, 0.1);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		text-transform: none;
		letter-spacing: 0;
	}

	.model-precision {
		font-size: 0.8rem;
		font-weight: 600;
		color: #fff;
		background: #6366f1;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		text-transform: none;
		letter-spacing: 0;
	}

	.model-description {
		font-size: 0.75rem;
		color: #666;
		text-transform: none;
		letter-spacing: 0;
		font-weight: 400;
		line-height: 1.2;
	}

	@media (max-width: 600px) {
		.loading {
			align-items: stretch;
			margin: 1rem 0;
		}

		.mode-buttons,
		.model-buttons {
			flex-direction: column;
			gap: 0.75rem;
		}

		.mode-btn,
		.model-btn {
			min-width: auto;
			width: 100%;
		}
	}

	@media (max-width: 400px) {
		.loading {
			margin: 0.5rem 0;
		}
	}
</style>
