<script setup lang="ts">
import { computed, inject, nextTick, ref, useSlots, watch } from 'vue'
import { CdxMessage, CdxProgressBar } from '@wikimedia/codex'

import {
  globalSkin,
  globalTheme,
  PROTOWIKI_CHROME_SKIN,
  PROTOWIKI_CHROME_THEME,
} from '@/lib/theming'
import type { Skin, Theme } from '@/lib/theming'
import { mobileH2ChevronSvg, mobileH2EditIconSvg } from '@/lib/mobileH2CodexIcons'

/** Cache of successfully fetched live article HTML (key: host + title). */
type CachedArticleBody = { html: string; liveTitle: string }
const articleBodyCache = new Map<string, CachedArticleBody>()
const inFlightFetches = new Map<string, Promise<CachedArticleBody>>()

/**
 * Backing store that survives full-page reloads, browser restarts, and
 * Vite HMR replacing this module. Persisted via `localStorage` so the
 * cache lives across tabs and sessions.
 */
const STORAGE_PREFIX = 'protowiki:articleBody:v1:'

function getLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

function loadFromStorage(key: string): CachedArticleBody | null {
  const store = getLocalStorage()
  if (!store) return null
  try {
    const raw = store.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw) as CachedArticleBody
  } catch {
    return null
  }
}

function saveToStorage(key: string, body: CachedArticleBody) {
  const store = getLocalStorage()
  if (!store) return
  try {
    store.setItem(STORAGE_PREFIX + key, JSON.stringify(body))
  } catch {
    // Most likely a QuotaExceededError. The in-memory cache still works.
  }
}

/** Normalize so `Foo` / `Foo_Bar` / `Foo Bar` share one cache entry. */
function normalizeTitleForCache(title: string) {
  return title.trim().replace(/_/g, ' ').replace(/\s+/g, ' ')
}

/**
 * Single REST endpoint for both desktop (Vector) and mobile-web (Minerva):
 * `page/html/{title}` returns Parsoid HTML — the same HTML the live wiki
 * serves on both en.wikipedia.org and en.m.wikipedia.org. Skin is purely a
 * CSS concern (`[data-skin='desktop' | 'mobile']`).
 *
 * The `page/mobile-html/{title}` endpoint exists but is for the iOS / Android
 * apps (Page Content Service wrappers + bundled scripts). Don't use it for
 * web prototypes.
 */
function articleCacheKey(host: string, title: string) {
  return `${host}\0${normalizeTitleForCache(title)}`
}

const LOG_PREFIX = '[ProtoWiki][ArticleContent]'

interface Props {
  /**
   * When true, suppresses the automatic `<h1>` from `title` / `displayTitle`
   * (e.g. when `ArticleHeader` shows the page title). The `#heading` slot
   * still renders when provided.
   */
  hideTitle?: boolean
  /**
   * BCP-47 language tag for this subtree. Sets `lang` on the root.
   * Usually inherit from the parent `<article>` in `Article.vue`.
   */
  lang?: string
  /**
   * Writing direction. Sets `dir` on the root.
   */
  dir?: 'ltr' | 'rtl'
  /**
   * Page title to fetch live from the Wikipedia REST API.
   * Mutually exclusive with `html`.
   */
  title?: string
  /**
   * Pre-baked `.mw-parser-output` HTML. Mutually exclusive with `title`.
   */
  html?: string
  /**
   * Explicit H1 text above the parser output. Defaults to `title`
   * when fetching live; ignored when using live `title` for the REST label.
   */
  displayTitle?: string
  /**
   * Wiki host for live fetches (no protocol). Defaults to en.wikipedia.org.
   */
  host?: string
  /** Local skin override. Sets `data-skin` on the root. */
  skin?: Skin
  /** Local theme override. Sets `data-theme` on the root. */
  theme?: Theme
}

const props = withDefaults(defineProps<Props>(), {
  hideTitle: false,
  lang: undefined,
  dir: undefined,
  title: undefined,
  html: undefined,
  displayTitle: undefined,
  host: 'en.wikipedia.org',
  skin: undefined,
  theme: undefined,
})

const inheritedSkin = inject(PROTOWIKI_CHROME_SKIN)
const inheritedTheme = inject(PROTOWIKI_CHROME_THEME)

const effectiveSkin = computed<Skin>(
  () => props.skin ?? inheritedSkin?.value ?? globalSkin.value,
)
const effectiveTheme = computed<Theme>(
  () => props.theme ?? inheritedTheme?.value ?? globalTheme.value,
)

const liveHtml = ref<string | null>(null)
const liveTitle = ref<string | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)

const slots = useSlots()

const renderedHtml = computed(() => props.html ?? liveHtml.value ?? '')
const renderedTitle = computed(() => {
  if (props.html) return props.displayTitle
  return liveTitle.value ?? props.title
})

