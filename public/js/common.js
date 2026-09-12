// ============================================================
// Utilidades comunes — Web TAI
// Requiere que config.js se haya cargado antes.
// ============================================================

async function obtenerSesion() {
  const { data } = await sb.auth.getSession();
  return data.session || null;
}

async function exigirSesion() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    window.location.href = "login.html";
    return null;
  }
  return sesion;
}

/** Trae la fila de usuarios_web del usuario logueado. La crea automáticamente
 * un trigger en Supabase al darse de alta, así que normalmente ya existe;
 * reintenta varias veces tanto si aún no existe (acaba de registrarse) como
 * si hay un error puntual de red/servidor (antes un solo fallo transitorio
 * hacía que se rindiera sin reintentar, y eso rompía la carga de la cuenta
 * de gente con la fila ya creada desde hace tiempo). */
async function obtenerUsuarioWeb(sesion, reintentos = 5) {
  let ultimoError = null;
  for (let i = 0; i < reintentos; i++) {
    const { data, error } = await sb.from("usuarios_web").select("*").eq("auth_user_id", sesion.user.id).maybeSingle();
    if (data) return data;
    ultimoError = error;
    if (error) console.error(`Error consultando usuarios_web (intento ${i + 1}/${reintentos}):`, error);
    await new Promise((r) => setTimeout(r, 500 + i * 250));
  }
  if (ultimoError) console.error("obtenerUsuarioWeb: se agotaron los reintentos con error:", ultimoError);
  return null;
}

/** Calcula si el acceso (trial o pago) está vigente, igual que la base de datos.
 * IMPORTANTE: se comprueba primero el PAGO y luego el trial (no al revés). Si
 * se comprobara el trial primero, alguien que paga mientras su trial gratuito
 * todavía no ha terminado seguiría viendo motivo "trial" en vez de "pago", y
 * el aviso de "ya tienes acceso, no pagues otra vez" (pago.html) nunca
 * saltaría — permitiendo un pago duplicado real. Con el pago comprobado
 * primero, en cuanto hay un pago vigente manda sobre el trial. */
function calcularAcceso(usuario) {
  const ahora = new Date();
  if (usuario.fecha_expiracion) {
    const finPago = new Date(usuario.fecha_expiracion);
    if (ahora < finPago) return { acceso: true, motivo: "pago", hasta: finPago };
  }
  if (usuario.fecha_inicio_trial) {
    const finTrial = new Date(usuario.fecha_inicio_trial);
    finTrial.setHours(finTrial.getHours() + HORAS_TRIAL);
    if (ahora < finTrial) return { acceso: true, motivo: "trial", hasta: finTrial };
  }
  return { acceso: false };
}

async function registrarConexion() {
  const { error } = await sb.rpc("registrar_conexion_web");
  if (error) console.error("Error registrando conexión:", error);
}

async function cerrarSesion() {
  await sb.auth.signOut();
  window.location.href = "login.html";
}

/** Enlace de "¿Has olvidado tu contraseña?" en la pantalla de entrar.
 * Se pinta desde aquí y no dentro de login.html porque common.js ya se carga
 * en esa página, y así el enlace vive en un único sitio. Solo aparece si
 * existe el formulario de entrar, es decir, solo en login.html. */
document.addEventListener("DOMContentLoaded", () => {
  const formEntrar = document.getElementById("form-entrar");
  if (!formEntrar || document.getElementById("enlace-olvide")) return;
  const parrafo = document.createElement("p");
  parrafo.style.textAlign = "center";
  parrafo.style.marginTop = "14px";
  parrafo.style.fontSize = "0.9rem";
  parrafo.innerHTML = `<a id="enlace-olvide" href="recuperar.html">¿Has olvidado tu contraseña?</a>`;
  formEntrar.appendChild(parrafo);
});

const NAV_ITEMS = [
  { href: "index.html", icono: "🏠", texto: "Dashboard" },
  { href: "tutorial.html", icono: "❔", texto: "Tutorial" },
  { href: "teoria.html", icono: "📖", texto: "Teoría" },
  { href: "imprescindibles.html", icono: "💡", texto: "Los imprescindibles" },
  { href: "temas.html", icono: "📘", texto: "Test por temas" },
  { href: "practica.html", icono: "⚡", texto: "Practicar" },
  { href: "cuestionarios.html", icono: "📝", texto: "Cuestionarios" },
  { href: "progreso.html", icono: "📈", texto: "Mi progreso" },
  { href: "fallos.html", icono: "🎯", texto: "Mis fallos" },
  { href: "favoritas.html", icono: "⭐", texto: "Mis favoritas" },
];

