# Curation signals

Editors curate Wikipedia daily. These signals are great for any
prototype that wants a "main page" feel or "what's interesting today".

## Today's Featured Article (TFA), Picture of the Day, Most Read, On This Day

One endpoint gives all of these in a single call:

```
GET /api/rest_v1/feed/featured/{yyyy}/{mm}/{dd}
```

Response shape (truncated):

```json
{
  "tfa": { "type": "standard", "title": "…", "extract": "…", "thumbnail": { … } },
  "mostread": {
    "date": "…",
    "articles": [{ "title": "…", "views": 12345, "rank": 1, "thumbnail": { … } }, …]
  },
  "image": { "title": "…", "thumbnail": { "source": "…" }, "image": { "source": "…" }, "description": { "text": "…" } },
  "onthisday": [
    { "text": "…", "year": 1932, "pages": [{ "title": "…", "thumbnail": { … } }] },
    …
  ]
}
```

Today is `new Date()`'s YYYY/MM/DD. Tomorrow's TFA isn't published yet
(404 until ~midnight UTC).

## On This Day (deeper)

For richer "On This Day" data:

```
GET /api/rest_v1/feed/onthisday/{type}/{mm}/{dd}
```

`{type}` is one of:

- `selected` — curated highlights (matches the TFA "On This Day" block)
- `births`
- `deaths`
- `events`
- `holidays`

Each entry has `text`, `year`, and a `pages[]` array of articles linked
from that event.

## Did You Know?

Not currently exposed as a distinct endpoint. The DYK content lives in
the daily feed under TFA-related sections on some wikis or via a
template-rendered page. For now, fetch it via `parse`:

```
?action=parse&page=Template:Did_you_know/Queue/Next&format=json&prop=text&origin=*
```

…and parse the rendered HTML.

## Editor's picks: featured topics, good articles

```
?action=query&list=categorymembers&cmtitle=Category:Featured_articles&cmlimit=10
?action=query&list=categorymembers&cmtitle=Category:Good_articles&cmlimit=10
```

There are tens of thousands of featured / good articles — use as a sample
pool when you need realistic-quality articles.

## Wikidata signals (bonus)

For "show me other facts about this person/place/thing", reach into
Wikidata via SPARQL:

```
GET https://query.wikidata.org/sparql?query=…&format=json
```

This is its own surface and rate limit. Don't query SPARQL on every page
load; cache or snapshot.

## Pattern — Wikipedia main page mock

Combine `/feed/featured/{today}` with a few thumbnails from
`/page/summary` to assemble a credible main-page-style prototype with
realistic data, in roughly 50 lines of JS.
