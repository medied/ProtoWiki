---
name: protowiki-ve-vendoring
description: ProtoWiki-specific integration for vendoring the upstream VisualEditor bundle — the convention for where the bundle lands (public/visualeditor/), where the loader goes (src/lib/visualeditor/), the :root-rewrite interaction with src/lib/theming.ts, and how to wrap the resulting editor in ChromeWrapper / Article. Nothing committed today; this skill describes the convention for adding a real-VE prototype. Use when adding a real-VE prototype to ProtoWiki, or when the VE skin CSS conflicts with the data-theme cascade.
license: MIT
---

# Vendoring upstream VisualEditor — Inside ProtoWiki

For the universal pattern (the `update-ve.sh` snapshot script, the
`loadVe.ts` loader, the lifecycle helpers, the bundle-drift tradeoffs),
see [`visual-editor-vendoring`](../visual-editor-vendoring/SKILL.md).

This skill is the ProtoWiki-specific layer on top of that pattern.

> **No VE bundle is currently committed in this repo.** This skill
> describes the convention for adding one — paths, loader location,
> theming-conflict resolution. Running the snapshot script is what
> creates the directories below.

## Where things would live in this repo

After running the snapshotter and writing a loader, the convention is:

```
public/
└── visualeditor/                ← snapshot of the VE bundle, served verbatim
    ├── ve.css
    ├── ve.js
    ├── platform.js
    └── …
src/
└── lib/
    └── visualeditor/
        └── loadVe.ts            ← the loader from visual-editor-vendoring
```

- `public/visualeditor/` would be served verbatim by Vite (and end up
  in `dist/visualeditor/` at build time).
- `src/lib/visualeditor/loadVe.ts` is a TS port of the loader
  documented in
  [`visual-editor-vendoring`](../visual-editor-vendoring/SKILL.md).
  It would use ProtoWiki-relative URLs to find the bundle in
  `public/`.

## Refreshing the snapshot

The snapshot script lives at
`.agents/skills/visual-editor-vendoring/assets/update-ve.sh`. Run it
with the ProtoWiki output directory:

```bash
bash .agents/skills/visual-editor-vendoring/assets/update-ve.sh public/visualeditor/
```

Update the script's UA string to ProtoWiki's contact when running
server-side fetches.

## Wrapping a real-VE prototype in ProtoWiki chrome

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { attachVe } from '@/lib/visualeditor/loadVe'

const root = ref<HTMLElement | null>(null)
let handle: { destroy(): void } | null = null

onMounted(async () => {
  if (!root.value) return
  handle = await attachVe(root.value, '<p>Initial content.</p>')
})

onUnmounted(() => handle?.destroy())
</script>

<template>
  <ChromeWrapper>
    <Article>
      <div ref="root" class="mw-parser-output" />
    </Article>
  </ChromeWrapper>
</template>
```

`ChromeWrapper` and `Article` come from
[`protowiki-components`](../protowiki-components/SKILL.md). VE attaches
to the inner `<div>` and inherits the surrounding chrome / theme.

## Theming conflict — VE's `:root` CSS vs. ProtoWiki's `[data-theme]`

VE's skin CSS targets `:root` selectors for its own colour and spacing
variables. ProtoWiki rewrites Codex's `:root` token rules to
`[data-theme="light"]` / `[data-theme="dark"]` at boot via
`src/lib/theming.ts` so per-subtree theme overrides cascade — see
[`protowiki-theme`](../protowiki-theme/SKILL.md).

If you load VE alongside that, both cascades hit `:root` (or
`[data-theme]`) and can collide on shared variable names. The
recommended fix mirrors the Codex approach: in `loadVe.ts`'s fetch
step, rewrite `:root` in VE's CSS to a scoping selector
(e.g. `.ve-host[data-theme="light"]` / `.ve-host[data-theme="dark"]`)
and add the `ve-host` class to the editor wrapper.

If you don't need light + dark VE side-by-side, the simpler workaround
is to leave VE's `:root` alone and accept that the VE subtree always
follows the global `<html data-theme>`.

## Lifecycle gotchas (ProtoWiki-specific)

- **Vue Router teardown.** When the user navigates away, your
  `onUnmounted` hook must call `handle.destroy()`. Otherwise VE leaks
  global event listeners that will conflict on the next mount.
- **Lazy-import the editor component.** The VE bundle is multi-MB —
  keep it out of the home-page chunk by `defineAsyncComponent`'ing the
  page that uses it.
- **`mw.config`.** Extend `loadVe.ts`'s minimal stub for any config
  key your prototype reads (page title, namespace, user). Don't ship a
  hardcoded user identity.

## See also

- [`visual-editor-vendoring`](../visual-editor-vendoring/SKILL.md) — the
  universal vendoring pattern.
- [`visual-editor-prototyping`](../visual-editor-prototyping/SKILL.md) —
  the umbrella that decides whether you should vendor VE at all.
- [`protowiki-components`](../protowiki-components/SKILL.md) —
  `ChromeWrapper`, `Article`.
- [`protowiki-theme`](../protowiki-theme/SKILL.md) — the
  `[data-theme]` cascade and the `:root`-rewrite trick used for Codex.
