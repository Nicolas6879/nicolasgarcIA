// Genera el HTML de la página a partir del contenido de un idioma (es.ts o en.ts).
// Todos los enlaces a archivos de public/ y al otro idioma llevan el prefijo `raiz`,
// porque con base './' la página en español vive una carpeta más abajo (/es/).
import type { Contenido, ClaveSeccion, Pieza } from './content/tipos'
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
const NAV_MOVIL: readonly ClaveSeccion[] = ['sistemas', 'tecnologias', 'ia', 'comunidad', 'proyectos', 'ensenanza', 'trayectoria', 'contacto']

const svg = (w: number, d: string, sw = 2.2) =>
  `<svg viewBox="0 0 24 24" width="${w}" height="${w}" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const ICONO_TEMA =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>'
const ICONO_NICOS =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><rect x="2.5" y="4" width="19" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 10l3 2.5L7 15M12.5 15H17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const D_DESCARGA = 'M12 3v12m0 0l-5-5m5 5l5-5M5 20h14'
const ICONO_DESCARGA = svg(16, D_DESCARGA)
const ICONO_DESCARGA_FAB = svg(22, D_DESCARGA)
const ICONO_PDF = svg(13, D_DESCARGA)
const ICONO_EXTERNO = svg(14, 'M7 17L17 7M9 7h8v8')
const ICONO_CODIGO = svg(14, 'M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5')

/** Separador ` · ` visible y tenue entre partes de una línea (en vez de un punto medio pegado al texto). */
const sepa = (s: string): string => s.split(' · ').map(e).join('<span class="sep" aria-hidden="true">·</span>')

/** Eyebrow de sección que une el contenido con la pieza del portátil: "02 — Pantalla". */
function ojo(u: Contenido['ui'], pieza: Pieza, n: number): string {
  return `<p class="sec-eb rv"><span class="sec-n">${String(n).padStart(2, '0')}</span><span class="sec-dash" aria-hidden="true">—</span><span>${e(u.piezas[pieza])}</span></p>`
}

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
  return `<a class="cv-alt" href="${raiz}${archivo}" download>${ICONO_PDF}<span>${e(texto)}</span></a>`
}

function cabecera(c: Contenido, raiz: string): string {
  const u = c.ui
  const enlaces = NAV_HEADER.map((k) => `<a href="#${k}">${e(u.nav[k])}</a>`).join('')
  const movil = NAV_MOVIL.map((k) => `<a href="#${k}">${e(u.nav[k])}</a>`).join('')
  const cv = `${raiz}${u.cvPropio}`
  return `<a class="skip" href="#contenido">${e(u.saltar)}</a>
<header class="top">
  <div class="top-in wrap">
    <a class="brand" href="#inicio" aria-label="${e(c.inicio.nombre)}"><span aria-hidden="true">nicolasgarc<span class="brand-ia">IA</span></span></a>
    <nav class="nav-main" aria-label="${e(u.navAria)}">${enlaces}</nav>
    <div class="top-actions">
      <a class="btn btn-sm btn-ghost cv-top" href="${cv}" download>${ICONO_DESCARGA}<span>${e(u.descargarCv)}</span></a>
      <a class="lang-switch" id="idioma" href="${raiz}${u.idioma.ruta}" hreflang="${u.idioma.lang}" lang="${u.idioma.lang}" aria-label="${e(u.idioma.aria)}">${e(u.idioma.texto)}</a>
      <button type="button" class="nicos-btn" id="nicos-abrir" aria-label="${e(c.nicos.botonCabecera)}" aria-haspopup="dialog">${ICONO_NICOS}<span class="nb-t">${e(c.nicos.botonCabecera)}</span><kbd aria-hidden="true">Ctrl K</kbd></button>
      <button type="button" class="icon-btn" id="tema" aria-label="${e(u.temaAria)}">${ICONO_TEMA}</button>
    </div>
  </div>
  <nav class="subnav" aria-label="${e(u.navAria)}"><div class="subnav-in">${movil}</div></nav>
  <span class="progress" id="progreso" aria-hidden="true"></span>
