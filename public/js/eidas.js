// ============================================================
// Lógica de "Reglamento eIDAS (UE 910/2014)" (eidas.html)
// Pinta el texto (Capítulos → Secciones → Artículos, Anexos) a partir de
// data/eidas.json, con lector de voz en cola, y la marca de en qué exámenes
// oficiales ha caído cada artículo o anexo.
// ============================================================

// ---------------- 1) Qué entra ----------------
// El tema 6 dice "Identidad y firma electrónica: régimen jurídico. El DNI
// electrónico", sin nombrar norma, igual que otros temas de este bloque.
// El eIDAS es el reglamento europeo del que parte toda la identificación y
// firma electrónica en España (la Ley 6/2020, ya montada, lo complementa),
// así que se da por que entra entero. Es criterio nuestro, no cita del BOE.

// ---------------- 2) Qué ha caído ----------------
// Comprobado sobre la materia EXÁMENES en Supabase, con las diez convocatorias
// completas (2018, 2019, 2022, 2024 y 2025, ingreso libre y promoción interna).
const ARTICULOS_EN_EXAMEN = {};

const ANEXOS_EN_EXAMEN = {
  "ANEXO III": [{ anio: "2025 (provisional)", sobre: "contenido de los certificados cualificados de sello electrónico" }],
};

// Pregunta sobre el reglamento en general, sin apuntar a un artículo o anexo
// concreto: 2024, pregunta 18, sobre el "nodo eIDAS español" — en realidad
// es la disposición adicional tercera del RD 203/2021 (ya montada), no un
// artículo propio de este reglamento. Se deja anotado aquí para que quede
// constancia de por qué no hay ninguna marca 📌 por ese motivo.
const AVISO_GENERAL_EXAMEN = {
  anio: "2024",
  sobre: 'sobre el "nodo eIDAS español" — pregunta que en realidad remite a la disposición adicional tercera del RD 203/2021 (ya montada), no a un artículo de este reglamento',
};

// ---------------- Utilidades de render ----------------
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

function htmlArticulo(a) {
  return `
    <div class="const-articulo${ARTICULOS_EN_EXAMEN[a.numero] ? " articulo-preguntado" : ""}" id="art-${escaparHtml(a.numero).replace(/\s+/g, "-")}" data-numero="${escaparHtml(a.numero)}">
      <strong>Artículo ${escaparHtml(a.numero)}.</strong>
      ${a.epigrafe ? `<em class="art-epigrafe">${escaparHtml(a.epigrafe)}.</em>` : ""}
      ${htmlAvisoExamen(a.numero)}
      <span class="art-texto">${escaparHtml(a.texto)}</span>
    </div>`;
}

function htmlSeccion(seccion, idPadre, indice) {
  const idSeccion = `${idPadre}-sec${indice}`;
  return `
    <div class="const-seccion" id="${idSeccion}">
      <div class="const-seccion-header">
        ${botonAltavozLey(idSeccion)}
        <span class="const-seccion-num">${escaparHtml(seccion.numero)}</span>
        ${seccion.nombre ? `<span class="const-seccion-nombre">${escaparHtml(seccion.nombre)}</span>` : ""}
      </div>
      ${(seccion.articulos || []).map(htmlArticulo).join("")}
    </div>`;
}

function htmlCapitulo(capitulo, idPadre, indice) {
  const idCapitulo = `${idPadre}-cap${indice}`;
  return `
    <div class="const-capitulo" id="${idCapitulo}">
      <div class="const-capitulo-header">
        ${botonAltavozLey(idCapitulo)}
        <span class="const-capitulo-num">${escaparHtml(capitulo.numero)}</span>
        ${capitulo.nombre ? `<span class="const-capitulo-nombre">${escaparHtml(capitulo.nombre)}</span>` : ""}
      </div>
      ${(capitulo.articulos || []).map(htmlArticulo).join("")}
      ${(capitulo.secciones || []).map((s, i) => htmlSeccion(s, idCapitulo, i)).join("")}
    </div>`;
}

function htmlAnexos(anexos) {
  return `
    <div class="const-disposiciones">
      <h2>Anexos</h2>
      ${(anexos || [])
        .map((a, i) => {
          const idAnexo = `anexo${i}`;
          const caidas = ANEXOS_EN_EXAMEN[a.numero];
          const aviso = caidas
            ? `<div class="aviso-examen"><span class="chip examen">📌 ${caidas.length === 1 ? "Ha caído en examen" : `Ha caído ${caidas.length} veces`}</span> <span class="aviso-examen-detalle">${caidas.map((c) => `${escaparHtml(c.anio)}${c.sobre ? ` (${escaparHtml(c.sobre)})` : ""}`).join(" · ")}</span></div>`
            : "";
          return `
        <div class="const-disp-bloque${caidas ? " articulo-preguntado" : ""}" id="${idAnexo}">
          <div class="const-disp-tipo">${botonAltavozLey(idAnexo)}<span>${escaparHtml(a.numero)}${a.nombre ? `. ${escaparHtml(a.nombre)}` : ""}</span></div>
          ${aviso}
          <div class="const-disp-item">${escaparHtml(a.texto)}</div>
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
    const res = await fetch("data/eidas.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    datos = await res.json();
  } catch (e) {
    console.error("Error cargando eidas.json:", e);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar el texto. Recarga la página.</div>`;
    return;
  }

  let html = `<p class="ley-fuente">${escaparHtml(datos.actualizacion)} Referencia ${escaparHtml(datos.referencia)}.</p>`;
  html += `<div class="aviso-examen" style="margin-bottom:16px"><span class="chip examen">📌 ${escaparHtml(AVISO_GENERAL_EXAMEN.anio)}</span> <span class="aviso-examen-detalle">${escaparHtml(AVISO_GENERAL_EXAMEN.sobre)}</span></div>`;
  html += (datos.capitulos || []).map((c, i) => htmlCapitulo(c, "eidas", i)).join("");
  html += htmlAnexos(datos.anexos);

  contenedor.innerHTML = html;

  iniciarLectoresLey(contenedor);
})();