function pintarSidebar(activa, usuario) {
  const el = document.getElementById("sidebar");
  if (!el) return;
  const nombre = (usuario && (usuario.nombre || usuario.email)) || "Estudiante";
  el.innerHTML = `
    <div class="sidebar-marca"><img src="${LOGO_BUHO}" alt="" class="logo-buho" /> Oposición TAI</div>
    <nav class="sidebar-nav">
      ${NAV_ITEMS.map(
        (it) => `
        <a href="${it.href}" class="nav-link${activa === it.href ? " activa" : ""}">
          <span class="nav-icono">${it.icono}</span><span class="nav-texto">${it.texto}</span>
        </a>`
      ).join("")}
    </nav>
    <div class="sidebar-usuario">
      <span>👋 ${nombre}</span>
      <div id="sidebar-acceso" class="sidebar-acceso"></div>
      <button id="btn-logout">Salir</button>
    </div>
  `;
  const btn = document.getElementById("btn-logout");
  if (btn) btn.addEventListener("click", cerrarSesion);
    ponerSelectorVelocidad();
}

/** Pinta el aviso de trial/pago, discreto, dentro de la barra lateral
 * (id="sidebar-acceso" — ver pintarSidebar). Antes era un banner grande a todo
 * lo ancho justo debajo del título de cada página; a petición de la usuaria
 * ahora es una línea pequeña junto a su nombre, no lo primero que se ve. */
function pintarBannerAcceso(usuario) {
  const el = document.getElementById("sidebar-acceso");
  if (!el) return;
  if (!usuario.email_verificado) {
    el.className = "sidebar-acceso";
    el.innerHTML = `📧 Confirma tu correo para empezar tu prueba de ${DIAS_TRIAL} días`;
    return;
  }
  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    el.className = "sidebar-acceso caducado";
    el.innerHTML = `❌ Acceso caducado · <a href="pago.html">${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€ →</a>`;
    return;
  }
  const msRestantes = acceso.hasta.getTime() - Date.now();
  const horas = msRestantes / (1000 * 60 * 60);
  const texto = horas <= 24 ? `${Math.max(1, Math.round(horas))}h` : `${Math.ceil(horas / 24)} días`;
  if (acceso.motivo === "trial") {
    el.className = "sidebar-acceso";
    el.innerHTML = `🎁 Prueba: ${texto} · <a href="pago.html">Ampliar →</a>`;
  } else {
    el.className = "sidebar-acceso";
    el.innerHTML = `✅ Acceso activo (${texto})`;
  }
}

// ---------------- Accesibilidad: lectura en voz alta con resaltado ----------------
// Motor único para toda la web. Antes cada página (leyes, imprescindibles,
// tutorial, preguntas) tenía su propia copia de esto, sin resaltar nada.
// Ahora todas llaman a leerEnCola()/leerTexto() de aquí: un solo sitio que
// tocar, y todas ganan el resaltado palabra a palabra a la vez (pensado
// sobre todo para dislexia y otras dificultades lectoras, como "Leer en voz
// alta" de Word).
//
// leerEnCola(items, opciones)
//   items: array de { prefijo, elementos, alEmpezar }
//     - prefijo: texto corto que se dice pero NO se resalta (p. ej. "Artículo
//       26." o "Opción A"). Puede omitirse.
//     - elementos: elemento del DOM, o array de elementos, cuyo texto visible
//       se lee y se resalta palabra por palabra. Puede omitirse (solo se dice
//       el prefijo).
//     - alEmpezar(item, indice): opcional, se llama justo antes de leer este
//       elemento (para marcarlo como "sonando" y hacer scroll, por ejemplo).
//   opciones: { boton, alTerminarTodo }
//     - boton: alterna su icono 🔊/⏹️; si se pulsa el mismo botón mientras
//       lee, para en vez de reiniciar.
//     - alTerminarTodo: opcional, se llama al acabar toda la cola (o al
//       pararla desde fuera con detenerLectura()).
//
// leerTexto(elementoOTexto, boton) sigue existiendo para los sitios que solo
// leen una cosa suelta: acepta un elemento del DOM (se resalta) o, por
// compatibilidad con llamadas antiguas, una cadena de texto (no se resalta).
const sintesisVoz = window.speechSynthesis || null;
let vozActiva = null; // { boton, cola, indice, opciones }

