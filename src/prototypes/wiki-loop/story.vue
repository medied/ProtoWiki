<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CdxMessage } from '@wikimedia/codex'

import Article from '@/components/Article.vue'
import ChromeWrapper from '@/components/ChromeWrapper.vue'
import WikiLoopOverlay from './WikiLoopOverlay.vue'

definePage({
  meta: {
    title: 'Wiki Loop — Story',
    description: 'The causality-loop article + overlay experience.',
  },
})

// ── Article title from URL param ────────────────────────────────────
const route = useRoute()
const articleTitle = computed(() => {
  const q = route.query.article
  return typeof q === 'string' && q.trim() ? q.trim() : 'Caracas'
})

// ── Skin from URL param (?skin=desktop|mobile) ───────────────────────
const skinProp = computed(() => {
  const s = route.query.skin
  return typeof s === 'string' && (s === 'desktop' || s === 'mobile') ? s : undefined
})

// ── Spotlight ───────────────────────────────────────────────────────
let spotlightEl: Element | null = null

function findGeographyParagraph(): Element | null {
  const headings = Array.from(document.querySelectorAll('.mw-parser-output h2'))
  const geoH2 = headings.find((h2) =>
    (h2 as HTMLElement).innerText?.replace(/\[.*?\]/g, '').trim().toLowerCase() === 'geography'
  )
  if (!geoH2) return null
  const startEl = geoH2.closest('.mw-heading') ?? geoH2
  let sibling = startEl.nextElementSibling
  while (sibling) {
    if (sibling.tagName === 'P') return sibling
    const p = sibling.querySelector('p')
    if (p) return p
    if (/^H[1-6]$/.test(sibling.tagName)) break
    sibling = sibling.nextElementSibling
  }
  return null
}

function findFirstSectionParagraph(): Element | null {
  const h2 = document.querySelector('.mw-parser-output h2')
  if (!h2) return null
  const startEl = h2.closest('.mw-heading') ?? h2
  let sibling = startEl.nextElementSibling
  while (sibling) {
    if (sibling.tagName === 'P') return sibling
    const p = sibling.querySelector('p')
    if (p) return p
    if (/^H[1-6]$/.test(sibling.tagName)) break
    sibling = sibling.nextElementSibling
  }
  return null
}

function applySpotlight() {
  removeSpotlight()
  const target =
    findGeographyParagraph() ??
    findFirstSectionParagraph() ??
    document.querySelector('.mw-parser-output p')
  if (!target) return
  spotlightEl = target
  ;(target as HTMLElement).classList.add('wl-spotlight')
}

function removeSpotlight() {
  if (spotlightEl) {
    ;(spotlightEl as HTMLElement).classList.remove('wl-spotlight')
    spotlightEl = null
  }
}

// ── Section title ────────────────────────────────────────────────────
const sectionTitle = ref('')

function readSectionTitle() {
  const h2 = document.querySelector('.mw-parser-output h2')
  if (h2) {
    sectionTitle.value = (h2 as HTMLElement).innerText?.replace(/\[.*?\]/g, '').trim() ?? ''
  }
}

// ── Overlay + breadcrumb state ───────────────────────────────────────
const overlayVisible = ref(false)
const breadcrumbVisible = ref(false)
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null

function showOverlay() {
  document.body.style.overflow = 'hidden'
  applySpotlight()
  overlayVisible.value = true
  autoDismissTimer = setTimeout(() => onDismiss(), 3000)
}

function onDismiss() {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer)
    autoDismissTimer = null
  }
  overlayVisible.value = false
  document.body.style.overflow = ''
  removeSpotlight()
  breadcrumbVisible.value = true
}

function onReopen() {
  breadcrumbVisible.value = false
  nextTick(() => showOverlay())
}

