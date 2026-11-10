import type { es } from './content/es'

type Contenido = typeof es

export interface Opciones {
  /** Indica si un archivo de /public existe (para usar la captura real o el placeholder). */
  existe?: (ruta: string) => boolean
}

interface ItemSistema { nombre: string; resultado: string; detalle: string; stack: readonly string[]; captura: string }
interface ItemIA { nombre: string; texto: string; enlace?: string; contador?: number }
interface ItemProyecto { nombre: string; texto: string; demo?: string; repo?: string }

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const e = (s: string | number): string => String(s).replace(/[&<>"']/g, (c) => ESC[c])

export const CV_RUTA = 'cv/Juan-Nicolas-Garcia-CV.pdf'

const SECCIONES = ['sistemas', 'tecnologias', 'ia', 'comunidad', 'proyectos', 'ensenanza', 'trayectoria', 'contacto'] as const
type Seccion = (typeof SECCIONES)[number]
const NAV: Record<Seccion, string> = {
  sistemas: 'Sistemas', tecnologias: 'Tecnologías', ia: 'IA', comunidad: 'Comunidad',
  proyectos: 'Proyectos', ensenanza: 'Enseñanza', trayectoria: 'Trayectoria', contacto: 'Contacto',
}
const NAV_HEADER: readonly Seccion[] = ['sistemas', 'ia', 'comunidad', 'proyectos', 'contacto']

const ICONO_TEMA =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>'
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

function cabecera(): string {
  const enlaces = NAV_HEADER.map((k) => `<a href="#${k}">${e(NAV[k])}</a>`).join('')
  return `<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="top">
  <a class="brand" href="#inicio">Juan Nicolás García</a>
  <nav aria-label="Secciones">${enlaces}</nav>
  <div class="top-actions">
    <a class="btn btn-sm cv-top" href="${CV_RUTA}" download>${ICONO_DESCARGA}<span>Descargar CV</span></a>
    <button type="button" class="icon-btn" id="tema" aria-label="Cambiar tema claro u oscuro">${ICONO_TEMA}</button>
  </div>
</header>
<a class="btn cv-fab" href="${CV_RUTA}" download>${ICONO_DESCARGA}<span>Descargar CV</span></a>`
}

function inicio(c: Contenido['inicio']): string {
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
  <p class="botones rv"><a class="btn" href="${CV_RUTA}" download>${e(c.botones.cv)}</a><a class="btn btn-ghost" href="#contacto">${e(c.botones.contacto)}</a></p>
  <p class="pista rv">${e(c.pista)}</p>
</section>`
}

function sistemas(c: Contenido['sistemas'], o: Opciones): string {
  const items = (c.items as readonly ItemSistema[])
    .map((it) => {
      const base = it.captura.replace(/\.[a-z0-9]+$/i, '')
      const real = `capturas/${it.captura}`
      const src = o.existe?.(real) ? real : `capturas/placeholder-${base}.svg`
      const chips = it.stack.map((s) => `<li>${e(s)}</li>`).join('')
      return `<li class="card rv"><img src="${e(src)}" width="1600" height="1000" loading="lazy" alt="Captura de ${e(it.nombre)}" />
  <div class="card-body"><h3>${e(it.nombre)}</h3><p class="res"><strong>${e(it.resultado)}</strong></p><p>${e(it.detalle)}</p><ul class="chips" aria-label="Tecnologías">${chips}</ul></div></li>`
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

function ia(c: Contenido['ia']): string {
  const items = (c.items as readonly ItemIA[])
    .map((it) => {
      const num =
        it.contador !== undefined
          ? `<p class="big acc" aria-hidden="true"><span data-count="${it.contador}">${it.contador}</span> %</p>`
          : ''
      const enlace = it.enlace
        ? `<p><a class="lnk" href="${e(it.enlace)}" target="_blank" rel="noopener">Ver en GitHub<span class="sr"> (se abre en pestaña nueva)</span></a></p>`
        : ''
      return `<li class="card card-txt rv">${num}<h3>${e(it.nombre)}</h3><p>${e(it.texto)}</p>${enlace}</li>`
    })
    .join('')
  return `<section id="ia" data-pieza="${c.pieza}" aria-labelledby="t-ia">
  <h2 id="t-ia" class="rv">${e(c.titulo)}</h2>
  <ul class="cards cards-2">${items}</ul>
</section>`
}

function comunidad(c: Contenido['comunidad']): string {
  const logros = c.logros
    .map((l) => `<li class="card card-txt rv"><p class="big acc">${e(l.valor)}</p><p>${e(l.texto)}</p></li>`)
    .join('')
  const charlas = c.charlas.map((t) => `<li>${e(t)}</li>`).join('')
  return `<section id="comunidad" data-pieza="${c.pieza}" aria-labelledby="t-comunidad">
  <h2 id="t-comunidad" class="rv">${e(c.titulo)}</h2>
  <p class="rol rv">${e(c.rol)}</p>
  <ul class="cards cards-2">${logros}</ul>
  <h3 class="rv">Charlas y talleres</h3>
  <ul class="lista rv">${charlas}</ul>
</section>`
}

function proyectos(c: Contenido['proyectos']): string {
  const items = (c.items as readonly ItemProyecto[])
    .map((it) => {
      const links = [
        it.demo ? `<a class="lnk" href="${e(it.demo)}" target="_blank" rel="noopener">Demo<span class="sr"> de ${e(it.nombre)} (pestaña nueva)</span></a>` : '',
        it.repo ? `<a class="lnk" href="${e(it.repo)}" target="_blank" rel="noopener">Repositorio<span class="sr"> de ${e(it.nombre)} (pestaña nueva)</span></a>` : '',
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

function trayectoria(c: Contenido['trayectoria']): string {
  const hitos = c.hitos
    .map((h) => `<li class="rv"><span class="anio">${e(h.anio)}</span><p>${e(h.texto)}</p></li>`)
    .join('')
  return `<section id="trayectoria" data-pieza="${c.pieza}" aria-labelledby="t-trayectoria">
  <h2 id="t-trayectoria" class="rv">${e(c.titulo)}</h2>
  <ol class="timeline">${hitos}</ol>
  <p class="idiomas rv"><span class="mono">Idiomas</span> ${e(c.idiomas)}</p>
</section>`
}

function contacto(c: Contenido['contacto'], n: Contenido['nicos']): string {
  return `<section id="contacto" data-pieza="${c.pieza}" aria-labelledby="t-contacto">
  <h2 id="t-contacto" class="rv">${e(c.titulo)}</h2>
  <p class="intro rv">${e(c.texto)}</p>
  <div class="correo rv">
    <p class="mail"><span class="mono">Correo</span> <a id="correo" href="mailto:${e(c.email)}">${e(c.email)}</a></p>
    <button type="button" class="btn btn-ghost btn-sm" id="copiar" data-valor="${e(c.email)}">Copiar</button>
    <span class="sr" role="status" id="copiado"></span>
  </div>
  <p class="botones rv"><a class="btn" href="${e(c.linkedin)}" target="_blank" rel="noopener">LinkedIn<span class="sr"> (pestaña nueva)</span></a><a class="btn btn-ghost" href="${e(c.github)}" target="_blank" rel="noopener">GitHub<span class="sr"> (pestaña nueva)</span></a></p>
  <div class="pantalla rv"><p class="mono">&gt; ${e(n.bienvenida)}<i class="cursor" aria-hidden="true"></i></p></div>
</section>`
}

export function renderPage(c: Contenido, o: Opciones = {}): string {
  return `${cabecera()}
<div class="layout">
  <main id="contenido">
${inicio(c.inicio)}
${sistemas(c.sistemas, o)}
${tecnologias(c.tecnologias)}
${ia(c.ia)}
${comunidad(c.comunidad)}
${proyectos(c.proyectos)}
${ensenanza(c.ensenanza)}
${trayectoria(c.trayectoria)}
${contacto(c.contacto, c.nicos)}
  </main>
  <aside class="stage" id="stage" data-active="${c.inicio.pieza}" aria-hidden="true">
    <div class="stage-in">${ilustracion()}</div>
  </aside>
</div>
<footer class="foot"><p>© 2026 ${e(c.inicio.nombre)}</p></footer>`
}