</header>
<a class="cv-fab" href="${cv}" download aria-label="${e(u.cvFabAria)}">${ICONO_DESCARGA_FAB}</a>`
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
  <p class="loc rv">${sepa(c.ubicacion)}</p>
  <ul class="cifras rv">${cifras}</ul>
  <p class="botones rv"><a class="btn cta-cv" href="${raiz}${cc.ui.cvPropio}" download>${e(c.botones.cv)}</a><a class="btn btn-ghost" href="#contacto">${e(c.botones.contacto)}</a>${cvOtro(cc, raiz)}</p>
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
  ${ojo(u, c.pieza, 2)}
  <h2 id="t-sistemas" class="rv">${e(c.titulo)}</h2>
  <p class="intro rv">${e(c.intro)}</p>
  <ul class="cards">${items}</ul>
  <p class="otros rv">${e(c.otros)}</p>
</section>`
}

function tecnologias(c: Contenido['tecnologias'], u: Contenido['ui']): string {
  const chips = c.chips
    .map((ch) => `<li class="tech"><span class="tech-n">${e(ch.nombre)}</span><span class="tech-d">${e(ch.donde)}</span></li>`)
    .join('')
  return `<section id="tecnologias" data-pieza="${c.pieza}" aria-labelledby="t-tecnologias">
  ${ojo(u, c.pieza, 3)}
  <h2 id="t-tecnologias" class="rv">${e(c.titulo)}</h2>
  <p class="intro rv">${e(c.intro)}</p>
  <ul class="techs rv" aria-label="${e(u.tecnologiasAria)}">${chips}</ul>
</section>`
}

function ia(c: Contenido['ia'], u: Contenido['ui']): string {
  const tarjeta = (it: Contenido['ia']['items'][number]): string => {
    const destacada = it.contador !== undefined
    const num = destacada
      ? `<p class="big acc ia-num" aria-hidden="true"><span data-count="${it.contador}">${it.contador}</span>${e(u.pct)}</p>`
      : ''
    const enlace = it.enlace
      ? `<p class="ia-link"><a class="btn btn-sm btn-ghost" href="${e(it.enlace)}" target="_blank" rel="noopener">${ICONO_CODIGO}<span>${e(u.verGithub)}</span><span class="sr"> ${e(u.pestana)}</span></a></p>`
      : ''
    return `<li class="card card-txt rv${destacada ? ' ia-feat' : ''}">${num}<div class="ia-body"><h3>${e(it.nombre)}</h3><p>${e(it.texto)}</p>${enlace}</div></li>`
  }
  const todas = [...c.items.filter((i) => i.contador !== undefined), ...c.items.filter((i) => i.contador === undefined)]
  return `<section id="ia" data-pieza="${c.pieza}" aria-labelledby="t-ia">
  ${ojo(u, c.pieza, 4)}
  <h2 id="t-ia" class="rv">${e(c.titulo)}</h2>
  <ul class="cards cards-ia">${todas.map(tarjeta).join('')}</ul>
</section>`
}

function comunidad(c: Contenido['comunidad'], u: Contenido['ui']): string {
  const logros = c.logros
    .map((l) => `<li class="card card-txt stat rv"><p class="big acc">${e(l.valor)}</p><p>${e(l.texto)}</p></li>`)
    .join('')
  const charlas = c.charlas.map((t) => `<li>${e(t)}</li>`).join('')
  return `<section id="comunidad" data-pieza="${c.pieza}" aria-labelledby="t-comunidad">
  ${ojo(u, c.pieza, 5)}
  <h2 id="t-comunidad" class="rv">${e(c.titulo)}</h2>
  <p class="rol rv"><strong>${e(c.rol.texto)}</strong><span class="tag">${e(c.rol.fechas)}</span></p>
  <ul class="cards cards-2 cards-stats">${logros}</ul>
  <h3 class="rv">${e(u.charlas)}</h3>
  <ul class="lista rv">${charlas}</ul>
</section>`
}

function proyectos(c: Contenido['proyectos'], u: Contenido['ui']): string {
  const items = c.items
    .map((it) => {
      const aria = `<span class="sr"> ${e(u.de)} ${e(it.nombre)} ${e(u.pestana)}</span>`
      const links = [
        it.demo ? `<a class="btn btn-sm btn-acc" href="${e(it.demo)}" target="_blank" rel="noopener"><span>${e(u.demo)}</span>${ICONO_EXTERNO}${aria}</a>` : '',
        it.repo ? `<a class="btn btn-sm btn-ghost" href="${e(it.repo)}" target="_blank" rel="noopener">${ICONO_CODIGO}<span>${e(u.repositorio)}</span>${aria}</a>` : '',
      ].join('')
      return `<li class="card card-txt proj rv"><p class="meta">${sepa(it.meta)}</p><h3>${e(it.nombre)}</h3><p>${e(it.texto)}</p><p class="links">${links}</p></li>`
    })
    .join('')
  return `<section id="proyectos" data-pieza="${c.pieza}" aria-labelledby="t-proyectos">
  ${ojo(u, c.pieza, 6)}
  <h2 id="t-proyectos" class="rv">${e(c.titulo)}</h2>
  <ul class="cards cards-2">${items}</ul>
</section>`
}

