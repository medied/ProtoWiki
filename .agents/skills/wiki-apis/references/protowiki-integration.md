# ProtoWiki integration

How the agnostic API guidance in [`wiki-apis`](../SKILL.md) lands inside
the ProtoWiki repo specifically — which components already wrap which
endpoints, and how to refresh the committed schema snapshots.

## Components that already hit the API

| Component | API | Notes |
| --- | --- | --- |
| `Article` / `ArticleContent` | REST `/page/html/{title}` | `Article` composes `ArticleContent`. Defaults to `en.wikipedia.org`; `host` prop switches wiki. Optional `lang` / `dir`. |
| `SearchBar` | Action `?action=opensearch` | Debounced + `AbortController`-cancelled. Defaults to `en.wikipedia.org`; takes a `host` prop. |

If you find yourself reaching for `fetch` directly to one of these
endpoints, use the component instead — they already do the etiquette
work (UA, cancellation, error handling).

## User-Agent

When a request originates server-side (snapshotter scripts, scheduled
jobs), use:

```
ProtoWiki/0.1 (https://github.com/<org>/protowiki; <contact-email-or-tag>)
```

In-browser, the browser sets its own UA — you don't need to override it.

## Editor stand-ins and `action=edit`

ProtoWiki's local stand-in editors emit a `publish` event instead of
calling `?action=edit` against a real wiki. The principle is: a
prototype demonstrates the publish *flow*, not the publish *side
effect*. Only swap that out for a real edit when the prototype's whole
point is server-side behaviour. See
[`protowiki-components`](../../protowiki-components/SKILL.md) for the
event payload and
[`visual-editor-prototyping`](../../visual-editor-prototyping/SKILL.md)
for the broader rationale.

## Refreshing committed API schema snapshots

ProtoWiki ships a snapshotter at
`.agents/skills/wiki-apis/assets/fetch_schemas.sh` that writes **four**
REST OpenAPI specs (one per major deployment / host) plus the Action API
`paraminfo` for the modules ProtoWiki cares about into
`.agents/skills/wiki-apis/assets/snapshots/`.

```bash
bash .agents/skills/wiki-apis/assets/fetch_schemas.sh
ls .agents/skills/wiki-apis/assets/snapshots/
# rest-api-spec.wikipedia.json   rest-api-spec.wikimedia-org.json
# rest-api-spec.commons.json     rest-api-spec.wikidata.json
# action-api-paraminfo.json
```

See [`references/schemas.md`](schemas.md) for the layout and `jq`
recipes to navigate the files. The script is portable on its own — if
you copy this skill to another repo, the script keeps working there
too; only the snapshot paths change.

## See also

- [`wiki-apis`](../SKILL.md) — the agnostic API guidance.
- [`protowiki-components`](../../protowiki-components/SKILL.md) — for
  what `Article`, `ArticleContent`, and `SearchBar` actually expose.
- [`wiki-snapshot-data`](../../wiki-snapshot-data/SKILL.md) — when not
  to fetch live at all.
