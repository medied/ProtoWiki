<script setup lang="ts">
import { computed, useSlots } from 'vue'

/**
 * Minimal centred column — FakeMediaWiki “Component” wrapper parity:
 * no Wikipedia chrome, max-width + horizontal padding only.
 *
 * Primary reader-style heading is emitted as `<h1 class="mw-first-heading">`.
 * Pass `heading` for plain text or `#heading` for rich markup inside that `h1`.
 */
interface Props {
  /** BCP-47 language tag on the root (optional). */
  lang?: string
  /** Writing direction on the root (optional). */
  dir?: 'ltr' | 'rtl'
  /**
   * Plain-text page heading — renders inside `<h1 class="mw-first-heading">`.
   * Omit both this and `#heading` when the surface has no primary title.
   */
  heading?: string
}

const props = withDefaults(defineProps<Props>(), {
  lang: undefined,
  dir: undefined,
  heading: undefined,
})

const slots = useSlots()

const showHeading = computed(() => {
  if (slots.heading) return true
  const h = props.heading
  return typeof h === 'string' && h.length > 0
})
</script>

<template>
  <div class="plain-wrapper" :lang="props.lang" :dir="props.dir">
    <h1 v-if="showHeading" class="mw-first-heading">
      <slot name="heading">{{ props.heading }}</slot>
    </h1>
    <slot />
  </div>
</template>

<style scoped>
.plain-wrapper {
  box-sizing: border-box;
  max-width: 45rem;
  margin: 0 auto;
  padding: var(--spacing-250) var(--spacing-100);
  background-color: var(--background-color-base);
}
</style>
