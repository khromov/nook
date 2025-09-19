<script lang="ts">
	import { onMount } from 'svelte';
	import SparklesIcon from 'virtual:icons/lucide/sparkles';
	import TokenizerHeader from '$lib/components/count-tokens/TokenizerHeader.svelte';
	import TextInputSection from '$lib/components/count-tokens/TextInputSection.svelte';
	import TokenStats from '$lib/components/count-tokens/TokenStats.svelte';
	import RawTokensDisplay from '$lib/components/count-tokens/RawTokensDisplay.svelte';
	import InfoBox from '$lib/components/count-tokens/InfoBox.svelte';
	import EmptyState from '$lib/components/count-tokens/EmptyState.svelte';

	const { data } = $props();

	import { tokenCounterText } from '$lib/stores';
	import { geminiExamples } from '$lib/tokenizer-examples';

	let tokenizer: any = $state(null);

	// Derived values from text and tokenizer
	let charCount = $derived($tokenCounterText.length);

	let tokens = $derived.by(() => {
		if (!tokenizer || !$tokenCounterText) return [];
		try {
			const encoded = tokenizer($tokenCounterText);
			// Try different ways to access the token IDs
			if (encoded.input_ids) {
				if (encoded.input_ids.data) {
					return Array.from(encoded.input_ids.data);
				} else if (Array.isArray(encoded.input_ids)) {
					return encoded.input_ids;
				}
			}
			return [];
		} catch (error) {
			console.error('Error encoding text:', error);
			return [];
		}
	});
	let tokenCount = $derived(tokens.length);
	let decodedTokens = $derived.by(() => {
		if (!tokenizer || tokens.length === 0) return [];
		return tokens.map((tokenId: number) => {
			try {
				// Use the tokenizer's decode method with proper parameters
				const decoded = tokenizer.decode([Number(tokenId)], { skip_special_tokens: false });
				return decoded || `[Token ${tokenId}]`;
			} catch (error) {
				console.error('Error decoding token:', tokenId, error);
				return `[Token ${tokenId}]`;
			}
		});
	});

	const exampleTexts = geminiExamples;

	let showRawTokens = $state(false);

	onMount(() => {
		if (data.tokenizer) {
			tokenizer = data.tokenizer;
		}
	});
</script>

<div class="tokenizer-container">
	<TokenizerHeader
		icon={SparklesIcon}
		title="Google Gemini Tokenizer"
		description="Count tokens for Gemini models"
	/>

	<div class="tokenizer-main">
		<TextInputSection bind:text={$tokenCounterText} {exampleTexts} />

		<!-- Results Section -->
		{#if tokenCount > 0}
			<div class="results-section">
				<TokenStats {tokenCount} {charCount} />
				<RawTokensDisplay {tokens} {decodedTokens} bind:showRawTokens />
			</div>
		{:else if tokenizer && $tokenCounterText.length === 0}
			<EmptyState />
		{/if}
	</div>

	<InfoBox
		title="About Gemini's Tokenizer"
		items={[
			'Gemini uses a SentencePiece tokenizer optimized for multimodal understanding',
			'Average token length: ~4 characters for English text',
			'Handles multiple languages and code efficiently'
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
