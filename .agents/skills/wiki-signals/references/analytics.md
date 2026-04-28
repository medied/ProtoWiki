# Analytics signals

The Wikimedia metrics API is at `https://wikimedia.org/api/rest_v1/`.
Different host from the per-wiki REST API.

Canonical docs: <https://wikimedia.org/api/rest_v1/>

## Pageviews — single article

```
GET /metrics/pageviews/per-article/{project}/{access}/{agent}/{article}/{granularity}/{start}/{end}
```

Example:

```
https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/Albert_Einstein/daily/2024010100/2024013100
```

Parameters:

- `{project}` — `en.wikipedia`, `de.wikipedia`, `commons.wikimedia`, …
- `{access}` — `all-access` / `desktop` / `mobile-app` / `mobile-web`
- `{agent}` — `all-agents` / `user` / `spider` / `automated`
- `{article}` — URL-encoded title with underscores
- `{granularity}` — `daily` / `monthly`
- `{start}`, `{end}` — `YYYYMMDDHH` (hour at 00 unless monthly)

Returns an array of `{ timestamp, views }`.

## Pageviews — aggregate

For a whole project, no specific article:

```
/metrics/pageviews/aggregate/{project}/{access}/{agent}/{granularity}/{start}/{end}
```

## Top articles

```
/metrics/pageviews/top/{project}/{access}/{year}/{month}/{day}
```

`{day}` can be `all-days` for monthly tops.

Returns the top 1000 articles by pageviews for that day/month. Useful for:

- "Most-read this week" panels.
- Sampling articles for a prototype that needs realistic, popular pages.

## Edits per page

```
/metrics/edits/per-page/{project}/{page-title}/{editor-type}/{granularity}/{start}/{end}
```

`{editor-type}` — `all-editor-types` / `user` / `anonymous` / `name-bot` / `group-bot`.

## Editors per project

```
/metrics/editors/aggregate/{project}/{editor-type}/{page-type}/{activity-level}/{granularity}/{start}/{end}
```

For "is this language wiki growing or shrinking?" prototypes.

## Bytes added / removed

```
/metrics/bytes-difference/net/per-page/{project}/{page-title}/{editor-type}/{granularity}/{start}/{end}
/metrics/bytes-difference/absolute/per-page/{project}/{page-title}/{editor-type}/{granularity}/{start}/{end}
```

## Featured rank in past week

The `/feed/featured/{date}` endpoint includes a `mostread` block —
articles with their views and rank for that date.

## Caveats

- Pageviews are reported with a ~24h lag (today's number isn't ready
  until tomorrow).
- Rounding: views are reported in thousands for very high counts in some
  endpoints; see the spec.
- Long article titles must be encoded with `encodeURIComponent`.
- Don't fetch the full year of daily pageviews for an article on every
  page render — cache or snapshot.
