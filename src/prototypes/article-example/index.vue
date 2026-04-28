<script setup lang="ts">
definePage({
  meta: {
    title: 'Example: Article',
    description: 'Template for article page prototypes.',
  },
})

import Article from '@/components/Article.vue'
import ChromeWrapper from '@/components/ChromeWrapper.vue'
</script>

<template>
  <ChromeWrapper>
    <div class="article-container">
      <Article title="Wet Leg" />
    </div>
  </ChromeWrapper>
</template>

<style scoped>
.article-container {
  padding: 0 var(--spacing-100);
}
</style>
