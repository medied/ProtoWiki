<script setup lang="ts">
import { CdxButton, CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import { cdxIconEllipsis, cdxIconHeart, cdxIconHistory } from '@wikimedia/codex-icons'
import {
  computed,
  createApp,
  defineComponent,
  h,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  type Ref,
} from 'vue'

import Article from '@/components/Article.vue'
import ChromeWrapper from '@/components/ChromeWrapper.vue'
import RecentEditLoopOverlay from './RecentEditLoopOverlay.vue'
import {
  removeHeartConfettiLayers,
  spawnHeartConfettiFromButton,
} from '@/lib/protowikiHeartConfetti'
import { globalSkin, PROTOWIKI_CHROME_SKIN } from '@/lib/theming'

definePage({
  meta: {
    title: 'Recently edited paragraph',
    description:
      'Wet Leg mock article with one highlighted paragraph and a small attribution line below it.',
  },
})

const ATTRIBUTION_CLASS = 'protowiki-demo-para-attribution'

const highlightParaSelector =
  '.mw-parser-output section[data-mw-section-id="1"] section[data-mw-section-id="2"] > p:nth-of-type(1)'

const inheritedChromeSkin = inject(PROTOWIKI_CHROME_SKIN)
const articleContainerSkin = computed(() => inheritedChromeSkin?.value ?? globalSkin.value)

const articleContainerRef = ref<HTMLElement | null>(null)
let observer: MutationObserver | null = null
let resizeObserver: ResizeObserver | null = null

const overlayVisible = ref(false)
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null
let overlayTriggered = false

const TODEPOND_USER_HREF = 'https://en.wikipedia.org/wiki/User:Todepond'

/** Real enwiki diff on [[Wet Leg]] for the "Early lives and formation" subsection (matches highlighted paragraph). */
const WET_LEG_REVIEW_DIFF_HREF =
  'https://en.wikipedia.org/w/index.php?title=Wet_Leg&diff=1347674623&oldid=1346958365'

/** Section edit for "Early lives and formation" (`data-mw-section-id="2"` in the Wet Leg snapshot). */
const WET_LEG_SECTION_EDIT_HREF =
  'https://en.wikipedia.org/w/index.php?title=Wet_Leg&action=edit&section=2'

/** Sub-app hosts for attribution toolbar (detached DOM cleaned in onMutation). */
const attributionToolbarApps = new Map<HTMLElement, ReturnType<typeof createApp>>()

const overflowMenuItems = [
  { value: 'thanks', label: 'Thank' },
  { value: 'review', label: 'Review' },
  { value: 'edit-further', label: 'Edit' },
  { value: 'dismiss', label: 'Dismiss' },
]

const highlightDismissed = ref(false)

function showOverlay() {
  if (overlayTriggered || highlightDismissed.value) return
  const root = articleContainerRef.value
  if (!root) return
  const p = root.querySelector<HTMLElement>(highlightParaSelector)
  const attn = root.querySelector<HTMLElement>(`.${ATTRIBUTION_CLASS}`)
  if (!p || !attn) return

  p.scrollIntoView({ behavior: 'instant', block: 'center' })
  p.classList.add('protowiki-demo-spotlight')
  attn.classList.add('protowiki-demo-spotlight')
  document.body.style.overflow = 'hidden'
  overlayVisible.value = true
  overlayTriggered = true
  autoDismissTimer = setTimeout(() => onOverlayDismiss(), 3000)
}

function onOverlayDismiss() {
  if (autoDismissTimer) { clearTimeout(autoDismissTimer); autoDismissTimer = null }
  overlayVisible.value = false
  const root = articleContainerRef.value
  if (root) {
    root.querySelector<HTMLElement>(highlightParaSelector)?.classList.remove('protowiki-demo-spotlight')
    root.querySelector<HTMLElement>(`.${ATTRIBUTION_CLASS}`)?.classList.remove('protowiki-demo-spotlight')
  }
  document.body.style.overflow = ''
}

function toggleHeartThanks(thanksActive: Ref<boolean>, heartButtonRoot: Ref<HTMLElement | null>) {
  const wasActive = thanksActive.value
  thanksActive.value = !thanksActive.value
  if (thanksActive.value && !wasActive) {
    void nextTick(() => {
      const btn = heartButtonRoot.value
      if (btn) spawnHeartConfettiFromButton(btn)
    })
  }
}

function vnodeComponentRoot(el: unknown): HTMLElement | null {
  if (!el) return null
  if (el instanceof HTMLElement) return el
  if (typeof el === 'object' && el !== null && '$el' in el) {
    const root = (el as { $el: unknown }).$el
    return root instanceof HTMLElement ? root : null
  }
  return null
}

const AttributionToolbar = defineComponent({
  name: 'AttributionToolbar',
  props: {
    onDismiss: {
      type: Function,
      required: true,
    },
  },
  setup(props: { onDismiss: () => void }) {
    const menuSelected = ref<string | null>(null)
    const thanksActive = ref(false)
    const heartButtonRoot = ref<HTMLElement | null>(null)

    function handleOverflowSelected(v: string | null) {
      menuSelected.value = v
      if (!v) return

      if (v === 'thanks') {
        toggleHeartThanks(thanksActive, heartButtonRoot)
      } else if (v === 'review') {
        window.open(WET_LEG_REVIEW_DIFF_HREF, '_blank', 'noopener,noreferrer')
      } else if (v === 'edit-further') {
        window.open(WET_LEG_SECTION_EDIT_HREF, '_blank', 'noopener,noreferrer')
      } else if (v === 'dismiss') {
        props.onDismiss()
      }

      void nextTick(() => {
        menuSelected.value = null
      })
    }

    return () =>
      h('span', { class: 'protowiki-demo-para-attribution__toolbar' }, [
        h(
          CdxButton,
          {
            ref: (el: unknown) => {
              heartButtonRoot.value = vnodeComponentRoot(el)
            },
            weight: 'quiet',
            size: 'small',
            class: [
              'protowiki-demo-para-attribution__heart-btn',
              thanksActive.value
                ? 'protowiki-demo-para-attribution__heart-btn--filled'
                : 'protowiki-demo-para-attribution__heart-btn--outline',
            ],
            'aria-pressed': thanksActive.value ? 'true' : 'false',
            'aria-label': thanksActive.value ? 'Remove thanks' : 'Give thanks',
            onClick: () => {
              toggleHeartThanks(thanksActive, heartButtonRoot)
            },
          },
          {
            default: () => h(CdxIcon, { icon: cdxIconHeart, size: 'small' }),
          },
        ),
        h(
          CdxMenuButton,
          {
            weight: 'quiet',
            class: 'protowiki-demo-para-attribution__overflow-btn',
            selected: menuSelected.value,
            'onUpdate:selected': handleOverflowSelected,
            menuItems: overflowMenuItems,
            'aria-label': 'More options',
          },
          {
            default: () => h(CdxIcon, { icon: cdxIconEllipsis, size: 'small' }),
          },
        ),
      ])
  },
})

function cleanupDetachedAttributionToolbars() {
  for (const [mountEl, app] of attributionToolbarApps) {
    if (!mountEl.isConnected) {
      app.unmount()
      attributionToolbarApps.delete(mountEl)
    }
  }
}

function unmountAllAttributionToolbars() {
  for (const [, app] of attributionToolbarApps) {
    app.unmount()
  }
  attributionToolbarApps.clear()
}

function dismissAttributionToolbar(actionsMountEl: HTMLElement, attributionLineEl: HTMLElement) {
  highlightDismissed.value = true
  const app = attributionToolbarApps.get(actionsMountEl)
  if (app) {
    app.unmount()
    attributionToolbarApps.delete(actionsMountEl)
  }
  if (attributionLineEl.isConnected) {
    attributionLineEl.remove()
  }
}

function mountAttributionToolbar(actionsMountEl: HTMLElement, attributionLineEl: HTMLElement) {
  if (attributionToolbarApps.has(actionsMountEl)) return

  const app = createApp(AttributionToolbar, {
    onDismiss: () => dismissAttributionToolbar(actionsMountEl, attributionLineEl),
  })
  app.mount(actionsMountEl)
  attributionToolbarApps.set(actionsMountEl, app)
}

/**
 * Match the tinted bar to the paragraph highlight. Mobile uses `outline` outside the
 * border box (inflate). Desktop uses an in-flow `border` on the paragraph — `getBoundingClientRect`
 * already matches the outer border box, so inflate is 0.
 */
function syncAttributionLayout() {
  const root = articleContainerRef.value
  if (!root) return

  const p = root.querySelector<HTMLElement>(highlightParaSelector)
  const attn = p?.nextElementSibling
  if (
    !p?.parentElement ||
    !(attn instanceof HTMLElement) ||
    !attn.classList.contains(ATTRIBUTION_CLASS)
  ) {
    return
  }

  const skin = root.getAttribute('data-skin') === 'mobile' ? 'mobile' : 'desktop'

  const parent = p.parentElement as HTMLElement
  const pRect = p.getBoundingClientRect()
  const parentRect = parent.getBoundingClientRect()
  const vw = root.ownerDocument.defaultView
  const pst = vw?.getComputedStyle(p)

  let inflate = 0
  if (skin === 'mobile') {
    let outlineOffsetPx = pst ? Number.parseFloat(pst.outlineOffset) : NaN
    let outlineWidthPx = pst ? Number.parseFloat(pst.outlineWidth) : NaN
    if (Number.isNaN(outlineOffsetPx)) outlineOffsetPx = 6
    if (Number.isNaN(outlineWidthPx)) outlineWidthPx = 2
    inflate = outlineOffsetPx + outlineWidthPx
  }

  const widthPx = pRect.width + 2 * inflate

  const parentDir = vw?.getComputedStyle(parent).direction === 'rtl' ? 'rtl' : 'ltr'
  const insetStart =
    parentDir === 'rtl'
      ? parentRect.right - pRect.right - inflate
      : pRect.left - parentRect.left - inflate

  const finalWidth = Math.round(widthPx * 1000) / 1000

  attn.style.boxSizing = 'border-box'
  attn.style.width = `${finalWidth}px`
  attn.style.marginInlineStart = `${Math.round(insetStart * 1000) / 1000}px`
  attn.style.marginInlineEnd = '0'
}

function scheduleSyncAttributionLayout() {
  requestAnimationFrame(() => {
    syncAttributionLayout()
    requestAnimationFrame(() => syncAttributionLayout())
  })
}

function insertAttribution() {
  const root = articleContainerRef.value
  if (!root) return
  if (highlightDismissed.value) return

  const p = root.querySelector<HTMLElement>(highlightParaSelector)
  if (!p?.parentElement) return

  const next = p.nextElementSibling
  if (next?.classList.contains(ATTRIBUTION_CLASS)) return

  const line = document.createElement('div')
  line.className = ATTRIBUTION_CLASS

  const row = document.createElement('span')
  row.className = 'protowiki-demo-para-attribution__row'

  const iconWrap = document.createElement('span')
  iconWrap.className = 'protowiki-demo-para-attribution__icon'
  iconWrap.setAttribute('aria-hidden', 'true')
  iconWrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">${cdxIconHistory}</svg>`

  const text = document.createElement('span')
  text.className = 'protowiki-demo-para-attribution__text'
  text.append(document.createTextNode('Edited yesterday by '))

  const userLink = document.createElement('a')
  userLink.className = 'protowiki-demo-para-attribution__user'
  userLink.href = TODEPOND_USER_HREF
  userLink.rel = 'noopener noreferrer'
  userLink.target = '_blank'
  userLink.textContent = 'Todepond'

  text.appendChild(userLink)

  const actionsMount = document.createElement('span')
  actionsMount.className = 'protowiki-demo-para-attribution__actions'

  row.appendChild(iconWrap)
  row.appendChild(text)
  row.appendChild(actionsMount)
  line.appendChild(row)

  p.insertAdjacentElement('afterend', line)

  mountAttributionToolbar(actionsMount, line)
  scheduleSyncAttributionLayout()

  if (!overlayTriggered) setTimeout(() => showOverlay(), 1200)
}

function onMutation() {
  cleanupDetachedAttributionToolbars()
  insertAttribution()
  scheduleSyncAttributionLayout()
}

onMounted(() => {
  void nextTick(() => {
    insertAttribution()

    const el = articleContainerRef.value
    if (!el) return

    observer = new MutationObserver(() => {
      onMutation()
    })
    observer.observe(el, { childList: true, subtree: true })

    resizeObserver = new ResizeObserver(() => {
      scheduleSyncAttributionLayout()
    })
    resizeObserver.observe(el)

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', scheduleSyncAttributionLayout)
      window.visualViewport?.addEventListener('resize', scheduleSyncAttributionLayout)
    }

    scheduleSyncAttributionLayout()
  })
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null

  resizeObserver?.disconnect()
  resizeObserver = null

  if (autoDismissTimer) { clearTimeout(autoDismissTimer); autoDismissTimer = null }
  if (overlayVisible.value) document.body.style.overflow = ''

  removeHeartConfettiLayers()
  unmountAllAttributionToolbars()

  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', scheduleSyncAttributionLayout)
    window.visualViewport?.removeEventListener('resize', scheduleSyncAttributionLayout)
  }
})
</script>

