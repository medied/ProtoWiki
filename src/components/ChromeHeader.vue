<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import {
  cdxIconAppearance,
  cdxIconBell,
  cdxIconMenu,
  cdxIconSearch,
  cdxIconTray,
  cdxIconUserAvatar,
  cdxIconWatchlist,
} from '@wikimedia/codex-icons'

import { globalSkin, globalTheme } from '@/lib/theming'
import type { Skin, Theme } from '@/lib/theming'
import SearchBar from './SearchBar.vue'

/** Production-hosted SVGs (English Wikipedia); swap via #logo / slots when prototyping other projects. */
const WIKIPEDIA_WORDMARK_EN =
  'https://en.wikipedia.org/static/images/mobile/copyright/wikipedia-wordmark-en-25.svg'
const WIKIPEDIA_TAGLINE_EN =
  'https://en.wikipedia.org/static/images/mobile/copyright/wikipedia-tagline-en-25.svg'

interface Props {
  /** Local skin override. Sets `data-skin` on the root. */
  skin?: Skin
  /** Local theme override. Sets `data-theme` on the root. */
  theme?: Theme
}

const props = withDefaults(defineProps<Props>(), {
  skin: undefined,
  theme: undefined,
})

const effectiveSkin = computed<Skin>(() => props.skin ?? globalSkin.value)
const effectiveTheme = computed<Theme>(() => props.theme ?? globalTheme.value)
const isDesktop = computed(() => effectiveSkin.value === 'desktop')
const isMobile = computed(() => effectiveSkin.value === 'mobile')
</script>

