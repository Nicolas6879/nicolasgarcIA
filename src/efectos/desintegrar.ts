// Efecto "la captura se deshace en código": cada tarjeta de sistema tiene un <canvas> 2D encima de su captura.
// La captura (o una interfaz simulada si aún no existe) se muestrea en partículas que viajan hasta
// los píxeles del fragmento de código; al final se funde con el código nítido.
// Sin dependencias (ni three.js): el canvas también lo reutiliza la escena 3D como textura de la pantalla.

export interface Opciones {
  reduce: boolean
}

const MAX_PART = 3000
const DUR_VUELO = 0.4 // fracción de p que dura el viaje de cada partícula
const FRENTE = 0.46 // fracción de p que tarda el barrido izquierda -> derecha
const RUIDO_T = 0.06
const MAX_DPR = 1.5
const FUENTE = "'JetBrains Mono Variable', ui-monospace, monospace"
const TITULO = "'Bricolage Grotesque Variable', system-ui, sans-serif"
const PALABRAS = new Set(
  ('import from export const let var function return if else for of in async await new class extends public private ' +
    'protected static use namespace type interface void null true false this as default while try catch throw return').split(' '),
)

interface Colores {
  fondo: string
  texto: string
  acento: string
  muted: string
  base: string
  superficie: string
  superficie2: string
  borde: string
}

interface Particulas {
  n: number
  sx: Float32Array
  sy: Float32Array
  tx: Float32Array
  ty: Float32Array
  c0: Uint8ClampedArray // rgb origen
  c1: Uint8ClampedArray // rgb destino
  t0: Float32Array // instante de salida (en p)
  ph: Float32Array // fase del giro
  amp: Float32Array
  extra: Uint8Array // 1 = no llega a ningún píxel de código: se desvanece en el aire
  celda: number
  tam: number
}

interface Carta {
  el: HTMLElement
  media: HTMLElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  btn: HTMLButtonElement | null
  img: HTMLImageElement | null
  indice: number
  nombre: string
  sub: string
  archivo: string
  codigo: string
  cap: string
  W: number
  H: number
  dpr: number
  fondoCodigo: string
  fuente: HTMLCanvasElement | null
  codigoCv: HTMLCanvasElement | null
  parts: Particulas | null
  construida: boolean
  visible: boolean
  p: number
  pDib: number
  sucio: boolean
  anim: { t0: number; de: number; a: number; dur: number } | null
  pin: number | null
  etiqueta: 0 | 1
}

const cartas: Carta[] = []
const oyentes: ((c: HTMLCanvasElement) => void)[] = []
let activa: Carta | null = null
let reduce = false
let raf = 0
let iniciado = false

const lim = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const suave = (x: number) => x * x * (3 - 2 * x)
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

function prng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Canvas del efecto de la tarjeta más cercana al centro del viewport (la usa la pantalla del portátil 3D). */
export function canvasActivo(): HTMLCanvasElement | null {
  return activa && activa.construida ? activa.canvas : null
}
/** Avisa cada vez que un canvas se redibuja (para actualizar texturas). */
export function alRedibujar(cb: (c: HTMLCanvasElement) => void): void {
  oyentes.push(cb)
}

