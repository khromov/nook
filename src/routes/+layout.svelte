<script lang="ts">
	import '$lib/design-system.css';
	import { page } from '$app/state';
	import '@fontsource/space-grotesk/400.css';
	import '@fontsource/space-grotesk/500.css';
	import '@fontsource/space-grotesk/700.css';
	import '@fontsource/bebas-neue';
	import HomeIcon from 'virtual:icons/lucide/home';
	import MessageSquareIcon from 'virtual:icons/lucide/message-square';
	import MicIcon from 'virtual:icons/lucide/mic';
	import ImageIcon from 'virtual:icons/lucide/image';
	import GithubIcon from 'virtual:icons/lucide/github';
	import SpeechIcon from 'virtual:icons/lucide/speech';
	import CalculatorIcon from 'virtual:icons/lucide/calculator';
	import GlobeIcon from 'virtual:icons/lucide/globe';
	import { Toaster } from 'svelte-sonner';
	import { resolve } from '$app/paths';
	import { getCurrentLanguage, createLocalizedLink, locales } from '$lib/i18n-utils';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Get current language from URL and generate localized navigation links
	const currentLang = $derived(getCurrentLanguage(page.url.pathname));

	// Check if a path is active
	function isActive(path: string): boolean {
		// Exact match
		if (page.url.pathname === path) {
			return true;
		}
		// Don't allow parent path matching for language home pages
		const isLanguageHomePage = locales.some((locale) => path === `/${locale}`);
		if (!isLanguageHomePage && path !== '/' && page.url.pathname.startsWith(path + '/')) {
			return true;
		}
		return false;
	}

	const DEFAULT_TITLE = 'Nook';

	const getLocalizedNavLinks = (currentLang: string) => {
		return [
			{ path: createLocalizedLink('/', currentLang), label: '', icon: 'home' },
			{ path: createLocalizedLink('/chat', currentLang), label: 'Chat', icon: 'chat' },
			{ path: createLocalizedLink('/transcribe', currentLang), label: 'Transcribe', icon: 'mic' },
			{ path: createLocalizedLink('/text-to-speech', currentLang), label: 'TTS', icon: 'speech' },
			{
				path: createLocalizedLink('/background-remover', currentLang),
				label: 'BG Remover',
				icon: 'image'
			},
			{
				path: createLocalizedLink('/count-tokens', currentLang),
				label: 'Tokens',
				icon: 'calculator'
			}
		];
	};
</script>

<svelte:head>
	<title>{page.data.seo?.title || DEFAULT_TITLE}</title>
	<meta name="description" content={page.data.seo?.description || ''} />
	<link rel="canonical" href={page.data.seo?.canonicalUrl || page.url.href} />

	<!-- Open Graph meta tags -->
	<meta property="og:title" content={page.data.seo?.title || DEFAULT_TITLE} />
	<meta property="og:description" content={page.data.seo?.description || ''} />
	<meta property="og:image" content={page.data.seo?.ogImage || ''} />
	<meta property="og:url" content={page.data.seo?.url} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={DEFAULT_TITLE} />

	<!-- Twitter Card meta tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={page.data.seo?.title || DEFAULT_TITLE} />
	<meta name="twitter:description" content={page.data.seo?.description || ''} />
	<meta name="twitter:image" content={page.data.seo?.ogImage || ''} />
</svelte:head>

