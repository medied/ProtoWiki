---
name: protowiki-snapshot-data
description: ProtoWiki-specific integration of the snapshotting pattern — the npm scripts that wrap the agnostic fetchers, where snapshots land in this repo (public/snapshots/, src/styles/wiki-content/), how Article consumes a pre-baked HTML body, and how the skin CSS gets scoped to [data-skin]. Use when adding a new article snapshot to ProtoWiki, refreshing the Wikipedia skin CSS, or wiring Article up to a static fixture.
license: MIT
---

# Snapshotting Wikipedia data — Inside ProtoWiki

For the universal pattern (when to snapshot, the scoping principle, the
tradeoffs, the underlying `fetch_page.py` / `fetch_skin_css.sh`
recipes), see
[`wiki-snapshot-data`](../wiki-snapshot-data/SKILL.md).

This skill is the ProtoWiki-specific layer on top of that pattern —
the wrapped npm scripts, the committed paths, and the consumer
component.

## Where snapshots live in this repo

The convention is:

```
public/
└── snapshots/
    └── <slug>.html              ← committed article fixtures, served verbatim
src/
└── styles/
    └── wiki-content/
        ├── <skin>.rl.css        ← raw RL fetch (committed for diffability)
        └── <skin>.css           ← scoped output, imported by main.ts
```

Current state on disk:

- `src/styles/wiki-content/{vector-2022,minerva}.{css,rl.css}` — already
  committed and imported globally in `src/main.ts`.
- `public/snapshots/wet-leg.html` — mock article fixture used by `Article` with `content-type="mock"` / `ArticleMockContent`.

## Refreshing skin CSS

```bash
npm run snapshot:wiki-skins
```

The script (`scripts/snapshot-wiki-skins.sh`) does two passes:

1. **Fetch raw RL bundles** for Vector 2022 and Minerva from the
   ResourceLoader endpoint, and write them to
   `src/styles/wiki-content/{vector-2022,minerva}.rl.css`.
2. **Scope every selector** through `scripts/scope-wiki-skin-css.mjs`
   (PostCSS + `postcss-prefix-selector`):
   - Vector → prefixed under `[data-skin="desktop"] .mw-parser-output`.
   - Minerva → prefixed under `[data-skin="mobile"] .mw-parser-output`.
   - Selectors targeting `body`, `:root`, or `html` collapse to
     `.mw-parser-output`.

The scoped output lands at
`src/styles/wiki-content/{vector-2022,minerva}.css`, both imported
globally in `src/main.ts`. Because the rules are scoped, nested
`skin="desktop"` / `skin="mobile"` previews coexist cleanly inside one
page; chrome and Codex components are unaffected.

Re-run the npm script every few months to track upstream skin
evolution.

## Refreshing article HTML snapshots

ProtoWiki doesn't (currently) wrap the HTML fetcher in an npm script —
the agnostic recipe lives in
`.agents/skills/wiki-snapshot-data/assets/fetch_page.py`. Run it with
the ProtoWiki output path:

```bash
python3 .agents/skills/wiki-snapshot-data/assets/fetch_page.py \
  "Albert Einstein" -o public/snapshots/albert-einstein.html
```

Update the `UA` string in that script to ProtoWiki's contact when
running it server-side — anonymous UAs are rate-limited or blocked.

## Consuming a snapshot from `Article`

`Article` accepts an `html` prop directly, so a pre-baked
fixture page looks like this:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Article from '@/components/Article.vue'

const html = ref('')
onMounted(async () => {
  const res = await fetch(`${import.meta.env.BASE_URL}snapshots/albert-einstein.html`)
  html.value = await res.text()
})
</script>

<template>
  <Article :html="html" display-title="Albert Einstein" />
</template>
```

When `html` is supplied, `Article` skips the live REST fetch and
just renders the fixture inside `.mw-parser-output`. Combined with the
imported skin CSS, the result is visually indistinguishable from the
real article.

## See also

- [`wiki-snapshot-data`](../wiki-snapshot-data/SKILL.md) — the universal
  pattern and the underlying fetch scripts.
- [`protowiki-components`](../protowiki-components/SKILL.md) —
  `Article`'s full API.
- [`protowiki-skins`](../protowiki-skins/SKILL.md) — the `[data-skin]`
  cascade that the scoped CSS plugs into.
- [`wiki-apis`](../wiki-apis/SKILL.md) — fetching live data, the
  alternative path.
