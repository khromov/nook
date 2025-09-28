<script lang="ts">
	import MessageSquareIcon from 'virtual:icons/lucide/message-square';
	import MicIcon from 'virtual:icons/lucide/mic';
	import ImageIcon from 'virtual:icons/lucide/image';
	import SpeechIcon from 'virtual:icons/lucide/speech';
	import CalculatorIcon from 'virtual:icons/lucide/calculator';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { getCurrentLanguageFromPage, createLocalizedLink } from '$lib/i18n-utils';

	// Get current language and create localized links
	const currentLang = $derived(getCurrentLanguageFromPage($page));
	const chatLink = $derived(createLocalizedLink('/chat', currentLang));
	const transcribeLink = $derived(createLocalizedLink('/transcribe', currentLang));
	const ttsLink = $derived(createLocalizedLink('/text-to-speech', currentLang));
	const backgroundLink = $derived(createLocalizedLink('/background-remover', currentLang));
	const tokensLink = $derived(createLocalizedLink('/count-tokens', currentLang));
</script>

<div class="main-menu">
	<div class="menu-container">
		<header class="menu-header">
			<h1 class="main-title">
				<span class="title-line">Nook: Local AI</span>
			</h1>
			<p class="subtitle">
				On this page you'll find free, private AI tools that run entirely in your browser - and even
				offline!
			</p>
		</header>

		<div class="feature-grid">
			<a href={resolve(chatLink)} class="feature-card chat-card">
				<div class="card-number">Tool #01</div>
				<div class="card-content">
					<div class="icon-container">
						<MessageSquareIcon style="width: 48px; height: 48px; stroke-width: 2.5" />
					</div>
					<h2>Chat</h2>
					<p class="feature-description">
						Chat with Large Language Models like Gemma3, completely on-device thanks to llama.cpp
					</p>
				</div>
			</a>

			<a href={resolve(transcribeLink)} class="feature-card transcribe-card">
				<div class="card-number">Tool #02</div>
				<div class="card-content">
					<div class="icon-container">
						<MicIcon style="width: 48px; height: 48px; stroke-width: 2.5" />
					</div>
					<h2>Transcribe Audio</h2>
					<p class="feature-description">
						Convert speech to text using Whisper AI. Upload any existing audio file or record a new
						audio clip directly in your browser and export as text or a subtitle file.
					</p>
				</div>
			</a>

			<a href={resolve(ttsLink)} class="feature-card tts-card">
				<div class="card-number">Tool #03</div>
				<div class="card-content">
					<div class="icon-container">
						<SpeechIcon style="width: 48px; height: 48px; stroke-width: 2.5" />
					</div>
					<h2>Text to Speech</h2>
					<p class="feature-description">
						Convert text to natural-sounding speech using AI models. Choose from Kitten TTS, Piper,
						or Kokoro models for high-quality voice synthesis.
					</p>
				</div>
			</a>

			<a href={resolve(backgroundLink)} class="feature-card background-card">
				<div class="card-number">Tool #04</div>
				<div class="card-content">
					<div class="icon-container">
						<ImageIcon style="width: 48px; height: 48px; stroke-width: 2.5" />
					</div>
					<h2>Remove Background</h2>
					<p class="feature-description">
						Remove backgrounds from images using AI. Choose between RMBG v1.4 and BEN2 models for
						professional results.
					</p>
				</div>
			</a>

			<a href={resolve(tokensLink)} class="feature-card tokens-card">
				<div class="card-number">Tool #05</div>
				<div class="card-content">
					<div class="icon-container">
						<CalculatorIcon style="width: 48px; height: 48px; stroke-width: 2.5" />
					</div>
					<h2>Count Tokens</h2>
					<p class="feature-description">
						Estimate token usage for prompts across OpenAI and Anthropic models.
					</p>
				</div>
			</a>
		</div>

		<footer class="menu-footer">
			<p>All processing happens locally in your browser using WebAssembly.</p>
			<p>No data is sent to external servers.</p>
		</footer>
	</div>
</div>

