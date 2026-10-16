// ============================================================
// Dibujos neón de cada tema (Test por temas), hechos con código:
// sin imágenes externas ni licencias. Una función por tema.
// imagenTema(materia, tema) devuelve el <svg> listo para pintar.
// Si aparece un tema nuevo sin dibujo, sale uno genérico del bloque.
// ============================================================

const TI_COL = {
  m: "#36ECDE", v: "#a855f7", a: "#3b82f6", r: "#ec4899",
  y: "#fbbf24", t: "#14b8a6", w: "#e0f7ff", n: "#00203F",
};

// --- Piezas básicas ---
function tiR(x, y, w, h, c, rx = 6, extra = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" stroke="${TI_COL[c]}" ${extra}/>`;
}
function tiO(x, y, r, c, relleno) {
  return `<circle cx="${x}" cy="${y}" r="${r}" stroke="${TI_COL[c]}"${relleno ? ` fill="${TI_COL[relleno]}"` : ""}/>`;
}
function tiE(x, y, rx, ry, c) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" stroke="${TI_COL[c]}"/>`;
}
function tiP(d, c, extra = "") {
  return `<path d="${d}" stroke="${TI_COL[c]}" ${extra}/>`;
}
function tiT(x, y, texto, c, tam = 12, ancla = "middle", mono = false) {
  return `<text x="${x}" y="${y}" fill="${TI_COL[c]}" stroke="none" font-size="${tam}" text-anchor="${ancla}"${mono ? ` font-family="ui-monospace,Consolas,Menlo,monospace"` : ""}>${texto}</text>`;
}
function tiCil(x, y, w, h, c) {
  const rx = w / 2, ry = w / 6;
  return tiE(x + rx, y, rx, ry, c) +
    tiP(`M${x} ${y}v${h}a${rx} ${ry} 0 0 0 ${w} 0v-${h}`, c) +
    tiP(`M${x} ${y + h / 2}a${rx} ${ry} 0 0 0 ${w} 0`, c);
}
function tiEngranaje(cx, cy, r, c) {
  let d = "";
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    d += `M${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}L${(cx + Math.cos(a) * (r + 8)).toFixed(1)} ${(cy + Math.sin(a) * (r + 8)).toFixed(1)}`;
  }
  return tiP(d, c, `stroke-width="6"`) + tiO(cx, cy, r, c) + tiO(cx, cy, r / 2.6, c);
}
function tiCandado(x, y, w, c) {
  const h = w * 0.8, rr = w * 0.3;
  return tiR(x, y, w, h, c, 5) +
    tiP(`M${x + w / 2 - rr} ${y}v-${rr * 0.7}a${rr} ${rr} 0 0 1 ${rr * 2} 0v${rr * 0.7}`, c) +
    tiO(x + w / 2, y + h * 0.42, w * 0.08, "y");
}
function tiPersonaAccesible(cx, cy, r, c) {
  return tiO(cx, cy, r, c) + tiO(cx, cy - r * 0.6, r * 0.15, c) +
    tiP(`M${cx - r * 0.65} ${cy - r * 0.25}h${r * 1.3}M${cx} ${cy - r * 0.3}v${r * 0.6}l-${r * 0.35} ${r * 0.65}M${cx} ${cy + r * 0.3}l${r * 0.35} ${r * 0.65}`, c);
}
function tiCodigo(x, y, w, h, c, lineas, titulo) {
  let s = tiR(x, y, w, h, c, 8) + tiP(`M${x} ${y + 16}h${w}`, c) +
    tiO(x + 10, y + 8, 2.5, "r", "r") + tiO(x + 19, y + 8, 2.5, "y", "y") + tiO(x + 28, y + 8, 2.5, "m", "m");
  if (titulo) s += tiT(x + w - 10, y + 12, titulo, c, 9, "end");
  lineas.forEach(([txt, col], i) => { s += tiT(x + 12, y + 36 + i * 19, txt, col, 12, "start", true); });
  return s;
}

// Fondo común: circuitos suaves a los lados
const TI_FONDO =
  `<g stroke="#36ECDE" stroke-width="1" opacity=".22" fill="none">` +
  `<path d="M0 28h26l10 10h18M0 112h34l12-12h12M320 24h-26l-10 10h-16M320 108h-32l-10 10h-18M0 70h14M320 66h-12"/>` +
  `<circle cx="56" cy="38" r="2.5"/><circle cx="60" cy="100" r="2.5"/><circle cx="266" cy="34" r="2.5"/><circle cx="258" cy="118" r="2.5"/>` +
  `</g>`;

function tiSvg(contenido) {
  return `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">` +
    TI_FONDO +
    `<g fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" font-family="system-ui,'Segoe UI',Arial,sans-serif" font-weight="700">` +
    contenido + `</g></svg>`;
}

