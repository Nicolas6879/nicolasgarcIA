// Lee el JSON del GLB, comprueba nodos/extras/emisivos y escribe src/data/explode.json (Y-up de three.js)
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const raiz = resolve(import.meta.dirname, '..')
const buf = readFileSync(resolve(raiz, 'public/models/laptop.glb'))
const len = buf.readUInt32LE(12)
const gltf = JSON.parse(buf.subarray(20, 20 + len).toString('utf8'))
const blenderJson = JSON.parse(readFileSync(resolve(raiz, 'blender/explode.json'), 'utf8'))
const salida = { _nota: 'Offsets de explosion en coordenadas Y-up de three.js (x, z, -y de Blender), metros. Generado por blender/verificar.mjs' }
let ok = true
for (const n of gltf.nodes) {
  const [x, y, z] = blenderJson[n.name]
  const conv = [x, z, -y].map((v) => v + 0) // +0 evita -0
  salida[n.name] = conv
  const ex = n.extras?.explode
  console.log(n.name, 'extras.explode(blender)=', JSON.stringify(ex), '-> three', JSON.stringify(conv), 'pieza=', n.extras?.pieza)
  if (!ex || Math.abs(ex[0] - x) > 1e-4 || Math.abs(ex[1] - y) > 1e-4 || Math.abs(ex[2] - z) > 1e-4 || n.extras.pieza !== n.name) ok = false
}
for (const m of gltf.materials) console.log('mat', m.name, 'emissive', JSON.stringify(m.emissiveFactor), JSON.stringify(m.extensions?.KHR_materials_emissive_strength), 'base', JSON.stringify(m.pbrMetallicRoughness.baseColorFactor), m.pbrMetallicRoughness.baseColorTexture ? 'tex' : '')
writeFileSync(resolve(raiz, 'src/data/explode.json'), JSON.stringify(salida, null, 2) + '\n')
console.log(ok ? 'EXTRAS OK' : 'EXTRAS MISMATCH')