function ensenanza(c: Contenido['ensenanza'], u: Contenido['ui']): string {
  return `<section id="ensenanza" data-pieza="${c.pieza}" aria-labelledby="t-ensenanza">
  ${ojo(u, c.pieza, 7)}
  <h2 id="t-ensenanza" class="rv">${e(c.titulo)}</h2>
  <p class="destacado rv">${e(c.texto)}</p>
</section>`
}

function trayectoria(c: Contenido['trayectoria'], u: Contenido['ui']): string {
  const hitos = c.hitos
    .map((h) => `<li class="rv"><span class="anio">${e(h.anio)}</span><p>${e(h.texto)}</p></li>`)
    .join('')
  return `<section id="trayectoria" data-pieza="${c.pieza}" aria-labelledby="t-trayectoria">
  ${ojo(u, c.pieza, 8)}
  <h2 id="t-trayectoria" class="rv">${e(c.titulo)}</h2>
  <ol class="timeline">${hitos}</ol>
  <dl class="idiomas rv"><dt class="mono">${e(u.idiomasEtiqueta)}</dt><dd>${sepa(c.idiomas)}</dd></dl>
</section>`
}

function contacto(c: Contenido['contacto'], n: Contenido['nicos'], u: Contenido['ui']): string {
  return `<section id="contacto" data-pieza="${c.pieza}" aria-labelledby="t-contacto">
  ${ojo(u, c.pieza, 9)}
  <h2 id="t-contacto" class="rv">${e(c.titulo)}</h2>
  <p class="intro rv">${e(c.texto)}</p>
  <div class="correo rv">
    <span class="mono">${e(u.correoEtiqueta)}</span>
    <p class="mail"><a id="correo" href="mailto:${e(c.email)}">${e(c.email)}</a><button type="button" class="btn btn-ghost btn-sm" id="copiar" data-valor="${e(c.email)}" data-ok="${e(u.copiado)}" data-fallo="${e(u.copiarFallo)}" data-aviso-ok="${e(u.avisoCopiado)}" data-aviso-fallo="${e(u.avisoFallo)}">${e(u.copiar)}</button></p>
    <span class="sr" role="status" id="copiado"></span>
  </div>
  <p class="botones rv"><a class="btn" href="${e(c.linkedin)}" target="_blank" rel="noopener">LinkedIn<span class="sr"> ${e(u.pestana)}</span></a><a class="btn btn-ghost" href="${e(c.github)}" target="_blank" rel="noopener">GitHub<span class="sr"> ${e(u.pestana)}</span></a></p>
  <div class="pantalla rv" id="mini-term"><div class="mini-fb">
    <p class="mono">&gt; ${e(n.bienvenida)}<i class="cursor" aria-hidden="true"></i></p>
    <ul class="mini-links"><li>&gt; mail: <a href="mailto:${e(c.email)}">${e(c.email)}</a></li><li>&gt; linkedin: <a href="${e(c.linkedin)}" target="_blank" rel="noopener">${e(c.linkedin.replace('https://www.', ''))}</a></li><li>&gt; github: <a href="${e(c.github)}" target="_blank" rel="noopener">${e(c.github.replace('https://', ''))}</a></li></ul>
  </div></div>
  <p class="botones rv nicos-js"><button type="button" class="btn btn-ghost btn-term nicos-boot" id="nicos-encender" aria-haspopup="dialog">${ICONO_NICOS}<span>${e(n.encender)}</span></button></p>
</section>`
}