/** `@heading` slot or REST/display title — drives `<h1 class="mw-first-heading">`. */
const showHeading = computed(() => {
  if (slots.heading) return true
  if (props.hideTitle) return false
  return !!renderedTitle.value
})

async function fetchArticle(title: string) {
  if (!title) return

  const key = articleCacheKey(props.host, title)
  let cached = articleBodyCache.get(key)
  let cacheSource: 'memory' | 'localStorage' | null = cached ? 'memory' : null
  if (!cached) {
    const stored = loadFromStorage(key)
    if (stored) {
      articleBodyCache.set(key, stored)
      cached = stored
      cacheSource = 'localStorage'
    }
  }
  if (cached) {
    console.info(`${LOG_PREFIX} load from cache`, {
      host: props.host,
      title: title.trim(),
      source: cacheSource,
    })
    error.value = null
    liveHtml.value = cached.html
    liveTitle.value = cached.liveTitle
    loading.value = false
    return
  }

  let bodyPromise = inFlightFetches.get(key)
  const isFollower = Boolean(bodyPromise)
  if (!bodyPromise) {
    bodyPromise = (async (): Promise<CachedArticleBody> => {
      const url = `https://${props.host}/api/rest_v1/page/html/${encodeURIComponent(title)}`
      console.info(`${LOG_PREFIX} fetching from network`, {
        host: props.host,
        title: title.trim(),
        url,
      })
      const headers: Record<string, string> = {
        Accept: 'text/html; charset=utf-8',
        'Api-User-Agent': 'ProtoWiki/0.1 (https://github.com/wikimedia-research/protowiki) prototype',
      }
      const response = await fetch(url, { headers })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      const text = await response.text()
      const html = extractParserOutput(text)
      const liveTitleResolved = title.replace(/_/g, ' ')
      const body: CachedArticleBody = { html, liveTitle: liveTitleResolved }
      articleBodyCache.set(key, body)
      saveToStorage(key, body)
      console.info(`${LOG_PREFIX} fetch OK (cached)`, {
        host: props.host,
        title: title.trim(),
        htmlChars: html.length,
      })
      return body
    })().finally(() => {
      inFlightFetches.delete(key)
    })
    inFlightFetches.set(key, bodyPromise)
  } else {
    console.info(`${LOG_PREFIX} coalesced with in-flight fetch`, {
      host: props.host,
      title: title.trim(),
    })
  }

  if (!isFollower) {
    loading.value = true
    error.value = null
    liveHtml.value = null
    liveTitle.value = null
  }

  try {
    const body = await bodyPromise
    liveHtml.value = body.html
    liveTitle.value = body.liveTitle
    error.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

function extractParserOutput(raw: string): string {
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) return bodyMatch[1]
  return raw
}

const mwParserOutputRef = ref<HTMLElement | null>(null)

function wikiPageTitleForUrls(): string {
  const t =
    props.title?.trim().replace(/ /g, '_') ||
    liveTitle.value?.trim().replace(/ /g, '_') ||
    ''
  return t || 'Main_Page'
}

const FIRST_LEAD_P_CLASS = 'protowiki-mobile-first-lead-p'

/**
 * After the infobox, only the first `<p>` should stack above it (Minerva-style
 * lead). Remaining paragraphs/lists stay below. Skips non-`<p>` nodes between
 * the table and the first paragraph (e.g. Parsoid `<link rel="mw:PageProp/…">`).
 */
function markFirstLeadParagraphAfterInfobox(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>(`section[data-mw-section-id='0'] .${FIRST_LEAD_P_CLASS}`)
    .forEach((el) => el.classList.remove(FIRST_LEAD_P_CLASS))

  const section = root.querySelector<HTMLElement>("section[data-mw-section-id='0']")
  if (!section) return
  const infobox = section.querySelector(':scope > table.infobox')
  if (!infobox) return

  let n: Element | null = infobox.nextElementSibling
  while (n) {
    if (n.tagName === 'P') {
      n.classList.add(FIRST_LEAD_P_CLASS)
      break
    }
    n = n.nextElementSibling
  }
}

function enhanceMobileSectionHeadings(root: HTMLElement) {
  const host = props.host
  const wikiTitle = wikiPageTitleForUrls()

  root.querySelectorAll<HTMLHeadingElement>('section > h2').forEach((h2) => {
    if (h2.closest('.toc')) return
    if (h2.classList.contains('protowiki-mobile-h2--ready')) return

    const parent = h2.parentElement
    if (!parent || parent.tagName !== 'SECTION') return

    const bodyBits: Element[] = []
    let n = h2.nextElementSibling
    while (n) {
      bodyBits.push(n)
      n = n.nextElementSibling
    }

    const body = document.createElement('div')
    body.className = 'protowiki-mobile-section-body'
    bodyBits.forEach((el) => body.appendChild(el))
    h2.insertAdjacentElement('afterend', body)

    const sectionId = parent.getAttribute('data-mw-section-id') ?? ''

    const titleText = h2.textContent?.trim() ?? ''
    h2.textContent = ''
    h2.classList.add('protowiki-mobile-h2', 'protowiki-mobile-h2--ready')
    h2.setAttribute('aria-expanded', 'true')
    h2.setAttribute('tabindex', '0')

    const chevron = document.createElement('span')
    chevron.className = 'protowiki-mobile-h2__chevron'
    chevron.setAttribute('aria-hidden', 'true')
    chevron.innerHTML = mobileH2ChevronSvg(false)

    const label = document.createElement('span')
    label.className = 'protowiki-mobile-h2__label'
    label.textContent = titleText

    const editBtn = document.createElement('button')
    editBtn.type = 'button'
    editBtn.className = 'protowiki-mobile-h2__edit'
    editBtn.setAttribute('aria-label', 'Edit section')
    editBtn.innerHTML = mobileH2EditIconSvg()

    h2.appendChild(chevron)
    h2.appendChild(label)
    h2.appendChild(editBtn)

    function toggle() {
      const collapsed = body.classList.toggle('protowiki-mobile-section-body--collapsed')
      h2.classList.toggle('protowiki-mobile-h2--collapsed', collapsed)
      h2.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
      chevron.innerHTML = mobileH2ChevronSvg(collapsed)
    }

    h2.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.protowiki-mobile-h2__edit')) return
      toggle()
    })

    h2.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if ((e.target as HTMLElement).closest('.protowiki-mobile-h2__edit')) return
        e.preventDefault()
        toggle()
      }
    })

    editBtn.addEventListener('keydown', (e) => {
      e.stopPropagation()
    })

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!sectionId || sectionId === '0') return
      const url = `https://${host}/w/index.php?title=${encodeURIComponent(wikiTitle)}&action=edit&section=${encodeURIComponent(sectionId)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    })
  })
}

async function syncMobileParserDom() {
  await nextTick()
  const el = mwParserOutputRef.value
  const html = renderedHtml.value
  if (!el || !html || slots.default) return

  if (effectiveSkin.value === 'desktop') {
    el.innerHTML = html
    return
  }

  el.innerHTML = html
  await nextTick()
  enhanceMobileSectionHeadings(el)
  markFirstLeadParagraphAfterInfobox(el)
}

watch([effectiveSkin, renderedHtml], syncMobileParserDom, { flush: 'post' })

watch(
  () => [props.host, props.title, props.html] as const,
  ([, title, html]) => {
    if (title && !html) void fetchArticle(title)
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="article-content"
    :data-skin="effectiveSkin"
    :data-theme="effectiveTheme"
    :lang="props.lang"
    :dir="props.dir"
  >
    <CdxProgressBar v-if="loading" inline aria-label="Loading article" />

    <CdxMessage v-if="error" type="error" :allow-user-dismiss="false">
      Couldn't load this article: {{ error }}
    </CdxMessage>

    <h1 v-if="showHeading" class="article-content__title mw-first-heading">
      <slot name="heading">{{ renderedTitle }}</slot>
    </h1>

    <!--
      `.mw-parser-output` uses Wikipedia ResourceLoader CSS vendored in
      `src/styles/wiki-content/` (Vector / Minerva), scoped to `[data-skin]` and
      imported from `main.ts`. Refresh with `npm run snapshot:wiki-skins`.
    -->
    <slot v-if="slots.default" />
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div
      v-else-if="renderedHtml"
      ref="mwParserOutputRef"
      class="mw-parser-output"
      v-html="renderedHtml"
    />
  </div>
</template>

<style scoped>
.article-content {
  min-width: 0;
  width: 100%;
  padding: var(--spacing-100, 16px) 0 var(--spacing-150, 24px);
  text-align: start;
  background-color: var(--background-color-base);
}

.article-content[data-skin='mobile'] {
  /* Flush first body block under the mobile icon toolbar — hatnote strip abuts divider. */
  padding: 0 0 var(--spacing-100, 16px);
}
</style>

<!--
  v-html content is not scoped — mobile section row styling for Parsoid HTML
  (`section > h2` / nested `section > h3`) lives here instead of `minerva.css`.
-->
<style>
.article-content[data-skin='mobile'] .mw-parser-output .protowiki-mobile-h2 {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  box-sizing: border-box;
  margin: 0;
  padding: var(--spacing-75, 12px) 0;
  border-bottom: 1px solid var(--border-color-muted, var(--border-color-subtle));
  font-family: var(--font-family-serif);
  font-size: 1.5rem;
  font-weight: var(--font-weight-normal, 400);
  line-height: var(--line-height-xx-small, 1.3);
  color: var(--color-emphasized, var(--color-base));
  clear: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.article-content[data-skin='mobile'] .mw-parser-output .protowiki-mobile-h2__label {
  flex: 1;
  min-width: 0;
  text-align: start;
}

.article-content[data-skin='mobile'] .mw-parser-output .protowiki-mobile-h2__edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  margin: 0;
  margin-inline-start: var(--spacing-35, 6px);
  padding: 0;
  border: none;
  border-radius: var(--border-radius-base, 2px);
  background: transparent;
  color: var(--color-base);
  opacity: 0.7;
  cursor: pointer;
}

.article-content[data-skin='mobile'] .mw-parser-output .protowiki-mobile-h2__edit:hover {
  background-color: var(--background-color-button-quiet--hover, rgba(0, 24, 73, 0.027));
  opacity: 0.9;
}

.article-content[data-skin='mobile'] .mw-parser-output .protowiki-mobile-h2__edit:focus-visible {
  outline: 2px solid var(--color-progressive, #36c);
  outline-offset: 2px;
}

.article-content[data-skin='mobile'] .mw-parser-output .protowiki-mobile-h2__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-inline-end: 2px;
  opacity: 0.55;
  pointer-events: none;
}

.article-content[data-skin='mobile'] .mw-parser-output .protowiki-mobile-h2__chevron svg {
  display: block;
  width: 100%;
  height: 100%;
}

.article-content[data-skin='mobile'] .mw-parser-output .protowiki-mobile-section-body--collapsed {
  display: none;
}

.article-content[data-skin='mobile'] .mw-parser-output section section > h3 {
  display: block;
  box-sizing: border-box;
  margin: var(--spacing-75, 12px) 0 var(--spacing-35, 6px);
  padding: var(--spacing-35, 6px) 0;
  border-bottom: none;
  font-family: var(--font-family-base);
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small, 1.4);
  color: var(--color-emphasized, var(--color-base));
}

/*
 * Infobox: Minerva bundles both `width:100%` and a later `float:right;width:22em`
 * rule — the float wins in practice and leaves empty gutters. Match mobile-web
 * full-column infoboxes by clearing float and pinning width to the content box.
 *
 * Minerva also sets `.mw-parser-output .content table { display:block; width:fit-content }`
 * for wrapped pages; that shrinks the table and tbody no longer spans the column.
 * Force real table layout + fixed column distribution so the body fills the table.
 */
.article-content[data-skin='mobile'] .mw-parser-output table.infobox {
  display: table !important;
  float: none;
  clear: both;
  width: 100% !important;
  max-width: 100%;
  min-width: 0;
  margin-left: 0 !important;
  margin-right: 0 !important;
  box-sizing: border-box;
  table-layout: fixed;
}

.article-content[data-skin='mobile'] .mw-parser-output table.infobox > caption {
  display: table-caption !important;
  caption-side: top;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.article-content[data-skin='mobile'] .mw-parser-output table.infobox thead {
  display: table-header-group !important;
  width: 100%;
}

.article-content[data-skin='mobile'] .mw-parser-output table.infobox tbody {
  display: table-row-group !important;
  width: 100%;
}

.article-content[data-skin='mobile'] .mw-parser-output table.infobox tfoot {
  display: table-footer-group !important;
  width: 100%;
}

.article-content[data-skin='mobile'] .mw-parser-output table.infobox tr {
  width: 100%;
}

/*
 * Lead vs infobox order: Parsoid usually emits `table.infobox` before the lead
 * `<p>` blocks inside `section[data-mw-section-id="0"]`. Only the first lead
 * paragraph is stacked above the infobox; the rest stays below (see
 * `markFirstLeadParagraphAfterInfobox`).
 */
.article-content[data-skin='mobile'] .mw-parser-output section[data-mw-section-id='0'] {
  display: flex;
  flex-direction: column;
}

.article-content[data-skin='mobile']
  .mw-parser-output
  section[data-mw-section-id='0']
  > table.infobox {
  order: 2;
}

/* Siblings after the infobox: default stack below it (order 3). */
.article-content[data-skin='mobile']
  .mw-parser-output
  section[data-mw-section-id='0']
  > table.infobox
  ~ * {
  order: 3;
}

/* First `<p>` after the infobox (class added in JS) sits above the table. */
.article-content[data-skin='mobile']
  .mw-parser-output
  section[data-mw-section-id='0']
  > table.infobox
  ~ p.protowiki-mobile-first-lead-p {
  order: 1;
}
</style>
