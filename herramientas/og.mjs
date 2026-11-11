// Genera public/og.png (1200x630) capturando herramientas/og.html con Edge headless y comprimiendo con sharp.
// Uso: node herramientas/og.mjs   (EDGE=<ruta> si Edge no está en la ruta por defecto)
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
const sharp = (await import('sharp')).default
const edge = process.env.EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const tmp = resolve(process.env.TEMP ?? '.', 'og-raw.png')
rmSync(tmp, { force: true })
execFileSync(edge, [
  '--headless=new', '--user-data-dir=' + resolve(process.env.TEMP ?? '.', 'og-prof' + Date.now()), '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--window-size=1200,630', '--virtual-time-budget=4000', `--screenshot=${tmp}`,
  pathToFileURL(resolve(import.meta.dirname, 'og.html')).href,
], { stdio: 'ignore', timeout: 60000 })
for (let k = 0; k < 60 && !existsSync(tmp); k++) await new Promise((r) => setTimeout(r, 250))
await new Promise((r) => setTimeout(r, 500))
const out = await sharp(readFileSync(tmp)).resize(1200, 630).png({ compressionLevel: 9, effort: 10 }).toBuffer()
writeFileSync(resolve(import.meta.dirname, '../public/og.png'), out)
rmSync(tmp)
console.log('public/og.png', out.length, 'bytes')