function contarPalabras(txt) {
  const m = String(txt || "").trim().match(/\S+/g);
  return m ? m.length : 0;
}

/** Envuelve (una sola vez, es idempotente) cada palabra del texto visible de
 * `el` en un <span class="palabra-tts">. Devuelve esos spans en orden. */
function envolverPalabras(el) {
  if (!el) return [];
  if (!el.dataset.palabrasEnvueltas) {
    const recorrer = (nodo) => {
      Array.from(nodo.childNodes).forEach((hijo) => {
        if (hijo.nodeType === Node.TEXT_NODE) {
          if (!hijo.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach((parte) => {
            if (parte === "") return;
            if (/^\s+$/.test(parte)) {
              frag.appendChild(document.createTextNode(parte));
            } else {
              const span = document.createElement("span");
              span.className = "palabra-tts";
              span.textContent = parte;
              frag.appendChild(span);
            }
          });
          hijo.replaceWith(frag);
        } else if (hijo.nodeType === Node.ELEMENT_NODE && !hijo.classList.contains("palabra-tts")) {
          recorrer(hijo);
        }
      });
    };
    recorrer(el);
    el.dataset.palabrasEnvueltas = "1";
  }
  return Array.from(el.querySelectorAll(".palabra-tts"));
}

function detenerLectura() {
  if (sintesisVoz && sintesisVoz.speaking) sintesisVoz.cancel();
  if (vozActiva) {
    if (vozActiva.spansActuales) {
      vozActiva.spansActuales.forEach((s) => s.classList.remove("palabra-tts-activa"));
    }
    if (vozActiva.boton) {
      vozActiva.boton.textContent = vozActiva.boton.dataset.iconoReposo || "🔊";
      vozActiva.boton.dataset.leyendo = "0";
      vozActiva.boton.classList.remove("leyendo");
    }
    if (vozActiva.itemActivo && vozActiva.itemActivo.alTerminarEsteItem) {
      vozActiva.itemActivo.alTerminarEsteItem();
    }
  }
  vozActiva = null;
}

function hablarSiguienteDeCola() {
  if (!vozActiva) return;
  const { cola, indice } = vozActiva;
  if (indice >= cola.length) {
    const alTerminarTodo = vozActiva.opciones && vozActiva.opciones.alTerminarTodo;
    detenerLectura();
    if (alTerminarTodo) alTerminarTodo();
    return;
  }
  const item = cola[indice] || {};
  if (vozActiva.itemActivo && vozActiva.itemActivo.alTerminarEsteItem) vozActiva.itemActivo.alTerminarEsteItem();
  if (item.alEmpezar) item.alEmpezar(item, indice);
  vozActiva.itemActivo = item;

  const lista = item.elementos ? (Array.isArray(item.elementos) ? item.elementos : [item.elementos]) : [];
  const spans = [];
  lista.filter(Boolean).forEach((el) => spans.push(...envolverPalabras(el)));
  const textoElementos = spans.map((s) => s.textContent).join(" ");
  const limpio = `${item.prefijo || ""} ${textoElementos}`.replace(/\s+/g, " ").trim();
  vozActiva.spansActuales = spans;

  if (!limpio) {
    vozActiva.indice++;
    hablarSiguienteDeCola();
    return;
  }

  const utterancia = new SpeechSynthesisUtterance(limpio);
  utterancia.lang = "es-ES";
  utterancia.rate = typeof VELOCIDAD_VOZ !== "undefined" ? VELOCIDAD_VOZ : 0.95;

  const palabrasPrefijo = contarPalabras(item.prefijo);
  let contadorPalabraHablada = 0;
  let indicePalabraActual = -1;
  if (spans.length) {
    utterancia.onboundary = (ev) => {
      if (ev.name && ev.name !== "word") return;
      if (indicePalabraActual >= 0 && spans[indicePalabraActual]) {
        spans[indicePalabraActual].classList.remove("palabra-tts-activa");
      }
      contadorPalabraHablada++;
      const idx = contadorPalabraHablada - palabrasPrefijo - 1;
      if (idx < 0 || idx >= spans.length) {
        indicePalabraActual = -1;
        return;
      }
      indicePalabraActual = idx;
      spans[idx].classList.add("palabra-tts-activa");
      spans[idx].scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
  }

  const siguiente = () => {
    if (!vozActiva) return;
    spans.forEach((s) => s.classList.remove("palabra-tts-activa"));
    vozActiva.indice++;
    hablarSiguienteDeCola();
  };
  utterancia.onend = siguiente;
  utterancia.onerror = siguiente;

  sintesisVoz.speak(utterancia);
}

function leerEnCola(items, opciones = {}) {
  if (!sintesisVoz) return;
  const boton = opciones.boton || null;
  const eraElMismo = boton && boton.dataset.leyendo === "1";
  detenerLectura();
  if (eraElMismo) return; // pulsar el mismo botón mientras lee = parar

  const cola = (items || []).filter(
    (it) => it && ((it.prefijo && it.prefijo.trim()) || it.elementos)
  );
  if (!cola.length) return;

  vozActiva = { boton, cola, indice: 0, opciones, spansActuales: [], itemActivo: null };
  if (boton) {
    boton.dataset.iconoReposo = boton.dataset.iconoReposo || boton.textContent;
    boton.textContent = "⏹️";
    boton.dataset.leyendo = "1";
    boton.classList.add("leyendo");
  }
  hablarSiguienteDeCola();
}

/** Compatibilidad: lee una sola cosa suelta. `elementoOTexto` puede ser un
 * elemento del DOM (se resalta palabra a palabra) o, para llamadas antiguas,
 * una cadena de texto ya construida a mano (no se resalta, pero sigue
 * sonando igual que siempre). */
function leerTexto(elementoOTexto, boton) {
  if (typeof elementoOTexto === "string") {
    leerEnCola([{ prefijo: elementoOTexto }], { boton });
  } else {
    leerEnCola([{ elementos: elementoOTexto }], { boton });
  }
}

// ---------------- Lector en cola para páginas de leyes/normas ----------------
// Compartido por todas las páginas de Teoría con Títulos → Capítulos →
// Secciones → Artículos (constitución, y las leyes/LO del tema 5 y afines).
// A diferencia del resto de la web, aquí no se guarda el texto aparte: se
// lee directamente del HTML ya pintado (por eso el resaltado de palabra
// funciona igual que en todo lo demás, y no hay dos copias del texto que
// puedan desincronizarse).
//
// botonAltavozLey(idDestino) pinta el botón 🔊; iniciarLectoresLey() los
// engancha todos de una vez tras pintar el HTML.
function botonAltavozLey(idDestino) {
  return `<button type="button" class="btn-altavoz" data-lee="${idDestino}" title="Escuchar desde aquí">🔊</button>`;
}

function itemDeNodoLey(nodo) {
  if (nodo.classList.contains("const-articulo")) {
    const numero = nodo.dataset.numero || "";
    return {
      prefijo: numero ? `Artículo ${numero}.` : "",
      elementos: [nodo.querySelector(".art-epigrafe"), nodo.querySelector(".art-texto")].filter(Boolean),
    };
  }
  const num = nodo.querySelector(
    ":scope > .const-titulo-header .const-titulo-num, :scope > .const-capitulo-header .const-capitulo-num, :scope > .const-seccion-header .const-seccion-num"
  );
  const nombre = nodo.querySelector(
    ":scope > .const-titulo-header .const-titulo-nombre, :scope > .const-capitulo-header .const-capitulo-nombre, :scope > .const-seccion-header .const-seccion-nombre"
  );
  return { elementos: [num, nombre].filter(Boolean) };
}

function itemsLecturaLey(nodo) {
  if (!nodo) return [];
  const items = [itemDeNodoLey(nodo)];
  nodo.querySelectorAll(".const-titulo, .const-capitulo, .const-seccion, .const-articulo").forEach((n) => {
    items.push(itemDeNodoLey(n));
  });
  return items;
}

/** Las disposiciones no tienen título/artículo: cada `.const-disp-item` es
 * ya un bloque de texto suelto, así que se lee y se resalta entero. */
function itemsLecturaDisposiciones(bloqueEl) {
  if (!bloqueEl) return [];
  return Array.from(bloqueEl.querySelectorAll(".const-disp-item")).map((el) => ({ elementos: el }));
}

/** Llamar una vez, justo después de pintar el HTML de la norma. */
function iniciarLectoresLey(raiz) {
  (raiz || document).querySelectorAll(".btn-altavoz[data-lee]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const contenedor = document.getElementById(boton.dataset.lee);
      const items =
        contenedor && contenedor.classList.contains("const-disp-bloque")
          ? itemsLecturaDisposiciones(contenedor)
          : itemsLecturaLey(contenedor);
      leerEnCola(items, { boton });
    });
  });
}
function abrirLightbox(src, alt) {
  let overlay = document.getElementById("lightbox-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "lightbox-overlay";
    overlay.innerHTML = `<img id="lightbox-img" src="" alt="" /><button id="lightbox-cerrar" title="Cerrar" aria-label="Cerrar">✕</button>`;
    document.body.appendChild(overlay);
  }
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox-img").alt = alt || "";
  overlay.classList.add("activo");
}
function cerrarLightbox() {
  const el = document.getElementById("lightbox-overlay");
  if (el) el.classList.remove("activo");
}

