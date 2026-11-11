// Forma común del contenido: es.ts y en.ts se comprueban contra este tipo.

export type Pieza =
  | 'tapa' | 'pantalla' | 'placa' | 'cpu' | 'antena' | 'bateria' | 'teclado' | 'disco' | 'chasis'

export type Idioma = 'en' | 'es'

export type ClaveSeccion =
  | 'sistemas' | 'tecnologias' | 'ia' | 'comunidad' | 'proyectos' | 'ensenanza' | 'trayectoria' | 'contacto'

export interface Contenido {
  meta: {
    lang: Idioma
    titulo: string
    descripcion: string
    /** Carpeta de esta página respecto a la raíz del sitio ('' para inglés, 'es/' para español). */
    ruta: string
  }
  /** Textos de interfaz (navegación, etiquetas de accesibilidad, botones). */
  ui: {
    saltar: string
    navAria: string
    nav: Record<ClaveSeccion, string>
    descargarCv: string
    /** Enlace secundario al CV en el otro idioma. */
    cvOtro: { texto: string; archivo: string }
    cvPropio: string
    temaAria: string
    idioma: { texto: string; aria: string; lang: Idioma; ruta: string }
    capturaDe: string
    capturaProx: string
    verCodigo: string
    verCaptura: string
    fragmento: string
    tecnologiasAria: string
    verGithub: string
    pestana: string
    demo: string
    repositorio: string
    de: string
    charlas: string
    idiomasEtiqueta: string
    correoEtiqueta: string
    copiar: string
    copiado: string
    copiarFallo: string
    avisoCopiado: string
    avisoFallo: string
    pie: string
    /** Sufijo del contador (' %' en español, '%' en inglés). */
    pct: string
  }
  inicio: {
    pieza: Pieza
    eyebrow: string
    nombre: string
    frase: string
    ubicacion: string
    cifras: { valor: string; texto: string }[]
    botones: { cv: string; contacto: string }
    pista: string
  }
  sistemas: {
    pieza: Pieza
    titulo: string
    intro: string
    items: {
      nombre: string
      resultado: string
      detalle: string
      stack: string[]
      captura: string
      codigo: string
    }[]
    otros: string
  }
  tecnologias: {
    pieza: Pieza
    titulo: string
    intro: string
    chips: { nombre: string; donde: string }[]
  }
  ia: {
    pieza: Pieza
    titulo: string
    items: { nombre: string; texto: string; enlace?: string; contador?: number }[]
  }
  comunidad: {
    pieza: Pieza
    titulo: string
    rol: string
    logros: { valor: string; texto: string }[]
    charlas: string[]
  }
  proyectos: {
    pieza: Pieza
    titulo: string
    items: { nombre: string; texto: string; demo?: string; repo?: string }[]
  }
  ensenanza: { pieza: Pieza; titulo: string; texto: string }
  trayectoria: {
    pieza: Pieza
    titulo: string
    hitos: { anio: string; texto: string }[]
    idiomas: string
  }
  contacto: {
    pieza: Pieza
    titulo: string
    texto: string
    email: string
    linkedin: string
    github: string
  }
  nicos: {
    bienvenida: string
    ventanas: string[]
    comandos: {
      ayuda: string
      whoami: string
      proyectos: string
      cv: string
      tacano: string
      hedera: string
      contacto: string
      desconocido: string
    }
  }
}
