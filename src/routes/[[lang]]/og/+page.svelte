<script lang="ts">
	import ImageIcon from 'virtual:icons/lucide/image';
	import BrainIcon from 'virtual:icons/lucide/brain';
	import RocketIcon from 'virtual:icons/lucide/rocket';
	import ShieldIcon from 'virtual:icons/lucide/shield';

	import CardInterface from '$lib/components/common/CardInterface.svelte';
	import Toolbar from '$lib/components/common/Toolbar.svelte';
	import ContentArea from '$lib/components/common/ContentArea.svelte';
</script>

<svelte:head>
	<title>OpenGraph Generator - Nook: Local AI</title>
</svelte:head>

<CardInterface>
	<Toolbar modelInfo="OpenGraph Image Generator" ModelIcon={ImageIcon} />

	<ContentArea>
		<div class="og-generator">
			<div class="intro-section">
				<h1>OpenGraph Images</h1>
				<p>Simple designs optimized for social media sharing (1200×630)</p>
			</div>

			<!-- Layout 1: Simple & Bold -->
			<div class="og-layout-container">
				<h2>Layout 1: Simple & Bold</h2>
				<div class="og-image layout-1">
					<div class="content">
						<div class="icon">
							<BrainIcon />
						</div>
						<h1>Nook: Local AI</h1>
						<p>Chat • Transcribe • Text to Speech • Background Remover • Count Tokens</p>
						<div class="url">nook.software</div>
					</div>
				</div>
			</div>

			<!-- Layout 2: Split Simple -->
			<div class="og-layout-container">
				<h2>Layout 2: Split Simple</h2>
				<div class="og-image layout-2">
					<div class="left">
						<div class="logo">
							<RocketIcon />
						</div>
						<h1>Nook: Local AI</h1>
						<div class="url">nook.software</div>
					</div>
					<div class="right">
						<h2>Private AI in Your Browser</h2>
						<div class="features">
							<span>💬 Chat</span>
							<span>🎤 Transcribe Audio</span>
							<span>🗣️ Text to Speech</span>
							<span>🖼️ Remove Background</span>
							<span>🧮 Count Tokens</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Layout 3: Clean Focus -->
			<div class="og-layout-container">
				<h2>Layout 3: Clean Focus</h2>
				<div class="og-image layout-3">
					<div class="header">
						<div class="badge">
							<ShieldIcon />
							<span>100% Private</span>
						</div>
					</div>
					<div class="main">
						<h1>Nook</h1>
						<p>Run offline: Chat • Transcribe • TTS • Background • Tokens</p>
					</div>
					<div class="footer">
						<span class="url">nook.software</span>
					</div>
				</div>
			</div>
		</div>
	</ContentArea>
</CardInterface>

