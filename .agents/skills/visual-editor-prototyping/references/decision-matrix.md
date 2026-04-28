# Decision matrix

A long-form expansion of the matrix in the SKILL body.

## Local stand-ins

**Strengths**

- Clone **[wikipedia-article-template](https://github.com/bmartinezcalvo/wikipedia-article-template)** and/or **[suggestion-mode](https://github.com/bmartinezcalvo/suggestion-mode)** first when you need toolbar chrome that matches published demos; iterate there, then lift pieces into ProtoWiki.
- Zero or near-zero cost for a scratch prototype — typically a `contenteditable` surface with
  Codex controls.
- Renders instantly; no separate VE bundle download.
- Works offline.
- Renders correctly in dark mode and RTL via the standard Codex theming.
- A "plus" variant can add autosave drafts and a publish-time word
  diff cheaply.
- Mockable publish flow — emit `publish` and intercept.

**Weaknesses**

- The toolbar is illustrative, not a real VE toolbar (no node-context
  inspector, no template editor, no reference dialog).
- `contenteditable` cursor / selection behaviour is browser-default,
  not VE's. Power-users won't find Ctrl+K (Link) etc. wired up.
- No undo *stack* — only the browser's `document.execCommand('undo')`.
- Wikitext output is naive (a typical source mode shows the raw HTML,
  not proper wikitext).

**Use when** the work is about: chrome, flow, save/publish, simple
editing, A/B comparing edit affordances.

## Edit-suggestion overlays (stand-in + suggestion stream)

**Strengths**

- Lets you demonstrate Edit Check-style UX without owning the upstream
  VE plumbing.
- The suggestion data is yours to shape — easy to demo any rule.
- Pairs well with a "plus"-style stand-in for full diff + suggestion
  flow.

**Weaknesses**

- Suggestions don't actually come from the live VE. If your stakeholder
  asks "where do these come from?", be ready to answer "from a static
  fixture for now".
- The mock can drift from real Edit Check behaviour over time.

**Use when** the work is about: coaching edits, demonstrating
guidance UX, showing how a suggestion lands and is accepted/dismissed.

## Real upstream VE

**Strengths**

- True fidelity — toolbar, dialogs, node-tree, references, transclusions
  all work.
- Same code that's running on Wikipedia. Stakeholders recognize it
  instantly.

**Weaknesses**

- Multi-MB bundle download.
- Initialization is slow (~1–2s).
- Requires a target element with the right class scaffolding.
- Bundle drift — the upstream VE updates fast; you'll need to re-vendor
  every few months.
- Doesn't connect to a real wiki without further plumbing — you still
  need to mock the saver and the parsoid round-trip.

**Use when** the work is about: the toolbar layout itself, a node
type that VE renders specially (templates, references), or anywhere a
stakeholder asks "is this the actual editor?".

## What about MediaWiki's source-mode editor (CodeMirror, wikitext)?

Out of scope for the lightweight stand-in approach. A typical "plus"
stand-in's source mode is a textarea. If you genuinely need wikitext
editing fidelity, vendor the
[`@wikimedia/codemirror-extensions-ext-wikieditor`](https://www.npmjs.com/search?q=wikieditor)
package separately and wire it up; it's substantially smaller than the
full VE bundle.

## Cost summary

| Approach | Bundle size | Setup time | Fidelity | When |
| --- | --- | --- | --- | --- |
| Local stand-in | 0 (fork / scratch; not a ProtoWiki component) | 0 min | Low–medium | Default |
| Stand-in + suggestions | ~1KB JSON | ~1h to wire | Medium | Edit Check UX |
| Real VE | Multiple MB | ~1d | High | Editor itself is the subject |
