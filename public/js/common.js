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
 * reintenta un par de veces por si acaba de registrarse hace un instante. */
async function obtenerUsuarioWeb(sesion, reintentos = 3) {
  for (let i = 0; i < reintentos; i++) {
    const { data, error } = await sb.from("usuarios_web").select("*").eq("auth_user_id", sesion.user.id).maybeSingle();
    if (error) {
      console.error("Error consultando usuarios_web:", error);
      return null;
    }
    if (data) return data;
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

/** Calcula si el acceso (trial o pago) está vigente, igual que la base de datos. */
function calcularAcceso(usuario) {
  const ahora = new Date();
  if (usuario.fecha_inicio_trial) {
    const finTrial = new Date(usuario.fecha_inicio_trial);
    finTrial.setHours(finTrial.getHours() + HORAS_TRIAL);
    if (ahora < finTrial) return { acceso: true, motivo: "trial", hasta: finTrial };
  }
  if (usuario.fecha_expiracion) {
    const finPago = new Date(usuario.fecha_expiracion);
    if (ahora < finPago) return { acceso: true, motivo: "pago", hasta: finPago };
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

function pintarNavbar(activa, usuario) {
  const el = document.getElementById("navbar");
  if (!el) return;
  const nombre = (usuario && (usuario.nombre || usuario.email)) || "Estudiante";
  el.innerHTML = `
    <div class="marca"><img src="img/logo-buho.png" alt="" class="logo-buho" /> Oposición TAI</div>
    <div class="usuario">
      <span>👋 ${nombre}</span>
      <button id="btn-logout">Salir</button>
    </div>
  `;
  const btn = document.getElementById("btn-logout");
  if (btn) btn.addEventListener("click", cerrarSesion);
}

/** Pinta el banner de trial/pago en el elemento con id="banner-acceso". */
function pintarBannerAcceso(usuario) {
  const el = document.getElementById("banner-acceso");
  if (!el) return;
  if (!usuario.email_verificado) {
    el.className = "banner-acceso trial";
    el.innerHTML = `📧 Confirma tu correo para que arranque tu prueba gratuita de ${HORAS_TRIAL}h.`;
    return;
  }
  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    el.className = "banner-acceso caducado";
    el.innerHTML = `❌ Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€ →</a>`;
    return;
  }
  const msRestantes = acceso.hasta.getTime() - Date.now();
  const horas = msRestantes / (1000 * 60 * 60);
  const texto = horas <= 24 ? `${Math.max(1, Math.round(horas))} horas` : `${Math.ceil(horas / 24)} días`;
  if (acceso.motivo === "trial") {
    el.className = "banner-acceso trial";
    el.innerHTML = `🎁 Prueba gratuita: te quedan <strong>${texto}</strong>. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€ →</a>`;
  } else {
    el.className = "banner-acceso pago";
    el.innerHTML = `✅ Acceso activo. Te quedan <strong>${texto}</strong>.`;
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
  if (eraElMismo) return;
  const limpio = String(texto || "").replace(/\s+/g, " ").trim();
  if (!limpio) return;
  const utterancia = new SpeechSynthesisUtterance(limpio);
  utterancia.lang = "es-ES";
  utterancia.rate = 0.95;
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
