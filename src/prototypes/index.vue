<script setup lang="ts">
definePage({
  meta: {
    title: 'ProtoWiki',
    description: 'Prototype index',
  },
})

import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { CdxCard } from '@wikimedia/codex'

import PlainWrapper from '@/components/PlainWrapper.vue'

const router = useRouter()

interface PrototypeMeta {
  title?: string
  description?: string
}

interface PrototypeEntry {
  path: string
  title: string
  description?: string
}

function humanize(path: string): string {
  return path
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const prototypes = computed<PrototypeEntry[]>(() => {
  return router
    .getRoutes()
    .filter((route) => route.path !== '/' && route.path !== '/:catchAll(.*)')
    .map((route) => {
      const meta = (route.meta ?? {}) as PrototypeMeta
      const description =
        typeof meta.description === 'string' && meta.description.length > 0
          ? meta.description
          : undefined
      return {
        path: route.path,
        title: meta.title ?? humanize(route.path),
        description,
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path))
})
</script>

<template>
  <PlainWrapper heading="ProtoWiki">
    <div class="prototype-index">
      <div class="prototype-index__list" role="list">
        <div v-for="entry in prototypes" :key="entry.path" class="prototype-index__card" role="listitem">
          <CdxCard :url="entry.path">
            <template #title>{{ entry.title }}</template>
            <template v-if="entry.description" #description>{{ entry.description }}</template>
          </CdxCard>
        </div>
      </div>
    </div>
  </PlainWrapper>
</template>

<style scoped>
.prototype-index__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
}

.prototype-index__card {
  min-width: 0;
}
</style>
