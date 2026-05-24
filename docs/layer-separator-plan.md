# Layer Separator — Plan

Tool for separating a 2D image (initially black-ink / pencil landscape paintings) into N depth-ordered layers and exporting cumulative black-and-white masks for use as Photoshop layer masks.

## Mask contract

For N layers numbered back-to-front (1 = farthest):

- The tool outputs **N−1 PNG masks** at the source image's full resolution.
- Mask k: **black** = "layer k and everything behind it", **white** = "in front of layer k".
- The frontmost layer has no mask — it's what remains after the other masks are applied.
- Example (3 layers: sky, mid, foreground):
  - Mask 1: sky black, everything else white.
  - Mask 2: sky + mid black, foreground white.
  - In Photoshop: apply mask 1 to extract sky; invert mask 2 to extract foreground; the mid layer is what's left.

## Model research summary

- **RMBG-1.4 / BEN2** (currently used by background-remover): single-mask only, not viable.
- **Depth Anything V2** (`onnx-community/depth-anything-v2-small`, `-base`, `-large`): monocular depth via transformers.js `depth-estimation` pipeline. Outputs one float depth map; we threshold it. No user input.
- **SAM / SlimSAM** (`Xenova/slimsam-77-uniform`, `Xenova/sam-vit-base`): click/box prompted, class-agnostic, works on stylized art. Reserved for Phase 5 (interactive layer authoring).
- **SegFormer (ADE20K)**: photo-domain class labels ("sky", "tree") — unreliable on ink, skipped.
- **No browser-runnable model outputs ordered depth layers natively.** "Illustrator's Depth" (arXiv 2511.17454, Nov 2025) does exactly this but has no released weights.
- **Honest caveat:** depth models are trained on natural photographs; ink paintings use non-perspective composition, so depth output will be noisy on flat washes. The interactive thresholding UI is the rescue mechanism.

## Load-bearing constraints

1. **Client-side only.** Models cached via OPFS, served from `BASE_MODEL_URL` (new subfolder, e.g. `/depth/`). Same pattern as background-remover.
2. **Output contract is the masks, not a composite.** N−1 cumulative B&W PNGs at source resolution, downloadable individually and as a zip.
3. **Depth-map-plus-threshold is the only viable MVP path.** Mental model the user picks up: "the model gives a depth map, you slide the cutoffs."
4. **User controls layer count and cutoffs.** Even with perfect depth, "how many layers" is an artistic decision. Sliders are the escape hatch when depth quality is mediocre.
5. **MVP excludes user scribbles / clicks.** Deferred. But the layer data model (array of `{threshold, mask, source}` per layer) must leave room for `source: 'depth-threshold' | 'sam-prompt' | 'paint'` so Phase 5 doesn't require restructuring.
6. **Stylized-painting quality is not guaranteed.** UI must frame depth output as a starting point — show the raw depth map alongside masks; thresholds are "rough cut, adjust to taste." No overselling automatic results.
7. **Fit existing patterns.** Lives under `src/routes/[[lang]]/layer-separator/+page.svelte` and `src/lib/components/layer-separator/`. Reuses `CardInterface`, `Toolbar`, `SectionCard`, `StepHeader`, `LoadingProgress`, `ErrorDisplay`, the wake-lock hook, the model-card and upload patterns from background-remover. All UI strings wrapped for Wuchale. New menu entry on home page.
8. **Memory hygiene.** Full-resolution depth maps and per-layer mask canvases are heavy; revoke object URLs eagerly and dispose `RawImage` outputs, following the background-remover pattern.
9. **`npm run checks` clean before any phase is done.**

## Phases

### Phase 1 — Spike: confirm Depth Anything V2 is usable on the target image

Drop the model into a throwaway page, run it on `pipe_small.png` (and ideally 1–2 other ink samples), eyeball the depth map. If completely useless, stop and revisit (SAM-only flow becomes the MVP). Decide here whether `small` or `base` ships as default — affects download size messaging.

### Phase 2 — Single-image pipeline + mask math

Upload → depth inference → threshold-to-N-cumulative-masks → download. Hardcode threshold count initially. The thresholding/mask-compositing logic (depth float → ordered binary masks at source resolution) is the one piece of non-trivial logic in this feature — unit-test it (project uses Vitest).

### Phase 3 — Interactive thresholding UI

Depth-map preview + histogram + N−1 draggable cutoffs + live mask thumbnails + layer-count control. The bulk of UX work and the main lever that compensates for imperfect depth output.

### Phase 4 — Polish

Model selection (small vs base), single-image download + zip-all-masks, Wuchale i18n strings, mobile layout, home-page card.

### Phase 5 — Deferred: user-guided layer authoring

SAM (SlimSAM) with click prompts to define or refine a single layer, and/or a brush canvas. Phase 2's data model must accommodate this without rework.
