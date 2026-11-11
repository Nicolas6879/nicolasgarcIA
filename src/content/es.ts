// Contenido del portafolio en español. Fuente: CV_ES.tex (nov. 2026).
// Regla: nunca nombrar la empresa donde trabaja; se dice "empresa industrial en Colombia".
// Cada sección se asocia a una pieza del portátil 3D (campo `pieza`), que se separa al hacer scroll.

import type { Contenido } from './tipos'

export type { Pieza } from './tipos'

export const es: Contenido = {
  meta: {
    lang: 'es',
    ruta: 'es/',
    titulo: 'Juan Nicolás García · Ingeniero full-stack',
    descripcion:
      'Ingeniero full-stack en Colombia: 8 sistemas en producción, agentes de IA y Web3. Disponible para trabajo remoto.',
  },

  ui: {
    saltar: 'Saltar al contenido',
    navAria: 'Secciones',
    nav: {
      sistemas: 'Sistemas', tecnologias: 'Tecnologías', ia: 'IA', comunidad: 'Comunidad',
      proyectos: 'Proyectos', ensenanza: 'Enseñanza', trayectoria: 'Trayectoria', contacto: 'Contacto',
    },
    descargarCv: 'Descargar CV',
    cvPropio: 'cv/Juan-Nicolas-Garcia-CV-ES.pdf',
    cvOtro: { texto: 'English version (PDF)', archivo: 'cv/Juan-Nicolas-Garcia-CV-EN.pdf' },
    temaAria: 'Cambiar tema claro u oscuro',
    idioma: { texto: 'EN', aria: 'View in English', lang: 'en', ruta: '' },
    capturaDe: 'Captura de',
    capturaProx: 'Captura próximamente',
    verCodigo: 'Ver código',
    verCaptura: 'Ver captura',
    fragmento: 'Fragmento simplificado',
    tecnologiasAria: 'Tecnologías',
    verGithub: 'Ver en GitHub',
    pestana: '(se abre en pestaña nueva)',
    demo: 'Demo',
    repositorio: 'Repositorio',
    de: 'de',
    charlas: 'Charlas y talleres',
    idiomasEtiqueta: 'Idiomas',
    correoEtiqueta: 'Correo',
    copiar: 'Copiar',
    copiado: 'Copiado',
    copiarFallo: 'Selecciónalo y copia',
    avisoCopiado: 'Correo copiado',
    avisoFallo: 'No se pudo copiar; el correo quedó seleccionado',
    pie: '© 2026',
    pct: ' %',
  },

  // Primera pantalla: tiene que bastar sola para un reclutador.
  inicio: {
    pieza: 'tapa',
    eyebrow: 'Ingeniero full-stack · IA y Web3',
    nombre: 'Juan Nicolás García',
    frase: 'Construyo sistemas completos, de la base de datos a la pantalla, y agentes de IA que trabajan con ellos.',
    ubicacion: 'Bucaramanga, Colombia · disponible para trabajo remoto',
    cifras: [
      { valor: '8', texto: 'sistemas en producción' },
      { valor: '600+', texto: 'documentos en papel reemplazados' },
      { valor: '39 %', texto: 'menos tokens con mi plugin open source' },
    ],
    botones: { cv: 'Descargar CV', contacto: 'Escribirme' },
    pista: 'Haz scroll: el portátil se desarma pieza por pieza.',
  },

  // Pantalla: lo que la gente usa todos los días. Aquí las capturas se desintegran en código.
  sistemas: {
    pieza: 'pantalla',
    titulo: 'Sistemas que la gente usa todos los días',
    intro:
      'Desde 2025 trabajo en una empresa industrial en Colombia llevando sus procesos del papel a lo digital. Diseño, construyo y mantengo cada sistema de punta a punta.',
    items: [
      {
        nombre: 'Sistema de gestión de calidad ISO 9001',
        resultado: 'Reemplazó más de 600 documentos en papel y se usa a diario en 3 áreas.',
        detalle: 'Seis módulos: documentos, indicadores, auditorías, riesgos, acciones correctivas y gestión del cambio. Fue mi trabajo de grado.',
        stack: ['Vue 3', 'TypeScript', 'Pinia', 'Laravel', 'MySQL'],
        captura: 'calidad.webp',
        codigo: 'calidad.ts', // fragmento ilustrativo (src/content/codigo.ts) en el que se "desintegra" la captura
      },
      {
        nombre: 'Preoperacionales',
        resultado: 'Listas de chequeo de equipos en 3 sedes que funcionan sin internet y se sincronizan solas.',
        detalle: 'Modo sin conexión con sincronización automática al recuperar la señal.',
        stack: ['Vue 3', 'Laravel', 'SQL Server'],
        captura: 'preoperacionales.webp',
        codigo: 'sync.ts',
      },
      {
        nombre: 'Expedientes digitales',
        resultado: 'PDFs escaneados, archivados y firmados en un solo lugar, en vez de carpetas físicas.',
        detalle: 'Además reestructuré el sistema anterior de adjuntos que generaba el ERP.',
        stack: ['Vue 3', 'Laravel', 'SQL Server'],
        captura: 'expedientes.webp',
        codigo: 'expediente.php',
      },
      {
        nombre: 'Migración desde C#',
        resultado: 'Un sistema heredado en C# reescrito completo, sin perder datos.',
        detalle: 'Migrado a Vue 3, Laravel y SQL Server.',
        stack: ['C#', 'Vue 3', 'Laravel', 'SQL Server'],
        captura: 'migracion.webp',
        codigo: 'migracion.php',
      },
    ],
    otros:
      'También: pedidos y costeo de comida multiplanta, un portal de tableros Power BI, un formulario de debida diligencia de terceros (SAGRILAFT) con salida en PDF, y el mantenimiento del ERP que usan unas 100 personas.',
  },

  // Placa base: cada chip es una tecnología, con dónde la usó de verdad.
  tecnologias: {
    pieza: 'placa',
    titulo: 'Las piezas con las que construyo',
    intro: 'Pasa el cursor por cada chip para ver dónde lo uso en producción.',
    chips: [
      { nombre: 'Vue 3 + TypeScript', donde: 'Frontend de los 8 sistemas en producción.' },
      { nombre: 'Laravel / PHP', donde: 'APIs y lógica de negocio de esos sistemas.' },
      { nombre: 'SQL Server / MySQL', donde: 'Bases de datos de calidad, ERP y reportes.' },
      { nombre: 'Visual Basic', donde: 'Mantenimiento del ERP de unas 100 personas.' },
      { nombre: 'Python', donde: 'Lo enseñé durante 3 años; scripts y agentes.' },
      { nombre: 'three.js', donde: 'Willys por Colombia y este portafolio.' },
      { nombre: 'MCP y Claude Code', donde: 'Servidor MCP en producción y el plugin Tacaño.' },
      { nombre: 'Hedera', donde: 'Consenso, tokens y contratos en 4 proyectos de hackathon.' },
      { nombre: 'Power BI', donde: 'Portal de tableros para la empresa.' },
      { nombre: 'Docker, Git, Vercel', donde: 'Despliegue y trabajo diario.' },
    ],
  },

  // Procesador: inteligencia artificial.
  ia: {
    pieza: 'cpu',
    titulo: 'Agentes de IA que hacen trabajo real',
    items: [
      {
        nombre: 'Servidor MCP para el sistema de calidad',
        texto: 'Permite buscar en los catálogos y publicar documentos de calidad desde Claude, para que nadie se salte el paso de subirlos.',
      },
      {
        nombre: 'Tacaño, plugin open source para Claude Code',
        texto: 'Reduce cerca de 39 % los tokens, medido reproduciendo 500 turnos reales. Un modelo pequeño decide cuándo compactar y qué delegar a trabajadores más baratos.',
        enlace: 'https://github.com/Nicolas6879/tacano',
        contador: 39, // se anima de 0 a 39
      },
      {
        nombre: 'Asistente de IA interno',
        texto: 'Hago parte del equipo que construye un asistente para el conocimiento y los reportes de la empresa.',
      },
    ],
  },

  // Antena: comunidad.
  comunidad: {
    pieza: 'antena',
    titulo: 'Conectado con la comunidad',
    rol: 'Hedera Developer & Community Ambassador en Colombia (2025 – hoy)',
    logros: [
      { valor: '1.º', texto: 'Reto de ciberseguridad Web3 (CTF), Hedera DevDay, ETHDenver 2026' },
      { valor: '2.º', texto: 'Bounty de automatización on-chain de Hedera, ETHDenver 2026' },
      { valor: '~90', texto: 'personas en Descifra Hedera, charla y hackathon que organicé en la UIS' },
      { valor: '~220', texto: 'proyectos evaluados como jurado en ETHOnline y NEA Tech 2026' },
    ],
    charlas: [
      'Speaker en Blockchain Summit Latam, Bogotá (nov. 2026): tokenización y agentes de IA en Hedera.',
      'Taller de arranque del Hedera APEX Hackathon para México.',
      'Primera dapp con estudiantes de comunidades vulnerables de Brasil.',
    ],
  },

  // Batería: proyectos propios y hackathons (la energía extra).
  proyectos: {
    pieza: 'bateria',
    titulo: 'Lo que construyo por mi cuenta',
    items: [
      {
        nombre: 'Willys por Colombia',
        texto: 'Juego de manejo en three.js con música generada en vivo por IA, que cambia según la región por la que pasas.',
        demo: 'https://willys-por-colombia.vercel.app',
        repo: 'https://github.com/Nicolas6879/willys-por-colombia',
      },
      {
        nombre: 'VerifiChain Visual',
        texto: 'Agente que inspecciona metal y concreto con visión por computador y registra cada veredicto en Hedera.',
        repo: 'https://github.com/Nicolas6879/verifichain-vision-oracle',
      },
      {
        nombre: 'x402 Guard',
        texto: 'Proxy de pagos para agentes de IA: el agente nunca tiene las llaves y cada pago queda auditado en público.',
        repo: 'https://github.com/Nicolas6879/x402-guard',
      },
      {
        nombre: 'Hive Protocol',
        texto: 'Tres agentes de IA que proponen, ejecutan y validan conocimiento sin intervención humana. 2.º lugar en ETHDenver 2026.',
        repo: 'https://github.com/Nicolas6879/HIVE',
      },
    ],
  },

  // Teclado: enseñar y comunicar.
  ensenanza: {
    pieza: 'teclado',
    titulo: 'Sé explicar lo que construyo',
    texto:
      'Entre 2021 y 2024 enseñé Python a más de 150 estudiantes de 10 a 20 años, en más de 30 cursos. Hoy acompaño a desarrolladores nuevos en la comunidad de Hedera.',
  },

  // Disco: la trayectoria guardada.
  trayectoria: {
    pieza: 'disco',
    titulo: 'Trayectoria',
    hitos: [
      { anio: '2019', texto: 'Técnico en Equipos Electrónicos Industriales, SENA.' },
      { anio: '2021', texto: 'Empiezo Ingeniería de Sistemas en la UIS y a enseñar programación.' },
      { anio: '2025', texto: 'Practicante: construyo el sistema de calidad ISO 9001. Embajador de Hedera.' },
      { anio: '2026', texto: 'Ingeniero de software. ETHDenver. Me gradúo en julio.' },
      { anio: '2027', texto: 'Tu equipo, en remoto.' },
    ],
    idiomas: 'Español nativo · inglés intermedio (B1, mejorando hacia B2)',
  },

  // Chasis: se rearma el portátil y la pantalla enciende nicOS con el contacto.
  contacto: {
    pieza: 'chasis',
    titulo: '¿Construimos algo juntos?',
    texto: 'Busco trabajo remoto como desarrollador full-stack o construyendo agentes de IA.',
    email: 'jngv08@gmail.com', // confirmado como público (2026-11-10)
    linkedin: 'https://www.linkedin.com/in/juan-nicolas-garcia-vega',
    github: 'https://github.com/Nicolas6879',
  },

  // Escritorio retro dentro de la pantalla al final, y terminal con Ctrl + K.
  nicos: {
    bienvenida: 'Bienvenido a nicOS 1.0',
    ventanas: ['Léeme', 'Proyectos', 'Terminal', 'Correo'],
    comandos: {
      ayuda: 'Comandos: whoami, proyectos, cv, tacano, hedera, contacto, clear',
      whoami: 'Juan Nicolás García · ingeniero full-stack · Bucaramanga, Colombia',
      proyectos: 'calidad-iso9001  preoperacionales  expedientes  tacano  willys  hive',
      cv: 'Abriendo el CV…',
      tacano: '−39 % tokens en 500 turnos reales → github.com/Nicolas6879/tacano',
      hedera: 'Embajador en Colombia · 1.º CTF Hedera DevDay · 2.º bounty ETHDenver 2026',
      contacto: 'Escríbeme por LinkedIn o al correo de la sección de contacto.',
      desconocido: 'Comando no encontrado. Escribe "ayuda".',
    },
  },
}
