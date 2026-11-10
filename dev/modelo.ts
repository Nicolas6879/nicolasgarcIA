// Pagina de verificacion del modelo (solo desarrollo, no entra al build).
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const info = document.getElementById('info') as HTMLPreElement
const boton = document.getElementById('toggle') as HTMLButtonElement

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color('#161B26')
scene.add(new THREE.HemisphereLight(0xdde4f0, 0x2a3140, 1.6))
const sol = new THREE.DirectionalLight(0xffffff, 2.2)
sol.position.set(-0.6, 1, 0.8)
scene.add(sol)
const rim = new THREE.DirectionalLight(0x9fb4ff, 1.0)
rim.position.set(0.5, 0.6, -1)
scene.add(rim)

const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 20)
camera.position.set(-0.7, 0.6, 0.9)
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0.15, 0)
controls.enableDamping = true

function resize() {
  renderer.setSize(innerWidth, innerHeight)
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()

interface Pieza {
  nodo: THREE.Object3D
  reposo: THREE.Vector3
  offset: THREE.Vector3
}
const piezas: Pieza[] = []
let desarmado = false
let t = 0 // 0 = armado, 1 = desarmado

const inicio = performance.now()
new GLTFLoader()
  .setMeshoptDecoder(MeshoptDecoder)
  .loadAsync('/models/laptop.glb')
  .then((gltf) => {
    const ms = Math.round(performance.now() - inicio)
    scene.add(gltf.scene)
    let tris = 0
    const nombres: string[] = []
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        const g = mesh.geometry
        tris += (g.index ? g.index.count : g.attributes.position.count) / 3
      }
    })
    for (const nodo of gltf.scene.children) {
      nombres.push(nodo.name)
      // userData.explode viene en coordenadas Blender (Z arriba): three = (x, z, -y)
      const e = (nodo.userData.explode ?? [0, 0, 0]) as number[]
      piezas.push({ nodo, reposo: nodo.position.clone(), offset: new THREE.Vector3(e[0], e[2], -e[1]) })
    }
    info.textContent = `nodos (${nombres.length}): ${nombres.join(', ')}\ntriangulos: ${tris}\ncarga: ${ms} ms`
  })
  .catch((err) => {
    info.textContent = 'ERROR: ' + String(err)
    console.error(err)
  })

boton.addEventListener('click', () => {
  desarmado = !desarmado
  boton.textContent = desarmado ? 'Armar' : 'Desarmar'
})

renderer.setAnimationLoop(() => {
  t += ((desarmado ? 1 : 0) - t) * 0.08
  for (const p of piezas) p.nodo.position.copy(p.reposo).addScaledVector(p.offset, t)
  controls.update()
  renderer.render(scene, camera)
})