<style>
	/* Base styles */
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: var(--font-family-primary);
		font-size: 16px;
		line-height: 1.5;
		background: linear-gradient(
			135deg,
			var(--color-gradient-gold) 0%,
			var(--color-gradient-lavender) 50%,
			var(--color-gradient-mint) 100%
		);
		background-size: 200% 200%;
		animation: gradient-shift 20s ease infinite;
		color: var(--color-text-primary);
		overflow-x: hidden;
	}

	@keyframes gradient-shift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	.main-menu {
		min-height: 100vh;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 1rem 1rem 2rem;
		box-sizing: border-box;
		position: relative;
		z-index: 2;
	}

	.menu-container {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}

	.menu-header {
		text-align: center;
		margin-bottom: 2rem;
		animation: fadeIn 0.6s ease-out;
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

	.main-title {
		font-size: 3.5rem;
		line-height: 1.1;
		margin: 0 0 1.5rem 0;
		font-weight: 800;
	}

	.title-line {
		background: var(--color-text-primary);
		color: var(--color-primary);
		padding: 0.5rem 2rem;
		display: inline-block;
		border: var(--border-brutalist-thick);
		box-shadow: 5px 5px 0 var(--color-border-primary);
		letter-spacing: 2px;
		text-transform: uppercase;
	}

	.subtitle {
		font-size: 1.25rem;
		color: var(--color-text-primary);
		margin: 0;
		font-weight: 500;
		background: var(--color-background-main);
		display: inline-block;
		padding: 0.5rem 1.5rem;
		border: var(--border-brutalist-thin);
		box-shadow: var(--shadow-brutalist-medium);
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
		padding: 0 1rem;
	}

	.feature-card {
		display: block;
		text-decoration: none;
		color: var(--color-text-primary);
		background: var(--color-background-main);
		border: var(--border-brutalist-thick);
		padding: 0;
		box-shadow: 5px 5px 0 var(--color-border-primary);
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
		border-radius: 12px;
		animation: cardFade 0.6s ease-out;
		animation-fill-mode: both;
	}

	.feature-card:nth-child(1) {
		animation-delay: 0.2s;
	}

	.feature-card:nth-child(2) {
		animation-delay: 0.3s;
	}

	.feature-card:nth-child(3) {
		animation-delay: 0.4s;
	}

	.feature-card:nth-child(4) {
		animation-delay: 0.5s;
	}

	.feature-card:nth-child(5) {
		animation-delay: 0.6s;
	}

	@keyframes cardFade {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.card-number {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: var(--color-text-primary);
		color: var(--color-primary);
		padding: 0.25rem 0.75rem;
		font-weight: 700;
		font-size: 0.875rem;
		letter-spacing: 1px;
		border-radius: 4px;
		text-transform: uppercase;
	}

	.feature-card:hover {
		transform: translate(-3px, -3px);
		box-shadow: 8px 8px 0 var(--color-border-primary);
	}

	.card-content {
		padding: 2rem;
	}

	.icon-container {
		margin-bottom: 1.5rem;
		width: fit-content;
		padding: 0.75rem;
		background: var(--color-gradient-gold);
		border: var(--border-brutalist-thin);
		border-radius: 8px;
	}

	.feature-card h2 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		color: var(--color-text-primary);
	}

	.feature-description {
		font-size: 1rem;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0 0 1.5rem 0;
	}

	.menu-footer {
		text-align: center;
		color: var(--color-text-tertiary);
		font-size: 0.9375rem;
		margin-top: 3rem;
		animation: fadeIn 0.6s ease-out;
		animation-delay: 0.5s;
		animation-fill-mode: both;
	}

	.menu-footer p {
		margin: 0.5rem 0;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.main-menu {
			padding: 1.5rem 1rem;
		}

		.main-title {
			font-size: 2.5rem;
		}

		.title-line {
			padding: 0.375rem 1.25rem;
			font-size: 2rem;
		}

		.subtitle {
			font-size: 1.125rem;
			padding: 0.375rem 1rem;
		}

		.feature-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
			padding: 0;
		}

		.feature-card h2 {
			font-size: 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.main-title {
			font-size: 2rem;
		}

		.card-content {
			padding: 1.5rem;
		}
	}
</style>
