// Pipeline del modelo: laptop.py -> laptop.blend -> exportar.py -> laptop-raw.glb -> gltf-transform -> laptop.glb
// Uso: npm run modelo   (opcional: BLENDER_EXE=ruta\blender.exe; SALTAR_BLENDER=1 para solo comprimir)
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const raiz = resolve(import.meta.dirname, '..')
const blender = process.env.BLENDER_EXE ?? 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe'
const raw = join(raiz, 'public', 'models', 'laptop-raw.glb')
const final = join(raiz, 'public', 'models', 'laptop.glb')
const gt = join(raiz, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js')

const correr = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', cwd: raiz })

if (!process.env.SALTAR_BLENDER) {
  for (const py of ['laptop.py', 'exportar.py']) {
    correr(blender, ['--background', '--factory-startup', '--python', join(raiz, 'blender', py)])
  }
}

const tmp = mkdtempSync(join(tmpdir(), 'modelo-'))
try {
  const pasos = ['dedup', 'weld', 'prune', 'quantize']
  let entrada = raw
  pasos.forEach((p, i) => {
    const salida = join(tmp, `${i}.glb`)
    correr('node', [gt, p, entrada, salida])
    entrada = salida
  })
  // Compresion Meshopt (sin simplificar la malla)
  correr('node', [gt, 'meshopt', entrada, final, '--level', 'high'])
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
console.log(`laptop-raw.glb: ${statSync(raw).size} bytes -> laptop.glb: ${statSync(final).size} bytes`)
correr('node', [join(raiz, 'blender', 'verificar.mjs')])
