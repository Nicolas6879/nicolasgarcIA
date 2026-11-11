// Pantalla en reposo del portátil 3D (sección de inicio): un terminal tranquilo que escribe un saludo línea a línea.
// Canvas 2D usado como CanvasTexture del material `pantalla`; <= 30 fps y solo se redibuja mientras el inicio está activo
// (el cursor parpadea a ~2 fps cuando termina). Con movimiento reducido: un único fotograma final.
const W = 1024
const H = 640
const BASE = '#0b0f16'
const SEC = '#d7dce4'
const DIM = '#8d96a6'
const ACC1 = '#ff7a45'
const ACC2 = '#ff3d7f'
const MONO = '"JetBrains Mono Variable", ui-monospace, monospace'

const TEXTOS: Record<string, string[]> = {
  es: ['hola, soy Nico', 'ingeniero full-stack', 'haz scroll para desarmar este portátil ↓'],
  en: ["hello, I'm Nico", 'full-stack engineer', 'scroll to take this laptop apart ↓'],
}
const ESTILO = [
  { px: 50, peso: 700, color: SEC },
  { px: 40, peso: 500, color: DIM },
  { px: 28, peso: 400, color: ACC1 },
]
const Y0 = 190
const SALTO = 84
const X0 = 64
const CHAR_S = 0.045
const PAUSA_S = 0.42

export interface PantallaInicio {
  canvas: HTMLCanvasElement
  /** Arranca el tecleo (ahora = segundos del ticker de gsap). */
  empezar(ahora: number): void
  /** Salta al final (texto completo) y deja de depender del reloj. */
  completar(): void
  /** Dibuja si toca; true si el canvas cambió (hay que subir la textura). brillo: 0 apagada .. 1 encendida. */
  dibujar(ahora: number, brillo: number): boolean
}

export function crearPantallaInicio(reduce: boolean): PantallaInicio {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const lineas = TEXTOS[document.documentElement.lang.toLowerCase().startsWith('es') ? 'es' : 'en']
  void document.fonts?.load(`700 50px ${MONO}`)
  void document.fonts?.load(`400 28px ${MONO}`)

  let t0: number | null = null
  let final = reduce
  let ultimo = ''

  /** Caracteres visibles de cada línea y si el cursor está en la última escrita. */
  const progreso = (t: number): { n: number[]; activa: number; escribiendo: boolean } => {
    if (final) return { n: lineas.map((l) => l.length), activa: lineas.length - 1, escribiendo: false }
    const n = lineas.map(() => 0)
    let resto = t
    let activa = 0
    for (let i = 0; i < lineas.length; i++) {
      const dur = lineas[i].length * CHAR_S
      activa = i
      if (resto <= dur) {
        n[i] = Math.max(0, Math.floor(resto / CHAR_S))
        return { n, activa, escribiendo: true }
      }
      n[i] = lineas[i].length
      resto -= dur + PAUSA_S
      if (resto < 0) return { n, activa: Math.min(i + 1, lineas.length - 1), escribiendo: true }
    }
    return { n, activa: lineas.length - 1, escribiendo: false }
  }

  const pintar = (brillo: number, p: ReturnType<typeof progreso>, cursor: boolean, iniciado: boolean) => {
    ctx.globalAlpha = 1
    ctx.fillStyle = '#04060a'
    ctx.fillRect(0, 0, W, H)
    if (brillo <= 0) return
    ctx.globalAlpha = brillo
    // Fondo: grafito con un viso de luz arriba a la izquierda y un brillo de acento abajo a la derecha.
    ctx.fillStyle = BASE
    ctx.fillRect(0, 0, W, H)
    const g1 = ctx.createRadialGradient(W * 0.2, 0, 0, W * 0.2, 0, 620)
    g1.addColorStop(0, 'rgba(120,150,210,0.18)')
    g1.addColorStop(1, 'rgba(120,150,210,0)')
    ctx.fillStyle = g1
    ctx.fillRect(0, 0, W, H)
    const g2 = ctx.createRadialGradient(W * 0.95, H * 1.05, 0, W * 0.95, H * 1.05, 520)
    g2.addColorStop(0, 'rgba(255,122,69,0.26)')
    g2.addColorStop(1, 'rgba(255,122,69,0)')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, W, H)
    // Barra de ventana
    ctx.fillStyle = 'rgba(215,220,228,0.07)'
    ctx.fillRect(0, 0, W, 56)
    const pts = [ACC1, '#5b6578', '#5b6578']
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = pts[i]
      ctx.beginPath()
      ctx.arc(40 + i * 30, 28, 8, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'center'
    ctx.font = `500 20px ${MONO}`
    ctx.fillStyle = DIM
    ctx.fillText('nico@portfolio — zsh', W / 2, 35)
    ctx.fillStyle = ACC1
    ctx.fillRect(0, 56, W, 3)

    // Texto tecleado
    ctx.textAlign = 'left'
    let cx = X0
    let cy = Y0
    for (let i = 0; i < lineas.length; i++) {
      const e = ESTILO[i]
      const y = Y0 + i * SALTO
      const vis = iniciado || final ? p.n[i] : 0
      ctx.font = `${e.peso} ${e.px}px ${MONO}`
      const w = ctx.measureText('> ').width
      if (vis > 0 || (i === 0 && cursor)) {
        ctx.fillStyle = ACC1
        ctx.fillText('>', X0, y)
      }
      ctx.fillStyle = e.color
      ctx.fillText(lineas[i].slice(0, vis), X0 + w, y)
      if (i === p.activa) {
        cx = X0 + w + ctx.measureText(lineas[i].slice(0, vis)).width
        cy = y
      }
    }
    if (cursor) {
      const e = ESTILO[p.activa]
      ctx.fillStyle = SEC
      ctx.fillRect(cx + 4, cy - e.px * 0.82, e.px * 0.55, e.px * 1.0)
    }

    // Pie: estado
    ctx.fillStyle = 'rgba(215,220,228,0.07)'
    ctx.fillRect(0, H - 48, W, 48)
    ctx.font = `500 18px ${MONO}`
    ctx.fillStyle = DIM
    ctx.fillText('nicOS 1.0', 28, H - 17)
    ctx.textAlign = 'right'
    ctx.fillStyle = ACC2
    ctx.fillText('●', W - 150, H - 17)
    ctx.fillStyle = DIM
    ctx.fillText('online', W - 28, H - 17)
    ctx.globalAlpha = 1
  }

  return {
    canvas,
    empezar(ahora) {
      t0 = ahora
      final = reduce
      ultimo = ''
    },
    completar() {
      final = true
      ultimo = ''
      pintar(1, progreso(0), true, true)
    },
    dibujar(ahora, brillo) {
      const t = t0 === null ? 0 : ahora - t0
      const p = progreso(t)
      const parpadeo = Math.floor(ahora * 2) % 2 === 0
      const cursor = t0 !== null && p.escribiendo ? true : parpadeo
      // Con movimiento reducido: un único fotograma final, sin parpadeo.
      if (reduce) {
        if (ultimo) return false
        ultimo = 'final'
        pintar(1, progreso(0), true, true)
        return true
      }
      const fase = brillo < 1 ? `f${Math.floor(ahora * 30)}` : ''
      const clave = `${brillo.toFixed(2)}|${p.n.join(',')}|${cursor ? 1 : 0}|${fase}|${t0 === null ? 'e' : 'i'}`
      if (clave === ultimo) return false
      ultimo = clave
      pintar(brillo, p, cursor, t0 !== null || final)
      return true
    },
  }
}
