# Editors — `ArticleEditor` and `ArticleEditorPlus`

Two **stand-in** editors for prototyping Wikipedia editing UI. Both are
built on `contenteditable` + Codex toolbar buttons. They are not a real
VisualEditor: for true VE fidelity see
[`visual-editor-vendoring`](../../visual-editor-vendoring/SKILL.md).

## Which one to pick

| Want… | Use |
| --- | --- |
| The simplest possible inline edit experience for a design review | `ArticleEditor` |
| An edit experience that survives a page reload (autosave) | `ArticleEditorPlus` |
| A "Review your changes" diff before publish | `ArticleEditorPlus` |
| To toggle between visual and source modes | `ArticleEditorPlus` |
| The smallest bundle | `ArticleEditor` |

Both share the same prop / event surface area for the basic "edit some
HTML and publish" flow, so swapping one for the other is a one-character
change.

## Common API

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | HTML content (without the H1); `v-model`-compatible |
| `title` | `string` | `undefined` | Plain-text reader `<h1>` (`mw-first-heading`); use **`#heading`** slot for rich markup inside that `<h1>` |
| `placeholder` | `string` | `'Start writing...'` | Shown when the editor is empty |
| `skin` | `'desktop' \| 'mobile'` | `undefined` | |
| `theme` | `'light' \| 'dark'` | `undefined` | |

### Slots

| Slot | Notes |
| --- | --- |
| `#heading` | Replaces inner content of the reader `<h1>` (`mw-first-heading`) — use instead of plain `title` when you need links or markup |

`lang` / `dir` are inherited from the surrounding wrapper.

### Events

| Event | Payload | Fired when |
| --- | --- | --- |
| `update:modelValue` | `string` (HTML) | The user types / clicks a toolbar action |
| `publish` | `{ html, title? }` | The user confirms publish |
| `cancel` | — | The user clicks Cancel and confirms discard |

### Toolbar

Both have:

- Bold (`Ctrl/Cmd+B` via `document.execCommand('bold')`)
- Italic
- Heading (basic: cycles h2/h3/p in `Plus`; menu in `ArticleEditor`)
- Cite (inserts a `<sup class="reference">[citation]</sup>` placeholder)
- Link (prompts for URL via `window.prompt`)
- Undo

## ArticleEditor — extra notes

- Lightweight, single-file, ~200 LoC. Lifted in spirit from the article
  template's edit mode (Bárbara Martínez Calvo's
  `wikipedia-article-template`).
- Uses `document.execCommand` directly. It's officially deprecated but
  still ships in every browser and is the lightest path to a usable
  rich-text prototype.
- `beforeunload` warns the user about unsaved changes.
- No localStorage, no diff preview. If you want those, switch to
  `ArticleEditorPlus`.

## ArticleEditorPlus — extra features

- **Autosave to localStorage** — debounced (`autosaveMs` prop, default
  1500 ms). Key is `${storagePrefix}:${title}` (default prefix is
  `'protowiki:editor'`). On mount, if a draft is found that doesn't match
  the current `modelValue`, a banner appears offering "Restore draft" /
  "Discard".
- **Source-mode toggle** — switches the contenteditable surface for a
  monospaced `<textarea>` containing the raw HTML. Toggling back applies
  the textarea content.
- **Word-level diff preview before publish** — clicking Publish opens a
  `CdxDialog` containing a `diff-match-patch` word-level diff between the
  saved version and the current draft. The user confirms in the dialog.
- **Restore event** — `@restore` fires when the user accepts a draft from
  storage.

### Extra props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `autosaveMs` | `number` | `1500` | Debounce window for draft saves |
| `storagePrefix` | `string` | `'protowiki:editor'` | localStorage namespace |

### Extra events

| Event | Payload | Fired when |
| --- | --- | --- |
| `restore` | `{ html, title? }` | The user accepts the draft restore prompt |

## Examples

### Minimal inline edit

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ArticleEditor from '@/components/ArticleEditor.vue'

const html = ref('<p>Initial body text.</p>')

function onPublish(payload: { html: string; title?: string }) {
  console.log('Publish payload:', payload)
}
</script>

<template>
  <ArticleEditor
    v-model="html"
    title="My draft"
    @publish="onPublish"
  />
</template>
```

### Edit-suggestion flow with autosave + diff

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ArticleEditorPlus from '@/components/ArticleEditorPlus.vue'

const html = ref('<p>Starter content from a fake suggestion.</p>')

function onPublish({ html, title }: { html: string; title?: string }) {
  // submit to fake backend, navigate, etc.
}
</script>

<template>
  <ArticleEditorPlus
    v-model="html"
    title="Suggested edit: Felicette"
    @publish="onPublish"
  />
</template>
```

For an Edit Check-style suggestion *stream* alongside the editor —
side-by-side layout, `SuggestionCard`, publish-time interception,
"apply" semantics — see
[`edit-suggestions.md`](edit-suggestions.md). For *where the
suggestions come from* see
[`wiki-signals` → `suggestions.md`](../../wiki-signals/references/suggestions.md).

## When to graduate to real VE

If your prototype hinges on real wiki templates, citations, link insertion
flows, or the upstream edit-check experience, the stand-ins won't carry
you. See
[`visual-editor-prototyping`](../../visual-editor-prototyping/SKILL.md)
for the decision matrix and
[`visual-editor-vendoring`](../../visual-editor-vendoring/SKILL.md)
for the upstream-bundle vendoring approach.
