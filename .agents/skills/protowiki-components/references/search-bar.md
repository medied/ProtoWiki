# `SearchBar`

Wikipedia typeahead search — `CdxTypeaheadSearch` wired to the MediaWiki
**opensearch** Action API. Default search component used by `ChromeHeader`.

## Usage

```vue
<SearchBar @select="onSelect" @submit="onSubmit" />
```

```ts
function onSelect(title: string) {
  router.push(`/article/${encodeURIComponent(title)}`)
}

function onSubmit(query: string) {
  router.push({ path: '/search', query: { q: query } })
}
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `host` | `string` | `'en.wikipedia.org'` | Wiki host the opensearch hits — also picks the language |
| `placeholder` | `string` | `'Search Wikipedia'` | Input placeholder + a11y label |
| `limit` | `number` | `10` | Max suggestions returned |
| `skin` | `'desktop' \| 'mobile'` | `undefined` | |
| `theme` | `'light' \| 'dark'` | `undefined` | |

`lang` / `dir` are inherited from the surrounding wrapper.

## Events

| Event | Payload | Fired when |
| --- | --- | --- |
| `select` | `string` (title) | User clicks / picks a suggestion |
| `submit` | `string` (query) | User presses Enter or clicks the search icon |

## Behaviour

- Each keystroke abort-cancels the previous request via `AbortController`,
  so fast typing doesn't pile up.
- Suggestions render with title + (when present) short description.
- The "Search Wikipedia for pages containing **&lt;query&gt;**" footer goes
  to `Special:Search` on the configured host.
- The form action posts to the same wiki's `/w/index.php` so the user can
  fall back to a real Wikipedia search by hitting Enter when offline-
  rendering this prototype.

## Replacing or hiding it

**`ChromeWrapper`** forwards `#search` to **`ChromeHeader`**. If you omit
`#search` on `ChromeWrapper`, it defaults to **`<SearchBar />`** (same as
`ChromeHeader`'s own default) — so most prototypes never import `SearchBar`.

**`ChromeWrapper`** also defaults **`#nav-prefix`** to a placeholder **Username**
link (`chrome-header__username-link` → Meta). Override with your own markup, or
use an empty `<template #nav-prefix></template>` to hide it.

Custom search:

```vue
<ChromeWrapper>
  <template #search>
    <MyCustomSearch />
  </template>
  …
</ChromeWrapper>
```

Suppress inline search (keeps layout; use sparingly):

```vue
<ChromeWrapper>
  <template #search>
    <span aria-hidden="true" />
  </template>
  …
</ChromeWrapper>
```

## Etiquette

- The opensearch endpoint accepts `origin=*` and works from the browser
  without CORS preflight.
- Set `host` to a localized wiki to drive search there (`fr.wikipedia.org`,
  `commons.wikimedia.org`, etc.).
- See [`wiki-apis/references/etiquette.md`](../../wiki-apis/references/etiquette.md)
  for the WMF policy on User-Agent and rate-limits when extending this
  beyond opensearch.
