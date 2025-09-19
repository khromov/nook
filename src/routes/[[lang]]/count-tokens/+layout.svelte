<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getCurrentLanguageFromPage, getTokenizerPaths } from '$lib/i18n-utils';
	import MessageSquareIcon from 'virtual:icons/lucide/message-square';
	import BrainIcon from 'virtual:icons/lucide/brain';
	import ShapesIcon from 'virtual:icons/lucide/shapes';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Get current language and create localized tokenizer paths
	const currentLang = $derived(getCurrentLanguageFromPage($page));
	const tokenizerPaths = $derived(getTokenizerPaths(currentLang));

	// Determine which tokenizer is currently active
	const isActive = (tokenizer: string) => {
		return $page.url.pathname.includes(tokenizer);
	};
</script>

<div class="tokenizer-layout">
	{#if $page.route.id !== '/[[lang]]/count-tokens'}
		<nav class="tokenizer-nav">
			<button
				class="nav-item"
				class:active={isActive('anthropic-claude')}
				onclick={() => goto(tokenizerPaths.anthropic)}
			>
				<BrainIcon />
				<span>Claude</span>
			</button>

			<button
				class="nav-item"
				class:active={isActive('openai-chatgpt')}
				onclick={() => goto(tokenizerPaths.openai)}
			>
				<MessageSquareIcon />
				<span>OpenAI</span>
			</button>

			<button
				class="nav-item"
				class:active={isActive('google-gemini')}
				onclick={() => goto(tokenizerPaths.gemini)}
			>
				<ShapesIcon />
				<span>Gemini</span>
			</button>
		</nav>
	{/if}

	<!-- Page content -->
	<div class="tokenizer-content">
		{@render children()}
	</div>
</div>

<style>
	.tokenizer-layout {
		width: 100%;
		max-width: 100%;
	}

	.tokenizer-nav {
		display: flex;
		gap: 0;
		background: var(--color-background-main);
		border: var(--border-brutalist-thick);
		box-shadow: var(--shadow-brutalist-medium);
		margin-bottom: 1.5rem;
		overflow: hidden;
		border-radius: 8px;
	}

	.nav-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-background-main);
		border: none;
		border-right: var(--border-brutalist-thin);
		color: var(--color-text-secondary);
		font-weight: 600;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
	}

	.nav-item:last-child {
		border-right: none;
	}

	.nav-item:hover {
		background: var(--color-background-secondary);
		color: var(--color-text-primary);
		transform: translateY(-1px);
	}

	.nav-item.active {
		background: var(--color-primary);
		color: var(--color-text-primary);
		font-weight: 700;
		box-shadow: inset 0 2px 0 var(--color-accent-gold);
	}

	.nav-item.active:hover {
		background: var(--color-primary-dark);
		transform: none;
	}

	.nav-item :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.nav-item span {
		font-family: var(--font-family-display);
	}

	.tokenizer-content {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 600px) {
		.nav-item {
			padding: 0.625rem 0.75rem;
			font-size: 0.75rem;
		}

		.nav-item span {
			display: none;
		}

		.nav-item :global(svg) {
			width: 1.5rem;
			height: 1.5rem;
		}
	}

	@media (max-width: 400px) {
		.tokenizer-nav {
			margin-bottom: 1rem;
		}

		.nav-item {
			padding: 0.5rem;
		}
	}
</style>
