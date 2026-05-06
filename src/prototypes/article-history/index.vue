<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CdxButton, CdxProgressBar, CdxMessage } from '@wikimedia/codex'

import ChromeWrapper from '@/components/ChromeWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import HistoryLoopOverlay from './HistoryLoopOverlay.vue'

definePage({
  meta: {
    title: 'Article History',
    description: 'Page revision history — live data from the Wikipedia REST API.',
  },
})

// ── Article title from URL param ──────────────────────────────────────
const route = useRoute()
const articleTitle = computed(() => {
  const q = route.query.article
  return typeof q === 'string' && q.trim() ? q.trim() : 'Albert_Einstein'
})
const displayTitle = computed(() => articleTitle.value.replace(/_/g, ' '))

// ── Types ─────────────────────────────────────────────────────────────
interface Revision {
  id: number
  timestamp: string
  minor: boolean
  user: { id?: number; name: string }
  size: number
  comment: string
  delta?: number
}

// ── State ─────────────────────────────────────────────────────────────
const revisions = ref<Revision[]>([])
const loading = ref(false)
const error = ref('')
const olderCursor = ref<string | null>(null)
const loadingMore = ref(false)
const selectedIds = ref<number[]>([])

// ── Collaboration chain ───────────────────────────────────────────────
const chainRangeIds = ref<Set<number>>(new Set())
const chainNodeIds = ref<Set<number>>(new Set())
const chainUsers = ref<string[]>([])
const overlayVisible = ref(false)
const followupVisible = ref(false)
let chainTimer: ReturnType<typeof setTimeout> | null = null
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null
const chainNodePositions = ref<{ cx: number; cyTop: number; cyBottom: number }[]>([])
const threadVisible = ref(false)

function clearChain() {
  if (chainTimer) { clearTimeout(chainTimer); chainTimer = null }
  if (autoDismissTimer) { clearTimeout(autoDismissTimer); autoDismissTimer = null }
  document.body.style.overflow = ''
  chainRangeIds.value = new Set()
  chainNodeIds.value = new Set()
  chainUsers.value = []
  overlayVisible.value = false
  followupVisible.value = false
}

function computeChain() {
  const revs = revisions.value
  if (!revs.length) return
  // Collect first 4 distinct usernames (newest-first)
  const seen = new Set<string>()
  const chain: string[] = []
  for (const rev of revs) {
    if (!seen.has(rev.user.name)) {
      seen.add(rev.user.name)
      chain.push(rev.user.name)
      if (chain.length === 4) break
    }
  }
  if (chain.length < 2) return
  const chainSet = new Set(chain)
  // Index span: first to last occurrence of any chain user
  let firstIdx = -1
  let lastIdx = -1
  for (let i = 0; i < revs.length; i++) {
    if (chainSet.has(revs[i].user.name)) {
      if (firstIdx === -1) firstIdx = i
      lastIdx = i
    }
  }
  const rangeIds = new Set<number>()
  const nodeIds = new Set<number>()
  for (let i = firstIdx; i <= lastIdx; i++) {
    rangeIds.add(revs[i].id)
    if (chainSet.has(revs[i].user.name)) nodeIds.add(revs[i].id)
  }
  chainUsers.value = chain
  chainRangeIds.value = rangeIds
  chainNodeIds.value = nodeIds
  chainTimer = setTimeout(() => { overlayVisible.value = true }, 1200)
}

function onDismiss() {
  if (autoDismissTimer) { clearTimeout(autoDismissTimer); autoDismissTimer = null }
  document.body.style.overflow = ''
  threadVisible.value = false
  chainNodePositions.value = []
  overlayVisible.value = false
  followupVisible.value = true
}

function onFollowupCta() {
  window.open(
    `https://en.wikipedia.org/wiki/Special:EditPage/${encodeURIComponent(articleTitle.value)}`,
    '_blank',
    'noopener,noreferrer',
  )
}

watch(overlayVisible, async (val) => {
  if (!val) {
    document.body.style.overflow = ''
    threadVisible.value = false
    chainNodePositions.value = []
    return
  }
  document.body.style.overflow = 'hidden'
  autoDismissTimer = setTimeout(() => onDismiss(), 3000)
  await nextTick()
  const els = Array.from(document.querySelectorAll('.ah-user--highlighted'))
  if (els.length < 2) return
  chainNodePositions.value = els.map(el => {
    const r = (el as HTMLElement).getBoundingClientRect()
    return {
      cx: Math.round(r.left + r.width / 2),
      cyTop: Math.round(r.top),
      cyBottom: Math.round(r.bottom),
    }
  })
  requestAnimationFrame(() => { threadVisible.value = true })
})

// ── Fetch helpers ─────────────────────────────────────────────────────
function computeDeltas(incoming: Revision[], prevOlderSize?: number): Revision[] {
  // Revisions are newest-first. delta = this.size - next_older.size
  return incoming.map((r, i) => {
    const olderSize = i < incoming.length - 1 ? incoming[i + 1].size : prevOlderSize
    return { ...r, delta: olderSize !== undefined ? r.size - olderSize : undefined }
  })
}

