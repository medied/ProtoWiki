# Composition recipes

A page is one or more wrappers + the components inside. There is no
"layout layer" beyond what's expressed in the template.

## Full Wikipedia article page

```vue
<ChromeWrapper>
  <Article title="Albert Einstein" />
</ChromeWrapper>
```

## Article page with extra markup beside the parser output

Place experiments as siblings before or after `<Article>` in the default slot.

```vue
<ChromeWrapper>
  <MyInfoboxExperiment />
  <Article title="Talk:Albert Einstein" />
</ChromeWrapper>
```

## Special-page-style page

```vue
<ChromeWrapper>
  <SpecialPageWrapper title="Suggested edits">
    <template #actions>
      <CdxButton action="progressive" weight="primary">Pick a task</CdxButton>
    </template>
    <p>Body content.</p>
  </SpecialPageWrapper>
</ChromeWrapper>
```

## Bare canvas with chrome (no columns)

```vue
<ChromeWrapper>
  <h1>Anything</h1>
</ChromeWrapper>
```

## A/B preview — two themes, side by side

```vue
<div class="protowiki-ab">
  <ChromeWrapper theme="light">
    <Article title="Albert Einstein" />
  </ChromeWrapper>
  <ChromeWrapper theme="dark">
    <Article title="Albert Einstein" />
  </ChromeWrapper>
</div>

<style scoped>
.protowiki-ab {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
</style>
```

## Mobile preview embedded in a desktop page

```vue
<ChromeWrapper skin="mobile" style="max-width: 360px">
  <Article title="Albert Einstein" />
</ChromeWrapper>
```

## Edit-suggestion flow

Put **your editing surface** (e.g. a `contenteditable` region or code lifted from [Bárbara’s repos](editors.md)) beside a suggestion panel — see [`edit-suggestions.md`](edit-suggestions.md). Sketch:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const surfaceRef = ref<HTMLDivElement | null>(null)
const draftHtml = ref('<p>…</p>')
function syncDraft() {
  if (!surfaceRef.value) return
  draftHtml.value = surfaceRef.value.innerHTML
}
function onPublish() {
  /* mock publish — never hit a real wiki */
}
</script>

<ChromeWrapper>
  <SpecialPageWrapper title="Suggested edits">
    <div class="layout">
      <div
        ref="surfaceRef"
        class="mw-parser-output"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        @input="syncDraft"
      ></div>
      <!-- <aside> suggestion cards … -->
    </div>
  </SpecialPageWrapper>
</ChromeWrapper>
```

## Article embedded in something else (no chrome)

```vue
<MyDashboard>
  <Article title="Solar energy" />
</MyDashboard>
```

## Power-user — chrome primitives directly

```vue
<script setup lang="ts">
import ChromeHeader from '@/components/ChromeHeader.vue'
import ChromeFooter from '@/components/ChromeFooter.vue'
import Article from '@/components/Article.vue'
</script>

<template>
  <div class="custom-shell">
    <ChromeHeader />
    <main>
      <Article title="Albert Einstein" />
    </main>
    <ChromeFooter />
  </div>
</template>
```
