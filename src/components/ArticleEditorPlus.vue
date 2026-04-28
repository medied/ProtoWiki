<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { CdxButton, CdxDialog, CdxIcon, CdxMessage } from '@wikimedia/codex'
import {
  cdxIconBold,
  cdxIconCode,
  cdxIconHistory,
  cdxIconItalic,
  cdxIconLink,
  cdxIconLogoWikipedia,
  cdxIconReference,
  cdxIconTextStyle,
  cdxIconTrash,
  cdxIconUndo,
} from '@wikimedia/codex-icons'
import DiffMatchPatch from 'diff-match-patch'

import type { Skin, Theme } from '@/lib/theming'

interface Props {
  /** Initial / two-way bound HTML content (without the H1). */
  modelValue?: string
  /** Title — shown above the editor, autosave key. Renders in `<h1 class="mw-first-heading">`; use `#heading` for rich markup. */
  title?: string
  /** Placeholder text shown when the editor is empty. */
  placeholder?: string
  /** Debounce window for autosave to localStorage, in ms. */
  autosaveMs?: number
  /** localStorage key namespace. */
  storagePrefix?: string
  /** Local skin override. Sets `data-skin` on the root. */
  skin?: Skin
  /** Local theme override. Sets `data-theme` on the root. */
  theme?: Theme
}

