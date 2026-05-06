/**
 * Heart burst confetti (prototypes). Appends a fixed overlay to `document.body`;
 * uses Web Animations API.
 */
import { cdxIconHeart } from '@wikimedia/codex-icons'

export type HeartConfettiFillOptions = {
  /** Codex or app CSS custom property, e.g. `--color-progressive`. */
  colorVar: string
  /** Fallback when the var is missing (hex or CSS color). */
  colorFallback: string
}

const DEFAULT_CONFETTI_FILL: HeartConfettiFillOptions = {
  colorVar: '--color-progressive',
  colorFallback: '#3366cc',
}

/** Resolves a Codex colour token for teleported confetti (probe avoids wrong inherited color). */
function resolveConfettiFill(
  doc: Document,
  mountParent: HTMLElement,
  fill: HeartConfettiFillOptions,
): string {
  const probe = doc.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  const { colorVar, colorFallback } = fill
  probe.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none;color:var(${colorVar}, ${colorFallback})`
  mountParent.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved || colorFallback
}

function heartConfettiReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Burst of small hearts from the button centre (fixed overlay; prototype-only). */
export function spawnHeartConfettiFromButton(
  buttonEl: HTMLElement,
  fill?: HeartConfettiFillOptions,
): void {
  if (typeof document === 'undefined') return
  if (heartConfettiReducedMotion()) return

  const fillResolved = fill ?? DEFAULT_CONFETTI_FILL

  const rect = buttonEl.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const layer = document.createElement('div')
  layer.className = 'protowiki-demo-heart-confetti-layer'
  layer.setAttribute('aria-hidden', 'true')
  document.body.appendChild(layer)

  const confettiFill = resolveConfettiFill(buttonEl.ownerDocument, layer, fillResolved)

  const count = 10
  let finished = 0
  /** Longest particle run + buffer (slow, floaty arcs). */
  const maxDuration = 11200

  let fallbackRemove: ReturnType<typeof setTimeout> | undefined
  let layerFinished = false
  const finishLayer = () => {
    if (layerFinished) return
    layerFinished = true
    if (fallbackRemove !== undefined) {
      window.clearTimeout(fallbackRemove)
    }
    layer.remove()
  }

  fallbackRemove = window.setTimeout(() => {
    finishLayer()
  }, maxDuration)

  const doneOne = () => {
    finished += 1
    if (finished >= count) finishLayer()
  }

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2
    const spread = 72 + Math.random() * 118
    const dx = Math.cos(angle) * spread
    /** Strong upward pop; screen Y grows downward, so negative = higher. */
    const lift = 140 + Math.random() * 160
    const rot = (Math.random() - 0.5) * 72
    const size = 14 + Math.random() * 12

    const piece = document.createElement('span')
    piece.className = 'protowiki-demo-heart-confetti-piece'
    piece.style.left = `${cx}px`
    piece.style.top = `${cy}px`
    piece.style.width = `${size}px`
    piece.style.height = `${size}px`
    piece.style.color = confettiFill
    /* No `cdx-icon` wrapper — Codex forces `.cdx-icon { color: var(--color-base) }`; use probed fill. */
    piece.innerHTML = `<span class="protowiki-demo-heart-confetti-piece__glyph" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">${cdxIconHeart}</svg></span>`

    layer.appendChild(piece)

    const duration = 6000 + Math.random() * 4500

    /** One continuous move; opacity fades in parallel from the first frame (no end-weighted delay). */
    const xEnd = dx * 1.02
    const yEnd = -lift

    try {
      const move = piece.animate(
        [
          {
            transform: 'translate(-50%, -50%) translate(0px, 0px) rotate(0deg) scale(1)',
          },
          {
            transform: `translate(-50%, -50%) translate(${xEnd}px, ${yEnd}px) rotate(${rot}deg) scale(0.36)`,
          },
        ],
        {
          duration,
          easing: 'cubic-bezier(0.07, 0.88, 0.2, 1)',
          fill: 'forwards',
        },
      )
      const fade = piece.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration,
        delay: 0,
        easing: 'linear',
        fill: 'forwards',
      })
      move.onfinish = () => {
        fade.cancel()
        piece.remove()
        doneOne()
      }
    } catch {
      piece.remove()
      doneOne()
    }
  }
}

export function removeHeartConfettiLayers(): void {
  if (typeof document === 'undefined') return
  document.querySelectorAll('.protowiki-demo-heart-confetti-layer').forEach((el) => el.remove())
}