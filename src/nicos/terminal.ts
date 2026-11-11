// Motor de la terminal de nicOS (sin dependencias). Se usa tanto en la ventana del escritorio como
// en la mini-terminal de la sección de contacto. Los textos vienen de los datos del idioma.
import type { DatosNicos, VentanaId } from './datos'

type Cmd =
  | 'ayuda' | 'whoami' | 'proyectos' | 'cv' | 'tacano' | 'hedera' | 'contacto' | 'ls' | 'abrir'
  | 'tema' | 'idioma' | 'limpiar' | 'salir' | 'cafe' | 'sudo'

/** [inglés, español] de cada comando; en ambas páginas se aceptan los dos nombres. */
const NOMBRES: Record<Cmd, [string, string]> = {
  ayuda: ['help', 'ayuda'],
  whoami: ['whoami', 'whoami'],
  proyectos: ['projects', 'proyectos'],
  cv: ['cv', 'cv'],
  tacano: ['tacano', 'tacano'],
  hedera: ['hedera', 'hedera'],
  contacto: ['contact', 'contacto'],
  ls: ['ls', 'ls'],
  abrir: ['open', 'abrir'],
  tema: ['theme', 'tema'],
  idioma: ['lang', 'idioma'],
  limpiar: ['clear', 'limpiar'],
  salir: ['exit', 'salir'],
  cafe: ['coffee', 'cafe'],
  sudo: ['sudo', 'sudo'],
}
const EXTRA: Record<string, Cmd> = { 'tacaño': 'tacano', 'café': 'cafe' }
const ORDEN_AYUDA: Cmd[] = ['ayuda', 'whoami', 'proyectos', 'cv', 'tacano', 'hedera', 'contacto', 'ls', 'abrir', 'tema', 'idioma', 'limpiar', 'salir']

const VENTANAS: Record<VentanaId, [string, string]> = {
  leeme: ['readme', 'leeme'],
  proyectos: ['projects', 'proyectos'],
  terminal: ['terminal', 'terminal'],
  correo: ['mail', 'correo'],
  cv: ['cv', 'cv'],
}
const EXTRA_VENTANA: Record<string, VentanaId> = { read: 'leeme', 'léeme': 'leeme', email: 'correo', 'e-mail': 'correo', contact: 'correo', contacto: 'correo' }

export interface Ganchos {
  /** Abre una ventana del escritorio (lo enciende si hace falta). */
  abrir(id: VentanaId): void
  /** Apaga nicOS. Ausente en la mini-terminal, que no vive dentro del escritorio. */
  salir?: () => void
}

export interface Terminal {
  el: HTMLElement
  enfocar(): void
}

type Parte = string | Node

const RE_ENLACE = /(https?:\/\/[^\s]+|github\.com\/[^\s]+)/g

/** Convierte URLs y "github.com/..." del texto en <a> reales. */
function conEnlaces(texto: string): Parte[] {
  const partes: Parte[] = []
  let i = 0
  for (const m of texto.matchAll(RE_ENLACE)) {
    const url = m[0]
    if (m.index! > i) partes.push(texto.slice(i, m.index))
    partes.push(enlace(url, url.startsWith('http') ? url : 'https://' + url))
    i = m.index! + url.length
  }
  if (i < texto.length) partes.push(texto.slice(i))
  return partes
}

function enlace(texto: string, href: string, externo = true): HTMLAnchorElement {
  const a = document.createElement('a')
  a.textContent = texto
  a.href = href
  if (externo) {
    a.target = '_blank'
    a.rel = 'noopener'
  }
  return a
}

function span(clase: string, texto: string): HTMLSpanElement {
  const s = document.createElement('span')
  s.className = clase
  s.textContent = texto
  return s
}

