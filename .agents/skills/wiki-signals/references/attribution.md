# Attribution signals

Structured **attribution signals** for a wiki page — license, brand
marks, source-wiki metadata — exposed by the Wikimedia
[Attribution API](https://www.mediawiki.org/wiki/Attribution_API).
Designed for *off-wiki* surfaces (assistants, embeds, third-party UIs)
that need to credit Wikimedia content correctly without re-deriving
the rules from the article HTML.

This is a **beta** module: response shape and field semantics may
change before a stable v1.

## Why this matters in prototypes

Any time a prototype shows article content *somewhere other than the
article page itself* — a chat answer, a card, a smart speaker reply, a
panel embedded in another product — it inherits an attribution
obligation under the
[Wikimedia attribution framework](https://iw.toolforge.org/wikimedia-attribution).
The Attribution API gives you the right strings to render in one
fetch.

## Endpoint

```
GET https://{wiki}/w/rest.php/attribution/v0-beta/pages/{title}/signals
```

Path parameters:

- `{wiki}` — project host (e.g. `en.wikipedia.org`)
- `{title}` — page title; URL-encode spaces and special characters
  (e.g. `Earth`, `Albert%20Einstein`)

The route is available on Wikimedia Foundation wikis. **Wikipedia
articles** and **media via Commons / local Wikipedia** are fully
supported; other page types may return incomplete data.

## Example

### Request

```bash
curl -sS "https://en.wikipedia.org/w/rest.php/attribution/v0-beta/pages/Earth/signals" \
  -H "User-Agent: <your tool name> (<contact: URL or email>)"
```

### Response (truncated)

```json
{
  "essential": {
    "title": "Earth",
    "license": {
      "url": "https://creativecommons.org/licenses/by-sa/4.0/deed.en",
      "title": "Creative Commons Attribution-Share Alike 4.0"
    },
    "link": "https://en.wikipedia.org/wiki/Earth",
    "default_brand_marks": [
      {
        "name": "Default logo",
        "url": "https://en.wikipedia.org/static/images/project-logos/enwiki-25.png",
        "type": "logo"
      },
      {
        "name": "Site icon",
        "url": "https://en.wikipedia.org/static/images/icons/enwiki-25.svg",
        "type": "icon"
      },
      {
        "name": "Sound logo",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Wikimedia_Sonic_Logo_-_4-seconds.wav",
        "type": "audio"
      }
    ],
    "source_wiki": {
      "site_id": "enwiki",
      "site_language": "en",
      "page_language": "en"
    }
  },
  "source_wiki": {
    "site_name": "English Wikipedia",
    "project_family": "wikipedia"
  }
}
```

The beta module may add or adjust top-level keys and nested objects;
treat anything not in `essential` as best-effort.

## What you get vs. what you'd otherwise scrape

| Need | Without this API | With this API |
| --- | --- | --- |
| License name + URL | Hard-code, drift over time | `essential.license` |
| Canonical link to the source page | Build manually from title | `essential.link` |
| Project logo / icon / sonic logo | Look up per project | `essential.default_brand_marks[]` |
| "English Wikipedia" friendly site name | Map site id by hand | `source_wiki.site_name` |
| Page language vs. site language | Two extra calls | `essential.source_wiki.{page_language, site_language}` |

## Availability and rate limits

- Available on the
  [Wikimedia production wikis where the Attribution module is deployed](https://www.mediawiki.org/wiki/Attribution_API#Supported_project_and_content_types).
  **Not** available on generic third-party MediaWiki sites.
- See
  [Wikimedia APIs / Rate limits](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits)
  and [API:Etiquette](https://www.mediawiki.org/wiki/API:Etiquette).
- Send a descriptive `User-Agent` header — see
  [`wiki-apis/references/etiquette.md`](../../wiki-apis/references/etiquette.md).

## Documentation

- [Attribution API](https://www.mediawiki.org/wiki/Attribution_API)
- [REST sandbox (`attribution.v0-beta`)](https://www.mediawiki.org/w/index.php?title=Special:RestSandbox&api=attribution.v0-beta)
- [Wikimedia attribution framework](https://iw.toolforge.org/wikimedia-attribution)
- [Wikimedia APIs: access policy](https://www.mediawiki.org/wiki/Wikimedia_APIs/Access_policy)
- Announcement: [wikitech-l — Attribution API (Beta) launch](https://lists.wikimedia.org/hyperkitty/list/wikitech-l@lists.wikimedia.org/thread/X46T5M3DZWV5WC3VOISSTGPYWUAVUYGQ/)
