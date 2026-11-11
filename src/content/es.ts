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
    cvOtro: { texto: 'CV en inglés (PDF)', archivo: 'cv/Juan-Nicolas-Garcia-CV-EN.pdf' },
    temaAria: 'Cambiar tema claro u oscuro',
    idioma: { texto: 'EN', aria: 'EN – View in English', lang: 'en', ruta: '' },
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
    correoEtiqueta: 'Correo',
    copiar: 'Copiar',
    copiado: 'Copiado',
    copiarFallo: 'Selecciónalo y copia',
    avisoCopiado: 'Correo copiado',
    avisoFallo: 'No se pudo copiar; el correo quedó seleccionado',
    pie: '© 2026',
    piezas: { tapa: 'Tapa', pantalla: 'Pantalla', placa: 'Placa base', cpu: 'Procesador', antena: 'Antena', bateria: 'Batería', teclado: 'Teclado', disco: 'Disco', chasis: 'Chasis' },
    pieLinea: 'Diseñado y construido por Juan Nicolás García · three.js, Blender, TypeScript',
    pieCodigo: 'Código fuente',
    pieAtajo: 'Pulsa',
    cvEtiqueta: 'CV',
    cvFabAria: 'Descargar CV',
    pct: ' %',
    escribeme: 'Escríbeme',
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
      { valor: '39 %', texto: 'menos costo de IA con mi plugin de código abierto' },
    ],
    botones: { cv: 'Descargar CV', contacto: 'Escribirme' },
    pista: 'Haz scroll: el portátil se desarma pieza por pieza.',
    resumen: {
      titulo: 'En 30 segundos',
      filas: [
        { etiqueta: 'Roles', valor: 'Full-stack · Backend · Web3 · IA' },
        { etiqueta: 'Disponibilidad', valor: 'Abierto a roles remotos' },
        { etiqueta: 'Zona horaria', valor: 'UTC−5 (Colombia)' },
        { etiqueta: 'Formación', valor: 'Ingeniería de Sistemas, UIS · jul. 2026' },
        { etiqueta: 'Idiomas', valor: 'Español nativo · inglés B1' },
      ],
    },
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
    intro: 'Dónde corre cada una en producción.',
    grupos: [
      {
        nombre: 'Frontend',
        chips: [
          { nombre: 'Vue 3 + TypeScript', donde: 'Frontend de los 8 sistemas en producción.' },
          { nombre: 'React / Next.js', donde: 'Proyectos de hackathon: Roast Pitch, ScoutBrief y PULSO Tanda.' },
          { nombre: 'three.js', donde: 'Willys por Colombia y este portafolio.' },
        ],
      },
      {
        nombre: 'Backend y datos',
        chips: [
          { nombre: 'Laravel / PHP', donde: 'APIs y lógica de negocio de esos sistemas.' },
          { nombre: 'Node.js', donde: 'x402 Guard (proxy de pagos) y el agente de ScoutBrief.' },
          { nombre: 'SQL Server / MySQL', donde: 'Bases de datos de calidad, ERP y reportes.' },
          { nombre: 'Visual Basic', donde: 'Mantenimiento del ERP de unas 100 personas.' },
          { nombre: 'Power BI', donde: 'Portal de tableros para la empresa.' },
        ],
      },
      {
        nombre: 'IA y agentes',
        chips: [
          { nombre: 'Python', donde: 'Lo enseñé durante 3 años; scripts y agentes.' },
          { nombre: 'MCP y Claude Code', donde: 'Servidor MCP en producción y el plugin Tacaño.' },
        ],
      },
      {
        nombre: 'Web3',
        chips: [{ nombre: 'Hedera', donde: 'Consenso, tokens y contratos en 4 proyectos de hackathon.' }],
      },
      {
        nombre: 'Herramientas',
        chips: [{ nombre: 'Docker, Git, Vercel', donde: 'Despliegue y trabajo diario.' }],
      },
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
        texto: 'Reduce cerca de 39 % el uso de tokens (la unidad con la que cobran los modelos de IA), medido reproduciendo 500 turnos reales. Un modelo pequeño decide cuándo compactar y qué delegar a trabajadores más baratos.',
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
    rol: { texto: 'Hedera Developer & Community Ambassador en Colombia', fechas: '2025 – hoy' },
    logros: [
      { valor: '1.º', texto: 'Reto de ciberseguridad Web3 (CTF), Hedera DevDay, ETHDenver 2026' },
      { valor: '2.º', texto: 'Bounty de automatización on-chain de Hedera, ETHDenver 2026', enlace: { texto: 'Devfolio', url: 'https://devfolio.co/projects/hive-protocol-8945' } },
      { valor: '~90', texto: 'personas en Descifra Hedera, charla y hackathon que organicé en la UIS' },
      { valor: '~220', texto: 'proyectos evaluados como jurado en ETHOnline y NEA Tech 2026' },
    ],
    charlas: [
      {
        texto: 'Speaker en Blockchain Summit Latam, Bogotá (nov. 2026): tokenización y agentes de IA en Hedera.',
        enlace: { texto: 'Ver la transmisión', url: 'https://x.com/HederaCommunity/status/2118054675480277119' },
      },
      { texto: 'Taller de arranque del Hedera APEX Hackathon para México.' },
      { texto: 'Primera dapp con estudiantes de comunidades vulnerables de Brasil.' },
    ],
  },

  // Batería: proyectos propios y hackathons (la energía extra).
  proyectos: {
    pieza: 'bateria',
    titulo: 'Lo que construyo por mi cuenta',
    items: [
      {
        nombre: 'Willys por Colombia',
        meta: 'three.js · música con IA en vivo',
        texto: 'Juego de manejo en three.js con música generada en vivo por IA, que cambia según la región por la que pasas.',
        demo: 'https://willys-por-colombia.vercel.app',
        repo: 'https://github.com/Nicolas6879/willys-por-colombia',
      },
      {
        nombre: 'PULSO Tanda',
        meta: 'Stellar · Next.js · Hackathon',
        texto: 'Una natillera (ahorro rotativo de grupo) como contrato inteligente: si un miembro no paga, su colateral cubre la ronda, y ese colateral genera rendimiento mientras espera. Funciona en testnet.',
        demo: 'https://pulso-tanda.vercel.app',
        repo: 'https://github.com/Nicolas6879/pulso-tanda',
      },
      {
        nombre: 'ScoutBrief',
        meta: 'Agentes de IA · Hedera · Next.js',
        texto: 'Un panel donde un agente de IA investiga empresas y paga cada servicio en HBAR, con topes de gasto y cada decisión registrada en Hedera. Funciona en testnet.',
        demo: 'https://scout-brief-console.vercel.app',
        repo: 'https://github.com/Nicolas6879/ScoutBrief',
      },
      {
        nombre: 'Roast Pitch',
        meta: 'Agentes de IA · Next.js · Base',
        texto: 'Cinco jueces de IA destrozan tu pitch de startup en vivo y en paralelo, y el veredicto queda anclado en Base. Funciona en testnet.',
        demo: 'https://pitchroast-omega.vercel.app',
        repo: 'https://github.com/Nicolas6879/pitchroast',
      },
      {
        nombre: 'Hive Protocol',
        meta: 'Proyecto en equipo · 2.º lugar · ETHDenver 2026',
        texto: 'Tres agentes de IA que proponen, ejecutan y validan conocimiento sin intervención humana.',
        repo: 'https://github.com/Nicolas6879/HIVE',
        prueba: { texto: 'Devfolio', url: 'https://devfolio.co/projects/hive-protocol-8945' },
      },
      {
        nombre: 'VerifiChain Visual',
        meta: 'Visión por computador · Hedera',
        texto: 'Agente que inspecciona metal y concreto con visión por computador y registra cada veredicto en Hedera.',
        repo: 'https://github.com/Nicolas6879/verifichain-vision-oracle',
      },
      {
        nombre: 'x402 Guard',
        meta: 'Agentes de IA · Pagos',
        texto: 'Proxy de pagos para agentes de IA: el agente nunca tiene las llaves y cada pago queda auditado en público.',
        repo: 'https://github.com/Nicolas6879/x402-guard',
      },
    ],
    cta: { titulo: '¿Encaja con tu equipo?', correo: 'Escríbeme' },
  },

  // Teclado: enseñar y comunicar.
  ensenanza: {
    pieza: 'teclado',
    titulo: 'Sé explicar lo que construyo',
    subEnsenanza: 'Enseñanza',
    texto:
      'Entre 2021 y 2024 enseñé Python a más de 150 estudiantes de 10 a 20 años, en más de 30 cursos. Hoy acompaño a desarrolladores nuevos en la comunidad de Hedera.',
    subIdiomas: 'Idiomas',
    idiomas: [
      { nombre: 'Español', nivel: 6, etiqueta: 'Nativo', aria: 'Español: nativo' },
      { nombre: 'Inglés', nivel: 3, enCurso: true, etiqueta: 'B1 · B2 en curso', aria: 'Inglés: B1, trabajando hacia B2' },
    ],
  },

  // Disco: la trayectoria guardada.
  trayectoria: {
    pieza: 'disco',
    titulo: 'Trayectoria',
    hitos: [
      { anio: '2019', texto: 'Técnico en Equipos Electrónicos Industriales, SENA.' },
      { anio: '2021', texto: 'Empiezo Ingeniería de Sistemas en la UIS y a enseñar programación.' },
      { anio: '2025', texto: 'Practicante: construyo el sistema de calidad ISO 9001. Embajador de Hedera.' },
      { anio: '2026', texto: 'Ingeniero de software. ETHDenver. Me gradué en julio.' },
      { anio: '2027', texto: 'Tu equipo, en remoto.' },
    ],
  },

  // Chasis: se rearma el portátil y la pantalla enciende nicOS con el contacto.
  contacto: {
    pieza: 'chasis',
    titulo: '¿Construimos algo juntos?',
    texto: 'Busco trabajo remoto como desarrollador full-stack o construyendo agentes de IA.',
    asunto: 'Rol remoto — vi tu portafolio',
    email: 'jngv08@gmail.com', // confirmado como público (2026-11-10)
    linkedin: 'https://www.linkedin.com/in/juan-nicolas-garcia-vega',
    github: 'https://github.com/Nicolas6879',
  },

  // Escritorio retro dentro de la pantalla al final, y una terminal con Ctrl + K.
  nicos: {
    bienvenida: 'Bienvenido a nicOS 1.0',
    encender: 'Encender nicOS',
    botonCabecera: 'Terminal nicOS',
    escribe: 'escribe ayuda',
    entradaAria: 'Comando de la terminal',
    cerrar: 'Cerrar',
    toca: 'toca un comando o escribe',
    volver: 'Volver al escritorio',
    escritorioAria: 'Escritorio nicOS',
    ventanas: { leeme: 'Léeme', proyectos: 'Proyectos', terminal: 'Terminal', correo: 'Correo', cv: 'CV' },
    arranque: {
      lineas: ['montando /proyectos ... ok', 'cargando hedera.ko ... ok', 'preparando el café ... ok', 'iniciando a nico ... listo'],
      saltar: 'pulsa una tecla para saltar',
      saltarToque: 'toca para saltar',
    },
    cvPropio: 'Versión en español (PDF)',
    verEnPagina: 'Verlo en la página',
    comandos: {
      ayuda: 'Comandos disponibles:',
      ayudaPie: 'Tab completa, ↑ ↓ recorren el historial. Hay un par de huevos de Pascua.',
      descripciones: {
        ayuda: 'esta lista',
        whoami: 'quién está detrás de esto',
        proyectos: 'sistemas y proyectos, con enlaces',
        cv: 'descargar mi CV',
        tacano: 'mi plugin open source para Claude Code',
        hedera: 'mi trabajo en la comunidad Hedera',
        contacto: 'cómo escribirme',
        ls: 'listar las ventanas',
        abrir: 'abrir <ventana>: leeme, proyectos, terminal, correo, cv',
        tema: 'alternar tema claro y oscuro',
        idioma: 'cambiar a la página en inglés',
        limpiar: 'limpiar la pantalla',
        salir: 'apagar nicOS',
      },
      whoami: 'Juan Nicolás García · ingeniero full-stack · Bucaramanga, Colombia',
      proyectosSistemas: 'Sistemas en producción (empresa industrial en Colombia):',
      proyectosPropios: 'Por mi cuenta:',
      cv: 'Descargando el CV en español…',
      tacano: '−39 % tokens en 500 turnos reales → github.com/Nicolas6879/tacano',
      hedera: 'Embajador en Colombia · 1.º CTF Hedera DevDay · 2.º bounty ETHDenver 2026',
      contacto: 'Escríbeme por LinkedIn o por correo; los dos están en la ventana Correo (escribe: abrir correo).',
      desconocido: 'Comando no encontrado. Escribe ayuda',
      abrirUso: 'Uso: abrir <ventana>. Ventanas: leeme, proyectos, terminal, correo, cv',
      abriendo: 'Abriendo {n}…',
      abrirNoExiste: 'No existe la ventana: {n}',
      tema: 'Tema cambiado.',
      idioma: 'Switching to English…',
      salir: 'Apagando nicOS. ¡Hasta pronto!',
      salirFuera: 'Esta terminal no está dentro del escritorio. Pulsa "Encender nicOS" para iniciarlo.',
      sudo: 'Permiso concedido. La mejor decisión del día. Abriendo el correo…',
      sudoOtro: 'nico no figura en el archivo sudoers. Este incidente será reportado. (Prueba: sudo contratar nico)',
      cafe: ['    ( (', '     ) )', '  ........', '  |      |]', '  \\      /', "   `----'", 'Un café servido. Compilando con 100 % más energía.'],
    },
  },
}
