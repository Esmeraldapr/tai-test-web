// ============================================================
// Lógica de "LO 3/2007, igualdad efectiva" (lo3-2007.html)
// Pinta el texto consolidado (Títulos → Capítulos → Secciones → Artículos,
// Disposiciones) a partir de data/lo3-2007.json, con lector de voz en cola
// por título, capítulo y sección, y dos marcas distintas:
//   1) si ese título entra en el temario de la convocatoria vigente;
//   2) en qué exámenes oficiales ha caído cada artículo.
// ============================================================

// ---------------- 1) Qué entra ----------------
// OJO: interpretación nuestra, no cita del BOE.
// El Anexo V (BOE-A-2025-26262) no nombra esta ley. El tema 5 del Bloque I dice
// literalmente: "Políticas de igualdad y contra la violencia de género.
// Políticas de igualdad de trato y no discriminación de las personas LGTBI.
// Discapacidad y dependencia: régimen jurídico". Delimita materias, no normas.
// Esta es la ley española de políticas de igualdad, así que se da por que entra
// entera. Los exámenes han preguntado por cuatro títulos distintos (I, II, IV
// y V), lo que respalda que no hay recorte razonable.
// El tema 5 lo forman CINCO leyes; esta es la primera que montamos. Faltan la
// LO 1/2004 (violencia de género), la Ley 4/2023 (LGTBI), el RDL 1/2013
// (discapacidad) y la Ley 39/2006 (dependencia).
// ⚠️ Revisar cuando salga la siguiente convocatoria.
const TITULOS_QUE_ENTRAN = {
  "tit-preliminar": true, "tit-i": true, "tit-ii": true, "tit-iii": true,
  "tit-iv": true, "tit-v": true, "tit-vi": true, "tit-vii": true, "tit-viii": true,
};

// ---------------- 2) Qué ha caído ----------------
// Verificado uno a uno sobre los enunciados oficiales.
const ARTICULOS_EN_EXAMEN = {
  "8": [{ anio: "2019", sobre: "trato desfavorable por embarazo o maternidad" }],
  "9": [{ anio: "2022 (promoción interna)", sobre: "represalias por reclamar el principio de igualdad de trato" }],
  "26": [{ anio: "2018", sobre: "igualdad en la creación y producción artística" }],
  "49": [{ anio: "2022", sobre: "apoyo a la implantación voluntaria de planes de igualdad" }],
  "51": [{ anio: "2019", sobre: "criterios de actuación de las Administraciones públicas" }],
};

const TITULOS_EN_EXAMEN = {};

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

function htmlTitulo(titulo) {
  const entra = TITULOS_QUE_ENTRAN[titulo.id];
  const chip = entra
    ? `<span class="chip entra">✅ Entra en el temario actual</span>`
    : `<span class="chip no-entra">No entra actualmente</span>`;
  return `
    <div class="const-titulo" id="${escaparHtml(titulo.id)}">
      <div class="const-titulo-header">
        ${botonAltavozLey(titulo.id)}
        <span class="const-titulo-num">${escaparHtml(titulo.numero)}</span>
        ${titulo.nombre ? `<span class="const-titulo-nombre">${escaparHtml(titulo.nombre)}</span>` : ""}
        ${chip}
      </div>
      ${htmlAvisoTitulo(titulo.id)}
      ${(titulo.articulos || []).map(htmlArticulo).join("")}
      ${(titulo.capitulos || []).map((c, i) => htmlCapitulo(c, titulo.id, i)).join("")}
    </div>`;
}

// Igual que ARTICULOS_EN_EXAMEN pero para disposiciones (adicionales,
// transitorias, derogatoria, finales), que no tienen número de artículo.
// Clave: "tipo-ordinal" en minúsculas, tal como aparece al principio del
// propio texto de la disposición (p. ej. "Disposición adicional primera."
// → "adicional-primera").
const DISPOSICIONES_EN_EXAMEN = {
  "adicional-primera": [{ anio: "2018 (ingreso libre y promoción interna)", sobre: "qué es la composición equilibrada" }],
};

function claveDisposicion(texto) {
  const m = String(texto || "").match(/^Disposici[oó]n\s+(adicional|transitoria|derogatoria|final)\s+(\S+)\.?/i);
  if (!m) return null;
  return `${m[1].toLowerCase()}-${m[2].toLowerCase().replace(/\.$/, "")}`;
}

function htmlAvisoExamenDisp(texto) {
  const clave = claveDisposicion(texto);
  const caidas = clave ? DISPOSICIONES_EN_EXAMEN[clave] : null;
  if (!caidas || !caidas.length) return "";
  const detalle = caidas
    .map((c) => `${escaparHtml(c.anio)}${c.sobre ? ` (${escaparHtml(c.sobre)})` : ""}`)
    .join(" · ");
  const veces = caidas.length === 1 ? "Ha caído en examen" : `Ha caído ${caidas.length} veces`;
  return `<div class="aviso-examen"><span class="chip examen">📌 ${veces}</span> <span class="aviso-examen-detalle">${detalle}</span></div>`;
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
            .map((it) => {
              const marcada = DISPOSICIONES_EN_EXAMEN[claveDisposicion(it.texto)];
              return `<div class="const-disp-item${marcada ? " articulo-preguntado" : ""}">${it.numero ? `<strong>${escaparHtml(it.numero)}.</strong> ` : ""}${htmlAvisoExamenDisp(it.texto)}${escaparHtml(it.texto)}</div>`;
            })
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
    const res = await fetch("data/lo3-2007.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    datos = await res.json();
  } catch (e) {
    console.error("Error cargando lo3-2007.json:", e);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar el texto. Recarga la página.</div>`;
    return;
  }

  let html = `<p class="ley-fuente">${escaparHtml(datos.actualizacion)} Referencia ${escaparHtml(datos.referencia)}.</p>`;
  html += (datos.titulos || []).map(htmlTitulo).join("");
  html += htmlDisposiciones(datos.disposiciones);

  contenedor.innerHTML = html;

  iniciarLectoresLey(contenedor);
})();
