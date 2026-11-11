import { defineConfig, type Plugin } from 'vite'
import { existsSync, rmSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { renderPage, renderHead, hreflangs } from './src/render'
import { es } from './src/content/es'
import { en } from './src/content/en'

// Sitio bilingüe con dos páginas: index.html (inglés, en /) y es/index.html (español, en /es/).
// Este plugin inserta en cada una el HTML de todas las secciones (para que el texto llegue
// sin depender de JavaScript), más título, descripción y los alternates hreflang.
// Como base es './', la página en español está una carpeta más abajo y usa raiz '../'.
function paginaEstatica(): Plugin[] {
  const esPaginaEs = (filename: string) => filename.split(sep).join('/').endsWith('/es/index.html')
  return [
    {
      name: 'pagina-estatica',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          const existe = (ruta: string) => existsSync(resolve(import.meta.dirname, 'public', ruta))
          const espanol = esPaginaEs(ctx.filename)
          return html
            .replace('<!--head-->', renderHead(espanol ? es : en, (process.env.SITE_URL ?? '').replace(/\/+$/, '')))
            .replace('<!--app-->', renderPage(espanol ? es : en, { existe, raiz: espanol ? '../' : '' }))
        },
      },
    },
    {
      name: 'pagina-hreflang',
      transformIndexHtml: {
        // Los hreflang se añaden al final: Vite trataría como assets los href con rutas de carpeta.
        order: 'post',
        handler(_html, ctx) {
          // hreflang exige URLs absolutas: sin dominio todavía no se emiten (un href relativo es inválido).
          // Al publicar: SITE_URL=https://dominio.tld npm run build
          const sitio = process.env.SITE_URL?.replace(/\/+$/, '')
          if (!sitio) return []
          const alt = hreflangs(esPaginaEs(ctx.filename) ? es : en, es, en)
          return alt.map((a) => ({
            tag: 'link',
            attrs: { rel: 'alternate', hreflang: a.hreflang, href: new URL(a.href, `${sitio}${esPaginaEs(ctx.filename) ? '/es/' : '/'}`).href },
            injectTo: 'head' as const,
          }))
        },
      },
    },
  ]
}

export default defineConfig({
  base: './',
  plugins: [
    paginaEstatica(),
    {
      // El GLB sin comprimir es solo un intermedio del pipeline: no debe publicarse.
      name: 'sin-modelo-raw',
      apply: 'build',
      closeBundle() {
        rmSync(resolve(import.meta.dirname, 'dist/models/laptop-raw.glb'), { force: true })
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        es: resolve(import.meta.dirname, 'es/index.html'),
      },
    },
  },
})
