<script setup lang="ts">
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconHelpNotice } from '@wikimedia/codex-icons'

import ChromeWrapper from '@/components/ChromeWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'

definePage({
  meta: {
    title: 'Template: Special page',
    description: 'Template for special page prototypes.',
  },
})
</script>

<template>
  <ChromeWrapper>
    <SpecialPageWrapper title="Special page wrapper">
      <template #help>
        <a href="https://doc.wikimedia.org/codex/latest/" rel="noopener noreferrer">
          <CdxIcon size="small" :icon="cdxIconHelpNotice" />
          <span>Help</span>
        </a>
      </template>

      <p>Starter template — empty special page wrapper.</p>
    </SpecialPageWrapper>
  </ChromeWrapper>
</template>