<template>
  <ChromeWrapper>
    <div
      ref="articleContainerRef"
      class="article-container"
      :class="{ 'protowiki-demo-attribution-dismissed': highlightDismissed }"
      :data-skin="articleContainerSkin"
    >
      <Article content-type="mock" />
    </div>
    <RecentEditLoopOverlay :visible="overlayVisible" @dismiss="onOverlayDismiss" />
  </ChromeWrapper>
</template>

<style scoped>
.article-container {
  padding: 0 var(--spacing-100);
}

/*
 * [ArticleLiveContent] forces `overflow-x: auto` on desktop `.mw-parser-output` for wide tables.
 * Negative margins on the highlight pull the bordered paragraph + bar past that box; without
 * `visible`, the left (and corners of top/bottom) borders are clipped.
 */
.article-container[data-skin='desktop']
  :deep(.article-content[data-skin='desktop'] .mw-parser-output) {
  overflow-x: visible;
}

/* Shared attribution strip — skin-specific layout below. */
.article-container :deep(.protowiki-demo-para-attribution) {
  padding-block: 4px;
  background-color: var(--background-color-progressive-subtle);
  font-size: var(--font-size-x-small);
  line-height: var(--line-height-small, 1.4);
  color: var(--color-subtle);
  border-radius: 2px;
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
  border: 1px solid var(--background-color-progressive-subtle);
}

