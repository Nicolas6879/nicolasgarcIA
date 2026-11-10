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
  root.setAttribute('data-theme', nuevo)
  try {
    localStorage.setItem('tema', nuevo)
  } catch {
    /* sin almacenamiento */
  }
})

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

// Pieza activa y enlace actual
const stage = document.getElementById('stage')
const links = new Map<string, HTMLAnchorElement>()
document.querySelectorAll<HTMLAnchorElement>('header nav a').forEach((a) => links.set(a.getAttribute('href')!.slice(1), a))
if (hayIO) {
  const so = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue
        const s = en.target as HTMLElement
        if (stage && s.dataset.pieza) stage.dataset.active = s.dataset.pieza
        links.forEach((a, id) => (id === s.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')))
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  document.querySelectorAll('main section[data-pieza]').forEach((s) => so.observe(s))
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
