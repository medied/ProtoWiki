<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { CdxButton, CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import {
  cdxIconBold,
  cdxIconEllipsis,
  cdxIconItalic,
  cdxIconLink,
  cdxIconLogoWikipedia,
  cdxIconReference,
  cdxIconTextStyle,
  cdxIconUndo,
} from '@wikimedia/codex-icons'

import type { Skin, Theme } from '@/lib/theming'

interface Props {
  /** Initial / two-way bound HTML content (without the H1). */
  modelValue?: string
  /** Page title — renders inside `<h1 class="mw-first-heading">`. Use `#heading` for rich markup. */
  title?: string
  /** Placeholder text shown when the editor is empty. */
  placeholder?: string
  /** Local skin override. Sets `data-skin` on the root. */
  skin?: Skin
  /** Local theme override. Sets `data-theme` on the root. */
  theme?: Theme
}

interface Emits {
  (event: 'update:modelValue', value: string): void
  (event: 'publish', payload: { html: string; title?: string }): void
  (event: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  title: undefined,
  placeholder: 'Start writing...',
  skin: undefined,
  theme: undefined,
})

const emit = defineEmits<Emits>()

const slots = useSlots()

const showEditorHeading = computed(
  () => props.title != null && props.title !== '' || !!slots.heading,
)

const surfaceRef = ref<HTMLDivElement | null>(null)
const initialHtml = ref(props.modelValue)
const currentHtml = ref(props.modelValue)
const hasUnsavedChanges = computed(() => currentHtml.value !== initialHtml.value)

const headingMenuItems = [
  { value: 'h2', label: 'Heading' },
  { value: 'h3', label: 'Sub-heading 1' },
  { value: 'h4', label: 'Sub-heading 2' },
  { value: 'p', label: 'Paragraph' },
]

const moreMenuItems = [
  { value: 'special', label: 'Insert special character' },
  { value: 'image', label: 'Insert image placeholder' },
  { value: 'template', label: 'Insert template placeholder' },
]

const headingSelected = ref<string | null>(null)
const moreSelected = ref<string | null>(null)

function syncFromSurface() {
  if (!surfaceRef.value) return
  const next = surfaceRef.value.innerHTML
  if (next !== currentHtml.value) {
    currentHtml.value = next
    emit('update:modelValue', next)
  }
}

function exec(command: string, value?: string) {
  if (!surfaceRef.value) return
  surfaceRef.value.focus()
  // execCommand is officially deprecated but still ships in every browser
  // and is the lightest path to a usable rich-text prototype. Real editor
  // fidelity belongs in the visual-editor-vendoring skill.
  document.execCommand(command, false, value)
  syncFromSurface()
}

watch(headingSelected, (next) => {
  if (!next) return
  exec('formatBlock', next)
  headingSelected.value = null
})

watch(moreSelected, (next) => {
  if (!next) return
  switch (next) {
    case 'special':
      exec('insertText', '— ')
      break
    case 'image':
      exec(
        'insertHTML',
        '<figure class="thumb"><div class="thumbcaption">[image placeholder]</div></figure>',
      )
      break
    case 'template':
      exec('insertHTML', '<span class="mw-template-placeholder">{{template}}</span>')
      break
  }
  moreSelected.value = null
})

function onLinkClick() {
  const url = window.prompt('Enter a URL')
  if (url) exec('createLink', url)
}

function onCiteClick() {
  exec('insertHTML', '<sup class="reference">[citation]</sup>')
}

function onPublish() {
  if (!hasUnsavedChanges.value) return
  emit('publish', { html: currentHtml.value, title: props.title })
  initialHtml.value = currentHtml.value
}

function onCancel() {
  if (
    hasUnsavedChanges.value &&
    !window.confirm('Discard your changes?')
  ) {
    return
  }
  if (surfaceRef.value) surfaceRef.value.innerHTML = initialHtml.value
  currentHtml.value = initialHtml.value
  emit('update:modelValue', initialHtml.value)
  emit('cancel')
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasUnsavedChanges.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  if (surfaceRef.value && currentHtml.value) {
    surfaceRef.value.innerHTML = currentHtml.value
  }
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})

watch(
  () => props.modelValue,
  (next) => {
    if (next === currentHtml.value) return
    currentHtml.value = next ?? ''
    initialHtml.value = next ?? ''
    if (surfaceRef.value) surfaceRef.value.innerHTML = next ?? ''
  },
)
</script>

