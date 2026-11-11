import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/jetbrains-mono'
import './styles/main.css'

const root = document.documentElement
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const hayIO = 'IntersectionObserver' in window

// Tema
document.getElementById('tema')?.addEventListener('click', () => {
  const actual =
    root.getAttribute('data-theme') ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  const nuevo = actual === 'light' ? 'dark' : 'light'
  if (!reduce) {
    root.classList.add('tema-anim')
    setTimeout(() => root.classList.remove('tema-anim'), 350)
  }
  root.setAttribute('data-theme', nuevo)
  try {
    localStorage.setItem('tema', nuevo)
  } catch {
    /* sin almacenamiento */
  }
})

// nicOS: terminal (Ctrl/Cmd + K), escritorio y mini-terminal de contacto. Todo en un chunk perezoso.
type Nicos = typeof import('./nicos/escritorio')
let nicos: Promise<Nicos> | null = null
const cargarNicos = () => (nicos ??= import('./nicos/escritorio').catch((err) => ((nicos = null), Promise.reject(err))))
// Mientras carga el chunk, lo que se escriba se guarda y luego se pasa al input de la terminal.
let tecleado: string | null = null
let enviar = false
const guardarTecla = (ev: KeyboardEvent) => {
  if (tecleado === null || ev.ctrlKey || ev.metaKey || ev.altKey) return
  if (ev.key.length === 1) tecleado += ev.key
  else if (ev.key === 'Backspace') tecleado = tecleado.slice(0, -1)
  else if (ev.key === 'Enter') enviar = true
  else return
  ev.preventDefault()
}
window.addEventListener('keydown', guardarTecla, true)
const abrirNicos = (v: 'terminal' | 'leeme') => {
  if (v === 'terminal') tecleado ??= ''
  void cargarNicos()
    .then((m) => {
      m.abrir(v)
      const input = document.querySelector<HTMLInputElement>('.nicos .nx-w-terminal input')
      if (input && tecleado) {
        input.value += tecleado
        input.dispatchEvent(new Event('input', { bubbles: true }))
        if (enviar) input.form?.requestSubmit()
      }
    })
    .catch(() => {})
    .finally(() => {
      tecleado = null
      enviar = false
    })
}
const btnNicos = document.getElementById('nicos-abrir')
const mac = /Mac|iPhone|iPad/.test(navigator.platform)
if (mac) document.querySelectorAll('.nicos-btn kbd, .foot kbd').forEach((k) => (k.textContent = '⌘K'))
btnNicos?.addEventListener('click', () => abrirNicos('terminal'))
btnNicos?.addEventListener('pointerenter', () => void cargarNicos().catch(() => {}), { once: true })
const encender = document.getElementById('nicos-encender')
encender?.addEventListener('click', () => abrirNicos('leeme'))
encender?.addEventListener('pointerenter', () => void cargarNicos().catch(() => {}), { once: true })
window.addEventListener('keydown', (ev) => {
  if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && ev.key.toLowerCase() === 'k') {
    ev.preventDefault()
    abrirNicos('terminal')
  }
})
const mini = document.getElementById('mini-term')
if (mini) {
  const montar = () => void cargarNicos().then((m) => m.montarMini(mini)).catch(() => {})
  if (!hayIO) montar()
  else {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((en) => en.isIntersecting)) return
        io.disconnect()
        montar()
      },
      { rootMargin: '900px 0px' },
    )
    io.observe(mini)
  }
}

// Entrada suave
const rv = document.querySelectorAll<HTMLElement>('.rv')
if (reduce || !hayIO) {
  rv.forEach((el) => el.classList.add('in'))
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add('in')
          io.unobserve(en.target)
        }
      }
    },
    { threshold: 0.1 },
  )
  rv.forEach((el) => io.observe(el))
}

// Pieza activa y enlace actual (cabecera de escritorio y tira de secciones en móvil)
const stage = document.getElementById('stage')
const links = new Map<string, HTMLAnchorElement[]>()
document.querySelectorAll<HTMLAnchorElement>('header nav a').forEach((a) => {
  const id = a.getAttribute('href')!.slice(1)
  links.set(id, [...(links.get(id) ?? []), a])
})
const tira = document.querySelector<HTMLElement>('.subnav-in')
function centrarEnlace(a: HTMLElement) {
  if (!tira || tira.scrollWidth <= tira.clientWidth) return
  const izq = a.offsetLeft - (tira.clientWidth - a.offsetWidth) / 2
  tira.scrollTo({ left: izq, behavior: reduce ? 'auto' : 'smooth' })
}
if (hayIO) {
  const so = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue
        const s = en.target as HTMLElement
        if (stage && s.dataset.pieza) stage.dataset.active = s.dataset.pieza
        links.forEach((as, id) =>
          as.forEach((a) => {
            if (id === s.id) {
              a.setAttribute('aria-current', 'true')
              if (a.closest('.subnav-in')) centrarEnlace(a)
            } else a.removeAttribute('aria-current')
          }),
        )
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  document.querySelectorAll('main section[data-pieza]').forEach((s) => so.observe(s))
}

