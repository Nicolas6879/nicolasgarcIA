// Portfolio content in English (main language). Source: cv-fuente/cv-portafolio-en.tex.
// Rule: never name the employer; say "an industrial company in Colombia".
// Same shape as es.ts (see tipos.ts). Each section maps to a 3D laptop part (`pieza`).

import type { Contenido } from './tipos'

export const en: Contenido = {
  meta: {
    lang: 'en',
    ruta: '',
    titulo: 'Juan Nicolás García · Full-stack engineer',
    descripcion:
      'Full-stack engineer in Colombia: 8 systems in production, AI agents and Web3. Open to remote work.',
  },

  ui: {
    saltar: 'Skip to content',
    navAria: 'Sections',
    nav: {
      sistemas: 'Systems', tecnologias: 'Technologies', ia: 'AI', comunidad: 'Community',
      proyectos: 'Projects', ensenanza: 'Teaching', trayectoria: 'Journey', contacto: 'Contact',
    },
    descargarCv: 'Download CV',
    cvPropio: 'cv/Juan-Nicolas-Garcia-CV-EN.pdf',
    cvOtro: { texto: 'CV in Spanish (PDF)', archivo: 'cv/Juan-Nicolas-Garcia-CV-ES.pdf' },
    temaAria: 'Switch between light and dark theme',
    idioma: { texto: 'ES', aria: 'ES – Ver en español', lang: 'es', ruta: 'es/' },
    capturaDe: 'Screenshot of',
    capturaProx: 'Screenshot coming soon',
    verCodigo: 'View code',
    verCaptura: 'View screenshot',
    fragmento: 'Simplified fragment',
    tecnologiasAria: 'Technologies',
    verGithub: 'View on GitHub',
    pestana: '(opens in a new tab)',
    demo: 'Demo',
    repositorio: 'Repository',
    de: 'of',
    charlas: 'Talks and workshops',
    correoEtiqueta: 'Email',
    copiar: 'Copy',
    copiado: 'Copied',
    copiarFallo: 'Select it and copy',
    avisoCopiado: 'Email copied',
    avisoFallo: 'Could not copy; the email is now selected',
    pie: '© 2026',
    piezas: { tapa: 'Lid', pantalla: 'Screen', placa: 'Motherboard', cpu: 'Processor', antena: 'Antenna', bateria: 'Battery', teclado: 'Keyboard', disco: 'Drive', chasis: 'Chassis' },
    pieLinea: 'Designed and built by Juan Nicolás García · three.js, Blender, TypeScript',
    pieCodigo: 'Source code',
    pieAtajo: 'Press',
    cvEtiqueta: 'CV',
    cvFabAria: 'Download CV',
    pct: '%',
    escribeme: 'Email me',
  },

  // First screen: it has to be enough on its own for a recruiter.
  inicio: {
    pieza: 'tapa',
    eyebrow: 'Full-stack engineer · AI & Web3',
    nombre: 'Juan Nicolás García',
    frase: 'I build complete systems, from the database to the screen, and AI agents that work with them.',
    ubicacion: 'Bucaramanga, Colombia · open to remote work',
    cifras: [
      { valor: '8', texto: 'systems in production' },
      { valor: '600+', texto: 'paper documents replaced' },
      { valor: '39%', texto: 'lower AI cost with my open source plugin' },
    ],
    botones: { cv: 'Download CV', contacto: 'Get in touch' },
    pista: 'Scroll down: the laptop comes apart piece by piece.',
    resumen: {
      titulo: 'In 30 seconds',
      filas: [
        { etiqueta: 'Roles', valor: 'Full-stack · Backend · Web3 · AI' },
        { etiqueta: 'Availability', valor: 'Open to remote roles' },
        { etiqueta: 'Time zone', valor: 'UTC−5 (Colombia)' },
        { etiqueta: 'Education', valor: 'B.S. Systems Engineering, UIS · Jul. 2026' },
        { etiqueta: 'Languages', valor: 'Spanish native · English B1' },
      ],
    },
  },

  sistemas: {
    pieza: 'pantalla',
    titulo: 'Systems people use every day',
    intro:
      'Since 2025 I have worked at an industrial company in Colombia, moving its processes from paper to digital. I design, build and maintain each system end to end.',
    items: [
      {
        nombre: 'ISO 9001 quality management system',
        resultado: 'Replaced more than 600 paper documents and is used daily in 3 departments.',
        detalle: 'Six modules: documents, KPIs, audits, risks, corrective actions and change management. It was my undergraduate thesis.',
        stack: ['Vue 3', 'TypeScript', 'Pinia', 'Laravel', 'MySQL'],
        captura: 'calidad.webp',
        codigo: 'calidad.ts',
      },
      {
        nombre: 'Preoperacionales (equipment checklists)',
        resultado: 'Equipment checklists in 3 branches that work offline and sync on their own.',
        detalle: 'Offline mode with automatic sync when the connection comes back.',
        stack: ['Vue 3', 'Laravel', 'SQL Server'],
        captura: 'preoperacionales.webp',
        codigo: 'sync.ts',
      },
      {
        nombre: 'Digital records',
        resultado: 'Scanned, filed and signed PDFs in one place, instead of physical folders.',
        detalle: 'I also restructured the earlier attachments system that the ERP generated.',
        stack: ['Vue 3', 'Laravel', 'SQL Server'],
        captura: 'expedientes.webp',
        codigo: 'expediente.php',
      },
      {
        nombre: 'Migration from C#',
        resultado: 'A legacy C# system fully rewritten, with no data lost.',
        detalle: 'Migrated to Vue 3, Laravel and SQL Server.',
        stack: ['C#', 'Vue 3', 'Laravel', 'SQL Server'],
        captura: 'migracion.webp',
        codigo: 'migracion.php',
      },
    ],
    otros:
      "Also: multi-plant food orders and costing, a Power BI dashboard hub, a third-party due-diligence form (SAGRILAFT, Colombia’s anti-money-laundering rules) with PDF output, and maintenance of the ERP used by about 100 people.",
  },

  tecnologias: {
    pieza: 'placa',
    titulo: 'The pieces I build with',
    intro: 'Where each one runs in production.',
    grupos: [
      {
        nombre: 'Frontend',
        chips: [
          { nombre: 'Vue 3 + TypeScript', donde: 'Frontend of the 8 systems in production.' },
          { nombre: 'React / Next.js', donde: 'Hackathon projects: Roast Pitch, ScoutBrief and PULSO Tanda.' },
          { nombre: 'three.js', donde: 'Willys por Colombia and this portfolio.' },
        ],
      },
      {
        nombre: 'Backend and data',
        chips: [
          { nombre: 'Laravel / PHP', donde: 'APIs and business logic for those systems.' },
          { nombre: 'Node.js', donde: 'x402 Guard (payment proxy) and the ScoutBrief agent.' },
          { nombre: 'SQL Server / MySQL', donde: 'Databases for quality, the ERP and reports.' },
          { nombre: 'Visual Basic', donde: 'Maintenance of the ERP used by about 100 people.' },
          { nombre: 'Power BI', donde: 'Dashboard hub for the company.' },
        ],
      },
      {
        nombre: 'AI and agents',
        chips: [
          { nombre: 'Python', donde: 'I taught it for 3 years; scripts and agents.' },
          { nombre: 'MCP and Claude Code', donde: 'MCP server in production and the Tacaño plugin.' },
        ],
      },
      {
        nombre: 'Web3',
        chips: [{ nombre: 'Hedera', donde: 'Consensus, tokens and contracts in 4 hackathon projects.' }],
      },
      {
        nombre: 'Tools',
        chips: [{ nombre: 'Docker, Git, Vercel', donde: 'Deployment and daily work.' }],
      },
    ],
  },

  ia: {
    pieza: 'cpu',
    titulo: 'AI agents that do real work',
    items: [
      {
        nombre: 'MCP server for the quality system',
        texto: 'Lets staff search the catalogs and publish quality documents from Claude, so nobody skips the upload step.',
      },
      {
        nombre: 'Tacaño, an open source plugin for Claude Code',
        texto: 'Cuts token use (the unit AI models bill by) by about 39%, measured by replaying 500 real turns. A small model decides when to compact and what to hand off to cheaper workers.',
        enlace: 'https://github.com/Nicolas6879/tacano',
        contador: 39,
      },
      {
        nombre: 'Internal AI assistant',
        texto: "I am part of the team building an assistant for the company’s knowledge and reports.",
      },
    ],
  },

  comunidad: {
    pieza: 'antena',
    titulo: 'Part of the community',
    rol: { texto: 'Hedera Developer & Community Ambassador in Colombia', fechas: '2025 – present' },
    logros: [
      { valor: '1st', texto: 'Web3 cybersecurity challenge (CTF), Hedera DevDay, ETHDenver 2026' },
      { valor: '2nd', texto: 'Hedera on-chain automation bounty, ETHDenver 2026', enlace: { texto: 'Devfolio', url: 'https://devfolio.co/projects/hive-protocol-8945' } },
      { valor: '~90', texto: 'people at Descifra Hedera, a talk and hackathon I organized at UIS' },
      { valor: '~220', texto: 'projects judged at ETHOnline and NEA Tech 2026' },
    ],
    charlas: [
      {
        texto: 'Speaker at Blockchain Summit Latam, Bogotá (Nov. 2026): tokenization and AI agents on Hedera.',
        enlace: { texto: 'Watch the livestream', url: 'https://x.com/HederaCommunity/status/2118054675480277119' },
      },
      { texto: 'Kickoff workshop for the Hedera APEX Hackathon in Mexico.' },
      { texto: 'First dapp with students from vulnerable communities in Brazil.' },
    ],
  },

  proyectos: {
    pieza: 'bateria',
    titulo: 'What I build on my own',
    items: [
      {
        nombre: 'Willys por Colombia',
        meta: 'three.js · live AI music',
        texto: 'A driving game in three.js with music generated live by AI, which changes with the region you drive through.',
        demo: 'https://willys-por-colombia.vercel.app',
        repo: 'https://github.com/Nicolas6879/willys-por-colombia',
      },
      {
        nombre: 'PULSO Tanda',
        meta: 'Stellar · Next.js · Hackathon',
        texto: 'A group savings circle as a smart contract: if a member does not pay, their collateral covers the round, and the collateral earns yield while it waits. Runs on testnet.',
        demo: 'https://pulso-tanda.vercel.app',
        repo: 'https://github.com/Nicolas6879/pulso-tanda',
      },
      {
        nombre: 'ScoutBrief',
        meta: 'AI agents · Hedera · Next.js',
        texto: 'A dashboard where an AI agent researches companies and pays for each service in HBAR, with spending caps and every decision logged on Hedera. Runs on testnet.',
        demo: 'https://scout-brief-console.vercel.app',
        repo: 'https://github.com/Nicolas6879/ScoutBrief',
      },
      {
        nombre: 'Roast Pitch',
        meta: 'AI agents · Next.js · Base',
        texto: 'Five AI judges tear apart your startup pitch live, in parallel, and the verdict is anchored on Base. Runs on testnet.',
        demo: 'https://pitchroast-omega.vercel.app',
        repo: 'https://github.com/Nicolas6879/pitchroast',
      },
      {
        nombre: 'Hive Protocol',
        meta: 'Team project · 2nd place · ETHDenver 2026',
        texto: 'Three AI agents that propose, execute and validate knowledge with no human in the loop.',
        repo: 'https://github.com/Nicolas6879/HIVE',
        prueba: { texto: 'Devfolio', url: 'https://devfolio.co/projects/hive-protocol-8945' },
      },
      {
        nombre: 'VerifiChain Visual',
        meta: 'Computer vision · Hedera',
        texto: 'An agent that inspects metal and concrete with computer vision and records every verdict on Hedera.',
        repo: 'https://github.com/Nicolas6879/verifichain-vision-oracle',
      },
      {
        nombre: 'x402 Guard',
        meta: 'AI agents · Payments',
        texto: 'A payment proxy for AI agents: the agent never holds the keys and every payment is publicly audited.',
        repo: 'https://github.com/Nicolas6879/x402-guard',
      },
    ],
    cta: { titulo: 'Does this fit your team?', correo: 'Email me' },
  },

  ensenanza: {
    pieza: 'teclado',
    titulo: 'I can explain what I build',
    subEnsenanza: 'Teaching',
    texto:
      'Between 2021 and 2024 I taught Python to more than 150 students aged 10 to 20, in more than 30 courses. Today I mentor new developers in the Hedera community.',
    subIdiomas: 'Languages',
    idiomas: [
      { nombre: 'Spanish', nivel: 6, etiqueta: 'Native', aria: 'Spanish: native' },
      { nombre: 'English', nivel: 3, enCurso: true, etiqueta: 'B1 · B2 in progress', aria: 'English: B1, working toward B2' },
    ],
  },

  trayectoria: {
    pieza: 'disco',
    titulo: 'Journey',
    hitos: [
      { anio: '2019', texto: 'Technician in Industrial Electronic Equipment, SENA.' },
      { anio: '2021', texto: 'Begin Systems Engineering at UIS and start teaching programming.' },
      { anio: '2025', texto: 'Intern: I build the ISO 9001 quality system. Hedera Ambassador.' },
      { anio: '2026', texto: 'Software engineer. ETHDenver. I graduated in July.' },
      { anio: '2027', texto: 'Your team, remotely.' },
    ],
  },

  contacto: {
    pieza: 'chasis',
    titulo: 'Shall we build something together?',
    texto: 'I am looking for remote work as a full-stack developer or building AI agents.',
    email: 'jngv08@gmail.com',
    asunto: 'Remote role — saw your portfolio',
    linkedin: 'https://www.linkedin.com/in/juan-nicolas-garcia-vega',
    github: 'https://github.com/Nicolas6879',
  },

  // Retro desktop inside the screen at the end, and a terminal with Ctrl + K.
  nicos: {
    bienvenida: 'Welcome to nicOS 1.0',
    encender: 'Boot nicOS',
    botonCabecera: 'nicOS terminal',
    escribe: 'type help',
    entradaAria: 'Terminal command',
    cerrar: 'Close',
    toca: 'tap a command or type',
    volver: 'Back to desktop',
    escritorioAria: 'nicOS desktop',
    ventanas: { leeme: 'Read me', proyectos: 'Projects', terminal: 'Terminal', correo: 'Mail', cv: 'CV' },
    arranque: {
      lineas: ['mounting /projects ... ok', 'loading hedera.ko ... ok', 'brewing coffee ... ok', 'starting nico ... ready'],
      saltar: 'press any key to skip',
      saltarToque: 'tap to skip',
    },
    cvPropio: 'English version (PDF)',
    verEnPagina: 'See it on the page',
    comandos: {
      ayuda: 'Available commands:',
      ayudaPie: 'Tab completes, ↑ ↓ browse history. There are a couple of easter eggs.',
      descripciones: {
        ayuda: 'this list',
        whoami: 'who is behind this',
        proyectos: 'systems and projects, with links',
        cv: 'download my CV',
        tacano: 'my open source plugin for Claude Code',
        hedera: 'my work in the Hedera community',
        contacto: 'how to reach me',
        ls: 'list the windows',
        abrir: 'open <window>: readme, projects, terminal, mail, cv',
        tema: 'switch light and dark theme',
        idioma: 'switch to the Spanish page',
        limpiar: 'clear the screen',
        salir: 'shut nicOS down',
      },
      whoami: 'Juan Nicolás García · full-stack engineer · Bucaramanga, Colombia',
      proyectosSistemas: 'Systems in production (industrial company in Colombia):',
      proyectosPropios: 'On my own:',
      cv: 'Downloading the CV in English…',
      tacano: '−39% tokens over 500 real turns → github.com/Nicolas6879/tacano',
      hedera: 'Ambassador in Colombia · 1st Hedera DevDay CTF · 2nd ETHDenver 2026 bounty',
      contacto: 'Reach me on LinkedIn or by email; both are in the Mail window (type: open mail).',
      desconocido: 'Command not found. Type help',
      abrirUso: 'Usage: open <window>. Windows: readme, projects, terminal, mail, cv',
      abriendo: 'Opening {n}…',
      abrirNoExiste: 'No such window: {n}',
      tema: 'Theme switched.',
      idioma: 'Cambiando a español…',
      salir: 'Shutting down nicOS. See you!',
      salirFuera: 'This terminal is not inside the desktop. Press "Boot nicOS" to start it.',
      sudo: 'Permission granted. Best decision of the day. Opening Mail…',
      sudoOtro: 'nico is not in the sudoers file. This incident will be reported. (Try: sudo hire nico)',
      cafe: ['    ( (', '     ) )', '  ........', '  |      |]', '  \\      /', "   `----'", 'One coffee, served. Compiling with 100% more energy.'],
    },
  },
}
