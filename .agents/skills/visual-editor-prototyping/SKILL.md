---
name: visual-editor-prototyping
description: Umbrella for prototyping Wikipedia editor (VisualEditor / wikitext) UIs — a decision matrix between local stand-in editors, edit-suggestion overlays, and vendoring the real upstream VisualEditor bundle. Use when prototyping an edit experience, picking a fidelity level, or asking "should I use a local stand-in or real VE?".
license: MIT
---

# Visual Editor prototyping

Wikipedia's editor surface is the area with the highest cost of getting
the design wrong (people are mid-edit, with unsaved work, with
keyboard expectations, with strong muscle memory). It's also the area
with the most "should we add this?" questions.

This skill is the umbrella. It picks between three approaches:

1. **Local VE stand-ins** — a lightweight `contenteditable`-based
   editor with a Codex toolbar, sufficient for prototyping flow and
   chrome around an editor.
2. **Edit-suggestion overlays** — fakewiki-style mocking of an "Edit
   Check"-like data layer on top of a stand-in. Use when the work is
   about *coaching the edit* (citation suggestions, tone warnings,
   etc.).
3. **Real upstream VisualEditor** — vendor and load the genuine VE
   bundle. Use only when the editing surface itself is the subject.

## Decision matrix

| Work is about | Recommended | Skill |
| --- | --- | --- |
| Header / footer / chrome around an editor | Local stand-in | — |
| Save / publish flow | Local stand-in (with diff if available) | — |
| "Edit suggestions" / Edit Check coaching — simulating the stream | Mocked JSON / rule-based generator / Lift Wing | [`wiki-signals` → `suggestions.md`](../wiki-signals/references/suggestions.md) |
| "Edit suggestions" / Edit Check coaching — rendering inside the editor | Stand-in + suggestion panel | — |
| Diff / review UI (post-edit) | Stand-in with word-level diff | — |
| Source mode toggle / wikitext inspection | Stand-in with source mode | — |
| The editor toolbar layout itself | Real VE | [`visual-editor-vendoring`](../visual-editor-vendoring/SKILL.md) |
| Full inline node-tree editing (transclusions, references, templates) | Real VE | [`visual-editor-vendoring`](../visual-editor-vendoring/SKILL.md) |
| MediaWiki-server-side validation | Real VE + a real wiki | (out of scope) |
| Multi-user real-time editing | Real VE + custom backend | (out of scope) |

[`references/decision-matrix.md`](references/decision-matrix.md) goes
deeper.

## Approach 1 — local stand-ins

A lightweight stand-in is typically two `contenteditable` views (rich
mode + optional source mode) with a Codex toolbar. Cheap to ship, no
external bundle, renders correctly in dark mode and RTL via the
standard Codex theming.

Either one replaces the article body when the page enters edit mode:

```vue
<ChromeWrapper>
  <Article v-if="editing">
    <ArticleEditor
      :title="title"
      :html="html"
      @publish="onPublish"
      @cancel="editing = false"
    />
  </Article>
  <Article v-else :title="title" />
</ChromeWrapper>
```

The cost is illustrative-only fidelity (no node-context inspector, no
template editor, no real wikitext output). Enough for any flow or
chrome question.

## Approach 2 — edit-suggestion overlays

When the work demonstrates "the editor noticed something about your
edit and is suggesting X", you need a *suggestion stream* on top of
the basic editor. fakewiki ships an example; we replicate the shape.

The work splits cleanly along two axes — and so do the references:

- **Simulating the stream** (which check types exist, fixture vs.
  rule-based vs. Lift Wing inference, where the JSON lives) →
  [`wiki-signals` → `suggestions.md`](../wiki-signals/references/suggestions.md).
- **Storing and rendering it** inside the editor — payload shape,
  side-by-side layout, "apply" semantics — is your consuming
  environment's concern.

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

If you're not sure, start with the local stand-in. You can always graduate
to real VE later if the work demands it. Reverse is harder.

## Inside ProtoWiki

ProtoWiki ships two stand-in editors at `src/components/`:

- **`ArticleEditor`** — Barbara-style: toolbar (Bold / Italic /
  Headings / Cite / Link / Edit-options dropdown), `contenteditable`
  surface, undo, change detection, mock publish.
- **`ArticleEditorPlus`** — same, plus source mode, autosave to
  `localStorage`, word-diff publish preview.

Either replaces `Article` when the page enters edit mode (the
example above is real ProtoWiki code). For the per-component reference
see [`protowiki-components`](../protowiki-components/SKILL.md) and its
`references/editors.md`.

If you build a suggestion-overlay prototype, drop it under
`src/prototypes/<your-name>/` and it'll auto-route via
`unplugin-vue-router`. The consumer-side payload shape and rendering
contract live in
[`protowiki-components/references/edit-suggestions.md`](../protowiki-components/references/edit-suggestions.md);
the simulation side (where the JSON comes from, what fields exist)
lives in
[`wiki-signals/references/suggestions.md`](../wiki-signals/references/suggestions.md).
