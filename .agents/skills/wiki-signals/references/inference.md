# Inference signals

Things you can derive from page metadata. All available via the Action
API (`action=query`).

## Watcher count

```
?action=query&prop=info&inprop=watchers&titles=Albert_Einstein&format=json&formatversion=2
```

Returns `pages[0].watchers` (integer). Note: small wikis hide watchers
when below a threshold (privacy). Treat missing values gracefully.

**What this says about an article:** how many editors care about it
day-to-day. A high count plus a recent edit = community attention.

## Revisions count and recent contributors

```
?action=query&prop=revisions&rvprop=timestamp|user|comment&rvlimit=20&titles=…
```

Each item is a revision with author and edit summary. Aggregate:

- Total revisions = "stability" indicator.
- Distinct authors over a period = breadth of contribution.
- Most recent timestamp = "edited X minutes ago".

For full history with paging, use `rvcontinue`.

## First revision (page age)

```
?action=query&prop=info&inprop=firstrevid&titles=…
```

Combine with a follow-up `rvprop=timestamp&revids=…` to get the page
creation date.

## Quality assessment

Most Wikipedias categorise articles by quality (Stub / Start / C / B /
Good / Featured). The classification appears as Talk-page categories:

```
?action=query&prop=categories&titles=Talk:Albert_Einstein
```

…and look for category names like `Category:GA-Class_articles` or
`Category:FA-Class_articles`. Different language wikis use different
schemes; the English Wikipedia uses ORES quality scores too:

```
https://ores.wikimedia.org/v3/scores/enwiki/?models=articlequality&revids=…
```

## Infobox structure

Infoboxes are rendered as `<table class="infobox">` in the article HTML.
Parse the HTML once and extract:

```ts
function parseInfobox(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const table = doc.querySelector('table.infobox')
  if (!table) return null
  const rows = Array.from(table.querySelectorAll('tr'))
  return rows.map((row) => ({
    label: row.querySelector('th')?.textContent?.trim() ?? '',
    value: row.querySelector('td')?.textContent?.trim() ?? '',
  })).filter((r) => r.label)
}
```

This gives you `{ label, value }` pairs you can compare across articles
(e.g., "all infoboxes that have a 'Born' field"). Useful for prototypes
that re-render the infobox in a different shape.

## Reference count

Count `<sup class="reference">` (or `.cite_ref-…`) inside the parser
output as a proxy for citation density.

## Lead extract

REST `/page/summary` gives you `extract` (plain text, ~250 chars) and
`extract_html` (sanitised HTML). Many UI ideas need only this.

## Sister project links

```
?action=query&prop=langlinks&titles=Albert_Einstein&lllimit=max
```

Returns interlanguage links (the long list down the left sidebar).

```
?action=query&prop=iwlinks&titles=Albert_Einstein
```

Inter-wiki links (Commons, Wiktionary, etc.).

## Page assessment beyond ORES

For language wikis without ORES, infer:

- "stub" = article HTML body shorter than ~1KB of plain text.
- "long" = > 50 KB plain text.
- "list" = title starts with "List of " or category includes "Lists of …".
