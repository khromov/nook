# Layer Separator

Browser-only tool that separates a 2D image (initially aimed at black-ink / pencil landscape paintings) into N depth-ordered layers and exports cumulative black-and-white masks for use as Photoshop layer masks.

Lives at `/layer-separator`. Runs entirely client-side — no image is uploaded anywhere.

## Mask output contract

For N layers numbered back-to-front (1 = farthest):

- The tool outputs **N − 1 PNG masks** at the source image's full resolution.
- Mask k: **black** = "layer k and everything behind it", **white** = "in front of layer k".
- The frontmost layer has no mask — it's what remains after the others are applied.

Example (3 layers: sky, mid, foreground):

- Mask 1: sky black, everything else white.
- Mask 2: sky + mid black, foreground white.
- In Photoshop: apply mask 1 to extract sky; invert mask 2 to extract foreground; the mid layer is what remains.

## How to use it

1. **Upload an image.** It stays in the browser.
2. **Depth estimation runs automatically.** Depth Anything V2 small executes in WebAssembly via `@huggingface/transformers` and produces a single-channel depth map at the source image's resolution (0 = far, 255 = near). First load ~100 MB; cached after that.
3. **Threshold into layers.** A 256-bin histogram of the depth values is shown with N − 1 draggable cut markers. Default is 3 layers, evenly cut. Pick a layer count (2–5) and drag markers to refine. Marker drags update masks ~150 ms after release (debounced) so dragging stays smooth.
4. **Refine misgrouped objects with SAM (optional).** Depth alone gets some objects wrong on stylized art — e.g. a small foreground building can read as "nearest" because of photo priors. Click **+ Add object** on a layer, then click on the image. SlimSAM runs locally and proposes a clean per-object mask that is forcibly assigned to the chosen layer regardless of depth.
   - Each click adds a positive (foreground) point; **Shift + click** subtracts a region.
   - **⌘Z** (or **Undo last point**) removes the most recent point.
   - Zoom controls (1×–4×) sit above the image for fine work on small things like individual leaves.
   - **Accept** commits the override; **Clear points** resets without leaving edit mode; **Cancel** exits.
5. **Download.** Each cumulative mask has its own download button. PNGs are at source resolution, ready for Photoshop.

## Models

Both are fetched once from Hugging Face directly (not the project's `BASE_MODEL_URL` CDN — a deviation from the background-remover pattern) and cached in the browser:

- **Depth**: [`onnx-community/depth-anything-v2-small`](https://huggingface.co/onnx-community/depth-anything-v2-small), ~100 MB. Loaded on page mount.
- **Segmentation**: [`Xenova/slimsam-77-uniform`](https://huggingface.co/Xenova/slimsam-77-uniform), ~40 MB. Loaded lazily the first time the user enters edit mode.

## Architecture

```
src/lib/layer-separator/
├── types.ts          Layer + LayerOverride types
├── masks.ts          Pure mask math
├── masks.spec.ts     ~28 Vitest cases
├── canvas.ts         Uint8Array → PNG blob URL helpers
└── sam.ts            SlimSAM loader + image-embedding cache + multi-point predict

src/lib/components/layer-separator/
├── MaskCanvas.svelte      Renders a Uint8Array mask onto a canvas
├── DepthHistogram.svelte  256-bin histogram with N − 1 draggable markers
└── SamPicker.svelte       Image with click capture, mask overlay, zoom controls

src/routes/[[lang]]/layer-separator/
└── +page.svelte           Orchestration, state, reactivity
```

### State model

- `depthData: Uint8Array` — single-channel depth map at source resolution. Set once after the depth model runs.
- `thresholds: number[]` (length = `layerCount − 1`) — what the histogram drags.
- `committedThresholds: number[]` — debounced 150 ms copy that the mask derivation actually reads. This is what lets dragging stay fluid while the (expensive) mask repaint waits for the user to settle.
- `overridesByLayer: LayerOverride[][]` — parallel to layers; each override is a binary `Uint8Array` from SAM that wins over the depth threshold for the region it covers.
- `layers = $derived(layersFromThresholds(committedThresholds))` with `overrides` glued in per layer.
- `masks = $derived(depthToMasks(depthData, layers))` — the N − 1 cumulative B&W masks rendered live to canvases.

### Pure mask math (`masks.ts`)

- `evenLayers(n)` / `evenThresholds(n)` — initial cut positions.
- `layersFromThresholds(cuts)` — builds `Layer[]` from a cut array.
- `assignPixelsToLayers(depth, layers)` — per-pixel layer index. Overrides win over depth thresholds; later (more foreground) layers win over earlier ones if a pixel is claimed by multiple overrides.
- `buildCumulativeMasks(pixelLayers, n)` — produces the N − 1 cumulative B&W masks. Mask k is black for pixels in layers 0..k.
- `depthHistogram(depth)` — 256-bin count for the histogram.
- `resizeThresholds(cuts, target)` — grow splits the widest gap; shrink pops the foreground-most cut. The user's manually-set cuts always survive a layer-count change.

### SAM integration (`sam.ts`)

- `loadSam(onProgress)` — downloads `Xenova/slimsam-77-uniform` model + processor.
- `encodeImage(core, imageUrl)` — runs the (expensive) image encoder once per source image and caches the embeddings in a `SamSession`.
- `predictMask(session, points)` — multi-point prompt with foreground/background labels; returns the best of the 3 candidate masks. The tensor layout is **NCHW (planar)** — mask k starts at byte `k * H * W` — not interleaved, despite some upstream examples reading it as if it were.

## Known limitations

- **Depth models trained on photographs** misgroup objects on stylized ink — that's why the SAM override exists.
- **No batch mode** — one image at a time.
- **No free-form brush** — overrides come only from SAM clicks (or depth thresholds). The `LayerOverride.source` field already enumerates `'paint'` for a future brush implementation.
- **Models served from Hugging Face directly** rather than the project's DigitalOcean CDN. Should be revisited if first-load latency or rate-limits become a problem.
- **Mobile layout** has not been polished; the histogram, picker, and threshold UI assume a wide viewport.
- **i18n**: strings are not yet wrapped for Wuchale (other features in this app are).

## Open follow-ups

- Zip-all-masks download button.
- Optional `depth-anything-v2-base` for users on stronger machines.
- Home-page card so the feature is discoverable from the app shell.
- Free-form brush as a third `LayerOverride` source.