<template>
  <header
    class="chrome-header"
    :class="{
      'chrome-header--desktop': isDesktop,
      'chrome-header--mobile': isMobile,
    }"
    :data-skin="effectiveSkin"
    :data-theme="effectiveTheme"
  >
    <!-- Vector 2022–style chrome (desktop skin) -->
    <nav v-if="isDesktop" class="chrome-header__nav-desktop" aria-label="Site">
      <div class="chrome-header__desktop-start">
        <!-- Mock only — not interactive (FakeMediaWiki uses bare chrome / icon affordances). -->
        <span class="chrome-header__menu-icon" aria-hidden="true">
          <CdxIcon :icon="cdxIconMenu" />
        </span>

        <RouterLink class="chrome-header__brand-link" to="/" aria-label="Visit the main page">
          <slot name="logo">
            <span class="chrome-header__wordmarks">
              <img
                class="chrome-header__wordmark-img"
                :src="WIKIPEDIA_WORDMARK_EN"
                width="120"
                height="18"
                alt="Wikipedia"
              />
              <img
                class="chrome-header__tagline-img"
                :src="WIKIPEDIA_TAGLINE_EN"
                width="120"
                height="14"
                alt=""
              />
            </span>
          </slot>
        </RouterLink>
      </div>

      <div class="chrome-header__inline-search">
        <div class="chrome-header__search">
          <slot name="search">
            <SearchBar />
          </slot>
        </div>
        <CdxButton
          class="chrome-header__search-submit"
          tag="a"
          href="https://en.wikipedia.org/wiki/Special:Search"
        >
          Search
        </CdxButton>
      </div>

      <div class="chrome-header__desktop-end">
        <CdxButton
          class="chrome-header__search-icon-toggle"
          weight="quiet"
          aria-label="Search"
          tag="a"
          href="https://en.wikipedia.org/wiki/Special:Search"
        >
          <CdxIcon :icon="cdxIconSearch" />
        </CdxButton>
        <slot name="nav-prefix" />
        <slot name="nav">
          <CdxButton weight="quiet" aria-label="Appearance">
            <CdxIcon :icon="cdxIconAppearance" />
          </CdxButton>
          <CdxButton weight="quiet" class="chrome-header__notify" aria-label="Notifications">
            <CdxIcon :icon="cdxIconBell" />
            <span class="chrome-header__notify-badge" aria-hidden="true">1</span>
          </CdxButton>
          <CdxButton weight="quiet" aria-label="Notices">
            <CdxIcon :icon="cdxIconTray" />
          </CdxButton>
          <CdxButton weight="quiet" class="chrome-header__hide-narrow" aria-label="Watchlist">
            <CdxIcon :icon="cdxIconWatchlist" />
          </CdxButton>
          <CdxButton weight="quiet" class="chrome-header__user-btn" aria-label="User menu">
            <CdxIcon :icon="cdxIconUserAvatar" />
            <span class="chrome-header__dropdown-chevron" aria-hidden="true" />
          </CdxButton>
        </slot>
      </div>
    </nav>

    <!-- Minerva-style chrome (mobile skin) -->
    <nav v-else class="chrome-header__nav-mobile" aria-label="Site">
      <CdxButton weight="quiet" size="large" aria-label="Main menu">
        <CdxIcon :icon="cdxIconMenu" />
      </CdxButton>

      <RouterLink class="chrome-header__mobile-brand" to="/" aria-label="Visit the main page">
        <slot name="logo">
          <img
            class="chrome-header__mobile-wordmark-img"
            :src="WIKIPEDIA_WORDMARK_EN"
            alt="Wikipedia"
          />
        </slot>
      </RouterLink>

      <div class="chrome-header__mobile-actions">
        <CdxButton
          weight="quiet"
          size="large"
          aria-label="Search"
          tag="a"
          href="https://en.wikipedia.org/wiki/Special:Search"
        >
          <CdxIcon :icon="cdxIconSearch" />
        </CdxButton>
        <CdxButton
          weight="quiet"
          size="large"
          class="chrome-header__notify"
          aria-label="Notifications"
        >
          <CdxIcon :icon="cdxIconBell" />
          <span class="chrome-header__notify-badge" aria-hidden="true">1</span>
        </CdxButton>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.chrome-header {
  background-color: var(--background-color-base, #fff);
}

/* Minerva bar separates from content; Vector desktop chrome stays flush (no bottom rule). */
.chrome-header[data-skin='mobile'] {
  border-bottom: 1px solid var(--border-color-subtle, #c8ccd1);
}

.chrome-header__search {
  min-width: 0;
}

.chrome-header__wordmark-img,
.chrome-header__tagline-img {
  display: block;
  width: auto;
  max-width: 100%;
}

/* ---------- Desktop (Vector) ---------- */
/*
 * Breakpoint parity with FakeMediaWiki `src/views/SpecialView/style.css`:
 * - max-width 1120px — collapse inline search → icon (nav-item-search / nav-button-search).
 * - max-width 768px — hide desktop-only tools (nav-button-desktop, e.g. watchlist).
 * Skin swap (nav-desktop vs nav-mobile) stays at 640px via src/lib/theming.ts.
 */

.chrome-header[data-skin='desktop'] .chrome-header__nav-desktop {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-100, 16px);
  min-height: 66px;
  padding: var(--spacing-50, 8px) var(--spacing-100, 16px);
}

.chrome-header[data-skin='desktop'] .chrome-header__desktop-start {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
}

.chrome-header[data-skin='desktop'] .chrome-header__menu-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: var(--size-icon-medium, 32px);
  min-height: var(--size-icon-medium, 32px);
  margin: 0;
  padding: var(--spacing-25, 4px);
  padding-inline-start: var(--spacing-50, 8px);
  border: none;
  background: transparent;
  color: var(--color-base, #202122);
  line-height: 0;
  cursor: default;
  pointer-events: none;
}

.chrome-header[data-skin='desktop'] .chrome-header__menu-icon :deep(svg) {
  display: block;
}

.chrome-header[data-skin='desktop'] .chrome-header__brand-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

.chrome-header[data-skin='desktop'] .chrome-header__brand-link:hover {
  text-decoration: none;
  color: inherit;
}

.chrome-header[data-skin='desktop'] .chrome-header__wordmarks {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2px;
  padding-block: 3px;
  padding-inline-start: var(--spacing-75, 12px);
  margin-inline-start: var(--spacing-50, 8px);
  width: 152px;
  min-height: 44px;
}

.chrome-header[data-skin='desktop'] .chrome-header__inline-search {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  gap: 0;
  max-width: 474px;
  padding-inline-start: var(--spacing-150, 24px);
}

.chrome-header[data-skin='desktop'] .chrome-header__inline-search .chrome-header__search {
  flex: 1;
  min-width: 0;
  max-width: 32rem;
}

.chrome-header[data-skin='desktop'] .chrome-header__search-submit.cdx-button {
  align-self: stretch;
  border-radius: 0 var(--border-radius-base, 2px) var(--border-radius-base, 2px) 0;
  margin-inline-start: -1px;
}

.chrome-header[data-skin='desktop'] .chrome-header__search-icon-toggle {
  display: none;
}

.chrome-header[data-skin='desktop'] .chrome-header__desktop-end {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem;
  margin-inline-start: auto;
}

.chrome-header[data-skin='desktop']
  .chrome-header__desktop-end
  :deep(.chrome-header__username-link) {
  align-self: center;
  margin-inline-end: var(--spacing-8, 8px);
  margin-inline-start: var(--spacing-8, 8px);
  color: var(--color-progressive, #36c);
  font-size: var(--font-size-medium, 1rem);
  text-decoration: none;
}

.chrome-header[data-skin='desktop']
  .chrome-header__desktop-end
  :deep(.chrome-header__username-link:hover) {
  text-decoration: underline;
}

.chrome-header[data-skin='desktop'] .chrome-header__desktop-end .cdx-button {
  min-width: var(--size-icon-medium, 32px);
  height: var(--size-icon-medium, 32px);
  padding: 0.5rem 0.4rem;
}

.chrome-header[data-skin='desktop'] .chrome-header__notify {
  position: relative;
}

.chrome-header[data-skin='desktop'] .chrome-header__notify-badge {
  position: absolute;
  bottom: 2px;
  right: 0;
  min-width: 16px;
  padding: 0 3px;
  border-radius: 2px;
  border: 1px solid var(--color-inverted, #fff);
  background-color: var(--background-color-progressive, #36c);
  color: var(--color-inverted, #fff);
  font-size: var(--font-size-x-small, 0.75rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: 1;
  text-align: center;
}

.chrome-header[data-skin='desktop'] .chrome-header__dropdown-chevron {
  display: inline-block;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  transform: scale(0.5);
  background-color: var(--color-base, #202122);
  mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="%23000"><path d="m17.5 4.75-7.5 7.5-7.5-7.5L1 6.25l9 9 9-9z"/></svg>');
  mask-repeat: no-repeat;
  mask-position: center;
}

.chrome-header[data-skin='desktop'] .chrome-header__user-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25, 4px);
  overflow: visible;
}

@media (max-width: 1120px) {
  .chrome-header[data-skin='desktop'] .chrome-header__inline-search {
    display: none;
  }

  .chrome-header[data-skin='desktop'] .chrome-header__search-icon-toggle {
    display: inline-flex;
  }

  /* Icon-only tools stay square; user menu needs width for avatar + chevron (FM parity). */
  .chrome-header[data-skin='desktop']
    .chrome-header__desktop-end
    .cdx-button:not(.chrome-header__user-btn) {
    height: var(--size-icon-large, 40px);
    width: var(--size-icon-large, 40px);
    padding: 0.7rem;
  }

  .chrome-header[data-skin='desktop'] .chrome-header__desktop-end .chrome-header__user-btn {
    width: auto;
    min-width: var(--size-icon-large, 40px);
    height: var(--size-icon-large, 40px);
    padding: 0.45rem 0.5rem;
  }

  .chrome-header[data-skin='desktop'] .chrome-header__notify-badge {
    bottom: 8px;
    right: 4px;
  }
}

@media (max-width: 768px) {
  .chrome-header[data-skin='desktop'] .chrome-header__hide-narrow {
    display: none !important;
  }
}

/* ---------- Mobile (Minerva-style bar) ---------- */

.chrome-header[data-skin='mobile'] .chrome-header__nav-mobile {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  min-height: 3.375em;
  padding: 0 var(--spacing-100, 16px) 0 var(--spacing-50, 8px);
  background-color: var(--background-color-interactive, #eaecf0);
  box-shadow: inset 0 -1px 3px 0 rgba(0, 0, 0, 0.08);
}

.chrome-header[data-skin='mobile'] .chrome-header__nav-mobile > .cdx-button:first-of-type {
  flex-shrink: 0;
}

.chrome-header[data-skin='mobile'] .chrome-header__mobile-brand {
  flex: 0 1 auto;
  max-width: fit-content;
  min-width: 0;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
}

.chrome-header[data-skin='mobile'] .chrome-header__mobile-brand:hover {
  text-decoration: none;
  color: inherit;
}

.chrome-header[data-skin='mobile'] .chrome-header__mobile-wordmark-img {
  display: block;
  height: 21px;
  width: auto;
  opacity: 0.67;
}

.chrome-header[data-theme='dark'] .chrome-header__wordmark-img,
.chrome-header[data-theme='dark'] .chrome-header__tagline-img,
.chrome-header[data-theme='dark'][data-skin='mobile'] .chrome-header__mobile-wordmark-img {
  opacity: 0;
}

.chrome-header[data-skin='mobile'] .chrome-header__mobile-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--spacing-25, 4px);
  margin-inline-start: auto;
}

/* Let Codex `size="large"` icon buttons keep default min sizes — avoid squishing. */
.chrome-header[data-skin='mobile'] .chrome-header__mobile-actions .cdx-button {
  flex-shrink: 0;
  color: var(--color-subtle, #54595d);
}

.chrome-header[data-skin='mobile'] .chrome-header__notify {
  position: relative;
}

.chrome-header[data-skin='mobile'] .chrome-header__notify-badge {
  position: absolute;
  bottom: 2px;
  right: 0;
  min-width: 16px;
  padding: 0 3px;
  border-radius: 2px;
  border: 1px solid var(--color-inverted, #fff);
  background-color: var(--background-color-progressive, #36c);
  color: var(--color-inverted, #fff);
  font-size: var(--font-size-x-small, 0.75rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: 1;
  text-align: center;
}
</style>
