// Datos de nicOS: se generan en el build (render.ts) desde el contenido del idioma de la página y
// se incrustan como JSON en el HTML. Así los módulos perezosos no cargan es.ts ni en.ts.
import type { Contenido, Idioma } from '../content/tipos'

export type VentanaId = 'leeme' | 'proyectos' | 'terminal' | 'correo' | 'cv'

export interface DatosNicos {
  lang: Idioma
  t: Contenido['nicos']
  ui: { copiar: string; copiado: string; copiarFallo: string; demo: string; repositorio: string; pestana: string; correoEtiqueta: string }
  bio: { nombre: string; eyebrow: string; frase: string; ubicacion: string; cifras: { valor: string; texto: string }[]; ensenanzaTitulo: string; ensenanza: string }
  sistemas: { titulo: string; items: { nombre: string; resultado: string }[] }
  proyectos: { titulo: string; items: { nombre: string; texto: string; demo?: string; repo?: string }[] }
  contacto: { texto: string; email: string; linkedin: string; github: string }
  cv: { propio: { href: string; etiqueta: string }; otro: { href: string; etiqueta: string } }
  /** Página en el otro idioma (ya con el prefijo de raíz). */
  idiomaHref: string
}

/** Se ejecuta en el build (vite.config -> render.ts). `raiz` es '' en inglés y '../' en español. */
export function datosNicos(c: Contenido, raiz: string): DatosNicos {
  const u = c.ui
  return {
    lang: c.meta.lang,
    t: c.nicos,
    ui: { copiar: u.copiar, copiado: u.copiado, copiarFallo: u.copiarFallo, demo: u.demo, repositorio: u.repositorio, pestana: u.pestana, correoEtiqueta: u.correoEtiqueta },
    bio: {
      nombre: c.inicio.nombre,
      eyebrow: c.inicio.eyebrow,
      frase: c.inicio.frase,
      ubicacion: c.inicio.ubicacion,
      cifras: c.inicio.cifras,
      ensenanzaTitulo: c.ensenanza.titulo,
      ensenanza: c.ensenanza.texto,
    },
    sistemas: { titulo: c.sistemas.titulo, items: c.sistemas.items.map((i) => ({ nombre: i.nombre, resultado: i.resultado })) },
    proyectos: { titulo: c.proyectos.titulo, items: c.proyectos.items },
    contacto: { texto: c.contacto.texto, email: c.contacto.email, linkedin: c.contacto.linkedin, github: c.contacto.github },
    cv: {
      propio: { href: raiz + u.cvPropio, etiqueta: c.nicos.cvPropio },
      otro: { href: raiz + u.cvOtro.archivo, etiqueta: u.cvOtro.texto },
    },
    idiomaHref: raiz + u.idioma.ruta,
  }
}

/** Serializa para incrustar en <script type="application/json"> sin poder cerrarlo. */
export function jsonSeguro(d: DatosNicos): string {
  return JSON.stringify(d).replace(/</g, '\\u003c').replace(/&/g, '\\u0026')
}

/** En el navegador: lee los datos incrustados. */
export function leerDatos(): DatosNicos | null {
  const el = document.getElementById('nicos-datos')
  if (!el?.textContent) return null
  try {
    return JSON.parse(el.textContent) as DatosNicos
  } catch {
    return null
  }
}
