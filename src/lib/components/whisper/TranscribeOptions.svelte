<script lang="ts">
	import FileUpload from './FileUpload.svelte';
	import AudioRecorder from './AudioRecorder.svelte';
	import MusicIcon from 'virtual:icons/lucide/music';
	import FolderIcon from 'virtual:icons/lucide/folder';
	import MicIcon from 'virtual:icons/lucide/mic';
	import { resolve } from '$app/paths';

	interface Props {
		transcribeMode: 'demo' | 'upload' | 'record';
		selectedFile: File | null;
		onFileSelect: (file: File) => void;
		onModeChange: (mode: 'demo' | 'upload' | 'record') => void;
		disabled?: boolean;
	}

	let {
		transcribeMode = $bindable(),
		selectedFile = $bindable(),
		onFileSelect,
		onModeChange,
		disabled = false
	}: Props = $props();

	function handleModeChange(mode: 'demo' | 'upload' | 'record') {
		onModeChange(mode);
	}
</script>

<div class="transcribe-options">
	<div class="options-decoration"></div>
	<h3>
		<span class="title-icon"><MusicIcon /></span>
		Choose Audio Source
	</h3>

	<div class="option-group">
		<label class="option-label" class:selected={transcribeMode === 'upload'}>
			<input
				type="radio"
				name="transcribeMode"
				value="upload"
				checked={transcribeMode === 'upload'}
				onchange={() => handleModeChange('upload')}
				{disabled}
			/>
			<div class="option-content">
				<div class="option-header">
					<span class="option-icon"><FolderIcon /></span>
					<strong>Local File</strong>
				</div>
				<small>Select an audio file from your device (.mp3, .wav, .m4a)</small>
			</div>
		</label>

		<label class="option-label" class:selected={transcribeMode === 'record'}>
			<input
				type="radio"
				name="transcribeMode"
				value="record"
				checked={transcribeMode === 'record'}
				onchange={() => handleModeChange('record')}
				{disabled}
			/>
			<div class="option-content">
				<div class="option-header">
					<span class="option-icon"><MicIcon /></span>
					<strong>Record Audio</strong>
				</div>
				<small>Record audio directly from your microphone</small>
			</div>
		</label>

		<div class="or-divider">
			<span>OR</span>
		</div>

		<label class="option-label demo-option" class:selected={transcribeMode === 'demo'}>
			<input
				type="radio"
				name="transcribeMode"
				value="demo"
				checked={transcribeMode === 'demo'}
				onchange={() => handleModeChange('demo')}
				{disabled}
			/>
			<div class="option-content">
				<strong>Demo File</strong>
				<small><a href={resolve('/rich.mp3')} target="_blank">Listen →</a></small>
			</div>
		</label>
	</div>

	{#if transcribeMode === 'upload'}
		<FileUpload bind:selectedFile {onFileSelect} {disabled} />
	{:else if transcribeMode === 'record'}
		<AudioRecorder bind:transcribeMode bind:selectedFile {onFileSelect} {disabled} />
	{/if}
</div>

<style>
	.transcribe-options {
		background: var(--color-background-main);
		border: var(--border-brutalist-extra-thick);
		padding: 2rem;
		box-shadow: var(--shadow-brutalist-xlarge);
		margin-bottom: 1.5rem;
		position: relative;
		transform: rotate(0.5deg);
		animation: slideIn 0.4s ease-out;
		animation-delay: 0.1s;
		animation-fill-mode: both;
	}

	@keyframes slideIn {
		from {
			transform: translateX(20px) rotate(1deg);
			opacity: 0;
		}
		to {
			transform: translateX(0) rotate(0.5deg);
			opacity: 1;
		}
	}

	.options-decoration {
		position: absolute;
		top: -8px;
		left: -8px;
		right: -8px;
		bottom: -8px;
		background: linear-gradient(
			135deg,
			var(--color-primary-dark) 0%,
			var(--color-accent-pink) 100%
		);
		z-index: -1;
		opacity: 0.3;
		border-radius: 5% 20% 5% 20% / 20% 5% 20% 5%;
	}

	.transcribe-options h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-family: var(--font-family-display);
		font-size: 2rem;
		color: var(--color-text-primary);
		text-align: center;
		letter-spacing: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		background: var(--color-primary-dark);
		padding: 0.5rem 1.5rem;
		border: var(--border-brutalist-thick);
		box-shadow: 5px 5px 0 var(--color-text-primary);
		transform: rotate(1deg);
		width: fit-content;
		margin-left: auto;
		margin-right: auto;
		text-transform: uppercase;
	}

	.title-icon {
		font-size: 1.75rem;
		display: flex;
		align-items: center;
		color: var(--color-text-primary);
	}

	.title-icon :global(svg) {
		width: 1.75rem;
		height: 1.75rem;
	}

	.option-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.option-label {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		border: var(--border-brutalist-thick);
		background: var(--color-background-main);
		cursor: pointer;
		transition: all 0.15s ease;
		box-shadow: var(--shadow-brutalist-medium);
		position: relative;
		transform: rotate(-0.5deg);
	}

	.option-label:nth-child(2) {
		transform: rotate(0.5deg);
	}

	.option-label:hover {
		transform: translate(-2px, -2px) rotate(0deg);
		box-shadow: var(--shadow-brutalist-large);
		background: var(--color-background-cream);
	}

	.option-label.selected {
		background: var(--color-success);
		transform: translate(-3px, -3px) rotate(0deg);
		box-shadow: 7px 7px 0 var(--color-text-primary);
	}

	.option-label input[type='radio'] {
		width: 20px;
		height: 20px;
		margin: 0;
		accent-color: var(--color-text-primary);
		cursor: pointer;
		border: var(--border-brutalist-thin);
	}

	.option-content {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		flex: 1;
	}

	.option-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.option-icon {
		font-size: 1.5rem;
		display: flex;
		align-items: center;
		color: var(--color-text-primary);
	}

	.option-icon :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	.option-content strong {
		font-size: 1.125rem;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.option-content small {
		font-size: 0.9375rem;
		color: var(--color-text-secondary);
		font-weight: 500;
		margin-left: 2rem;
	}

	.option-content small a {
		color: var(--color-text-primary);
		font-weight: 700;
		text-decoration: none;
		padding: 2px 6px;
		background: var(--color-primary-dark);
		border: var(--border-brutalist-thin);
		transition: all 0.15s;
		display: inline-block;
		box-shadow: var(--shadow-brutalist-small);
	}

	.option-content small a:hover {
		transform: translate(-1px, -1px);
		box-shadow: var(--shadow-brutalist-small);
		background: var(--color-accent-pink);
	}

	.or-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0.5rem 0;
		position: relative;
	}

	.or-divider span {
		background: var(--color-background-main);
		padding: 0 1rem;
		font-weight: 700;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--color-text-tertiary);
		position: relative;
	}

	.or-divider::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-gray-300);
		top: 50%;
		transform: translateY(-50%);
	}

	.demo-option {
		padding: 0.75rem 1rem !important;
	}

	.demo-option .option-content {
		flex-direction: row !important;
		align-items: center;
		gap: 0.5rem !important;
	}

	.demo-option strong {
		font-size: 1rem !important;
	}

	.demo-option small {
		margin-left: 0 !important;
		font-size: 0.875rem !important;
	}

	@media (max-width: 600px) {
		.transcribe-options {
			padding: 1.25rem;
		}

		.option-group {
			gap: 0.75rem;
		}

		.option-label {
			padding: 1rem;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.option-content small {
			margin-left: 0;
		}
	}
</style>
