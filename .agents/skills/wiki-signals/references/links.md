# Link signals

Wikipedia is a graph. The link signals are how you traverse it.

## Outgoing links

Pages this page links to.

```
?action=query&prop=links&titles=Albert_Einstein&pllimit=max&plnamespace=0&format=json&formatversion=2
```

Filtered to namespace 0 (articles) since you usually don't want
Talk: / File: / Wikipedia: namespaces in the count.

## Incoming links (backlinks)

Pages that link to this page.

```
?action=query&list=backlinks&bltitle=Albert_Einstein&bllimit=max&blnamespace=0&format=json&formatversion=2
```

Use `blfilterredir=nonredirects` to exclude redirect pages from the
count.

## Redirects to a page

```
?action=query&list=backlinks&bltitle=Albert_Einstein&blfilterredir=redirects&bllimit=max
```

Or, in the other direction — a page's outgoing redirects:

```
?action=query&prop=redirects&titles=…
```

## Related articles

REST endpoint, returns 4 curated cards (model-driven):

```
GET /api/rest_v1/page/related/{title}
```

Each card has title, summary, thumbnail. Used in the "Read more" section
on mobile.

## Categories

Categories the page belongs to:

```
?action=query&prop=categories&titles=Albert_Einstein&cllimit=max
```

Pages within a category:

```
?action=query&list=categorymembers&cmtitle=Category:German_physicists&cmlimit=max
```

Recursive category traversal isn't a single API call — paginate, then
for each subcategory recurse with care (categories can loop).

## Interwiki and interlanguage

```
?action=query&prop=langlinks&titles=Albert_Einstein&lllimit=max
?action=query&prop=iwlinks&titles=Albert_Einstein&iwlimit=max
```

`langlinks` returns the article in other languages
(`{ lang: 'de', title: 'Albert Einstein' }`). Combine with the REST
summary endpoint on each lang's host for a multilingual carousel.

## External links

```
?action=query&prop=extlinks&titles=…&ellimit=max
```

The `<ref>` URLs and infobox external links (websites of subjects, etc.).

## Disambiguation

A page is a disambiguation page if it has the `disambiguation` property:

```
?action=query&prop=pageprops&titles=Mercury&ppprop=disambiguation
```

For prototypes around "did you mean?" UX.

## Pattern — random sibling

Pick a random article in the same category as a given article (useful
for "explore similar"):

```ts
const cats = (await fetch(`?action=query&prop=categories&titles=${title}`)).json()
const cat = cats.query.pages[0].categories[0].title
const members = (await fetch(`?action=query&list=categorymembers&cmtitle=${cat}&cmlimit=50`)).json()
const random = members.query.categorymembers[Math.floor(Math.random() * 50)]
```
