// Portátil 3D que se desarma con el scroll. Se carga con import() dinámico desde main.ts.
import * as THREE from 'three'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { cargarLaptop, type Pieza } from './cargador'
import { canvasActivo, alRedibujar } from '../efectos/desintegrar'
import { crearPantallaNicos } from './pantallaNicos'
import { leerDatos } from '../nicos/datos'
import { crearPantallaInicio } from './pantallaInicio'
import { crearEntorno } from './entorno'
import { crearSombras } from './sombra'
import { crearEtiquetas, type Entrada } from './etiquetas'
import { crearVentanas, girable, type Rect } from './ventanas'

const SIN_RESALTE = new Set(['tapa', 'chasis']) // inicio y contacto muestran el portátil entero
const FOV = 35
const MARGEN = 0.93 // fracción del campo visual que puede ocupar el portátil (el resto es margen)
const RAD = Math.PI / 180
const LID_ABIERTA = 110 // ángulo de la tapa en el modelo (blender/laptop.py: LID_OPEN_DEG)
const LID_CERRANDO = 10 // ángulo inicial de la intro (casi cerrada)
// Eje de la bisagra (three, Y arriba): HINGE de laptop.py (x, z, -y) = borde trasero inferior de la tapa junto al chasis.
const BISAGRA = new THREE.Vector3(0, 0.0105, -0.1085)
const SEPARACION_TRAY = 0.75 // trayectoria: explosión algo más compacta para que llene el escenario

/** Estado animable: separación de cada pieza (fracción de explode.json) + parámetros de cámara. */
type Estado = Record<string, number>

interface Paso {
  id: string
  /** Separación por pieza (las ausentes = 0). pantalla es relativa a la tapa. */
  e: Record<string, number>
  /** Inclinación del teclado (rad). */
  tilt?: number
  /** Cámara: azimut y elevación (grados), zoom extra (<= 1.2) y pieza hacia la que se desplaza la mirada. */
  az: number
  el: number
  zoom: number
  foco?: string
  /** Cuánto se desplaza el punto de mira hacia la pieza (0..0.3). */
  fw?: number
  /** Luz extra para leer los interiores (0..1). */
  lum?: number
}

// Una sección = un estado completo (nada es acumulativo; al subir se invierte solo).
const K = SEPARACION_TRAY
const TODO: Record<string, number> = { tapa: 0.62, pantalla: 0.62, teclado: 0.7, placa: K, cpu: K, antena: K, bateria: K, disco: K }
const PASOS: Paso[] = [
  { id: 'inicio', e: {}, az: -33, el: 28, zoom: 1 },
  { id: 'sistemas', e: { pantalla: 2 }, az: -18, el: 20, zoom: 1.1, foco: 'pantalla', fw: 0.25 },
  { id: 'tecnologias', e: { teclado: 0.75, placa: 1 }, az: -28, el: 36, zoom: 1.15, foco: 'placa', fw: 0.3 },
  { id: 'ia', e: { teclado: 0.75, cpu: 0.5 }, az: -25, el: 42, zoom: 1.2, foco: 'cpu', fw: 0.3 },
  { id: 'comunidad', e: { antena: 3 }, az: -55, el: 26, zoom: 1.15, foco: 'antena', fw: 0.3 },
  { id: 'proyectos', e: { teclado: 0.75, bateria: 0.8 }, az: -35, el: 34, zoom: 1.15, foco: 'bateria', fw: 0.3 },
  { id: 'ensenanza', e: { teclado: 0.7 }, tilt: 0.22, az: -30, el: 32, zoom: 1.1, foco: 'teclado', fw: 0.25 },
  { id: 'trayectoria', e: TODO, az: -35, el: 38, zoom: 0.86, foco: 'disco', fw: 0.1, lum: 1 },
  { id: 'contacto', e: {}, az: -33, el: 28, zoom: 1 },
]

