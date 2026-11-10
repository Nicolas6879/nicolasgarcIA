// Portátil 3D que se desarma con el scroll. Se carga con import() dinámico desde main.ts.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { cargarLaptop, type Pieza } from './cargador'

const SIN_RESALTE = new Set(['tapa', 'chasis']) // inicio y contacto muestran el portátil entero
const FOV = 35
const MARGEN = 0.86 // fracción del campo visual que puede ocupar el portátil (el resto es margen)
const RAD = Math.PI / 180

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
}

// Una sección = un estado completo (nada es acumulativo; al subir se invierte solo).
const TODO: Record<string, number> = { tapa: 1, pantalla: 1, teclado: 1, placa: 1, cpu: 1, antena: 1, bateria: 1, disco: 1 }
const PASOS: Paso[] = [
  { id: 'inicio', e: {}, az: -33, el: 28, zoom: 1 },
  { id: 'sistemas', e: { pantalla: 2 }, az: -18, el: 20, zoom: 1.1, foco: 'pantalla', fw: 0.25 },
  { id: 'tecnologias', e: { teclado: 0.75, placa: 1 }, az: -28, el: 36, zoom: 1.15, foco: 'placa', fw: 0.3 },
  { id: 'ia', e: { teclado: 0.75, cpu: 0.5 }, az: -25, el: 42, zoom: 1.2, foco: 'cpu', fw: 0.3 },
  { id: 'comunidad', e: { antena: 3 }, az: -55, el: 26, zoom: 1.15, foco: 'antena', fw: 0.3 },
  { id: 'proyectos', e: { teclado: 0.75, bateria: 0.8 }, az: -35, el: 34, zoom: 1.15, foco: 'bateria', fw: 0.3 },
  { id: 'ensenanza', e: { teclado: 0.7 }, tilt: 0.22, az: -30, el: 32, zoom: 1.1, foco: 'teclado', fw: 0.25 },
  { id: 'trayectoria', e: TODO, az: -35, el: 28, zoom: 1, foco: 'disco', fw: 0.1 },
  { id: 'contacto', e: {}, az: -33, el: 28, zoom: 1 },
]

