// ============================================================
// Lógica de "Teoría" (teoria.html) — landing de leyes disponibles.
// De momento solo la Constitución; el diseño admite añadir más
// tarjetas (leyes) en el futuro sin tocar el resto de la web.
// ============================================================

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const contenedor = document.getElementById("leyes");

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

  contenedor.innerHTML = `
    <div class="acciones-grid">
      <a class="accion-card" href="constitucion.html">
        <div class="accion-icono">🏛️</div>
        <h3>Constitución Española</h3>
        <p>Texto íntegro de 1978, con indicación de qué títulos entran en la convocatoria actual y lectura en voz alta por título, capítulo y sección.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
    </div>
  `;
})();
