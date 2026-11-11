// Carga compartida del modelo del portátil (sitio y página de desarrollo).
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import explodeJson from '../data/explode.json'

export interface Pieza {
  nombre: string
  nodo: THREE.Object3D
  reposo: THREE.Vector3
  /** Desplazamiento máximo (three, Y arriba, metros). */
  offset: THREE.Vector3
  /** Materiales clonados de esta pieza, con su emisivo original. */
  mats: { m: THREE.MeshStandardMaterial; emisivo: THREE.Color }[]
}

export async function cargarLaptop(url: string): Promise<{ raiz: THREE.Group; piezas: Pieza[] }> {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url)
  const datos = explodeJson as unknown as Record<string, number[]>
  const piezas: Pieza[] = []
  for (const nodo of gltf.scene.children) {
    const o = datos[nodo.name] ?? [0, 0, 0]
    const mats: Pieza['mats'] = []
    const clones = new Map<THREE.Material, THREE.MeshStandardMaterial>()
    nodo.traverse((x) => {
      const mesh = x as THREE.Mesh
      if (!mesh.isMesh) return
      const orig = mesh.material as THREE.MeshStandardMaterial
      let m = clones.get(orig)
      if (!m) {
        m = orig.clone()
        // El aluminio del GLB trae un tinte azulado: lo llevamos a gris neutro.
        if (orig.name === 'aluminio') {
          const g = (m.color.r + m.color.g + m.color.b) / 3
          m.color.setRGB(g, g, g)
          // Cepillado: más metal y reflejos más nítidos en la tapa que en la cubierta/chasis.
          m.metalness = 0.92
          m.roughness = nodo.name === 'tapa' ? 0.3 : 0.4
        } else if (orig.name === 'grafito') {
          if (nodo.name === 'teclado') {
            // Las teclas cogen un poco de luz: algo más claras y satinadas (el grafito del bisel sigue oscuro).
            m.color.set('#2e374b')
            m.roughness = 0.36
            m.metalness = 0.12
          } else {
            m.roughness = 0.38
          }
        }
        clones.set(orig, m)
        mats.push({ m, emisivo: m.emissive.clone() })
      }
      mesh.material = m
    })
    piezas.push({ nombre: nodo.name, nodo, reposo: nodo.position.clone(), offset: new THREE.Vector3(o[0], o[1], o[2]), mats })
  }
  return { raiz: gltf.scene, piezas }
}
