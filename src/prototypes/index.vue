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

/** Bucket from `definePage` title — `Template:` / `Example:` prefixes (case-insensitive). */
function prototypeBucket(title: string): 'regular' | 'template' | 'example' {
  const t = title.trim()
  if (/^template\s*:/i.test(t)) return 'template'
  if (/^example\s*:/i.test(t)) return 'example'
  return 'regular'
}

const bucketOrder: Record<'regular' | 'template' | 'example', number> = {
  regular: 0,
  template: 1,
  example: 2,
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
    .sort((a, b) => {
      const ba = prototypeBucket(a.title)
      const bb = prototypeBucket(b.title)
      const cmpBucket = bucketOrder[ba] - bucketOrder[bb]
      if (cmpBucket !== 0) return cmpBucket
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    })
})
</script>

<template>
  <PlainWrapper heading="ProtoWiki">
    <div class="prototype-index">
      <div class="prototype-index__list" role="list">
        <div v-for="entry in prototypes" :key="entry.path" class="prototype-index__card" role="listitem">
          <CdxCard :url="router.resolve({ path: entry.path }).href">
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
