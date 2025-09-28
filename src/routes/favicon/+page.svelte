<script lang="ts">
	// Lucide icons for various favicon concepts
	import BrainIcon from 'virtual:icons/lucide/brain';
	import CpuIcon from 'virtual:icons/lucide/cpu';
	import BotIcon from 'virtual:icons/lucide/bot';
	import CircuitBoardIcon from 'virtual:icons/lucide/circuit-board';
	import DatabaseIcon from 'virtual:icons/lucide/database';
	import ZapIcon from 'virtual:icons/lucide/zap';
	import MessageSquareIcon from 'virtual:icons/lucide/message-square';
	import MicIcon from 'virtual:icons/lucide/mic';
	import SpeakerIcon from 'virtual:icons/lucide/speaker';
	import ImageIcon from 'virtual:icons/lucide/image';
	import SparklesIcon from 'virtual:icons/lucide/sparkles';
	import PlayIcon from 'virtual:icons/lucide/play';
	import EyeIcon from 'virtual:icons/lucide/eye';
	import NetworkIcon from 'virtual:icons/lucide/network';
	import GearIcon from 'virtual:icons/lucide/settings';
	import LightbulbIcon from 'virtual:icons/lucide/lightbulb';
	import RocketIcon from 'virtual:icons/lucide/rocket';
	import ShieldIcon from 'virtual:icons/lucide/shield';
	import LockIcon from 'virtual:icons/lucide/lock';
	import SquareIcon from 'virtual:icons/lucide/square';
	import CircleIcon from 'virtual:icons/lucide/circle';
	import TriangleIcon from 'virtual:icons/lucide/triangle';
	import HexagonIcon from 'virtual:icons/lucide/hexagon';
	import DiamondIcon from 'virtual:icons/lucide/diamond';
	import StarIcon from 'virtual:icons/lucide/star';

	// Type definitions for favicon concepts
	interface IconConcept {
		name: string;
		icon: any;
		color: string;
		description: string;
	}

	interface SVGConcept {
		name: string;
		color: string;
		description: string;
		svg: string;
	}

	type FaviconConcept = IconConcept | SVGConcept;

	// Favicon concepts data
	const faviconConcepts: IconConcept[] = [
		// AI/Intelligence Icons
		{
			name: 'AI Brain',
			icon: BrainIcon,
			color: '#ff69b4',
			description: 'Representing AI intelligence and neural processing'
		},
		{
			name: 'CPU Processor',
			icon: CpuIcon,
			color: '#87ceeb',
			description: 'Computer processing power and AI computation'
		},
		{
			name: 'AI Robot',
			icon: BotIcon,
			color: '#98fb98',
			description: 'AI assistant and automation'
		},
		{
			name: 'Circuit Board',
			icon: CircuitBoardIcon,
			color: '#ffd700',
			description: 'Technology infrastructure and AI circuits'
		},
		{
			name: 'Database',
			icon: DatabaseIcon,
			color: '#ffa500',
			description: 'AI data storage and knowledge base'
		},

		// App Feature Icons
		{
			name: 'Chat Bubble',
			icon: MessageSquareIcon,
			color: '#ff69b4',
			description: 'Chat and conversation features'
		},
		{
			name: 'Microphone',
			icon: MicIcon,
			color: '#98fb98',
			description: 'Audio transcription and voice input'
		},
		{
			name: 'Speaker',
			icon: SpeakerIcon,
			color: '#87ceeb',
			description: 'Text-to-speech and audio output'
		},
		{
			name: 'Image',
			icon: ImageIcon,
			color: '#ffd700',
			description: 'Image processing and background removal'
		},
		{
			name: 'Network',
			icon: NetworkIcon,
			color: '#ff6b6b',
			description: 'AI neural networks and connections'
		},

		// Power/Energy Icons
		{
			name: 'Lightning Zap',
			icon: ZapIcon,
			color: '#ffd700',
			description: 'Fast AI processing and instant results'
		},
		{
			name: 'Sparkles',
			icon: SparklesIcon,
			color: '#ff69b4',
			description: 'AI magic and enhancement'
		},
		{
			name: 'Lightbulb',
			icon: LightbulbIcon,
			color: '#ffa500',
			description: 'AI insights and intelligence'
		},
		{
			name: 'Rocket',
			icon: RocketIcon,
			color: '#87ceeb',
			description: 'Advanced AI technology and innovation'
		},

		// Control/Interface Icons
		{
			name: 'Play Button',
			icon: PlayIcon,
			color: '#98fb98',
			description: 'Media processing and AI activation'
		},
		{
			name: 'Settings Gear',
			icon: GearIcon,
			color: '#ff6b6b',
			description: 'AI configuration and optimization'
		},
		{
			name: 'Eye Vision',
			icon: EyeIcon,
			color: '#87ceeb',
			description: 'AI vision and image recognition'
		},

		// Security/Privacy Icons
		{
			name: 'Shield',
			icon: ShieldIcon,
			color: '#98fb98',
			description: 'Nook security and privacy'
		},
		{
			name: 'Lock',
			icon: LockIcon,
			color: '#ffd700',
			description: 'Private and secure AI processing'
		},

		// Geometric Shapes
		{
			name: 'Square',
			icon: SquareIcon,
			color: '#ff69b4',
			description: 'Clean geometric AI interface'
		},
		{
			name: 'Circle',
			icon: CircleIcon,
			color: '#87ceeb',
			description: 'Circular AI processing loop'
		},
		{
			name: 'Triangle',
			icon: TriangleIcon,
			color: '#98fb98',
			description: 'Directional AI progress'
		},
		{
			name: 'Hexagon',
			icon: HexagonIcon,
			color: '#ffd700',
			description: 'Tech-style geometric pattern'
		},
		{ name: 'Diamond', icon: DiamondIcon, color: '#ffa500', description: 'Premium AI quality' },
		{ name: 'Star', icon: StarIcon, color: '#ff6b6b', description: 'Featured AI capabilities' }
	];

	// Custom SVG favicon concepts
	const customSVGs: SVGConcept[] = [
		{
			name: 'Neural Network',
			color: '#ff69b4',
			description: 'Connected neural network nodes',
			svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="512" height="512" fill="#ff69b4"/>
				<circle cx="128" cy="128" r="32" fill="#000" stroke="#fff" stroke-width="6"/>
				<circle cx="384" cy="128" r="32" fill="#000" stroke="#fff" stroke-width="6"/>
				<circle cx="256" cy="256" r="40" fill="#000" stroke="#fff" stroke-width="8"/>
				<circle cx="128" cy="384" r="32" fill="#000" stroke="#fff" stroke-width="6"/>
				<circle cx="384" cy="384" r="32" fill="#000" stroke="#fff" stroke-width="6"/>
				<line x1="128" y1="128" x2="256" y2="256" stroke="#000" stroke-width="12"/>
				<line x1="384" y1="128" x2="256" y2="256" stroke="#000" stroke-width="12"/>
				<line x1="256" y1="256" x2="128" y2="384" stroke="#000" stroke-width="12"/>
				<line x1="256" y1="256" x2="384" y2="384" stroke="#000" stroke-width="12"/>
			</svg>`
		},
		{
			name: 'Binary Code',
			color: '#87ceeb',
			description: 'Digital binary pattern',
			svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="512" height="512" fill="#87ceeb"/>
				<text x="64" y="140" font-family="monospace" font-size="96" font-weight="bold" fill="#000">1</text>
				<text x="200" y="140" font-family="monospace" font-size="96" font-weight="bold" fill="#000">0</text>
				<text x="336" y="140" font-family="monospace" font-size="96" font-weight="bold" fill="#000">1</text>
				<text x="64" y="280" font-family="monospace" font-size="96" font-weight="bold" fill="#000">0</text>
				<text x="200" y="280" font-family="monospace" font-size="96" font-weight="bold" fill="#000">1</text>
				<text x="336" y="280" font-family="monospace" font-size="96" font-weight="bold" fill="#000">0</text>
				<text x="64" y="420" font-family="monospace" font-size="96" font-weight="bold" fill="#000">1</text>
				<text x="200" y="420" font-family="monospace" font-size="96" font-weight="bold" fill="#000">1</text>
				<text x="336" y="420" font-family="monospace" font-size="96" font-weight="bold" fill="#000">0</text>
			</svg>`
		},
		{
			name: 'Grid Matrix',
			color: '#98fb98',
			description: 'Digital grid matrix pattern',
			svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="512" height="512" fill="#98fb98"/>
				<rect x="32" y="32" width="128" height="128" fill="#000" stroke="#fff" stroke-width="6"/>
				<rect x="192" y="32" width="128" height="128" fill="#000" stroke="#fff" stroke-width="6"/>
				<rect x="352" y="32" width="128" height="128" fill="#000" stroke="#fff" stroke-width="6"/>
				<rect x="32" y="192" width="128" height="128" fill="#000" stroke="#fff" stroke-width="6"/>
				<rect x="192" y="192" width="128" height="128" fill="#fff" stroke="#000" stroke-width="6"/>
				<rect x="352" y="192" width="128" height="128" fill="#000" stroke="#fff" stroke-width="6"/>
				<rect x="32" y="352" width="128" height="128" fill="#000" stroke="#fff" stroke-width="6"/>
				<rect x="192" y="352" width="128" height="128" fill="#000" stroke="#fff" stroke-width="6"/>
				<rect x="352" y="352" width="128" height="128" fill="#000" stroke="#fff" stroke-width="6"/>
			</svg>`
		},
		{
			name: 'Waveform Audio',
			color: '#ffd700',
			description: 'Audio waveform pattern',
			svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="512" height="512" fill="#ffd700"/>
				<rect x="32" y="192" width="32" height="128" fill="#000"/>
				<rect x="80" y="144" width="32" height="224" fill="#000"/>
				<rect x="128" y="176" width="32" height="160" fill="#000"/>
				<rect x="176" y="96" width="32" height="320" fill="#000"/>
				<rect x="224" y="128" width="32" height="256" fill="#000"/>
				<rect x="272" y="160" width="32" height="192" fill="#000"/>
				<rect x="320" y="112" width="32" height="288" fill="#000"/>
				<rect x="368" y="208" width="32" height="96" fill="#000"/>
				<rect x="416" y="176" width="32" height="160" fill="#000"/>
				<rect x="464" y="224" width="32" height="64" fill="#000"/>
			</svg>`
		},
		{
			name: 'AI Layers',
			color: '#ffa500',
			description: 'Layered AI processing',
			svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="512" height="512" fill="#ffa500"/>
				<rect x="32" y="80" width="448" height="80" fill="#000" stroke="#fff" stroke-width="6"/>
				<rect x="64" y="192" width="384" height="80" fill="#000" stroke="#fff" stroke-width="6"/>
				<rect x="96" y="304" width="320" height="80" fill="#000" stroke="#fff" stroke-width="6"/>
				<rect x="128" y="416" width="256" height="48" fill="#fff" stroke="#000" stroke-width="6"/>
			</svg>`
		},
		{
			name: 'Tech Hexagon',
			color: '#ff6b6b',
			description: 'Futuristic hexagonal design',
			svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="512" height="512" fill="#ff6b6b"/>
				<polygon points="256,48 416,128 416,288 256,368 96,288 96,128" fill="#000" stroke="#fff" stroke-width="12"/>
				<polygon points="256,112 352,160 352,256 256,304 160,256 160,160" fill="#fff" stroke="#000" stroke-width="6"/>
				<circle cx="256" cy="208" r="24" fill="#000"/>
			</svg>`
		}
	];

	// All favicon concepts combined
	const allConcepts: FaviconConcept[] = [...faviconConcepts, ...customSVGs];
