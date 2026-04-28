<script setup lang="ts">
definePage({
  meta: {
    title: 'Example: Chrome',
    description: 'Template for prototypes with a Wikipedia header and footer.',
  },
})

import ChromeWrapper from '@/components/ChromeWrapper.vue'
</script>

<template>
  <ChromeWrapper>
    <div class="chrome-example__body">
      <h1>Chrome wrapper</h1>
      <p class="chrome-example__text">This is an example of an empty chrome wrapper.</p>
    </div>
  </ChromeWrapper>
</template>

<style scoped>
.chrome-example__body {
  padding: var(--spacing-100) var(--spacing-100);
}

.chrome-example__text {
  margin: 0 0 var(--spacing-100);
}

.chrome-example__text:last-child {
  margin-bottom: 0;
}
</style>
