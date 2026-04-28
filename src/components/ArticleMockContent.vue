<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { CdxMessage, CdxProgressBar } from '@wikimedia/codex'

import ArticleLiveContent from '@/components/ArticleLiveContent.vue'
import { MOCK_WET_LEG_DISPLAY_TITLE } from '@/lib/mockWetLegArticle'
import {
  globalSkin,
  globalTheme,
  PROTOWIKI_CHROME_SKIN,
  PROTOWIKI_CHROME_THEME,
} from '@/lib/theming'
import type { Skin, Theme } from '@/lib/theming'

const LOG_PREFIX = '[ProtoWiki][ArticleMockContent]'

let snapshotLoadPromise: Promise<string> | null = null

function loadWetLegSnapshotHtml(): Promise<string> {
  snapshotLoadPromise ??= (async () => {
    const url = `${import.meta.env.BASE_URL}snapshots/wet-leg.html`
    console.info(`${LOG_PREFIX} fetching snapshot`, { url })
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    const text = await res.text()
    console.info(`${LOG_PREFIX} snapshot OK`, { htmlChars: text.length })
    return text
  })()
  return snapshotLoadPromise
}

interface Props {
  hideTitle?: boolean
  lang?: string
  dir?: 'ltr' | 'rtl'
  host?: string
  skin?: Skin
  theme?: Theme
}

const props = withDefaults(defineProps<Props>(), {
  hideTitle: false,
  lang: undefined,
  dir: undefined,
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

const html = ref<string | null>(null)
const error = ref<string | null>(null)
const loading = ref(true)

onMounted(() => {
  void loadWetLegSnapshotHtml()
    .then((body) => {
      html.value = body
      error.value = null
    })
    .catch((err) => {
      error.value = err instanceof Error ? err.message : String(err)
    })
    .finally(() => {
      loading.value = false
    })
})
</script>

<template>
  <div
    v-if="loading && !html"
    class="article-content"
    :data-skin="effectiveSkin"
    :data-theme="effectiveTheme"
    :lang="props.lang"
    :dir="props.dir"
  >
    <CdxProgressBar inline aria-label="Loading article" />
  </div>

  <div
    v-else-if="error"
    class="article-content"
    :data-skin="effectiveSkin"
    :data-theme="effectiveTheme"
    :lang="props.lang"
    :dir="props.dir"
  >
    <CdxMessage type="error" :allow-user-dismiss="false">
      Couldn't load this article: {{ error }}
    </CdxMessage>
  </div>

  <ArticleLiveContent
    v-else-if="html"
    :hide-title="props.hideTitle"
    :lang="props.lang"
    :dir="props.dir"
    :title="MOCK_WET_LEG_DISPLAY_TITLE"
    :html="html"
    :display-title="MOCK_WET_LEG_DISPLAY_TITLE"
    :host="props.host"
    :skin="props.skin"
    :theme="props.theme"
  >
    <template v-if="$slots.heading" #heading>
      <slot name="heading" />
    </template>
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </ArticleLiveContent>
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
  padding: var(--spacing-50, 8px) 0 var(--spacing-100, 16px);
}
</style>
