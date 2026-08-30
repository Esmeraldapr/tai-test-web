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
  { href: "temas.html", icono: "📘", texto: "Repasar Tema" },
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

// ---------------- Accesibilidad: lectura en voz alta + lightbox ----------------
const sintesisVoz = window.speechSynthesis || null;
let botonVozActivo = null;
function detenerLectura() {
  if (sintesisVoz && sintesisVoz.speaking) sintesisVoz.cancel();
  if (botonVozActivo) {
    botonVozActivo.textContent = botonVozActivo.dataset.iconoReposo || "🔊";
    botonVozActivo.dataset.leyendo = "0";
  }
  botonVozActivo = null;
}
function leerTexto(texto, boton) {
  if (!sintesisVoz) return;
  const eraElMismo = boton && boton.dataset.leyendo === "1";
  detenerLectura();
  if (eraElMismo) return; // pulsar el mismo botón mientras lee = parar
  const limpio = String(texto || "").replace(/\s+/g, " ").trim();
  if (!limpio) return;
  const utterancia = new SpeechSynthesisUtterance(limpio);
  utterancia.lang = "es-ES";
  utterancia.rate = 0.95;
  if (boton) {
    boton.dataset.iconoReposo = boton.dataset.iconoReposo || boton.textContent;
    boton.textContent = "⏹️";
    boton.dataset.leyendo = "1";
    botonVozActivo = boton;
  }
  utterancia.onend = () => { if (botonVozActivo === boton) detenerLectura(); };
  utterancia.onerror = () => { if (botonVozActivo === boton) detenerLectura(); };
  sintesisVoz.speak(utterancia);
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
document.addEventListener("click", (e) => {
  const parrafo = e.target.closest(".parrafo-leible");
  if (parrafo) {
    detenerLectura();
    leerTexto(parrafo.textContent, null);
    return;
  }
  const img = e.target.closest(".ampliable");
  if (img) {
    abrirLightbox(img.currentSrc || img.src, img.alt);
    return;
  }
  if (e.target.closest("#lightbox-cerrar") || e.target.id === "lightbox-overlay") {
    cerrarLightbox();
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

  // Saltar de una columna a otra
  if (enMenu && e.key === "ArrowRight") {
    const contenido = document.querySelector(".main-contenido");
    const destino = contenido && focoDentro(contenido)[0];
    if (destino) { e.preventDefault(); destino.focus(); }
    return;
  }
  if (enContenido && e.key === "ArrowLeft") {
    const menu = document.querySelector(".sidebar-nav");
    const activo = menu && (menu.querySelector("a.activo") || menu.querySelector("a"));
    if (activo) { e.preventDefault(); activo.focus(); }
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
