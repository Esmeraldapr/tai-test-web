// Iconos visuales sencillos y literales (nada abstracto) que acompañan la
// explicación de cada pregunta, para ayudar a la comprensión de la persona
// que está estudiando. Un icono por TEMA (no por pregunta individual):
// todas las preguntas del mismo tema muestran el mismo icono.
//
// Cada icono es un pictograma simple de una sola idea reconocible
// (un libro, un candado, una pantalla...), en trazo grueso y colores
// planos, pensado para que se entienda de un vistazo sin tener que leer.

const ICONOS_SVG = {
  libro: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="12" width="48" height="40" rx="4" fill="#e8f0fe" stroke="#3b5bdb" stroke-width="3"/><line x1="32" y1="12" x2="32" y2="52" stroke="#3b5bdb" stroke-width="3"/><line x1="14" y1="22" x2="26" y2="22" stroke="#3b5bdb" stroke-width="2.5"/><line x1="14" y1="30" x2="26" y2="30" stroke="#3b5bdb" stroke-width="2.5"/><line x1="38" y1="22" x2="50" y2="22" stroke="#3b5bdb" stroke-width="2.5"/><line x1="38" y1="30" x2="50" y2="30" stroke="#3b5bdb" stroke-width="2.5"/></svg>`,

  balanza: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="32" y1="10" x2="32" y2="50" stroke="#3b5bdb" stroke-width="3"/><line x1="14" y1="18" x2="50" y2="18" stroke="#3b5bdb" stroke-width="3"/><path d="M14 18 L6 34 A9 9 0 0 0 22 34 Z" fill="#e8f0fe" stroke="#3b5bdb" stroke-width="2.5"/><path d="M50 18 L42 34 A9 9 0 0 0 58 34 Z" fill="#e8f0fe" stroke="#3b5bdb" stroke-width="2.5"/><rect x="20" y="50" width="24" height="6" rx="2" fill="#3b5bdb"/></svg>`,

  escudo: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 6 L54 14 V30 C54 44 44 54 32 58 C20 54 10 44 10 30 V14 Z" fill="#e6f7ee" stroke="#1f9d55" stroke-width="3"/><path d="M22 32 L29 39 L43 24" stroke="#1f9d55" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  candado: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="28" width="36" height="28" rx="4" fill="#fff4e6" stroke="#e8590c" stroke-width="3"/><path d="M20 28 V18 a12 12 0 0 1 24 0 v10" stroke="#e8590c" stroke-width="3.5" fill="none"/><circle cx="32" cy="40" r="4" fill="#e8590c"/><line x1="32" y1="44" x2="32" y2="50" stroke="#e8590c" stroke-width="3" stroke-linecap="round"/></svg>`,

  llave: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="32" r="12" fill="#fff4e6" stroke="#e8590c" stroke-width="3"/><circle cx="20" cy="32" r="4" fill="#e8590c"/><line x1="31" y1="32" x2="56" y2="32" stroke="#e8590c" stroke-width="4" stroke-linecap="round"/><line x1="46" y1="32" x2="46" y2="40" stroke="#e8590c" stroke-width="4" stroke-linecap="round"/><line x1="54" y1="32" x2="54" y2="40" stroke="#e8590c" stroke-width="4" stroke-linecap="round"/></svg>`,

  red: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="14" r="6" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/><circle cx="12" cy="50" r="6" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/><circle cx="52" cy="50" r="6" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/><line x1="32" y1="20" x2="14" y2="45" stroke="#1971c2" stroke-width="3"/><line x1="32" y1="20" x2="50" y2="45" stroke="#1971c2" stroke-width="3"/><line x1="18" y1="50" x2="46" y2="50" stroke="#1971c2" stroke-width="3"/></svg>`,

  ordenador: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="12" width="48" height="32" rx="3" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/><line x1="8" y1="38" x2="56" y2="38" stroke="#1971c2" stroke-width="2"/><line x1="24" y1="50" x2="40" y2="50" stroke="#1971c2" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="44" x2="32" y2="50" stroke="#1971c2" stroke-width="3"/></svg>`,

  movil: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="6" width="24" height="52" rx="4" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/><line x1="26" y1="48" x2="38" y2="48" stroke="#1971c2" stroke-width="3" stroke-linecap="round"/></svg>`,

  base_datos: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="14" rx="20" ry="7" fill="#f3f0ff" stroke="#7048e8" stroke-width="3"/><path d="M12 14 V50 C12 53.8 20.9 57 32 57 C43.1 57 52 53.8 52 50 V14" stroke="#7048e8" stroke-width="3" fill="none"/><path d="M12 32 C12 35.8 20.9 39 32 39 C43.1 39 52 35.8 52 32" stroke="#7048e8" stroke-width="3" fill="none"/></svg>`,

  codigo: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 18 L8 32 L22 46" stroke="#c2255c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M42 18 L56 32 L42 46" stroke="#c2255c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="36" y1="14" x2="28" y2="50" stroke="#c2255c" stroke-width="3.5" stroke-linecap="round"/></svg>`,

  engranaje: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="10" fill="#fff9db" stroke="#f08c00" stroke-width="3"/><g stroke="#f08c00" stroke-width="4" stroke-linecap="round"><line x1="32" y1="6" x2="32" y2="14"/><line x1="32" y1="50" x2="32" y2="58"/><line x1="6" y1="32" x2="14" y2="32"/><line x1="50" y1="32" x2="58" y2="32"/><line x1="13" y1="13" x2="19" y2="19"/><line x1="45" y1="45" x2="51" y2="51"/><line x1="51" y1="13" x2="45" y2="19"/><line x1="19" y1="45" x2="13" y2="51"/></g></svg>`,

  servidor: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="8" width="44" height="16" rx="3" fill="#e6fcf5" stroke="#0ca678" stroke-width="3"/><rect x="10" y="28" width="44" height="16" rx="3" fill="#e6fcf5" stroke="#0ca678" stroke-width="3"/><rect x="10" y="48" width="44" height="10" rx="3" fill="#e6fcf5" stroke="#0ca678" stroke-width="3"/><circle cx="18" cy="16" r="2.5" fill="#0ca678"/><circle cx="18" cy="36" r="2.5" fill="#0ca678"/></svg>`,

  nube: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 44 a10 10 0 0 1 -2 -19.8 a13 13 0 0 1 25 -4.6 a10.5 10.5 0 0 1 13 10.2 a9.2 9.2 0 0 1 -3 18.2 Z" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/></svg>`,

  correo: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="16" width="48" height="32" rx="4" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/><path d="M10 18 L32 36 L54 18" stroke="#1971c2" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,

  grafico: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="10" y1="54" x2="10" y2="10" stroke="#495057" stroke-width="3" stroke-linecap="round"/><line x1="10" y1="54" x2="56" y2="54" stroke="#495057" stroke-width="3" stroke-linecap="round"/><rect x="18" y="34" width="8" height="20" fill="#4dabf7"/><rect x="30" y="24" width="8" height="30" fill="#4dabf7"/><rect x="42" y="14" width="8" height="40" fill="#4dabf7"/></svg>`,

  diagrama_flujo: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="20" height="14" rx="3" fill="#fff0f6" stroke="#d6336c" stroke-width="2.5"/><rect x="36" y="26" width="20" height="14" rx="3" fill="#fff0f6" stroke="#d6336c" stroke-width="2.5"/><rect x="8" y="44" width="20" height="14" rx="3" fill="#fff0f6" stroke="#d6336c" stroke-width="2.5"/><path d="M18 22 V51 H36" stroke="#d6336c" stroke-width="2.5" fill="none"/><path d="M28 15 H46 V26" stroke="#d6336c" stroke-width="2.5" fill="none"/></svg>`,

  personas: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="20" r="8" fill="#fff0f6" stroke="#d6336c" stroke-width="3"/><path d="M8 52 C8 40 36 40 36 52" stroke="#d6336c" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="44" cy="24" r="7" fill="#fff0f6" stroke="#d6336c" stroke-width="3"/><path d="M33 52 C33 43 55 43 55 52" stroke="#d6336c" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,

  globo: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="24" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/><ellipse cx="32" cy="32" rx="10" ry="24" fill="none" stroke="#1971c2" stroke-width="2.5"/><line x1="8" y1="32" x2="56" y2="32" stroke="#1971c2" stroke-width="2.5"/><path d="M12 20 h40 M12 44 h40" stroke="#1971c2" stroke-width="2.2" fill="none"/></svg>`,

  telefono: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 10 C14 34 30 50 54 50 L54 40 L42 36 L37 44 C29 40 24 35 20 27 L28 22 L24 10 Z" fill="#e6fcf5" stroke="#0ca678" stroke-width="3" stroke-linejoin="round"/></svg>`,

  carpeta: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 16 h16 l6 8 h26 v30 a3 3 0 0 1 -3 3 H11 a3 3 0 0 1 -3 -3 Z" fill="#fff9db" stroke="#f08c00" stroke-width="3" stroke-linejoin="round"/></svg>`,

  capas: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="32,8 56,20 32,32 8,20" fill="#f3f0ff" stroke="#7048e8" stroke-width="2.5"/><polygon points="8,32 32,44 56,32" fill="none" stroke="#7048e8" stroke-width="2.5"/><polygon points="8,46 32,58 56,46" fill="none" stroke="#7048e8" stroke-width="2.5"/></svg>`,

  camion_datos: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="24" width="30" height="20" rx="2" fill="#e6fcf5" stroke="#0ca678" stroke-width="3"/><path d="M36 30 h12 l8 8 v6 h-20 Z" fill="#e6fcf5" stroke="#0ca678" stroke-width="3"/><circle cx="18" cy="48" r="5" fill="#fff" stroke="#0ca678" stroke-width="3"/><circle cx="46" cy="48" r="5" fill="#fff" stroke="#0ca678" stroke-width="3"/></svg>`,

  monitor_codigo: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="10" width="48" height="34" rx="3" fill="#212529" stroke="#495057" stroke-width="3"/><text x="14" y="30" font-size="13" fill="#51cf66" font-family="monospace">&lt;/&gt;</text><line x1="24" y1="50" x2="40" y2="50" stroke="#495057" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="44" x2="32" y2="50" stroke="#495057" stroke-width="3"/></svg>`,

  reloj: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="24" fill="#fff9db" stroke="#f08c00" stroke-width="3"/><line x1="32" y1="32" x2="32" y2="16" stroke="#f08c00" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="32" x2="44" y2="38" stroke="#f08c00" stroke-width="3" stroke-linecap="round"/></svg>`,

  chip: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="18" width="28" height="28" rx="3" fill="#fff0f6" stroke="#d6336c" stroke-width="3"/><g stroke="#d6336c" stroke-width="2.5"><line x1="24" y1="8" x2="24" y2="18"/><line x1="32" y1="8" x2="32" y2="18"/><line x1="40" y1="8" x2="40" y2="18"/><line x1="24" y1="46" x2="24" y2="56"/><line x1="32" y1="46" x2="32" y2="56"/><line x1="40" y1="46" x2="40" y2="56"/><line x1="8" y1="24" x2="18" y2="24"/><line x1="8" y1="32" x2="18" y2="32"/><line x1="8" y1="40" x2="18" y2="40"/><line x1="46" y1="24" x2="56" y2="24"/><line x1="46" y1="32" x2="56" y2="32"/><line x1="46" y1="40" x2="56" y2="40"/></g></svg>`,

  huella: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 10 C20 10 14 20 14 30 C14 42 20 50 20 56" stroke="#7048e8" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M32 10 C44 10 50 20 50 30 C50 42 44 50 44 56" stroke="#7048e8" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M32 16 C26 16 22 22 22 30 C22 40 26 46 26 52" stroke="#7048e8" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M32 16 C38 16 42 22 42 30 C42 40 38 46 38 52" stroke="#7048e8" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`,

  lista: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="16" r="3.5" fill="#1971c2"/><circle cx="14" cy="32" r="3.5" fill="#1971c2"/><circle cx="14" cy="48" r="3.5" fill="#1971c2"/><line x1="24" y1="16" x2="54" y2="16" stroke="#1971c2" stroke-width="3.5" stroke-linecap="round"/><line x1="24" y1="32" x2="54" y2="32" stroke="#1971c2" stroke-width="3.5" stroke-linecap="round"/><line x1="24" y1="48" x2="54" y2="48" stroke="#1971c2" stroke-width="3.5" stroke-linecap="round"/></svg>`,

  puzzle: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 10 h18 v6 a5 5 0 0 1 8 0 v-6 h18 v18 h-6 a5 5 0 0 0 0 8 h6 v18 h-18 v-6 a5 5 0 0 0 -8 0 v6 h-18 v-18 h6 a5 5 0 0 0 0 -8 h-6 Z" fill="#fff0f6" stroke="#d6336c" stroke-width="3" stroke-linejoin="round"/></svg>`,

  router: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="32" width="48" height="16" rx="3" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/><circle cx="18" cy="40" r="2.5" fill="#1971c2"/><circle cx="26" cy="40" r="2.5" fill="#1971c2"/><line x1="20" y1="32" x2="20" y2="22" stroke="#1971c2" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="32" x2="32" y2="18" stroke="#1971c2" stroke-width="3" stroke-linecap="round"/><line x1="44" y1="32" x2="44" y2="22" stroke="#1971c2" stroke-width="3" stroke-linecap="round"/></svg>`,

  banderas: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="16" y1="8" x2="16" y2="56" stroke="#495057" stroke-width="3" stroke-linecap="round"/><path d="M16 12 h30 l-8 9 l8 9 h-30 Z" fill="#ffd43b" stroke="#f08c00" stroke-width="2.5" stroke-linejoin="round"/></svg>`,

  balanza_igualdad: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="18" r="9" fill="#fff0f6" stroke="#d6336c" stroke-width="3"/><circle cx="44" cy="18" r="9" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/><line x1="20" y1="27" x2="20" y2="46" stroke="#495057" stroke-width="3" stroke-linecap="round"/><line x1="44" y1="27" x2="44" y2="46" stroke="#495057" stroke-width="3" stroke-linecap="round"/><line x1="10" y1="52" x2="54" y2="52" stroke="#495057" stroke-width="3" stroke-linecap="round"/></svg>`,

  generico: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="24" fill="#f1f3f5" stroke="#868e96" stroke-width="3"/><text x="32" y="41" font-size="26" text-anchor="middle" fill="#868e96" font-family="sans-serif" font-weight="bold">?</text></svg>`,
};

