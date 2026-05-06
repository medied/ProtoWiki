<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { CdxMessage } from '@wikimedia/codex'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  dismiss: []
  ctaClick: []
}>()

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) emit('dismiss')
}

onMounted(() => window.addEventListener('keydown', onEscape))
onUnmounted(() => window.removeEventListener('keydown', onEscape))
</script>

<template>
  <Transition name="overlay-fade">
    <div v-if="visible" class="wl-overlay" role="dialog" aria-modal="true" aria-label="Wiki Loop narrative">
      <!-- Scrim: clickable to dismiss -->
      <div class="wl-overlay__scrim" @click="emit('dismiss')" />

      <!-- Narrative card -->
      <CdxMessage
        class="wl-overlay__card"
        type="success"
        :allow-user-dismiss="true"
        dismiss-button-label="Dismiss"
        @user-dismissed="emit('dismiss')"
      >
        More than 900 people have read this article you edited last week, thanks for your contribution!
      </CdxMessage>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Overlay & scrim ───────────────────────────────────────────── */
.wl-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: var(--spacing-200, 32px);
  pointer-events: none;
}

.wl-overlay__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: all;
  cursor: default;
}

/* ── Narrative card ─────────────────────────────────────────────── */
.wl-overlay__card {
  position: relative;
  z-index: 201;
  pointer-events: all;
  width: min(520px, calc(100vw - 32px));
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.28),
    0 2px 8px rgba(0, 0, 0, 0.12);
}

/* ── Transitions & animations ───────────────────────────────────── */
.overlay-fade-enter-active {
  transition: opacity 350ms ease;
}

.overlay-fade-leave-active {
  transition: opacity 250ms ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

.overlay-fade-enter-active :deep(.wl-overlay__card) {
  transition: opacity 350ms ease 80ms, transform 350ms ease 80ms;
}

.overlay-fade-leave-active :deep(.wl-overlay__card) {
  transition: opacity 200ms ease, transform 200ms ease;
}

.overlay-fade-enter-from :deep(.wl-overlay__card) {
  opacity: 0;
  transform: translateY(16px);
}

.overlay-fade-leave-to :deep(.wl-overlay__card) {
  opacity: 0;
  transform: translateY(8px);
}</style>
