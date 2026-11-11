// Sombras de contacto baratas: planos en el suelo con una textura de rectángulo difuminado (se pinta una vez).
// Cada pieza proyecta una mancha según su caja: se debilita con la altura sobre el suelo y las piezas que están
// en su sitio (dentro del chasis) no suman nada. El chasis añade una capa más cerrada para "anclar" el portátil.
import * as THREE from 'three'

function textura(tam: number, margen: number, difuminado: number): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = tam
  const x = c.getContext('2d')!
  // Rectángulo redondeado difuminado calculado con su distancia con signo (sin ctx.filter, que Safari no soporta).
  const img = x.createImageData(tam, tam)
  const mitad = tam / 2 - margen
  const r = Math.max(4, difuminado * 0.5)
  for (let j = 0; j < tam; j++) {
    for (let i = 0; i < tam; i++) {
      const qx = Math.abs(i + 0.5 - tam / 2) - (mitad - r)
      const qy = Math.abs(j + 0.5 - tam / 2) - (mitad - r)
      const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
      const t = Math.min(1, Math.max(0, (d + difuminado) / (2 * difuminado)))
      const a = 1 - t * t * (3 - 2 * t)
      const k = (j * tam + i) * 4
      img.data[k + 3] = Math.round(255 * Math.pow(a, 1.5))
    }
  }
  x.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

interface Mancha {
  malla: THREE.Mesh
  mat: THREE.MeshBasicMaterial
}

export interface Sombras {
  /** cajas: caja de cada pieza (pose abierta, sin flotación); desp: cuánto se ha movido cada una de su sitio (m). */
  actualizar(cajas: Map<string, THREE.Box3>, desp: Map<string, number>, suelo: number, flota: number, fuerza: number): void
}

const BASE: Record<string, number> = { chasis: 0.8, tapa: 0.22, pantalla: 0.22 }

export function crearSombras(scene: THREE.Scene, nombres: string[]): Sombras {
  const suave = textura(256, 54, 24)
  const cerrada = textura(256, 18, 9)
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  const nueva = (tex: THREE.Texture, orden: number): Mancha => {
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false })
    const malla = new THREE.Mesh(geo, mat)
    malla.renderOrder = orden
    malla.frustumCulled = false
    malla.visible = false
    scene.add(malla)
    return { malla, mat }
  }
  const suaves = new Map<string, Mancha>(nombres.map((n) => [n, nueva(suave, -3)]))
  const contacto = nueva(cerrada, -2)
  const ctr = new THREE.Vector3()
  const tam = new THREE.Vector3()

  const poner = (m: Mancha, caja: THREE.Box3, y: number, escala: number, extra: number, op: number) => {
    caja.getCenter(ctr)
    caja.getSize(tam)
    m.malla.position.set(ctr.x, y, ctr.z)
    m.malla.scale.set(tam.x * escala + extra, 1, tam.z * escala + extra)
    m.mat.opacity = Math.min(1, op)
    m.malla.visible = op > 0.004
  }

  return {
    actualizar(cajas, desp, suelo, flota, fuerza) {
      const y = suelo - 0.0004
      for (const [n, m] of suaves) {
        const caja = cajas.get(n)
        if (!caja) continue
        const hueco = Math.max(0, caja.min.y - suelo + flota)
        // Las piezas encajadas no proyectan (su sombra la da el chasis); al separarse aparece la suya.
        const peso = n === 'chasis' || n === 'tapa' || n === 'pantalla' ? 1 : Math.min(1, (desp.get(n) ?? 0) / 0.06)
        const op = (BASE[n] ?? 0.34) * peso * Math.exp(-hueco * 8) * fuerza
        poner(m, caja, y, 1, n === 'chasis' ? 0.2 : 0.1, op)
        if (n === 'chasis') poner(contacto, caja, y + 0.0001, 1, 0.035, 0.85 * Math.exp(-hueco * 14) * fuerza)
      }
    },
  }
}
