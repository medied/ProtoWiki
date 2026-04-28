<script setup lang="ts">
import { computed, inject, useSlots } from 'vue'

import {
  globalSkin,
  globalTheme,
  PROTOWIKI_CHROME_SKIN,
  PROTOWIKI_CHROME_THEME,
} from '@/lib/theming'
import type { Skin, Theme } from '@/lib/theming'

interface Props {
  /** Title rendered in the special-page title row. */
  title?: string
  /**
   * BCP-47 language tag for the wrapped subtree. Sets `lang` on the root.
   * Inherited by descendants via the DOM. Usually you set this once on the
   * outermost wrapper; only nest it for multi-language A/B previews.
   */
  lang?: string
  /**
   * Writing direction for the wrapped subtree. Sets `dir` on the root.
   * Pass `'rtl'` explicitly for RTL previews; we don't infer it from `lang`.
   */
  dir?: 'ltr' | 'rtl'
  /** Local skin override. Sets `data-skin` on the wrapper root. */
  skin?: Skin
  /** Local theme override. Sets `data-theme` on the wrapper root. */
  theme?: Theme
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  lang: undefined,
  dir: undefined,
  skin: undefined,
  theme: undefined,
})

const inheritedSkin = inject(PROTOWIKI_CHROME_SKIN)
const inheritedTheme = inject(PROTOWIKI_CHROME_THEME)

const effectiveSkin = computed<Skin>(() => props.skin ?? inheritedSkin?.value ?? globalSkin.value)
const effectiveTheme = computed<Theme>(
  () => props.theme ?? inheritedTheme?.value ?? globalTheme.value,
)

const slots = useSlots()
</script>

<template>
  <div
    class="special-page-wrapper"
    :data-skin="effectiveSkin"
    :data-theme="effectiveTheme"
    :lang="props.lang"
    :dir="props.dir"
  >
    <!-- Strip above title row (e.g. site notices) — FakeMediaWiki SpecialView parity -->
    <div v-if="$slots.notices" class="special-page-wrapper__notices">
      <slot name="notices" />
    </div>

    <header
      v-if="props.title || slots.title || $slots.help || $slots.actions"
      class="special-page-wrapper__header"
    >
      <span class="special-page-wrapper__title-cluster">
        <h1 v-if="props.title || slots.title" class="special-page-wrapper__title">
          <slot name="title">{{ props.title }}</slot>
        </h1>
      </span>
      <span class="special-page-wrapper__header-aside">
        <span v-if="$slots.help" class="special-page-wrapper__help">
          <slot name="help" />
        </span>
        <span v-if="$slots.actions" class="special-page-wrapper__actions">
          <slot name="actions" />
        </span>
      </span>
    </header>

    <div class="special-page-wrapper__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/*
 * Layout aligned with FakeMediaWiki `SpecialView`: max width ~1596px,
 * horizontal padding ~2.75rem, title row flex + baseline Help link.
 */
.special-page-wrapper {
  box-sizing: border-box;
  width: 100%;
  max-width: 99.75rem;
  margin: 0 auto;
  padding-top: var(--spacing-50);
  background-color: var(--background-color-base);
}

.special-page-wrapper__notices {
  min-height: var(--spacing-50, 8px);
  margin: 0 calc(-1 * var(--spacing-250, 44px)) var(--spacing-50, 8px);
  padding: 0 var(--spacing-250, 44px);
  background-color: var(--background-color-notice, #eaf3ff);
}

.special-page-wrapper__header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-100, 16px);
  width: 100%;
  margin-bottom: var(--spacing-100, 16px);
  padding-bottom: 2px;
  border-bottom: 1px solid var(--border-color-base, #a2a9b1);
}

.special-page-wrapper__title-cluster {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-75, 12px);
  min-width: 0;
}

.special-page-wrapper__title {
  margin: 0;
  padding-bottom: 2px;
  border: none;
}

.special-page-wrapper__header-aside {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-100, 16px);
}

.special-page-wrapper__help :deep(a) {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  padding: var(--spacing-25, 4px) var(--spacing-50, 8px);
  font-size: var(--font-size-medium, 1rem);
  color: var(--color-progressive, #36c);
  text-decoration: none;
}

.special-page-wrapper__help :deep(a:hover) {
  text-decoration: underline;
}

.special-page-wrapper__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
}

.special-page-wrapper__body {
  min-width: 0;
}

.special-page-wrapper[data-skin='mobile'] .special-page-wrapper__help {
  display: none;
}

.special-page-wrapper[data-skin='mobile'] {
  padding-inline: var(--spacing-100, 16px);
}

.special-page-wrapper[data-skin='mobile'] .special-page-wrapper__notices {
  margin-inline: calc(-1 * var(--spacing-100, 16px));
  padding-inline: var(--spacing-100, 16px);
}

@media (max-width: 1120px) {
  .special-page-wrapper {
    padding-inline: var(--spacing-100, 16px);
  }

  .special-page-wrapper__notices {
    margin-inline: calc(-1 * var(--spacing-100, 16px));
    padding-inline: var(--spacing-100, 16px);
  }
}
</style>
