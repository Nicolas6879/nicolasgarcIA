// Etiquetas HTML ancladas a las piezas del portátil 3D (proyección 3D -> 2D) con una línea guía, estilo plano técnico.
// El DOM y los estilos los crea este módulo: capa fija, sin eventos de puntero, oculta a lectores de pantalla y
// dentro de la zona del escenario (nunca sobre la columna de texto). Posiciones amortiguadas y a píxeles enteros.
const NUM: Record<string, string> = { tapa: '01', pantalla: '02', placa: '03', cpu: '04', antena: '05', bateria: '06', teclado: '07', disco: '08', chasis: '09' }
const NOMBRES: Record<string, Record<string, string>> = {
  es: { tapa: 'tapa', pantalla: 'pantalla', placa: 'placa base', cpu: 'procesador', antena: 'antena', bateria: 'batería', teclado: 'teclado', disco: 'disco', chasis: 'chasis' },
  en: { tapa: 'lid', pantalla: 'screen', placa: 'motherboard', cpu: 'processor', antena: 'antenna', bateria: 'battery', teclado: 'keyboard', disco: 'drive', chasis: 'chassis' },
}

const CSS = `
.etq-capa{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.etq-capa svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.etq-capa .etq-l{stroke:var(--sec);stroke-opacity:.55;stroke-width:1;fill:none;opacity:0;transition:opacity .3s ease}
.etq-capa .etq-p{fill:var(--acc);opacity:0;transition:opacity .3s ease}
.etq-capa .etq-l.on,.etq-capa .etq-p.on{opacity:1}
.etq-capa .etq-l.act{stroke:var(--acc);stroke-opacity:.9}
.etq{position:absolute;left:0;top:0;white-space:nowrap;font:500 11px/1 var(--f-mono,ui-monospace,monospace);letter-spacing:.09em;text-transform:uppercase;color:var(--sec);
  padding:5px 8px;background:color-mix(in srgb,var(--base) 82%,transparent);border:1px solid var(--border);border-radius:3px;opacity:0;transition:opacity .3s ease;will-change:transform}
.etq.on{opacity:1}
.etq.act{border-color:var(--acc)}
.etq b{font-weight:700;color:var(--acc-txt,var(--acc))}
@media (max-width:859px){.etq{font-size:10px;letter-spacing:.07em;padding:4px 6px}}
`

export interface Zona {
  l: number
  t: number
  r: number
  b: number
}
export interface Entrada {
  id: string
  x: number
  y: number
  /** Caja de la pieza proyectada (px). */
  x0: number
  x1: number
  y0: number
  y1: number
}
export interface Etiquetas {
  /** Devuelve true mientras siga animándose (hay que seguir pidiendo fotogramas). */
  actualizar(entradas: Entrada[], zona: Zona, todas: boolean, instante: boolean): boolean
}

interface Item {
  el: HTMLDivElement
  linea: SVGPolylineElement
  punto: SVGCircleElement
  w: number
  h: number
  x: number
  y: number
  ax: number
  ay: number
  visto: boolean
  puesto: boolean
}

const SVGNS = 'http://www.w3.org/2000/svg'

