<script lang="ts">
	import MessageSquareIcon from 'virtual:icons/lucide/message-square';
	import BrainIcon from 'virtual:icons/lucide/brain';
	import SparklesIcon from 'virtual:icons/lucide/sparkles';
	import ShapesIcon from 'virtual:icons/lucide/shapes';
	import ChevronRightIcon from 'virtual:icons/lucide/chevron-right';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { getCurrentLanguageFromPage, getTokenizerPaths } from '$lib/i18n-utils';

	// Get current language and create localized tokenizer paths
	const currentLang = $derived(getCurrentLanguageFromPage($page));
	const tokenizerPaths = $derived(getTokenizerPaths(currentLang));
</script>

<div class="tokenizers-container">
	<div class="tokenizers-header">
		<h1>
			<span class="header-icon"><SparklesIcon /></span>
			Count LLM Tokens
		</h1>
		<p class="header-description">
			Calculate how many tokens your text will use with different AI models. Token counts affect
			context limits for AI conversations.
		</p>
	</div>

	<div class="tokenizer-cards">
		<a href={resolve(tokenizerPaths.anthropic)} class="tokenizer-card claude-card">
			<div class="card-decoration"></div>
			<div class="card-content">
				<div class="card-icon">
					<BrainIcon />
				</div>
				<h2>Anthropic Claude</h2>
				<p class="card-description">
					Count tokens for Claude models including Claude Opus 4.1, Sonnet 4, and Haiku
				</p>
				<div class="card-action">
					<span>Open Tokenizer</span>
					<ChevronRightIcon />
				</div>
			</div>
		</a>

		<a href={resolve(tokenizerPaths.openai)} class="tokenizer-card chatgpt-card">
			<div class="card-decoration"></div>
			<div class="card-content">
				<div class="card-icon">
					<MessageSquareIcon />
				</div>
				<h2>OpenAI ChatGPT</h2>
				<p class="card-description">
					Count tokens for GPT-4, GPT-4o, GPT-3.5 Turbo, and other OpenAI models
				</p>
				<div class="card-action">
					<span>Open Tokenizer</span>
					<ChevronRightIcon />
				</div>
			</div>
		</a>

		<a href={resolve(tokenizerPaths.gemini)} class="tokenizer-card gemini-card">
			<div class="card-decoration"></div>
			<div class="card-content">
				<div class="card-icon">
					<ShapesIcon />
				</div>
				<h2>Google Gemini</h2>
				<p class="card-description">Count tokens for Gemini models</p>
				<div class="card-action">
					<span>Open Tokenizer</span>
					<ChevronRightIcon />
				</div>
			</div>
		</a>
	</div>

	<div class="info-section">
		<h3>What are tokens?</h3>
		<p>
			Tokens are the basic units that language models process. A token can be as short as one
			character or as long as one word. On average:
		</p>
		<ul>
			<li>1 token ≈ 4 characters in English</li>
		</ul>
		<p>
			Different models use different tokenization methods, so the same text may result in different
			token counts.
		</p>
	</div>
</div>