function onCtaClick() {
  overlayVisible.value = false
  breadcrumbVisible.value = false
  document.body.style.overflow = ''
  removeSpotlight()
  nextTick(() => {
    const target =
      findGeographyParagraph() ??
      findFirstSectionParagraph() ??
      document.querySelector('.mw-parser-output')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      ;(target as HTMLElement).classList.add('wl-highlight-flash')
      setTimeout(() => (target as HTMLElement).classList.remove('wl-highlight-flash'), 1800)
    }
  })
}

function onFollowupCtaClick() {
  window.location.href = 'https://es.wikipedia.org/wiki/Especial:P%C3%A1gina_inicial'
}

// ── Boot ─────────────────────────────────────────────────────────────
onMounted(async () => {
  await nextTick()
  let attempts = 0
  const waitForContent = setInterval(() => {
    attempts++
    const content = document.querySelector('.mw-parser-output')
    if (content || attempts > 20) {
      clearInterval(waitForContent)
      readSectionTitle()
      const target =
        findGeographyParagraph() ??
        findFirstSectionParagraph() ??
        document.querySelector('.mw-parser-output p')
      if (target) target.scrollIntoView({ behavior: 'instant', block: 'center' })
      setTimeout(() => showOverlay(), 1200)
    }
  }, 150)
})

watch(articleTitle, () => {
  overlayVisible.value = false
  breadcrumbVisible.value = false
  removeSpotlight()
  sectionTitle.value = ''
})
</script>

<template>
  <ChromeWrapper :skin="skinProp">
    <div class="wl-container">
      <Article :title="articleTitle" />
    </div>
  </ChromeWrapper>

  <WikiLoopOverlay
    :visible="overlayVisible"
    @dismiss="onDismiss"
    @cta-click="onCtaClick"
  />

  <Transition name="followup-slide">
    <div v-if="breadcrumbVisible" class="wl-followup">
      <CdxMessage
        type="notice"
        :allow-user-dismiss="true"
        dismiss-button-label="Dismiss"
        action-button-label="Go to your dashboard"
        @user-dismissed="breadcrumbVisible = false"
        @action-button-click="onFollowupCtaClick"
      >
        Continue shaping knowledge.
      </CdxMessage>
    </div>
  </Transition>
</template>

<style>
.wl-spotlight {
  position: relative;
  z-index: 201;
  border-radius: 2px;
  background-color: var(--background-color-base);
  overflow: hidden;
}

/*
 * Mobile: un-float thumbnail figures so they stack as full-width blocks above
 * the paragraph instead of beside it. Minerva floats figures right, which
 * shrinks the paragraph into a narrow column and breaks the spotlight effect.
 * In Parsoid HTML the <figure> already appears before <p> in source order, so
 * removing the float is enough — no DOM reordering needed.
 */
.wl-container .article-content[data-skin='mobile'] .mw-parser-output figure {
  float: none !important;
  display: block;
  width: 100%;
  max-width: 100%;
  margin-inline: 0;
  clear: both;
}

.wl-container .article-content[data-skin='mobile'] .mw-parser-output figure a {
  display: block;
}

.wl-container .article-content[data-skin='mobile'] .mw-parser-output figure img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
}

.wl-container .article-content[data-skin='mobile'] .mw-parser-output figure figcaption {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
  text-align: center;
}

.wl-highlight-flash {
  animation: wl-flash 1.8s ease forwards;
}

@keyframes wl-flash {
  0%   { background-color: transparent; }
  15%  { background-color: rgba(51, 102, 204, 0.15); }
  100% { background-color: transparent; }
}
</style>

<style scoped>
.wl-container {
  padding: 0 var(--spacing-100);
}

.wl-followup {
  position: fixed;
  bottom: var(--spacing-200, 32px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  width: min(520px, calc(100vw - 32px));
  pointer-events: all;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>

<style>
.followup-slide-enter-active {
  transition: opacity 300ms ease, transform 300ms ease;
}

.followup-slide-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.followup-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

.followup-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