/** Igual que el lightbox de imágenes, pero para el texto que plantea un
 * supuesto ("En el departamento TIC al que usted acaba de incorporarse...").
 * Sin esto, una pregunta suelta de un supuesto puede no tener sentido. */
function abrirContexto(texto) {
  let overlay = document.getElementById("contexto-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "contexto-overlay";
    overlay.innerHTML = `<div id="contexto-caja"><button id="contexto-cerrar" title="Cerrar" aria-label="Cerrar">✕</button><h3>📄 Planteamiento del supuesto</h3><p id="contexto-texto" class="parrafo-leible"></p></div>`;
    document.body.appendChild(overlay);
  }
  document.getElementById("contexto-texto").textContent = texto || "";
  overlay.classList.add("activo");
}
function cerrarContexto() {
  const el = document.getElementById("contexto-overlay");
  if (el) el.classList.remove("activo");
}
document.addEventListener("click", (e) => {
  const parrafo = e.target.closest(".parrafo-leible");
  if (parrafo) {
    leerTexto(parrafo, null);
    return;
  }
  const img = e.target.closest(".ampliable");
  if (img) {
    abrirLightbox(img.currentSrc || img.src, img.alt);
    return;
  }
  const btnContexto = e.target.closest(".btn-ver-contexto");
  if (btnContexto) {
    abrirContexto(btnContexto.dataset.contexto || "");
    return;
  }
  if (e.target.closest("#lightbox-cerrar") || e.target.id === "lightbox-overlay") {
    cerrarLightbox();
  }
  if (e.target.closest("#contexto-cerrar") || e.target.id === "contexto-overlay") {
    cerrarContexto();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarLightbox();
});

// ---------------- Favoritas ----------------
/** Devuelve un Set con los id de pregunta que el usuario tiene en favoritos_web. */
async function obtenerFavoritosSet() {
  const { data, error } = await sb.from("favoritos_web").select("pregunta_id");
  if (error) {
    console.error("Error cargando favoritos:", error);
    return new Set();
  }
  return new Set((data || []).map((f) => f.pregunta_id));
}

async function marcarFavorito(preguntaId) {
  const { error } = await sb.from("favoritos_web").insert({ pregunta_id: preguntaId });
  return !error;
}

async function desmarcarFavorito(preguntaId) {
  const { error } = await sb.from("favoritos_web").delete().eq("pregunta_id", preguntaId);
  return !error;
}
// Guiño para quien abra la consola.
(function holaMundo() {
  const estiloTitulo = "font-size:15px; font-weight:700; color:#7c3aed;";
  const estiloTexto = "font-size:12px; color:#555;";
  console.log("%c👋 Hola, mundo.", estiloTitulo);
  console.log("%cSi has abierto la consola, esto también va contigo: mucho ánimo con la oposición.", estiloTexto);
  console.log("%c¿Has visto algo raro? Cuéntamelo desde Tutorial → Sugerencias.", estiloTexto);
})();
// Enlace de salto: primer elemento al pulsar Tab, lleva directo al contenido
// sin tener que recorrer todo el menú lateral en cada página.
(function enlaceSaltar() {
  const destino = document.querySelector(".main-contenido") || document.querySelector(".contenedor");
  if (!destino) return;
  if (!destino.id) destino.id = "contenido-principal";
  destino.setAttribute("tabindex", "-1");
  const enlace = document.createElement("a");
  enlace.className = "saltar-contenido";
  enlace.href = `#${destino.id}`;
  enlace.textContent = "Saltar al contenido";
  enlace.addEventListener("click", (e) => {
    e.preventDefault();
    destino.focus();
    destino.scrollIntoView({ block: "start" });
  });
  document.body.prepend(enlace);
})();
// Navegación con flechas: arriba y abajo se mueven dentro de la columna,
// derecha salta del menú al contenido y izquierda vuelve al menú.
document.addEventListener("keydown", (e) => {
  const teclas = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"];
  if (!teclas.includes(e.key)) return;
  const enMenu = e.target.closest && e.target.closest(".sidebar-nav");
  const enContenido = e.target.closest && e.target.closest(".main-contenido");
  if (!enMenu && !enContenido) return;

  const focoDentro = (zona) => Array.from(
    zona.querySelectorAll('a, button:not([disabled]), input, select, textarea')
  ).filter((el) => el.offsetParent !== null);

  
    // Saltar de una columna a otra, buscando lo que esté a la misma altura
  const masCercanoEnVertical = (candidatos, referencia) => {
    if (!candidatos.length) return null;
    const y = referencia.getBoundingClientRect().top;
    return candidatos.reduce((mejor, el) =>
      Math.abs(el.getBoundingClientRect().top - y) < Math.abs(mejor.getBoundingClientRect().top - y) ? el : mejor
    );
  };
  if (enMenu && e.key === "ArrowRight") {
    const contenido = document.querySelector(".main-contenido");
    const destino = contenido && masCercanoEnVertical(focoDentro(contenido), document.activeElement);
    if (destino) { e.preventDefault(); destino.focus(); }
    return;
  }
  if (enContenido && e.key === "ArrowLeft") {
    const menu = document.querySelector(".sidebar-nav");
    const destino = menu && masCercanoEnVertical(Array.from(menu.querySelectorAll("a")), document.activeElement);
    if (destino) { e.preventDefault(); destino.focus(); }
    return;
  }

                           // Moverse dentro del menú con arriba y abajo
  if (!enMenu) return;
  const lista = Array.from(enMenu.querySelectorAll("a"));
  const actual = lista.indexOf(document.activeElement);
  if (actual === -1) return;
  let destino;
  if (e.key === "ArrowDown") destino = (actual + 1) % lista.length;
  else if (e.key === "ArrowUp") destino = (actual - 1 + lista.length) % lista.length;
  else if (e.key === "Home") destino = 0;
  else if (e.key === "End") destino = lista.length - 1;
  else return;
  e.preventDefault();
  lista[destino].focus();
});


// ---------------- Velocidad de la lectura en voz alta ----------------
// Se guarda en el navegador y vale para toda la web. Si el navegador no deja
// guardar (modo privado, permisos), sigue funcionando pero sin recordarla.
let VELOCIDAD_VOZ = 0.95;
try {
  const guardada = parseFloat(localStorage.getItem("tai_velocidad_voz"));
  if (guardada >= 0.25 && guardada <= 2) VELOCIDAD_VOZ = guardada;
} catch (e) { /* sin almacenamiento disponible */ }

function ponerSelectorVelocidad() {
  const zona = document.querySelector(".sidebar-usuario");
  if (!zona || document.getElementById("selector-velocidad")) return;
  const caja = document.createElement("div");
  caja.className = "caja-velocidad";
  caja.innerHTML = `
    <label for="selector-velocidad">🔊 Velocidad de lectura</label>
    <select id="selector-velocidad">
      <option value="0.5">Muy lenta (0,5×)</option>
      <option value="0.75">Lenta (0,75×)</option>
      <option value="0.95">Normal</option>
      <option value="1.25">Rápida (1,25×)</option>
      <option value="1.5">Muy rápida (1,5×)</option>
      <option value="2">Máxima (2×)</option>
    </select>`;
  zona.insertBefore(caja, zona.querySelector("#btn-logout"));
  const select = caja.querySelector("select");
  select.value = String(VELOCIDAD_VOZ);
  select.addEventListener("change", () => {
    VELOCIDAD_VOZ = parseFloat(select.value);
    try { localStorage.setItem("tai_velocidad_voz", String(VELOCIDAD_VOZ)); } catch (e) {}
    detenerLectura();
  });
}