.article-container[data-skin='mobile'] :deep(.protowiki-demo-para-attribution) {
  display: block;
  clear: both;
  margin-block: var(--spacing-35, 6px) var(--spacing-100, 16px);
  margin-inline-end: 0;
  padding-left: 12px;
  padding-right: 4px;
}

.article-container[data-skin='desktop'] :deep(.protowiki-demo-para-attribution) {
  display: flow-root;
  margin-block-start: 0;
  margin-block-end: var(--spacing-100, 16px);
  margin-inline: 0;
  max-width: none;
  padding-inline: 12px;
  padding-right: 4px;
}

.article-container :deep(.protowiki-demo-para-attribution__row) {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-35, 6px);
  width: 100%;
  box-sizing: border-box;
}

.article-container :deep(.protowiki-demo-para-attribution__icon) {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--color-base);
}

.article-container :deep(.protowiki-demo-para-attribution__icon svg) {
  display: block;
}

.article-container :deep(.protowiki-demo-para-attribution__text) {
  flex: 1;
  min-width: 0;
}

.article-container :deep(.protowiki-demo-para-attribution__actions) {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
}

.article-container :deep(.protowiki-demo-para-attribution__toolbar) {
  display: inline-flex;
  align-items: center;
  /* gap: 2px; */
}

