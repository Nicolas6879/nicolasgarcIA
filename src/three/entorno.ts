// Entorno de estudio para los reflejos del metal: un cuarto gris medio con paneles de luz (softboxes) y un
// contraluz cálido. Se hornea una sola vez con PMREM; así el aluminio muestra degradados en vez de un blanco plano.
import * as THREE from 'three'

export function crearEntorno(renderer: THREE.WebGLRenderer): THREE.Texture {
  const s = new THREE.Scene()
  const sala = new THREE.Mesh(new THREE.BoxGeometry(14, 9, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3a4150), side: THREE.BackSide }))
  s.add(sala)
  const panel = (w: number, h: number, x: number, y: number, z: number, color: number, k: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }))
    m.position.set(x, y, z)
    m.lookAt(0, 0, 0)
    s.add(m)
  }
  panel(6, 3, 0.5, 4.2, 0.5, 0xffffff, 2.6) // techo: degradado largo sobre la cubierta
  panel(3.5, 3, -5, 2.2, 4, 0xfff4e8, 4.2) // luz principal, delante a la izquierda
  panel(1.2, 5, 6, 1.5, 1.5, 0xaac4ff, 2.8) // tira fría a la derecha
  panel(9, 3, 0, 3.2, -6.2, 0xf2f5fa, 2.4) // fondo alto y ancho: lo que refleja la cubierta (degradado blanco -> gris)
  panel(1.2, 4, 7, 1.4, -2.5, 0xff7a45, 0.9) // contraluz cálido (acento), rasante a la derecha
  panel(1.2, 4, -6, 1.5, -3, 0xffffff, 2) // contraluz neutro
  panel(9, 9, 0, -3.6, 0, 0x8a93a3, 0.7) // rebote del suelo
  const pmrem = new THREE.PMREMGenerator(renderer)
  const tex = pmrem.fromScene(s, 0.035).texture
  pmrem.dispose()
  s.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh) {
      m.geometry.dispose()
      ;(m.material as THREE.Material).dispose()
    }
  })
  return tex
}