export async function iniciar(stage: HTMLElement, opc: { reduce: boolean }): Promise<void> {
  const { reduce } = opc
  const url = stage.dataset.modelo ?? 'models/laptop.glb'
  let PR = Math.min(window.devicePixelRatio, 1.5) // en móvil baja a 1,25 / 1 si los fotogramas tardan
  const mqMovil = window.matchMedia('(max-width: 859px)')
  let movil = mqMovil.matches // móvil: el canvas es el fondo y el portátil se encuadra en el hueco activo (ventanas.ts)
  const ventanas = crearVentanas()
  const drag = { az: 0 } // giro táctil del hero (grados)

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.className = 'escena'
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(PR)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.setClearColor(0x000000, 0)

  // Iluminación de producto: entorno de estudio (reflejos), luz principal, contraluz cálido de acento y relleno frío.
  const scene = new THREE.Scene()
  scene.environment = crearEntorno(renderer)
  const luz = new THREE.DirectionalLight(0xffffff, 1.1)
  luz.position.set(-0.6, 1, 0.8)
  scene.add(luz)
  const contraluz = new THREE.DirectionalLight(0xff7a45, 0.04)
  contraluz.position.set(0.9, 0.5, -1)
  scene.add(contraluz)
  const relleno = new THREE.DirectionalLight(0x9fb8ff, 0.35)
  relleno.position.set(1, 0.2, 0.8)
  scene.add(relleno)
  // Brillo de la pantalla sobre la cubierta (falso): una luz puntual tenue delante de la pantalla.
  const brilloPantalla = new THREE.PointLight(0xdfe6f5, 0, 0, 2)
  scene.add(brilloPantalla)

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 20)

  const { raiz, piezas } = await cargarLaptop(url)
  scene.add(raiz)
  const porNombre = new Map<string, Pieza>(piezas.map((p) => [p.nombre, p]))

  // La tapa y la pantalla cuelgan de un pivote usado SOLO para el ángulo de la tapa; la explosión sigue moviendo los nodos.
  const pivote = new THREE.Group()
  raiz.add(pivote)
  pivote.add(porNombre.get('tapa')!.nodo, porNombre.get('pantalla')!.nodo)
  const lid = { a: LID_ABIERTA } // grados respecto a la base
  const hc = new THREE.Vector3()
  const girarTapa = () => {
    const th = (LID_ABIERTA - lid.a) * RAD
    // La bisagra viaja con la tapa (explosión) para que el giro (intro/parpadeo) sea siempre sobre su borde.
    const t = porNombre.get('tapa')!
    hc.copy(BISAGRA).add(t.nodo.position).sub(t.reposo)
    const c = Math.cos(th)
    const s = Math.sin(th)
    pivote.rotation.set(th, 0, 0)
    pivote.position.set(0, hc.y - (hc.y * c - hc.z * s), hc.z - (hc.y * s + hc.z * c))
    raiz.updateMatrixWorld(true)
  }

  // ---- Tema (claro/oscuro): exposición, entorno, tono del aluminio y fuerza de la sombra ----
  const bg = new THREE.Color('#161B26')
  const tema = { claro: false, expo: 1, env: 0.8, alu: 1, sombra: 0.55 }
  const leerTema = () => {
    const cs = getComputedStyle(document.documentElement)
    const b = cs.getPropertyValue('--base').trim()
    if (b) bg.set(b)
    tema.claro = cs.colorScheme.includes('light')
    tema.expo = tema.claro ? 0.92 : 1
    tema.env = tema.claro ? 0.62 : 0.8
    tema.alu = tema.claro ? 0.78 : 1
    tema.sombra = tema.claro ? 1 : 0.8
  }
  leerTema()
  const NEUTROS = new Set(['pantalla', 'acento', 'pistas'])
  const matsInfo = piezas.flatMap((p) => p.mats.map((x) => ({ p, m: x.m, base: x.m.color.clone(), alu: x.m.name === 'aluminio', neutro: NEUTROS.has(x.m.name) })))

  // ---- Estado animable: separación de cada pieza (fracción de explode.json) + parámetros de cámara ----
  const claves = piezas.map((p) => p.nombre)
  const S: Estado = { tilt: 0, az: PASOS[0].az, el: PASOS[0].el, zoom: 1, fw: 0, fx: 0, fy: 0, fz: 0, lum: 0 }
  for (const k of claves) S[k] = 0
  let sucio = true
  const pedir = () => {
    sucio = true
  }
  const offT = porNombre.get('tapa')!.offset
  const tmpV = new THREE.Vector3()
  const aplicar = (est: Estado) => {
    raiz.position.y = 0
    for (const p of piezas) {
      p.nodo.position.copy(p.reposo)
      const k = est[p.nombre] ?? 0
      if (p.nombre === 'pantalla') {
        // La pantalla se separa respecto a la tapa (que va con su propia fracción).
        p.nodo.position.addScaledVector(offT, est.tapa ?? 0)
        p.nodo.position.addScaledVector(tmpV.copy(p.offset).sub(offT), k)
      } else p.nodo.position.addScaledVector(p.offset, k)
      if (p.nombre === 'teclado') p.nodo.rotation.x = est.tilt ?? 0
    }
    pivote.rotation.set(0, 0, 0)
    pivote.position.set(0, 0, 0)
    raiz.updateMatrixWorld(true)
  }
  const centroDe = (n: string): THREE.Vector3 => new THREE.Box3().expandByObject(porNombre.get(n)!.nodo).getCenter(new THREE.Vector3())

  // Un estado completo por sección (con el punto de mira calculado sobre la pose real).
  const estados: Estado[] = PASOS.map((paso) => {
    const est: Estado = { tilt: paso.tilt ?? 0, az: paso.az, el: paso.el, zoom: paso.zoom, fw: paso.foco ? (paso.fw ?? 0) : 0, fx: 0, fy: 0, fz: 0, lum: paso.lum ?? 0 }
    for (const k of claves) est[k] = paso.e[k] ?? 0
    aplicar(est)
    if (paso.foco) {
      const c = centroDe(paso.foco)
      est.fx = c.x
      est.fy = c.y
      est.fz = c.z
    }
    return est
  })
  // El punto de mira de las secciones sin foco no importa (fw = 0): se hereda para que no viaje.
  for (let i = 1; i < estados.length; i++) {
    if (!PASOS[i].foco) Object.assign(estados[i], { fx: estados[i - 1].fx, fy: estados[i - 1].fy, fz: estados[i - 1].fz })
  }
  Object.assign(S, estados[0])
  aplicar(S)

  // Piezas de cada sección (data-pieza) y separación objetivo de cada una (para mostrar la etiqueta al estar separada).
  const piezaDe = (id: string) => document.getElementById(id)?.dataset.pieza
  const piezaHero = piezaDe('inicio')
  const piezaSistemas = piezaDe('sistemas')
  const piezaContacto = piezaDe('contacto')
  const piezaTray = piezaDe('trayectoria')

  // ---- Resaltado: aristas en acento (Line2: ancho constante en píxeles y sin dientes) + atenuado del resto ----
  const colorAcento = new THREE.Color('#FF7A45')
  const colorNeutro = new THREE.Color('#D7DCE4')
  const leerAcento = () => {
    const cs = getComputedStyle(document.documentElement)
    const v = cs.getPropertyValue('--acc').trim()
    if (v) colorAcento.set(v)
    const n = cs.getPropertyValue('--sec').trim()
    if (n) colorNeutro.set(n)
  }
  leerAcento()
  const bordes = new Map<string, LineMaterial>()
  const resolucion = new THREE.Vector2(1, 1)
  const bordesDe = (p: Pieza): LineMaterial => {
    let mat = bordes.get(p.nombre)
    if (mat) return mat
    mat = new LineMaterial({ color: colorAcento.getHex(), linewidth: 1.5 * PR, transparent: true, opacity: 0, depthTest: true, worldUnits: false })
    mat.resolution.copy(resolucion)
    bordes.set(p.nombre, mat)
    const meshes: THREE.Mesh[] = []
    p.nodo.traverse((x) => {
      if ((x as THREE.Mesh).isMesh) meshes.push(x as THREE.Mesh)
    })
    for (const mesh of meshes) {
      const l = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(mesh.geometry, 30)), mat)
      l.renderOrder = 2
      mesh.add(l)
    }
    for (const { m } of p.mats) {
      m.polygonOffset = true
      m.polygonOffsetFactor = 1
      m.polygonOffsetUnits = 1
    }
    return mat
  }
  const tinte: Record<string, number> = {} // 0..1: arista de acento de la pieza activa
  const atenuar: Record<string, number> = {} // 0..1: pieza no activa (se funde hacia el fondo)
  const vista = { todas: 0 } // 0..1: vista de explosión completa (contorno neutro fino en todas)
  for (const p of piezas) {
    tinte[p.nombre] = 0
    atenuar[p.nombre] = 0
  }
  const tmpC = new THREE.Color()
  const pintar = () => {
    for (const p of piezas) {
      const h = tinte[p.nombre]
      const ver = Math.max(h, vista.todas)
      if (ver === 0 && !bordes.has(p.nombre)) continue
      const mat = bordesDe(p)
      mat.color.copy(colorNeutro).lerp(colorAcento, h)
      mat.opacity = Math.max(0.9 * h, (p.nombre === 'tapa' || p.nombre === 'pantalla' ? 0 : 0.2) * vista.todas)
      mat.linewidth = (h > 0.5 ? 1.6 : 1.1) * PR
      mat.visible = mat.opacity > 0.01
    }
    for (const x of matsInfo) {
      tmpC.copy(x.base)
      if (x.alu) tmpC.multiplyScalar(tema.alu)
      if (!x.neutro) tmpC.lerp(bg, 0.24 * atenuar[x.p.nombre])
      x.m.color.copy(tmpC)
    }
    pedir()
  }
  const activar = (nombre: string | undefined) => {
    leerAcento()
    const todas = nombre !== undefined && nombre === piezaTray
    const enfoque = nombre !== undefined && !todas && !SIN_RESALTE.has(nombre)
    gsap.killTweensOf(vista)
    if (reduce) vista.todas = todas ? 1 : 0
    else gsap.to(vista, { todas: todas ? 1 : 0, duration: 0.4, ease: 'power1.out', onUpdate: pintar })
    for (const p of piezas) {
      const objetivo = p.nombre === nombre && enfoque ? 1 : 0
      const dim = enfoque && p.nombre !== nombre ? 1 : 0
      gsap.killTweensOf(tinte, p.nombre)
      gsap.killTweensOf(atenuar, p.nombre)
      if (reduce) {
        tinte[p.nombre] = objetivo
        atenuar[p.nombre] = dim
      } else {
        if (tinte[p.nombre] !== objetivo) gsap.to(tinte, { [p.nombre]: objetivo, duration: 0.3, ease: 'power1.out', onUpdate: pintar })
        if (atenuar[p.nombre] !== dim) gsap.to(atenuar, { [p.nombre]: dim, duration: 0.45, ease: 'power1.out', onUpdate: pintar })
      }
    }
    pintar()
  }
  activar(stage.dataset.active)
  new MutationObserver(() => activar(stage.dataset.active)).observe(stage, { attributes: true, attributeFilter: ['data-active'] })
  // El tema (claro/oscuro) cambia --acc, --base...: se relee al alternarlo.
  const alCambiarTemaGlobal = () => {
    leerAcento()
    leerTema()
    aplicarTema()
    pintar()
  }
  const aplicarTema = () => {
    renderer.toneMappingExposure = tema.expo
    contraluz.intensity = tema.claro ? 0.012 : 0.04
  }
  aplicarTema()
  new MutationObserver(alCambiarTemaGlobal).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', alCambiarTemaGlobal)

  // ---- Sombras de contacto y etiquetas ----
  const sombras = crearSombras(scene, claves)
  const etiquetas = crearEtiquetas()

  // ---- Pantalla: reposo (saludo tecleado), sistemas (canvas de la tarjeta activa) y contacto (arranque de nicOS) ----
  const pant = { brillo: 1 } // 0 apagada .. 1 encendida
  const pi = crearPantallaInicio(reduce)
  const matPantalla = piezas.flatMap((p) => p.mats).find((x) => x.m.name === 'pantalla')?.m
  let tickPantalla: ((t: number) => void) | null = null
  if (matPantalla) {
    // Una textura por canvas; si el canvas cambia de tamaño (resize) la GPU necesita una textura nueva.
    const texturas = new Map<HTMLCanvasElement, { tex: THREE.CanvasTexture; w: number; h: number }>()
    let lienzoActual: HTMLCanvasElement | null = null
    const texDe = (cv: HTMLCanvasElement): THREE.CanvasTexture => {
      let t = texturas.get(cv)
      if (t && (t.w !== cv.width || t.h !== cv.height)) {
        t.tex.dispose()
        t = undefined
      }
      if (!t) {
        const tex = new THREE.CanvasTexture(cv)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.flipY = false // UV de glTF: origen arriba a la izquierda
        tex.anisotropy = 4
        t = { tex, w: cv.width, h: cv.height }
        texturas.set(cv, t)
      }
      return t.tex
    }
    const aplicarTextura = (cv: HTMLCanvasElement) => {
      const tex = texDe(temaClaro() && !yaOscuro(cv) ? aOscuro(cv) : cv)
      tex.needsUpdate = true
      if (matPantalla.map !== tex) {
        matPantalla.map = tex
        matPantalla.emissiveMap = tex
        matPantalla.needsUpdate = true
      }
    }
    const tonoPantalla = () => {
      matPantalla.color.set(0xffffff)
      matPantalla.emissive.set(0xffffff)
      matPantalla.emissiveIntensity = 0.75
      matPantalla.roughness = 0.6
      matPantalla.metalness = 0
    }
    // En tema claro los canvas son casi blancos y la pantalla parecería un folio: para la textura 3D se usa una copia
    // en oscuro (invertida y con el matiz girado 180°, así el acento sigue siendo naranja). La pantalla siempre "enciende" oscura.
    const temaClaro = () => getComputedStyle(document.documentElement).colorScheme.includes('light')
    const oscuros = new Map<HTMLCanvasElement, HTMLCanvasElement>()
    const datos = leerDatos()
    const pn = datos ? crearPantallaNicos(datos, reduce) : null
    // Los canvas de nicOS y del reposo ya se dibujan siempre en oscuro.
    const yaOscuro = (cv: HTMLCanvasElement) => cv === pn?.canvas || cv === pi.canvas
    const aOscuro = (cv: HTMLCanvasElement): HTMLCanvasElement => {
      let o = oscuros.get(cv)
      if (!o) {
        o = document.createElement('canvas')
        oscuros.set(cv, o)
      }
      if (o.width !== cv.width || o.height !== cv.height) {
        o.width = cv.width
        o.height = cv.height
      }
      const c = o.getContext('2d')!
      c.filter = 'invert(1) hue-rotate(180deg)'
      c.drawImage(cv, 0, 0)
      c.filter = 'none'
      return o
    }
    // Fuera del inicio, el último fotograma estático del reposo se ve atenuado (~50%).
    const brilloEmisivo = (cv: HTMLCanvasElement, hero: boolean) => {
      const v = cv === pi.canvas && !hero ? 0.38 : 0.75
      if (matPantalla.emissiveIntensity !== v) {
        matPantalla.emissiveIntensity = v
        pedir()
      }
    }
    const ponerPantalla = (cv: HTMLCanvasElement) => {
      if (cv === lienzoActual) return
      lienzoActual = cv
      tonoPantalla()
      aplicarTextura(cv)
      pedir()
    }
    const alCambiarTema = () => {
      if (!lienzoActual) return
      aplicarTextura(lienzoActual)
      pedir()
    }
    new MutationObserver(alCambiarTema).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', alCambiarTema)
    // La textura solo se sube a la GPU cuando ese canvas se redibuja.
    alRedibujar((cv) => {
      if (cv !== lienzoActual) return
      aplicarTextura(cv)
      pedir()
    })
    let enContacto = false
    let enHero = false
    tickPantalla = (t: number) => {
      const act = stage.dataset.active
      if (pn && act === piezaContacto) {
        if (enHero) {
          enHero = false
          pi.completar()
        }
        if (!enContacto) {
          enContacto = true
          pn.reiniciar()
          parpadeoTapa()
        }
        const nuevo = pn.dibujar(t)
        ponerPantalla(pn.canvas)
        if (nuevo) {
          aplicarTextura(pn.canvas)
          pedir()
        }
        return
      }
      enContacto = false
      if (act === piezaHero) {
        enHero = true
        const nuevo = pi.dibujar(t, pant.brillo)
        ponerPantalla(pi.canvas)
        brilloEmisivo(pi.canvas, true)
        if (nuevo) {
          aplicarTextura(pi.canvas)
          pedir()
        }
      } else {
        if (enHero) {
          enHero = false
          pi.completar()
          if (lienzoActual === pi.canvas) {
            aplicarTextura(pi.canvas)
            pedir()
          }
        }
        const cv = act === piezaSistemas ? (canvasActivo() ?? pi.canvas) : pi.canvas
        ponerPantalla(cv)
        brilloEmisivo(cv, false)
      }
    }
    gsap.ticker.add(tickPantalla)
  }

  // Parpadeo de la tapa al llegar a contacto: se cierra un poco y se reabre mientras "reinicia" (nicOS arranca en negro).
  let parpadeo: gsap.core.Timeline | null = null
  function parpadeoTapa() {
    if (reduce || lid.a < LID_ABIERTA - 1) return
    parpadeo?.kill()
    parpadeo = gsap
      .timeline({ onUpdate: pedir })
      .to(lid, { a: 62, duration: 0.3, ease: 'power2.in' })
      .to(lid, { a: LID_ABIERTA, duration: 0.7, ease: 'back.out(1.4)' })
  }

  // ---- Tamaño: el canvas cubre el viewport; el portátil se centra en la zona del escenario ----
  let ancho = 0
  let alto = 0
  let zonaW = 1
  let zonaH = 1
  const zona = { l: 0, t: 0, r: 1, b: 1 }
  // Móvil: el búfer usa la altura de viewport grande (100lvh) para no reasignarlo cada vez que la barra del navegador se
  // esconde; el encuadre se calcula igualmente sobre la zona visible.
  const sonda = document.createElement('div')
  sonda.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;visibility:hidden;pointer-events:none'
  sonda.style.height = '100lvh'
  document.body.appendChild(sonda)
  let tRefresco = 0
  const pedirRefresco = () => {
    clearTimeout(tRefresco)
    tRefresco = window.setTimeout(() => ScrollTrigger.refresh(), 120)
  }
  const cabecera0 = document.querySelector<HTMLElement>('header.top')
  const rectMov: Rect = { l: 0, t: 0, r: 1, b: 1 }
  const objetivo: Rect = { l: 0, t: 0, r: 1, b: 1 }
  let rectListo = false
  let rectAnim = true
  let pesoVentana = 0
  let etqVisible = false
  let yPrev = -1
  let tPrevRect = performance.now()
  let cabH = 102
  const ajustarMovil = () => {
    const W = document.documentElement.clientWidth
    const Hc = sonda.offsetHeight || window.innerHeight
    cabH = cabecera0?.offsetHeight ?? 102
    if (!W || !Hc) return
    if (W !== ancho || Hc !== alto) {
      ancho = W
      alto = Hc
      renderer.setSize(W, Hc, false)
      camera.aspect = W / Hc
      renderer.getDrawingBufferSize(resolucion)
      for (const m of bordes.values()) m.resolution.copy(resolucion)
    }
    ventanas.medir()
    rectListo = false
    rectAnim = true
    pedir()
  }
  const actualizarRect = (dt: number) => {
    const Hv = window.innerHeight
    pesoVentana = ventanas.objetivo(ancho, Hv, cabH, objetivo)
    if (pesoVentana > 0.85) etqVisible = true
    else if (pesoVentana < 0.5) etqVisible = false
    const k = rectListo ? 1 - Math.exp(-Math.min(dt, 0.04) * 14) : 1
    rectListo = true
    let mov = 0
    for (const c of ['l', 't', 'r', 'b'] as const) mov = Math.max(mov, Math.abs(objetivo[c] - rectMov[c]))
    for (const c of ['l', 't', 'r', 'b'] as const) rectMov[c] += (objetivo[c] - rectMov[c]) * (mov < 0.3 ? 1 : k)
    rectAnim = mov >= 0.3
    zonaW = rectMov.r - rectMov.l
    zonaH = rectMov.b - rectMov.t
    const cx = (rectMov.l + rectMov.r) / 2
    const cy = (rectMov.t + rectMov.b) / 2
    camera.setViewOffset(ancho, alto, ancho / 2 - cx, alto / 2 - cy, ancho, alto)
    camera.updateProjectionMatrix()
    Object.assign(zona, rectMov)
    sucio = true
  }
  const ajustar = () => {
    movil = mqMovil.matches
    if (movil) return ajustarMovil()
    const W = document.documentElement.clientWidth
    const H = window.innerHeight
    const r = stage.getBoundingClientRect()
    const cab = document.querySelector<HTMLElement>('header.top')?.offsetHeight ?? 56
    zonaW = stage.clientWidth
    zonaH = stage.clientHeight
    if (!W || !H || !zonaW || !zonaH) return
    ancho = W
    alto = H
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    // Desplaza el centro de proyección al centro del escenario.
    const cx = r.left + zonaW / 2
    const cy = cab + zonaH / 2
    camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H)
    camera.updateProjectionMatrix()
    Object.assign(zona, { l: cx - zonaW / 2, r: cx + zonaW / 2, t: cy - zonaH / 2, b: cy + zonaH / 2 })
    renderer.getDrawingBufferSize(resolucion)
    for (const m of bordes.values()) m.resolution.copy(resolucion)
    pedir()
  }
  new ResizeObserver(ajustar).observe(stage)
  new ResizeObserver(ajustar).observe(document.documentElement)
  // Móvil: si cambia la altura del contenido (imágenes, fuentes, apertura de huecos) se vuelven a medir los huecos.
  const principal = document.getElementById('contenido')
  if (principal) {
    new ResizeObserver(() => {
      if (!movil) return
      if (ventanas.medir()) {
        pedirRefresco()
        rectAnim = true
        pedir()
      }
    }).observe(principal)
  }

  // ---- Cámara: siempre encuadra TODO el portátil en su pose actual (con la tapa abierta) ----
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 }
  const caja = new THREE.Box3()
  const cajas = new Map<string, THREE.Box3>(claves.map((k) => [k, new THREE.Box3()]))
  const desp = new Map<string, number>()
  const centro = new THREE.Vector3()
  const mira = new THREE.Vector3()
  const dir = new THREE.Vector3()
  const der = new THREE.Vector3()
  const arr = new THREE.Vector3()
  const rel = new THREE.Vector3()
  const ARRIBA = new THREE.Vector3(0, 1, 0)
  const medir = () => {
    caja.makeEmpty()
    for (const p of piezas) {
      const c = cajas.get(p.nombre)!
      c.makeEmpty().expandByObject(p.nodo)
      caja.union(c)
      desp.set(p.nombre, p.nodo.position.distanceTo(p.reposo))
    }
  }
  const colocarCamara = () => {
    caja.getCenter(centro)
    // Punto de mira: el centro del conjunto, desplazado hacia la pieza activa.
    mira.set(S.fx, S.fy, S.fz).sub(centro).multiplyScalar(movil ? S.fw * 0.6 : S.fw).add(centro)
    // Dirección de la cámara según azimut/elevación (+ giro suave del ratón).
    const az = S.az * RAD - mouse.sx * 0.1 + drag.az * RAD
    const el = Math.max(5 * RAD, S.el * RAD + mouse.sy * 0.05)
    dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    der.crossVectors(ARRIBA, dir).normalize()
    arr.crossVectors(dir, der)
    // Semiángulos útiles: solo la zona del escenario, con margen.
    const tv = Math.tan((FOV / 2) * RAD)
    const tH = ((tv * zonaW) / alto) * MARGEN
    const tV = ((tv * zonaH) / alto) * MARGEN
    // Distancia mínima para que las 8 esquinas de la caja entren en la zona.
    let d = 0
    for (let i = 0; i < 8; i++) {
      rel.set(i & 1 ? caja.max.x : caja.min.x, i & 2 ? caja.max.y : caja.min.y, i & 4 ? caja.max.z : caja.min.z).sub(mira)
      const prof = rel.dot(dir)
      d = Math.max(d, prof + Math.abs(rel.dot(der)) / tH, prof + Math.abs(rel.dot(arr)) / tV)
    }
    d = Math.max(d / Math.min(S.zoom, movil ? 1 : 1.2), 0.2) // móvil: siempre el portátil entero en el hueco
    camera.position.copy(mira).addScaledVector(dir, d)
    camera.lookAt(mira)
  }

  // ---- Etiquetas: punto de anclaje de cada pieza proyectado a la pantalla ----
  const pr = new THREE.Vector3()
  const entradas: Entrada[] = []
  const progresoPieza = (n: string): number => {
    const paso = PASOS.find((x) => piezaDe(x.id) === n && x.e[n])
    return paso ? Math.min(1, Math.max(0, (S[n] ?? 0) / paso.e[n])) : 0
  }
  const actualizarEtiquetas = (bob: number, instante: boolean): boolean => {
    const act = stage.dataset.active
    entradas.length = 0
    let todas = false
    if (movil && !etqVisible) {
      /* fuera del hueco no hay etiquetas */
    } else if (act && act === piezaTray && (reduce || S.tapa / TODO.tapa > 0.9)) {
      todas = true
      for (const n of claves) entradas.push({ id: n, x: 0, y: 0, x0: 0, x1: 0, y0: 0, y1: 0 })
    } else if (act && !SIN_RESALTE.has(act) && act !== piezaTray && (reduce || progresoPieza(act) > 0.55)) entradas.push({ id: act, x: 0, y: 0, x0: 0, x1: 0, y0: 0, y1: 0 })
    for (const e of entradas) {
      const cj = cajas.get(e.id)!
      cj.getCenter(pr)
      pr.y += bob
      pr.project(camera)
      e.x = Math.round((pr.x * 0.5 + 0.5) * ancho)
      e.y = Math.round((-pr.y * 0.5 + 0.5) * alto)
      e.x0 = e.y0 = Infinity
      e.x1 = e.y1 = -Infinity
      for (let i = 0; i < 8; i++) {
        pr.set(i & 1 ? cj.max.x : cj.min.x, (i & 2 ? cj.max.y : cj.min.y) + bob, i & 4 ? cj.max.z : cj.min.z).project(camera)
        const px = (pr.x * 0.5 + 0.5) * ancho
        const py = (-pr.y * 0.5 + 0.5) * alto
        e.x0 = Math.min(e.x0, px)
        e.x1 = Math.max(e.x1, px)
        e.y0 = Math.min(e.y0, py)
        e.y1 = Math.max(e.y1, py)
      }
    }
    return etiquetas.actualizar(entradas, zona, todas, instante)
  }

  // ---- Bucle bajo demanda (el ticker de gsap se detiene con la pestaña oculta) ----
  const heroVisible = () => stage.dataset.active === piezaHero && window.scrollY < window.innerHeight * 0.8
  const bobEstado = { env: 0, n: 0 }
  let introHecha = reduce
  const normalPantalla = new THREE.Vector3(0, 0.342, 0.94)
  let renderPrev = 0
  let tMuestra = 0
  let nMuestra = 0
  const t0 = performance.now()
  const dibujar = () => {
    if (document.hidden || !ancho) return
    if (mqMovil.matches !== movil) ajustar()
    if (movil) {
      const y = window.scrollY
      if (y !== yPrev || rectAnim || !rectListo) {
        const ahora = performance.now()
        yPrev = y
        if (ventanas.abrir()) pedirRefresco()
        const id = ventanas.activa(y, cabH, window.innerHeight)
        const p = document.getElementById(id)?.dataset.pieza
        if (p && stage.dataset.active !== p) stage.dataset.active = p
        actualizarRect((ahora - tPrevRect) / 1000)
        tPrevRect = ahora
      } else tPrevRect = performance.now()
    }
    let bob = 0
    if (!reduce) {
      const dx = mouse.x - mouse.sx
      const dy = mouse.y - mouse.sy
      if (Math.abs(dx) > 0.0005 || Math.abs(dy) > 0.0005) {
        mouse.sx += dx * 0.06
        mouse.sy += dy * 0.06
        sucio = true
      }
      // Flotación muy suave (<= 2,5 mm ≈ 4 px) solo mientras se ve el inicio; a ~30 fps y se apaga con suavidad.
      const objetivo = introHecha && heroVisible() ? 1 : 0
      if (bobEstado.env > 0.001 || objetivo) {
        bobEstado.env += (objetivo - bobEstado.env) * 0.05
        if (bobEstado.env < 0.001) bobEstado.env = 0
        if ((bobEstado.n++ & 1) === 0) sucio = true
      }
      bob = 0.0025 * bobEstado.env * Math.sin((performance.now() / 1000) * ((Math.PI * 2) / 6.5))
    }
    if (!sucio) return
    sucio = false
    aplicar(S)
    medir()
    colocarCamara()
    girarTapa()
    raiz.position.y = bob
    raiz.updateMatrixWorld(true)
    // Luz de entorno extra en la vista de explosión completa (interiores legibles).
    scene.environmentIntensity = tema.env * (1 + 0.45 * S.lum)
    luz.intensity = 1.1 + 0.5 * S.lum
    relleno.intensity = 0.35 + 0.4 * S.lum
    // Brillo de la pantalla: delante de ella, sobre la cubierta.
    cajas.get('pantalla')!.getCenter(brilloPantalla.position)
    brilloPantalla.position.addScaledVector(normalPantalla, 0.3)
    brilloPantalla.position.y += bob
    brilloPantalla.intensity = 0.006 * pant.brillo * (1 - 0.5 * S.lum)
    sombras.actualizar(cajas, desp, caja.min.y, bob, tema.sombra)
    camera.updateMatrixWorld()
    if (actualizarEtiquetas(bob, reduce)) sucio = true
    renderer.render(scene, camera)
    if (movil) {
      // Si los fotogramas seguidos tardan demasiado (GPU modesta), baja la resolución un escalón (1,5 -> 1,25 -> 1).
      const ahora = performance.now()
      if (renderPrev && ahora - renderPrev < 120 && ahora - t0 > 3000) {
        tMuestra += ahora - renderPrev
        if (++nMuestra === 45) {
          if (tMuestra / nMuestra > 27 && PR > 1) {
            PR = PR > 1.25 ? 1.25 : 1
            renderer.setPixelRatio(PR)
            renderer.getDrawingBufferSize(resolucion)
            for (const m of bordes.values()) m.resolution.copy(resolucion)
            pintar()
          }
          tMuestra = 0
          nMuestra = 0
        }
      }
      renderPrev = ahora
    }
  }
  gsap.ticker.add(dibujar)

  if (reduce) {
    // Pose estática: vista con todo desarmado (la de trayectoria).
    Object.assign(S, estados[PASOS.length - 2], { fw: 0 })
    aplicar(S)
  } else {
    gsap.registerPlugin(ScrollTrigger)
    // Móvil: giro con un dedo en el hero (horizontal, ±35°, vuelve solo al soltar).
    const heroVentana = document.querySelector<HTMLElement>('.ventana-hero')
    if (heroVentana)
      girable(
        heroVentana,
        (g) => {
          gsap.killTweensOf(drag)
          gsap.to(drag, { az: g, duration: 0.12, ease: 'none', overwrite: true, onUpdate: pedir })
        },
        () => {
          gsap.killTweensOf(drag)
          gsap.to(drag, { az: 0, duration: 0.9, ease: 'elastic.out(1, 0.6)', onUpdate: pedir })
        },
      )
    window.addEventListener('pointermove', (ev) => {
      if (movil) return
      mouse.x = (ev.clientX / window.innerWidth) * 2 - 1
      mouse.y = (ev.clientY / window.innerHeight) * 2 - 1
    })

    // Lenis + ScrollTrigger (en táctil se deja el scroll nativo: sin Lenis, ScrollTrigger escucha el scroll del navegador)
    const tactil = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    const lenis = tactil ? null : new Lenis({ autoRaf: false })
    if (tactil) ScrollTrigger.config({ ignoreMobileResize: true })
    lenis?.on('scroll', ScrollTrigger.update)
    if (lenis) gsap.ticker.add((t) => lenis.raf(t * 1000))
    // nicOS (overlay) bloquea el scroll de la página mientras está abierto.
    window.addEventListener('nicos:open', () => lenis?.stop())
    window.addEventListener('nicos:close', () => lenis?.start())
    if (lenis && document.documentElement.classList.contains('nicos-abierto')) lenis.stop()
    gsap.ticker.lagSmoothing(0)
    const cabecera = document.querySelector<HTMLElement>('header.top')
    if (lenis) document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (ev) => {
        const id = a.getAttribute('href')!.slice(1)
        const dest = id ? document.getElementById(id) : null
        if (!dest) return
        ev.preventDefault()
        const sm = parseFloat(getComputedStyle(dest).scrollMarginTop || '0')
        const off = id === 'inicio' ? 0 : sm ? -sm : -((cabecera?.offsetHeight ?? 56) + 16)
        lenis.scrollTo(dest, { offset: off })
        history.pushState(null, '', '#' + id)
      })
    })

    // Móvil: la transición hacia una sección acaba cuando su hueco queda centrado y empieza antes (hasta 1,2 pantallas, como mucho
    // el 60 % del recorrido desde el hueco anterior), así la pose coincide con la del hueco que se está viendo.
    const finMovil = (i: number) => {
      const H = window.innerHeight
      return Math.max(1, Math.min(ventanas.centro(PASOS[i].id, cabH, H), ventanas.maxScroll))
    }
    const inicioMovil = (i: number) => {
      const fin = finMovil(i)
      const H = window.innerHeight
      const previo = Math.max(0, Math.min(ventanas.centro(PASOS[i - 1].id, cabH, H), fin - 1))
      return Math.max(0, fin - Math.min(0.6 * (fin - previo), 1.2 * H), previo)
    }
    ScrollTrigger.addEventListener('refreshInit', () => {
      if (movil) ventanas.medir()
    })
    // Tras recalcular (los huecos se abren y cambian las posiciones) ScrollTrigger puede dejar S en el estado "desde" de la última
    // transición; se reescribe según el scroll actual para que no haya saltos de pose.
    const disparadores: ScrollTrigger[] = []
    const reparar = () => {
      if (!movil) return
      const y = window.scrollY
      Object.assign(S, estados[0])
      for (let i = 1; i < PASOS.length; i++) {
        const st = disparadores[i - 1]
        if (!st) break
        const p = Math.min(1, Math.max(0, (y - st.start) / Math.max(1, st.end - st.start)))
        if (p <= 0) break
        for (const k of Object.keys(estados[i])) S[k] = estados[i - 1][k] + (estados[i][k] - estados[i - 1][k]) * p
      }
      pedir()
    }
    ScrollTrigger.addEventListener('refresh', reparar)
    if (movil) ventanas.medir()
    // Una transición por sección, de su estado anterior al suyo, atada al scroll (reversible).
    for (let i = 1; i < PASOS.length; i++) {
      const sec = document.getElementById(PASOS[i].id)
      if (!sec) continue
      gsap.fromTo(S, { ...estados[i - 1] }, {
        ...estados[i],
        ease: 'none',
        immediateRender: false,
        onUpdate: pedir,
        scrollTrigger: {
          trigger: sec,
          start: () => (mqMovil.matches ? inicioMovil(i) : 'top 75%'),
          end: () => (mqMovil.matches ? finMovil(i) : 'top 25%'),
          scrub: 0.8,
        },
      })
    }
    for (const st of ScrollTrigger.getAll()) disparadores.push(st)
    ScrollTrigger.refresh()
  }

  document.addEventListener('visibilitychange', pedir)
  // Intro: solo si la persona sigue en el inicio. La tapa arranca casi cerrada y la pantalla apagada.
  const hacerIntro = !reduce && stage.dataset.active === piezaHero && window.scrollY < window.innerHeight * 0.4
  if (hacerIntro) {
    lid.a = LID_CERRANDO
    pant.brillo = 0
  } else {
    pi.completar()
  }
  tickPantalla?.(gsap.ticker.time)
  ajustar()
  document.body.appendChild(canvas)
  pedir()
  dibujar()
  // Fundido: aparece el canvas y se oculta el SVG.
  requestAnimationFrame(() => {
    stage.classList.add('is3d')
    canvas.classList.add('is3d')
    document.documentElement.classList.add('v3d') // antes de abrir huecos: desactiva el anclaje de scroll del navegador
    if (movil) {
      ventanas.abrir()
      pedirRefresco()
    }
  })
  if (hacerIntro) {
    gsap.set(canvas, { y: 26, scale: 0.97 })
    // En pausa hasta pintar un par de fotogramas con la tapa cerrada: así la compilación de shaders no se come el arranque.
    const intro = gsap
      .timeline({ paused: true, onUpdate: pedir, onComplete: () => (introHecha = true) })
      .to(canvas, { y: 0, scale: 1, duration: 1.5, ease: 'power2.out', clearProps: 'transform' }, 0)
      .to(lid, { a: LID_ABIERTA, duration: 1.25, ease: 'back.out(1.15)' }, 0.1)
      .to(pant, { brillo: 1, duration: 0.6, ease: 'power1.inOut' }, 1.0)
      .call(() => pi.empezar(gsap.ticker.time), [], 1.6)
    requestAnimationFrame(() => requestAnimationFrame(() => intro.play(0)))
  }
}
