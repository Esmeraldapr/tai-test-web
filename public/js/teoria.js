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
      <a class="accion-card" href="ley39-2006.html">
        <div class="accion-icono">🧓</div>
        <h3>Ley 39/2006, dependencia</h3>
        <p>Los 48 artículos de la ley de la dependencia. Segunda de las cinco leyes del tema 5, con los dos artículos sobre grados de dependencia que ya han caído en examen.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
      <a class="accion-card" href="lo1-2004.html">
        <div class="accion-icono">🚨</div>
        <h3>LO 1/2004, violencia de género</h3>
        <p>Los 74 artículos de la ley integral contra la violencia de género. Tercera de las cinco leyes del tema 5, con el artículo sobre el sistema educativo que cayó en el examen de 2026.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
      <a class="accion-card" href="ley4-2023.html">
        <div class="accion-icono">🏳️‍🌈</div>
        <h3>Ley 4/2023, trans y LGTBI</h3>
        <p>Los 82 artículos de la ley de igualdad real y efectiva de las personas trans y LGTBI. Cuarta de las cinco leyes del tema 5, con el artículo sobre infracciones que cayó como pregunta de reserva en 2026.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
      <a class="accion-card" href="rdl1-2013.html">
        <div class="accion-icono">♿</div>
        <h3>RDL 1/2013, discapacidad</h3>
        <p>Los 106 artículos del Texto Refundido de derechos de las personas con discapacidad. Quinta y última ley del tema 5: ha caído dos veces (2024 promoción interna y el examen provisional de 2025), en los artículos 2 y 4.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
      <a class="accion-card" href="ebep-5-2015.html">
        <div class="accion-icono">🧑‍💼</div>
        <h3>RDL 5/2015, Estatuto del Empleado Público</h3>
        <p>Los 101 artículos del Estatuto Básico del Empleado Público. Del tema 4, y esta sí está citada literalmente en la convocatoria (no por interpretación nuestra). Ha caído dos veces, en 2018 y en el examen provisional de 2025.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
      <a class="accion-card" href="rgpd.html">
        <div class="accion-icono">🇪🇺</div>
        <h3>RGPD, protección de datos (UE)</h3>
        <p>Los 99 artículos del Reglamento europeo de protección de datos. Completa el tema 7 junto a la LO 3/2018. Es la norma con más apariciones de las que faltaban por montar: 6 veces en las diez convocatorias contadas.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
      <a class="accion-card" href="ley6-2020.html">
        <div class="accion-icono">🔏</div>
        <h3>Ley 6/2020, servicios de confianza</h3>
        <p>Los 21 artículos de la Ley de servicios electrónicos de confianza. Candidata para el tema 6, junto al DNI electrónico. Ha caído 3 veces, siempre sobre el mismo artículo (vigencia de los certificados).</p>
        <span class="accion-flecha">Leer →</span>
      </a>
      <a class="accion-card" href="rd203-2021.html">
        <div class="accion-icono">💻</div>
        <h3>RD 203/2021, sector público electrónico</h3>
        <p>Los 65 artículos del Reglamento de actuación y funcionamiento por medios electrónicos, con su anexo de 49 definiciones. Candidato para los temas 8 y 9. Ha caído 2 veces, siempre sobre el mismo artículo.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
      <a class="accion-card" href="eidas.html">
        <div class="accion-icono">🇪🇺</div>
        <h3>Reglamento eIDAS (UE 910/2014)</h3>
        <p>Los 52 artículos del reglamento europeo de identificación electrónica y servicios de confianza, con sus 4 anexos. Candidato para el tema 6, junto a la Ley 6/2020. Ha caído en el Anexo III.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
      <a class="accion-card" href="ley39-2015.html">
        <div class="accion-icono">📄</div>
        <h3>Ley 39/2015, procedimiento administrativo</h3>
        <p>⚠️ No está en el temario de esta convocatoria. Solo los 4 artículos que han caído en exámenes anteriores (11, 14, 30 y 44), no la ley entera.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
      <a class="accion-card" href="ley40-2015.html">
        <div class="accion-icono">🏛️</div>
        <h3>Ley 40/2015, régimen jurídico sector público</h3>
        <p>⚠️ No está en el temario de esta convocatoria. Solo los 2 artículos que han caído en examen (55 y 156), no la ley entera.</p>
        <span class="accion-flecha">Leer →</span>
      </a>
    </div>
  `;
})();
