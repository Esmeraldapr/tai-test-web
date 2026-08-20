// ============================================================
// Lógica de "Cuestionarios" (cuestionarios.html) — exámenes
// oficiales de convocatorias anteriores (materia EXÁMENES),
// agrupados por convocatoria (el "tema" de cada fila).
// ============================================================

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const cont = document.getElementById("convocatorias");
  if (!usuario) {
    cont.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta.</div>`;
    return;
  }
  pintarSidebar("cuestionarios.html", usuario);
  pintarBannerAcceso(usuario);

  if (!usuario.email_verificado) {
    cont.innerHTML = `<div class="vacio"><div class="icono">📧</div>Confirma tu correo para acceder a los cuestionarios.</div>`;
    return;
  }

  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    cont.innerHTML = `<div class="vacio">Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  const { data: filas, error } = await sb.from("preguntas_resumen").select("tema, total").eq("materia", "EXÁMENES");
  if (error) {
    console.error(error);
    cont.innerHTML = `<div class="vacio">No se han podido cargar los cuestionarios.</div>`;
    return;
  }
  if (!filas || !filas.length) {
    cont.innerHTML = `<div class="vacio">No hay cuestionarios disponibles todavía.</div>`;
    return;
  }

  const ordenados = [...filas].sort((a, b) => a.tema.localeCompare(b.tema));
  cont.innerHTML = ordenados.map((f) => `
    <a class="convocatoria-card" href="quiz.html?materia=${encodeURIComponent("EXÁMENES")}&tema=${encodeURIComponent(f.tema)}&modo=tema">
      <div class="convocatoria-anio">${f.tema}</div>
      <div class="convocatoria-n">${f.total} preguntas</div>
      <span class="btn btn-primario btn-bloque">Empezar →</span>
    </a>`).join("");
})();
