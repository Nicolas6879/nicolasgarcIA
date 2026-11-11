// Pantalla del portátil 3D en la sección de contacto: arranque de nicOS dibujado en un canvas 2D
// (se usa como CanvasTexture del material `pantalla`). Sin dependencias; el canvas solo se redibuja
// mientras la sección está activa y a <= 30 fps (el cursor parpadea a 2 fps cuando ya no hay animación).
import type { DatosNicos } from '../nicos/datos'

const W = 1024
const H = 640
const NEGRO = '#06080c'
const BASE = '#161b26'
const SEC = '#d7dce4'
const DIM = '#8d96a6'
const ACC1 = '#ff7a45'
const ACC2 = '#ff3d7f'
const SANS = '"Bricolage Grotesque Variable", system-ui, sans-serif'
const MONO = '"JetBrains Mono Variable", ui-monospace, monospace'

// Iconos de 16x16 (los mismos trazos que el escritorio).
const ICONOS = [
  { p: ['M3 1h7l3 3v11H3z', 'M10 1v3h3'], a: ['M5 8h6M5 10h6M5 12h4'] }, // léeme
  { p: ['M1 3h5l1 2h8v9H1z'], a: ['M1 7h14'] }, // proyectos
  { p: ['M1 2h14v12H1z'], a: ['M4 6l2 2-2 2M8 11h4'] }, // terminal
  { p: ['M1 3h14v10H1z'], a: ['M1 3l7 6 7-6'] }, // correo
].map((i) => ({ p: i.p.map((d) => new Path2D(d)), a: i.a.map((d) => new Path2D(d)) }))

export interface PantallaNicos {
  canvas: HTMLCanvasElement
  /** Vuelve a empezar el arranque (se llama al entrar en la sección). */
  reiniciar(): void
  /** Dibuja si toca; devuelve true si el canvas cambió (hay que subir la textura). */
  dibujar(ahora: number): boolean
}

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const suave = (x: number) => x * x * (3 - 2 * x)

