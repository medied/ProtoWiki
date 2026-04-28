<script setup lang="ts">
import { computed, provide } from 'vue'

import {
  globalSkin,
  globalTheme,
  PROTOWIKI_CHROME_SKIN,
  PROTOWIKI_CHROME_THEME,
} from '@/lib/theming'
import type { Skin, Theme } from '@/lib/theming'
import ChromeHeader from './ChromeHeader.vue'
import ChromeFooter from './ChromeFooter.vue'
import SearchBar from './SearchBar.vue'

interface Props {
  /**
   * BCP-47 language tag for the wrapped subtree. Sets `lang` on the root.
   * Inherited by descendants via the DOM, so primitives don't need their own
   * `lang` prop. Usually you set this once on the outermost wrapper (or on
   * `<html>`); only nest it for multi-language A/B previews on one page.
   */
  lang?: string
  /**
   * Writing direction for the wrapped subtree. Sets `dir` on the root.
   * Pass `'rtl'` explicitly when previewing an RTL article — we don't infer
   * it from `lang`, because that gets it wrong for mixed-script pages and
   * for cases where you want to preview a layout in a different direction.
   */
  dir?: 'ltr' | 'rtl'
  /** Local skin override. Sets `data-skin` on the wrapper root. */
  skin?: Skin
  /** Local theme override. Sets `data-theme` on the wrapper root. */
  theme?: Theme
}

const props = withDefaults(defineProps<Props>(), {
  lang: undefined,
  dir: undefined,
  skin: undefined,
  theme: undefined,
})

const effectiveSkin = computed<Skin>(() => props.skin ?? globalSkin.value)
const effectiveTheme = computed<Theme>(() => props.theme ?? globalTheme.value)

provide(PROTOWIKI_CHROME_SKIN, effectiveSkin)
provide(PROTOWIKI_CHROME_THEME, effectiveTheme)
</script>

<template>
  <div
    class="chrome-wrapper"
    :data-skin="effectiveSkin"
    :data-theme="effectiveTheme"
    :lang="props.lang"
    :dir="props.dir"
  >
    <slot name="header">
      <ChromeHeader :skin="effectiveSkin" :theme="effectiveTheme">
        <template #search>
          <slot name="search">
            <SearchBar />
          </slot>
        </template>
        <template #nav-prefix>
          <slot name="nav-prefix">
            <a
              class="chrome-header__username-link"
              href="https://meta.wikimedia.org/wiki/Main_Page"
              rel="noopener noreferrer"
            >
              Username
            </a>
          </slot>
        </template>
      </ChromeHeader>
    </slot>

    <main class="chrome-wrapper__content">
      <slot />
    </main>

    <slot name="footer">
      <ChromeFooter :skin="effectiveSkin" :theme="effectiveTheme" />
    </slot>
  </div>
</template>

<style scoped>
.chrome-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--background-color-base, #fff);
  color: var(--color-base, #202122);
}

.chrome-wrapper__content {
  flex: 1 1 auto;
  width: 100%;
  margin: 0 auto;
  padding: 0 0;
}
</style>
