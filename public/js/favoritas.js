// ============================================================
// Lógica de "Mis favoritas" (favoritas.html)
// ============================================================

async function cargarFavoritas() {
  const zona = document.getElementById("zona-favoritas");
  const { data: filas, error } = await sb.from("mis_favoritas_web").select("id, materia, tema, pregunta").order("id");
  if (error) {
    console.error(error);
    zona.innerHTML = `<div class="vacio">No se han podido cargar tus favoritas.</div>`;
    return;
  }
  if (!filas || !filas.length) {
    zona.innerHTML = `<div class="vacio"><div class="icono">⭐</div>Todavía no has marcado ninguna pregunta como favorita. Puedes hacerlo desde el icono ⭐ durante un test.</div>`;
    return;
  }

  const ids = filas.map((f) => f.id).join(",");
  zona.innerHTML = `
    <div style="margin-bottom:18px">
      <a class="btn btn-primario" href="quiz.html?modo=lista&ids=${encodeURIComponent(ids)}&titulo=${encodeURIComponent("Mis favoritas")}">Practicar mis ${filas.length} favoritas →</a>
    </div>
    <div class="lista-preguntas-mini">
      ${filas.map((f) => `
        <div class="pregunta-mini" data-id="${f.id}">
          <div class="pregunta-mini-cuerpo">
            <div class="pregunta-mini-texto">${f.pregunta}</div>
            <div class="pregunta-mini-meta"><span class="chip oficial">${f.materia}</span><span class="chip no-oficial">${f.tema}</span></div>
          </div>
          <button class="btn-quitar-favorita" data-id="${f.id}" type="button">✕ Quitar</button>
        </div>`).join("")}
    </div>
  `;

  document.querySelectorAll(".btn-quitar-favorita").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const ok = await desmarcarFavorito(parseInt(btn.dataset.id, 10));
      if (ok) cargarFavoritas();
      else btn.disabled = false;
    });
  });
}

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const zona = document.getElementById("zona-favoritas");
  if (!usuario) {
    zona.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta.</div>`;
    return;
  }
  pintarSidebar("favoritas.html", usuario);
  pintarBannerAcceso(usuario);

  if (!usuario.email_verificado) {
    zona.innerHTML = `<div class="vacio"><div class="icono">📧</div>Confirma tu correo para ver tus favoritas.</div>`;
    return;
  }

  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    zona.innerHTML = `<div class="vacio">Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  await cargarFavoritas();
})();
