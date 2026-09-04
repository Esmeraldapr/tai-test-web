// ============================================================
// Lógica de "RD 1112/2018, accesibilidad" (rd1112-2018.html)
// A diferencia de las otras normas de Teoría, esta se organiza en capítulos
// (no en títulos) y lo más preguntado está en los anexos, así que:
//   - los cuatro anexos vienen plegados, para no aplastar al entrar;
//   - el anexo II se pinta como tabla, con los colores del BOE y un buscador.
// ============================================================

// OJO, esto es interpretación nuestra, no una cita del BOE.
// El Anexo V de la Resolución BOE-A-2025-26262 NO nombra este decreto en ningún
// sitio. Lo que dice, en el tema 8 del Bloque III, es: "Accesibilidad, diseño
// universal y usabilidad. Acceso y usabilidad de las tecnologías, productos y
// servicios relacionados con la sociedad de la información". Delimita la
// materia, no la norma.
// Damos por que entra entero porque es la norma española que regula esa materia
// y porque el examen ya ha preguntado por dos de sus tres capítulos: el
// artículo 3 (capítulo I) en 2026 y el artículo 12 (capítulo II) en 2024.
// El capítulo III es el más discutible: es organización administrativa y el
// epígrafe no la menciona. Se deja dentro porque la declaración de
// accesibilidad del artículo 15 es contenido habitual de examen.
// ⚠️ Revisar cuando salga la siguiente convocatoria.

// Verificado sobre los enunciados oficiales de los cinco exámenes.
const ARTICULOS_EN_EXAMEN = {
  "3": [{ anio: "2025/2026", sobre: "qué contenido cuenta como accesible" }],
  "12": [{ anio: "2024", sobre: "solicitudes de información accesible y quejas" }],
};

// Preguntas sobre la norma en conjunto, sin apuntar a un artículo concreto.
const DISPOSICIONES_EN_EXAMEN = [];

const NORMA_EN_EXAMEN = [
  { anio: "2019", sobre: "señalar la afirmación incorrecta sobre el decreto" },
  { anio: "2022", sobre: "qué norma define los requisitos de accesibilidad" },
];

// El apartado de WCAG no es del BOE, lo hemos escrito nosotras, pero es lo que
// más cae de este tema: cinco preguntas en cinco exámenes, más que el propio
// decreto, que lleva cuatro.
const ANEXOS_EN_EXAMEN = {
  "wcag": [
    { anio: "2018", sobre: "qué NO es una pauta del principio Perceptible" },
    { anio: "2019", sobre: "qué busca la pauta Distinguible" },
    { anio: "2022", sobre: "qué es WCAG" },
    { anio: "2025/2026", sobre: "usar etiquetas semánticas de HTML5" },
    { anio: "2025/2026", sobre: "el atributo aria-expanded en un menú desplegable" },
  ],
};

const DIMENSIONES = {
  C: "Confidencialidad", I: "Integridad", D: "Disponibilidad",
  A: "Autenticidad", T: "Trazabilidad",
};

// ---------------- Lector de voz en cola ----------------
let colaVoz = { activa: false, boton: null, textos: [], indice: 0 };

function detenerColaVoz() {
  if (sintesisVoz && sintesisVoz.speaking) sintesisVoz.cancel();
  if (colaVoz.boton) {
    colaVoz.boton.textContent = colaVoz.boton.dataset.iconoReposo || "🔊";
    colaVoz.boton.classList.remove("leyendo");
  }
  colaVoz = { activa: false, boton: null, textos: [], indice: 0 };
}

function hablarSiguienteDeCola() {
  if (!colaVoz.activa || colaVoz.indice >= colaVoz.textos.length) {
    detenerColaVoz();
    return;
  }
  const texto = colaVoz.textos[colaVoz.indice];
  colaVoz.indice++;
  const utterancia = new SpeechSynthesisUtterance(texto);
  utterancia.lang = "es-ES";
  utterancia.rate = typeof VELOCIDAD_VOZ !== "undefined" ? VELOCIDAD_VOZ : 0.95;
  utterancia.onend = () => { if (colaVoz.activa) hablarSiguienteDeCola(); };
  utterancia.onerror = () => { if (colaVoz.activa) detenerColaVoz(); };
  sintesisVoz.speak(utterancia);
}

function leerCola(textos, boton) {
  if (!sintesisVoz) return;
  const eraElMismo = colaVoz.activa && colaVoz.boton === boton;
  detenerLectura();
  detenerColaVoz();
  if (eraElMismo) return;
  const limpios = (textos || []).map((t) => String(t || "").replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!limpios.length) return;
  colaVoz = { activa: true, boton, textos: limpios, indice: 0 };
  if (boton) {
    boton.dataset.iconoReposo = boton.dataset.iconoReposo || boton.textContent;
    boton.textContent = "⏹️";
    boton.classList.add("leyendo");
  }
  hablarSiguienteDeCola();
}

// ---------------- Utilidades ----------------
let contadorBotones = 0;
const textosPorBoton = [];