/* Icon-only quiet controls — slightly larger than the previous x-small strip. */
.article-container :deep(.protowiki-demo-para-attribution__heart-btn.cdx-button) {
  /* Codex buttons use overflow:hidden (ellipsis); outline stroke extends past the glyph bbox. */
  overflow: visible;
  min-height: 1.75rem;
  min-width: 1.75rem;
  padding-inline: var(--spacing-35, 6px);
  padding-block: var(--spacing-35, 6px);
}

/* Pointer/tap focus shows no ring; keyboard :focus-visible keeps Codex focus affordance. */
.article-container
  :deep(.protowiki-demo-para-attribution__heart-btn.cdx-button:focus:not(:focus-visible)) {
  outline: none !important;
  box-shadow: none !important;
  border-color: var(--border-color-transparent, transparent) !important;
}

.article-container :deep(.protowiki-demo-para-attribution__heart-btn .cdx-icon),
.article-container :deep(.protowiki-demo-para-attribution__heart-btn .cdx-icon svg) {
  overflow: visible;
}

/* Outline heart + overflow: neutral grey (quiet toolbar). Filled thanks heart: progressive blue (matches confetti). */
.article-container :deep(.protowiki-demo-para-attribution__heart-btn--outline .cdx-icon),
.article-container :deep(.protowiki-demo-para-attribution__overflow-btn .cdx-icon) {
  color: var(--color-neutral);
}

.article-container :deep(.protowiki-demo-para-attribution__heart-btn--filled .cdx-icon) {
  color: var(--color-progressive);
}