export function crearTerminal(host: HTMLElement, d: DatosNicos, g: Ganchos, opc: { compacta?: boolean } = {}): Terminal {
  const i = d.lang === 'es' ? 1 : 0
  const t = d.t
  const c = t.comandos

  // nombre (en o es, sin tildes) -> comando
  const mapa = new Map<string, Cmd>()
  for (const k of Object.keys(NOMBRES) as Cmd[]) for (const n of NOMBRES[k]) mapa.set(n, k)
  for (const [n, k] of Object.entries(EXTRA)) mapa.set(n, k)
  const ventanaPor = new Map<string, VentanaId>()
  for (const k of Object.keys(VENTANAS) as VentanaId[]) for (const n of VENTANAS[k]) ventanaPor.set(n, k)
  for (const [n, k] of Object.entries(EXTRA_VENTANA)) ventanaPor.set(n, k)

  // ---- DOM ----
  const el = document.createElement('div')
  el.className = 'nt' + (opc.compacta ? ' nt-mini' : '')
  el.setAttribute('data-lenis-prevent', '')
  const log = document.createElement('div')
  log.className = 'nt-log'
  log.setAttribute('role', 'log')
  log.setAttribute('aria-live', 'polite')
  const form = document.createElement('form')
  form.className = 'nt-form'
  form.autocomplete = 'off'
  const idInput = 'nt-in-' + Math.random().toString(36).slice(2, 8)
  const lbl = document.createElement('label')
  lbl.className = 'nt-prompt'
  lbl.htmlFor = idInput
  lbl.textContent = 'nico@nicos:~$'
  const input = document.createElement('input')
  input.id = idInput
  input.className = 'nt-input'
  input.type = 'text'
  input.placeholder = t.escribe
  input.setAttribute('aria-label', t.entradaAria)
  input.autocomplete = 'off'
  input.autocapitalize = 'off'
  input.spellcheck = false
  input.setAttribute('autocorrect', 'off')
  input.enterKeyHint = 'go'
  form.append(lbl, input)
  el.append(log, form)
  host.append(el)

  const bajar = () => {
    el.scrollTop = el.scrollHeight
  }
  const linea = (partes: Parte[], clase = '') => {
    const p = document.createElement('p')
    p.className = 'nt-l' + (clase ? ' ' + clase : '')
    p.append(...partes)
    log.append(p)
    bajar()
  }
  const texto = (s: string, clase = '') => linea(conEnlaces(s), clase)

  // ---- Comandos ----
  const nombreCmd = (k: Cmd) => NOMBRES[k][i]
  const ventanaNombre = (id: VentanaId) => VENTANAS[id][i]

  function ayuda() {
    texto(c.ayuda)
    for (const k of ORDEN_AYUDA) {
      linea([span('nt-cmd', nombreCmd(k).padEnd(10)), c.descripciones[k as keyof typeof c.descripciones]], 'nt-ind')
    }
    texto(c.ayudaPie, 'nt-dim')
  }

  function proyectos() {
    texto(c.proyectosSistemas)
    for (const s of d.sistemas.items) linea(['· ' + s.nombre], 'nt-ind')
    linea([enlace(t.verEnPagina + ' →', '#sistemas', false)], 'nt-ind')
    texto(c.proyectosPropios)
    for (const p of d.proyectos.items) {
      const partes: Parte[] = ['· ' + p.nombre]
      if (p.demo) partes.push('  ', enlace(d.ui.demo, p.demo))
      if (p.repo) partes.push('  ', enlace(d.ui.repositorio, p.repo))
      linea(partes, 'nt-ind')
    }
  }

  function descargarCv() {
    texto(c.cv)
    const { href, etiqueta } = d.cv.propio
    const a = enlace(etiqueta, href, false)
    a.download = ''
    linea([a], 'nt-ind')
    // Descarga directa (el enlace queda por si el navegador la bloquea).
    const tmp = document.createElement('a')
    tmp.href = href
    tmp.download = ''
    tmp.hidden = true
    document.body.append(tmp)
    tmp.click()
    tmp.remove()
  }

  function abrirVentana(arg: string | undefined) {
    if (!arg) return texto(c.abrirUso)
    const id = ventanaPor.get(arg.toLowerCase())
    if (!id) return texto(c.abrirNoExiste.replace('{n}', arg))
    texto(c.abriendo.replace('{n}', t.ventanas[id]))
    g.abrir(id)
  }

  function ejecutar(crudo: string) {
    const partes = crudo.trim().split(/\s+/)
    const nombre = partes[0].toLowerCase()
    const cmd = mapa.get(nombre)
    if (!cmd) return texto(c.desconocido, 'nt-err')
    switch (cmd) {
      case 'ayuda': return ayuda()
      case 'whoami': return texto(c.whoami)
      case 'proyectos': return proyectos()
      case 'cv': return descargarCv()
      case 'tacano': return texto(c.tacano)
      case 'hedera': return texto(c.hedera)
      case 'contacto': return texto(c.contacto)
      case 'ls': return linea([(Object.keys(VENTANAS) as VentanaId[]).map(ventanaNombre).join('   ')])
      case 'abrir': return abrirVentana(partes[1])
      case 'limpiar': return void (log.textContent = '')
      case 'tema':
        document.getElementById('tema')?.click()
        return texto(c.tema)
      case 'idioma':
        texto(c.idioma)
        setTimeout(() => (window.location.href = d.idiomaHref + window.location.hash), 350)
        return
      case 'salir':
        if (!g.salir) return texto(c.salirFuera)
        texto(c.salir)
        return void setTimeout(() => g.salir?.(), 450)
      case 'cafe':
        return void c.cafe.forEach((l, n) => linea([l], n < c.cafe.length - 1 ? 'nt-pre' : ''))
      case 'sudo': {
        const resto = partes.slice(1).map((x) => x.toLowerCase())
        if ((resto[0] === 'hire' || resto[0] === 'contratar') && resto[1] === 'nico') {
          texto(c.sudo)
          g.abrir('correo')
          return
        }
        return texto(c.sudoOtro)
      }
    }
  }

  // ---- Historial y Tab ----
  const historial: string[] = []
  let pos = 0
  let borrador = ''

  const pool = () => (Object.keys(NOMBRES) as Cmd[]).map(nombreCmd)
  function candidatos(partes: string[]): string[] {
    const ult = (partes[partes.length - 1] ?? '').toLowerCase()
    const ini = (lista: string[]) => lista.filter((x) => x.startsWith(ult))
    if (partes.length <= 1) return ini(pool())
    const primero = mapa.get(partes[0].toLowerCase())
    if (primero === 'abrir' && partes.length === 2) return ini((Object.keys(VENTANAS) as VentanaId[]).map(ventanaNombre))
    if (primero === 'sudo') {
      if (partes.length === 2) return ini([i ? 'contratar' : 'hire'])
      if (partes.length === 3) return ini(['nico'])
    }
    return []
  }
  function completar() {
    const v = input.value
    const partes = v.split(/\s+/)
    const cand = candidatos(partes)
    if (!cand.length) return
    const prefijo = v.slice(0, v.length - partes[partes.length - 1].length)
    if (cand.length === 1) {
      input.value = prefijo + cand[0] + ' '
      return
    }
    let comun = cand[0]
    for (const x of cand) while (!x.startsWith(comun)) comun = comun.slice(0, -1)
    if (comun.length > partes[partes.length - 1].length) input.value = prefijo + comun
    else {
      linea([span('nt-prompt', 'nico@nicos:~$'), ' ' + v])
      linea([cand.join('   ')], 'nt-dim')
    }
  }

  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Tab' && !ev.shiftKey && input.value.trim()) {
      ev.preventDefault()
      ev.stopPropagation()
      completar()
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault()
      if (pos === historial.length) borrador = input.value
      if (pos > 0) input.value = historial[--pos]
      input.setSelectionRange(input.value.length, input.value.length)
    } else if (ev.key === 'ArrowDown') {
      ev.preventDefault()
      if (pos < historial.length) pos++
      input.value = pos === historial.length ? borrador : historial[pos]
    } else if (ev.key.toLowerCase() === 'l' && ev.ctrlKey && !ev.metaKey) {
      ev.preventDefault()
      log.textContent = ''
    }
  })

  form.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const v = input.value
    input.value = ''
    linea([span('nt-prompt', 'nico@nicos:~$'), ' ' + v])
    if (!v.trim()) return
    if (historial[historial.length - 1] !== v) historial.push(v)
    pos = historial.length
    borrador = ''
    ejecutar(v)
    bajar()
  })

  // Clic en la terminal = foco en la entrada (sin romper la selección de texto ni los enlaces).
  el.addEventListener('click', (ev) => {
    if ((ev.target as HTMLElement).closest('a')) return
    if (window.getSelection()?.isCollapsed === false) return
    input.focus({ preventScroll: true })
  })

  texto(t.bienvenida)
  if (!opc.compacta) texto(t.escribe, 'nt-dim') // en la mini-terminal basta el placeholder

  return { el, enfocar: () => input.focus({ preventScroll: true }) }
}
