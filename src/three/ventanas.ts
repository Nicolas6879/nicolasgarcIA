// Móvil (< 860 px): el portátil es el fondo de la página y en cada sección hay un hueco transparente (.ventana) por donde
// se ve nítido. Este módulo mide los huecos (posición en el documento, sin leer el layout en cada fotograma), los abre sin
// saltos de contenido, reparte el encuadre del portátil entre ellos según el scroll y gestiona el giro táctil del hero.

export interface Rect {
  l: number
  t: number
  r: number
  b: number
}
interface Hueco {
  el: HTMLElement
  id: string
  top: number
  h: number
  abierta: boolean
}

const suave = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export interface Ventanas {
  /** Número de huecos. */
  readonly n: number
  /** Vuelve a medir los huecos. Devuelve true si la geometría cambió de forma apreciable. */
  medir(): boolean
  /** Abre los huecos cerrados que no se ven (los de abajo en silencio; los de arriba compensando el scroll). Devuelve true si abrió alguno. */
  abrir(): boolean
  /** Scroll al que el hueco de la sección queda centrado en la zona visible. */
  centro(id: string, cab: number, H: number): number
  /** Scroll máximo de la página (en caché). */
  readonly maxScroll: number
  /** Rect objetivo del portátil (mezcla de huecos cercanos y fondo) y peso de huecos (0 = fondo, 1 = dentro de un hueco). */
  objetivo(W: number, H: number, cab: number, out: Rect): number
  /** Id de la sección cuya pose toca ahora. */
  activa(y: number, cab: number, H: number): string
}

export function crearVentanas(): Ventanas {
  const lista: Hueco[] = []
  document.querySelectorAll<HTMLElement>('main section[data-pieza] .ventana').forEach((el) =>
    lista.push({ el, id: el.closest('section')!.id, top: 0, h: 0, abierta: el.classList.contains('ventana-hero') }),
  )
  const porId = new Map(lista.map((v) => [v.id, v]))
  // Bordes difuminados de cada hueco (ver .pluma en main.css): dos tiras con 5 capas de desenfoque cada una.
  for (const v of lista) {
    for (const c of ['s', 'i']) {
      const t = document.createElement('div')
      t.className = 'pluma pluma-' + c
      t.innerHTML = '<i></i><i></i><i></i><i></i><i></i>'
      v.el.appendChild(t)
    }
  }
  let firma = 0
  const api = {
    n: lista.length,
    maxScroll: 0,
    medir(): boolean {
      const y = window.scrollY
      let f = 0
      for (const v of lista) {
        const r = v.el.getBoundingClientRect()
        v.top = r.top + y
        v.h = r.height
        f += v.top + v.h * 3
      }
      api.maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const cambio = Math.abs(f - firma) > 2
      firma = f
      return cambio
    },
    abrir(): boolean {
      const H = window.innerHeight
      let hubo = false
      for (const v of lista) {
        if (v.abierta) continue
        const top = v.el.getBoundingClientRect().top
        const arriba = top < 0
        if (!arriba && top < H + 40) continue // se está viendo: se abrirá cuando salga de la pantalla
        const y0 = window.scrollY
        v.el.classList.add('abierta')
        v.abierta = true
        hubo = true
        if (arriba) window.scrollTo({ top: y0 + v.el.offsetHeight, behavior: 'instant' as ScrollBehavior })
      }
      if (hubo) api.medir()
      return hubo
    },
    centro(id: string, cab: number, H: number): number {
      const v = porId.get(id)
      if (!v) return 0
      const h = v.abierta ? v.h : (H - cab) * 0.5
      return v.top + h / 2 - (cab + H) / 2
    },
    objetivo(W: number, H: number, cab: number, out: Rect): number {
      const y = window.scrollY
      const cy0 = (cab + H) / 2
      const pluma = 28
      const bg: Rect = { l: W * 0.1, r: W * 0.9, t: cab + (H - cab) * 0.18, b: cab + (H - cab) * 0.8 }
      let sw = 0
      const acc: Rect = { l: 0, t: 0, r: 0, b: 0 }
      for (const v of lista) {
        if (!v.abierta || v.h < 8) continue
        const top = v.top - y
        const d = Math.abs(top + v.h / 2 - cy0)
        const w = 1 - suave(0.28 * H, 0.85 * H, d)
        if (w <= 0.001) continue
        const t = Math.max(top + pluma, cab + 6)
        const b = Math.min(top + v.h - pluma, H - 6)
        if (b - t < 70) continue
        sw += w
        acc.l += w * W * 0.03
        acc.r += w * W * 0.97
        acc.t += w * t
        acc.b += w * b
      }
      if (sw > 1) {
        acc.l /= sw
        acc.r /= sw
        acc.t /= sw
        acc.b /= sw
        sw = 1
      }
      const g = 1 - sw
      out.l = acc.l + g * bg.l
      out.r = acc.r + g * bg.r
      out.t = acc.t + g * bg.t
      out.b = acc.b + g * bg.b
      return sw
    },
    activa(y: number, cab: number, H: number): string {
      let id = lista[0]?.id ?? 'inicio'
      for (const v of lista) {
        const umbral = Math.min(api.centro(v.id, cab, H) - 0.3 * H, api.maxScroll - 2)
        if (y >= umbral) id = v.id
      }
      return id
    },
  }
  return api
}

/** Giro con un dedo en horizontal (no bloquea el scroll vertical: el hueco lleva touch-action: pan-y). */
export function girable(el: HTMLElement, alMover: (grados: number) => void, alSoltar: () => void, max = 35): void {
  let id = -1
  let x0 = 0
  let y0 = 0
  let modo = 0 // 0 indeciso, 1 horizontal (capturado), 2 vertical (se ignora)
  el.addEventListener('pointerdown', (ev) => {
    id = ev.pointerId
    x0 = ev.clientX
    y0 = ev.clientY
    modo = 0
  })
  el.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== id) return
    const dx = ev.clientX - x0
    const dy = ev.clientY - y0
    if (modo === 0) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > 1.4 * Math.abs(dy)) {
        modo = 1
        try {
          el.setPointerCapture(id)
        } catch {
          /* sin captura */
        }
      } else if (Math.abs(dy) > 10) modo = 2
    }
    if (modo === 1) alMover(Math.max(-max, Math.min(max, (dx / (el.clientWidth * 0.55)) * max)))
  })
  const fin = (ev: PointerEvent) => {
    if (ev.pointerId !== id) return
    id = -1
    if (modo === 1) alSoltar()
    modo = 0
  }
  el.addEventListener('pointerup', fin)
  el.addEventListener('pointercancel', fin)
}
