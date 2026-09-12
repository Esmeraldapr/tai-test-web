// ============================================================
// Lógica del "Reglamento (UE) 2016/679, RGPD" (rgpd.html)
// Pinta el texto consolidado (Capítulos → Secciones → Artículos) a partir de
// data/rgpd.json, con lector de voz en cola por capítulo y sección, y la
// marca de en qué exámenes oficiales ha caído cada artículo.
//
// A diferencia de las leyes españolas ya montadas, el RGPD no tiene
// "Títulos": va directo de Capítulo a Artículo (algunos capítulos se dividen
// además en Secciones). Por eso esta página no usa htmlTitulo ni
// TITULOS_QUE_ENTRAN: el RGPD entero se da por que entra, para completar el
// tema 7 junto a la LO 3/2018 (ya montada).
// ============================================================

// ---------------- 1) Qué entra ----------------
// El Anexo V (BOE-A-2025-26262) no nombra el RGPD por su nombre en el tema 7,
// pero la LO 3/2018 (protección de datos, ya montada) lo cita constantemente
// y lo desarrolla; el propio RGPD es la norma europea de la que parte todo
// el tema. Se da por que entra entero.

// ---------------- 2) Qué ha caído ----------------
// Comprobado sobre la materia EXÁMENES en Supabase, con las diez convocatorias
// completas (2018, 2019, 2022, 2024 y 2025, ingreso libre y promoción interna).
// El RGPD es la norma con más apariciones de las que aún no teníamos montadas:
// 6 veces en total.
const ARTICULOS_EN_EXAMEN = {
  "2": [{ anio: "2019", sobre: "ámbito de aplicación material" }],
  "5": [
    { anio: "2024", sobre: "principio de minimización de datos" },
    { anio: "2024 (promoción interna)", sobre: "principio de minimización de datos" },
  ],
  "20": [{ anio: "2018", sobre: "derecho a la portabilidad de los datos" }],
  "32": [{ anio: "2024 (promoción interna)", sobre: "medidas técnicas y organizativas para garantizar la seguridad" }],
};

// Pregunta sobre la norma en general, sin apuntar a un artículo concreto:
// 2018 (promoción interna), pregunta 3: "¿sigue siendo obligatoria la
// inscripción de ficheros a la AEPD?" — respuesta: no, el RGPD eliminó esa
// obligación general de notificación. No se marca en ningún artículo por no
// haber uno solo que lo diga literalmente así.
const AVISO_GENERAL_EXAMEN = {
  anio: "2018 (promoción interna)",
  sobre: 'si "sigue siendo obligatoria la inscripción de ficheros a la AEPD" (ya no lo es, el RGPD eliminó esa obligación general de notificación)',
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
    const res = await fetch("data/rgpd.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    datos = await res.json();
  } catch (e) {
    console.error("Error cargando rgpd.json:", e);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar el texto. Recarga la página.</div>`;
    return;
  }

  let html = `<p class="ley-fuente">${escaparHtml(datos.actualizacion)} Referencia ${escaparHtml(datos.referencia)}.</p>`;
  html += `<div class="aviso-examen" style="margin-bottom:16px"><span class="chip examen">📌 ${escaparHtml(AVISO_GENERAL_EXAMEN.anio)}</span> <span class="aviso-examen-detalle">${escaparHtml(AVISO_GENERAL_EXAMEN.sobre)}</span></div>`;
  html += (datos.capitulos || []).map((c, i) => htmlCapitulo(c, "rgpd", i)).join("");

  contenedor.innerHTML = html;

  iniciarLectoresLey(contenedor);
})();
