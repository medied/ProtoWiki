---
name: visual-editor-prototyping
description: Umbrella for prototyping Wikipedia editor (VisualEditor / wikitext) UIs — a decision matrix between forked upstream demos (Bárbara Martínez Calvo’s article template + suggestion-mode repos), edit-suggestion overlays, and vendoring the real upstream VisualEditor bundle. Use when prototyping an edit experience, picking a fidelity level, or asking "should I clone an upstream demo or vendor real VE?".
license: MIT
---

# Visual Editor prototyping

Wikipedia's editor surface is the area with the highest cost of getting
the design wrong (people are mid-edit, with unsaved work, with
keyboard expectations, with strong muscle memory). It's also the area
with the most "should we add this?" questions.

This skill is the umbrella. It picks between three approaches:

1. **Fork proven edit UX** — clone **[Bárbara Martínez Calvo](https://github.com/bmartinezcalvo)**’s **[wikipedia-article-template](https://github.com/bmartinezcalvo/wikipedia-article-template)** (`WikipediaPage.vue` edit mode, Vector vs Minerva toolbars) and/or **[suggestion-mode](https://github.com/bmartinezcalvo/suggestion-mode)** (**[hosted demo](https://bmartinezcalvo.github.io/suggestion-mode/)**). Iterate there for toolbar layout and coaching flows; optionally lift pieces into ProtoWiki prototypes later.
2. **Edit-suggestion overlays** — fakewiki-style mocking of an "Edit
   Check"-like data layer on top of **your** editing surface. Use when the work is
   about *coaching the edit* (citation suggestions, tone warnings,
   etc.).
3. **Real upstream VisualEditor** — vendor and load the genuine VE
   bundle. Use only when the editing surface itself is the subject.

## Decision matrix

| Work is about | Recommended | Skill |
| --- | --- | --- |
| Header / footer / chrome around an editor | Fork article template + compose with ProtoWiki wrappers | [`references/editors.md`](../protowiki-components/references/editors.md) |
| Toolbar layout matching published demos | **`wikipedia-article-template`** / **`suggestion-mode`** repos | [`references/editors.md`](../protowiki-components/references/editors.md) |
| Save / publish flow | Your fork or minimal `contenteditable` + mock publish | — |
| "Edit suggestions" / Edit Check coaching — simulating the stream | Mocked JSON / rule-based generator / Lift Wing | [`wiki-signals` → `suggestions.md`](../wiki-signals/references/suggestions.md) |
| "Edit suggestions" / Edit Check coaching — rendering beside the editor | Your surface + suggestion panel | [`protowiki-components` → `edit-suggestions.md`](../protowiki-components/references/edit-suggestions.md) |
| Diff / review UI (post-edit) | Custom dialog around publish handler, or composable diff | — |
| Source mode toggle / wikitext inspection | Layer a textarea toggle around HTML state, or custom prototype | — |
| Full inline node-tree editing (transclusions, references, templates) | Real VE | [`visual-editor-vendoring`](../visual-editor-vendoring/SKILL.md) |
| MediaWiki-server-side validation | Real VE + a real wiki | (out of scope) |
| Multi-user real-time editing | Real VE + custom backend | (out of scope) |

[`references/decision-matrix.md`](references/decision-matrix.md) goes
deeper.

## Approach 1 — fork article template + suggestion mode

ProtoWiki intentionally does **not** ship `ArticleEditor`. For realistic edit chrome and suggestion-mode flows, **clone and prototype in**:

| Repo | Role |
| --- | --- |
| [`bmartinezcalvo/wikipedia-article-template`](https://github.com/bmartinezcalvo/wikipedia-article-template) | Edit mode + Vector / Minerva toolbars |
| [`bmartinezcalvo/suggestion-mode`](https://github.com/bmartinezcalvo/suggestion-mode) | **[Demo](https://bmartinezcalvo.github.io/suggestion-mode/)** — suggestion-mode UX |

Bring extracted markup or behaviour into `src/prototypes/<your-name>/` when you combine it with ProtoWiki chrome (`ChromeWrapper`, Codex).

Either pattern replaces or sits beside the article body when the page enters edit mode:

```vue
<ChromeWrapper>
  <Article v-if="!editing" title="Albert Einstein" />
  <!-- Surface from forked template, or minimal contenteditable prototype -->
  <MyEditSurface v-else v-model="html" @publish="onPublish" @cancel="editing = false" />
</ChromeWrapper>
```

The cost of rolling your own here is illustrative-only fidelity (no node-context inspector, no real wikitext output) unless you vendor VE — enough for flow and chrome questions.

## Approach 2 — edit-suggestion overlays

When the work demonstrates "the editor noticed something about your
edit and is suggesting X", you need a *suggestion stream* on top of
the basic editor.

The work splits cleanly along two axes — and so do the references:

- **Simulating the stream** (which check types exist, fixture vs.
  rule-based vs. Lift Wing inference, where the JSON lives) →
  [`wiki-signals` → `suggestions.md`](../wiki-signals/references/suggestions.md).
- **Storing and rendering it** beside **your** editor — payload shape,
  side-by-side layout, "apply" semantics — see
  [`protowiki-components` → `edit-suggestions.md`](../protowiki-components/references/edit-suggestions.md).

## Approach 3 — real upstream VisualEditor

The real thing. Vendor the upstream bundle, load it on demand, and
attach to a target element. Significantly heavier (multiple MBs of JS)
and operationally more complex (bundle drift, lifecycle handshake). Only
worth it when the editor surface itself is the subject.

The deep-dive lives in
[`visual-editor-vendoring`](../visual-editor-vendoring/SKILL.md) and
covers the snapshot script, the loader, and the
`whenVeReady()` / `whenVePlatformReady()` lifecycle.

## Ground rules

Regardless of which approach:

- **Never `action=edit` against a real wiki** from a prototype. Mock
  the publish — emit an event, log, show a toast.
- **Never persist a draft to a real user account.** If you need
  persistence, use `localStorage` (per-title key).
- **Always show "you have unsaved changes"** before navigation away.
- **Always demonstrate at least one edge case** — empty title, very
  long title, RTL language, citation already present, etc.

## Picking quickly

Start from **Bárbara’s repos** when edit chrome fidelity matters. You can always graduate
to real VE later if the work demands it. Reverse is harder.

## Inside ProtoWiki

- **No shipped `ArticleEditor`** — see [`references/editors.md`](../protowiki-components/references/editors.md) for the external references.
- **Suggestion overlays** — consumer contract in [`protowiki-components/references/edit-suggestions.md`](../protowiki-components/references/edit-suggestions.md); simulation in [`wiki-signals/references/suggestions.md`](../wiki-signals/references/suggestions.md).
- **Real VE in this repo** — [`protowiki-ve-vendoring`](../protowiki-ve-vendoring/SKILL.md) when you vendor the upstream bundle under `public/visualeditor/`.

Drop combined experiments under `src/prototypes/<your-name>/`; routes are file-based (`unplugin-vue-router`).
