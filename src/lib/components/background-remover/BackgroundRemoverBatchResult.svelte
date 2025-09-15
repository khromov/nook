<script lang="ts">
	import SparklesIcon from 'virtual:icons/lucide/sparkles';
	import CheckCircleIcon from 'virtual:icons/lucide/check-circle';
	import XCircleIcon from 'virtual:icons/lucide/x-circle';
	import PackageIcon from 'virtual:icons/lucide/package';
	import RotateCwIcon from 'virtual:icons/lucide/rotate-cw';
	import SaveIcon from 'virtual:icons/lucide/save';

	interface BatchResult {
		file: File;
		originalThumbnail: string;
		processedThumbnail: string | null;
		processedFullUrl: string | null;
		error?: string;
	}

	interface Props {
		batchResults: BatchResult[];
		onProcessAnother: () => void;
		onDownloadZip: () => void;
	}

	let { batchResults, onProcessAnother, onDownloadZip }: Props = $props();

	let successfulResults = $derived(batchResults.filter((r) => r.processedFullUrl && !r.error));
	let failedResults = $derived(batchResults.filter((r) => r.error || !r.processedFullUrl));

	// Helper functions to generate alt text (to avoid wuchale plugin issues with template strings)
	function getOriginalAltText(fileName: string) {
		return `Original ${fileName}`;
	}

	function getProcessedAltText(fileName: string) {
		return `Processed ${fileName}`;
	}

	function getFailedAltText(fileName: string) {
		return `Failed ${fileName}`;
	}

	function downloadIndividualImage(result: BatchResult) {
		if (!result.processedFullUrl) return;

		const link = document.createElement('a');
		link.href = result.processedFullUrl;
		link.download = `${result.file.name.split('.')[0]}_bg_removed.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<div class="batch-results-wrapper">
	<div class="batch-results">
		<div class="results-decoration"></div>
		<div class="results-content">
			<div class="results-header">
				<h3>
					<span class="header-icon"><SparklesIcon /></span>
					Batch Processing Complete!
				</h3>
				<div class="results-summary">
					<div class="summary-item success">
						<span class="summary-icon"><CheckCircleIcon /></span>
						<span>{successfulResults.length} Successful</span>
					</div>
					{#if failedResults.length > 0}
						<div class="summary-item failed">
							<span class="summary-icon"><XCircleIcon /></span>
							<span>{failedResults.length} Failed</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="batch-actions">
				{#if successfulResults.length > 1}
					<button class="download-zip-btn" onclick={onDownloadZip}>
						<span class="btn-icon"><PackageIcon /></span>
						Download All as ZIP
					</button>
				{/if}

				<button class="process-another-btn" onclick={onProcessAnother}>
					<span class="btn-icon"><RotateCwIcon /></span>
					Process More Images
				</button>
			</div>

			{#if successfulResults.length > 0}
				<div class="results-section">
					<h4>Successfully Processed Images</h4>
					<div class="results-grid">
						{#each successfulResults as result (result.file.name)}
							<div class="result-item">
								<div class="result-preview">
									<div class="before-after">
										<div class="image-side">
											<div class="image-label">Before</div>
											<img
												src={result.originalThumbnail}
												alt={getOriginalAltText(result.file.name)}
											/>
										</div>
										<div class="image-side">
											<div class="image-label">After</div>
											<div class="processed-image-container">
												<div class="transparent-bg-pattern"></div>
												<img
													src={result.processedThumbnail}
													alt={getProcessedAltText(result.file.name)}
												/>
											</div>
										</div>
									</div>
								</div>

								<div class="result-info">
									<div class="result-name" title={result.file.name}>
										{result.file.name}
									</div>
									<div class="result-actions">
										<button
											class="download-individual-btn"
											onclick={() => downloadIndividualImage(result)}
											title="Download this image"
										>
											<SaveIcon />
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if failedResults.length > 0}
				<div class="failed-section">
					<h4>Failed to Process</h4>
					<div class="failed-list">
						{#each failedResults as result (result.file.name)}
							<div class="failed-item">
								<div class="failed-preview">
									<img src={result.originalThumbnail} alt={getFailedAltText(result.file.name)} />
									<div class="failed-overlay">
										<span class="failed-icon"><XCircleIcon /></span>
									</div>
								</div>
								<div class="failed-info">
									<div class="failed-name">{result.file.name}</div>
									<div class="failed-reason">{result.error || 'Processing failed'}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.batch-results-wrapper {
		display: flex;
		margin: 1.5rem 0;
		width: 100%;
		animation: resultSlide 0.5s ease-out;
	}

	@keyframes resultSlide {
		from {
			transform: translateY(20px) rotate(-1deg);
			opacity: 0;
		}
		to {
			transform: translateY(0) rotate(0.5deg);
			opacity: 1;
		}
	}

	.batch-results {
		position: relative;
		width: 100%;
		max-width: 100%;
		transform: rotate(0.5deg);
	}

	.results-decoration {
		position: absolute;
		top: -10px;
		left: -10px;
		right: -10px;
		bottom: -10px;
		background: linear-gradient(135deg, var(--color-success) 0%, var(--color-accent-blue) 100%);
		z-index: -1;
		opacity: 0.3;
		border-radius: 30% 70% 70% 30% / 60% 40% 60% 40%;
		transform: rotate(-1deg);
	}

	.results-content {
		padding: 2rem;
		background: var(--color-background-main);
		border: var(--border-brutalist-extra-thick);
		box-shadow: var(--shadow-brutalist-xlarge);
		position: relative;
	}

	.results-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.results-content h3 {
		margin: 0 0 1rem 0;
		font-family: var(--font-family-display);
		font-size: 2rem;
		color: var(--color-text-primary);
		letter-spacing: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--color-success);
		padding: 0.5rem 1rem;
		border: var(--border-brutalist-thick);
		box-shadow: var(--shadow-brutalist-medium);
		transform: rotate(-1deg);
		text-transform: uppercase;
		width: fit-content;
		margin-left: auto;
		margin-right: auto;
	}

	.header-icon {
		font-size: 1.5rem;
		display: flex;
		align-items: center;
		color: var(--color-text-primary);
		animation: sparkle 2s ease-in-out infinite;
	}

	.header-icon :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	@keyframes sparkle {
		0%,
		100% {
			transform: scale(1) rotate(0deg);
		}
		50% {
			transform: scale(1.2) rotate(180deg);
		}
	}

	.results-summary {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.summary-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: var(--border-brutalist-thin);
		border-radius: 6px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.summary-item.success {
		background: var(--color-success);
		color: var(--color-text-primary);
	}

	.summary-item.failed {
		background: var(--color-danger);
		color: var(--color-text-primary);
	}

	.summary-icon {
		font-size: 1.125rem;
		display: flex;
		align-items: center;
		color: var(--color-text-primary);
	}

	.summary-icon :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.batch-actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.download-zip-btn,
	.process-another-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: var(--border-brutalist-thick);
		cursor: pointer;
		font-size: 1rem;
		font-weight: 700;
		transition: all 0.2s;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-family: var(--font-family-primary);
		box-shadow: var(--shadow-brutalist-medium);
		border-radius: 6px;
	}

	.download-zip-btn {
		background: var(--color-accent-blue);
		color: var(--color-text-primary);
	}

	.process-another-btn {
		background: var(--color-primary-dark);
		color: var(--color-text-primary);
	}

	.download-zip-btn:hover,
	.process-another-btn:hover {
		transform: translate(-2px, -2px);
		box-shadow: var(--shadow-brutalist-large);
	}

	.download-zip-btn:hover {
		background: #87cefa;
	}

	.process-another-btn:hover {
		background: var(--color-warning);
	}

	.btn-icon {
		font-size: 1.25rem;
		display: flex;
		align-items: center;
		color: var(--color-text-primary);
	}

	.btn-icon :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
	}

	.results-section,
	.failed-section {
		margin-bottom: 2rem;
	}

	.results-section h4,
	.failed-section h4 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 1px;
		padding: 0.5rem 1rem;
		background: var(--color-primary-dark);
		border: var(--border-brutalist-thin);
		box-shadow: var(--shadow-brutalist-small);
		width: fit-content;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.result-item {
		background: var(--color-background-secondary);
		border: var(--border-brutalist-thick);
		border-radius: 8px;
		overflow: hidden;
		box-shadow: var(--shadow-brutalist-medium);
		transition: all 0.2s;
	}

	.result-item:hover {
		transform: translate(-1px, -1px);
		box-shadow: 5px 5px 0 var(--color-border-primary);
	}

	.result-preview {
		background: var(--color-background-main);
		border-bottom: var(--border-brutalist-thick);
	}

	.before-after {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
	}

	.image-side {
		position: relative;
		border-right: var(--border-brutalist-thin);
	}

	.image-side:last-child {
		border-right: none;
	}

	.image-label {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		background: var(--color-text-primary);
		color: var(--color-text-inverse);
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		z-index: 2;
		border-radius: 2px;
	}

	.image-side img {
		width: 100%;
		height: 120px;
		object-fit: cover;
		display: block;
	}

	.processed-image-container {
		position: relative;
		width: 100%;
		height: 120px;
		overflow: hidden;
	}

	.transparent-bg-pattern {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image:
			linear-gradient(45deg, var(--color-background-pattern) 25%, transparent 25%),
			linear-gradient(-45deg, var(--color-background-pattern) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, var(--color-background-pattern) 75%),
			linear-gradient(-45deg, transparent 75%, var(--color-background-pattern) 75%);
		background-size: 12px 12px;
		background-position:
			0 0,
			0 6px,
			6px -6px,
			-6px 0px;
		z-index: 0;
	}

	.processed-image-container img {
		position: relative;
		z-index: 1;
	}

	.result-info {
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.result-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.result-actions {
		display: flex;
		gap: 0.5rem;
	}

	.download-individual-btn {
		width: 32px;
		height: 32px;
		background: var(--color-background-main);
		border: var(--border-brutalist-thin);
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-primary);
	}

	.download-individual-btn :global(svg) {
		width: 1rem;
		height: 1rem;
	}

	.download-individual-btn:hover {
		background: var(--color-success);
		transform: scale(1.1);
	}

	.failed-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.failed-item {
		background: var(--color-background-light-pink);
		border: var(--border-brutalist-thin);
		border-color: var(--color-danger);
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 3px 3px 0 var(--color-danger);
	}

	.failed-preview {
		position: relative;
		width: 100%;
		height: 100px;
		overflow: hidden;
	}

	.failed-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: grayscale(50%);
	}

	.failed-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 107, 107, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.failed-icon {
		font-size: 2rem;
		color: var(--color-text-inverse);
		display: flex;
		align-items: center;
	}

	.failed-icon :global(svg) {
		width: 2rem;
		height: 2rem;
	}

	.failed-info {
		padding: 0.75rem;
	}

	.failed-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.failed-reason {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
		font-style: italic;
	}

	@media (max-width: 768px) {
		.results-content {
			padding: 1.5rem;
		}

		.results-grid {
			grid-template-columns: 1fr;
		}

		.batch-actions {
			flex-direction: column;
			align-items: center;
		}

		.download-zip-btn,
		.process-another-btn {
			width: 100%;
			max-width: 300px;
			justify-content: center;
		}

		.failed-list {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		}
	}

	@media (max-width: 600px) {
		.results-content {
			padding: 1.25rem;
		}

		.results-content h3 {
			font-size: 1.5rem;
		}

		.results-summary {
			flex-direction: column;
			align-items: center;
		}

		.before-after {
			grid-template-columns: 1fr;
		}

		.image-side {
			border-right: none;
			border-bottom: var(--border-brutalist-thin);
		}

		.image-side:last-child {
			border-bottom: none;
		}
	}
</style>
