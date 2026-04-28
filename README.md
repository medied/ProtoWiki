# ProtoWiki

Tools, strategies, resources and components for prototyping MediaWiki projects.

There are two main ways of using this repo:

1. Give your agent skills from the [skills](.agents/skills/) folder to show them how to prototype MediaWiki features.
2. Clone this repo and use it as a prototyping environment itself.

## Running it locally

```bash
git clone https://github.com/<org>/protowiki.git
cd protowiki
npm install
npm run dev
```

Open <http://localhost:5173>. The home page lists every prototype.
Add your own by creating a folder under `src/prototypes/` — there's no
registry step.

```bash
npm run build       # produces dist/ (with the GitHub Pages SPA 404 fallback)
npm run preview     # serves the production build locally
npm run type-check  # optional, never required to ship
npm run format      # Prettier
npm run lint        # ESLint
```

## What's in here

- `src/prototypes/` — one folder per prototype. The home page (`index.vue`)
  auto-discovers them via [`unplugin-vue-router`](https://uvr.esm.is/).
- `src/components/` — layout wrappers, chrome primitives, article surfaces,
  and `SearchBar` (live Wikipedia lookups). See [`protowiki-components`](.agents/skills/protowiki-components/SKILL.md)
  for the full catalogue.
- `src/composables/` — read-only theming hooks.
- `src/lib/` — boot-time skin / theme resolution with runtime Codex-token
  injection scoped to `[data-theme]`.
- `src/styles/` — site-wide baseline CSS plus any theme / skin bundles.
  Wrapper and chrome layout live beside the components themselves.
- `.agents/skills/` — every non-code resource: how to use Codex, fetch
  Wikipedia data, prototype editor UIs, deploy. See below.

## How to learn ProtoWiki

ProtoWiki is documented as **Agent Skills** in `.agents/skills/`. Each
folder contains a `SKILL.md` plus optional `references/` and `assets/`.
Both AI agents and humans can read them.

### ProtoWiki workflow

- [`protowiki-getting-started`](.agents/skills/protowiki-getting-started/SKILL.md) — orientation
- [`protowiki-create-prototype`](.agents/skills/protowiki-create-prototype/SKILL.md) — make a new prototype
- [`protowiki-components`](.agents/skills/protowiki-components/SKILL.md) — wrappers, chrome, article surfaces, search
- [`protowiki-skins`](.agents/skills/protowiki-skins/SKILL.md) — desktop / mobile skins
- [`protowiki-theme`](.agents/skills/protowiki-theme/SKILL.md) — light / dark theming
- [`protowiki-deploy`](.agents/skills/protowiki-deploy/SKILL.md) — building and deploying to GitHub Pages

### Codex design system

- [`codex-usage`](.agents/skills/codex-usage/SKILL.md) — how to use Codex in prototypes
- [`codex-tokens`](.agents/skills/codex-tokens/SKILL.md) — design tokens
- [`codex-components`](.agents/skills/codex-components/SKILL.md) — Vue components
- [`codex-icons`](.agents/skills/codex-icons/SKILL.md) — icon catalogue
- [`codex-design-principles`](.agents/skills/codex-design-principles/SKILL.md) — design principles

### Real Wikimedia data

- [`wiki-apis`](.agents/skills/wiki-apis/SKILL.md) — REST + Action API + etiquette
- [`wiki-signals`](.agents/skills/wiki-signals/SKILL.md) — what's available beyond the article body
- [`wiki-snapshot-data`](.agents/skills/wiki-snapshot-data/SKILL.md) — snapshotting article HTML and skin CSS (universal pattern)
- [`protowiki-snapshot-data`](.agents/skills/protowiki-snapshot-data/SKILL.md) — ProtoWiki integration: `public/snapshots/`, `Article` wiring

### Visual Editor

- [`visual-editor-prototyping`](.agents/skills/visual-editor-prototyping/SKILL.md) — fork Bárbara’s article template + suggestion-mode repos / suggestion overlays / real VE
- [`visual-editor-vendoring`](.agents/skills/visual-editor-vendoring/SKILL.md) — vendor the real upstream VE (universal pattern)

For Edit Check-style suggestion overlays, see
[`wiki-signals` → `suggestions.md`](.agents/skills/wiki-signals/references/suggestions.md)
(simulating the stream) and
[`protowiki-components` → `edit-suggestions.md`](.agents/skills/protowiki-components/references/edit-suggestions.md)
(rendering beside your editing surface).

For agents specifically, see [`AGENTS.md`](AGENTS.md).

## URL params

Useful when sharing a prototype:

```
/chrome-template?skin=mobile   ← force mobile chrome
```

These pin the global skin / theme; otherwise ProtoWiki resolves them
from viewport (`>=640px` is desktop skin) and `prefers-color-scheme`.