// El botón de CV de la cabecera se rellena (y en móvil aparece el circular) cuando el del héroe sale de la vista;
// el circular se esconde mientras se ve contacto o el pie.
const ctaCv = document.querySelector('.cta-cv')
if (ctaCv && hayIO) {
  new IntersectionObserver(
    ([en]) => root.classList.toggle('cta-out', !en.isIntersecting && en.boundingClientRect.top < 0),
    { rootMargin: '-' + (parseInt(getComputedStyle(root).getPropertyValue('--header-h')) || 56) + 'px 0px 0px 0px' },
  ).observe(ctaCv)
  const fin = new Set<Element>()
  const fo = new IntersectionObserver(
    (entries) => {
      for (const en of entries) (en.isIntersecting ? fin.add(en.target) : fin.delete(en.target))
      root.classList.toggle('fab-off', fin.size > 0)
    },
    { rootMargin: '0px 0px -15% 0px' },
  )
  document.querySelectorAll('#contacto, .foot').forEach((el) => fo.observe(el))
}

// Progreso de lectura: barra de 2 px en el borde inferior de la cabecera (rAF, listener pasivo)
const barra = document.getElementById('progreso')
if (barra) {
  let pendiente = false
  const pintar = () => {
    pendiente = false
    const max = document.documentElement.scrollHeight - window.innerHeight
    barra.style.setProperty('--p', max > 0 ? String(Math.min(1, Math.max(0, window.scrollY / max))) : '0')
  }
  const pedir = () => {
    if (!pendiente) {
      pendiente = true
      requestAnimationFrame(pintar)
    }
  }
  window.addEventListener('scroll', pedir, { passive: true })
  window.addEventListener('resize', pedir, { passive: true })
  pintar()
}

// Portátil 3D: solo con escenario visible (>= 860px) y WebGL; después del primer pintado.
// Three, GSAP y Lenis viven en un chunk aparte; mientras tanto (o sin WebGL) queda el SVG.
function hayWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}
const anchoMin = window.matchMedia('(min-width: 860px)')
let tresD = false
function cargar3D() {
  if (tresD || !stage || !anchoMin.matches || !hayWebGL()) return
  tresD = true
  const lanzar = () => import('./three/escena').then((m) => m.iniciar(stage, { reduce })).catch(() => { tresD = false })
  if ('requestIdleCallback' in window) requestIdleCallback(() => void lanzar(), { timeout: 2000 })
  else setTimeout(() => void lanzar(), 200)
}
// La escena (compilar shaders, textura, WebGL) es trabajo pesado que no hace falta para leer: arranca con la primera
// interacción (mover, tocar, teclear, desplazarse) o, si la persona solo mira, a los 8 s de cargar. Mientras, el SVG.
let armado = false
function armar3D() {
  if (armado || tresD || !stage || !anchoMin.matches) return
  armado = true
  const ev = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart'] as const
  let t = 0
  const lanzar = () => {
    ev.forEach((e) => window.removeEventListener(e, lanzar))
    clearTimeout(t)
    armado = false
    cargar3D()
  }
  ev.forEach((e) => window.addEventListener(e, lanzar, { passive: true, once: true }))
  t = window.setTimeout(lanzar, 8000)
}
if (document.readyState === 'complete') armar3D()
else window.addEventListener('load', armar3D, { once: true })
anchoMin.addEventListener('change', () => document.readyState === 'complete' && armar3D())

// Efecto captura -> código: el módulo (canvas 2D, sin dependencias) se descarga cuando la primera tarjeta se acerca
const tarjetas = Array.from(document.querySelectorAll<HTMLElement>('.card[data-fx]'))
if (tarjetas.length) {
  const fallo = () => tarjetas.forEach((t) => t.classList.add('fx-off')) // sin efecto se muestra el <pre> debajo
  if (!hayIO || !('roundRect' in CanvasRenderingContext2D.prototype)) fallo()
  else {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((en) => en.isIntersecting)) return
        io.disconnect()
        import('./efectos/desintegrar').then((m) => m.iniciar(tarjetas, { reduce })).catch(fallo)
      },
      { rootMargin: '600px 0px' },
    )
    tarjetas.forEach((t) => io.observe(t))
  }
}

// Contador 0 -> meta
document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
  const meta = Number(el.dataset.count)
  if (reduce || !hayIO) return
  el.textContent = '0'
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return
    io.disconnect()
    const t0 = performance.now()
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / 1200)
      el.textContent = String(Math.round(meta * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(paso)
    }
    requestAnimationFrame(paso)
  })
  io.observe(el)
})

// Selector de idioma: conserva la sección actual (hash) al cambiar de página
const idioma = document.getElementById('idioma') as HTMLAnchorElement | null
idioma?.addEventListener('click', () => {
  const base = idioma.getAttribute('href')!.split('#')[0]
  idioma.setAttribute('href', base + window.location.hash)
})

// Copiar correo
const btn = document.getElementById('copiar') as HTMLButtonElement | null
const aviso = document.getElementById('copiado')
btn?.addEventListener('click', async () => {
  const valor = btn.dataset.valor ?? ''
  let ok = false
  try {
    await navigator.clipboard.writeText(valor)
    ok = true
  } catch {
    const mail = document.getElementById('correo')
    if (mail) {
      const r = document.createRange()
      r.selectNodeContents(mail)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(r)
      try {
        ok = document.execCommand('copy')
      } catch {
        ok = false
      }
    }
  }
  const prev = btn.textContent
  btn.textContent = (ok ? btn.dataset.ok : btn.dataset.fallo) ?? ''
  if (aviso) aviso.textContent = (ok ? btn.dataset.avisoOk : btn.dataset.avisoFallo) ?? ''
  setTimeout(() => {
    btn.textContent = prev
  }, 2000)
})
