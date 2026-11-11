// Genera el HTML de la página a partir del contenido de un idioma (es.ts o en.ts).
// Todos los enlaces a archivos de public/ y al otro idioma llevan el prefijo `raiz`,
// porque con base './' la página en español vive una carpeta más abajo (/es/).
import type { Contenido, ClaveSeccion } from './content/tipos'
import { codigo } from './content/codigo'
import { datosNicos, jsonSeguro } from './nicos/datos'

export interface Opciones {
  /** Indica si un archivo de /public existe (para usar la captura real o el placeholder). */
  existe?: (ruta: string) => boolean
  /** Prefijo para llegar a la raíz del sitio desde esta página: '' en inglés, '../' en español. */
  raiz?: string
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const e = (s: string | number): string => String(s).replace(/[&<>"']/g, (c) => ESC[c])

const NAV_HEADER: readonly ClaveSeccion[] = ['sistemas', 'ia', 'comunidad', 'proyectos', 'contacto']

const ICONO_TEMA =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>'
const ICONO_NICOS =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><rect x="2.5" y="4" width="19" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 10l3 2.5L7 15M12.5 15H17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const ICONO_DESCARGA =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

function ilustracion(): string {
  return `<svg class="laptop" viewBox="0 0 400 340" aria-hidden="true" focusable="false">
  <g class="p p-tapa"><rect x="70" y="14" width="260" height="170" rx="12"/></g>
  <g class="p p-pantalla"><rect x="84" y="28" width="232" height="142" rx="4"/><path d="M100 50h90M100 68h140M100 86h60" class="ln"/></g>
  <g class="p p-chasis"><path d="M40 296l30-100h260l30 100z"/><path d="M40 296h320" class="ln"/></g>
  <g class="p p-teclado"><path d="M96 214h208M90 234h220M84 254h232" class="ln key"/><rect x="160" y="270" width="80" height="12" rx="3"/></g>
  <g class="p p-placa"><rect x="60" y="312" width="150" height="24" rx="3"/></g>
  <g class="p p-cpu"><rect x="86" y="317" width="14" height="14" rx="2"/></g>
  <g class="p p-antena"><path d="M370 140v-60M370 80l-14-18M370 80l14-18" class="ln"/><circle cx="370" cy="144" r="4"/></g>
  <g class="p p-bateria"><rect x="222" y="314" width="70" height="20" rx="3"/><rect x="292" y="320" width="5" height="8"/></g>
  <g class="p p-disco"><rect x="304" y="314" width="48" height="20" rx="3"/></g>
</svg>`
}

/** Enlace secundario (texto sutil) al CV en el otro idioma. */
function cvOtro(c: Contenido, raiz: string): string {
  const { texto, archivo } = c.ui.cvOtro
  return `<a class="lnk cv-alt" href="${raiz}${archivo}" download>${e(texto)}</a>`
}

function cabecera(c: Contenido, raiz: string): string {
  const u = c.ui
  const enlaces = NAV_HEADER.map((k) => `<a href="#${k}">${e(u.nav[k])}</a>`).join('')
  const cv = `${raiz}${u.cvPropio}`
  return `<a class="skip" href="#contenido">${e(u.saltar)}</a>
<header class="top">
  <a class="brand" href="#inicio" aria-label="${e(c.inicio.nombre)}"><span aria-hidden="true">nicolasgarc<span class="brand-ia">IA</span></span></a>
  <nav aria-label="${e(u.navAria)}">${enlaces}</nav>
  <div class="top-actions">
    <a class="btn btn-sm cv-top" href="${cv}" download>${ICONO_DESCARGA}<span>${e(u.descargarCv)}</span></a>
    <a class="lang-switch" id="idioma" href="${raiz}${u.idioma.ruta}" hreflang="${u.idioma.lang}" lang="${u.idioma.lang}" aria-label="${e(u.idioma.aria)}">${e(u.idioma.texto)}</a>
    <button type="button" class="nicos-btn" id="nicos-abrir" aria-label="${e(c.nicos.botonCabecera)}" aria-haspopup="dialog">${ICONO_NICOS}<span class="nb-t">${e(c.nicos.botonCabecera)}</span><kbd aria-hidden="true">Ctrl K</kbd></button>
    <button type="button" class="icon-btn" id="tema" aria-label="${e(u.temaAria)}">${ICONO_TEMA}</button>
  </div>
</header>
<div class="cv-fab"><a class="btn" href="${cv}" download>${ICONO_DESCARGA}<span>${e(u.descargarCv)}</span></a>${cvOtro(c, raiz)}</div>`
}

/** Render estático del portátil armado para móvil (sin 3D): una imagen por tema; CSS muestra la que toca. Decorativa. */
function visualMovil(raiz: string): string {
  const img = (tema: 'oscuro' | 'claro') =>
    `<picture class="vis-${tema}"><source type="image/avif" srcset="${raiz}img/portatil-${tema}.avif" /><img src="${raiz}img/portatil-${tema}.webp" width="780" height="770" alt="" loading="lazy" decoding="async" fetchpriority="low" /></picture>`
  return `<div class="hero-vis" aria-hidden="true">${img('oscuro')}${img('claro')}</div>`
}

function inicio(cc: Contenido, raiz: string): string {
  const c = cc.inicio
  const partes = c.nombre.split(' ')
  const apellido = partes.slice(-1)[0]
  const resto = partes.slice(0, -1).join(' ')
  const cifras = c.cifras
    .map((f) => `<li><span class="big acc">${e(f.valor)}</span><span class="cap">${e(f.texto)}</span></li>`)
    .join('')
  return `<section id="inicio" data-pieza="${c.pieza}" class="hero" aria-labelledby="t-inicio">
  <p class="eyebrow rv">${e(c.eyebrow)}</p>
  <h1 id="t-inicio" class="rv">${e(resto)} <span class="acc">${e(apellido)}</span></h1>
  <p class="lead rv">${e(c.frase)}</p>
  <p class="loc rv">${e(c.ubicacion)}</p>
  <ul class="cifras rv">${cifras}</ul>
  <p class="botones rv"><a class="btn" href="${raiz}${cc.ui.cvPropio}" download>${e(c.botones.cv)}</a><a class="btn btn-ghost" href="#contacto">${e(c.botones.contacto)}</a>${cvOtro(cc, raiz)}</p>
  <p class="pista rv">${e(c.pista)}</p>
  ${visualMovil(raiz)}
</section>`
}

function sistemas(c: Contenido['sistemas'], u: Contenido['ui'], o: Opciones): string {
  const raiz = o.raiz ?? ''
  const items = c.items
    .map((it) => {
      const real = `capturas/${it.captura}`
      const hay = o.existe?.(real) ?? false
      const media = hay
        ? `<img src="${e(raiz + real)}" width="1600" height="1000" loading="lazy" alt="${e(u.capturaDe)} ${e(it.nombre)}" />`
        : `<div class="ph" role="img" aria-label="${e(u.capturaProx)}: ${e(it.nombre)}"><i></i><i></i><i></i><p class="ph-t">${e(it.nombre)}</p><p class="ph-s">${e(u.capturaProx)}</p></div>`
      const chips = it.stack.map((s) => `<li>${e(s)}</li>`).join('')
      const fuente = codigo[it.codigo] ?? ''
      const lang = it.codigo.split('.').pop() ?? ''
      // Sin JS: captura y, debajo, el fragmento. Con JS: un <canvas> encima de .media deshace la captura en
      // partículas que forman el código; el <pre> sigue en el HTML (oculto a la vista, accesible).
      return `<li class="card rv" data-fx>
  <div class="media">${media}<button type="button" class="fx-btn" hidden aria-pressed="false" data-codigo="${e(u.verCodigo)}" data-captura="${e(u.verCaptura)}">${e(u.verCodigo)}</button></div>
  <div class="codigo" data-archivo="${e(it.codigo)}"><pre tabindex="0"><code class="language-${e(lang)}">${e(fuente)}</code></pre><p class="cod-cap">${e(u.fragmento)}</p></div>
  <div class="card-body"><h3>${e(it.nombre)}</h3><p class="res"><strong>${e(it.resultado)}</strong></p><p>${e(it.detalle)}</p><ul class="chips" aria-label="${e(u.tecnologiasAria)}">${chips}</ul></div></li>`
    })
    .join('')
  return `<section id="sistemas" data-pieza="${c.pieza}" aria-labelledby="t-sistemas">
  <h2 id="t-sistemas" class="rv">${e(c.titulo)}</h2>
  <p class="intro rv">${e(c.intro)}</p>
  <ul class="cards">${items}</ul>
  <p class="otros rv">${e(c.otros)}</p>
</section>`
}

function tecnologias(c: Contenido['tecnologias']): string {
  const chips = c.chips
    .map(
      (ch, i) =>
        `<li><button type="button" class="tech" aria-describedby="d-tec-${i}"><span class="tech-n">${e(ch.nombre)}</span><span class="tech-d" id="d-tec-${i}">${e(ch.donde)}</span></button></li>`,
    )
    .join('')
  return `<section id="tecnologias" data-pieza="${c.pieza}" aria-labelledby="t-tecnologias">
  <h2 id="t-tecnologias" class="rv">${e(c.titulo)}</h2>
  <p class="intro rv">${e(c.intro)}</p>
  <ul class="techs rv">${chips}</ul>
</section>`
}

function ia(c: Contenido['ia'], u: Contenido['ui']): string {
  const items = c.items
    .map((it) => {
      const num =
        it.contador !== undefined
          ? `<p class="big acc" aria-hidden="true"><span data-count="${it.contador}">${it.contador}</span>${e(u.pct)}</p>`
          : ''
      const enlace = it.enlace
        ? `<p><a class="lnk" href="${e(it.enlace)}" target="_blank" rel="noopener">${e(u.verGithub)}<span class="sr"> ${e(u.pestana)}</span></a></p>`
        : ''
      return `<li class="card card-txt rv">${num}<h3>${e(it.nombre)}</h3><p>${e(it.texto)}</p>${enlace}</li>`
    })
    .join('')
  return `<section id="ia" data-pieza="${c.pieza}" aria-labelledby="t-ia">
  <h2 id="t-ia" class="rv">${e(c.titulo)}</h2>
  <ul class="cards cards-2">${items}</ul>
</section>`
}

function comunidad(c: Contenido['comunidad'], u: Contenido['ui']): string {
  const logros = c.logros
    .map((l) => `<li class="card card-txt rv"><p class="big acc">${e(l.valor)}</p><p>${e(l.texto)}</p></li>`)
    .join('')
  const charlas = c.charlas.map((t) => `<li>${e(t)}</li>`).join('')
  return `<section id="comunidad" data-pieza="${c.pieza}" aria-labelledby="t-comunidad">
  <h2 id="t-comunidad" class="rv">${e(c.titulo)}</h2>
  <p class="rol rv">${e(c.rol)}</p>
  <ul class="cards cards-2">${logros}</ul>
  <h3 class="rv">${e(u.charlas)}</h3>
  <ul class="lista rv">${charlas}</ul>
</section>`
}

function proyectos(c: Contenido['proyectos'], u: Contenido['ui']): string {
  const items = c.items
    .map((it) => {
      const links = [
        it.demo ? `<a class="lnk" href="${e(it.demo)}" target="_blank" rel="noopener">${e(u.demo)}<span class="sr"> ${e(u.de)} ${e(it.nombre)} ${e(u.pestana)}</span></a>` : '',
        it.repo ? `<a class="lnk" href="${e(it.repo)}" target="_blank" rel="noopener">${e(u.repositorio)}<span class="sr"> ${e(u.de)} ${e(it.nombre)} ${e(u.pestana)}</span></a>` : '',
      ].join('')
      return `<li class="card card-txt rv"><h3>${e(it.nombre)}</h3><p>${e(it.texto)}</p><p class="links">${links}</p></li>`
    })
    .join('')
  return `<section id="proyectos" data-pieza="${c.pieza}" aria-labelledby="t-proyectos">
  <h2 id="t-proyectos" class="rv">${e(c.titulo)}</h2>
  <ul class="cards cards-2">${items}</ul>
</section>`
}

function ensenanza(c: Contenido['ensenanza']): string {
  return `<section id="ensenanza" data-pieza="${c.pieza}" aria-labelledby="t-ensenanza">
  <h2 id="t-ensenanza" class="rv">${e(c.titulo)}</h2>
  <p class="destacado rv">${e(c.texto)}</p>
</section>`
}

function trayectoria(c: Contenido['trayectoria'], u: Contenido['ui']): string {
  const hitos = c.hitos
    .map((h) => `<li class="rv"><span class="anio">${e(h.anio)}</span><p>${e(h.texto)}</p></li>`)
    .join('')
  return `<section id="trayectoria" data-pieza="${c.pieza}" aria-labelledby="t-trayectoria">
  <h2 id="t-trayectoria" class="rv">${e(c.titulo)}</h2>
  <ol class="timeline">${hitos}</ol>
  <p class="idiomas rv"><span class="mono">${e(u.idiomasEtiqueta)}</span> ${e(c.idiomas)}</p>
</section>`
}

function contacto(c: Contenido['contacto'], n: Contenido['nicos'], u: Contenido['ui']): string {
  return `<section id="contacto" data-pieza="${c.pieza}" aria-labelledby="t-contacto">
  <h2 id="t-contacto" class="rv">${e(c.titulo)}</h2>
  <p class="intro rv">${e(c.texto)}</p>
  <div class="correo rv">
    <p class="mail"><span class="mono">${e(u.correoEtiqueta)}</span> <a id="correo" href="mailto:${e(c.email)}">${e(c.email)}</a></p>
    <button type="button" class="btn btn-ghost btn-sm" id="copiar" data-valor="${e(c.email)}" data-ok="${e(u.copiado)}" data-fallo="${e(u.copiarFallo)}" data-aviso-ok="${e(u.avisoCopiado)}" data-aviso-fallo="${e(u.avisoFallo)}">${e(u.copiar)}</button>
    <span class="sr" role="status" id="copiado"></span>
  </div>
  <p class="botones rv"><a class="btn" href="${e(c.linkedin)}" target="_blank" rel="noopener">LinkedIn<span class="sr"> ${e(u.pestana)}</span></a><a class="btn btn-ghost" href="${e(c.github)}" target="_blank" rel="noopener">GitHub<span class="sr"> ${e(u.pestana)}</span></a></p>
  <div class="pantalla rv" id="mini-term"><div class="mini-fb">
    <p class="mono">&gt; ${e(n.bienvenida)}<i class="cursor" aria-hidden="true"></i></p>
    <ul class="mini-links"><li>&gt; mail: <a href="mailto:${e(c.email)}">${e(c.email)}</a></li><li>&gt; linkedin: <a href="${e(c.linkedin)}" target="_blank" rel="noopener">${e(c.linkedin.replace('https://www.', ''))}</a></li><li>&gt; github: <a href="${e(c.github)}" target="_blank" rel="noopener">${e(c.github.replace('https://', ''))}</a></li></ul>
  </div></div>
  <p class="botones rv nicos-js"><button type="button" class="btn nicos-boot" id="nicos-encender" aria-haspopup="dialog">${e(n.encender)}</button></p>
</section>`
}

/** Título y descripción de la página en su idioma. */
export function renderHead(c: Contenido): string {
  return `<title>${e(c.meta.titulo)}</title>
    <meta name="description" content="${e(c.meta.descripcion)}" />`
}

/** Alternates hreflang (relativos a esta página). Se añaden después del procesado de Vite, que si no los trata como assets. */
export function hreflangs(c: Contenido, es: Contenido, en: Contenido): { hreflang: string; href: string }[] {
  const raiz = c.meta.ruta ? '../' : ''
  const href = (x: Contenido) => `${raiz}${x.meta.ruta}` || './'
  return [
    { hreflang: 'en', href: href(en) },
    { hreflang: 'es', href: href(es) },
    { hreflang: 'x-default', href: href(en) },
  ]
}

export function renderPage(c: Contenido, o: Opciones = {}): string {
  const raiz = o.raiz ?? ''
  return `${cabecera(c, raiz)}
<div class="layout">
  <main id="contenido">
${inicio(c, raiz)}
${sistemas(c.sistemas, c.ui, o)}
${tecnologias(c.tecnologias)}
${ia(c.ia, c.ui)}
${comunidad(c.comunidad, c.ui)}
${proyectos(c.proyectos, c.ui)}
${ensenanza(c.ensenanza)}
${trayectoria(c.trayectoria, c.ui)}
${contacto(c.contacto, c.nicos, c.ui)}
  </main>
  <aside class="stage" id="stage" data-active="${c.inicio.pieza}" data-modelo="${raiz}models/laptop.glb" aria-hidden="true">
    <div class="stage-in">${ilustracion()}</div>
  </aside>
</div>
<footer class="foot"><p>${e(c.ui.pie)} ${e(c.inicio.nombre)}</p></footer>
<script type="application/json" id="nicos-datos">${jsonSeguro(datosNicos(c, raiz))}</script>`
}
