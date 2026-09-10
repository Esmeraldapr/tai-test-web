// ============================================================
// Lógica de "Ley 39/2015, procedimiento administrativo" (ley39-2015.html)
// A diferencia de las páginas de leyes completas, esta NO pinta
// Títulos/Capítulos: solo los artículos que han caído en examen, porque la
// ley no está en el temario de la convocatoria vigente (ver aviso en la
// propia página). Reutiliza el mismo motor de voz de common.js
// (botonAltavozLey / iniciarLectoresLey), que funciona igual sobre una
// lista plana de artículos.
// ============================================================

// Verificado a mano sobre el enunciado de cada examen (aún sin cargar la
// materia EXÁMENES completa en Supabase para todos los años).
const ARTICULOS_EN_EXAMEN = {
  "11": [
    { anio: "2018 (promoción interna)", sobre: "supuestos en los que NO se requiere firma obligatoria" },
    { anio: "2024", sobre: "uso obligatorio de firma" },
  ],
  "14": [{ anio: "2018 (ingreso libre y promoción interna)", sobre: "personas físicas no obligadas a relacionarse electrónicamente" }],
  "30": [{ anio: "2019", sobre: "cómputo de plazos señalados en días" }],
  "44": [{ anio: "2024", sobre: "notificación infructuosa, tablón edictal único" }],
};

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
    <div class="const-articulo articulo-preguntado" id="art-${escaparHtml(a.numero)}" data-numero="${escaparHtml(a.numero)}">
      <strong>Artículo ${escaparHtml(a.numero)}.</strong>
      <em class="art-epigrafe">${escaparHtml(a.epigrafe)}.</em>
      ${htmlAvisoExamen(a.numero)}
      <span class="art-texto">${escaparHtml(a.texto)}</span>
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
    const res = await fetch("data/ley39-2015.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    datos = await res.json();
  } catch (e) {
    console.error("Error cargando ley39-2015.json:", e);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar el texto. Recarga la página.</div>`;
    return;
  }

  let html = `<p class="ley-fuente">Referencia ${escaparHtml(datos.referencia)}.</p>`;
  html += `<div id="todos-los-articulos">${botonAltavozLey("todos-los-articulos")} <strong>Escuchar los ${datos.articulos.length} artículos seguidos</strong>`;
  html += datos.articulos.map(htmlArticulo).join("");
  html += `</div>`;

  contenedor.innerHTML = html;

  iniciarLectoresLey(contenedor);
})();
