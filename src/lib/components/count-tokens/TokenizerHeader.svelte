<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		icon: Component;
		title: string;
		description: string;
	}

	let { icon: Icon, title, description }: Props = $props();
</script>

<div class="tokenizer-header">
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
</style>
