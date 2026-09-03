// ============================================================
// Lógica de "LO 3/2018, protección de datos" (ley3-2018.html)
// Pinta el texto consolidado (Títulos → Capítulos → Secciones → Artículos,
// Disposiciones) a partir de data/ley3-2018.json, con lector de voz en cola
// por título, capítulo y sección, y dos marcas distintas:
//   1) si ese título entra en el temario de la convocatoria vigente;
//   2) en qué exámenes oficiales ha caído cada artículo.
// ============================================================

// ---------------- 1) Qué entra ----------------
// El Anexo V de la Resolución BOE-A-2025-26262 no nombra esta ley: el tema 7 del
// Bloque I dice "La protección de datos personales y su régimen jurídico:
// principios, derechos y obligaciones. Derechos digitales". De ahí el recorte:
// entran principios (II), derechos (III), obligaciones (IV, V y VI) y derechos
// digitales (X), además de las disposiciones generales (I).
// Quedan fuera las autoridades de control (VII), los procedimientos (VIII) y el
// régimen sancionador (IX).
// ⚠️ Revisar cuando se publique la siguiente convocatoria.
const TITULOS_QUE_ENTRAN = {
  "titulo-i": true,    // Disposiciones generales
  "titulo-ii": true,   // Principios de protección de datos
  "titulo-iii": true,  // Derechos de las personas
  "titulo-iv": true,   // Tratamientos concretos
  "titulo-v": true,    // Responsable y encargado
  "titulo-vi": true,   // Transferencias internacionales
  "titulo-vii": false, // Autoridades de protección de datos
  "titulo-viii": false,// Procedimientos
  "titulo-ix": false,  // Régimen sancionador
  "titulo-x": true,    // Garantía de los derechos digitales
};

// ---------------- 2) Qué ha caído ----------------
// Verificado sobre los enunciados oficiales. Ojo al artículo 78: cayó en 2019
// aunque su título no figure en el programa actual. Se deja marcado a propósito.
const ARTICULOS_EN_EXAMEN = {
  "34": [{ anio: "2022", sobre: "cuándo hay que designar delegado de protección de datos" }],
  "78": [{ anio: "2019", sobre: "prescripción de las sanciones" }],
  "79": [{ anio: "2025/2026", sobre: "aplicación de los derechos en internet" }],
  "96": [{ anio: "2025/2026", sobre: "el derecho al testamento digital" }],
};