async function fetchPage(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'Api-User-Agent': 'ProtoWiki/1.0 (https://github.com/wikimedia/ProtoWiki)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function load() {
  clearChain()
  loading.value = true
  error.value = ''
  revisions.value = []
  olderCursor.value = null
  selectedIds.value = []
  try {
    const data = await fetchPage(
      `https://en.wikipedia.org/w/rest.php/v1/page/${encodeURIComponent(articleTitle.value)}/history`,
    )
    revisions.value = computeDeltas(data.revisions ?? [])
    olderCursor.value = data.older ?? null
    computeChain()
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load history'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!olderCursor.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const data = await fetchPage(olderCursor.value)
    const incoming: Revision[] = data.revisions ?? []
    // Now that we know the next-older revision's size, fix the tail delta
    if (revisions.value.length && incoming.length) {
      const last = revisions.value[revisions.value.length - 1]
      last.delta = last.size - incoming[0].size
    }
    revisions.value.push(...computeDeltas(incoming))
    olderCursor.value = data.older ?? null
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load more'
  } finally {
    loadingMore.value = false
  }
}

// ── Selection (up to 2 for diff comparison) ───────────────────────────
function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx !== -1) {
    selectedIds.value.splice(idx, 1)
  } else if (selectedIds.value.length < 2) {
    selectedIds.value.push(id)
  }
}

function compareSelected() {
  if (selectedIds.value.length !== 2) return
  const [older, newer] = [...selectedIds.value].sort((a, b) => a - b)
  window.open(
    `https://en.wikipedia.org/w/index.php?diff=${newer}&oldid=${older}`,
    '_blank',
    'noopener,noreferrer',
  )
}

// ── Formatting ────────────────────────────────────────────────────────
function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const hh = d.getUTCHours().toString().padStart(2, '0')
  const mm = d.getUTCMinutes().toString().padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
  const day = d.getUTCDate()
  const year = d.getUTCFullYear()
  return `${hh}:${mm}, ${day} ${month} ${year}`
}

function formatComment(comment: string): string {
  // Wikipedia renders /* Section */ as an arrow navigation hint
  return comment.replace(/\/\* (.+?) \*\//g, '→$1:')
}

onMounted(load)
watch(articleTitle, load)
</script>

<template>
  <ChromeWrapper>
    <SpecialPageWrapper :title="`Revision history of ${displayTitle}`">
      <template #actions>
        <CdxButton
          action="progressive"
          weight="primary"
          :disabled="selectedIds.length !== 2"
          @click="compareSelected"
        >
          Compare selected revisions
        </CdxButton>
      </template>

      <CdxProgressBar v-if="loading" />
      <CdxMessage v-else-if="error" type="error">{{ error }}</CdxMessage>

      <template v-else>
        <p class="ah-hint">Select two revisions to compare them on Wikipedia.</p>

        <ul class="ah-list">
          <li
            v-for="rev in revisions"
            :key="rev.id"
            class="ah-row"
            :class="{
              'ah-row--chain-range': chainRangeIds.has(rev.id),
              'ah-row--chain-node': chainNodeIds.has(rev.id),
            }"
          >
            <input
              type="checkbox"
              class="ah-check"
              :checked="selectedIds.includes(rev.id)"
              :disabled="selectedIds.length >= 2 && !selectedIds.includes(rev.id)"
              :aria-label="`Select revision from ${formatTimestamp(rev.timestamp)}`"
              @change="toggleSelect(rev.id)"
            />

            <span class="ah-links">
              <a
                :href="`https://en.wikipedia.org/w/index.php?diff=${rev.id}`"
                target="_blank"
                rel="noopener noreferrer"
              >diff</a>
              ·
              <a
                :href="`https://en.wikipedia.org/w/index.php?title=${articleTitle}&action=history`"
                target="_blank"
                rel="noopener noreferrer"
              >hist</a>
            </span>

            <a
              class="ah-timestamp"
              :href="`https://en.wikipedia.org/w/index.php?oldid=${rev.id}`"
              target="_blank"
              rel="noopener noreferrer"
            >{{ formatTimestamp(rev.timestamp) }}</a>

            <span v-if="rev.minor" class="ah-minor" title="This is a minor edit">m</span>

            <a
              class="ah-user"
              :class="{ 'ah-user--highlighted': chainNodeIds.has(rev.id) }"
              :href="`https://en.wikipedia.org/wiki/User_talk:${encodeURIComponent(rev.user.name)}`"
              target="_blank"
              rel="noopener noreferrer"
            >{{ rev.user.name }}</a>

            <span
              v-if="rev.delta !== undefined"
              class="ah-delta"
              :class="{
                'ah-delta--pos': rev.delta > 0,
                'ah-delta--neg': rev.delta < 0,
                'ah-delta--large': Math.abs(rev.delta) > 500,
                'ah-delta--zero': rev.delta === 0,
              }"
            >({{ rev.delta > 0 ? '+' : '' }}{{ rev.delta.toLocaleString() }})</span>

            <span v-if="rev.comment" class="ah-comment">
              <em>{{ formatComment(rev.comment) }}</em>
            </span>
          </li>
        </ul>

        <div v-if="olderCursor" class="ah-more">
          <CdxButton weight="quiet" :disabled="loadingMore" @click="loadMore">
            {{ loadingMore ? 'Loading…' : 'Load older revisions' }}
          </CdxButton>
        </div>
      </template>
    </SpecialPageWrapper>
  </ChromeWrapper>

  <HistoryLoopOverlay
    :visible="overlayVisible"
    @dismiss="onDismiss"
  />

  <Transition name="ah-thread-fade">
    <svg
      v-if="threadVisible && chainNodePositions.length >= 2"
      class="ah-thread"
      aria-hidden="true"
    >
      <line
        v-for="(pos, i) in chainNodePositions.slice(0, -1)"
        :key="`line-${i}`"
        class="ah-thread__line"
        pathLength="1"
        :x1="pos.cx"
        :y1="pos.cyBottom + 4"
        :x2="chainNodePositions[i + 1].cx"
        :y2="chainNodePositions[i + 1].cyTop - 4"
        :style="{ animationDelay: `${i * 180}ms` }"
      />
    </svg>
  </Transition>

  <Transition name="ah-followup-slide">
    <div v-if="followupVisible" class="ah-followup">
      <CdxMessage
        type="notice"
        :allow-user-dismiss="true"
        dismiss-button-label="Dismiss"
        :action-button-label="`Edit ${displayTitle}`"
        @user-dismissed="followupVisible = false"
        @action-button-click="onFollowupCta"
      >
        Continue shaping knowledge
      </CdxMessage>
    </div>
  </Transition>
