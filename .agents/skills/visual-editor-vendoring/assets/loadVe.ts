/**
 * Loader for the vendored VisualEditor bundle.
 *
 * Drop into `src/lib/visualeditor/loadVe.ts`, then import from a
 * prototype:
 *
 *     import { attachVe } from '@/lib/visualeditor/loadVe'
 *
 * Vendor the bundle first via .agents/skills/visual-editor-vendoring/assets/update-ve.sh.
 */

declare global {
  interface Window {
    mw?: any
    OO?: any
    ve?: any
    jQuery?: any
    $?: any
  }
}

const BUNDLE_DIR = `${import.meta.env.BASE_URL ?? '/'}visualeditor/`

let loadPromise: Promise<typeof window.ve> | null = null

function injectStylesheet(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

/**
 * Inject the vendored VE bundle and wait for the `ve` global to appear.
 * Idempotent; safe to call from multiple components.
 */
export function loadVe(): Promise<typeof window.ve> {
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    injectStylesheet(`${BUNDLE_DIR}platform.css`)
    injectStylesheet(`${BUNDLE_DIR}ve.css`)

    await injectScript(`${BUNDLE_DIR}platform.js`)
    await injectScript(`${BUNDLE_DIR}ve.js`)

    if (!window.mw) throw new Error('VE bundle did not expose mw global')
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (window.ve && window.mw?.libs?.ve) resolve()
        else setTimeout(tick, 16)
      }
      tick()
    })

    return window.ve
  })()

  return loadPromise
}

export function whenVePlatformReady(cb: () => void): void {
  loadVe().then(() => {
    if (window.mw) cb()
  })
}

export function whenVeReady(cb: () => void): void {
  loadVe().then(() => {
    if (window.ve && window.mw?.libs?.ve) cb()
  })
}

/**
 * Attach VE to a target element and seed it with `html`.
 * Returns a destroy handle; always call `.destroy()` on route change.
 */
export async function attachVe(
  target: HTMLElement,
  html: string,
): Promise<{ destroy(): void }> {
  const ve = await loadVe()

  target.classList.add('mw-parser-output')
  target.innerHTML = html

  const surface = ve.init.target.createSurface(
    ve.dm.converter.getModelFromDom(
      ve.createDocumentFromHtml(html),
    ),
  )
  ve.init.target.attachSurface(target, surface)

  return {
    destroy() {
      try {
        surface.destroy()
        target.innerHTML = ''
        target.classList.remove('mw-parser-output')
      } catch {
        // already gone
      }
    },
  }
}
