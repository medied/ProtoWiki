---
name: protowiki-components
description: Catalog of every shipped component in src/components/ — the three single-concern layout wrappers (ChromeWrapper, SpecialPageWrapper, PlainWrapper), the chrome primitives (ChromeHeader, ChromeFooter), Article surface (Article, ArticleHeader, ArticleLiveContent, ArticleMockContent), and SearchBar. Use when picking a wrapper, composing a page, looking up props/slots/events for any ProtoWiki component, or asking "what components does ProtoWiki ship?".
license: MIT
---

# ProtoWiki components

ProtoWiki ships a small, deliberate set of components in `src/components/`.
They're all plain Vue 3 components — no registry, no special mounting, no
"prototype framework". Use them like any other Vue component.

This skill is the cross-cutting guide. Per-component depth lives in
`references/`:

- [`references/wrappers.md`](references/wrappers.md) — `ChromeWrapper`,
  `SpecialPageWrapper`, `PlainWrapper`
- [`references/chrome-primitives.md`](references/chrome-primitives.md) —
  `ChromeHeader`, `ChromeFooter`
- [`references/article.md`](references/article.md) — `Article`,
  `ArticleHeader`, `ArticleLiveContent`, `ArticleMockContent`
- [`references/search-bar.md`](references/search-bar.md)
- [`references/editors.md`](references/editors.md) —
  Visual editor prototyping **outside** ProtoWiki (fork Bárbara Martínez Calvo’s article template + suggestion-mode repos)
- [`references/edit-suggestions.md`](references/edit-suggestions.md) —
  Edit Check-style suggestion stream alongside **your** editing surface (payload
  shape, side-by-side layout, `SuggestionCard`, publish interception)
- [`references/composition-recipes.md`](references/composition-recipes.md)

## The shape of the catalogue

| Component | Concern | Renders chrome? | Renders columns? |
| --- | --- | --- | --- |
| `ChromeWrapper` | Wikipedia chrome (header + footer) around a slot | Yes | No |
| `SpecialPageWrapper` | Special-page shell — title + actions + content | No | No (full-width) |
| `PlainWrapper` | Centred narrow column — no chrome (gallery / Component-style demos) | No | No |
| `ChromeHeader` | Vector-style chrome when `skin=desktop`, Minerva-style when `skin=mobile` — wordmarks, search cluster, user tools (via ChromeWrapper) | n/a | n/a |
| `ChromeFooter` | License blurb + footer links (via ChromeWrapper) — no badge logos | n/a | n/a |
| `Article` | Full reader surface: Vector-style page header + parser body (live REST, mock snapshot, or baked `html`) | No | No |
| `ArticleHeader` | Title row, tabs, read/edit/history, tools (used inside `Article`) | No | No |
| `ArticleLiveContent` | Parser column — live REST + cache, or baked `html`; `.mw-parser-output`, optional H1 | No | No |
| `ArticleMockContent` | Wet Leg fixture: fetches `public/snapshots/wet-leg.html` once (module cache), renders via `ArticleLiveContent` | No | No |
| `SearchBar` | `CdxTypeaheadSearch` wired to opensearch (default in ChromeHeader) | n/a | n/a |

## The two ideas you need

### 1. Single concern, compose by nesting

Each layout shell does **one** thing. To get a full Wikipedia-shaped article
page, you nest:

```vue
<ChromeWrapper>
  <Article title="Albert Einstein" />
</ChromeWrapper>
```

Two lines, top-down: chrome → article content. There is no chrome-bundled "ArticleLayout" convenience wrapper:
the rule is uniform — only `ChromeWrapper` paints chrome — so you never
have to ask "which one?".

### 2. Shared `skin` / `theme` on every themable component; `lang` / `dir` on layout shells + `Article`

Every component in this list (`ChromeWrapper`,
`SpecialPageWrapper`, `PlainWrapper`, `Article`,
`ArticleLiveContent`, `ArticleMockContent`, `SearchBar`) accepts the same two theming props:

