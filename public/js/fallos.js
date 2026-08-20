// ============================================================
// Lógica de "Mis fallos" (fallos.html)
// ============================================================

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const zona = document.getElementById("zona-fallos");
  if (!usuario) {
    zona.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta.</div>`;
    return;
  }
  pintarSidebar("fallos.html", usuario);
  pintarBannerAcceso(usuario);

  if (!usuario.email_verificado) {
    zona.innerHTML = `<div class="vacio"><div class="icono">📧</div>Confirma tu correo para ver tus fallos.</div>`;
    return;
  }

  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    zona.innerHTML = `<div class="vacio">Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  const { data: filas, error } = await sb.from("mis_fallos_web").select("id, materia, tema, pregunta").order("id");
  if (error) {
    console.error(error);
    zona.innerHTML = `<div class="vacio">No se han podido cargar tus fallos.</div>`;
    return;
  }
  if (!filas || !filas.length) {
    zona.innerHTML = `<div class="vacio"><div class="icono">🎉</div>Todavía no tienes fallos guardados. ¡Sigue así!</div>`;
    return;
  }

  const ids = filas.map((f) => f.id).join(",");
  zona.innerHTML = `
    <div style="margin-bottom:18px">
      <a class="btn btn-primario" href="quiz.html?modo=lista&ids=${encodeURIComponent(ids)}&titulo=${encodeURIComponent("Mis fallos")}">Practicar mis ${filas.length} fallos →</a>
    </div>
    <div class="lista-preguntas-mini">
      ${filas.map((f) => `
        <div class="pregunta-mini">
          <div class="pregunta-mini-cuerpo">
            <div class="pregunta-mini-texto">${f.pregunta}</div>
            <div class="pregunta-mini-meta"><span class="chip oficial">${f.materia}</span><span class="chip no-oficial">${f.tema}</span></div>
          </div>
        </div>`).join("")}
    </div>
  `;
})();