export function crearPantallaNicos(d: DatosNicos, reduce: boolean): PantallaNicos {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const v = d.t.ventanas
  const nombres = [v.leeme, v.proyectos, v.terminal, v.correo]
  const lineas = d.t.arranque.lineas
  // Las fuentes del sitio se cargan por @font-face solo cuando se usan: se piden para que el canvas las tenga.
  void document.fonts?.load(`800 40px ${SANS}`)
  void document.fonts?.load(`400 20px ${MONO}`)

  const grad = (x1: number, x2: number) => {
    const g = ctx.createLinearGradient(x1, 0, x2, 0)
    g.addColorStop(0, ACC1)
    g.addColorStop(1, ACC2)
    return g
  }
  const caja = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
  }

  /** Wordmark "nicOS": "nic" en color de texto y "OS" con el degradado de acento. */
  const marca = (cx: number, y: number, px: number, alfa = 1) => {
    ctx.save()
    ctx.globalAlpha = alfa
    ctx.font = `800 ${px}px ${SANS}`
    ctx.textBaseline = 'alphabetic'
    const a = ctx.measureText('nic').width
    const b = ctx.measureText('OS').width
    const x = cx - (a + b) / 2
    ctx.textAlign = 'left'
    ctx.fillStyle = SEC
    ctx.fillText('nic', x, y)
    ctx.fillStyle = grad(x + a, x + a + b)
    ctx.fillText('OS', x + a, y)
    ctx.restore()
  }

  const icono = (n: number, x: number, y: number, tam: number) => {
    const ic = ICONOS[n]
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(tam / 16, tam / 16)
    ctx.lineWidth = 1
    ctx.lineJoin = 'miter'
    ctx.strokeStyle = SEC
    ctx.fillStyle = '#222a3a'
    for (const p of ic.p) {
      ctx.fill(p)
      ctx.stroke(p)
    }
    ctx.strokeStyle = ACC1
    ctx.lineCap = 'square'
    for (const p of ic.a) ctx.stroke(p)
    ctx.restore()
  }

  const hora = () => new Date().toLocaleTimeString(d.lang, { hour: '2-digit', minute: '2-digit', hour12: false })

  function escritorio(cursor: boolean) {
    // Fondo: grafito con rejilla de puntos y un brillo de acento abajo a la derecha.
    ctx.fillStyle = BASE
    ctx.fillRect(0, 0, W, H)
    const g = ctx.createRadialGradient(W * 0.88, H * 1.1, 0, W * 0.88, H * 1.1, 520)
    g.addColorStop(0, 'rgba(255,122,69,0.22)')
    g.addColorStop(1, 'rgba(255,122,69,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(215,220,228,0.16)'
    for (let y = 56; y < H; y += 28) for (let x = 14; x < W; x += 28) ctx.fillRect(x, y, 2, 2)

    // Barra superior
    ctx.fillStyle = '#1e2533'
    ctx.fillRect(0, 0, W, 44)
    ctx.fillStyle = SEC
    ctx.fillRect(0, 44, W, 3)
    marca(78, 31, 28)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    ctx.font = `500 20px ${MONO}`
    ctx.fillStyle = DIM
    ctx.fillText(hora(), W - 22, 29)

    // Iconos
    ctx.textAlign = 'center'
    ctx.font = `600 17px ${MONO}`
    for (let n = 0; n < 4; n++) {
      const y = 70 + n * 126
      icono(n, 56, y, 64)
      ctx.fillStyle = SEC
      ctx.fillText(nombres[n], 88, y + 90)
    }

    // Ventana de terminal
    const x = 232
    const y = 86
    const w = 740
    const h = 500
    ctx.save()
    ctx.fillStyle = 'rgba(215,220,228,0.2)'
    caja(x + 12, y + 12, w, h, 16)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = '#0e1219'
    caja(x, y, w, h, 16)
    ctx.fill()
    ctx.save()
    caja(x, y, w, h, 16)
    ctx.clip()
    ctx.fillStyle = grad(x, x + w)
    ctx.fillRect(x, y, w, 44)
    ctx.restore()
    ctx.lineWidth = 4
    ctx.strokeStyle = SEC
    caja(x, y, w, h, 16)
    ctx.stroke()
    ctx.fillStyle = BASE
    ctx.textAlign = 'left'
    ctx.font = `600 22px ${MONO}`
    ctx.fillText(v.terminal, x + 20, y + 30)
    ctx.strokeStyle = BASE
    ctx.lineWidth = 3
    ctx.strokeRect(x + w - 40, y + 11, 22, 22)

    // Contenido de la terminal
    ctx.font = `400 24px ${MONO}`
    ctx.fillStyle = SEC
    ctx.fillText(d.t.bienvenida, x + 28, y + 96)
    ctx.fillStyle = DIM
    ctx.fillText(d.t.escribe, x + 28, y + 136)
    ctx.fillStyle = ACC1
    const prompt = 'nico@nicos:~$ '
    ctx.fillText(prompt, x + 28, y + 190)
    if (cursor) {
      ctx.fillStyle = SEC
      ctx.fillRect(x + 28 + ctx.measureText(prompt).width + 2, y + 170, 14, 28)
    }
  }

  function arranque(t: number) {
    // Capa de arranque: pantalla apagada -> wordmark -> barra de progreso con líneas de log.
    ctx.fillStyle = NEGRO
    ctx.fillRect(0, 0, W, H)
    const aparece = suave(clamp((t - 0.4) / 0.8))
    marca(W / 2, 300, 160, aparece)
    if (t < 0.9) return
    const p = clamp((t - 0.9) / 1.4)
    ctx.fillStyle = DIM
    ctx.font = `400 20px ${MONO}`
    ctx.textAlign = 'center'
    ctx.globalAlpha = aparece
    ctx.fillText('nicOS 1.0', W / 2, 340)
    const bw = 400
    const bx = (W - bw) / 2
    ctx.lineWidth = 4
    ctx.strokeStyle = SEC
    caja(bx, 372, bw, 24, 6)
    ctx.stroke()
    ctx.fillStyle = grad(bx, bx + bw)
    ctx.fillRect(bx + 6, 378, (bw - 12) * p, 12)
    const n = Math.min(lineas.length - 1, Math.floor(p * lineas.length))
    ctx.fillStyle = DIM
    ctx.font = `400 19px ${MONO}`
    ctx.fillText(lineas[n] ?? '', W / 2, 438)
    ctx.globalAlpha = 1
  }

  let t0: number | null = null
  let ultimo = ''

  const pintar = (t: number, cursor: boolean) => {
    const mezcla = clamp((t - 2.5) / 0.45)
    if (mezcla > 0) escritorio(cursor)
    if (mezcla < 1) {
      ctx.save()
      ctx.globalAlpha = 1 - mezcla
      arranque(t)
      ctx.restore()
    }
  }

  return {
    canvas,
    reiniciar() {
      t0 = null
      ultimo = ''
    },
    dibujar(ahora) {
      if (t0 === null) t0 = ahora
      // Con movimiento reducido: un único fotograma final (el escritorio, sin parpadeo).
      if (reduce) {
        if (ultimo) return false
        ultimo = 'final'
        pintar(99, true)
        return true
      }
      const t = ahora - t0
      const clave = t < 3 ? `a${Math.floor(t * 30)}` : `b${Math.floor(t * 2)}-${hora()}`
      if (clave === ultimo) return false
      ultimo = clave
      pintar(t, t < 3 || Math.floor(t * 2) % 2 === 0)
      return true
    },
  }
}