function botonAltavoz(textos) {
  contadorBotones++;
  textosPorBoton.push(textos);
  return `<button type="button" class="btn-altavoz" data-voz-id="${contadorBotones}" title="Escuchar desde aquí">🔊</button>`;
}

function escaparHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function htmlChipsExamen(caidas, textoUna) {
  if (!caidas || !caidas.length) return "";
  const detalle = caidas
    .map((c) => `${escaparHtml(c.anio)}${c.sobre ? ` (${escaparHtml(c.sobre)})` : ""}`)
    .join(" · ");
  const veces = caidas.length === 1 ? textoUna : `Ha caído ${caidas.length} veces`;
  return `<div class="aviso-examen"><span class="chip examen">📌 ${veces}</span> <span class="aviso-examen-detalle">${detalle}</span></div>`;
}

// ---------------- Articulado ----------------
function htmlArticulo(a) {
  const caidas = ARTICULOS_EN_EXAMEN[a.numero];
  return `
    <div class="const-articulo${caidas ? " articulo-preguntado" : ""}" id="art-${escaparHtml(a.numero)}">
      <strong>Artículo ${escaparHtml(a.numero)}.</strong>
      ${a.epigrafe ? `<em class="art-epigrafe">${escaparHtml(a.epigrafe)}.</em>` : ""}
      ${htmlChipsExamen(caidas, "Ha caído en examen")}
      <span class="art-texto">${escaparHtml(a.texto)}</span>
    </div>`;
}

function htmlCapitulo(c) {
  const textos = [
    `${c.numero}${c.nombre ? ", " + c.nombre : ""}.`,
    ...(c.articulos || []).map((a) => `Artículo ${a.numero}. ${a.epigrafe ? a.epigrafe + ". " : ""}${a.texto}`),
  ];
  return `
    <div class="const-titulo" id="${escaparHtml(c.id)}">
      <div class="const-titulo-header">
        ${botonAltavoz(textos)}
        <span class="const-titulo-num">${escaparHtml(c.numero)}</span>
        ${c.nombre ? `<span class="const-titulo-nombre">${escaparHtml(c.nombre)}</span>` : ""}
      </div>
      ${(c.articulos || []).map(htmlArticulo).join("")}
    </div>`;
}

// ---------------- Anexo II: tabla de medidas ----------------
function celda(valor, clase) {
  const v = String(valor || "").trim();
  const vacia = !v || v.toLowerCase() === "n.a.";
  return `<td class="celda-nivel ${vacia ? "nivel-na" : clase}">${escaparHtml(v || "n.a.")}</td>`;
}

function htmlAmbito(ambito) {
  if (ambito === "Categoría") return `<span class="ambito-cat">Categoría</span>`;
  const letras = String(ambito).split("");
  return letras
    .map((l) => `<abbr class="dim" title="${escaparHtml(DIMENSIONES[l] || l)}">${escaparHtml(l)}</abbr>`)
    .join("");
}

function htmlTablaMedidas(filas) {
  const cuerpo = (filas || [])
    .map((f) => {
      if (f.tipo === "familia") {
        return `<tr class="fila-familia" data-buscar="${escaparHtml((f.codigo + " " + f.nombre).toLowerCase())}">
          <td colspan="5"><strong>${escaparHtml(f.codigo)}</strong> ${escaparHtml(f.nombre)}</td></tr>`;
      }
      const buscar = `${f.codigo} ${f.nombre} ${f.ambito}`.toLowerCase();
      return `<tr data-buscar="${escaparHtml(buscar)}">
        <td class="celda-medida"><code>${escaparHtml(f.codigo)}</code> ${escaparHtml(f.nombre)}</td>
        <td class="celda-ambito">${htmlAmbito(f.ambito)}</td>
        ${celda(f.basica, "nivel-basica")}
        ${celda(f.media, "nivel-media")}
        ${celda(f.alta, "nivel-alta")}
      </tr>`;
    })
    .join("");

  return `
    <div class="buscador-medidas">
      <input type="search" id="buscar-medidas" placeholder="Buscar medida: op.exp, cifrado, trazabilidad…"
             aria-label="Buscar entre las medidas de seguridad" />
      <span id="contador-medidas" class="aviso-examen-detalle"></span>
    </div>
    <div class="tabla-scroll">
      <table class="tabla-medidas">
        <thead>
          <tr>
            <th rowspan="2">Medidas de seguridad</th>
            <th rowspan="2">Por categoría o dimensión(es)</th>
            <th colspan="3">Nivel de las dimensiones / categoría del sistema</th>
          </tr>
          <tr><th>Básica</th><th>Media</th><th>Alta</th></tr>
        </thead>
        <tbody>${cuerpo}</tbody>
      </table>
    </div>
    <p class="aviso-examen-detalle">
      Las iniciales de la segunda columna son las dimensiones de seguridad:
      C confidencialidad, I integridad, D disponibilidad, A autenticidad y T trazabilidad.
      Pasa el dedo o el ratón por encima para verlas.
    </p>`;
}