// ---------- colores del tema ----------
function leerColores(ref: HTMLElement): Colores {
  const sonda = document.createElement('span')
  sonda.style.display = 'none'
  ref.appendChild(sonda)
  const g = (v: string) => {
    sonda.style.color = `var(${v})`
    return getComputedStyle(sonda).color
  }
  const c: Colores = {
    fondo: g('--base'),
    base: g('--base'),
    texto: g('--sec'),
    acento: g('--acc'),
    muted: g('--muted'),
    superficie: g('--surface'),
    superficie2: g('--surface-2'),
    borde: g('--border'),
  }
  sonda.remove()
  return c
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

// ---------- fuente: captura real o interfaz simulada ----------
function dibujarMock(ctx: CanvasRenderingContext2D, W: number, H: number, col: Colores, nombre: string, sub: string) {
  ctx.fillStyle = col.superficie2
  ctx.fillRect(0, 0, W, H)
  const barra = H * 0.085
  ctx.fillStyle = col.base
  ctx.fillRect(0, 0, W, barra)
  ctx.fillStyle = col.muted
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.55
    ctx.beginPath()
    ctx.arc(W * 0.03 + i * W * 0.03, barra / 2, H * 0.014, 0, 7)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const lado = W * 0.2
  ctx.fillStyle = col.base
  ctx.fillRect(0, barra, lado, H - barra)
  for (let i = 0; i < 6; i++) {
    const y = barra + H * 0.07 + i * H * 0.085
    if (i === 1) {
      ctx.fillStyle = col.acento
      ctx.globalAlpha = 0.9
    } else {
      ctx.fillStyle = col.muted
      ctx.globalAlpha = 0.35
    }
    rect(ctx, W * 0.025, y, lado * (i % 2 ? 0.7 : 0.82), H * 0.03, H * 0.015)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const x0 = lado + W * 0.035
  const w0 = W - x0 - W * 0.035
  // Título (se encoge hasta caber) y subtítulo
  let px = H * 0.075
  ctx.textBaseline = 'alphabetic'
  ctx.font = `700 ${px}px ${TITULO}`
  while (ctx.measureText(nombre).width > w0 && px > 9) {
    px -= 1
    ctx.font = `700 ${px}px ${TITULO}`
  }
  ctx.fillStyle = col.texto
  ctx.fillText(nombre, x0, barra + H * 0.11)
  ctx.font = `500 ${H * 0.036}px ${FUENTE}`
  ctx.fillStyle = col.muted
  ctx.fillText(sub, x0, barra + H * 0.165)
  // Tres tarjetas con cifra
  const cw = (w0 - W * 0.04) / 3
  for (let i = 0; i < 3; i++) {
    const x = x0 + i * (cw + W * 0.02)
    ctx.fillStyle = col.superficie
    rect(ctx, x, H * 0.31, cw, H * 0.17, 8)
    ctx.fill()
    ctx.fillStyle = i === 0 ? col.acento : col.texto
    ctx.globalAlpha = i === 0 ? 1 : 0.75
    rect(ctx, x + cw * 0.1, H * 0.345, cw * 0.45, H * 0.05, 4)
    ctx.fill()
    ctx.globalAlpha = 0.4
    ctx.fillStyle = col.muted
    rect(ctx, x + cw * 0.1, H * 0.425, cw * 0.7, H * 0.025, 3)
    ctx.fill()
    ctx.globalAlpha = 1
  }
  // Tabla
  const alturas = [0.55, 0.64, 0.73, 0.82]
  ctx.fillStyle = col.muted
  ctx.globalAlpha = 0.5
  ctx.fillRect(x0, H * 0.53, w0 * 0.62, H * 0.012)
  ctx.globalAlpha = 1
  alturas.forEach((a, i) => {
    ctx.fillStyle = i % 2 ? col.superficie : col.base
    rect(ctx, x0, H * a, w0 * 0.62, H * 0.07, 5)
    ctx.fill()
    ctx.fillStyle = col.muted
    ctx.globalAlpha = 0.5
    ctx.fillRect(x0 + w0 * 0.03, H * a + H * 0.027, w0 * (0.18 + (i % 3) * 0.05), H * 0.016)
    ctx.fillRect(x0 + w0 * 0.3, H * a + H * 0.027, w0 * 0.12, H * 0.016)
    ctx.globalAlpha = 1
    ctx.fillStyle = i === 2 ? col.acento : col.texto
    ctx.globalAlpha = i === 2 ? 1 : 0.65
    rect(ctx, x0 + w0 * 0.5, H * a + H * 0.02, w0 * 0.09, H * 0.03, 8)
    ctx.fill()
    ctx.globalAlpha = 1
  })
  // Barras
  const bx = x0 + w0 * 0.67
  const bw = w0 * 0.33
  const altos = [0.5, 0.8, 0.35, 0.95, 0.6, 0.75]
  altos.forEach((h, i) => {
    ctx.fillStyle = i === 3 ? col.acento : col.texto
    ctx.globalAlpha = i === 3 ? 1 : 0.5
    const ww = bw / 8
    rect(ctx, bx + i * (ww * 1.3), H * 0.9 - h * H * 0.32, ww, h * H * 0.32, 3)
    ctx.fill()
  })
  ctx.globalAlpha = 1
}

// ---------- destino: el código ----------
interface Trozo {
  t: string
  tipo: 0 | 1 | 2 | 3 // 0 texto, 1 palabra clave, 2 cadena, 3 comentario
}
function trocear(linea: string): Trozo[] {
  const out: Trozo[] = []
  const re = /(\/\/.*)|('[^']*'|"[^"]*"|`[^`]*`)|([A-Za-z_$][\w$]*)|(\s+|.)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(linea))) {
    if (m[1]) out.push({ t: m[1], tipo: 3 })
    else if (m[2]) out.push({ t: m[2], tipo: 2 })
    else if (m[3]) out.push({ t: m[3], tipo: PALABRAS.has(m[3]) ? 1 : 0 })
    else out.push({ t: m[4], tipo: 0 })
  }
  return out
}

function dibujarCodigo(ctx: CanvasRenderingContext2D, c: Carta, col: Colores) {
  const { W, H } = c
  ctx.fillStyle = col.fondo
  ctx.fillRect(0, 0, W, H)
  const barra = lim(H * 0.075, 16, 28)
  const pie = lim(H * 0.1, 18, 34)
  ctx.fillStyle = col.superficie
  ctx.fillRect(0, 0, W, barra)
  ctx.fillStyle = col.muted
  ctx.globalAlpha = 0.6
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(barra * 0.6 + i * barra * 0.5, barra / 2, barra * 0.13, 0, 7)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const lineas = c.codigo.replace(/\s+$/, '').split('\n')
  const cols = Math.max(...lineas.map((l) => l.length), 20)
  const pad = Math.max(10, W * 0.035)
  const px = Math.min(15, (W - 2 * pad) / (cols * 0.6), (H - barra - pie - pad) / (lineas.length * 1.5))
  ctx.textBaseline = 'alphabetic'
  ctx.font = `500 ${Math.max(7, barra * 0.45)}px ${FUENTE}`
  ctx.fillStyle = col.muted
  ctx.fillText(c.archivo, barra * 2.4, barra * 0.66)
  ctx.font = `400 ${px}px ${FUENTE}`
  const cw = ctx.measureText('M').width
  const lh = px * 1.5
  const y0 = barra + pad * 0.6 + px
  lineas.forEach((l, i) => {
    let x = pad
    for (const tz of trocear(l)) {
      if (tz.tipo === 0 && !tz.t.trim()) {
        x += cw * tz.t.length
        continue
      }
      ctx.fillStyle = tz.tipo === 0 ? col.texto : tz.tipo === 3 ? col.muted : col.acento
      ctx.globalAlpha = tz.tipo === 3 ? 0.85 : 1
      ctx.fillText(tz.t, x, y0 + i * lh)
      x += cw * tz.t.length
    }
  })
  ctx.globalAlpha = 1
  ctx.font = `400 ${Math.max(7, Math.min(11, pie * 0.4))}px ${FUENTE}`
  ctx.fillStyle = col.muted
  ctx.fillText(c.cap, pad, H - pie * 0.4)
}

// ---------- construcción de partículas ----------
function nuevoLienzo(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.round(w))
  cv.height = Math.max(1, Math.round(h))
  return [cv, cv.getContext('2d', { willReadFrequently: true })!]
}

