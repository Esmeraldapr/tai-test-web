// ============================================================
// Lógica de "Constitución Española" (constitucion.html)
// Pinta el texto íntegro (Preámbulo, Títulos → Capítulos → Secciones →
// Artículos, Disposiciones) a partir de data/constitucion.json, con un
// lector de voz en cola (varias frases encadenadas) por cada título,
// capítulo y sección, y un aviso de si ese título entra en el temario
// de la convocatoria actual.
// ============================================================

// Qué títulos entran en el temario de la convocatoria vigente (Tema 1 del
// Bloque I según la Resolución de convocatoria BOE-A-2025-26262, examen del
// 23/05/2026). Revisar y actualizar esta lista cuando se publique la
// siguiente convocatoria.
const TITULOS_QUE_ENTRAN = {
  preliminar: true,
  "titulo-1": true, // Derechos y deberes fundamentales
  "titulo-2": true, // La Corona
  "titulo-3": true, // Las Cortes Generales
  "titulo-4": true, // Gobierno y Administración
  "titulo-5": false,
  "titulo-6": false,
  "titulo-7": false,
  "titulo-8": false,
  "titulo-9": true, // Tribunal Constitucional
  "titulo-10": false,
};

// ---------------- Utilidades de render ----------------
function escaparHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function htmlArticulo(a) {
  return `<div class="const-articulo" id="art-${escaparHtml(String(a.numero)).replace(/\s+/g, "-")}" data-numero="${escaparHtml(a.numero)}"><strong>Artículo ${a.numero}.</strong> <span class="art-texto">${escaparHtml(a.texto)}</span></div>`;
}

function htmlSeccion(seccion, idPadre, indice) {
  const idSeccion = `${idPadre}-sec${indice}`;
  return `
    <div class="const-seccion" id="${idSeccion}">
      <div class="const-seccion-header">
        ${botonAltavozLey(idSeccion)}
        <span class="const-seccion-num">${seccion.numero}</span>
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
        <span class="const-capitulo-num">${capitulo.numero}</span>
        ${capitulo.nombre ? `<span class="const-capitulo-nombre">${escaparHtml(capitulo.nombre)}</span>` : ""}
      </div>
      ${(capitulo.articulos || []).map(htmlArticulo).join("")}
      ${(capitulo.secciones || []).map((s, i) => htmlSeccion(s, idCapitulo, i)).join("")}
    </div>`;
}

function htmlTitulo(titulo) {
  const entra = TITULOS_QUE_ENTRAN[titulo.id];
  const chip = entra
    ? `<span class="chip entra">✅ Entra en el temario actual</span>`
    : `<span class="chip no-entra">No entra actualmente</span>`;
  return `
    <div class="const-titulo" id="${titulo.id}">
      <div class="const-titulo-header">
        ${botonAltavozLey(titulo.id)}
        <span class="const-titulo-num">${titulo.numero}</span>
        ${titulo.nombre ? `<span class="const-titulo-nombre">${escaparHtml(titulo.nombre)}</span>` : ""}
        ${chip}
      </div>
      ${(titulo.articulos || []).map(htmlArticulo).join("")}
      ${(titulo.capitulos || []).map((c, i) => htmlCapitulo(c, titulo.id, i)).join("")}
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
  const contenedor = document.getElementById("constitucion");

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
    const res = await fetch("data/constitucion.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    datos = await res.json();
  } catch (e) {
    console.error("Error cargando constitucion.json:", e);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar el texto. Recarga la página.</div>`;
    return;
  }

  let html = `<div class="const-preambulo"><h2><button type="button" class="btn-altavoz" id="btn-preambulo" title="Escuchar desde aquí">🔊</button>Preámbulo</h2><p id="preambulo-texto">${escaparHtml(datos.preambulo)}</p></div>`;
  html += (datos.titulos || []).map(htmlTitulo).join("");
  html += htmlDisposiciones(datos.disposiciones);

  contenedor.innerHTML = html;

  const btnPreambulo = document.getElementById("btn-preambulo");
  if (btnPreambulo) {
    btnPreambulo.addEventListener("click", () =>
      leerTexto(document.getElementById("preambulo-texto"), btnPreambulo)
    );
  }
  iniciarLectoresLey(contenedor);
})();
