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

  async function cargarYPintar() {
    zona.innerHTML = `<div class="spinner"></div>`;
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
      <div class="acciones-fallos">
        <a class="btn btn-primario" href="quiz.html?modo=lista&ids=${encodeURIComponent(ids)}&titulo=${encodeURIComponent("Mis fallos")}">Practicar mis ${filas.length} fallos →</a>
        <button class="btn btn-secundario" id="btn-eliminar-todos">🗑️ Eliminar todos</button>
      </div>
      <div class="lista-preguntas-mini">
        ${filas.map((f) => `
          <div class="pregunta-mini" data-id="${f.id}">
            <div class="pregunta-mini-cuerpo">
              <div class="pregunta-mini-texto">${f.pregunta}</div>
              <div class="pregunta-mini-meta"><span class="chip oficial">${f.materia}</span><span class="chip no-oficial">${f.tema}</span></div>
            </div>
            <button class="btn-quitar-fallo" data-id="${f.id}" title="Quitar de mis fallos">✕</button>
          </div>`).join("")}
      </div>
    `;

    document.getElementById("btn-eliminar-todos").addEventListener("click", async () => {
      if (!confirm("¿Eliminar TODOS tus fallos de esta lista? No afecta a tu % de aciertos, solo vacía este repaso.")) return;
      const { error } = await sb.rpc("descartar_todos_mis_fallos_web");
      if (error) { console.error(error); alert("No se ha podido vaciar la lista. Inténtalo de nuevo."); return; }
      cargarYPintar();
    });

    document.querySelectorAll(".btn-quitar-fallo").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const preguntaId = Number(btn.dataset.id);
        btn.disabled = true;
        const { error } = await sb.from("fallos_descartados_web").upsert(
          { pregunta_id: preguntaId },
          { onConflict: "auth_user_id,pregunta_id" }
        );
        if (error) { console.error(error); alert("No se ha podido quitar esta pregunta."); btn.disabled = false; return; }
        btn.closest(".pregunta-mini").remove();
        if (!document.querySelector(".pregunta-mini")) cargarYPintar();
      });
    });
  }

  cargarYPintar();
})();
