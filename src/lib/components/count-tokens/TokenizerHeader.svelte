<script lang="ts">
	import type { Component } from 'svelte';
	import { page } from '$app/stores';
	import RefreshCwIcon from 'virtual:icons/lucide/refresh-cw';
	import { resolve } from '$app/paths';
	import { getCurrentLanguageFromPage, getTokenizerPaths } from '$lib/i18n-utils';

	interface Props {
		icon: Component;
		title: string;
		description: string;
	}

	let { icon: Icon, title, description }: Props = $props();

	// Get current language and create localized tokenizer paths
	const currentLang = $derived(getCurrentLanguageFromPage($page));
	const tokenizerPaths = $derived(getTokenizerPaths(currentLang));

	// Determine counterpart page for quick switching based on current pathname
	const targetHref = $derived.by(() => {
		const path = $page.url.pathname;

		if (path.includes('openai-chatgpt')) {
			return tokenizerPaths.anthropic;
		} else if (path.includes('anthropic-claude')) {
			return tokenizerPaths.openai;
		}
		return null;
	});

	const targetLabel = $derived.by(() => {
		const path = $page.url.pathname;
		if (path.includes('openai-chatgpt')) {
			return 'Switch to Anthropic';
		} else if (path.includes('anthropic-claude')) {
			return 'Switch to OpenAI';
		}
		return null;
	});
</script>

<div class="tokenizer-header">
	{#if targetHref && targetLabel}
		<a
			class="switch-button"
			href={resolve(targetHref)}
			aria-label={targetLabel}
			title={targetLabel}
		>
			<RefreshCwIcon />
		</a>
	{/if}
	<div class="header-content">
		<div class="header-title">
			<span class="header-icon"><Icon /></span>
			<h1>{title}</h1>
		</div>
		<p class="header-description">{description}</p>
	</div>
</div>

<style>
	.tokenizer-header {
		background: var(--color-background-main);
		border: var(--border-brutalist-thick);
		box-shadow: var(--shadow-brutalist-large);
		padding: 1.5rem;
		margin-bottom: 2rem;
		transform: rotate(-0.3deg);
		position: relative;
	}

	.header-content {
		text-align: center;
	}

	.header-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.header-icon {
		display: flex;
		align-items: center;
		color: var(--color-text-primary);
		font-size: 2rem;
	}

	.header-icon :global(svg) {
		width: 2rem;
		height: 2rem;
	}

	.tokenizer-header h1 {
		margin: 0;
		font-family: var(--font-family-display);
		font-size: 2rem;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 2px;
	}

	.header-description {
		margin: 0;
		font-size: 1rem;
		color: var(--color-text-secondary);
	}

	.switch-button {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		text-decoration: none;
		padding: 0.5rem;
		background: var(--color-background-secondary);
		border: var(--border-brutalist-thin);
		border-radius: 6px;
		color: var(--color-text-primary);
		box-shadow: var(--shadow-brutalist-small);
		transition: all 0.2s ease;
	}

	.switch-button:hover {
		background: var(--color-background-tertiary);
		transform: translate(-1px, -1px);
		box-shadow: var(--shadow-brutalist-medium);
	}

	.switch-button :global(svg) {
		width: 1.1rem;
		height: 1.1rem;
		display: block;
	}
</style>
