import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import VueRouter from 'unplugin-vue-router/vite'
import vue from '@vitejs/plugin-vue'

// Repo name for GitHub Pages base path. Override with PROTOWIKI_BASE env var
// when deploying somewhere else (e.g. a fork or a custom domain).
const repoName = process.env.PROTOWIKI_BASE ?? '/protowiki/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? repoName : '/',
  plugins: [
    // Plugin order matters: VueRouter must come before vue() so the routes
    // virtual module is generated first.
    VueRouter({
      routesFolder: 'src/prototypes',
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
    // GitHub Pages serves a static 404.html for unknown paths. By copying
    // index.html to 404.html on build, history-mode routing works without a
    // server-side rewrite: the SPA boots from any deep link.
    {
      name: 'protowiki-spa-404',
      apply: 'build',
      closeBundle() {
        const dist = resolve(__dirname, 'dist')
        const index = resolve(dist, 'index.html')
        const fallback = resolve(dist, '404.html')
        if (existsSync(index)) {
          copyFileSync(index, fallback)
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
}))