function construir(c: Carta) {
  const { W, H, dpr } = c
  if (!W || !H) return
  const col = leerColores(c.el)
  // 1) Fuente
  const [fuente, fctx] = nuevoLienzo(W * dpr, H * dpr)
  fctx.scale(dpr, dpr)
  if (c.img && c.img.complete && c.img.naturalWidth) fctx.drawImage(c.img, 0, 0, W, H)
  else dibujarMock(fctx, W, H, col, c.nombre, c.sub)
  // 2) Destino
  const [cod, cctx] = nuevoLienzo(W * dpr, H * dpr)
  cctx.scale(dpr, dpr)
  dibujarCodigo(cctx, c, col)
  c.fondoCodigo = col.fondo
  c.fuente = fuente
  c.codigoCv = cod
  c.parts = reduce ? null : particulas(c, fuente, fctx, cod, cctx)
  c.construida = true
  c.sucio = true
}

function particulas(
  c: Carta,
  fuente: HTMLCanvasElement,
  fctx: CanvasRenderingContext2D,
  cod: HTMLCanvasElement,
  cctx: CanvasRenderingContext2D,
): Particulas {
  const { W, H, dpr } = c
  const rnd = prng(1234 + c.indice * 77)
  const celda = Math.max(5, Math.sqrt((W * H) / MAX_PART))
  const nx = Math.floor(W / celda)
  const ny = Math.floor(H / celda)
  const N = nx * ny
  const cd = celda * dpr
  const dataF = fctx.getImageData(0, 0, fuente.width, fuente.height).data
  const rgbF = new Uint8ClampedArray(N * 3)
  const hist = new Map<number, number>()
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      let r = 0
      let g = 0
      let b = 0
      let n = 0
      const xa = Math.floor(i * cd)
      const ya = Math.floor(j * cd)
      const xb = Math.min(fuente.width, Math.floor((i + 1) * cd))
      const yb = Math.min(fuente.height, Math.floor((j + 1) * cd))
      for (let y = ya; y < yb; y += 2) {
        for (let x = xa; x < xb; x += 2) {
          const k = (y * fuente.width + x) * 4
          r += dataF[k]
          g += dataF[k + 1]
          b += dataF[k + 2]
          n++
        }
      }
      n = n || 1
      const q = j * nx + i
      rgbF[q * 3] = r / n
      rgbF[q * 3 + 1] = g / n
      rgbF[q * 3 + 2] = b / n
      const key = ((rgbF[q * 3] >> 4) << 8) | ((rgbF[q * 3 + 1] >> 4) << 4) | (rgbF[q * 3 + 2] >> 4)
      hist.set(key, (hist.get(key) ?? 0) + 1)
    }
  }
  let kMax = 0
  let vMax = -1
  hist.forEach((v, k) => {
    if (v > vMax) {
      vMax = v
      kMax = k
    }
  })
  const br = ((kMax >> 8) & 15) * 16 + 8
  const bg = ((kMax >> 4) & 15) * 16 + 8
  const bb = (kMax & 15) * 16 + 8
  // 3) Puntos del código (rejilla de ~2 px CSS donde hay trazo)
  const dataC = cctx.getImageData(0, 0, cod.width, cod.height).data
  const barra = Math.min(28, Math.max(16, H * 0.075))
  const o = (cod.height - 1) * cod.width * 4 // píxel de fondo (abajo a la izquierda)
  const paso = Math.max(1, Math.round(1.7 * dpr))
  const tx: number[] = []
  const ty: number[] = []
  const tc: number[] = []
  for (let y = 0; y < cod.height; y += paso) {
    for (let x = 0; x < cod.width; x += paso) {
      const k = (y * cod.width + x) * 4
      if (y / dpr < barra) continue // la barra superior no es código
      // Solo tinta: se descartan los píxeles de fondo (el fondo es opaco; la tinta difiere de él)
      const d = Math.abs(dataC[k] - dataC[o]) + Math.abs(dataC[k + 1] - dataC[o + 1]) + Math.abs(dataC[k + 2] - dataC[o + 2])
      if (d < 110) continue
      tx.push(x / dpr)
      ty.push(y / dpr)
      tc.push(dataC[k], dataC[k + 1], dataC[k + 2])
    }
  }
  const T = tx.length
  const M = Math.min(T, N)
  // Elegir cuáles partículas se llevan un destino: primero las "vistosas" (distintas del fondo)
  const vivas: number[] = []
  const fondo: number[] = []
  for (let q = 0; q < N; q++) {
    const d = Math.abs(rgbF[q * 3] - br) + Math.abs(rgbF[q * 3 + 1] - bg) + Math.abs(rgbF[q * 3 + 2] - bb)
    ;(d > 40 ? vivas : fondo).push(q)
  }
  const barajar = (a: number[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
  }
  barajar(vivas)
  barajar(fondo)
  const orden = vivas.concat(fondo)
  const elegidas = orden.slice(0, M)
  const sobran = orden.slice(M)
  const posX = (q: number) => (q % nx) * celda + celda / 2
  const posY = (q: number) => Math.floor(q / nx) * celda + celda / 2
  elegidas.sort((a, b) => posX(a) + rnd() * celda * 4 - (posX(b) + rnd() * celda * 4))
  // Destinos (M de T, repartidos), ordenados por x con algo de ruido
  const idxT: number[] = []
  for (let k = 0; k < M; k++) idxT.push(Math.floor((k * T) / M))
  idxT.sort((a, b) => tx[a] + rnd() * 3 - (tx[b] + rnd() * 3))

  const P: Particulas = {
    n: N,
    sx: new Float32Array(N),
    sy: new Float32Array(N),
    tx: new Float32Array(N),
    ty: new Float32Array(N),
    c0: new Uint8ClampedArray(N * 3),
    c1: new Uint8ClampedArray(N * 3),
    t0: new Float32Array(N),
    ph: new Float32Array(N),
    amp: new Float32Array(N),
    extra: new Uint8Array(N),
    celda,
    tam: Math.max(1.6, paso / dpr + 0.3),
  }
  const poner = (i: number, q: number) => {
    P.sx[i] = posX(q)
    P.sy[i] = posY(q)
    P.c0[i * 3] = rgbF[q * 3]
    P.c0[i * 3 + 1] = rgbF[q * 3 + 1]
    P.c0[i * 3 + 2] = rgbF[q * 3 + 2]
    P.t0[i] = (P.sx[i] / W) * FRENTE + rnd() * RUIDO_T
    P.ph[i] = rnd() * 6.283
    P.amp[i] = (0.35 + rnd() * 0.65) * Math.min(W, H) * 0.16
  }
  elegidas.forEach((q, i) => {
    poner(i, q)
    const t = idxT[i]
    P.tx[i] = tx[t]
    P.ty[i] = ty[t]
    P.c1[i * 3] = tc[t * 3]
    P.c1[i * 3 + 1] = tc[t * 3 + 1]
    P.c1[i * 3 + 2] = tc[t * 3 + 2]
  })
  sobran.forEach((q, k) => {
    const i = M + k
    poner(i, q)
    P.extra[i] = 1
    P.tx[i] = P.sx[i] + (rnd() - 0.3) * W * 0.25
    P.ty[i] = P.sy[i] - rnd() * H * 0.25
    P.c1[i * 3] = P.c0[i * 3]
    P.c1[i * 3 + 1] = P.c0[i * 3 + 1]
    P.c1[i * 3 + 2] = P.c0[i * 3 + 2]
  })
  return P
}

