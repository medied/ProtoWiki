<script setup lang="ts">
import { computed, inject } from 'vue'

import ArticleHeader from '@/components/ArticleHeader.vue'
import ArticleLiveContent from '@/components/ArticleLiveContent.vue'
import ArticleMockContent from '@/components/ArticleMockContent.vue'
import { MOCK_WET_LEG_DISPLAY_TITLE } from '@/lib/mockWetLegArticle'
import {
  globalSkin,
  globalTheme,
  PROTOWIKI_CHROME_SKIN,
  PROTOWIKI_CHROME_THEME,
} from '@/lib/theming'
import type { Skin, Theme } from '@/lib/theming'
import type { ArticleLanguageLink } from '@/lib/articleLanguageLinks'

interface Props {
  /** `live` = REST + cache; `mock` = static Wet Leg snapshot from `public/snapshots/`. */
  contentType?: 'live' | 'mock'
  lang?: string
  dir?: 'ltr' | 'rtl'
  title?: string
  html?: string
  displayTitle?: string
  host?: string
  skin?: Skin
  theme?: Theme
  /** Forwarded to `ArticleHeader` (defaults still apply if omitted). */
  languagesLabel?: string
  /** Forwarded to `ArticleHeader` — overrides demo interlanguage list. */
  languageLinks?: ArticleLanguageLink[]
  languageSearchPlaceholder?: string
  tagline?: string
  primaryTab?: 'article' | 'talk'
  viewTab?: 'read' | 'edit' | 'history'
}

const props = withDefaults(defineProps<Props>(), {
  contentType: 'live',
  lang: undefined,
  dir: undefined,
  title: undefined,
  html: undefined,
  displayTitle: undefined,
  host: 'en.wikipedia.org',
  skin: undefined,
  theme: undefined,
  languagesLabel: undefined,
  languageLinks: undefined,
  languageSearchPlaceholder: undefined,
  tagline: undefined,
  primaryTab: undefined,
  viewTab: undefined,
})

const inheritedSkin = inject(PROTOWIKI_CHROME_SKIN)
const inheritedTheme = inject(PROTOWIKI_CHROME_THEME)

const effectiveSkin = computed<Skin>(
  () => props.skin ?? inheritedSkin?.value ?? globalSkin.value,
)
const effectiveTheme = computed<Theme>(
  () => props.theme ?? inheritedTheme?.value ?? globalTheme.value,
)

/** Mirrors the content heading source so the chrome title stays in sync for live + snapshot modes. */
const headerTitle = computed(() => {
  if (props.contentType === 'mock') return MOCK_WET_LEG_DISPLAY_TITLE
  if (props.html) return props.displayTitle?.trim() || ''
  const t = props.title?.replace(/_/g, ' ').trim() || ''
  return props.displayTitle?.trim() || t
})

const showArticleHeader = computed(() => Boolean(headerTitle.value))
</script>

<template>
  <article
    class="article"
    :data-skin="effectiveSkin"
    :data-theme="effectiveTheme"
    :lang="props.lang"
    :dir="props.dir"
  >
    <ArticleHeader
      v-if="showArticleHeader"
      :title="headerTitle"
      :languages-label="props.languagesLabel"
      :language-links="props.languageLinks"
      :language-search-placeholder="props.languageSearchPlaceholder"
      :tagline="props.tagline"
      :primary-tab="props.primaryTab ?? 'article'"
      :view-tab="props.viewTab ?? 'read'"
      :skin="props.skin"
    />
    <ArticleMockContent
      v-if="props.contentType === 'mock'"
      :lang="props.lang"
      :dir="props.dir"
      :host="props.host"
      :skin="props.skin"
      :theme="props.theme"
      :hide-title="showArticleHeader"
    >
      <template v-if="$slots.heading" #heading>
        <slot name="heading" />
      </template>
      <template v-if="$slots.default" #default>
        <slot />
      </template>
    </ArticleMockContent>
    <ArticleLiveContent
      v-else
      :lang="props.lang"
      :dir="props.dir"
      :title="props.title"
      :html="props.html"
      :display-title="props.displayTitle"
      :host="props.host"
      :skin="props.skin"
      :theme="props.theme"
      :hide-title="showArticleHeader"
    >
      <template v-if="$slots.heading" #heading>
        <slot name="heading" />
      </template>
      <template v-if="$slots.default" #default>
        <slot />
      </template>
    </ArticleLiveContent>
  </article>
</template>

<style scoped>
.article {
  min-width: 0;
  width: 100%;
  padding: var(--spacing-150, 24px) 0;
  text-align: start;
  background-color: var(--background-color-base);
}

/* Vector 2022-ish reading column; not a Codex token. */
.article[data-skin='desktop'] {
  max-width: 984px;
  margin-inline: auto;
}

.article[data-skin='mobile'] {
  padding-inline: 0;
  padding-block-end: var(--spacing-100, 16px);
  padding-block-start: var(--spacing-150, 24px);
}
</style>