// ---------------- Anexos ----------------
function htmlGlosario(terminos) {
  return `
    <div class="buscador-medidas">
      <input type="search" id="buscar-glosario" placeholder="Buscar término del glosario…"
             aria-label="Buscar en el glosario" />
    </div>
    <dl class="glosario">
      ${(terminos || [])
        .map(
          (t) => `<div class="glosario-item" data-buscar="${escaparHtml((t.termino + " " + t.definicion).toLowerCase())}">
            <dt>${escaparHtml(t.termino)}</dt><dd>${escaparHtml(t.definicion)}</dd></div>`
        )
        .join("")}
    </dl>`;
}

function htmlAnexo(a) {
  const caidas = ANEXOS_EN_EXAMEN[a.id];
  const textos = [a.titulo, ...(a.parrafos || [])];
  return `
    <details class="anexo" id="${escaparHtml(a.id)}">
      <summary>
        <span class="anexo-titulo">${escaparHtml(a.titulo)}</span>
        ${caidas ? `<span class="chip examen">📌</span>` : ""}
      </summary>
      <div class="anexo-cuerpo">
        <div class="const-titulo-header">${botonAltavoz(textos)}<span class="aviso-examen-detalle">Escuchar la parte escrita de este anexo</span></div>
        ${htmlChipsExamen(caidas, "Ha caído en examen")}
        ${(a.parrafos || []).map((p) => `<p class="art-texto">${escaparHtml(p)}</p>`).join("")}
        ${a.medidas && a.medidas.length ? htmlTablaMedidas(a.medidas) : ""}
        ${a.imagen ? `<figure class="mapa-wcag">
          <a href="${escaparHtml(a.imagen.url_ancha || a.imagen.url)}" target="_blank" rel="noopener">
            <picture>
              ${a.imagen.url_ancha ? `<source media="(min-width: 800px)" srcset="${escaparHtml(a.imagen.url_ancha)}" />` : ""}
              <img class="ampliable" src="${escaparHtml(a.imagen.url)}" alt="${escaparHtml(a.imagen.alt)}" loading="lazy" />
            </picture>
          </a>
          <figcaption>${escaparHtml(a.imagen.pie)}</figcaption>
        </figure>` : ""}
        ${a.terminos && a.terminos.length ? htmlGlosario(a.terminos) : ""}
      </div>
    </details>`;
}

// ---------------- Filtros ----------------
function conectarBuscador(idInput, selectorFilas, idContador) {
  const input = document.getElementById(idInput);
  if (!input) return;
  const filas = Array.from(document.querySelectorAll(selectorFilas));
  const contador = idContador ? document.getElementById(idContador) : null;
  const filtrar = () => {
    const q = input.value.trim().toLowerCase();
    let visibles = 0;
    filas.forEach((f) => {
      const coincide = !q || (f.dataset.buscar || "").includes(q);
      f.style.display = coincide ? "" : "none";
      if (coincide && !f.classList.contains("fila-familia")) visibles++;
    });
    if (contador) contador.textContent = q ? `${visibles} medidas` : "";
  };
  input.addEventListener("input", filtrar);
}

// ---------------- Arranque ----------------
(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const contenedor = document.getElementById("ley");

  if (!usuario) {
    contenedor.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta. Recarga la página en unos segundos.</div>`;
    return;
  }

  pintarSidebar("teoria.html", usuario);
  pintarBannerAcceso(usuario);
  registrarConexion();

  if (!usuario.email_verificado) {
    contenedor.innerHTML = `<div class="vacio"><div class="icono">📧</div>Confirma tu correo (revisa la bandeja de entrada y el spam) para que arranque tu prueba gratuita de ${DIAS_TRIAL} días.</div>`;
    return;
  }

  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    contenedor.innerHTML = `<div class="vacio"><div class="icono">⏳</div>Tu acceso ha caducado.<br/><br/><a class="btn btn-primario" href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  let datos;
  try {
    const res = await fetch("data/rd1112-2018.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    datos = await res.json();
  } catch (e) {
    console.error("Error cargando rd1112-2018.json:", e);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar el texto. Recarga la página.</div>`;
    return;
  }

  contadorBotones = 0;
  textosPorBoton.length = 0;

  let html = `<p class="ley-fuente">${escaparHtml(datos.actualizacion)} Referencia ${escaparHtml(datos.referencia)}.</p>`;
  html += htmlChipsExamen(NORMA_EN_EXAMEN, "Ha caído en examen");
  html += (datos.capitulos || []).map(htmlCapitulo).join("");
  if (datos.disposiciones && datos.disposiciones.length) {
    html += `<details class="anexo"><summary><span class="anexo-titulo">Disposiciones</span></summary>
      <div class="anexo-cuerpo">${datos.disposiciones.map((p) => `<p class="art-texto">${escaparHtml(p)}</p>`).join("")}</div></details>`;
  }
  html += (datos.anexos || []).map(htmlAnexo).join("");

  contenedor.innerHTML = html;

  contenedor.querySelectorAll(".btn-altavoz").forEach((boton) => {
    const idBoton = Number(boton.dataset.vozId);
    boton.addEventListener("click", () => leerCola(textosPorBoton[idBoton - 1], boton));
  });

  conectarBuscador("buscar-glosario", ".glosario .glosario-item", null);
})();