<template>
  <div
    class="article-editor"
    :data-skin="props.skin"
    :data-theme="props.theme"
  >
    <div class="article-editor__toolbar" role="toolbar" aria-label="Editor toolbar">
      <CdxButton weight="quiet" aria-label="Bold" @click="exec('bold')">
        <CdxIcon :icon="cdxIconBold" />
      </CdxButton>
      <CdxButton weight="quiet" aria-label="Italic" @click="exec('italic')">
        <CdxIcon :icon="cdxIconItalic" />
      </CdxButton>
      <CdxMenuButton v-model:selected="headingSelected" :menu-items="headingMenuItems">
        <CdxIcon :icon="cdxIconTextStyle" />
        <span class="article-editor__toolbar-label">Headings</span>
      </CdxMenuButton>
      <CdxButton weight="quiet" @click="onCiteClick">
        <CdxIcon :icon="cdxIconReference" />
        <span class="article-editor__toolbar-label">Cite</span>
      </CdxButton>
      <CdxButton weight="quiet" @click="onLinkClick">
        <CdxIcon :icon="cdxIconLink" />
        <span class="article-editor__toolbar-label">Link</span>
      </CdxButton>
      <CdxMenuButton v-model:selected="moreSelected" :menu-items="moreMenuItems">
        <CdxIcon :icon="cdxIconEllipsis" />
        <span class="article-editor__toolbar-label">More</span>
      </CdxMenuButton>
      <div class="article-editor__toolbar-spacer" />
      <CdxButton weight="quiet" :disabled="!hasUnsavedChanges" @click="exec('undo')">
        <CdxIcon :icon="cdxIconUndo" />
        <span class="article-editor__toolbar-label">Undo</span>
      </CdxButton>
    </div>

    <h1 v-if="showEditorHeading" class="article-editor__title mw-first-heading">
      <slot name="heading">{{ props.title }}</slot>
    </h1>

    <div
      ref="surfaceRef"
      class="article-editor__surface mw-parser-output"
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      :aria-placeholder="props.placeholder"
      :data-placeholder="props.placeholder"
      @input="syncFromSurface"
      @blur="syncFromSurface"
    />

    <footer class="article-editor__footer">
      <span class="article-editor__indicator" :data-changed="hasUnsavedChanges">
        <CdxIcon :icon="cdxIconLogoWikipedia" />
        {{ hasUnsavedChanges ? 'Unsaved changes' : 'No changes' }}
      </span>
      <div class="article-editor__footer-actions">
        <CdxButton weight="quiet" @click="onCancel">Cancel</CdxButton>
        <CdxButton
          action="progressive"
          weight="primary"
          :disabled="!hasUnsavedChanges"
          @click="onPublish"
        >
          Publish changes
        </CdxButton>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.article-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  border: 1px solid var(--border-color-base, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-base, #fff);
}

.article-editor__toolbar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-25, 4px);
  padding: var(--spacing-50, 8px);
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
  background-color: var(--background-color-neutral-subtle, #f8f9fa);
}

.article-editor__toolbar-label {
  margin-inline-start: var(--spacing-25, 4px);
}

.article-editor__toolbar-spacer {
  flex: 1 1 auto;
}

/* Horizontal inset for editor chrome; underline + Libertine from global `.mw-first-heading` */
.article-editor__title {
  margin-inline: var(--spacing-150, 24px);
}

.article-editor__surface {
  min-height: 16rem;
  padding: 0 var(--spacing-150, 24px) var(--spacing-150, 24px);
  outline: none;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-medium, 1.6);
}

.article-editor__surface:empty::before {
  content: attr(data-placeholder);
  color: var(--color-placeholder, #72777d);
  pointer-events: none;
}

.article-editor__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-100, 16px);
  padding: var(--spacing-75, 12px) var(--spacing-150, 24px);
  border-top: 1px solid var(--border-color-subtle, #c8ccd1);
  background-color: var(--background-color-neutral-subtle, #f8f9fa);
}

.article-editor__indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  font-size: var(--font-size-small, 0.875rem);
  color: var(--color-subtle, #54595d);
}

.article-editor__indicator[data-changed='true'] {
  color: var(--color-warning, #ac6600);
}

.article-editor__footer-actions {
  display: inline-flex;
  gap: var(--spacing-50, 8px);
}
</style>