</script>

<div class="favicon-gallery">
	<div class="gallery-header">
		<h1>Favicon Concept Gallery</h1>
		<p>
			A collection of {allConcepts.length} square favicon concepts in 512×512 format, designed for the
			Nook application.
		</p>
	</div>

	<div class="concepts-grid">
		{#each allConcepts as concept, index (concept.name)}
			<div class="concept-card" style="--delay: {index * 0.05}s">
				<div class="concept-number">#{(index + 1).toString().padStart(2, '0')}</div>
				<div class="favicon-container" style="background-color: {concept.color}">
					{#if 'svg' in concept}
						<!-- Custom SVG -->
						<div class="custom-favicon">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html concept.svg}
						</div>
					{:else}
						<!-- Lucide Icon -->
						{@const IconComponent = concept.icon}
						<div class="icon-favicon" style="background-color: {concept.color}">
							<IconComponent />
						</div>
					{/if}
				</div>
				<div class="concept-info">
					<h3>{concept.name}</h3>
					<p>{concept.description}</p>
					<div class="concept-color" style="background-color: {concept.color}">
						{concept.color}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="gallery-footer">
		<p>All concepts are designed at 512×512 pixels with the brutalist design aesthetic in mind.</p>
		<p>
			Each favicon uses bold colors, strong contrasts, and clear iconography suitable for various
			display sizes.
		</p>
	</div>
</div>

<style>
	.favicon-gallery {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
		background: var(--color-background-main);
		border: var(--border-brutalist-extra-thick);
		box-shadow: var(--shadow-brutalist-xlarge);
		border-radius: 12px;
		position: relative;
		transform: rotate(-0.2deg);
	}

	.gallery-header {
		text-align: center;
		margin-bottom: 3rem;
		padding: 2rem;
		background: var(--color-gradient-gold);
		border: var(--border-brutalist-thick);
		box-shadow: var(--shadow-brutalist-large);
		transform: rotate(0.5deg);
	}

	.gallery-header h1 {
		font-family: var(--font-family-display);
		font-size: 3rem;
		margin: 0 0 1rem 0;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 3px;
		background: var(--color-text-primary);
		color: var(--color-primary);
		padding: 0.5rem 2rem;
		border: var(--border-brutalist-thick);
		box-shadow: var(--shadow-brutalist-medium);
		transform: rotate(-1deg);
		display: inline-block;
	}

	.gallery-header p {
		font-size: 1.25rem;
		color: var(--color-text-primary);
		margin: 0;
		font-weight: 600;
		line-height: 1.6;
	}

	.concepts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.concept-card {
		background: var(--color-background-secondary);
		border: var(--border-brutalist-thick);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: var(--shadow-brutalist-medium);
		transition: all 0.3s ease;
		position: relative;
		animation: cardSlideIn 0.6s ease-out;
		animation-delay: var(--delay);
		animation-fill-mode: both;
		transform: rotate(0.5deg);
	}

	.concept-card:nth-child(even) {
		transform: rotate(-0.3deg);
	}

	@keyframes cardSlideIn {
		from {
			opacity: 0;
			transform: translateY(20px) rotate(0deg);
		}
		to {
			opacity: 1;
			transform: translateY(0) rotate(0.5deg);
		}
	}

	.concept-card:hover {
		transform: translate(-3px, -3px) rotate(0deg);
		box-shadow: var(--shadow-brutalist-large);
	}

	.concept-number {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: var(--color-text-primary);
		color: var(--color-text-inverse);
		padding: 0.25rem 0.75rem;
		font-weight: 700;
		font-size: 0.875rem;
		border-radius: 4px;
		z-index: 2;
		font-family: monospace;
		letter-spacing: 1px;
	}

	.favicon-container {
		width: 100%;
		height: 256px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		border-bottom: var(--border-brutalist-thick);
	}

	.icon-favicon {
		width: 160px;
		height: 160px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: var(--border-brutalist-thick);
		border-radius: 8px;
		box-shadow: var(--shadow-brutalist-medium);
	}

	.icon-favicon :global(svg) {
		width: 120px;
		height: 120px;
		color: var(--color-text-primary);
		stroke-width: 2.5;
	}

	.custom-favicon {
		width: 160px;
		height: 160px;
		border: var(--border-brutalist-thick);
		border-radius: 8px;
		box-shadow: var(--shadow-brutalist-medium);
		overflow: hidden;
	}

	.custom-favicon :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}

	.concept-info {
		padding: 1.5rem;
	}

	.concept-info h3 {
		font-family: var(--font-family-display);
		font-size: 1.5rem;
		margin: 0 0 0.75rem 0;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.concept-info p {
		font-size: 1rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0 0 1rem 0;
		font-weight: 500;
	}

	.concept-color {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		border: var(--border-brutalist-thin);
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-text-primary);
		box-shadow: var(--shadow-brutalist-small);
	}

	.gallery-footer {
		text-align: center;
		padding: 2rem;
		background: var(--color-background-tertiary);
		border: var(--border-brutalist-thick);
		border-radius: 8px;
		box-shadow: var(--shadow-brutalist-medium);
		transform: rotate(-0.3deg);
	}

	.gallery-footer p {
		font-size: 1rem;
		color: var(--color-text-tertiary);
		margin: 0.5rem 0;
		font-weight: 500;
		line-height: 1.6;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.favicon-gallery {
			padding: 1.5rem;
		}

		.concepts-grid {
			grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
			gap: 1.5rem;
		}

		.gallery-header {
			padding: 1.5rem;
		}

		.gallery-header h1 {
			font-size: 2.5rem;
			padding: 0.375rem 1.5rem;
		}

		.gallery-header p {
			font-size: 1.125rem;
		}

		.favicon-container {
			height: 200px;
		}

		.icon-favicon,
		.custom-favicon {
			width: 120px;
			height: 120px;
		}

		.icon-favicon :global(svg) {
			width: 90px;
			height: 90px;
		}
	}

	@media (max-width: 480px) {
		.concepts-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.gallery-header h1 {
			font-size: 2rem;
		}

		.concept-info {
			padding: 1rem;
		}

		.concept-info h3 {
			font-size: 1.25rem;
		}

		.favicon-container {
			height: 180px;
		}

		.icon-favicon,
		.custom-favicon {
			width: 100px;
			height: 100px;
		}

		.icon-favicon :global(svg) {
			width: 75px;
			height: 75px;
		}
	}
</style>