/* Codex only ships a filled heart path; draw it as outline until toggled on. */
.article-container :deep(.protowiki-demo-para-attribution__heart-btn--outline .cdx-icon svg path) {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.15;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.article-container :deep(.protowiki-demo-para-attribution__heart-btn--filled .cdx-icon svg path) {
  stroke: none;
}

.article-container :deep(.protowiki-demo-para-attribution__overflow-btn .cdx-button) {
  min-height: 1.75rem;
  min-width: 1.75rem;
  padding-inline: var(--spacing-35, 6px);
  padding-block: var(--spacing-35, 6px);
}

/*
 * Global `ul, ol` / `li` rules add padding-inline-start and vertical margins; Codex menus use
 * `ul.cdx-menu__listbox` > `li.cdx-menu-item` and inherit the extra gap above/below the list.
 */
.article-container :deep(.cdx-menu__listbox) {
  margin-inline-start: 0;
  margin-block: 0;
  padding-inline-start: 0;
}

.article-container :deep(.cdx-menu__listbox .cdx-menu-item) {
  margin-block: 0;
}

/*
 * CdxMenuButton uses useFloatingMenu({ useAvailableWidth: true, offset: 4 }), which pins a
 * very wide width on the menu shell. `min-width: 0` + `width: max-content` fixes that, but
 * text-only rows then hug labels; add a soft floor so the panel does not feel cramped.
 */
.article-container :deep(.protowiki-demo-para-attribution__overflow-btn .cdx-menu-button__menu) {
  max-width: none !important;
}

.article-container :deep(.protowiki-demo-para-attribution__overflow-btn .cdx-menu) {
  width: max-content !important;
  max-width: none !important;
  /* Codex offset is 4px; -4px can still leave a 1px subpixel seam vs the attribution strip. */
  margin-top: -5px !important;
}

.article-container
  :deep(.protowiki-demo-para-attribution__overflow-btn .cdx-menu-item .cdx-menu-item__content) {
  flex-wrap: nowrap;
  white-space: nowrap;
  word-break: normal;
  overflow-wrap: normal;
}

.article-container :deep(.protowiki-demo-para-attribution__user),
.article-container :deep(.protowiki-demo-para-attribution__user:visited) {
  color: var(--color-progressive);
  text-decoration: none;
}

.article-container :deep(.protowiki-demo-para-attribution__user:hover) {
  opacity: 0.85;
}

/* Mobile: unchanged from pre–float-fix presentation (`outline` + negative margin). */
.article-container[data-skin='mobile']
  :deep(
    .mw-parser-output
      section[data-mw-section-id='1']
      section[data-mw-section-id='2']
      > p:nth-of-type(1)
  ) {
  display: block;
  outline: 1px solid var(--border-color-progressive);
  outline-offset: 0;
  border-radius: 2px;
  padding: 8px;
  padding-top: 4px;
  padding-bottom: 6px;
  margin: -8px;
  margin-bottom: -6px;
  margin-top: -6px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
}

/*
 * Desktop: `border` instead of `outline` (avoids clip under `overflow-x` on `.mw-parser-output`).
 * `flow-root` keeps the frame in the column *beside* the lead infobox so borders/background do
 * not extend under the float (which would read as overlap). Trade-off: the box matches that
 * narrow column width, not the full line length once text clears the float below.
 * Horizontal margins stay 0 so alignment matches headings and the next paragraph; only vertical
 * rhythm is tightened slightly.
 */
.article-container[data-skin='desktop']
  :deep(
    .mw-parser-output
      section[data-mw-section-id='1']
      section[data-mw-section-id='2']
      > p:nth-of-type(1)
  ) {
  display: flow-root;
  box-sizing: border-box;
  outline: none;
  border: 1px solid var(--border-color-progressive);
  border-bottom: none;
  border-radius: 2px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  padding: 8px;
  padding-top: 4px;
  padding-bottom: 6px;
  margin: 0;
  margin-block-end: 0;
}

/* After Dismiss: strip prototype frame from the paragraph (attribution node is removed in JS). */
.article-container.protowiki-demo-attribution-dismissed[data-skin='mobile']
  :deep(
    .mw-parser-output
      section[data-mw-section-id='1']
      section[data-mw-section-id='2']
      > p:nth-of-type(1)
  ) {
  outline: none;
  border: none;
  border-radius: 0;
  padding: 0;
  margin: 0;
}

.article-container.protowiki-demo-attribution-dismissed[data-skin='desktop']
  :deep(
    .mw-parser-output
      section[data-mw-section-id='1']
      section[data-mw-section-id='2']
      > p:nth-of-type(1)
  ) {
  display: block;
  box-sizing: border-box;
  outline: none;
  border: none;
  border-radius: 0;
  padding: 0;
  margin: 0;
}
</style>

<!-- Teleported confetti layer is appended to document.body; keep unscoped. -->
<style>
.protowiki-demo-spotlight {
  position: relative;
  z-index: 201;
  background-color: var(--background-color-base);
}

.protowiki-demo-heart-confetti-layer {
  position: fixed;
  inset: 0;
  z-index: 10050;
  overflow: visible;
  pointer-events: none;
}

.protowiki-demo-heart-confetti-piece {
  position: fixed;
  margin: 0;
  pointer-events: none;
  will-change: transform, opacity;
}

.protowiki-demo-heart-confetti-piece__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.protowiki-demo-heart-confetti-piece__glyph svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: currentColor;
}
</style>