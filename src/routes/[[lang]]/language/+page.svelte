<script lang="ts">
	import CardInterface from '$lib/components/common/CardInterface.svelte';
	import ContentArea from '$lib/components/common/ContentArea.svelte';
	import Toolbar from '$lib/components/common/Toolbar.svelte';
	import { resolve } from '$app/paths';
	import { locales } from '$lib/i18n-utils';

	interface Language {
		code: string;
		name: string;
		nativeName: string;
	}

	// Language metadata - this should match the locales from Wuchale config
	const languageMetadata: Record<string, { name: string; nativeName: string }> = {
		en: { name: 'English', nativeName: 'English' },
		es: { name: 'Spanish', nativeName: 'Español' },
		ja: { name: 'Japanese', nativeName: '日本語' },
		sv: { name: 'Swedish', nativeName: 'Svenska' },
		uk: { name: 'Ukrainian', nativeName: 'Українська' }
	};

	// Create available languages from Wuchale locales
	const availableLanguages: Language[] = locales.map((code) => ({
		code,
		name: languageMetadata[code]?.name || code.toUpperCase(),
		nativeName: languageMetadata[code]?.nativeName || code.toUpperCase()
	}));
</script>

<svelte:head>
	<title>Language Settings - Nook</title>
	<meta name="description" content="Change the language settings for the Nook application" />
</svelte:head>

<CardInterface>
	<Toolbar modelInfo="Language Settings"></Toolbar>

	<ContentArea>
		<div class="language-settings">
			<div class="settings-section">
				<h2>Select Language</h2>
				<p class="description">
					Choose your preferred language for the interface. Click on a language to switch to that
					version of the application.
				</p>

				<div class="language-grid">
					{#each availableLanguages as language (language.code)}
						<a
							href={resolve(language.code === 'en' ? '/' : `/${language.code}/`)}
							class="language-card"
						>
							<div class="language-code">{language.code.toUpperCase()}</div>
							<div class="language-info">
								<div class="language-name">{language.name}</div>
								<div class="language-native">{language.nativeName}</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</div>
	</ContentArea>
</CardInterface>

<style>
	.language-settings {
		max-width: 800px;
		margin: 0 auto;
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.description {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		line-height: 1.5;
		margin: 0;
	}

	.language-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin: 1rem 0;
	}

	.language-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem 1rem;
		background: var(--color-background-main);
		border: var(--border-brutalist-thick);
		border-radius: 8px;
		box-shadow: var(--shadow-brutalist-small);
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.language-card:hover {
		transform: translate(-2px, -2px);
		box-shadow: var(--shadow-brutalist-medium);
		background: var(--color-background-secondary);
	}

	.language-card:active {
		transform: translate(-1px, -1px);
		box-shadow: var(--shadow-brutalist-small);
	}

	.language-code {
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: var(--color-text-primary);
		border: var(--border-brutalist-thick);
		border-radius: 4px;
		font-weight: 700;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: var(--shadow-brutalist-small);
	}

	.language-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		text-align: center;
	}

	.language-name {
		font-weight: 600;
		color: var(--color-text-primary);
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.25px;
	}

	.language-native {
		font-weight: 500;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		font-style: italic;
	}

	@media (max-width: 600px) {
		.language-settings {
			max-width: none;
		}

		.language-grid {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.language-card {
			padding: 1.25rem 1rem;
		}

		h2 {
			font-size: 1.25rem;
		}
	}

	@media (max-width: 400px) {
		.language-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.language-card {
			padding: 1rem 0.75rem;
			gap: 0.5rem;
		}

		.language-code {
			padding: 0.375rem 0.75rem;
			font-size: 0.75rem;
		}

		.language-name {
			font-size: 0.875rem;
		}

		.language-native {
			font-size: 0.75rem;
		}
	}
</style>