</template>

<style scoped>
.ah-hint {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  margin: 0 0 var(--spacing-100);
}

.ah-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ah-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--spacing-75);
  padding: var(--spacing-50) 0;
  border-bottom: 1px solid var(--border-color-subtle);
  font-size: var(--font-size-small);
}

.ah-check {
  flex-shrink: 0;
  cursor: pointer;
}

.ah-links {
  color: var(--color-subtle);
  white-space: nowrap;
}

.ah-links a {
  color: var(--color-progressive);
}

.ah-timestamp {
  color: var(--color-base);
  font-weight: var(--font-weight-semi-bold);
  white-space: nowrap;
  text-decoration: none;
}

.ah-timestamp:hover {
  text-decoration: underline;
}

.ah-minor {
  color: var(--color-subtle);
  font-weight: var(--font-weight-bold);
}

.ah-user {
  color: var(--color-progressive);
}

.ah-delta {
  font-family: var(--font-family-monospace);
  white-space: nowrap;
}

.ah-delta--pos {
  color: #006400;
}

.ah-delta--neg {
  color: #8b0000;
}

.ah-delta--large {
  font-weight: var(--font-weight-bold);
}

.ah-delta--zero {
  color: var(--color-subtle);
}

.ah-comment {
  color: var(--color-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
}

.ah-more {
  padding: var(--spacing-100) 0;
}

/* ── Collaboration chain ─────────────────────────────────────────── */
.ah-row--chain-range {
  border-left: 2px solid rgba(51, 102, 204, 0.3);
  padding-left: var(--spacing-75);
}

.ah-row--chain-node {
  border-left: 3px solid var(--color-progressive);
  padding-left: var(--spacing-75);
}

.ah-user--highlighted {
  position: relative;
  z-index: 200;
  background-color: #eaf0fb;
  border-radius: 3px;
  padding: 1px 5px;
  font-weight: var(--font-weight-bold);
}

/* ── Follow-up notice ────────────────────────────────────────────── */
.ah-followup {
  position: fixed;
  bottom: var(--spacing-200, 32px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  width: min(520px, calc(100vw - 32px));
  pointer-events: all;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>

<style>
.ah-followup-slide-enter-active { transition: opacity 300ms ease, transform 300ms ease; }
.ah-followup-slide-leave-active { transition: opacity 200ms ease, transform 200ms ease; }
.ah-followup-slide-enter-from { opacity: 0; transform: translateX(-50%) translateY(12px); }
.ah-followup-slide-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* ── Collaboration thread SVG ────────────────────────────────────── */
.ah-thread {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 201;
  pointer-events: none;
  overflow: visible;
}

.ah-thread__line {
  fill: none;
  stroke: #ffffff;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ah-thread-draw 400ms ease forwards;
}

.ah-thread-fade-enter-active { transition: opacity 200ms ease; }
.ah-thread-fade-leave-active { transition: opacity 150ms ease; }
.ah-thread-fade-enter-from, .ah-thread-fade-leave-to { opacity: 0; }

@keyframes ah-thread-draw {
  to { stroke-dashoffset: 0; }
}
</style>
