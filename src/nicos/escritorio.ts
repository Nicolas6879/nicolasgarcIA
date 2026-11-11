// Escritorio nicOS: overlay retro con ventanas arrastrables, arranque falso y terminal.
// Módulo perezoso: main.ts lo importa con import() la primera vez que hace falta.
import './nicos.css'
import { leerDatos, type DatosNicos, type VentanaId } from './datos'
import { crearTerminal, type Terminal } from './terminal'

interface Ventana {
  id: VentanaId
  el: HTMLElement
  terminal?: Terminal
}

const ORDEN: VentanaId[] = ['leeme', 'proyectos', 'terminal', 'correo', 'cv']
const ANCHO_VENTANA = '(min-width: 860px)'
const FOCALES = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Iconos de 16x16 con trazo grueso (se ven "pixelados" al ampliarlos).
const ICONOS: Record<VentanaId, string> = {
  leeme: '<path d="M3 1h7l3 3v11H3z"/><path d="M10 1v3h3"/><path class="a" d="M5 8h6M5 10h6M5 12h4"/>',
  proyectos: '<path d="M1 3h5l1 2h8v9H1z"/><path class="a" d="M1 7h14"/>',
  terminal: '<path d="M1 2h14v12H1z"/><path class="a" d="M4 6l2 2-2 2M8 11h4"/>',
  correo: '<path d="M1 3h14v10H1z"/><path class="a" d="M1 3l7 6 7-6"/>',
  cv: '<path d="M3 1h10v14H3z"/><circle class="a" cx="8" cy="6" r="1.6"/><path class="a" d="M5 12c0-3 6-3 6 0"/>',
}
const icono = (id: VentanaId, tam = 44) =>
  `<svg viewBox="0 0 16 16" width="${tam}" height="${tam}" aria-hidden="true" focusable="false" shape-rendering="crispEdges">${ICONOS[id]}</svg>`

let d: DatosNicos | null = null
let raiz: HTMLElement | null = null
let capaVentanas: HTMLElement
let reloj: HTMLTimeElement
const ventanas = new Map<VentanaId, Ventana>()
let abierto = false
let booteado = false
let arrancando = false
let pendiente: VentanaId = 'terminal'
let previo: HTMLElement | null = null
let zTop = 10
let activa: VentanaId | null = null
let relojId = 0
let bloqueados: HTMLElement[] = []
let abortarBoot: (() => void) | null = null

const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const esEscritorio = () => window.matchMedia(ANCHO_VENTANA).matches

