// Portátil 3D que se desarma con el scroll. Se carga con import() dinámico desde main.ts.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { cargarLaptop, type Pieza } from './cargador'

const SIN_RESALTE = new Set(['tapa', 'chasis']) // inicio y contacto muestran el portátil entero
const MARGEN_PIEZA = 1.4
const FOV = 35
const DIR = new THREE.Vector3(-0.55, 0.6, 0.85).normalize() // dirección de la cámara (3/4)

type Estado = Record<string, number>
interface Paso {
  id: string
  /** Piezas que se separan en esta sección (e = 1). */
  separa: string[]
  /** Piezas que se enfocan; vacío = todo el portátil. */
  foco: string[]
  /** Vuelve a armar todo. */
  arma?: boolean
}

// Orden y reglas de desarme (acumulativo; contacto rearma).
const PASOS: Paso[] = [
  { id: 'inicio', separa: [], foco: [] },
  { id: 'sistemas', separa: ['tapa', 'pantalla'], foco: ['tapa', 'pantalla'] },
  { id: 'tecnologias', separa: ['teclado', 'placa'], foco: ['placa'] },
  { id: 'ia', separa: ['cpu'], foco: ['cpu'] },
  { id: 'comunidad', separa: ['antena'], foco: ['antena'] },
  { id: 'proyectos', separa: ['bateria'], foco: ['bateria'] },
  { id: 'ensenanza', separa: [], foco: ['teclado'] },
  { id: 'trayectoria', separa: ['disco'], foco: ['disco'] },
  { id: 'contacto', separa: [], foco: [], arma: true },
]

interface Encuadre {
  c: THREE.Vector3
  r: number
}

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
  const e: Estado = {}
  for (const p of piezas) e[p.nombre] = 0
  const cam = { x: 0, y: 0, z: 0, r: 1 }
  let sucio = true
  const pedir = () => {
    sucio = true
  }

  const aplicar = (est: Estado) => {
    for (const p of piezas) p.nodo.position.copy(p.reposo).addScaledVector(p.offset, est[p.nombre] ?? 0)
    raiz.updateMatrixWorld(true)
  }
  const encuadrar = (nombres: string[]): Encuadre => {
    const box = new THREE.Box3()
    const lista = nombres.length ? nombres.map((n) => porNombre.get(n)!.nodo) : piezas.map((p) => p.nodo)
    for (const n of lista) box.expandByObject(n)
    const s = box.getBoundingSphere(new THREE.Sphere())
    return { c: s.center.clone(), r: Math.max(s.radius, 0.1) * (nombres.length ? MARGEN_PIEZA : 1) }
  }

  // Estados acumulados y encuadres por sección (calculados con las posiciones reales).
  const estados: Estado[] = []
  const encuadres: Encuadre[] = []
  {
    let actual: Estado = { ...e }
    for (const paso of PASOS) {
      actual = { ...actual }
      if (paso.arma) for (const k in actual) actual[k] = 0
      for (const n of paso.separa) actual[n] = 1
      aplicar(actual)
      estados.push(actual)
      encuadres.push(encuadrar(paso.foco))
    }
    aplicar(e)
  }
  const setCam = (q: Encuadre) => {
    cam.x = q.c.x
    cam.y = q.c.y
    cam.z = q.c.z
    cam.r = q.r
  }

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

  // ---- Cámara: distancia que encuadra la esfera sin cortarla ----
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 }
  const tmp = new THREE.Vector3()
  const dir = new THREE.Vector3()
  const euler = new THREE.Euler()
  const colocarCamara = () => {
    // Semiángulos útiles: solo la zona del escenario (no todo el viewport) debe contener la esfera.
    const tv = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const vHalf = Math.atan((tv * zonaH) / alto)
    const hHalf = Math.atan((tv * zonaW) / alto)
    const dist = (cam.r * 1.25) / Math.sin(Math.min(vHalf, hHalf))
    // Giro suave según el ratón (pocos grados).
    euler.set(mouse.sy * 0.05, -mouse.sx * 0.1, 0)
    dir.copy(DIR).applyEuler(euler)
    tmp.set(cam.x, cam.y, cam.z)
    camera.position.copy(tmp).addScaledVector(dir, dist)
    camera.lookAt(tmp)
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
    aplicar(e)
    colocarCamara()
    renderer.render(scene, camera)
  }
  gsap.ticker.add(dibujar)

  if (reduce) {
    // Pose estática: todo desarmado y encuadrado.
    for (const p of piezas) e[p.nombre] = 1
    aplicar(e)
    setCam(encuadrar([]))
  } else {
    setCam(encuadres[0])
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

    // Una transición por sección: de su estado anterior al suyo, atada al scroll.
    for (let i = 1; i < PASOS.length; i++) {
      const sec = document.getElementById(PASOS[i].id)
      if (!sec) continue
      const previo = estados[i - 1]
      const nuevo = estados[i]
      const desde: Estado = {}
      const hasta: Estado = {}
      for (const k in nuevo) {
        if (previo[k] !== nuevo[k]) {
          desde[k] = previo[k]
          hasta[k] = nuevo[k]
        }
      }
      const st = { trigger: sec, start: 'top 75%', end: 'top 25%' }
      if (Object.keys(desde).length) gsap.fromTo(e, desde, { ...hasta, ease: 'none', immediateRender: false, onUpdate: pedir, scrollTrigger: { ...st, scrub: 0.6 } })
      const a = encuadres[i - 1]
      const b = encuadres[i]
      gsap.fromTo(
        cam,
        { x: a.c.x, y: a.c.y, z: a.c.z, r: a.r },
        { x: b.c.x, y: b.c.y, z: b.c.z, r: b.r, ease: 'none', immediateRender: false, onUpdate: pedir, scrollTrigger: { ...st, scrub: 0.8 } },
      )
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