<div class="app-wrapper">
	<div class="container" class:fullWidth={page.url.pathname === '/og'}>
		<nav class="main-nav">
			<ul>
				<li class="nav-left">
					{#each getLocalizedNavLinks(currentLang) as link (link.path)}
						{#if link.icon === 'home'}
							<div class="home-item">
								<a
									href={resolve(link.path)}
									class:active={isActive(link.path)}
									class:home-link={link.icon === 'home'}
								>
									<HomeIcon style="width: 20px; height: 20px; stroke-width: 2.5" />
									{#if link.label}
										<span>{link.label}</span>
									{/if}
								</a>
							</div>
						{/if}
					{/each}
					<div class="center-items">
						{#each getLocalizedNavLinks(currentLang) as link (link.path)}
							{#if link.icon !== 'home'}
								<div>
									<a href={resolve(link.path)} class:active={isActive(link.path)}>
										{#if link.icon === 'chat'}
											<MessageSquareIcon style="width: 20px; height: 20px; stroke-width: 2.5" />
										{:else if link.icon === 'mic'}
											<MicIcon style="width: 20px; height: 20px; stroke-width: 2.5" />
										{:else if link.icon === 'speech'}
											<SpeechIcon style="width: 20px; height: 20px; stroke-width: 2.5" />
										{:else if link.icon === 'image'}
											<ImageIcon style="width: 20px; height: 20px; stroke-width: 2.5" />
										{:else if link.icon === 'calculator'}
											<CalculatorIcon style="width: 20px; height: 20px; stroke-width: 2.5" />
										{/if}
										{#if link.label}
											<span>{link.label}</span>
										{/if}
									</a>
								</div>
							{/if}
						{/each}
					</div>
				</li>
				<li class="home-item language-item">
					<a
						href={resolve(createLocalizedLink('/language', currentLang))}
						class="home-link"
						aria-label="Change language"
					>
						<GlobeIcon style="width: 20px; height: 20px; stroke-width: 2.5" />
					</a>
				</li>
				<li class="home-item github-item">
					<a
						href="https://github.com/khromov/nook"
						class="home-link"
						aria-label="View source on GitHub"
						target="_blank"
						rel="noopener noreferrer"
					>
						<GithubIcon style="width: 20px; height: 20px; stroke-width: 2.5" />
					</a>
				</li>
			</ul>
		</nav>

		<div class="content-wrapper">
			{@render children?.()}
		</div>
	</div>
</div>

<Toaster
	position="bottom-right"
	theme="light"
	richColors
	toastOptions={{
		style:
			'border: 3px solid #000; box-shadow: 4px 4px 0 #000; border-radius: 8px; font-family: Space Grotesk, sans-serif; font-weight: 600;'
	}}
/>

<style>
	/* Base styles with refined Neo-Brutalist approach */
	:global(html) {
		height: 100%;
	}

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
		background-attachment: fixed;
		animation: gradient-shift 20s ease infinite;
		color: var(--color-text-primary);
		position: relative;
		overflow-x: hidden;
		min-height: 100vh;
	}

	:global(body)::before {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(0, 0, 0, 0.02) 40px,
			rgba(0, 0, 0, 0.02) 41px
		);
		pointer-events: none;
		z-index: 1;
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

	.container.fullWidth {
		width: 100% !important;
		max-width: 9000px;
	}

	.app-wrapper {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 2;
	}

	.container {
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		padding: 1rem;
		box-sizing: border-box;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.content-wrapper {
		width: 100%;
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0; /* Critical for nested flex scrolling */
	}

	/* Navigation styles - Refined Neo-Brutalist */
	.main-nav {
		margin-bottom: 1rem;
		width: 100%;
		flex: 0 0 auto; /* Don't grow/shrink */
	}

	.main-nav ul {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0;
		margin: 0;
		list-style: none;
		background: var(--color-background-main);
		padding: 0.75rem;
		box-sizing: border-box;
		border: var(--border-brutalist-thick);
		box-shadow: 5px 5px 0 var(--color-border-primary);
		border-radius: 12px;
	}

	.nav-left {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: nowrap;
		overflow-x: auto;
		flex: 1;
		min-width: 0;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border-primary) transparent;
		padding-top: 4px;
		padding-bottom: 4px;
		list-style: none;
	}

	.nav-left::-webkit-scrollbar {
		height: 2px;
	}

	.nav-left::-webkit-scrollbar-thumb {
		background: var(--color-border-primary);
	}

	.center-items {
		display: flex;
		gap: 1rem;
	}

	.center-items div {
		flex: none;
	}

	.main-nav li {
		flex: none;
	}

	.main-nav li.nav-left {
		flex: 1;
		min-width: 0;
	}

	.main-nav a {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		text-decoration: none;
		color: var(--color-text-primary);
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.2s ease;
		background: var(--color-background-main);
		border: 2px solid transparent;
		border-radius: 8px;
		position: relative;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.main-nav a:hover {
		background: var(--color-gradient-gold);
		transform: translateY(-2px);
	}

	.main-nav a.active {
		background: var(--color-primary);
		border-color: var(--color-border-primary);
		box-shadow: var(--shadow-brutalist-medium);
	}

	.home-link {
		padding: 0.75rem !important;
	}

	.language-item .home-link,
	.github-item .home-link {
		border: var(--border-brutalist-thick);
		box-shadow: var(--shadow-brutalist-medium);
	}

	/* Shared component styling - Refined Neo-Brutalist */
	:global(.card-interface) {
		border: var(--border-brutalist-thick);
		background: var(--color-background-main);
		box-shadow: var(--shadow-brutalist-large);
		width: 100%;
		position: relative;
		border-radius: 12px;
		overflow: hidden;
		box-sizing: border-box;
		border-bottom-right-radius: 16px;
		display: flex;
		flex-direction: column;
	}

	:global(.toolbar) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-warning) 100%);
		border-bottom: var(--border-brutalist-thick);
		flex-wrap: wrap;
		gap: 0.5rem;
		flex: 0 0 auto; /* Don't grow/shrink */
	}

	:global(.model-info) {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		word-break: break-word;
		max-width: 100%;
	}

	:global(.content-area) {
		padding: 1.5rem;
		background: var(--color-background-main);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		box-sizing: border-box;
	}

	:global(.input-area) {
		padding: 1rem 1.25rem;
		border-top: var(--border-brutalist-thick);
		background: var(--color-background-secondary);
		box-sizing: border-box;
		flex: 0 0 auto; /* Don't grow/shrink */
	}

	:global(.disclaimer) {
		margin-top: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-tertiary);
		text-align: center;
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

	:global(.primary-button) {
		padding: 0.875rem 1.75rem;
		background: var(--color-primary);
		color: var(--color-text-primary);
		border: var(--border-brutalist-thick);
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 700;
		transition: all 0.2s;
		box-shadow: var(--shadow-brutalist-medium);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-family: var(--font-family-primary);
		box-sizing: border-box;
	}

	:global(.primary-button:hover) {
		transform: translate(-2px, -2px);
		box-shadow: var(--shadow-brutalist-large);
	}

	:global(.primary-button:active) {
		transform: translate(0);
		box-shadow: var(--shadow-brutalist-small);
	}

	:global(.primary-button:disabled) {
		background: var(--color-background-disabled);
		color: var(--color-text-disabled);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	/* Responsive adjustments */
	@media (max-width: 600px) {
		.container {
			padding: 0.75rem;
		}

		.main-nav ul {
			gap: 0.5rem;
			padding: 0.5rem;
		}

		.main-nav a {
			padding: 0.625rem;
			font-size: 0.875rem;
		}

		.main-nav a span {
			display: none;
		}

		.home-link {
			padding: 0.625rem !important;
		}

		:global(.toolbar) {
			padding: 0.875rem 1rem;
		}

		:global(.model-info) {
			font-size: 0.75rem;
		}

		:global(.content-area) {
			padding: 1rem;
		}

		:global(.input-area) {
			padding: 0.875rem 1rem;
		}

		.nav-left {
			gap: 0.5rem;
		}

		.center-items {
			gap: 0.5rem;
		}

		.language-item .home-link,
		.github-item .home-link {
			border: var(--border-brutalist-thin);
			box-shadow: var(--shadow-brutalist-small);
		}
	}

	@media (max-width: 400px) {
		.container {
			padding: 0.5rem;
		}

		.main-nav a {
			padding: 0.5rem 0.75rem;
			font-size: 0.8125rem;
		}

		.nav-left {
			gap: 0.375rem;
		}

		.center-items {
			gap: 0.375rem;
		}

		.language-item .home-link,
		.github-item .home-link {
			border: var(--border-brutalist-thin);
			box-shadow: var(--shadow-brutalist-small);
		}
	}
</style>
