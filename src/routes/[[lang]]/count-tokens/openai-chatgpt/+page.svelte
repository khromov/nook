<script lang="ts">
	import { onMount } from 'svelte';
	import type { Tiktoken } from 'js-tiktoken';
	import MessageSquareIcon from 'virtual:icons/lucide/message-square';
	import TokenizerHeader from '$lib/components/count-tokens/TokenizerHeader.svelte';
	import TextInputSection from '$lib/components/count-tokens/TextInputSection.svelte';
	import TokenStats from '$lib/components/count-tokens/TokenStats.svelte';
	import RawTokensDisplay from '$lib/components/count-tokens/RawTokensDisplay.svelte';
	import InfoBox from '$lib/components/count-tokens/InfoBox.svelte';
	import EmptyState from '$lib/components/count-tokens/EmptyState.svelte';

	const { data } = $props();

	import { tokenCounterText } from '$lib/stores';
	import { tokenizerExampleTexts } from '$lib/tokenizer-examples';

	let showRawTokens = $state(false);
	let encoder: Tiktoken | null = $state(null);
	let specialTokens: string[] = $state([]);

	// Derived values from text and encoder
	let charCount = $derived($tokenCounterText.length);
	function sanitizeText(input: string): string {
		if (!specialTokens || specialTokens.length === 0) return input;
		let out = input;
		for (const tok of specialTokens) {
			if (!tok) continue;
			out = out.split(tok).join('');
		}
		return out;
	}

	let tokens = $derived.by(() => {
		if (!encoder || !$tokenCounterText) return [];
		try {
			const sanitized = sanitizeText($tokenCounterText);
			return encoder.encode(sanitized);
		} catch (error) {
			console.error('Error encoding text:', error);
			return [];
		}
	});
	let tokenCount = $derived(tokens.length);
	let decodedTokens = $derived.by(() => {
		if (!encoder || tokens.length === 0) return [];
		return tokens.map((tokenId: number) => {
			try {
				return encoder!.decode([tokenId]);
			} catch {
				return `[Token ${tokenId}]`;
			}
		});
	});

	const exampleTexts = tokenizerExampleTexts.openai;

	onMount(() => {
		if (data.encoder) {
			encoder = data.encoder;
			console.log('Encoder loaded successfully');
		}
		if (data.specialTokens) {
			specialTokens = data.specialTokens as string[];
		}
	});
</script>

<div class="tokenizer-container">
	<TokenizerHeader
		icon={MessageSquareIcon}
		title="OpenAI ChatGPT Tokenizer"
		description="Count tokens for GPT-5, GPT-4, GPT-4o, GPT-3.5 Turbo, ChatGPT and other OpenAI models"
	/>

	<div class="tokenizer-main">
		<TextInputSection bind:text={$tokenCounterText} {exampleTexts} />

		<!-- Results Section -->
		{#if tokenCount > 0}
			<div class="results-section">
				<TokenStats {tokenCount} {charCount} />
				<RawTokensDisplay {tokens} {decodedTokens} bind:showRawTokens />
			</div>
		{:else if encoder && $tokenCounterText.length === 0}
			<EmptyState />
		{/if}
	</div>

	<InfoBox
		title="About OpenAI's Tokenizer"
		items={[
			'Average token length: ~4 characters for English text',
			'Code and special characters typically use more tokens'
		]}
	/>
</div>

<style>
	.tokenizer-container {
		width: 100%;
		max-width: 100%;
		margin: 0 auto;
		padding: 1rem;
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

	.tokenizer-main {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.results-section {
		background: var(--color-background-main);
		border: var(--border-brutalist-thick);
		box-shadow: var(--shadow-brutalist-large);
		padding: 1.5rem;
		transform: rotate(-0.2deg);
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(10px) rotate(-0.2deg);
		}
		to {
			opacity: 1;
			transform: translateY(0) rotate(-0.2deg);
		}
	}

	@media (max-width: 600px) {
		.tokenizer-container {
			padding: 0.75rem;
		}

		.results-section {
			padding: 1rem;
		}
	}
</style>
