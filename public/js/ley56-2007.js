// ============================================================
// Lógica de "Ley 56/2007, impulso sociedad de la información"
// (ley56-2007.html). Pinta el texto (Capítulos → Artículos, Disposiciones)
// a partir de data/ley56-2007.json, con lector de voz en cola, y la marca
// de en qué exámenes oficiales ha caído cada artículo.
// ============================================================

// ---------------- 1) Qué entra ----------------
// Confirmada en el código oficial del BOE para esta oposición. El Capítulo
// II (artículos 4 a 8) son en su mayoría modificaciones históricas a otras
// leyes (LSSI, firma electrónica...) ya incorporadas en los textos
// consolidados que ya tenemos montados; el contenido realmente vivo y
// examinable es el Capítulo I.

// ---------------- 2) Qué ha caído ----------------
// Comprobado sobre la materia EXÁMENES en Supabase, con las diez convocatorias
// completas (2018, 2019, 2022, 2024 y 2025, ingreso libre y promoción interna).
const ARTICULOS_EN_EXAMEN = {
  "1": [
    { anio: "2024", sobre: "qué establece sobre la factura electrónica" },
    { anio: "2024 (promoción interna)", sobre: "qué establece sobre la factura electrónica" },
  ],
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
    </div>`;
}

function htmlDisposiciones(disposiciones) {
  return `
    <div class="const-disposiciones">
      <h2>Disposiciones</h2>
      ${(disposiciones || [])
        .map((d, i) => {
          const idDisp = `disp${i}`;
          return `
        <div class="const-disp-bloque" id="${idDisp}">
          <div class="const-disp-tipo">${botonAltavozLey(idDisp)}<span>${escaparHtml(d.tipo)}</span></div>
          ${(d.items || [])
            .map((it) => `<div class="const-disp-item"><strong>${escaparHtml(it.numero)}</strong> ${escaparHtml(it.texto)}</div>`)
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
    const res = await fetch("data/ley56-2007.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    datos = await res.json();
  } catch (e) {
    console.error("Error cargando ley56-2007.json:", e);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar el texto. Recarga la página.</div>`;
    return;
  }

  let html = `<p class="ley-fuente">${escaparHtml(datos.actualizacion)} Referencia ${escaparHtml(datos.referencia)}.</p>`;
  html += (datos.capitulos || []).map((c, i) => htmlCapitulo(c, "ley56", i)).join("");
  html += htmlDisposiciones(datos.disposiciones);

  contenedor.innerHTML = html;

  iniciarLectoresLey(contenedor);
})();
