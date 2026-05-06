<script setup lang="ts">
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconInfo } from '@wikimedia/codex-icons'
import { useRouter } from 'vue-router'

definePage({
  meta: {
    title: 'Wiki Loop',
    description: 'Causality loop: an editor returns and sees how their edit sparked more.',
  },
})

const router = useRouter()

interface MockEmail {
  id: number
  from: string
  subject: string
  timestamp: string
  snippet: string
  cta: string
  to: string
}

const emails: MockEmail[] = [
  {
    id: 1,
    from: 'Wikipedia Notifications <noreply@wikimedia.org>',
    subject: 'People are reading the article you contributed to',
    timestamp: 'May 2, 2026, 09:14',
    snippet:
      '980 people have read the Caracas article you edited last week. Thanks for your contribution! See how your edit sparked more knowledge-building.',
    cta: 'Continue contributing to human knowledge',
    to: '/wiki-loop/story?article=Caracas',
  },
  {
    id: 2,
    from: 'Wikipedia Notifications <noreply@wikimedia.org>',
    subject: 'You are part of a collaboration thread in the Albert Einstein article',
    timestamp: 'May 3, 2026, 14:37',
    snippet:
      'You are part of a collaboration thread! There have been 12 edits in the past 7 days to the Albert Einstein article you edited. Review edits from editors just like you and see how your contributions fit into the bigger picture.',
    cta: 'View revision history',
    to: '/article-history?article=Albert_Einstein',
  },
  {
    id: 3,
    from: 'Wikipedia Notifications <noreply@wikimedia.org>',
    subject: 'Someone edited a paragraph you wrote in Wet Leg',
    timestamp: 'May 5, 2026, 11:02',
    snippet:
      'Todepond edited a paragraph in the Wet Leg article you contributed to yesterday. Review their changes, give thanks, or build on their work.',
    cta: 'See what changed',
    to: '/mock-article-section-highlight',
  },
]

function open(to: string) {
  router.push(to)
}


</script>

<template>
  <div class="wl-page">
    <!-- Logo / wordmark ─────────────────────────────────────────── -->
    <header class="wl-logo">
      <h1 class="wl-logo__title">WIKI LOOP</h1>
      <div class="wl-logo__info">
        <a
          href="https://github.com/medied/ProtoWiki/blob/main/src/prototypes/wiki-loop/README.md"
          target="_blank"
          rel="noopener noreferrer"
          class="wl-logo__info-btn"
          aria-label="About Wiki Loop"
        >
          <CdxIcon :icon="cdxIconInfo" />
        </a>
        <div class="wl-logo__info-preview" role="tooltip">
          Looping users back into Wikipedia. The core idea is that editors return not only when they see data, but when they see themselves in a story that is still unfolding. So turning data signals into a user story that can be layered on top of Wikipedia, injecting more personal meaning into an existing page.
        </div>
      </div>
    </header>

    <div class="wl-inbox">
          <header class="wl-inbox__header">
            <h1 class="wl-inbox__title">Inbox</h1>
            <span class="wl-inbox__count">{{ emails.length }} notifications</span>
          </header>

          <ul class="wl-inbox__list" role="list">
            <li
              v-for="email in emails"
              :key="email.id"
              class="wl-inbox__row"
            >
              <div class="wl-inbox__meta">
                <span class="wl-inbox__from">{{ email.from }}</span>
                <span class="wl-inbox__timestamp">{{ email.timestamp }}</span>
              </div>
              <p class="wl-inbox__subject">{{ email.subject }}</p>
              <p class="wl-inbox__snippet">{{ email.snippet }}</p>
              <CdxButton
                class="wl-inbox__cta"
                weight="primary"
                action="progressive"
                @click="open(email.to)"
              >
                {{ email.cta }}
              </CdxButton>
            </li>
          </ul>
    </div>
  </div>
</template>

<style scoped>
/* ── Page shell ─────────────────────────────────────────────────── */
.wl-page {
  min-height: 100vh;
  background-color: var(--background-color-base);
  box-sizing: border-box;
  padding: var(--spacing-200) var(--spacing-150);
}

/* ── Logo / wordmark ───────────────────────────────────────────── */
.wl-logo {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 540px;
  margin: 0 auto var(--spacing-200);
}

.wl-logo__title {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
  color: var(--color-base);
  margin: 0;
  line-height: 1.2;
}

/* ── Info button ────────────────────────────────────────────────── */
.wl-logo__info {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.wl-logo__info-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-base);
  color: var(--color-subtle);
  text-decoration: none;
  transition: background-color var(--transition-duration-medium), color var(--transition-duration-medium);
}

.wl-logo__info-btn:hover,
.wl-logo__info-btn:focus-visible {
  background-color: rgba(0, 0, 0, 0.06);
  color: var(--color-base);
}

.wl-logo__info-btn:focus-visible {
  outline: 2px solid var(--color-progressive);
  outline-offset: 2px;
}

.wl-logo__info-preview {
  position: absolute;
  top: calc(100% + var(--spacing-50));
  right: 0;
  width: 280px;
  background-color: var(--background-color-base);
  border: 1px solid var(--border-color-base);
  border-radius: var(--border-radius-base);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: var(--spacing-100);
  font-size: var(--font-size-small);
  line-height: var(--line-height-medium);
  color: var(--color-base);
  visibility: hidden;
  opacity: 0;
  transition: opacity var(--transition-duration-medium), visibility var(--transition-duration-medium);
  z-index: 10;
  pointer-events: none;
}

.wl-logo__info:hover .wl-logo__info-preview,
.wl-logo__info:focus-within .wl-logo__info-preview {
  visibility: visible;
  opacity: 1;
}

/* ── Email inbox ────────────────────────────────────────────────── */
.wl-inbox {
  max-width: 540px;
  margin: 0 auto;
  font-family: var(--font-family-base);
}

.wl-inbox__header {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-100);
  margin-bottom: var(--spacing-150);
  border-bottom: 1px solid var(--border-color-base);
  padding-bottom: var(--spacing-100);
}

.wl-inbox__title {
  font-size: var(--font-size-x-large);
  font-weight: var(--font-weight-bold);
  margin: 0;
  color: var(--color-base);
}

.wl-inbox__count {
  font-size: var(--font-size-small);
  color: var(--color-subtle);
}

.wl-inbox__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.wl-inbox__row {
  padding: var(--spacing-150) 0;
  border-bottom: 1px solid var(--border-color-base);
  transition: background-color var(--transition-duration-medium);
}

.wl-inbox__row:last-child {
  border-bottom: none;
}

.wl-inbox__meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--spacing-100);
  margin-bottom: var(--spacing-50);
}

.wl-inbox__from {
  font-size: var(--font-size-small);
  color: var(--color-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wl-inbox__timestamp {
  font-size: var(--font-size-x-small);
  color: var(--color-subtle);
  white-space: nowrap;
  flex-shrink: 0;
}

.wl-inbox__subject {
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  color: var(--color-base);
  margin: 0 0 var(--spacing-50);
}

.wl-inbox__snippet {
  font-size: var(--font-size-small);
  color: var(--color-subtle);
  margin: 0 0 var(--spacing-100);
  line-height: var(--line-height-medium);
}

.wl-inbox__cta {
  margin-top: var(--spacing-50);
}
</style>