function el<K extends keyof HTMLElementTagNameMap>(tag: K, clase = '', html = ''): HTMLElementTagNameMap[K] {
  const x = document.createElement(tag)
  if (clase) x.className = clase
  if (html) x.innerHTML = html
  return x
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

// ---------- Contenido de cada ventana ----------
function contenido(id: VentanaId, d: DatosNicos, w: Ventana, body: HTMLElement) {
  const t = d.t
  if (id === 'leeme') {
    const b = d.bio
    const partes = b.nombre.split(' ')
    const ape = partes.pop()
    body.innerHTML = `<article class="nx-doc">
      <p class="nx-eyebrow">${esc(b.eyebrow)}</p>
      <h2>${esc(partes.join(' '))} <span class="acc">${esc(ape ?? '')}</span></h2>
      <p class="nx-lead">${esc(b.frase)}</p>
      <p class="nx-dim">${esc(b.ubicacion)}</p>
      <ul class="nx-cifras">${b.cifras.map((f) => `<li><b class="acc">${esc(f.valor)}</b><span>${esc(f.texto)}</span></li>`).join('')}</ul>
      <h3>${esc(b.ensenanzaTitulo)}</h3>
      <p>${esc(b.ensenanza)}</p></article>`
  } else if (id === 'proyectos') {
    const sis = d.sistemas.items.map((s) => `<li><b>${esc(s.nombre)}</b><span>${esc(s.resultado)}</span></li>`).join('')
    const pro = d.proyectos.items
      .map((p) => {
        const l = [
          p.demo ? `<a href="${esc(p.demo)}" target="_blank" rel="noopener">${esc(d.ui.demo)}<span class="sr"> ${esc(d.ui.pestana)}</span></a>` : '',
          p.repo ? `<a href="${esc(p.repo)}" target="_blank" rel="noopener">${esc(d.ui.repositorio)}<span class="sr"> ${esc(d.ui.pestana)}</span></a>` : '',
        ].join('')
        return `<li><b>${esc(p.nombre)}</b><span>${esc(p.texto)}</span><p class="nx-links">${l}</p></li>`
      })
      .join('')
    body.innerHTML = `<article class="nx-doc">
      <h3>${esc(d.sistemas.titulo)}</h3><ul class="nx-lista">${sis}</ul>
      <p><a href="#sistemas">${esc(t.verEnPagina)} →</a></p>
      <h3>${esc(d.proyectos.titulo)}</h3><ul class="nx-lista">${pro}</ul></article>`
  } else if (id === 'terminal') {
    w.terminal = crearTerminal(body, d, { abrir: (v) => abrir(v), salir: () => cerrar() })
  } else if (id === 'correo') {
    const c = d.contacto
    body.innerHTML = `<article class="nx-doc">
      <p class="nx-eyebrow">${esc(d.ui.correoEtiqueta)}</p>
      <p class="nx-mail"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
      <p><button type="button" class="nx-btn nx-btn-p" data-copiar>${esc(d.ui.copiar)}</button><span class="sr" role="status" data-estado></span></p>
      <p class="nx-dim">${esc(c.texto)}</p>
      <p class="nx-fila"><a class="nx-btn" href="${esc(c.linkedin)}" target="_blank" rel="noopener">LinkedIn<span class="sr"> ${esc(d.ui.pestana)}</span></a><a class="nx-btn" href="${esc(c.github)}" target="_blank" rel="noopener">GitHub<span class="sr"> ${esc(d.ui.pestana)}</span></a></p></article>`
    const btn = body.querySelector<HTMLButtonElement>('[data-copiar]')!
    const estado = body.querySelector<HTMLElement>('[data-estado]')!
    btn.addEventListener('click', async () => {
      let ok = false
      try {
        await navigator.clipboard.writeText(c.email)
        ok = true
      } catch {
        const r = document.createRange()
        r.selectNodeContents(body.querySelector('.nx-mail a')!)
        const s = window.getSelection()
        s?.removeAllRanges()
        s?.addRange(r)
        try {
          ok = document.execCommand('copy')
        } catch {
          ok = false
        }
      }
      const prev = d.ui.copiar
      btn.textContent = ok ? d.ui.copiado : d.ui.copiarFallo
      estado.textContent = btn.textContent
      setTimeout(() => (btn.textContent = prev), 2000)
    })
  } else {
    const f = (x: { href: string; etiqueta: string }) =>
      `<li><a class="nx-file" href="${esc(x.href)}" download>${icono('cv', 36)}<span>${esc(x.etiqueta)}</span></a></li>`
    body.innerHTML = `<article class="nx-doc"><ul class="nx-archivos">${f(d.cv.propio)}${f(d.cv.otro)}</ul></article>`
  }
}

// ---------- Ventanas ----------
function crearVentana(id: VentanaId): Ventana {
  const nombre = d!.t.ventanas[id]
  const nodo = el('section', `nx-win nx-w-${id}`)
  nodo.hidden = true
  nodo.id = `nx-w-${id}`
  nodo.setAttribute('role', 'region')
  nodo.setAttribute('aria-labelledby', `nx-t-${id}`)
  nodo.innerHTML = `<header class="nx-tb"><span class="nx-tt" id="nx-t-${id}">${esc(nombre)}</span><button type="button" class="nx-wx" aria-label="${esc(d!.t.cerrar)}: ${esc(nombre)}"><svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.8" fill="none"/></svg></button></header><div class="nx-body" data-lenis-prevent></div>`
  const w: Ventana = { id, el: nodo }
  contenido(id, d!, w, nodo.querySelector('.nx-body')!)
  nodo.querySelector('.nx-wx')!.addEventListener('click', () => cerrarVentana(id))
  nodo.addEventListener('pointerdown', () => enfocarVentana(id), true)
  arrastrable(nodo, nodo.querySelector('.nx-tb')!)
  capaVentanas.append(nodo)
  ventanas.set(id, w)
  return w
}

function arrastrable(win: HTMLElement, barra: HTMLElement) {
  barra.addEventListener('pointerdown', (ev) => {
    if (!esEscritorio() || (ev.target as HTMLElement).closest('button') || ev.button !== 0) return
    ev.preventDefault()
    const r = win.getBoundingClientRect()
    const dx = ev.clientX - r.left
    const dy = ev.clientY - r.top
    barra.setPointerCapture(ev.pointerId)
    win.classList.add('nx-drag')
    const mover = (e: PointerEvent) => {
      const topeY = (raiz!.querySelector('.nx-bar') as HTMLElement).offsetHeight
      const x = Math.min(Math.max(0, e.clientX - dx), window.innerWidth - win.offsetWidth)
      const y = Math.min(Math.max(topeY, e.clientY - dy), window.innerHeight - barra.offsetHeight)
      win.style.left = `${Math.max(0, x)}px`
      win.style.top = `${y}px`
    }
    const soltar = () => {
      barra.removeEventListener('pointermove', mover)
      barra.removeEventListener('pointerup', soltar)
      barra.removeEventListener('pointercancel', soltar)
      win.classList.remove('nx-drag')
    }
    barra.addEventListener('pointermove', mover)
    barra.addEventListener('pointerup', soltar)
    barra.addEventListener('pointercancel', soltar)
  })
}

function enfocarVentana(id: VentanaId) {
  const w = ventanas.get(id)
  if (!w) return
  ventanas.forEach((x) => x.el.classList.toggle('nx-act', x === w))
  w.el.style.zIndex = String(++zTop)
  activa = id
}

function abrirVentana(id: VentanaId) {
  const w = ventanas.get(id) ?? crearVentana(id)
  const yaAbierta = !w.el.hidden && !w.el.dataset.cerrando
  delete w.el.dataset.cerrando
  if (!esEscritorio()) ventanas.forEach((x) => x.id !== id && cerrarVentana(x.id)) // móvil: una a la vez
  if (!yaAbierta) {
    w.el.hidden = false
    if (esEscritorio() && !w.el.style.left) {
      // Cascada: cada ventana nueva se escalona respecto a las abiertas y se mantiene dentro del viewport.
      const n = [...ventanas.values()].filter((x) => !x.el.hidden).length - 1
      const ancho = w.el.offsetWidth
      const alto = w.el.offsetHeight
      const x = Math.min(150 + n * 34, Math.max(8, window.innerWidth - ancho - 16))
      const y = Math.min(58 + n * 30, Math.max(46, window.innerHeight - alto - 16))
      w.el.style.left = `${x}px`
      w.el.style.top = `${y}px`
    }
    if (!sinMovimiento()) {
      w.el.classList.remove('nx-sale')
      w.el.classList.add('nx-entra')
      setTimeout(() => w.el.classList.remove('nx-entra'), 200)
    }
  }
  enfocarVentana(id)
  // Foco inmediato en la terminal (si espera un frame, las primeras teclas se pierden).
  if (id === 'terminal') w.terminal?.enfocar()
  else requestAnimationFrame(() => w.el.querySelector<HTMLElement>('.nx-wx')?.focus({ preventScroll: true }))
}

function cerrarVentana(id: VentanaId) {
  const w = ventanas.get(id)
  if (!w || w.el.hidden) return
  w.el.dataset.cerrando = '1'
  const fin = () => {
    if (!w.el.dataset.cerrando) return // se reabrió antes de terminar
    delete w.el.dataset.cerrando
    w.el.hidden = true
    w.el.classList.remove('nx-sale', 'nx-entra')
  }
  if (sinMovimiento()) fin()
  else {
    w.el.classList.add('nx-sale')
    setTimeout(fin, 160)
  }
  if (activa === id) {
    activa = null
    // El foco vuelve al icono del escritorio para no perderse.
    raiz?.querySelector<HTMLElement>(`[data-ventana="${id}"]`)?.focus({ preventScroll: true })
  }
}

// ---------- Overlay ----------
function construir() {
  const data = d!
  const t = data.t
  raiz = el('div', 'nicos')
  raiz.hidden = true
  raiz.setAttribute('role', 'dialog')
  raiz.setAttribute('aria-modal', 'true')
  raiz.setAttribute('aria-label', 'nicOS')
  raiz.tabIndex = -1
  raiz.innerHTML = `<div class="nx-desk">
    <header class="nx-bar"><span class="nx-logo">nic<span class="acc">OS</span><i>1.0</i></span><span class="nx-fill"></span><time class="nx-clock"></time><button type="button" class="nx-close" aria-label="${esc(t.cerrar)} nicOS"><svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.8" fill="none"/></svg><span>Esc</span></button></header>
    <ul class="nx-icons" aria-label="${esc(t.escritorioAria)}">${ORDEN.map((id) => `<li><button type="button" class="nx-ico" data-ventana="${id}">${icono(id)}<span>${esc(t.ventanas[id])}</span></button></li>`).join('')}</ul>
    <div class="nx-wins"></div>
  </div>`
  capaVentanas = raiz.querySelector('.nx-wins')!
  reloj = raiz.querySelector('.nx-clock')!
  raiz.querySelector('.nx-close')!.addEventListener('click', () => cerrar())
  raiz.querySelectorAll<HTMLButtonElement>('.nx-ico').forEach((b) => b.addEventListener('click', () => abrirVentana(b.dataset.ventana as VentanaId)))
  // Enlaces internos (#sistemas...) cierran nicOS y dejan que el navegador navegue.
  raiz.addEventListener('click', (ev) => {
    const a = (ev.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
    if (a) cerrar(false)
  })
  raiz.addEventListener('keydown', alTeclado)
  document.addEventListener('keydown', (ev) => abierto && ev.key === 'Escape' && cerrar())
  document.body.append(raiz)
}

function alTeclado(ev: KeyboardEvent) {
  if (ev.key === 'Escape') {
    ev.preventDefault()
    cerrar()
    return
  }
  if (ev.key !== 'Tab' || !raiz) return
  const lista = [...raiz.querySelectorAll<HTMLElement>(FOCALES)].filter((x) => x.offsetParent !== null || x === document.activeElement)
  if (!lista.length) return
  const primero = lista[0]
  const ultimo = lista[lista.length - 1]
  const actual = document.activeElement as HTMLElement | null
  if (ev.shiftKey && (actual === primero || !raiz.contains(actual))) {
    ev.preventDefault()
    ultimo.focus()
  } else if (!ev.shiftKey && (actual === ultimo || !raiz.contains(actual))) {
    ev.preventDefault()
    primero.focus()
  }
}

function hora() {
  reloj.textContent = new Date().toLocaleTimeString(d!.lang, { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** Primer arranque: ~1.2 s con barra y líneas de log; cualquier tecla o clic lo salta. */
function arrancar(alTerminar: () => void) {
  arrancando = true
  const boot = el('div', 'nx-boot')
  const lineas = d!.t.arranque.lineas
  boot.innerHTML = `<div class="nx-boot-in"><p class="nx-boot-logo">nic<span class="acc">OS</span></p><p class="nx-boot-v">v1.0</p>
    <div class="nx-prog" role="progressbar" aria-label="nicOS" aria-valuemin="0" aria-valuemax="100"><i></i></div>
    <ul class="nx-boot-log" aria-hidden="true">${lineas.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <p class="nx-boot-skip">${esc(d!.t.arranque.saltar)}</p></div>`
  raiz!.append(boot)
  const items = [...boot.querySelectorAll<HTMLElement>('.nx-boot-log li')]
  const barra = boot.querySelector<HTMLElement>('.nx-prog i')!
  const timers: number[] = []
  let fin = false
  const terminar = () => {
    if (fin) return
    fin = true
    timers.forEach(clearTimeout)
    raiz!.removeEventListener('keydown', saltar, true)
    boot.removeEventListener('pointerdown', saltar)
    boot.classList.add('nx-boot-fin')
    const quitar = () => {
      boot.remove()
      abortarBoot = null
      arrancando = false
      booteado = true
      if (abierto) alTerminar()
    }
    if (sinMovimiento()) quitar()
    else setTimeout(quitar, 160)
  }
  const saltar = (ev: Event) => {
    if (ev instanceof KeyboardEvent && (ev.key === 'Escape' || ev.key === 'Tab')) return
    terminar()
  }
  raiz!.addEventListener('keydown', saltar, true)
  boot.addEventListener('pointerdown', saltar)
  // Si se cierra nicOS a mitad del arranque: se descarta sin abrir nada.
  abortarBoot = () => {
    fin = true
    timers.forEach(clearTimeout)
    raiz!.removeEventListener('keydown', saltar, true)
    boot.remove()
    abortarBoot = null
    arrancando = false
    booteado = true
  }
  requestAnimationFrame(() => (barra.style.width = '100%'))
  items.forEach((li, n) => timers.push(window.setTimeout(() => li.classList.add('on'), 150 + n * 250)))
  timers.push(window.setTimeout(terminar, 1250))
}

// ---------- API pública ----------
export function abrir(v: VentanaId = 'leeme'): void {
  d ??= leerDatos()
  if (!d) return
  if (!raiz) construir()
  pendiente = v
  if (!abierto) {
    abierto = true
    previo = document.activeElement as HTMLElement | null
    bloqueados = [...document.body.children].filter((x): x is HTMLElement => x !== raiz && x instanceof HTMLElement && !x.inert && x.tagName !== 'SCRIPT')
    bloqueados.forEach((x) => (x.inert = true))
    document.documentElement.classList.add('nicos-abierto')
    raiz!.hidden = false
    if (!sinMovimiento()) {
      raiz!.classList.remove('nx-sale')
      raiz!.classList.add('nx-entra')
      setTimeout(() => raiz!.classList.remove('nx-entra'), 220)
    }
    hora()
    relojId = window.setInterval(hora, 15000)
    window.dispatchEvent(new CustomEvent('nicos:open'))
    // Con Ctrl+K se va directo a la terminal: el arranque se comería lo que la persona escribe.
    if (!booteado && !sinMovimiento() && v !== 'terminal') {
      arrancar(() => abrirVentana(pendiente))
      raiz!.focus({ preventScroll: true })
      return
    }
    booteado = true
  }
  if (arrancando) return // el arranque abrirá `pendiente` al terminar
  abrirVentana(v)
}

export function cerrar(restaurarFoco = true): void {
  if (!abierto || !raiz) return
  abierto = false
  abortarBoot?.()
  clearInterval(relojId)
  const fin = () => {
    if (abierto) return // se volvió a abrir antes de que terminara la animación
    raiz!.hidden = true
    raiz!.classList.remove('nx-sale')
  }
  document.documentElement.classList.remove('nicos-abierto')
  bloqueados.forEach((x) => (x.inert = false))
  bloqueados = []
  if (sinMovimiento()) fin()
  else {
    raiz.classList.add('nx-sale')
    raiz.addEventListener('animationend', (ev) => ev.target === raiz && fin(), { once: true })
    setTimeout(fin, 250)
  }
  window.dispatchEvent(new CustomEvent('nicos:close'))
  if (restaurarFoco) {
    const destino = previo && previo.isConnected ? previo : document.getElementById('nicos-abrir')
    destino?.focus({ preventScroll: true })
  }
}

/** Mini-terminal de la sección de contacto: sustituye el bloque estático. */
export function montarMini(host: HTMLElement): void {
  d ??= leerDatos()
  if (!d || host.dataset.montado) return
  host.dataset.montado = '1'
  host.textContent = ''
  host.classList.add('mini-activa')
  crearTerminal(host, d, { abrir: (id) => abrir(id) }, { compacta: true })
}
