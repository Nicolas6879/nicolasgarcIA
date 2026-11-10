import { defineConfig, type Plugin } from 'vite'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderPage } from './src/render'
import { es } from './src/content/es'

// Inserta el HTML de todas las secciones en index.html para que el texto
// llegue sin depender de JavaScript.
function paginaEstatica(): Plugin {
  return {
    name: 'pagina-estatica',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const existe = (ruta: string) => existsSync(resolve(import.meta.dirname, 'public', ruta))
        return html.replace('<!--app-->', renderPage(es, { existe }))
      },
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [paginaEstatica()],
})