// Preguntas que van sobre un título entero, sin apuntar a un artículo concreto.
const TITULOS_EN_EXAMEN = {
  "titulo-x": [{ anio: "2022", sobre: "cuál NO es un derecho digital" }],
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

// ---------------- Recolección de texto por nivel ----------------
function textosDeArticulos(articulos) {
  return (articulos || []).map((a) => `Artículo ${a.numero}. ${a.epigrafe ? a.epigrafe + ". " : ""}${a.texto}`);
}
function textosDeSeccion(seccion) {
  return [`${seccion.numero}${seccion.nombre ? ", " + seccion.nombre : ""}.`, ...textosDeArticulos(seccion.articulos)];
}
function textosDeCapitulo(capitulo) {
  return [
    `${capitulo.numero}${capitulo.nombre ? ", " + capitulo.nombre : ""}.`,
    ...textosDeArticulos(capitulo.articulos),
    ...(capitulo.secciones || []).flatMap(textosDeSeccion),
  ];
}
function textosDeTitulo(titulo) {
  return [
    `${titulo.numero}${titulo.nombre ? ", " + titulo.nombre : ""}.`,
    ...textosDeArticulos(titulo.articulos),
    ...(titulo.capitulos || []).flatMap(textosDeCapitulo),
  ];
}

// ---------------- Utilidades de render ----------------
let contadorBotones = 0;
const textosPorBoton = [];

function botonAltavoz(textos) {
  contadorBotones++;
  textosPorBoton.push(textos);
  return `<button type="button" class="btn-altavoz" data-voz-id="${contadorBotones}" title="Escuchar desde aquí">🔊</button>`;
}

function escaparHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function htmlAvisoExamen(numero) {
  const caidas = ARTICULOS_EN_EXAMEN[numero];
  if (!caidas || !caidas.length) return "";
  const detalle = caidas
    .map((c) => `${escaparHtml(c.anio)}${c.sobre ? ` (${escaparHtml(c.sobre)})` : ""}`)
    .join(" · ");
  const veces = caidas.length === 1 ? "Ha caído en examen" : `Ha caído ${caidas.length} veces`;
  return `<div class="aviso-examen"><span class="chip examen">📌 ${veces}</span> <span class="aviso-examen-detalle">${detalle}</span></div>`;
}

function htmlAvisoTitulo(id) {
  const caidas = TITULOS_EN_EXAMEN[id];
  if (!caidas || !caidas.length) return "";
  const detalle = caidas
    .map((c) => `${escaparHtml(c.anio)}${c.sobre ? ` (${escaparHtml(c.sobre)})` : ""}`)
    .join(" · ");
  return `<div class="aviso-examen"><span class="chip examen">📌 Ha caído una pregunta sobre este título</span> <span class="aviso-examen-detalle">${detalle}</span></div>`;
}

function htmlArticulo(a) {
  return `
    <div class="const-articulo${ARTICULOS_EN_EXAMEN[a.numero] ? " articulo-preguntado" : ""}" id="art-${escaparHtml(a.numero).replace(/\s+/g, "-")}">
      <strong>Artículo ${escaparHtml(a.numero)}.</strong>
      ${a.epigrafe ? `<em class="art-epigrafe">${escaparHtml(a.epigrafe)}.</em>` : ""}
      ${htmlAvisoExamen(a.numero)}
      <span class="art-texto">${escaparHtml(a.texto)}</span>
    </div>`;
}

function htmlSeccion(seccion) {
  return `
    <div class="const-seccion">
      <div class="const-seccion-header">
        ${botonAltavoz(textosDeSeccion(seccion))}
        <span class="const-seccion-num">${escaparHtml(seccion.numero)}</span>
        ${seccion.nombre ? `<span class="const-seccion-nombre">${escaparHtml(seccion.nombre)}</span>` : ""}
      </div>
      ${(seccion.articulos || []).map(htmlArticulo).join("")}
    </div>`;
}

function htmlCapitulo(capitulo) {
  return `
    <div class="const-capitulo">
      <div class="const-capitulo-header">
        ${botonAltavoz(textosDeCapitulo(capitulo))}
        <span class="const-capitulo-num">${escaparHtml(capitulo.numero)}</span>
        ${capitulo.nombre ? `<span class="const-capitulo-nombre">${escaparHtml(capitulo.nombre)}</span>` : ""}
      </div>
      ${(capitulo.articulos || []).map(htmlArticulo).join("")}
      ${(capitulo.secciones || []).map(htmlSeccion).join("")}
    </div>`;
}

function htmlTitulo(titulo) {
  const entra = TITULOS_QUE_ENTRAN[titulo.id];
  const chip = entra
    ? `<span class="chip entra">✅ Entra en el temario actual</span>`
    : `<span class="chip no-entra">No entra actualmente</span>`;
  return `
    <div class="const-titulo" id="${escaparHtml(titulo.id)}">
      <div class="const-titulo-header">
        ${botonAltavoz(textosDeTitulo(titulo))}
        <span class="const-titulo-num">${escaparHtml(titulo.numero)}</span>
        ${titulo.nombre ? `<span class="const-titulo-nombre">${escaparHtml(titulo.nombre)}</span>` : ""}
        ${chip}
      </div>
      ${htmlAvisoTitulo(titulo.id)}
      ${(titulo.articulos || []).map(htmlArticulo).join("")}
      ${(titulo.capitulos || []).map(htmlCapitulo).join("")}
    </div>`;
}

function htmlDisposiciones(disposiciones) {
  return `
    <div class="const-disposiciones">
      <h2>Disposiciones</h2>
      ${(disposiciones || [])
        .map((d) => {
          const textosDisp = (d.items || []).map((it) =>
            it.numero ? `${d.tipo}, ${it.numero}. ${it.texto}` : `${d.tipo}. ${it.texto}`
          );
          return `
        <div class="const-disp-bloque">
          <div class="const-disp-tipo">${botonAltavoz(textosDisp)}<span>${escaparHtml(d.tipo)}</span></div>
          ${(d.items || [])
            .map(
              (it) =>
                `<div class="const-disp-item">${it.numero ? `<strong>${escaparHtml(it.numero)}.</strong> ` : ""}${escaparHtml(it.texto)}</div>`
            )
            .join("")}
        </div>`;
        })
        .join("")}
    </div>`;
}

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
    const res = await fetch("data/ley3-2018.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    datos = await res.json();
  } catch (e) {
    console.error("Error cargando ley3-2018.json:", e);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar el texto. Recarga la página.</div>`;
    return;
  }

  contadorBotones = 0;
  textosPorBoton.length = 0;

  let html = `<p class="ley-fuente">${escaparHtml(datos.actualizacion)} Referencia ${escaparHtml(datos.referencia)}.</p>`;
  html += (datos.titulos || []).map(htmlTitulo).join("");
  html += htmlDisposiciones(datos.disposiciones);

  contenedor.innerHTML = html;

  contenedor.querySelectorAll(".btn-altavoz").forEach((boton) => {
    const idBoton = Number(boton.dataset.vozId);
    boton.addEventListener("click", () => leerCola(textosPorBoton[idBoton - 1], boton));
  });
})();