<style>
	.og-generator {
		padding: 1rem;
		max-width: 100%;
		margin: 0 auto;
	}

	.intro-section {
		text-align: center;
		margin-bottom: 3rem;
		padding: 2rem;
		background: #fff;
		border: 4px solid #000;
		box-shadow: 8px 8px 0 #000;
		transform: rotate(-1deg);
	}

	.intro-section h1 {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 2.5rem;
		color: #000;
		margin: 0 0 1rem 0;
		text-transform: uppercase;
		letter-spacing: 3px;
		background: #ffd93d;
		padding: 0.5rem 1.5rem;
		border: 3px solid #000;
		box-shadow: 6px 6px 0 #000;
		display: inline-block;
		transform: rotate(1deg);
	}

	.intro-section p {
		font-size: 1.125rem;
		color: #666;
		font-weight: 500;
		margin: 0;
	}

	.og-layout-container {
		margin-bottom: 3rem;
	}

	.og-layout-container h2 {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.5rem;
		color: #000;
		margin-bottom: 1rem;
		text-transform: uppercase;
		letter-spacing: 2px;
		background: #98fb98;
		padding: 0.5rem 1rem;
		border: 3px solid #000;
		box-shadow: 4px 4px 0 #000;
		display: inline-block;
		transform: rotate(-0.5deg);
	}

	/* Base OG Image Styles */
	.og-image {
		width: 100%;
		height: 630px;
		max-width: 1200px;
		aspect-ratio: 1200 / 630;
		border: 4px solid #000;
		box-shadow: 8px 8px 0 #000;
		position: relative;
		overflow: hidden;
		margin: 0 auto;
		transform: rotate(0.5deg);
	}

	/* Layout 1: Simple & Bold */
	.layout-1 {
		background: linear-gradient(135deg, #ffd93d 0%, #ff69b4 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.layout-1 .content {
		text-align: center;
		color: #000;
	}

	.layout-1 .icon {
		width: 120px;
		height: 120px;
		background: #fff;
		border: 4px solid #000;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 2rem auto;
		box-shadow: 8px 8px 0 #000;
	}

	.layout-1 .icon :global(svg) {
		width: 60px;
		height: 60px;
		stroke-width: 2.5;
	}

	.layout-1 h1 {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 5rem;
		margin: 0 0 1rem 0;
		text-transform: uppercase;
		letter-spacing: 4px;
		text-shadow: 4px 4px 0 #fff;
	}

	.layout-1 p {
		font-size: 2.25rem;
		margin: 0 0 1.5rem 0;
		font-weight: 700;
		background: rgba(255, 255, 255, 0.9);
		padding: 1rem 2rem;
		border: 3px solid #000;
		box-shadow: 6px 6px 0 #000;
		display: inline-block;
	}

	.layout-1 .url {
		font-size: 1.75rem;
		font-weight: 700;
		color: #000;
		background: #98fb98;
		padding: 0.75rem 1.5rem;
		border: 3px solid #000;
		box-shadow: 5px 5px 0 #000;
		text-transform: uppercase;
		letter-spacing: 2px;
		transform: rotate(-1deg);
		display: inline-block;
	}

	/* Layout 2: Split Simple */
	.layout-2 {
		background: #fff;
		display: flex;
	}

	.layout-2 .left {
		width: 40%;
		background: #000;
		color: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 3rem;
	}

	.layout-2 .logo {
		width: 100px;
		height: 100px;
		background: #ffd93d;
		border: 4px solid #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
		color: #000;
		box-shadow: 6px 6px 0 #fff;
	}

	.layout-2 .logo :global(svg) {
		width: 50px;
		height: 50px;
		stroke-width: 2.5;
	}

	.layout-2 .left h1 {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 3.5rem;
		margin: 0 0 2rem 0;
		text-transform: uppercase;
		letter-spacing: 3px;
		color: #ffd93d;
	}

	.layout-2 .left .url {
		font-size: 1.5rem;
		font-weight: 700;
		color: #ff69b4;
		text-transform: uppercase;
		letter-spacing: 2px;
		background: rgba(255, 105, 180, 0.2);
		padding: 0.75rem 1.25rem;
		border: 2px solid #ff69b4;
		border-radius: 8px;
	}

	.layout-2 .right {
		width: 60%;
		padding: 4rem 3rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%);
	}

	.layout-2 .right h2 {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 3rem;
		color: #000;
		margin: 0 0 2.5rem 0;
		text-transform: uppercase;
		letter-spacing: 2px;
		line-height: 1.1;
	}

	.layout-2 .features {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.layout-2 .features span {
		font-size: 1.75rem;
		font-weight: 700;
		color: #000;
		background: #98fb98;
		padding: 1rem 1.5rem;
		border: 3px solid #000;
		box-shadow: 4px 4px 0 #000;
		text-align: center;
		transform: rotate(-0.5deg);
	}

	.layout-2 .features span:nth-child(2) {
		transform: rotate(0.5deg);
	}

	.layout-2 .features span:nth-child(3) {
		transform: rotate(-0.3deg);
	}

	.layout-2 .features span:nth-child(4) {
		transform: rotate(0.4deg);
	}

	.layout-2 .features span:nth-child(5) {
		transform: rotate(-0.2deg);
	}

	/* Layout 3: Clean Focus */
	.layout-3 {
		background: linear-gradient(135deg, #000 0%, #333 100%);
		color: #fff;
		display: flex;
		flex-direction: column;
		padding: 4rem;
	}

	.layout-3 .header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.layout-3 .badge {
		display: inline-flex;
		align-items: center;
		gap: 1rem;
		background: #98fb98;
		color: #000;
		padding: 1rem 2rem;
		border: 4px solid #fff;
		border-radius: 30px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-size: 1.5rem;
		box-shadow: 6px 6px 0 #fff;
	}

	.layout-3 .badge :global(svg) {
		width: 2rem;
		height: 2rem;
		stroke-width: 2.5;
	}

	.layout-3 .main {
		text-align: center;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.layout-3 .main h1 {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 4.5rem;
		color: #ffd93d;
		margin: 0 0 1.5rem 0;
		text-transform: uppercase;
		letter-spacing: 4px;
		text-shadow: 4px 4px 0 #000;
	}

	.layout-3 .main p {
		font-size: 2rem;
		color: #ccc;
		margin: 0;
		font-weight: 500;
		line-height: 1.3;
	}

	.layout-3 .footer {
		text-align: center;
		margin-top: 2rem;
	}

	.layout-3 .url {
		font-size: 1.75rem;
		font-weight: 700;
		color: #ff69b4;
		text-transform: uppercase;
		letter-spacing: 3px;
		background: rgba(255, 105, 180, 0.15);
		padding: 1rem 2rem;
		border: 3px solid #ff69b4;
		border-radius: 10px;
		display: inline-block;
		box-shadow: 5px 5px 0 #ff69b4;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.intro-section h1 {
			font-size: 2rem;
		}

		.og-layout-container h2 {
			font-size: 1.25rem;
		}

		.layout-1 h1 {
			font-size: 3.5rem;
		}

		.layout-1 p {
			font-size: 1.75rem;
		}

		.layout-1 .url {
			font-size: 1.25rem;
		}

		.layout-2 .left h1 {
			font-size: 2.5rem;
		}

		.layout-2 .right h2 {
			font-size: 2rem;
		}

		.layout-2 .features span {
			font-size: 1.25rem;
		}

		.layout-3 .main h1 {
			font-size: 3rem;
		}

		.layout-3 .main p {
			font-size: 1.5rem;
		}

		.layout-3 .url {
			font-size: 1.25rem;
		}
	}

	@media (max-width: 600px) {
		.layout-1 h1 {
			font-size: 2.5rem;
		}

		.layout-1 p {
			font-size: 1.25rem;
		}

		.layout-2 .left h1 {
			font-size: 2rem;
		}

		.layout-2 .right h2 {
			font-size: 1.5rem;
		}

		.layout-3 .main h1 {
			font-size: 2.5rem;
		}

		.layout-3 .main p {
			font-size: 1.25rem;
		}
	}
</style>
