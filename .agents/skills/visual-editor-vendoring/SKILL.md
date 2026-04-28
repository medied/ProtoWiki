---
name: visual-editor-vendoring
description: Deep dive on vendoring the real upstream Wikipedia VisualEditor bundle into a frontend — the update-ve.sh snapshot script that fetches the bundle, the loadVe.ts loader that injects it on demand, and the whenVeReady() / whenVePlatformReady() lifecycle for waiting on init. Use when your work genuinely needs real VE fidelity (toolbar, reference dialog, transclusion editor) and a forked demo or lightweight editor surface isn't enough.
license: MIT
---

# Visual Editor vendoring

The real upstream VisualEditor (the same code that runs on Wikipedia)
isn't an npm package — it's a bundle assembled by ResourceLoader.
Vendoring is how we get it locally.

**Before you read this**, check
[`visual-editor-prototyping`](../visual-editor-prototyping/SKILL.md). 80%
of editor work does not need the real VE.

## What "vendor VE" means

1. Use a snapshot script (e.g. `update-ve.sh`) to download a
   ResourceLoader bundle of the VE modules + a few helpers,
   post-process them, and write the result somewhere your bundler
   serves statically.
2. Use a loader (`loadVe.ts` here) at runtime to:
   - Inject `<link rel="stylesheet">` for the VE CSS.
   - Inject `<script>` for the VE JS.
   - Wait for the VE bootstrap to populate the global `mw.libs.ve` /
     `ve` namespaces.
3. Render a target DOM with `class="mw-parser-output"` etc. and tell
   the loaded VE to attach to it.

The deep-dive scripts live in `assets/`:

- [`assets/update-ve.sh`](assets/update-ve.sh) — the snapshotter.
- [`assets/loadVe.ts`](assets/loadVe.ts) — the loader and lifecycle
  helpers.

## `update-ve.sh`

A single shell script that fetches:

- The VE modules CSS / JS bundle from `load.php` (using `?modules=…&only=…`).
- The MediaWiki "platform" pre-requisites (`mediawiki`, `oojs`, `oojs-ui`,
  `mediawiki.legacy.shared`, etc.).
- Optionally a stub `mw` global with the parts VE expects but a static
  frontend doesn't have a wiki for.

The script writes everything to a static-assets directory (e.g.
`public/visualeditor/`) so the bundle is served verbatim at runtime.
Re-run it whenever you want a fresher VE.

## `loadVe.ts`

A small TS module exporting:

```ts
export async function loadVe(): Promise<typeof globalThis.ve>
export function whenVeReady(cb: () => void): void
export function whenVePlatformReady(cb: () => void): void
export async function attachVe(target: HTMLElement, html: string): Promise<{ destroy(): void }>
```

`loadVe()` injects the `<link>` and `<script>` tags exactly once and
returns the `ve` global. Subsequent calls reuse the same Promise.

`whenVeReady()` resolves once `mw.libs.ve` is fully bootstrapped (after
its async init phase).

`whenVePlatformReady()` resolves earlier — when the platform globals
(`mw`, `oojs`, `oojs-ui`) exist but VE may still be initializing. Useful
for setting up callbacks that need `mw.config` etc.

`attachVe(target, html)` is the convenience: render `html` into `target`,
then ask VE to take over. Returns a destroy handle.

## Usage

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
// Adjust the import path to wherever you put loadVe.ts in your project.
import { attachVe } from './loadVe'

const root = ref<HTMLElement | null>(null)
let handle: { destroy(): void } | null = null

onMounted(async () => {
  if (!root.value) return
  handle = await attachVe(root.value, '<p>Initial content.</p>')
})

onUnmounted(() => handle?.destroy())
</script>

<template>
  <div ref="root" class="mw-parser-output" />
</template>
```

## Lifecycle gotchas

- **Don't load VE on every route**. Lazy-import the editor component;
  the bundle is large.
- **Idempotent loader**. Calling `loadVe()` twice mustn't inject the
  scripts twice. The provided loader uses a single Promise cache.
- **mw.config**. VE expects a populated `mw.config` (page title,
  user, namespace). The loader ships a minimal stub; extend it for any
  config key your work reads.
- **CSS scoping**. VE injects skin CSS with `:root` selectors. If your
  environment also re-scopes the Codex tokens at `:root` (for
  attribute-driven theme switching), the two cascades can collide.
  Rewriting `:root` in VE's CSS files at fetch time mirrors the same
  trick — see "Inside ProtoWiki" below.
- **Cleanup on route change**. Always call `handle.destroy()`. VE attaches
  global event listeners; not destroying leaks them.

## Bundle drift

VE moves fast. Snapshot freshness:

- Re-run `update-ve.sh` every ~3 months.
- Check the prototype still works — features get added/removed.
- Pin the wiki version in the script (e.g., `wgVersion=1.43`) for
  reproducibility, and bump intentionally.

## When to give up

If you find yourself:

- Patching VE source after vendoring.
- Working around platform bugs that wouldn't exist on a real wiki.
- Needing a real `action=edit` round-trip.

…the answer is no longer "vendor VE in a static SPA". It's "stand up a
small wiki" — a real MediaWiki instance behind the work. That's
out of scope for a static-frontend pattern; consider FakeMediaWiki or a
tiny WMF Cloud VPS instead.

## See also

- [`visual-editor-prototyping`](../visual-editor-prototyping/SKILL.md) —
  the umbrella that decides whether you should be here at all.
- For Edit Check-style UX without the bundle cost, see
  [`wiki-signals` → `suggestions.md`](../wiki-signals/references/suggestions.md)
  for simulating the stream.

## Inside ProtoWiki

ProtoWiki has a dedicated companion skill,
[`protowiki-ve-vendoring`](../protowiki-ve-vendoring/SKILL.md), that
covers the repo-specific bits: where the vendored bundle lives
(`public/visualeditor/`), where the loader lives in `src/lib/`, the
interaction with `src/lib/theming.ts`'s `:root`-rewrite, and how to
wrap the resulting editor in `ChromeWrapper` / `Article`.