| Prop | Type | Effect |
| --- | --- | --- |
| `skin` | `'desktop' \| 'mobile'` | Sets `data-skin="…"` on the root, locally re-skinning the subtree |
| `theme` | `'light' \| 'dark'` | Sets `data-theme="…"` on the root, locally re-theming the subtree |

The **layout wrappers** (`ChromeWrapper`, `SpecialPageWrapper`,
`PlainWrapper`), **`Article`**, **`ArticleLiveContent`**, and **`ArticleMockContent`** accept:

| Prop | Type | Effect |
| --- | --- | --- |
| `lang` | `string` (BCP-47) | Sets `lang="…"` on the component root |
| `dir` | `'ltr' \| 'rtl'` | Sets `dir="…"` on the component root — pass it explicitly; ProtoWiki does not infer it from `lang` |

Usually you set `lang` / `dir` once on `ChromeWrapper` (or `<html>`); use
`Article`'s props when you need language or direction on the article subtree
only. Chrome primitives inherit `lang` / `dir` through the DOM and do not
repeat these props.

When `skin` / `theme` props are omitted, components resolve **effective**
skin/theme from the nearest `ChromeWrapper` (Vue provide/inject for
`Article` / `ArticleLiveContent` / `ArticleMockContent` / `SpecialPageWrapper`), then from global boot state on
`<html>`. Roots set `data-skin` / `data-theme` from that resolution so
`[data-skin]` CSS stays aligned with nested previews.

See [`protowiki-skins`](../protowiki-skins/SKILL.md) and
[`protowiki-theme`](../protowiki-theme/SKILL.md) for the full theming
model.

## Imports

All components live at `@/components/<Name>.vue`:

```ts
import ChromeWrapper from '@/components/ChromeWrapper.vue'
import ChromeHeader from '@/components/ChromeHeader.vue'
import ChromeFooter from '@/components/ChromeFooter.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import PlainWrapper from '@/components/PlainWrapper.vue'
import Article from '@/components/Article.vue'
import ArticleHeader from '@/components/ArticleHeader.vue'
import ArticleLiveContent from '@/components/ArticleLiveContent.vue'
import ArticleMockContent from '@/components/ArticleMockContent.vue'
import SearchBar from '@/components/SearchBar.vue'
```

The `@/` prefix resolves to `src/`.

## Quick props/slots overview

| Component | Key props | Notable slots |
| --- | --- | --- |
| `ChromeWrapper` | `lang?`, `dir?`, `skin?`, `theme?` | default, `#header`, `#search`, `#nav-prefix`, `#footer` |
| `SpecialPageWrapper` | `title?`, `lang?`, `dir?`, `skin?`, `theme?` | default, `#title`, `#help`, `#actions`, `#notices` |
| `PlainWrapper` | `heading?`, `lang?`, `dir?` | default, `#heading` |
| `ChromeHeader` | `skin?`, `theme?` | `#logo`, `#search`, `#nav` |
| `ChromeFooter` | `skin?`, `theme?` | default |
| `Article` | `contentType?` (`'live'` \| `'mock'`), body props + `languagesLabel?`, `languageLinks?`, `languageSearchPlaceholder?`, header `tagline?`, `primaryTab?`, `viewTab?` | default, `#heading` |
| `ArticleLiveContent` | `hideTitle?`, same body props as `Article` (live path) | default, `#heading` |
| `ArticleMockContent` | `hideTitle?`, `host?`, `lang?`, `dir?`, `skin?`, `theme?` | default, `#heading` |
| `ArticleHeader` | `title`, `languagesLabel?`, `languageLinks?`, `languageSearchPlaceholder?`, `tagline?`, `primaryTab?`, `viewTab?` | emits (`languageSelect`, `languageSettingsClick`, tab/action clicks) |
| `SearchBar` | `host?`, `placeholder?`, `limit?`, `skin?`, `theme?` | none |

## When to reach beyond this list

If you need a UI primitive (button, form field, dialog, toast, table,
checkbox, tabs, etc.), use a Codex component directly — see
[`codex-components`](../codex-components/SKILL.md). Don't add a new wrapper
for one prototype's needs; put the bespoke layout inside that prototype's
folder.