<style>
	.tokenizers-container {
		padding: 1rem;
		max-width: 900px;
		margin: 0 auto;
		animation: fadeIn 0.5s ease-out;
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

	.tokenizers-header {
		text-align: center;
		margin-bottom: 3rem;
		padding: 2rem;
		background: var(--color-background-main);
		border: var(--border-brutalist-thick);
		box-shadow: var(--shadow-brutalist-large);
		transform: rotate(-0.5deg);
	}

	.tokenizers-header h1 {
		margin: 0 0 1rem 0;
		font-family: var(--font-family-display);
		font-size: 2.5rem;
		color: var(--color-text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 2px;
	}

	.header-icon {
		display: flex;
		align-items: center;
		color: var(--color-text-primary);
		animation: sparkle 2s ease-in-out infinite;
	}

	.header-icon :global(svg) {
		width: 2.5rem;
		height: 2.5rem;
	}

	@keyframes sparkle {
		0%,
		100% {
			transform: scale(1) rotate(0deg);
		}
		50% {
			transform: scale(1.1) rotate(180deg);
		}
	}

	.header-description {
		margin: 0;
		font-size: 1.125rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
	}

	.tokenizer-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.tokenizer-card {
		display: block;
		text-decoration: none;
		color: var(--color-text-primary);
		background: var(--color-background-main);
		border: var(--border-brutalist-thick);
		padding: 0;
		box-shadow: var(--shadow-brutalist-large);
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
		border-radius: 12px;
		transform: rotate(0.5deg);
	}

	.tokenizer-card:nth-child(2) {
		transform: rotate(-0.5deg);
	}

	.tokenizer-card:nth-child(3) {
		transform: rotate(0.3deg);
	}

	.tokenizer-card:hover {
		transform: translate(-3px, -3px) rotate(0deg);
		box-shadow: 8px 8px 0 var(--color-border-primary);
	}

	.card-decoration {
		position: absolute;
		top: -10px;
		right: -10px;
		width: 80px;
		height: 80px;
		opacity: 0.3;
		border: var(--border-brutalist-thin);
		border-radius: 30% 70% 70% 30% / 60% 40% 60% 40%;
		z-index: 0;
	}

	.claude-card .card-decoration {
		background: var(--color-accent-pink);
	}

	.chatgpt-card .card-decoration {
		background: var(--color-success);
		left: -10px;
		right: auto;
	}

	.gemini-card .card-decoration {
		background: var(--color-accent-blue);
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
	}

	.card-content {
		padding: 2rem;
		position: relative;
		z-index: 1;
	}

	.card-icon {
		margin-bottom: 1.5rem;
		width: fit-content;
		padding: 1rem;
		background: var(--color-gradient-gold);
		border: var(--border-brutalist-thick);
		border-radius: 12px;
		box-shadow: var(--shadow-brutalist-small);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		color: var(--color-text-primary);
	}

	.card-icon :global(svg) {
		width: 2.5rem;
		height: 2.5rem;
	}

	.claude-card:hover .card-icon {
		background: var(--color-accent-pink);
	}

	.chatgpt-card:hover .card-icon {
		background: var(--color-success);
	}

	.gemini-card:hover .card-icon {
		background: var(--color-accent-blue);
	}

	.tokenizer-card h2 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.card-description {
		font-size: 1rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0 0 1.5rem 0;
	}

	.card-action {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--color-text-primary);
		padding: 0.75rem 1rem;
		background: var(--color-primary-dark);
		border: var(--border-brutalist-thin);
		border-radius: 6px;
		box-shadow: var(--shadow-brutalist-small);
		transition: all 0.2s ease;
	}

	.card-action :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
	}

	.tokenizer-card:hover .card-action {
		background: var(--color-primary);
		transform: translate(-1px, -1px);
		box-shadow: var(--shadow-brutalist-medium);
	}

	.info-section {
		background: var(--color-background-secondary);
		border: var(--border-brutalist-thick);
		padding: 2rem;
		box-shadow: var(--shadow-brutalist-medium);
		transform: rotate(-0.3deg);
	}

	.info-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.info-section p {
		font-size: 1rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0 0 1rem 0;
	}

	.info-section ul {
		margin: 0 0 1rem 0;
		padding-left: 1.5rem;
	}

	.info-section li {
		font-size: 1rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0.5rem 0;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.tokenizers-header h1 {
			font-size: 2rem;
		}

		.tokenizer-cards {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.card-content {
			padding: 1.5rem;
		}
	}

	@media (max-width: 600px) {
		.tokenizers-container {
			padding: 0.75rem;
		}

		.tokenizers-header {
			padding: 1.5rem;
		}

		.tokenizers-header h1 {
			font-size: 1.75rem;
		}

		.header-description {
			font-size: 1rem;
		}

		.info-section {
			padding: 1.5rem;
		}
	}
</style>
