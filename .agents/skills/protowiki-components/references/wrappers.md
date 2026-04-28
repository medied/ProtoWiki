# Wrappers

`ChromeWrapper`, `SpecialPageWrapper`, `PlainWrapper`.
Each is a layout shell with one concern. Compose by nesting — there is no
chrome-bundled convenience wrapper. **`Article`** (article body + parser output)
is documented in [`article.md`](article.md).

## Primary headings (on-rails)

Reader-style **underlined first headings** use MediaWiki’s **`mw-first-heading`**
class; ProtoWiki defines its look once in `src/styles/global.css`.

Components **emit** that class from their templates — you pass a **prop** or
**named slot** instead of hand-writing `<h1>`:

| Surface | Prop | Slot | Notes |
| --- | --- | --- | --- |
| `PlainWrapper` | `heading?` | `#heading` | Omit both when there is no primary title |
| `Article` | `title` / `displayTitle` / `contentType` (live vs mock vs baked) | `#heading` | Page title lives in `ArticleHeader`; in-body `mw-first-heading` only when `ArticleLiveContent` shows it |
| `ArticleLiveContent` | `title` / `displayTitle` | `#heading` | Slot replaces default inner HTML of the `<h1>`; use alone without `ArticleHeader` |
| `SpecialPageWrapper` | `title?` | `#title` | Special-page header typography (scoped — not `mw-first-heading`) |

`ChromeWrapper` does **not** render a page title — compose with
the rows above.

## ChromeWrapper

Adds the Wikipedia chrome (header + footer) around its default slot. **No
layout columns**: anything goes inside the chrome.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `lang` | `string` | `undefined` | BCP-47 language tag; sets `lang` on the wrapper root and is inherited by descendants via the DOM |
| `dir` | `'ltr' \| 'rtl'` | `undefined` | Writing direction; sets `dir` on the wrapper root. Pass explicitly — we don't infer it from `lang` |
| `skin` | `'desktop' \| 'mobile'` | `undefined` | Local skin override |
| `theme` | `'light' \| 'dark'` | `undefined` | Local theme override |

`lang` and `dir` are the usual top-of-tree handles: primitives inside don't need their
own `lang` prop because the value is inherited via the DOM. **`Article`** also accepts
`lang` / `dir` when you need them on the article subtree only.

### Slots

| Slot | Default content | Use for |
| --- | --- | --- |
| default | (your prototype) | Page body between header and footer |
| `#header` | `<ChromeHeader>` | Replace the entire header |
| `#search` | `<SearchBar />` | Override or remove (e.g. empty `#search` slot) — **default** is live `SearchBar` from `ChromeWrapper` |
| `#nav-prefix` | Username link (`chrome-header__username-link` → Meta) | Override or clear — **default** is a fake "Username" link before the icon cluster (desktop) |
| `#footer` | `<ChromeFooter>` | Replace the entire footer |

### Example

```vue
<ChromeWrapper>
  <h1 class="mw-first-heading">My prototype</h1>
  <p>Paragraph text rendered between Wikipedia chrome.</p>
</ChromeWrapper>

<!-- RTL preview embedded next to an LTR one -->
<div class="grid grid-cols-2 gap-4">
  <ChromeWrapper lang="en" dir="ltr">…</ChromeWrapper>
  <ChromeWrapper lang="ar" dir="rtl">…</ChromeWrapper>
</div>
```

## SpecialPageWrapper

Special-page shell — a title row, an actions row above the content, and a
full-width content area. **No chrome, no columns.**

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | `undefined` | Rendered in the title row |
| `lang` | `string` | `undefined` | BCP-47 language tag; sets `lang` on the root |
| `dir` | `'ltr' \| 'rtl'` | `undefined` | Pass `'rtl'` explicitly for RTL previews |
| `skin` | `'desktop' \| 'mobile'` | `undefined` | |
| `theme` | `'light' \| 'dark'` | `undefined` | |

### Slots

| Slot | Use for |
| --- | --- |
| default | Page body |
| `#title` | Replaces default title label inside the header `<h1>` (rich markup) |
| `#help` | Right side of the title row (e.g. icon + “Help”) |
| `#actions` | Secondary toolbar beside `#help` (filters, buttons) |
| `#notices` | Thin strip above the title row (site notices) |

### Example

```vue
<ChromeWrapper>
  <SpecialPageWrapper title="Suggested edits">
    <template #actions>
      <CdxButton action="progressive" weight="primary">Pick task</CdxButton>
    </template>
    <p>Body content here.</p>
  </SpecialPageWrapper>
</ChromeWrapper>
```

Optional **`#help`** (title-row link cluster) and **`#notices`** (strip above the title)
mirror FakeMediaWiki `SpecialView`. See `src/prototypes/special-page-template/index.vue`.

## PlainWrapper

Minimal shell — a **centred column** (`max-width: 45rem`) with horizontal
padding. **No Wikipedia chrome**, no article columns. Matches FakeMediaWiki’s
**Component** wrapper (bare prototype surface).

The **home gallery** (`src/prototypes/index.vue`) uses `PlainWrapper`.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `heading` | `string` | `undefined` | Plain-text primary heading — renders `<h1 class="mw-first-heading">` |
| `lang` | `string` | `undefined` | Sets `lang` on the root |
| `dir` | `'ltr' \| 'rtl'` | `undefined` | Sets `dir` on the root |

### Slots

| Slot | Use for |
| --- | --- |
| `#heading` | Replaces inner content of the `<h1>` (use with or instead of `heading`) |
| default | Body below the heading |

### Example

```vue
<PlainWrapper heading="Widget title">
  <p>Body below the reader-style title.</p>
</PlainWrapper>

<!-- Rich heading -->
<PlainWrapper>
  <template #heading>
    <router-link to="/">Home</router-link>
  </template>
  <p>Default slot only — no <code>heading</code> prop.</p>
</PlainWrapper>
```

## Why these wrappers?

The earlier draft of this repo had `ArticleLayout`, `ArticleBody`,
`ArticleWrapper-with-chrome`, `MobileWrapper`, `PhoneFrame`, `SideBySide`
and similar. They overlapped: every author had to learn which one bundled
chrome, which one bundled columns, which one was a presentation device.

The current set covers:

- chrome (`ChromeWrapper`)
- article reader surface (`Article` = `ArticleHeader` + `ArticleLiveContent` or `ArticleMockContent`; see [`article.md`](article.md))
- special-page shell (`SpecialPageWrapper`)
- plain centred column (`PlainWrapper`)

Everything else (mobile preview, A/B comparison, dark snippet on a light
page) is expressed via the shared `skin` / `theme` props on those same
components — no extra layout wrappers needed. See
[`composition-recipes.md`](composition-recipes.md).
