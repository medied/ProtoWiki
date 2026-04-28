# Chrome primitives — `ChromeHeader`, `ChromeFooter`

These are the two components `ChromeWrapper` composes to paint the
Wikipedia chrome. They're independently importable when you want the
chrome-without-the-wrapper (e.g., a custom layout that doesn't use
`ChromeWrapper`'s default arrangement).

## Skin variants

`ChromeHeader` renders **two different shells** based on effective skin
(`data-skin` on the header root):

| Skin | Chrome feel | Notes |
| --- | --- | --- |
| `desktop` | **Vector 2022–style** | Production EN wordmark + tagline SVGs from `en.wikipedia.org/static/…`, `SearchBar` + **Search** button, user-tool cluster (appearance, bell + badge, notices tray, watchlist, user + chevron). **Main-menu glyph is icon-only** (mock, non-interactive). Global skin stays **desktop** until the viewport is **≤640px** (FakeMediaWiki `SpecialView` parity); **below 1120px**, inline search collapses to a search icon; **below 768px**, watchlist hides (`nav-button-desktop` parity in `SpecialView/style.css`). |
| `mobile` | **Minerva-style** | Grey elevated bar: menu, Wikipedia wordmark (SVG), search icon + notifications — closer to the shared `@wm/shared` mobile header pattern than to Vector's full desktop chrome. |

`ChromeFooter` is a compact reader strip: **`--background-color-base`** (white in light
theme), thin top border, license blurb, then bullet-separated links — **no** wordmark or
Wikimedia/MediaWiki badge logos (aligned with the default English Wikipedia footer).

## ChromeHeader

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `skin` | `'desktop' \| 'mobile'` | `undefined` | Local skin override; falls back to global `useSkin()` |
| `theme` | `'light' \| 'dark'` | `undefined` | Local theme override; falls back to global `useTheme()` |

`lang` / `dir` are deliberately not props on the primitives. Set them once
on the surrounding wrapper (or on `<html>`) and the chrome inherits them
through the DOM.

### Slots

| Slot | Default | Use for |
| --- | --- | --- |
| `#logo` | EN Wikipedia wordmark (+ tagline on desktop) via `<img>` | Replace with another project's wordmark / lockup |
| `#search` | `<SearchBar>` | Custom search (desktop only shows inline search; mobile uses icon links to `Special:Search`). **`ChromeWrapper`** passes this slot through and defaults it to `<SearchBar />` when you don't override `#search`. |
| `#nav-prefix` | (empty) | Username / meta link before tool icons on **desktop**. **`ChromeWrapper`** defaults this to a fake "Username" link; **`ChromeHeader` alone** leaves it empty unless you fill the slot. |
| `#nav` | Vector-style tool icons on **desktop** only | Replace the default user-tool cluster |

### Example

```vue
<ChromeHeader />
```

## ChromeFooter

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `skin` | `'desktop' \| 'mobile'` | `undefined` | |
| `theme` | `'light' \| 'dark'` | `undefined` | |

### Slots

| Slot | Default | Use for |
| --- | --- | --- |
| default | License paragraph + footer links (no logos) | Replace the entire footer |

### Example

```vue
<ChromeFooter>
  <p>This prototype is for design review only.</p>
</ChromeFooter>
```

## When to use the primitives directly

Most prototypes use `<ChromeWrapper>`, which composes both primitives.
Use them directly when:

- You want the chrome but with a non-default layout between header and
  footer (e.g., a 3-column layout with sticky toolbars that isn't covered
  by `Article` / `ArticleLiveContent` / `ArticleMockContent` / `SpecialPageWrapper`).
- You want the header but no footer (or vice versa).
- You're building your own wrapper and the new wrapper genuinely warrants
  living in `src/components/` (rare).

```vue
<script setup lang="ts">
import ChromeHeader from '@/components/ChromeHeader.vue'
import ChromeFooter from '@/components/ChromeFooter.vue'
</script>

<template>
  <div class="custom-shell">
    <ChromeHeader />
    <main class="custom-shell__body">
      <!-- bespoke layout here -->
    </main>
    <ChromeFooter />
  </div>
</template>
```

## Inheriting skin/theme inside `ChromeWrapper`

`ChromeWrapper` **provides** effective skin and theme to descendants.
`Article` and `ArticleLiveContent` **inject** them when their own
`skin` / `theme` props are omitted, so article columns and special-page
typography track embedded `<ChromeWrapper skin="mobile">` previews without
repeating props on every child.
