// Forma común del contenido: es.ts y en.ts se comprueban contra este tipo.

export type Pieza =
  | 'tapa' | 'pantalla' | 'placa' | 'cpu' | 'antena' | 'bateria' | 'teclado' | 'disco' | 'chasis'

export type Idioma = 'en' | 'es'

export type ClaveSeccion =
  | 'sistemas' | 'tecnologias' | 'ia' | 'comunidad' | 'proyectos' | 'ensenanza' | 'trayectoria' | 'contacto'

/** Enlace extra de verificación (prueba de un premio, transmisión de una charla). */
export interface EnlaceExtra {
  texto: string
  url: string
}

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
    correoEtiqueta: string
    copiar: string
    copiado: string
    copiarFallo: string
    avisoCopiado: string
    avisoFallo: string
    pie: string
    /** Nombre localizado de cada pieza del portátil (eyebrow de sección: "02 — Pantalla"). */
    piezas: Record<Pieza, string>
    /** Pie de página. */
    pieLinea: string
    pieCodigo: string
    pieAtajo: string
    cvEtiqueta: string
    /** Aria del botón flotante de CV (móvil). */
    cvFabAria: string
    /** Sufijo del contador (' %' en español, '%' en inglés). */
    pct: string
    /** Botón de correo de la franja a mitad de página. */
    escribeme: string
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
    /** Bloque "en 30 segundos" bajo el héroe: etiqueta mono pequeña + valor. */
    resumen: { titulo: string; filas: { etiqueta: string; valor: string }[] }
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
    grupos: { nombre: string; chips: { nombre: string; donde: string }[] }[]
  }
  ia: {
    pieza: Pieza
    titulo: string
    items: { nombre: string; texto: string; enlace?: string; contador?: number }[]
  }
  comunidad: {
    pieza: Pieza
    titulo: string
    /** Rol y fechas por separado: el rol va en negrita y las fechas en una etiqueta mono. */
    rol: { texto: string; fechas: string }
    logros: { valor: string; texto: string; enlace?: EnlaceExtra }[]
    charlas: { texto: string; enlace?: EnlaceExtra }[]
  }
  proyectos: {
    pieza: Pieza
    titulo: string
    items: { nombre: string; meta: string; texto: string; demo?: string; repo?: string; prueba?: EnlaceExtra }[]
    /** Franja con llamada a la acción tras las tarjetas. */
    cta: { titulo: string; correo: string }
  }
  ensenanza: {
    pieza: Pieza
    titulo: string
    subEnsenanza: string
    texto: string
    subIdiomas: string
    /** `nivel` = pasos CEFR alcanzados (1 a 6); `enCurso` marca el siguiente paso como en progreso. */
    idiomas: { nombre: string; nivel: number; enCurso?: boolean; etiqueta: string; aria: string }[]
  }
  trayectoria: {
    pieza: Pieza
    titulo: string
    hitos: { anio: string; texto: string }[]
  }
  contacto: {
    pieza: Pieza
    titulo: string
    texto: string
    email: string
    /** Asunto prellenado del correo. */
    asunto: string
    linkedin: string
    github: string
  }
  /** nicOS: terminal (Ctrl/Cmd + K), escritorio retro y mini-terminal de contacto. */
  nicos: {
    bienvenida: string
    /** Texto del botón de contacto que enciende el escritorio. */
    encender: string
    /** Etiqueta (accesible) del botón de la cabecera. */
    botonCabecera: string
    /** Pista del placeholder de la terminal ("type help"). */
    escribe: string
    entradaAria: string
    cerrar: string
    /** Pista de las fichas de comandos (táctil) y etiqueta del botón de volver al escritorio. */
    toca: string
    volver: string
    escritorioAria: string
    /** Nombre de cada ventana (iconos y barras de título). */
    ventanas: { leeme: string; proyectos: string; terminal: string; correo: string; cv: string }
    arranque: { lineas: string[]; saltar: string; saltarToque: string }
    /** Etiqueta del CV en el idioma de la página. */
    cvPropio: string
    verEnPagina: string
    comandos: {
      /** Cabecera de la ayuda; las descripciones van en `descripciones`. */
      ayuda: string
      ayudaPie: string
      descripciones: Record<
        'ayuda' | 'whoami' | 'proyectos' | 'cv' | 'tacano' | 'hedera' | 'contacto' | 'ls' | 'abrir' | 'tema' | 'idioma' | 'limpiar' | 'salir',
        string
      >
      whoami: string
      proyectosSistemas: string
      proyectosPropios: string
      cv: string
      tacano: string
      hedera: string
      contacto: string
      desconocido: string
      abrirUso: string
      /** {n} = nombre de la ventana. */
      abriendo: string
      abrirNoExiste: string
      tema: string
      idioma: string
      salir: string
      salirFuera: string
      sudo: string
      sudoOtro: string
      cafe: string[]
    }
  }
}
