<script setup lang="ts">
definePage({
  meta: {
    title: 'Template: Chrome',
    description: 'Template for prototypes with a Wikipedia header and footer.',
  },
})

import ChromeWrapper from '@/components/ChromeWrapper.vue'
</script>

<template>
  <ChromeWrapper>
    <div class="chrome-template__body">
      <h1>Chrome wrapper</h1>
      <p class="chrome-template__text">Starter template — empty chrome wrapper.</p>
    </div>
  </ChromeWrapper>
</template>

<style scoped>
.chrome-template__body {
  padding: var(--spacing-100) var(--spacing-100);
}

.chrome-template__text {
  margin: 0 0 var(--spacing-100);
}

.chrome-template__text:last-child {
  margin-bottom: 0;
}
</style>