function pie(c: Contenido, raiz: string): string {
  const u = c.ui
  const k = c.contacto
  const ext = (href: string, t: string) =>
    `<a href="${e(href)}" target="_blank" rel="noopener">${e(t)}<span class="sr"> ${e(u.pestana)}</span></a>`
  return `<footer class="foot">
  <div class="foot-in wrap">
    <div class="foot-main">
      <p class="foot-brand"><span aria-hidden="true">nicolasgarc<span class="brand-ia">IA</span></span><span class="sr">nicolasgarcIA</span></p>
      <p class="foot-line">${sepa(u.pieLinea)}</p>
    </div>
    <ul class="foot-links">
      <li><a href="mailto:${e(k.email)}">${e(u.correoEtiqueta)}</a></li>
      <li>${ext(k.linkedin, 'LinkedIn')}</li>
      <li>${ext(k.github, 'GitHub')}</li>
      <li>${ext('https://github.com/Nicolas6879/nicolasgarcIA', u.pieCodigo)}</li>
      <li><a href="${raiz}${u.cvPropio}" download>${e(u.cvEtiqueta)}</a></li>
    </ul>
    <div class="foot-base">
      <p>${e(u.pie)} ${e(c.inicio.nombre)}</p>
      <p class="foot-hint">${e(u.pieAtajo)} <kbd>Ctrl K</kbd></p>
    </div>
  </div>
</footer>`
}

const NOMBRE = 'Juan Nicolás García'
const jsonLd = (d: unknown): string => JSON.stringify(d).replace(/</g, '\u003c').replace(/&/g, '\u0026')

/** Título, descripción, Open Graph / Twitter y JSON-LD de la página. `sitio` (SITE_URL) habilita las URL absolutas. */
export function renderHead(c: Contenido, sitio = ''): string {
  const es = c.meta.lang === 'es'
  const urlPag = sitio ? `${sitio}/${c.meta.ruta}` : ''
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: NOMBRE,
    jobTitle: es ? 'Ingeniero full-stack' : 'Full-stack engineer',
    description: c.meta.descripcion,
    ...(sitio ? { url: urlPag, image: `${sitio}/og.png` } : {}),
    sameAs: [c.contacto.linkedin, c.contacto.github],
    address: { '@type': 'PostalAddress', addressLocality: 'Bucaramanga', addressCountry: 'CO' },
  }
  const og = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="nicolasgarcIA" />`,
    `<meta property="og:title" content="${e(c.meta.titulo)}" />`,
    `<meta property="og:description" content="${e(c.meta.descripcion)}" />`,
    `<meta property="og:locale" content="${es ? 'es_CO' : 'en_US'}" />`,
    `<meta property="og:locale:alternate" content="${es ? 'en_US' : 'es_CO'}" />`,
    ...(sitio
      ? [
          `<meta property="og:url" content="${e(urlPag)}" />`,
          `<meta property="og:image" content="${e(sitio)}/og.png" />`,
          `<meta property="og:image:width" content="1200" />`,
          `<meta property="og:image:height" content="630" />`,
          `<meta name="twitter:image" content="${e(sitio)}/og.png" />`,
        ]
      : []),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(c.meta.titulo)}" />`,
    `<meta name="twitter:description" content="${e(c.meta.descripcion)}" />`,
  ].join('\n    ')
  return `<title>${e(c.meta.titulo)}</title>
    <meta name="description" content="${e(c.meta.descripcion)}" />
    <meta name="author" content="${NOMBRE}" />
    <meta name="theme-color" content="#161B26" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#EEF1F5" media="(prefers-color-scheme: light)" />
    ${og}
    <script type="application/ld+json">${jsonLd(ld)}</script>`
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
<div class="layout wrap">
  <main id="contenido">
${inicio(c, raiz)}
${sistemas(c.sistemas, c.ui, o)}
${tecnologias(c.tecnologias, c.ui)}
${ia(c.ia, c.ui)}
${comunidad(c.comunidad, c.ui)}
${proyectos(c.proyectos, c.ui)}
${ensenanza(c.ensenanza, c.ui)}
${trayectoria(c.trayectoria, c.ui)}
${contacto(c.contacto, c.nicos, c.ui)}
  </main>
  <aside class="stage" id="stage" data-active="${c.inicio.pieza}" data-modelo="${raiz}models/laptop.glb" aria-hidden="true">
    <div class="stage-in">${ilustracion()}</div>
  </aside>
</div>
${pie(c, raiz)}
<script type="application/json" id="nicos-datos">${jsonSeguro(datosNicos(c, raiz))}</script>`
}