export async function iniciar(stage: HTMLElement, opc: { reduce: boolean }): Promise<void> {
  const { reduce } = opc
  const url = stage.dataset.modelo ?? 'models/laptop.glb'

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.className = 'escena'
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.9
  pmrem.dispose()
  const luz = new THREE.DirectionalLight(0xffffff, 1.4)
  luz.position.set(-0.6, 1, 0.8)
  scene.add(luz)

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 20)

  const { raiz, piezas } = await cargarLaptop(url)
  scene.add(raiz)
  const porNombre = new Map<string, Pieza>(piezas.map((p) => [p.nombre, p]))

  // ---- Estado animable ----
  const claves = piezas.map((p) => p.nombre)
  const S: Estado = { tilt: 0, az: PASOS[0].az, el: PASOS[0].el, zoom: 1, fw: 0, fx: 0, fy: 0, fz: 0 }
  for (const k of claves) S[k] = 0
  let sucio = true
  const pedir = () => {
    sucio = true
  }
  const offT = porNombre.get('tapa')!.offset
  const tmpV = new THREE.Vector3()
  const aplicar = (est: Estado) => {
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
    raiz.updateMatrixWorld(true)
  }
  const centroDe = (n: string): THREE.Vector3 => new THREE.Box3().expandByObject(porNombre.get(n)!.nodo).getCenter(new THREE.Vector3())

  // Un estado completo por sección (con el punto de mira calculado sobre la pose real).
  const estados: Estado[] = PASOS.map((paso) => {
    const est: Estado = { tilt: paso.tilt ?? 0, az: paso.az, el: paso.el, zoom: paso.zoom, fw: paso.foco ? (paso.fw ?? 0) : 0, fx: 0, fy: 0, fz: 0 }
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

  // ---- Resaltado de la pieza activa: aristas en color de acento ----
  const colorAcento = new THREE.Color('#FF7A45')
  const leerAcento = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--acc').trim()
    if (v) colorAcento.set(v)
  }
  const bordes = new Map<string, THREE.LineBasicMaterial>()
  const bordesDe = (p: Pieza): THREE.LineBasicMaterial => {
    let mat = bordes.get(p.nombre)
    if (mat) return mat
    mat = new THREE.LineBasicMaterial({ color: colorAcento, transparent: true, opacity: 0, depthTest: true })
    bordes.set(p.nombre, mat)
    const meshes: THREE.Mesh[] = []
    p.nodo.traverse((x) => {
      if ((x as THREE.Mesh).isMesh) meshes.push(x as THREE.Mesh)
    })
    for (const mesh of meshes) {
      const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30), mat)
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
  const tinte: Record<string, number> = {}
  for (const p of piezas) tinte[p.nombre] = 0
  const pintar = () => {
    for (const p of piezas) {
      const h = tinte[p.nombre]
      if (h === 0 && !bordes.has(p.nombre)) continue
      const mat = bordesDe(p)
      mat.color.copy(colorAcento)
      mat.opacity = 0.9 * h
      mat.visible = h > 0
    }
    pedir()
  }
  const activar = (nombre: string | undefined) => {
    leerAcento()
    for (const p of piezas) {
      const objetivo = p.nombre === nombre && !SIN_RESALTE.has(p.nombre) ? 1 : 0
      gsap.killTweensOf(tinte, p.nombre)
      if (reduce) tinte[p.nombre] = objetivo
      else if (tinte[p.nombre] !== objetivo) gsap.to(tinte, { [p.nombre]: objetivo, duration: 0.3, ease: 'power1.out', onUpdate: pintar })
    }
    pintar()
  }
  activar(stage.dataset.active)
  new MutationObserver(() => activar(stage.dataset.active)).observe(stage, { attributes: true, attributeFilter: ['data-active'] })
  // El tema (claro/oscuro) cambia --acc: se relee al alternarlo.
  new MutationObserver(() => {
    leerAcento()
    pintar()
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    leerAcento()
    pintar()
  })

  // ---- Tamaño: el canvas cubre el viewport; el portátil se centra en la zona del escenario ----
  let ancho = 0
  let alto = 0
  let zonaW = 1
  let zonaH = 1
  const ajustar = () => {
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
    pedir()
  }
  new ResizeObserver(ajustar).observe(stage)
  new ResizeObserver(ajustar).observe(document.documentElement)

  // ---- Cámara: siempre encuadra TODO el portátil en su pose actual ----
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 }
  const caja = new THREE.Box3()
  const centro = new THREE.Vector3()
  const mira = new THREE.Vector3()
  const dir = new THREE.Vector3()
  const der = new THREE.Vector3()
  const arr = new THREE.Vector3()
  const rel = new THREE.Vector3()
  const ARRIBA = new THREE.Vector3(0, 1, 0)
  const colocarCamara = () => {
    caja.makeEmpty()
    for (const p of piezas) caja.expandByObject(p.nodo)
    caja.getCenter(centro)
    // Punto de mira: el centro del conjunto, desplazado hacia la pieza activa.
    mira.set(S.fx, S.fy, S.fz).sub(centro).multiplyScalar(S.fw).add(centro)
    // Dirección de la cámara según azimut/elevación (+ giro suave del ratón).
    const az = S.az * RAD - mouse.sx * 0.1
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
    d = Math.max(d / Math.min(S.zoom, 1.2), 0.2)
    camera.position.copy(mira).addScaledVector(dir, d)
    camera.lookAt(mira)
  }

  // ---- Bucle bajo demanda (el ticker de gsap se detiene con la pestaña oculta) ----
  const dibujar = () => {
    if (document.hidden || !ancho) return
    if (!reduce) {
      const dx = mouse.x - mouse.sx
      const dy = mouse.y - mouse.sy
      if (Math.abs(dx) > 0.0005 || Math.abs(dy) > 0.0005) {
        mouse.sx += dx * 0.06
        mouse.sy += dy * 0.06
        sucio = true
      }
    }
    if (!sucio) return
    sucio = false
    aplicar(S)
    colocarCamara()
    renderer.render(scene, camera)
  }
  gsap.ticker.add(dibujar)

  if (reduce) {
    // Pose estática: vista con todo desarmado (la de trayectoria).
    Object.assign(S, estados[PASOS.length - 2], { fw: 0 })
    aplicar(S)
  } else {
    gsap.registerPlugin(ScrollTrigger)
    window.addEventListener('pointermove', (ev) => {
      mouse.x = (ev.clientX / window.innerWidth) * 2 - 1
      mouse.y = (ev.clientY / window.innerHeight) * 2 - 1
    })

    // Lenis + ScrollTrigger
    const lenis = new Lenis({ autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((t) => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
    const cabecera = document.querySelector<HTMLElement>('header.top')
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (ev) => {
        const id = a.getAttribute('href')!.slice(1)
        const dest = id ? document.getElementById(id) : null
        if (!dest) return
        ev.preventDefault()
        const off = id === 'inicio' ? 0 : -((cabecera?.offsetHeight ?? 56) + 16)
        lenis.scrollTo(dest, { offset: off })
        history.pushState(null, '', '#' + id)
      })
    })

    // Una transición por sección, de su estado anterior al suyo, atada al scroll (reversible).
    for (let i = 1; i < PASOS.length; i++) {
      const sec = document.getElementById(PASOS[i].id)
      if (!sec) continue
      gsap.fromTo(S, { ...estados[i - 1] }, {
        ...estados[i],
        ease: 'none',
        immediateRender: false,
        onUpdate: pedir,
        scrollTrigger: { trigger: sec, start: 'top 75%', end: 'top 25%', scrub: 0.8 },
      })
    }
    ScrollTrigger.refresh()
  }

  document.addEventListener('visibilitychange', pedir)
  ajustar()
  document.body.appendChild(canvas)
  pedir()
  dibujar()
  // Fundido: aparece el canvas y se oculta el SVG.
  requestAnimationFrame(() => {
    stage.classList.add('is3d')
    canvas.classList.add('is3d')
  })
}