export function crearEtiquetas(): Etiquetas {
  if (!document.getElementById('etq-estilos')) {
    const st = document.createElement('style')
    st.id = 'etq-estilos'
    st.textContent = CSS
    document.head.appendChild(st)
  }
  const capa = document.createElement('div')
  capa.className = 'etq-capa'
  capa.setAttribute('aria-hidden', 'true')
  const svg = document.createElementNS(SVGNS, 'svg')
  capa.appendChild(svg)
  document.body.appendChild(capa)
  const idioma = document.documentElement.lang.toLowerCase().startsWith('es') ? 'es' : 'en'
  const items = new Map<string, Item>()

  const item = (id: string): Item => {
    let it = items.get(id)
    if (it) return it
    const el = document.createElement('div')
    el.className = 'etq'
    el.innerHTML = `<b>${NUM[id] ?? ''}</b> — ${(NOMBRES[idioma][id] ?? id).toUpperCase()}`
    capa.appendChild(el)
    const linea = document.createElementNS(SVGNS, 'polyline')
    linea.setAttribute('class', 'etq-l')
    const punto = document.createElementNS(SVGNS, 'circle')
    punto.setAttribute('class', 'etq-p')
    punto.setAttribute('r', '2.5')
    svg.append(linea, punto)
    it = { el, linea, punto, w: 0, h: 0, x: 0, y: 0, ax: 0, ay: 0, visto: false, puesto: false }
    items.set(id, it)
    return it
  }

  return {
    actualizar(entradas, zona, todas, instante) {
      const vivos = new Set(entradas.map((e) => e.id))
      for (const [id, it] of items) {
        if (!vivos.has(id) && it.visto) {
          it.visto = false
          it.puesto = false
          it.el.classList.remove('on', 'act')
          it.linea.classList.remove('on', 'act')
          it.punto.classList.remove('on')
        }
      }
      if (!entradas.length) return false

      // Centro de referencia: hacia fuera de él se colocan las etiquetas.
      let cx = 0
      let cy = 0
      for (const e of entradas) {
        cx += e.x
        cy += e.y
      }
      cx = todas ? cx / entradas.length : (zona.l + zona.r) / 2
      cy = todas ? cy / entradas.length : (zona.t + zona.b) / 2
      const pad = 10
      type Caja = { it: Item; x: number; y: number; lado: number; ax: number; ay: number; dx: number; dy: number; x0: number; x1: number }
      const cajas: Caja[] = []
      // La etiqueta se coloca fuera de la caja proyectada de su pieza (a derecha o izquierda); si no cabe, al otro lado.
      const colocar = (c: Caja, lado: number) => {
        const w = c.it.w
        const cabe = (l: number) => (l > 0 ? c.x1 + 20 + w <= zona.r - pad : c.x0 - 20 - w >= zona.l + pad)
        if (!cabe(lado) && cabe(-lado)) lado = -lado
        c.lado = lado
        c.x = lado > 0 ? c.x1 + 20 : c.x0 - 20 - w
        c.y = c.ay - c.it.h / 2 + (todas ? 0 : -26)
      }
      for (const e of entradas) {
        const it = item(e.id)
        if (!it.w) {
          it.w = it.el.offsetWidth
          it.h = it.el.offsetHeight
        }
        let dx = e.x - cx
        let dy = e.y - cy
        const n = Math.hypot(dx, dy)
        if (n < 8) {
          dx = 1
          dy = -0.5
        } else {
          dx /= n
          dy /= n
        }
        const c: Caja = { it, x: 0, y: 0, lado: 1, ax: e.x, ay: e.y, dx, dy, x0: e.x0, x1: e.x1 }
        colocar(c, dx >= 0 ? 1 : -1)
        cajas.push(c)
      }
      const choca = (a: Caja, b: Caja, m: number) =>
        Math.min(a.x + a.it.w, b.x + b.it.w) - Math.max(a.x, b.x) > -m && Math.min(a.y + a.it.h, b.y + b.it.h) - Math.max(a.y, b.y) > -m
      const dentro = (c: Caja) => {
        c.x = Math.min(Math.max(c.x, zona.l + pad), zona.r - pad - c.it.w)
        c.y = Math.min(Math.max(c.y, zona.t + pad), zona.b - pad - c.it.h)
      }
      cajas.forEach(dentro)
      // Vista completa: dos columnas (izquierda/derecha de la pila, según la x de cada pieza), ordenadas por y con separación mínima.
      if (todas) {
        const xs = cajas.map((c) => c.ax).sort((p, q) => p - q)
        const med = xs[xs.length >> 1]
        let minX = Infinity
        let maxX = -Infinity
        let maxW = 0
        for (const c of cajas) {
          minX = Math.min(minX, c.x0)
          maxX = Math.max(maxX, c.x1)
          maxW = Math.max(maxW, c.it.w)
        }
        const izq = Math.max(minX - 18, zona.l + pad + maxW)
        const der = Math.min(maxX + 18, zona.r - pad - maxW)
        for (const lado of [-1, 1]) {
          const col = cajas.filter((c) => (c.ax < med ? -1 : 1) === lado).sort((p, q) => p.ay - q.ay)
          let y = -Infinity
          for (const c of col) {
            c.lado = lado
            c.x = lado < 0 ? izq - c.it.w : der
            y = Math.max(c.ay - c.it.h / 2, y + c.it.h + 7)
            c.y = y
          }
          const tope = zona.b - pad - (col[0]?.it.h ?? 0)
          for (let i = col.length - 1, lim = tope; i >= 0; i--) {
            col[i].y = Math.min(col[i].y, lim)
            lim = col[i].y - col[i].it.h - 7
          }
        }
      }
      // Evitar solapes verticales entre etiquetas (relajación simple) y mantenerlas dentro de la zona.
      for (let k = 0; k < 16; k++) {
        let mov = false
        for (let i = 0; i < cajas.length; i++) {
          for (let j = i + 1; j < cajas.length; j++) {
            const a = cajas[i]
            const b = cajas[j]
            if (choca(a, b, 5)) {
              const oy = Math.min(a.y + a.it.h, b.y + b.it.h) - Math.max(a.y, b.y)
              const d = (oy + 5) / 2
              if (a.y <= b.y) {
                a.y -= d
                b.y += d
              } else {
                a.y += d
                b.y -= d
              }
              mov = true
            }
          }
        }
        cajas.forEach(dentro)
        if (!mov) break
      }

      let animando = false
      for (const c of cajas) {
        const it = c.it
        const k = instante || !it.puesto ? 1 : 0.22
        it.puesto = true
        it.x += (c.x - it.x) * k
        it.y += (c.y - it.y) * k
        it.ax += (c.ax - it.ax) * k
        it.ay += (c.ay - it.ay) * k
        if (Math.abs(c.x - it.x) > 0.3 || Math.abs(c.y - it.y) > 0.3 || Math.abs(c.ax - it.ax) > 0.3 || Math.abs(c.ay - it.ay) > 0.3) animando = true
        else {
          it.x = c.x
          it.y = c.y
          it.ax = c.ax
          it.ay = c.ay
        }
        const x = Math.round(it.x)
        const y = Math.round(it.y)
        const ax = Math.round(it.ax)
        const ay = Math.round(it.ay)
        it.el.style.transform = `translate(${x}px,${y}px)`
        // Guía: del borde de la etiqueta más cercano al ancla, con un codo horizontal, y un punto sobre la pieza.
        const bx = c.lado > 0 ? x : x + it.w
        const by = y + Math.round(it.h / 2)
        const codo = bx + (c.lado > 0 ? -14 : 14)
        it.linea.setAttribute('points', `${bx},${by + 0.5} ${codo},${by + 0.5} ${ax},${ay}`)
        it.punto.setAttribute('cx', String(ax))
        it.punto.setAttribute('cy', String(ay))
        if (!it.visto) {
          it.visto = true
          // Primer fotograma ya colocado; el fundido arranca en el siguiente.
          requestAnimationFrame(() => {
            it.el.classList.add('on')
            it.linea.classList.add('on')
            it.punto.classList.add('on')
          })
        }
        const act = !todas
        it.el.classList.toggle('act', act)
        it.linea.classList.toggle('act', act)
      }
      return animando
    },
  }
}