interface Emits {
  (event: 'update:modelValue', value: string): void
  (event: 'publish', payload: { html: string; title?: string }): void
  (event: 'cancel'): void
  (event: 'restore', payload: { html: string; title?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  title: undefined,
  placeholder: 'Start writing...',
  autosaveMs: 1500,
  storagePrefix: 'protowiki:editor',
  skin: undefined,
  theme: undefined,
})

const emit = defineEmits<Emits>()

const slots = useSlots()

const showEditorHeading = computed(
  () => (props.title != null && props.title !== '') || !!slots.heading,
)

const surfaceRef = ref<HTMLDivElement | null>(null)
const initialHtml = ref(props.modelValue)
const currentHtml = ref(props.modelValue)
const sourceMode = ref(false)
const showDiffDialog = ref(false)
const showRestoreDialog = ref(false)
const lastSavedAt = ref<number | null>(null)

const hasUnsavedChanges = computed(() => currentHtml.value !== initialHtml.value)

const storageKey = computed(
  () => `${props.storagePrefix}:${props.title ?? '__untitled__'}`,
)

interface DraftRecord {
  html: string
  savedAt: number
}

function readDraft(): DraftRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey.value)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftRecord
    if (typeof parsed?.html !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

function writeDraft(html: string): void {
  if (typeof window === 'undefined') return
  try {
    const record: DraftRecord = { html, savedAt: Date.now() }
    window.localStorage.setItem(storageKey.value, JSON.stringify(record))
    lastSavedAt.value = record.savedAt
  } catch {
    // Quota errors are silent; autosave is best-effort.
  }
}

function clearDraft(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(storageKey.value)
  lastSavedAt.value = null
}

let autosaveTimer: number | undefined
function scheduleAutosave() {
  if (typeof window === 'undefined') return
  if (autosaveTimer) window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(() => {
    if (hasUnsavedChanges.value) writeDraft(currentHtml.value)
  }, props.autosaveMs)
}

function syncFromSurface() {
  if (!surfaceRef.value) return
  const next = surfaceRef.value.innerHTML
  if (next !== currentHtml.value) {
    currentHtml.value = next
    emit('update:modelValue', next)
    scheduleAutosave()
  }
}

function syncFromSource(value: string) {
  currentHtml.value = value
  emit('update:modelValue', value)
  scheduleAutosave()
}

function exec(command: string, value?: string) {
  if (!surfaceRef.value || sourceMode.value) return
  surfaceRef.value.focus()
  document.execCommand(command, false, value)
  syncFromSurface()
}

function toggleSourceMode() {
  if (sourceMode.value) {
    sourceMode.value = false
    // Wait a tick so the contenteditable surface mounts before we paint the
    // updated HTML into it.
    queueMicrotask(() => {
      if (surfaceRef.value) surfaceRef.value.innerHTML = currentHtml.value
    })
  } else {
    syncFromSurface()
    sourceMode.value = true
  }
}

function onLinkClick() {
  const url = window.prompt('Enter a URL')
  if (url) exec('createLink', url)
}

function onCiteClick() {
  exec('insertHTML', '<sup class="reference">[citation]</sup>')
}

function onHeadingClick() {
  // Cycle through h2, h3, p
  const order = ['h2', 'h3', 'p']
  const surface = surfaceRef.value
  if (!surface) return
  const selection = window.getSelection()
  const node = selection?.anchorNode as HTMLElement | null
  let parent: HTMLElement | null = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement ?? null
  while (parent && parent !== surface && !/^(H[1-6]|P)$/.test(parent.tagName)) {
    parent = parent.parentElement
  }
  const current = parent && parent !== surface ? parent.tagName.toLowerCase() : null
  const next = order[(order.indexOf(current ?? 'p') + 1) % order.length]
  exec('formatBlock', next)
}

const diffMatchPatch = new DiffMatchPatch()
const diffSegments = computed<Array<{ kind: 'add' | 'remove' | 'equal'; text: string }>>(() => {
  if (!showDiffDialog.value) return []
  const before = stripTags(initialHtml.value)
  const after = stripTags(currentHtml.value)
  const ops = diffMatchPatch.diff_main(before, after)
  diffMatchPatch.diff_cleanupSemantic(ops)
  return ops.map(([kind, text]) => ({
    kind: kind === -1 ? 'remove' : kind === 1 ? 'add' : 'equal',
    text,
  }))
})

function stripTags(html: string): string {
  if (typeof document === 'undefined') return html
  const container = document.createElement('div')
  container.innerHTML = html
  return (container.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function openPublishDialog() {
  if (!hasUnsavedChanges.value) return
  showDiffDialog.value = true
}

function confirmPublish() {
  emit('publish', { html: currentHtml.value, title: props.title })
  initialHtml.value = currentHtml.value
  clearDraft()
  showDiffDialog.value = false
}

function onCancel() {
  if (
    hasUnsavedChanges.value &&
    !window.confirm('Discard your changes and clear the local draft?')
  ) {
    return
  }
  if (surfaceRef.value) surfaceRef.value.innerHTML = initialHtml.value
  currentHtml.value = initialHtml.value
  emit('update:modelValue', initialHtml.value)
  emit('cancel')
  clearDraft()
}

function onRestoreDraft() {
  const draft = readDraft()
  if (!draft) {
    showRestoreDialog.value = false
    return
  }
  currentHtml.value = draft.html
  if (surfaceRef.value) surfaceRef.value.innerHTML = draft.html
  emit('update:modelValue', draft.html)
  emit('restore', { html: draft.html, title: props.title })
  showRestoreDialog.value = false
}

function onDiscardDraft() {
  clearDraft()
  showRestoreDialog.value = false
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasUnsavedChanges.value) return
  // Best-effort flush before navigation.
  writeDraft(currentHtml.value)
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  if (surfaceRef.value && currentHtml.value) {
    surfaceRef.value.innerHTML = currentHtml.value
  }
  const draft = readDraft()
  if (draft && draft.html !== initialHtml.value) {
    showRestoreDialog.value = true
  }
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  if (autosaveTimer) window.clearTimeout(autosaveTimer)
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

const lastSavedLabel = computed(() => {
  if (!lastSavedAt.value) return ''
  const seconds = Math.round((Date.now() - lastSavedAt.value) / 1000)
  if (seconds < 5) return 'Draft saved just now'
  if (seconds < 60) return `Draft saved ${seconds}s ago`
  return `Draft saved ${Math.round(seconds / 60)}m ago`
})
</script>

<template>
  <div
    class="article-editor-plus"
    :data-skin="props.skin"
    :data-theme="props.theme"
  >
    <CdxMessage
      v-if="showRestoreDialog"
      type="notice"
      :allow-user-dismiss="false"
      class="article-editor-plus__restore"
    >
      <span>You have an unsaved local draft for this page.</span>
      <span class="article-editor-plus__restore-actions">
        <CdxButton @click="onRestoreDraft">
          <CdxIcon :icon="cdxIconHistory" />
          Restore draft
        </CdxButton>
        <CdxButton weight="quiet" @click="onDiscardDraft">
          <CdxIcon :icon="cdxIconTrash" />
          Discard
        </CdxButton>
      </span>
    </CdxMessage>

    <div class="article-editor-plus__toolbar" role="toolbar" aria-label="Editor toolbar">
      <CdxButton weight="quiet" aria-label="Bold" @click="exec('bold')">
        <CdxIcon :icon="cdxIconBold" />
      </CdxButton>
      <CdxButton weight="quiet" aria-label="Italic" @click="exec('italic')">
        <CdxIcon :icon="cdxIconItalic" />
      </CdxButton>
      <CdxButton weight="quiet" aria-label="Heading style" @click="onHeadingClick">
        <CdxIcon :icon="cdxIconTextStyle" />
        <span class="article-editor-plus__toolbar-label">Heading</span>
      </CdxButton>
      <CdxButton weight="quiet" @click="onCiteClick">
        <CdxIcon :icon="cdxIconReference" />
        <span class="article-editor-plus__toolbar-label">Cite</span>
      </CdxButton>
      <CdxButton weight="quiet" @click="onLinkClick">
        <CdxIcon :icon="cdxIconLink" />
        <span class="article-editor-plus__toolbar-label">Link</span>
      </CdxButton>
      <CdxButton
        weight="quiet"
        :class="{ 'is-active': sourceMode }"
        :aria-pressed="sourceMode"
        @click="toggleSourceMode"
      >
        <CdxIcon :icon="cdxIconCode" />
        <span class="article-editor-plus__toolbar-label">{{ sourceMode ? 'Visual' : 'Source' }}</span>
      </CdxButton>
      <div class="article-editor-plus__toolbar-spacer" />
      <CdxButton
        weight="quiet"
        :disabled="!hasUnsavedChanges || sourceMode"
        @click="exec('undo')"
      >
        <CdxIcon :icon="cdxIconUndo" />
        <span class="article-editor-plus__toolbar-label">Undo</span>
      </CdxButton>
    </div>

    <h1 v-if="showEditorHeading" class="article-editor-plus__title mw-first-heading">
      <slot name="heading">{{ props.title }}</slot>
    </h1>

    <div
      v-show="!sourceMode"
      ref="surfaceRef"
      class="article-editor-plus__surface mw-parser-output"
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      :aria-placeholder="props.placeholder"
      :data-placeholder="props.placeholder"
      @input="syncFromSurface"
      @blur="syncFromSurface"
    />

    <textarea
      v-show="sourceMode"
      class="article-editor-plus__source"
      :value="currentHtml"
      :placeholder="props.placeholder"
      spellcheck="false"
      @input="syncFromSource(($event.target as HTMLTextAreaElement).value)"
    />

    <footer class="article-editor-plus__footer">
      <span class="article-editor-plus__indicator" :data-changed="hasUnsavedChanges">
        <CdxIcon :icon="cdxIconLogoWikipedia" />
        <span v-if="hasUnsavedChanges">Unsaved changes</span>
        <span v-else>No changes</span>
        <span v-if="lastSavedLabel" class="article-editor-plus__indicator-detail">
          · {{ lastSavedLabel }}
        </span>
      </span>
      <div class="article-editor-plus__footer-actions">
        <CdxButton weight="quiet" @click="onCancel">Cancel</CdxButton>
        <CdxButton
          action="progressive"
          weight="primary"
          :disabled="!hasUnsavedChanges"
          @click="openPublishDialog"
        >
          Publish changes
        </CdxButton>
      </div>
    </footer>

    <CdxDialog
      v-model:open="showDiffDialog"
      title="Review your edit"
      close-button-label="Close"
      :primary-action="{ label: 'Publish', actionType: 'progressive' }"
      :default-action="{ label: 'Keep editing' }"
      @primary="confirmPublish"
      @default="showDiffDialog = false"
    >
      <p class="article-editor-plus__diff-intro">
        Word-level diff between the saved version and your current draft.
      </p>
      <div class="article-editor-plus__diff">
        <span
          v-for="(seg, i) in diffSegments"
          :key="i"
          :class="['article-editor-plus__diff-segment', `is-${seg.kind}`]"
        >{{ seg.text }}</span>
      </div>
    </CdxDialog>
  </div>
</template>

<style scoped>
.article-editor-plus {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100, 16px);
  border: 1px solid var(--border-color-base, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-base, #fff);
}

.article-editor-plus__restore {
  margin: var(--spacing-100, 16px);
}

.article-editor-plus__restore-actions {
  display: inline-flex;
  gap: var(--spacing-50, 8px);
  margin-inline-start: var(--spacing-100, 16px);
}

.article-editor-plus__toolbar {
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

.article-editor-plus__toolbar-label {
  margin-inline-start: var(--spacing-25, 4px);
}

.article-editor-plus__toolbar-spacer {
  flex: 1 1 auto;
}

/* Horizontal inset for editor chrome; underline + Libertine from global `.mw-first-heading` */
.article-editor-plus__title {
  margin-inline: var(--spacing-150, 24px);
}

.article-editor-plus__surface,
.article-editor-plus__source {
  min-height: 18rem;
  padding: 0 var(--spacing-150, 24px) var(--spacing-150, 24px);
  outline: none;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-medium, 1.6);
}

.article-editor-plus__source {
  border: none;
  background-color: var(--background-color-neutral-subtle, #f8f9fa);
  color: var(--color-base, #202122);
  font-family: var(--font-family-monospace, ui-monospace, monospace);
  resize: vertical;
  white-space: pre;
}

.article-editor-plus__surface:empty::before {
  content: attr(data-placeholder);
  color: var(--color-placeholder, #72777d);
  pointer-events: none;
}

.article-editor-plus__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-100, 16px);
  padding: var(--spacing-75, 12px) var(--spacing-150, 24px);
  border-top: 1px solid var(--border-color-subtle, #c8ccd1);
  background-color: var(--background-color-neutral-subtle, #f8f9fa);
}

.article-editor-plus__indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  font-size: var(--font-size-small, 0.875rem);
  color: var(--color-subtle, #54595d);
}

.article-editor-plus__indicator[data-changed='true'] {
  color: var(--color-warning, #ac6600);
}

.article-editor-plus__indicator-detail {
  color: var(--color-subtle, #54595d);
}

.article-editor-plus__footer-actions {
  display: inline-flex;
  gap: var(--spacing-50, 8px);
}

.article-editor-plus__diff-intro {
  margin: 0 0 var(--spacing-100, 16px);
  color: var(--color-subtle, #54595d);
  font-size: var(--font-size-small, 0.875rem);
}

.article-editor-plus__diff {
  padding: var(--spacing-100, 16px);
  border: 1px solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-neutral-subtle, #f8f9fa);
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-family-monospace, ui-monospace, monospace);
  font-size: var(--font-size-small, 0.875rem);
  line-height: 1.6;
}

.article-editor-plus__diff-segment.is-add {
  background-color: var(--background-color-success-subtle, #d5fdf4);
  color: var(--color-content-added, #096450);
}

.article-editor-plus__diff-segment.is-remove {
  background-color: var(--background-color-destructive-subtle, #ffe9e5);
  color: var(--color-content-removed, #b32424);
  text-decoration: line-through;
}
</style>
