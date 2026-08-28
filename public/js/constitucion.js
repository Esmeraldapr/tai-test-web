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

// ---------------- Lector de voz en cola (varias frases encadenadas) ----------------
// Distinto del leerTexto() de un solo párrafo que ya hay en common.js: aquí
// un título/capítulo puede tener miles de caracteres repartidos en muchos
// artículos, y encadenar utterances cortas es más fiable que una gigante.
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
  utterancia.rate = 0.95;
  utterancia.onend = () => { if (colaVoz.activa) hablarSiguienteDeCola(); };
  utterancia.onerror = () => { if (colaVoz.activa) detenerColaVoz(); };
  sintesisVoz.speak(utterancia);
}

function leerCola(textos, boton) {
  if (!sintesisVoz) return;
  const eraElMismo = colaVoz.activa && colaVoz.boton === boton;
  detenerLectura(); // por si había una lectura de párrafo suelto activa (common.js)
  detenerColaVoz();
  if (eraElMismo) return; // pulsar el mismo botón mientras lee = parar
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

// ---------------- Recolección de texto por nivel (para el lector) ----------------
function textosDeArticulos(articulos) {
  return (articulos || []).map((a) => `Artículo ${a.numero}. ${a.texto}`);
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

/** Crea un botón de altavoz y registra, en el mismo orden, qué debe leer. */
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

function htmlArticulo(a) {
  return `<div class="const-articulo"><strong>Artículo ${a.numero}.</strong> <span class="art-texto">${escaparHtml(a.texto)}</span></div>`;
}

function htmlSeccion(seccion) {
  return `
    <div class="const-seccion">
      <div class="const-seccion-header">
        ${botonAltavoz(textosDeSeccion(seccion))}
        <span class="const-seccion-num">${seccion.numero}</span>
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
        <span class="const-capitulo-num">${capitulo.numero}</span>
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
    <div class="const-titulo" id="${titulo.id}">
      <div class="const-titulo-header">
        ${botonAltavoz(textosDeTitulo(titulo))}
        <span class="const-titulo-num">${titulo.numero}</span>
        ${titulo.nombre ? `<span class="const-titulo-nombre">${escaparHtml(titulo.nombre)}</span>` : ""}
        ${chip}
      </div>
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

  contadorBotones = 0;
  textosPorBoton.length = 0;

  let html = `<div class="const-preambulo"><h2>${botonAltavoz([datos.preambulo])}Preámbulo</h2><p>${escaparHtml(datos.preambulo)}</p></div>`;
  html += (datos.titulos || []).map(htmlTitulo).join("");
  html += htmlDisposiciones(datos.disposiciones);

  contenedor.innerHTML = html;

  contenedor.querySelectorAll(".btn-altavoz").forEach((boton) => {
    const idBoton = Number(boton.dataset.vozId);
    boton.addEventListener("click", () => leerCola(textosPorBoton[idBoton - 1], boton));
  });
})();
