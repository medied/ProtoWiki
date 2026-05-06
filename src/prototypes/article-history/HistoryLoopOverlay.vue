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
  <!-- Scrim: fixed at z-index 200, in root stacking context -->
  <Transition name="hlo-scrim-fade">
    <div
      v-if="visible"
      class="hlo-overlay__scrim"
      @click="emit('dismiss')"
    />
  </Transition>

  <!-- Card: fixed at z-index 202, above SVG thread (201) in root stacking context -->
  <Transition name="hlo-card-fade">
    <CdxMessage
      v-if="visible"
      class="hlo-overlay__card"
      type="success"
      role="dialog"
      aria-modal="true"
      aria-label="Collaboration chain"
      :allow-user-dismiss="true"
      dismiss-button-label="Dismiss"
      @user-dismissed="emit('dismiss')"
    >
      Your edit sparked a collaboration chain — these editors built on your work in the past week.
    </CdxMessage>
  </Transition>
</template>

<style scoped>
/* ── Scrim ───────────────────────────────────────────────────────── */
.hlo-overlay__scrim {
  position: fixed;
  inset: 0;
  z-index: 199;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: all;
  cursor: default;
}

/* ── Message card ────────────────────────────────────────────────── */
/* z-index 202: above SVG thread at 201, which is above scrim at 200  */
.hlo-overlay__card {
  position: fixed;
  bottom: var(--spacing-200, 32px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 202;
  pointer-events: all;
  width: min(520px, calc(100vw - 32px));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* ── Scrim transition ────────────────────────────────────────────── */
.hlo-scrim-fade-enter-active { transition: opacity 350ms ease; }
.hlo-scrim-fade-leave-active { transition: opacity 250ms ease; }
.hlo-scrim-fade-enter-from,
.hlo-scrim-fade-leave-to { opacity: 0; }

/* ── Card transition ─────────────────────────────────────────────── */
.hlo-card-fade-enter-active {
  transition: opacity 350ms ease 80ms, transform 350ms ease 80ms;
}
.hlo-card-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.hlo-card-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
.hlo-card-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
