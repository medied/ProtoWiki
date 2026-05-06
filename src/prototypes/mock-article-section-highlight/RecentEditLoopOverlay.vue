<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { CdxMessage } from '@wikimedia/codex'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  dismiss: []
}>()

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) emit('dismiss')
}

onMounted(() => window.addEventListener('keydown', onEscape))
onUnmounted(() => window.removeEventListener('keydown', onEscape))
</script>

<template>
  <Transition name="rel-overlay-fade">
    <div v-if="visible" class="rel-overlay" role="dialog" aria-modal="true" aria-label="Recent edit spotlight">
      <!-- Scrim: clickable to dismiss -->
      <div class="rel-overlay__scrim" @click="emit('dismiss')" />

      <!-- Narrative card -->
      <CdxMessage
        class="rel-overlay__card"
        type="notice"
        :allow-user-dismiss="true"
        dismiss-button-label="Dismiss"
        @user-dismissed="emit('dismiss')"
      >
        Todepond edited this paragraph yesterday — review their changes or give them thanks.
      </CdxMessage>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Overlay & scrim ───────────────────────────────────────────── */
.rel-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: var(--spacing-200, 32px);
  pointer-events: none;
}

.rel-overlay__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: all;
  cursor: default;
}

/* ── Narrative card ─────────────────────────────────────────────── */
.rel-overlay__card {
  position: relative;
  z-index: 201;
  pointer-events: all;
  width: min(520px, calc(100vw - 32px));
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.28),
    0 2px 8px rgba(0, 0, 0, 0.12);
}

/* ── Transitions ────────────────────────────────────────────────── */
.rel-overlay-fade-enter-active {
  transition: opacity 350ms ease;
}

.rel-overlay-fade-leave-active {
  transition: opacity 250ms ease;
}

.rel-overlay-fade-enter-from,
.rel-overlay-fade-leave-to {
  opacity: 0;
}

.rel-overlay-fade-enter-active :deep(.rel-overlay__card) {
  transition: opacity 350ms ease 80ms, transform 350ms ease 80ms;
}

.rel-overlay-fade-leave-active :deep(.rel-overlay__card) {
  transition: opacity 200ms ease, transform 200ms ease;
}

.rel-overlay-fade-enter-from :deep(.rel-overlay__card) {
  opacity: 0;
  transform: translateY(16px);
}

.rel-overlay-fade-leave-to :deep(.rel-overlay__card) {
  opacity: 0;
  transform: translateY(8px);
}
</style>
