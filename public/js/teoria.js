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
      <a class="accion-card" href="ley19-2013.html">
        <div class="accion-icono">🔍</div>
        <h3>Ley 19/2013, de transparencia</h3>
        <p>Texto consolidado del BOE. Entra entera en la convocatoria actual, y va marcado qué artículos han caído ya en exámenes oficiales.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
          <a class="accion-card" href="ley3-2018.html">
        <div class="accion-icono">🔐</div>
        <h3>LO 3/2018, protección de datos</h3>
        <p>Texto consolidado del BOE. Solo entran principios, derechos, obligaciones y derechos digitales; el resto va marcado como que no entra.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
            <a class="accion-card" href="ens-311-2022.html">
        <div class="accion-icono">🛡️</div>
        <h3>ENS, Esquema Nacional de Seguridad</h3>
        <p>RD 311/2022. Los 41 artículos y los cuatro anexos, con la tabla de las 72 medidas de seguridad y el glosario buscables.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
            <a class="accion-card" href="eni-4-2010.html">
        <div class="accion-icono">🔗</div>
        <h3>ENI, Esquema Nacional de Interoperabilidad</h3>
        <p>RD 4/2010. Los 29 artículos y el glosario, con la lista de Normas Técnicas destacada por ser lo que más cae.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
            <a class="accion-card" href="rd1112-2018.html">
        <div class="accion-icono">♿</div>
        <h3>RD 1112/2018, accesibilidad web</h3>
        <p>Los 20 artículos del decreto que exige que las webs públicas sean accesibles. Es la norma que no ha faltado en ningún examen desde 2019.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
            <a class="accion-card" href="lo3-2007.html">
        <div class="accion-icono">⚖️</div>
        <h3>LO 3/2007, igualdad efectiva</h3>
        <p>Los 78 artículos de la ley de igualdad de mujeres y hombres. Primera de las cinco leyes del tema 5, y la que más cae de ese tema.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
    </div>
  `;
})();