// Qué icono le corresponde a cada tema. La clave es "MATERIA|TEMA" tal cual
// aparecen en la columna `tema` de Supabase.
const ICONO_POR_TEMA = {
  // BLOQUE 1: DERECHO
  "BLOQUE 1: DERECHO|Constitución Española": "balanza",
  "BLOQUE 1: DERECHO|eIDAS, Firma y DNIe": "huella",
  "BLOQUE 1: DERECHO|Gobierno Abierto": "globo",
  "BLOQUE 1: DERECHO|Ley de Transparencia Ley 19/2013": "lista",
  "BLOQUE 1: DERECHO|Ley 39/2015": "libro",
  "BLOQUE 1: DERECHO|LO 3/2007 Igualdad": "balanza_igualdad",
  "BLOQUE 1: DERECHO|TREBEP": "personas",
  "BLOQUE 1: DERECHO|Promoción Profesional": "personas",
  "BLOQUE 1: DERECHO|Agenda 2030 y ODS": "globo",
  "BLOQUE 1: DERECHO|ENI, ENS y Servicios Comunes": "escudo",
  "BLOQUE 1: DERECHO|Ley 40/2015 - Funcionamiento y Convenios": "libro",
  "BLOQUE 1: DERECHO|Sociedad Información y Firma": "huella",
  "BLOQUE 1: DERECHO|RD 1118/2024 (Agencia Digital)": "libro",
  "BLOQUE 1: DERECHO|España Digital 2025/2026": "banderas",
  "BLOQUE 1: DERECHO|Ley 39/2006 y RDL 1/2013 Dependencia y Discapacidad": "personas",
  "BLOQUE 1: DERECHO|Ley 4/2023 (LGTBI)": "balanza_igualdad",
  "BLOQUE 1: DERECHO|Ley del Gobierno Ley 50/1997": "libro",
  "BLOQUE 1: DERECHO|Leyes 39 y 40/2015": "libro",
  "BLOQUE 1: DERECHO|LO 1/2004 (Violencia de Género)": "escudo",
  "BLOQUE 1: DERECHO|LOPDGDD (Ley 3/2018)": "candado",
  "BLOQUE 1: DERECHO|RD 1125/2024 (Organización)": "libro",
  "BLOQUE 1: DERECHO|RD 203/2021 (Reglamento)": "libro",
  "BLOQUE 1: DERECHO|RD 255/2025 (DNI)": "huella",

  // BLOQUE 2: TECNOLOGÍA
  "BLOQUE 2: TECNOLOGÍA|Teoría de SSOO": "ordenador",
  "BLOQUE 2: TECNOLOGÍA|Estructuras de datos": "diagrama_flujo",
  "BLOQUE 2: TECNOLOGÍA|NoSQL y Big Data": "base_datos",
  "BLOQUE 2: TECNOLOGÍA|Repaso Integrado": "lista",
  "BLOQUE 2: TECNOLOGÍA|Algoritmos": "diagrama_flujo",
  "BLOQUE 2: TECNOLOGÍA|Periféricos": "ordenador",
  "BLOQUE 2: TECNOLOGÍA|Informática Básica": "ordenador",
  "BLOQUE 2: TECNOLOGÍA|Windows y Móviles": "movil",

  // BLOQUE 3: DESARROLLO
  "BLOQUE 3: DESARROLLO|JAVA": "codigo",
  "BLOQUE 3: DESARROLLO|UML y POO": "diagrama_flujo",
  "BLOQUE 3: DESARROLLO|Tecnologías Front y Back": "monitor_codigo",
  "BLOQUE 3: DESARROLLO|Cliente/Servidor": "servidor",
  "BLOQUE 3: DESARROLLO|Diseño de Bases de Datos": "base_datos",
  "BLOQUE 3: DESARROLLO|SQL": "base_datos",
  "BLOQUE 3: DESARROLLO|CSS3": "monitor_codigo",
  "BLOQUE 3: DESARROLLO|Metodologías": "puzzle",
  "BLOQUE 3: DESARROLLO|Arquitectura JEE": "capas",
  "BLOQUE 3: DESARROLLO|XML": "codigo",
  "BLOQUE 3: DESARROLLO|Patrones de Diseño": "puzzle",
  "BLOQUE 3: DESARROLLO|Plataforma .NET": "codigo",
  "BLOQUE 3: DESARROLLO|Modelo E/R y DFD": "diagrama_flujo",
  "BLOQUE 3: DESARROLLO|Accesibilidad Web": "personas",

  // BLOQUE 4: SISTEMAS Y COMUNICACIONES
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Linux": "monitor_codigo",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|HTTPS y Criptografía": "candado",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|TCP/IP": "red",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Redes de Conmutación": "router",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Redes LAN y medios": "red",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Administración de Sistemas": "engranaje",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Virtualización y Cloud": "nube",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Seguridad de la Información": "escudo",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Seguridad en Redes y VPN": "candado",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Administración de BBDD": "base_datos",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Microservicios": "capas",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Redes Móviles": "telefono",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Administración de Redes": "router",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES|Correo Electrónico": "correo",

  // FUNDAMENTOS 1: INFORMÁTICA
  "FUNDAMENTOS 1: INFORMÁTICA|Arquitectura de Computadoras": "chip",
  "FUNDAMENTOS 1: INFORMÁTICA|Lenguajes y Bases de Datos": "base_datos",
  "FUNDAMENTOS 1: INFORMÁTICA|Conceptos Generales": "ordenador",
  "FUNDAMENTOS 1: INFORMÁTICA|Sistemas Digitales": "chip",

  // FUNDAMENTOS 2: PROGRAMACIÓN
  "FUNDAMENTOS 2: PROGRAMACIÓN|Conceptos Generales": "codigo",
  "FUNDAMENTOS 2: PROGRAMACIÓN|Lenguajes de Programación": "codigo",
  "FUNDAMENTOS 2: PROGRAMACIÓN|Proceso de Desarrollo": "diagrama_flujo",

  // FUNDAMENTOS 3: REDES
  "FUNDAMENTOS 3: REDES|Tipos de Redes": "red",
  "FUNDAMENTOS 3: REDES|Conceptos Generales": "red",
  "FUNDAMENTOS 3: REDES|TCP/IP": "red",

  // FUNDAMENTOS 4: BASES DE DATOS
  "FUNDAMENTOS 4: BASES DE DATOS|Diseño de Bases de Datos y Paradigmas": "base_datos",
  "FUNDAMENTOS 4: BASES DE DATOS|Modelo Conceptual: Entidades y Atributos": "diagrama_flujo",
  "FUNDAMENTOS 4: BASES DE DATOS|SQL: CREATE TABLE, CRUD y Restricciones": "base_datos",
  "FUNDAMENTOS 4: BASES DE DATOS|Relaciones, Cardinalidad y Diagramas ER": "diagrama_flujo",
  "FUNDAMENTOS 4: BASES DE DATOS|SQL: JOIN, GROUP BY y HAVING": "base_datos",

  // FUNDAMENTOS 5: SSOO
  "FUNDAMENTOS 5: SSOO|Virtualización": "capas",
  "FUNDAMENTOS 5: SSOO|Gestión de Procesos": "engranaje",
  "FUNDAMENTOS 5: SSOO|Gestión de Ficheros": "carpeta",
  "FUNDAMENTOS 5: SSOO|Gestor de Memoria": "chip",
  "FUNDAMENTOS 5: SSOO|Introducción a SSOO": "ordenador",
  "FUNDAMENTOS 5: SSOO|Familias de Sistemas Operativos": "ordenador",
};

// Devuelve el HTML del icono (envuelto en su cajita) para una pregunta dada,
// o cadena vacía si no hay icono para ese tema.
function iconoExplicacionHtml(materia, tema) {
  const clave = ICONO_POR_TEMA[materia + "|" + tema];
  const svg = ICONOS_SVG[clave] || ICONOS_SVG.generico;
  return `<div class="icono-explicacion" aria-hidden="true">${svg}</div>`;
}
