# Article surface — `Article`, `ArticleHeader`, `ArticleLiveContent`, `ArticleMockContent`

**`Article`** is the full reader page: a Vector-style **`ArticleHeader`**
(title row, interlanguage popover, Article/Talk tabs, Read/Edit/View history,
watch, tagline) plus **`ArticleLiveContent`** or **`ArticleMockContent`**
(REST, snapshot HTML, or the shipped Wet Leg mock inside `.mw-parser-output`).

Use **`Article`** for “real Wikipedia article” prototypes. Use
**`ArticleLiveContent`** alone when you only need the parser column (no skin title
row) — for example a custom dashboard embedding wiki HTML.

When `Article` sits inside `ChromeWrapper`, it **inherits** effective `skin` /
`theme` via Vue inject (same as `SpecialPageWrapper`) so `data-skin` stays
aligned with chrome without repeating props.

## `Article`

### Content type

**`contentType`** (default `'live'`) chooses how the parser column is loaded:

| Value | Behaviour |
| --- | --- |
| `'live'` | **`ArticleLiveContent`** — `title` + REST fetch (or pass `html` for a snapshot body). |
| `'mock'` | **`ArticleMockContent`** — fetches `public/snapshots/wet-leg.html` once (module-level promise cache), then renders **Wet Leg** via `ArticleLiveContent`. Ignores `title` / `html` / `displayTitle` for the body; header title is fixed to match the fixture. |

### Two body modes (when `contentType` is `'live'`)

#### Live REST fetch

Pass `:title="…"`. `ArticleLiveContent` calls
`https://{host}/api/rest_v1/page/html/{title}` and renders the parser output.
The visible title appears in **`ArticleHeader`** (not duplicated as
`mw-first-heading` in the body unless you use the `#heading` slot).

```vue
<Article title="Albert Einstein" />
<Article title="Marie Curie" host="en.wikipedia.org" />
```

#### Pre-baked HTML

Pass `:html="…"` and usually `:display-title="…"` so the header has a label.
No network call for the body.

```vue
<Article
  :html="bakedHtml"
  display-title="Albert Einstein"
/>
```

#### Mock fixture

```vue
<Article content-type="mock" />
```

Optional `lang` / `dir` on **`Article`** (or `ChromeWrapper`) set them on the
outer `<article>`. Loading and errors are surfaced in **`ArticleLiveContent`**
/ **`ArticleMockContent`** via `CdxProgressBar` / `CdxMessage`. See [`wiki-apis`](../../wiki-apis/SKILL.md).

### Props (`Article`)

| Prop | Type | Notes |
| --- | --- | --- |
| `contentType` | `'live' \| 'mock'` | Default `live`. `mock` uses the Wet Leg snapshot only. |
| `lang`, `dir` | | Passed to `<article>` and through to the content child. |
| `title`, `html`, `displayTitle`, `host` | | Forwarded to **`ArticleLiveContent`** when `contentType` is `live`; same mutual exclusivity as before. |
| `skin`, `theme` | | Local overrides; same resolution as other ProtoWiki components. |
| `languagesLabel` | `string` | Optional `ArticleHeader` interlanguage label (default `18 languages`). |
| `languageLinks` | `ArticleLanguageLink[]` | Optional; defaults to `src/lib/articleLanguageLinks.ts`. |
| `languageSearchPlaceholder` | `string` | Filter field placeholder in the languages popover. |
| `tagline` | `string` | Optional header tagline (default *From Wikipedia, the free encyclopedia*). |
| `primaryTab` | `'article' \| 'talk'` | Tabs row state (prototype). |
| `viewTab` | `'read' \| 'edit' \| 'history'` | Actions row state (prototype). |

### Slots

| Slot | Notes |
| --- | --- |
| default | Forwarded to the active content component — replaces the `v-html` body when set (e.g. VisualEditor host). |
| `#heading` | Forwarded to the content child. With the composed `Article`, the automatic in-body `<h1>` is suppressed when the header is shown; use this only if you intentionally want a second title treatment in the body. |

## `ArticleHeader`

Vector-like **page** chrome above the parser output (not the site `ChromeHeader`).
Interlanguages use Codex **`CdxPopover`**: trigger (icon + label + caret), then a
**`CdxTextInput`** filter, scrollable list of progressive links, and a quiet
**settings** icon (`cdxIconSettings`) in the footer row. Demo rows live in `src/lib/articleLanguageLinks.ts` — pass **`languageLinks`**
to override.

Tabs/actions use `#` anchors with emits (`articleClick`, `readClick`, …). Emits
**`languageSelect`** when a language row is chosen (prototype) and
**`languageSettingsClick`** for the gear control.

| Prop | Default | Notes |
| --- | --- | --- |
| `title` | (required) | Large serif title. |
| `languagesLabel` | `18 languages` | Popover trigger label. |
| `languageLinks` | see `articleLanguageLinks.ts` | `{ label, href }[]` for the scrollable list. |
| `languageSearchPlaceholder` | `Search languages` | Filter field. |
| `tagline` | From Wikipedia… | |
| `primaryTab` | `article` | Which tab looks selected. |
| `viewTab` | `read` | Read / Edit / View history selection. |

## `ArticleLiveContent`

Parser column only: live fetch/snapshot, optional `<h1 class="mw-first-heading">`,
`.mw-parser-output` / default slot. Sets its own `data-skin` / `data-theme`
when used alone; when nested under `Article`, behaviour is unchanged.

| Prop | Notes |
| --- | --- |
| `hideTitle` | Suppresses the automatic H1 from `title` / `displayTitle` when `ArticleHeader` (or another parent) already shows the title. `#heading` slot still renders if provided. |
| (else) | `title`, `html`, `displayTitle`, `host`, `skin`, `theme`, `lang`, `dir`. |

## `ArticleMockContent`

Shipped demo parser column: loads **`public/snapshots/wet-leg.html`** with a module-level fetch cache, then renders **`ArticleLiveContent`** with `:html` and title **`Wet Leg`** (see `src/lib/mockWetLegArticle.ts`). Use via **`Article`** with `content-type="mock"` rather than importing directly, unless you need the parser column without `ArticleHeader`.

| Prop | Notes |
| --- | --- |
| `hideTitle` | Same as `ArticleLiveContent`. |
| `host`, `skin`, `theme`, `lang`, `dir` | Forwarded to `ArticleLiveContent` (e.g. section-edit links use `host`). |

## Styling notes

- **`ArticleHeader`** title uses **`--font-family-serif`**; tabs/actions use
  **`--font-family-base`**, progressive link colour, and subtle borders — not
  `mw-first-heading` (that class stays on the **content** first heading when
  `ArticleLiveContent` shows it).
- Article body inside **`.mw-parser-output`** still uses vendored Vector /
  Minerva CSS under `src/styles/wiki-content/`. See
  [`wiki-snapshot-data`](../../wiki-snapshot-data/SKILL.md).

## Tips

- Prefer **`<Article>`** in `ChromeWrapper` for read-mode demos; use
  **`ArticleLiveContent`** alone for embeds.
- If `html` is supplied **without** `displayTitle`, the header is hidden and
  `ArticleLiveContent` may show an in-body H1 when a title is available from the
  snapshot conventions you choose.
- REST / CORS: same etiquette as before — `origin=*`-friendly `/api/rest_v1/`.