// ---------- dibujo ----------
function dibujar(c: Carta, p: number) {
  const { ctx, dpr } = c
  if (!c.fuente || !c.codigoCv) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, c.canvas.width, c.canvas.height)
  const cw = c.canvas.width
  const ch = c.canvas.height
  if (reduce || !c.parts) {
    // Sin partículas: fundido entre captura y código
    ctx.globalAlpha = 1
    ctx.drawImage(c.fuente, 0, 0)
    ctx.globalAlpha = suave(p)
    ctx.drawImage(c.codigoCv, 0, 0)
    ctx.globalAlpha = 1
  } else {
    const P = c.parts
    const pm = Math.pow(p, 1.5) // el barrido se hace algo más lento al principio
    const u = lim((pm - RUIDO_T) / FRENTE)
    const fx = u * cw
    // Detrás del frente: el panel del código; delante: la captura todavía intacta
    if (u > 0) {
      ctx.fillStyle = c.fondoCodigo
      ctx.fillRect(0, 0, fx, ch)
    }
    if (u < 1) ctx.drawImage(c.fuente, fx, 0, cw - fx, ch, fx, 0, cw - fx, ch)
    const fin = suave(lim((p - 0.92) / 0.08))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const alfaBase = 1 - fin
    if (alfaBase > 0.001) {
      ctx.globalAlpha = alfaBase
      let alfaActual = alfaBase
      for (let i = 0; i < P.n; i++) {
        const q = (pm - P.t0[i]) / DUR_VUELO
        if (q <= 0) continue
        const qq = q > 1 ? 1 : q
        const e = ease(qq)
        const s = Math.sin(Math.PI * qq)
        const ph = P.ph[i]
        const x = P.sx[i] + (P.tx[i] - P.sx[i]) * e + Math.sin(ph + qq * 5) * P.amp[i] * s
        const y = P.sy[i] + (P.ty[i] - P.sy[i]) * e + Math.cos(ph * 1.3 + qq * 4) * P.amp[i] * s * 0.8
        const extra = P.extra[i] === 1
        let tam: number
        let a = alfaBase
        if (extra) {
          a = alfaBase * (1 - suave(qq))
          tam = P.celda * (1 - 0.6 * suave(qq))
        } else tam = (P.celda + (P.tam - P.celda) * e) * (1 - 0.35 * s)
        if (a !== alfaActual) {
          ctx.globalAlpha = a
          alfaActual = a
        }
        if (a <= 0.01) continue
        const k = i * 3
        const r = P.c0[k] + (P.c1[k] - P.c0[k]) * e
        const g = P.c0[k + 1] + (P.c1[k + 1] - P.c0[k + 1]) * e
        const b = P.c0[k + 2] + (P.c1[k + 2] - P.c0[k + 2]) * e
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`
        ctx.fillRect(x - tam / 2, y - tam / 2, tam, tam)
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (fin > 0) {
      ctx.globalAlpha = fin
      ctx.drawImage(c.codigoCv, 0, 0)
    }
    ctx.globalAlpha = 1
  }
  c.pDib = p
  c.sucio = false
  for (const cb of oyentes) cb(c.canvas)
}

// ---------- ciclo ----------
function objetivoP(c: Carta, ahora: number): number {
  if (c.anim) {
    const k = lim((ahora - c.anim.t0) / c.anim.dur)
    const v = c.anim.de + (c.anim.a - c.anim.de) * ease(k)
    if (k >= 1) {
      c.pin = c.anim.a
      c.anim = null
    }
    return v
  }
  if (c.pin !== null) return c.pin
  const vh = window.innerHeight
  const top = c.media.getBoundingClientRect().top
  return lim((0.7 * vh - top) / (0.35 * vh))
}

function actualizarEtiqueta(c: Carta) {
  if (!c.btn) return
  const aCodigo = (c.anim ? c.anim.a : c.pin !== null ? c.pin : c.p) > 0.5 ? 1 : 0
  if (aCodigo === c.etiqueta && c.btn.dataset.ok) return
  c.etiqueta = aCodigo
  c.btn.dataset.ok = '1'
  c.btn.textContent = (aCodigo ? c.btn.dataset.captura : c.btn.dataset.codigo) ?? ''
}

function elegirActiva() {
  const mid = window.innerHeight / 2
  let mejor: Carta | null = null
  let dm = Infinity
  for (const c of cartas) {
    const r = c.media.getBoundingClientRect()
    if (r.bottom < 0 || r.top > window.innerHeight) continue
    const d = Math.abs((r.top + r.bottom) / 2 - mid)
    if (d < dm) {
      dm = d
      mejor = c
    }
  }
  if (mejor) activa = mejor
}

function cuadro(ahora: number) {
  raf = 0
  let seguir = false
  elegirActiva()
  for (const c of cartas) {
    if (!c.visible && !c.sucio) continue
    if (!c.construida) {
      if (!c.visible) continue
      medir(c)
      construir(c)
    }
    if (!c.visible && !c.sucio) continue
    const p = objetivoP(c, ahora)
    c.p = p
    if (c.anim) seguir = true
    actualizarEtiqueta(c)
    c.el.style.setProperty('--p', p.toFixed(3))
    if (c.sucio || Math.abs(p - c.pDib) > 0.0004) dibujar(c, p)
  }
  if (seguir) pedir()
}
function pedir() {
  if (!raf) raf = requestAnimationFrame(cuadro)
}

function medir(c: Carta): boolean {
  const W = Math.round(c.media.clientWidth)
  const H = Math.round(c.media.clientHeight)
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  if (W === c.W && H === c.H && dpr === c.dpr) return false
  c.W = W
  c.H = H
  c.dpr = dpr
  c.canvas.width = Math.max(1, Math.round(W * dpr))
  c.canvas.height = Math.max(1, Math.round(H * dpr))
  return true
}

function reconstruirTodas() {
  for (const c of cartas) {
    c.construida = false
    c.sucio = true
    if (c.visible || c === activa) {
      medir(c)
      construir(c)
    }
  }
  pedir()
}

function alternar(c: Carta) {
  const actual = c.anim ? c.anim.a : c.pin !== null ? c.pin : c.p
  const a = actual > 0.5 ? 0 : 1
  c.anim = { t0: performance.now(), de: c.p, a, dur: reduce ? 400 : 1200 }
  actualizarEtiqueta(c)
  pedir()
}

/** Inicia el efecto en las tarjetas dadas (cada una con .media, .codigo[data-archivo] y .fx-btn). */
export async function iniciar(els: HTMLElement[], opc: Opciones): Promise<void> {
  if (iniciado) return
  iniciado = true
  reduce = opc.reduce
  try {
    await document.fonts.load(`400 14px ${FUENTE}`)
    await document.fonts.load(`700 14px ${TITULO}`)
  } catch {
    /* se usará la fuente de reserva */
  }
  els.forEach((el, indice) => {
    const media = el.querySelector<HTMLElement>('.media')
    const cod = el.querySelector<HTMLElement>('.codigo')
    const code = el.querySelector('.codigo code')
    if (!media || !cod || !code) return
    const canvas = document.createElement('canvas')
    canvas.className = 'fx'
    canvas.setAttribute('aria-hidden', 'true')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    media.appendChild(canvas)
    const btn = el.querySelector<HTMLButtonElement>('.fx-btn')
    const c: Carta = {
      el,
      media,
      canvas,
      ctx,
      btn,
      img: media.querySelector('img'),
      indice,
      nombre: el.querySelector('h3')?.textContent ?? '',
      sub: media.querySelector('.ph-s')?.textContent ?? '',
      archivo: cod.dataset.archivo ?? '',
      codigo: code.textContent ?? '',
      cap: cod.querySelector('.cod-cap')?.textContent ?? '',
      W: 0,
      H: 0,
      dpr: 0,
      fondoCodigo: '',
      fuente: null,
      codigoCv: null,
      parts: null,
      construida: false,
      visible: false,
      p: 0,
      pDib: -1,
      sucio: true,
      anim: null,
      pin: null,
      etiqueta: 0,
    }
    el.classList.remove('fx-off')
    if (btn) {
      btn.hidden = false
      btn.dataset.ok = '1'
      btn.addEventListener('click', () => alternar(c))
    }
    if (c.img && !c.img.complete) c.img.addEventListener(
        'load',
        () => {
          c.construida = false
          c.sucio = true
          pedir()
        },
        { once: true },
      )
    cartas.push(c)
  })
  if (!cartas.length) return

  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        const c = cartas.find((x) => x.el === en.target)
        if (!c) continue
        c.visible = en.isIntersecting
        if (!en.isIntersecting) c.pin = null // al salir de pantalla se suelta el botón y vuelve el scroll
        if (en.isIntersecting) c.sucio = true
      }
      pedir()
    },
    { rootMargin: '80px 0px' },
  )
  cartas.forEach((c) => io.observe(c.el))

  window.addEventListener('scroll', pedir, { passive: true })
  let t = 0
  const alCambiarTam = () => {
    clearTimeout(t)
    t = window.setTimeout(() => {
      let cambio = false
      for (const c of cartas) {
        if (medirSolo(c)) {
          c.construida = false
          c.sucio = true
          cambio = true
        }
      }
      if (cambio) pedir()
    }, 120)
  }
  const ro = new ResizeObserver(alCambiarTam)
  cartas.forEach((c) => ro.observe(c.media))
  window.addEventListener('resize', alCambiarTam)
  // Tema: --acc / --sec / --base cambian
  new MutationObserver(reconstruirTodas).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', reconstruirTodas)
  pedir()
}

function medirSolo(c: Carta): boolean {
  const W = Math.round(c.media.clientWidth)
  const H = Math.round(c.media.clientHeight)
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  return W !== c.W || H !== c.H || dpr !== c.dpr
}