// --- Dibujos por tema ---
const TI_DIBUJOS = {
  // ===== BLOQUE 1: DERECHO =====
  "Constitución Española": () =>
    tiP("M108 50 L160 24 L212 50 Z", "m") + tiR(106, 50, 108, 6, "m", 2) +
    [118, 138, 158, 178, 198].map((x) => tiR(x - 2, 60, 8, 38, "a", 2)).join("") +
    tiR(102, 100, 116, 8, "m", 2) + tiT(160, 128, "CE · 1978", "y", 13),

  "eIDAS, Firma y DNIe": () =>
    tiR(80, 34, 116, 74, "a", 8) + tiR(92, 48, 24, 18, "y", 3) + tiP("M92 57h24M104 48v18", "y") +
    tiP("M126 52h56M126 64h40", "a") + tiP("M98 92c10-18 16 8 26-4s12 10 22-6s10 8 20-2", "r") +
    tiO(232, 66, 22, "m") + tiP("M222 66l7 7 14-15", "m") + tiT(160, 128, "eIDAS · Firma electrónica", "w", 11),

  "Gobierno Abierto": () =>
    tiO(100, 60, 24, "m") + tiP("M86 60q14-13 28 0q-14 13-28 0", "m") + tiO(100, 60, 4, "m", "m") +
    tiO(160, 60, 24, "v") + tiR(146, 48, 28, 19, "v", 5) + tiP("M152 67l-3 7 9-7", "v") +
    tiO(220, 60, 24, "r") + tiR(204, 54, 18, 12, "r", 6) + tiR(218, 54, 18, 12, "r", 6) +
    tiP("M124 60h12M184 60h12", "y") + tiT(160, 112, "Transparencia · Participación · Colaboración", "w", 10),

  "Ley de Transparencia Ley 19/2013": () =>
    tiR(108, 22, 70, 90, "a", 6) + tiP("M120 42h46M120 55h46M120 68h30M120 81h38", "a") +
    tiO(186, 82, 22, "m") + tiP("M202 98l18 18", "m", `stroke-width="5"`) + tiT(160, 132, "Ley 19/2013", "y", 12),

  "Ley 39/2015": () =>
    [["m", "Inicio"], ["a", "Ordenación"], ["v", "Instrucción"], ["r", "Finalización"]]
      .map(([c, t], i) => tiR(26 + i * 70, 48, 60, 32, c, 6) + tiT(56 + i * 70, 68, t, c, 9)).join("") +
    tiP("M86 64h10M156 64h10M226 64h10", "w") + tiT(160, 112, "Procedimiento administrativo común", "y", 11),

  "LO 3/2007 Igualdad": () =>
    tiT(160, 36, "=", "y", 30) + tiP("M160 44v56M136 100h48M98 50h124", "m") +
    tiP("M100 50l-18 28M100 50l18 28M220 50l-18 28M220 50l18 28", "a") +
    tiP("M80 78Q100 94 120 78ZM200 78Q220 94 240 78Z", "v") + tiT(160, 128, "LO 3/2007 · Igualdad", "w", 12),

  "TREBEP": () =>
    tiR(112, 44, 96, 62, "m", 8) + tiP("M144 44v-10h32v10", "m") + tiP("M112 68h96", "a") + tiR(152, 62, 16, 13, "y", 3) +
    tiT(160, 128, "TREBEP · Empleo público", "w", 12),

  "Promoción Profesional": () =>
    tiP("M70 108h44v-22h44v-22h44v-22h44", "m") + tiP("M84 96L232 30", "y") + tiP("M216 28h16v16", "y") +
    tiO(92, 74, 7, "v") + tiP("M92 81v12", "v") + tiT(160, 130, "Carrera y promoción", "w", 11),

  "Agenda 2030 y ODS": () => {
    const cs = ["r", "y", "m", "a", "v", "t"];
    let s = "";
    for (let i = 0; i < 17; i++) {
      const a1 = (2 * Math.PI * i) / 17 - Math.PI / 2, a2 = a1 + (2 * Math.PI) / 17 - 0.08;
      const p = (r, a) => `${(160 + Math.cos(a) * r).toFixed(1)} ${(58 + Math.sin(a) * r).toFixed(1)}`;
      s += tiP(`M${p(42, a1)}A42 42 0 0 1 ${p(42, a2)}`, cs[i % 6], `stroke-width="12" stroke-linecap="butt"`);
    }
    return s + tiT(160, 63, "17", "w", 16) + tiT(160, 126, "Agenda 2030 · ODS", "w", 12);
  },

  "ENI, ENS y Servicios Comunes": () =>
    tiP("M110 26L140 36V66Q140 92 110 104Q80 92 80 66V36Z", "m") + tiP("M97 64l9 9 17-18", "m") +
    tiO(198, 64, 22, "a") + tiO(226, 64, 22, "v") + tiT(110, 128, "ENS", "m", 12) + tiT(212, 128, "ENI", "a", 12),

  "Ley 40/2015 - Funcionamiento y Convenios": () =>
    tiR(68, 52, 50, 48, "a", 3) + tiP("M64 52L93 34L122 52", "a") + tiP("M80 66v20M93 66v20M106 66v20", "a") +
    tiR(202, 52, 50, 48, "v", 3) + tiP("M198 52L227 34L256 52", "v") + tiP("M214 66v20M227 66v20M240 66v20", "v") +
    tiR(140, 46, 40, 52, "y", 4) + tiP("M148 60h24M148 70h24M148 80h16", "y") + tiP("M118 76h22M180 76h22", "m") +
    tiT(160, 126, "Ley 40/2015 · Convenios", "w", 12),

  "Sociedad Información y Firma": () =>
    tiO(122, 62, 34, "a") + tiP("M88 62h68M122 28v68M122 28Q100 62 122 96Q144 62 122 28", "a") +
    tiP("M196 96L228 40L242 48L210 104Z", "m") + tiP("M196 96L192 112L210 104", "m") +
    tiP("M178 122c10-10 18 6 28-4s14 6 24-2", "r") + tiT(122, 124, "LSSI", "y", 12),

  "RD 1118/2024 (Agencia Digital)": () =>
    tiR(96, 56, 80, 48, "a", 3) + tiP("M90 56L136 32L182 56", "a") + tiP("M112 70v22M128 70v22M144 70v22M160 70v22", "a") +
    tiR(208, 46, 40, 40, "m", 5) + tiR(218, 56, 20, 20, "m", 3) +
    tiP("M216 46v-8M228 46v-8M240 46v-8M216 86v8M228 86v8M240 86v8M208 56h-8M208 76h-8M248 56h8M248 76h8", "m") +
    tiP("M176 70h24", "y") + tiT(160, 128, "Administración Digital", "w", 12),

  "España Digital 2025/2026": () =>
    tiR(84, 86, 18, 26, "a", 2) + tiR(114, 70, 18, 42, "v", 2) + tiR(144, 54, 18, 58, "m", 2) + tiR(174, 38, 18, 74, "r", 2) +
    tiP("M210 58q20-18 40 0M218 67q12-10 24 0", "y") + tiO(230, 77, 3, "y", "y") + tiT(160, 132, "España Digital 2026", "w", 12),

  "Ley 39/2006 y RDL 1/2013 Dependencia y Discapacidad": () =>
    tiPersonaAccesible(128, 62, 36, "m") +
    tiP("M222 56c-8-14-30-6-22 10l22 22 22-22c8-16-14-24-22-10z", "r") +
    tiT(160, 126, "Dependencia y discapacidad", "w", 11),

  "Ley 4/2023 (LGTBI)": () => {
    const cs = ["#ef4444", "#f97316", "#fbbf24", "#22c55e", "#3b82f6", "#a855f7"];
    return cs.map((c, i) => {
      const r = 72 - i * 9;
      return `<path d="M${160 - r} 104A${r} ${r} 0 0 1 ${160 + r} 104" stroke="${c}" stroke-width="6"/>`;
    }).join("") + tiT(160, 128, "Ley 4/2023", "w", 12);
  },

  "Ley del Gobierno Ley 50/1997": () => {
    let s = tiE(160, 68, 62, 24, "m") + tiT(160, 72, "Consejo", "y", 11);
    for (let i = 0; i < 10; i++) {
      const a = (2 * Math.PI * i) / 10;
      s += tiO((160 + Math.cos(a) * 82).toFixed(1), (68 + Math.sin(a) * 38).toFixed(1), 7, i % 2 ? "a" : "v", "n");
    }
    return s + tiT(160, 130, "Ley 50/1997 · Gobierno", "w", 12);
  },

  "Leyes 39 y 40/2015": () =>
    tiR(92, 26, 58, 78, "m", 6) + tiT(121, 74, "39", "m", 26) +
    tiR(170, 26, 58, 78, "v", 6) + tiT(199, 74, "40", "v", 26) +
    tiP("M150 62h20", "y") + tiT(160, 128, "Leyes 39 y 40/2015", "w", 12),

  "LO 1/2004 (Violencia de Género)": () =>
    tiP("M160 20L198 32V62Q198 96 160 112Q122 96 122 62V32Z", "v") +
    tiP("M160 82l-16-16c-8-10 4-22 16-12c12-10 24 2 16 12z", "r") + tiT(160, 132, "LO 1/2004 · Teléfono 016", "w", 11),

  "LOPDGDD (Ley 3/2018)": () =>
    tiP("M70 46h36M70 58h36M70 70h36M70 82h36", "a") + tiCandado(132, 58, 56, "m") +
    tiO(238, 52, 10, "v") + tiP("M220 88q18-26 36 0", "v") + tiT(160, 128, "Protección de datos", "w", 12),

  "RD 1125/2024 (Organización)": () =>
    tiR(134, 18, 52, 20, "m", 4) + tiP("M160 38v12M94 50h132M94 50v10M160 50v10M226 50v10", "w") +
    tiR(68, 60, 52, 20, "a", 4) + tiR(134, 60, 52, 20, "v", 4) + tiR(200, 60, 52, 20, "r", 4) +
    tiP("M94 80v10M226 80v10", "w") + tiR(76, 90, 36, 14, "a", 3) + tiR(208, 90, 36, 14, "r", 3) +
    tiT(160, 128, "Organización de la AGE", "w", 11),

  "RD 203/2021 (Reglamento)": () =>
    tiR(78, 22, 164, 88, "a", 8) + tiP("M78 40h164", "a") + tiR(96, 27, 128, 8, "a", 4) +
    tiCandado(146, 58, 28, "m") + tiT(160, 102, "Sede electrónica", "y", 12) + tiT(160, 130, "RD 203/2021", "w", 12),

  "RD 255/2025 (DNI)": () =>
    tiR(84, 26, 152, 88, "m", 10) + tiR(98, 42, 40, 52, "v", 6) + tiO(118, 60, 8, "v") + tiP("M104 90q14-16 28 0", "v") +
    tiP("M150 50h70M150 62h54M150 74h62", "a") + tiR(196, 86, 26, 18, "y", 3) + tiP("M196 95h26M209 86v18", "y") +
    tiT(160, 132, "DNI · RD 255/2025", "w", 11),

  // ===== BLOQUE 2: TECNOLOGÍA =====
  "Teoría de SSOO": () =>
    tiO(160, 66, 50, "a") + tiO(160, 66, 33, "v") + tiO(160, 66, 16, "m") +
    tiT(160, 70, "HW", "m", 10) + tiT(160, 45, "Núcleo", "v", 9) + tiT(160, 29, "Apps", "a", 9) +
    tiT(160, 132, "Sistemas operativos", "w", 11),

  "Estructuras de datos": () => {
    const n = [[160, 26, "8", "m"], [112, 62, "3", "v"], [208, 62, "10", "v"], [86, 100, "1", "r"], [136, 100, "6", "r"], [184, 100, "9", "r"], [232, 100, "14", "r"]];
    const e = "M160 26L112 62M160 26L208 62M112 62L86 100M112 62L136 100M208 62L184 100M208 62L232 100";
    return tiP(e, "a") + n.map(([x, y, t, c]) => tiO(x, y, 12, c, "n") + tiT(x, y + 4, t, "w", 10)).join("");
  },

  "NoSQL y Big Data": () =>
    tiCil(80, 34, 64, 64, "a") + tiT(216, 64, "{ clave:", "m", 15, "middle", true) + tiT(216, 86, "valor }", "m", 15, "middle", true) +
    tiT(160, 130, "NoSQL · Big Data", "w", 12),

  "Repaso Integrado": () =>
    tiP("M200 62a40 40 0 1 1-12-28", "m") + tiP("M186 20l3 15 14-4", "m") + tiP("M140 64l14 14 26-28", "y", `stroke-width="4"`) +
    tiT(160, 130, "Repaso integrado", "w", 11),

  "Algoritmos": () =>
    tiR(130, 10, 60, 20, "m", 10) + tiT(160, 24, "Inicio", "m", 9) + tiP("M160 30v12", "w") +
    tiP("M160 42L192 62L160 82L128 62Z", "y") + tiT(160, 66, "¿x>0?", "y", 9) +
    tiP("M192 62h24v18M128 62h-24v18", "w") + tiR(194, 80, 44, 22, "a", 4) + tiR(82, 80, 44, 22, "v", 4) +
    tiT(216, 95, "Sí", "a", 10) + tiT(104, 95, "No", "v", 10) + tiT(160, 128, "Algoritmos", "w", 11),

  "Periféricos": () =>
    tiR(108, 18, 104, 64, "a", 6) + tiR(116, 26, 88, 48, "a", 3) + tiP("M160 82v12M140 94h40", "a") +
    tiR(88, 104, 110, 20, "m", 4) + tiP("M98 114h90M110 104v20M130 104v20M150 104v20M170 104v20", "m", `stroke-width="1.2"`) +
    tiR(214, 98, 20, 28, "v", 10) + tiP("M224 98v9", "v"),

  "Informática Básica": () =>
    "10110010".split("").map((b, i) => tiR(64 + i * 24, 40, 22, 34, i % 2 ? "a" : "m", 4) + tiT(75 + i * 24, 63, b, i % 2 ? "a" : "m", 15, "middle", true)).join("") +
    tiT(160, 104, "1 byte = 8 bits", "y", 13),

  "Windows y Móviles": () =>
    tiR(64, 28, 128, 82, "a", 6) + tiP("M64 44h128", "a") +
    tiR(80, 54, 26, 18, "m", 2) + tiR(112, 54, 26, 18, "v", 2) + tiR(80, 78, 26, 18, "r", 2) + tiR(112, 78, 26, 18, "y", 2) +
    tiR(212, 24, 46, 90, "m", 9) + tiP("M228 32h14", "m") + tiP("M222 46h26M222 58h26M222 70h18", "m", `stroke-width="1.5"`) + tiO(235, 104, 4, "m"),

  // ===== BLOQUE 3: DESARROLLO =====
  "JAVA": () =>
    tiCodigo(66, 18, 188, 104, "v", [["class Main {", "m"], ["  void run() {", "a"], ["    print(\"Hola\");", "y"], ["  }  }", "m"]], "Java"),

  "UML y POO": () =>
    tiR(124, 14, 72, 42, "m", 3) + tiP("M124 28h72M124 42h72", "m") + tiT(160, 25, "Animal", "m", 9) +
    tiP("M152 66L160 56L168 66Z", "w") + tiP("M160 66v8M104 74h112M104 74v12M216 74v12", "w") +
    tiR(68, 86, 72, 36, "a", 3) + tiP("M68 100h72", "a") + tiT(104, 97, "Perro", "a", 9) +
    tiR(180, 86, 72, 36, "v", 3) + tiP("M180 100h72", "v") + tiT(216, 97, "Gato", "v", 9),

  "Tecnologías Front y Back": () =>
    tiR(56, 30, 84, 64, "a", 6) + tiP("M56 44h84", "a") + tiT(98, 78, "&lt;/&gt;", "m", 16) +
    tiR(188, 26, 64, 72, "v", 6) + tiP("M188 50h64M188 74h64", "v") + tiO(200, 38, 2.5, "m", "m") + tiO(200, 62, 2.5, "m", "m") + tiO(200, 86, 2.5, "m", "m") +
    tiP("M146 54h36M174 48l8 6-8 6", "y") + tiP("M182 72h-36M154 66l-8 6 8 6", "r") +
    tiT(98, 116, "Front", "a", 11) + tiT(220, 116, "Back", "v", 11),

  "Cliente/Servidor": () =>
    tiR(140, 24, 40, 74, "m", 5) + tiP("M140 48h40M140 72h40", "m") + tiO(150, 36, 2.5, "y", "y") + tiO(150, 60, 2.5, "y", "y") + tiO(150, 84, 2.5, "y", "y") +
    tiR(52, 44, 44, 28, "a", 3) + tiP("M46 78h56", "a") + tiR(224, 44, 44, 28, "v", 3) + tiP("M218 78h56", "v") +
    tiP("M102 58h38M180 58h38", "y", `stroke-dasharray="5 5"`) + tiT(160, 124, "Cliente / Servidor", "w", 11),

  "Diseño de Bases de Datos": () => {
    const tabla = (x, c, t, f) => tiR(x, 28, 76, 64, c, 4) + tiP(`M${x} 44h76M${x} 62h76M${x} 78h76`, c) + tiT(x + 38, 40, t, c, 9) +
      tiT(x + 8, 57, "PK id", "y", 8, "start") + tiT(x + 8, 74, f, "w", 8, "start");
    return tabla(56, "a", "CLIENTE", "nombre") + tabla(188, "v", "PEDIDO", "FK cliente") +
      tiP("M132 62h56", "y") + tiT(140, 56, "1", "y", 10) + tiT(180, 56, "N", "y", 10) + tiT(160, 122, "Modelo relacional", "w", 11);
  },

  "SQL": () =>
    tiCodigo(60, 22, 200, 96, "m", [["SELECT nombre", "m"], ["FROM alumnos", "a"], ["WHERE nota >= 5;", "y"]], "SQL"),

  "CSS3": () =>
    tiR(80, 16, 160, 108, "r", 4, `stroke-dasharray="6 4"`) + tiT(88, 28, "margin", "r", 9, "start") +
    tiR(96, 34, 128, 74, "y", 4) + tiT(104, 46, "border", "y", 9, "start") +
    tiR(112, 52, 96, 40, "a", 4) + tiT(120, 63, "padding", "a", 8, "start") +
    tiR(138, 68, 44, 18, "m", 3) + tiT(160, 81, "content", "m", 8),

  "Metodologías": () =>
    tiP("M138 66a30 30 0 1 1-9-21", "m") + tiP("M124 36l5 9 10-3", "m") + tiT(108, 70, "Sprint", "m", 10) +
    tiR(162, 26, 30, 86, "a", 3) + tiR(198, 26, 30, 86, "v", 3) + tiR(234, 26, 30, 86, "r", 3) +
    tiR(167, 36, 20, 12, "y", 2) + tiR(167, 54, 20, 12, "y", 2) + tiR(203, 36, 20, 12, "y", 2) + tiR(239, 36, 20, 12, "y", 2) + tiR(239, 54, 20, 12, "y", 2) +
    tiT(160, 132, "Metodologías", "w", 11),

  "Arquitectura JEE": () =>
    [["a", "Cliente"], ["m", "Web · Servlet / JSP"], ["v", "Negocio · EJB"], ["r", "Datos · JPA"]]
      .map(([c, t], i) => tiR(84, 14 + i * 25, 152, 21, c, 4) + tiT(160, 29 + i * 25, t, c, 10)).join("") +
    tiT(160, 132, "Jakarta EE", "w", 11),

  "XML": () =>
    tiT(84, 40, "&lt;alumno&gt;", "m", 13, "start", true) + tiT(84, 62, "  &lt;nombre&gt;Ana&lt;/nombre&gt;", "a", 13, "start", true) +
    tiT(84, 84, "  &lt;nota&gt;8&lt;/nota&gt;", "v", 13, "start", true) + tiT(84, 106, "&lt;/alumno&gt;", "m", 13, "start", true) +
    tiP("M76 32v80", "y", `stroke-width="1.5"`),

  "Patrones de Diseño": () =>
    tiR(116, 14, 88, 34, "y", 4, `stroke-dasharray="5 4"`) + tiT(160, 27, "«interface»", "y", 8) + tiT(160, 41, "Estrategia", "y", 10) +
    tiP("M153 58L160 48L167 58", "w") + tiP("M160 58v12M104 70h112M104 70v14M216 70v14", "w", `stroke-dasharray="4 4"`) +
    tiR(66, 84, 76, 28, "a", 4) + tiT(104, 102, "EstrategiaA", "a", 9) + tiR(178, 84, 76, 28, "v", 4) + tiT(216, 102, "EstrategiaB", "v", 9) +
    tiT(160, 132, "Patrones de diseño", "w", 11),

  "Plataforma .NET": () =>
    tiR(92, 16, 136, 22, "m", 4) + tiT(160, 31, "C#  ·  VB.NET  ·  F#", "m", 10) +
    tiR(92, 48, 136, 22, "a", 4) + tiT(160, 63, "CIL (código intermedio)", "a", 9) +
    tiR(92, 80, 136, 22, "v", 4) + tiT(160, 95, "CLR", "v", 10) + tiP("M160 38v10M160 70v10", "w") +
    tiT(160, 128, ".NET", "y", 14),

  "Modelo E/R y DFD": () =>
    tiR(54, 48, 64, 28, "a", 3) + tiT(86, 66, "ALUMNO", "a", 9) + tiP("M160 44L192 62L160 80L128 62Z", "y") + tiT(160, 65, "cursa", "y", 9) +
    tiR(202, 48, 64, 28, "v", 3) + tiT(234, 66, "CURSO", "v", 9) + tiP("M118 62h10M192 62h10", "w") +
    tiE(86, 22, 26, 11, "m") + tiT(86, 25, "nombre", "m", 8) + tiP("M86 33v15", "m") +
    tiE(234, 102, 26, 11, "m") + tiT(234, 105, "código", "m", 8) + tiP("M234 76v15", "m") + tiT(160, 128, "Modelo Entidad/Relación", "w", 11),

  "Accesibilidad Web": () =>
    tiPersonaAccesible(112, 62, 36, "m") + tiT(218, 60, "WCAG", "y", 22) + tiT(218, 84, "A · AA · AAA", "a", 11) +
    tiT(160, 128, "Accesibilidad web", "w", 11),

  // ===== BLOQUE 4: SISTEMAS Y COMUNICACIONES =====
  "Linux": () =>
    tiCodigo(56, 20, 208, 100, "m", [["$ ls -la", "m"], ["$ chmod 755 copia.sh", "a"], ["$ ps aux | grep ssh", "y"], ["$ _", "m"]], "bash"),

  "HTTPS y Criptografía": () =>
    tiR(64, 14, 192, 22, "a", 11) + tiT(160, 29, "https://", "a", 11, "middle", true) +
    tiCandado(78, 62, 50, "m") + tiO(188, 80, 14, "y") + tiP("M202 80h48M236 80v10M246 80v8", "y") +
    tiT(160, 132, "Criptografía", "w", 11),

  "TCP/IP": () =>
    [["m", "Aplicación", "HTTP · DNS"], ["a", "Transporte", "TCP · UDP"], ["v", "Internet", "IP · ICMP"], ["r", "Acceso a red", "Ethernet"]]
      .map(([c, t, p], i) => tiR(80, 14 + i * 28, 120, 23, c, 4) + tiT(140, 30 + i * 28, t, c, 10) + tiT(208, 30 + i * 28, p, c, 9, "start")).join(""),

  "Redes de Conmutación": () => {
    const n = [[66, 70], [128, 34], [128, 106], [196, 34], [196, 106], [256, 70]];
    const e = "M66 70L128 34M66 70L128 106M128 34L196 34M128 106L196 106M128 34L196 106M196 34L256 70M196 106L256 70";
    return tiP(e, "a") + n.map(([x, y], i) => tiO(x, y, 10, i % 2 ? "m" : "v", "n")).join("") +
      tiR(156, 29, 12, 10, "y", 2, `fill="#fbbf24"`) + tiR(222, 82, 12, 10, "y", 2, `fill="#fbbf24"`) + tiR(86, 88, 12, 10, "y", 2, `fill="#fbbf24"`);
  },

  "Redes LAN y medios": () =>
    tiO(88, 58, 26, "a") + tiO(88, 58, 16, "w") + tiO(88, 58, 6, "y", "y") + tiT(88, 106, "Coaxial", "a", 10) +
    tiP("M148 34C172 44 148 54 172 64C148 74 172 84 148 92", "m") + tiP("M172 34C148 44 172 54 148 64C172 74 148 84 172 92", "v") + tiT(160, 106, "Par trenzado", "m", 10) +
    tiO(232, 58, 22, "r") + tiO(232, 58, 7, "y", "y") + tiT(232, 106, "Fibra", "r", 10) + tiT(160, 130, "Medios de transmisión", "w", 11),

  "Virtualización y Cloud": () =>
    tiP("M120 92H222a22 22 0 0 0 0-44a30 30 0 0 0-56-12a26 26 0 0 0-46 14a21 21 0 0 0 0 42z", "a") +
    tiR(130, 60, 24, 18, "m", 3) + tiR(160, 60, 24, 18, "v", 3) + tiR(190, 60, 24, 18, "r", 3) +
    tiT(142, 73, "VM", "m", 8) + tiT(172, 73, "VM", "v", 8) + tiT(202, 73, "VM", "r", 8) + tiT(160, 124, "Virtualización · Cloud", "w", 11),

  "Administración de Sistemas": () =>
    tiR(92, 18, 72, 104, "a", 6) + tiP("M92 44h72M92 70h72M92 96h72", "a") +
    [31, 57, 83, 109].map((y) => tiO(106, y, 3, "m", "m") + tiP(`M120 ${y}h32`, "a", `stroke-width="1.5"`)).join("") +
    tiEngranaje(218, 70, 18, "y"),

  "Seguridad de la Información": () =>
    tiP("M160 24L222 110L98 110Z", "m") + tiP("M160 52L178 59V76Q178 90 160 97Q142 90 142 76V59Z", "y") +
    tiT(160, 16, "Confidencialidad", "m", 10) + tiT(232, 128, "Integridad", "a", 10) + tiT(88, 128, "Disponibilidad", "v", 10),

  "Seguridad en Redes y VPN": () =>
    tiR(40, 48, 42, 28, "a", 3) + tiP("M34 82h54", "a") + tiR(238, 40, 42, 46, "v", 3) + tiP("M248 52h6M262 52h6M248 64h6M262 64h6", "v") +
    tiP("M88 58C140 34 186 34 238 56M88 72C140 96 186 96 238 72", "m") + tiCandado(148, 58, 24, "y") +
    tiT(160, 124, "Túnel VPN", "w", 11),

  "Administración de BBDD": () =>
    tiCil(98, 30, 70, 70, "a") + tiP("M232 70a24 24 0 1 1-7-17", "y") + tiP("M222 44l4 9 10-2", "y") +
    tiT(220, 75, "copia", "y", 8) + tiT(160, 130, "Administración del SGBD", "w", 11),

  "Microservicios": () => {
    const hex = (cx, cy, c) => {
      let d = "";
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        d += `${i ? "L" : "M"}${(cx + Math.cos(a) * 20).toFixed(1)} ${(cy + Math.sin(a) * 20).toFixed(1)}`;
      }
      return tiP(d + "Z", c);
    };
    return tiP("M120 46L160 70L200 46M120 96L160 70L200 96M160 70V28", "w", `stroke-width="1.2" stroke-dasharray="3 4"`) +
      hex(160, 70, "m") + hex(120, 46, "a") + hex(200, 46, "v") + hex(120, 96, "r") + hex(200, 96, "y") + hex(160, 24, "t");
  },

  "Redes Móviles": () =>
    tiP("M160 42L140 116M160 42L180 116M147 92h26M152 72h16", "m") + tiO(160, 40, 4, "m", "m") +
    tiP("M146 28q-12 12 0 24M136 20q-22 20 0 40M174 28q12 12 0 24M184 20q22 20 0 40", "a") +
    tiR(74, 60, 28, 48, "v", 6) + tiT(236, 74, "5G", "y", 24),

  "Administración de Redes": () =>
    tiR(58, 22, 116, 72, "a", 6) + tiP("M68 80L88 58L104 68L124 38L144 54L162 44", "m") +
    tiR(196, 68, 70, 26, "v", 6) + tiP("M210 68v-20M252 68v-20", "v") + tiO(212, 81, 3, "m", "m") + tiO(224, 81, 3, "m", "m") + tiO(236, 81, 3, "y", "y") +
    tiP("M174 58h22v10", "y") + tiT(160, 124, "Gestión y monitorización", "w", 11),

  "Correo Electrónico": () =>
    tiR(84, 30, 106, 68, "m", 6) + tiP("M84 30L137 70L190 30", "m") + tiT(236, 82, "@", "y", 42) +
    tiT(160, 126, "SMTP · POP3 · IMAP", "a", 11),

  // ===== FUNDAMENTOS (clave: materia|tema) =====
  "FUNDAMENTOS 1: INFORMÁTICA|Arquitectura de Computadoras": () =>
    tiR(56, 22, 88, 66, "m", 5) + tiT(100, 38, "CPU", "m", 10) + tiR(64, 48, 34, 30, "a", 3) + tiT(81, 67, "ALU", "a", 9) +
    tiR(104, 48, 34, 30, "v", 3) + tiT(121, 67, "UC", "v", 9) + tiR(192, 22, 72, 66, "y", 5) + tiT(228, 59, "Memoria", "y", 10) +
    tiP("M144 50h48M144 60h48", "w") + tiR(106, 104, 108, 22, "r", 4) + tiT(160, 119, "Entrada / Salida", "r", 10) + tiP("M100 88v16M228 88v16", "w"),

  "FUNDAMENTOS 1: INFORMÁTICA|Conceptos Generales": () =>
    [["a", "Entrada", 50], ["m", "Proceso", 130], ["v", "Salida", 210]].map(([c, t, x]) => tiR(x, 44, 62, 40, c, 5) + tiT(x + 31, 68, t, c, 10)).join("") +
    tiP("M112 64h18M192 64h18", "y") + tiT(160, 118, "Datos → Información", "w", 11),

  "FUNDAMENTOS 1: INFORMÁTICA|Lenguajes y Bases de Datos": () =>
    tiT(104, 78, "&lt;/&gt;", "m", 32) + tiCil(184, 34, 62, 62, "a") + tiT(160, 128, "Lenguajes · Bases de datos", "w", 11),

  "FUNDAMENTOS 1: INFORMÁTICA|Sistemas Digitales": () =>
    tiP("M70 40h30a30 30 0 0 1 0 60h-30Z", "m") + tiP("M50 55h20M50 85h20M130 70h18", "m") + tiT(94, 74, "AND", "m", 10) +
    tiP("M178 40q20 30 0 60q48 0 68-30q-20-30-68-30Z", "v") + tiP("M160 55h24M160 85h24M246 70h18", "v") + tiT(208, 74, "OR", "v", 10) +
    tiP("M60 122h20v-10h20v10h20v-10h20v10h20v-10h20v10h20v-10h20v10h20", "y", `stroke-width="1.8"`),

  "FUNDAMENTOS 2: PROGRAMACIÓN|Conceptos Generales": () =>
    [["m", "int x", "5", 44], ["a", "String s", "\"Ana\"", 125], ["v", "boolean b", "true", 206]]
      .map(([c, t, val, x]) => tiT(x + 35, 40, t, c, 10, "middle", true) + tiR(x, 50, 70, 36, c, 5) + tiT(x + 35, 73, val, c, 13, "middle", true)).join("") +
    tiT(160, 118, "Variables y tipos de datos", "w", 11),

  "FUNDAMENTOS 2: PROGRAMACIÓN|Lenguajes de Programación": () =>
    tiR(42, 44, 62, 44, "m", 5) + tiT(73, 71, "&lt;/&gt;", "m", 16) + tiP("M108 66h22M124 60l6 6-6 6", "w") +
    tiEngranaje(160, 66, 13, "y") + tiP("M190 66h22M206 60l6 6-6 6", "w") +
    tiR(216, 44, 62, 44, "a", 5) + tiT(247, 63, "0101", "a", 11, "middle", true) + tiT(247, 79, "1100", "a", 11, "middle", true) +
    tiT(160, 122, "Compilar · Interpretar", "w", 11),

  "FUNDAMENTOS 2: PROGRAMACIÓN|Proceso de Desarrollo": () =>
    [["m", "Análisis"], ["a", "Diseño"], ["v", "Código"], ["r", "Pruebas"]]
      .map(([c, t], i) => tiR(50 + i * 44, 16 + i * 28, 66, 20, c, 4) + tiT(83 + i * 44, 30 + i * 28, t, c, 10)).join("") +
    tiP("M116 26h12v18M160 54h12v18M204 82h12v18", "w") + tiT(160, 132, "Ciclo de vida del software", "w", 10),

  "FUNDAMENTOS 3: REDES|Conceptos Generales": () => {
    const pcs = [[70, 30], [70, 100], [250, 30], [250, 100]];
    return pcs.map(([x, y]) => tiP(`M${x} ${y}L160 66`, "y", `stroke-width="1.5"`)).join("") + tiR(132, 54, 56, 24, "m", 4, `fill="#00203F"`) + tiT(160, 70, "switch", "m", 9) +
      pcs.map(([x, y], i) => tiR(x - 16, y - 11, 32, 22, i % 2 ? "a" : "v", 3, `fill="#00203F"`)).join("");
  },

  "FUNDAMENTOS 3: REDES|TCP/IP": () =>
    tiR(52, 44, 76, 40, "y", 4) + tiT(90, 68, "Cabecera", "y", 10) + tiR(128, 44, 140, 40, "a", 4) + tiT(198, 68, "Datos", "a", 12) +
    tiT(90, 34, "origen · destino", "y", 8) + tiT(160, 112, "Paquete IP", "w", 12),

  "FUNDAMENTOS 3: REDES|Tipos de Redes": () =>
    tiE(160, 70, 122, 56, "v") + tiE(160, 74, 80, 38, "a") + tiE(160, 78, 40, 18, "m") +
    tiT(160, 82, "LAN", "m", 11) + tiT(160, 52, "MAN", "a", 10) + tiT(160, 30, "WAN", "v", 10),

  "FUNDAMENTOS 4: BASES DE DATOS|Diseño de Bases de Datos y Paradigmas": () =>
    tiR(52, 28, 104, 70, "a", 4) + tiP("M52 46h104M52 64h104M52 82h104M88 28v70M124 28v70", "a", `stroke-width="1.5"`) +
    tiT(104, 116, "Relacional", "a", 10) + tiT(222, 74, "{ }", "m", 34) + tiT(222, 116, "Documental", "m", 10),

  "FUNDAMENTOS 4: BASES DE DATOS|Modelo Conceptual: Entidades y Atributos": () =>
    tiP("M120 56L80 32M200 56L240 32M120 84L80 108M200 84L240 108", "w", `stroke-width="1.5"`) +
    tiR(120, 55, 80, 30, "a", 3) + tiT(160, 74, "ALUMNO", "a", 10) +
    [[80, 32, "dni"], [240, 32, "nombre"], [80, 108, "email"], [240, 108, "fecha"]].map(([x, y, t]) => `<ellipse cx="${x}" cy="${y}" rx="28" ry="12" stroke="#36ECDE" fill="#00203F"/>` + tiT(x, y + 3, t, "m", 9)).join("") +
    tiP("M70 38h20", "y", `stroke-width="1.5"`) + tiR(120, 55, 80, 30, "a", 3, `fill="#00203F"`) + tiT(160, 74, "ALUMNO", "a", 10),

  "FUNDAMENTOS 4: BASES DE DATOS|Relaciones, Cardinalidad y Diagramas ER": () =>
    tiR(44, 50, 70, 30, "a", 3) + tiT(79, 69, "PROFESOR", "a", 9) + tiP("M160 44L194 65L160 86L126 65Z", "y") + tiT(160, 68, "imparte", "y", 8) +
    tiR(206, 50, 74, 30, "v", 3) + tiT(243, 69, "ASIGNATURA", "v", 8) + tiP("M114 65h12M194 65h12", "w") +
    tiT(120, 58, "1", "y", 10) + tiT(200, 58, "N", "y", 10) + tiT(160, 120, "1 : N", "y", 14),

  "FUNDAMENTOS 4: BASES DE DATOS|SQL: CREATE TABLE, CRUD y Restricciones": () =>
    tiCodigo(50, 20, 220, 104, "v", [["CREATE TABLE alumno (", "m"], ["  id INT PRIMARY KEY,", "a"], ["  nombre VARCHAR(50)", "y"], [");", "m"]], "DDL"),

  "FUNDAMENTOS 4: BASES DE DATOS|SQL: JOIN, GROUP BY y HAVING": () =>
    `<path d="M160 33.4A38 38 0 0 1 160 90.6A38 38 0 0 1 160 33.4Z" fill="#36ECDE" fill-opacity=".35" stroke="#36ECDE"/>` +
    tiO(135, 62, 38, "a") + tiO(185, 62, 38, "v") + tiT(118, 66, "A", "a", 14) + tiT(202, 66, "B", "v", 14) + tiT(160, 124, "INNER JOIN", "y", 12, "middle", true),

  "FUNDAMENTOS 5: SSOO|Familias de Sistemas Operativos": () =>
    tiP("M95 34v12M50 46h90M50 46v12M140 46v12M50 78v26M140 78v26", "w", `stroke-width="1.5"`) +
    tiR(65, 14, 60, 20, "m", 4) + tiT(95, 28, "UNIX", "m", 10) + tiR(20, 58, 60, 20, "a", 4) + tiT(50, 72, "Linux", "a", 10) +
    tiR(110, 58, 60, 20, "v", 4) + tiT(140, 72, "BSD", "v", 10) + tiR(20, 104, 60, 20, "a", 4) + tiT(50, 118, "Android", "a", 9) +
    tiR(110, 104, 60, 20, "r", 4) + tiT(140, 118, "macOS", "r", 10) + tiR(212, 58, 84, 20, "y", 4) + tiT(254, 72, "Windows", "y", 10) +
    tiT(254, 96, "familia NT", "y", 9),

  "FUNDAMENTOS 5: SSOO|Gestión de Ficheros": () => {
    const carpeta = (x, y, c) => tiP(`M${x} ${y + 6}h12l4 4h22v20h-38z`, c);
    return tiP("M66 46v52M66 66h22M66 98h22M170 70h18", "w", `stroke-width="1.5"`) +
      carpeta(48, 12, "m") + tiT(96, 34, "/", "m", 13, "start", true) +
      carpeta(90, 50, "a") + tiT(134, 72, "home", "a", 10, "start", true) +
      carpeta(90, 82, "v") + tiT(134, 104, "etc", "v", 10, "start", true) +
      tiR(190, 56, 22, 28, "y", 3) + tiP("M195 66h12M195 73h12", "y", `stroke-width="1.2"`) + tiT(218, 74, "notas.txt", "y", 10, "start", true);
  },

  "FUNDAMENTOS 5: SSOO|Gestión de Procesos": () =>
    tiP("M120 58Q150 30 178 36", "m") + tiP("M180 52Q150 72 122 74", "y") + tiP("M206 68v10", "r") + tiP("M178 104Q140 106 116 88", "v") +
    tiO(178, 36, 3, "m", "m") + tiO(122, 74, 3, "y", "y") + tiO(206, 78, 3, "r", "r") + tiO(116, 88, 3, "v", "v") +
    tiO(94, 70, 28, "a") + tiT(94, 74, "Listo", "a", 10) + tiO(208, 40, 28, "m") + tiT(208, 44, "Ejecución", "m", 9) +
    tiO(208, 106, 28, "v") + tiT(208, 110, "Bloqueado", "v", 8),

  "FUNDAMENTOS 5: SSOO|Gestor de Memoria": () =>
    tiR(118, 14, 84, 112, "a", 4) +
    [[14, 22, "m", "SO"], [36, 22, "v", "P1"], [58, 26, "n", ""], [84, 20, "r", "P2"], [104, 22, "n", ""]]
      .map(([y, h, c, t]) => (c === "n" ? "" : `<rect x="122" y="${y + 3}" width="76" height="${h - 6}" rx="3" fill="${TI_COL[c]}" fill-opacity=".3" stroke="${TI_COL[c]}"/>`) +
        (t ? tiT(112, y + h / 2 + 4, t, c, 10, "end") : "")).join("") +
    tiR(226, 34, 34, 20, "y", 3) + tiT(243, 48, "pág", "y", 9) + tiR(226, 80, 34, 20, "y", 3) + tiT(243, 94, "pág", "y", 9) +
    tiP("M226 44h-28M226 90h-28", "y", `stroke-dasharray="3 3"`),

  "FUNDAMENTOS 5: SSOO|Introducción a SSOO": () =>
    [["m", "Usuario · Aplicaciones"], ["a", "Sistema operativo"], ["v", "Hardware"]]
      .map(([c, t], i) => tiR(84, 16 + i * 32, 152, 24, c, 5) + tiT(160, 32 + i * 32, t, c, 10)).join("") +
    tiP("M160 40v8M160 72v8", "w") + tiT(160, 128, "Intermediario usuario ↔ hardware", "w", 10),

  "FUNDAMENTOS 5: SSOO|Virtualización": () =>
    tiR(66, 98, 188, 20, "v", 4) + tiT(160, 112, "Hardware", "v", 10) + tiR(66, 74, 188, 20, "a", 4) + tiT(160, 88, "Hipervisor", "a", 10) +
    [["m", 66], ["y", 132], ["r", 198]].map(([c, x], i) => tiR(x, 18, 56, 50, c, 4) + tiT(x + 28, 38, `VM ${i + 1}`, c, 10) + tiT(x + 28, 56, "SO", c, 9)).join(""),
};

// Dibujo genérico por bloque, para temas nuevos que aún no tengan el suyo
function tiGenerico(materia) {
  const c = materia.startsWith("BLOQUE 1") ? "v" : materia.startsWith("BLOQUE 2") ? "a" : materia.startsWith("BLOQUE 3") ? "m" : materia.startsWith("BLOQUE 4") ? "r" : "y";
  return tiR(130, 34, 60, 60, c, 6) + tiR(144, 48, 32, 32, c, 3) +
    tiP("M140 34v-10M160 34v-10M180 34v-10M140 94v10M160 94v10M180 94v10M130 48h-10M130 64h-10M130 80h-10M190 48h10M190 64h10M190 80h10", c);
}

function imagenTema(materia, tema) {
  const f = TI_DIBUJOS[`${materia}|${tema}`] || TI_DIBUJOS[tema];
  return tiSvg(f ? f() : tiGenerico(materia));
}
