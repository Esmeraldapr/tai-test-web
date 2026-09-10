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

  // Cada tema viene como "2018 IL · Primera Parte", "2019 · Supuesto I", etc.
  // Se agrupan por convocatoria (lo que hay antes de " · ") para que cada
  // parte (Primera Parte / cada supuesto) sea una tarjeta propia, y no se
  // mezclen entre sí al hacer el cuestionario.
  const grupos = new Map();
  filas.forEach((f) => {
    const [convocatoria, parte] = f.tema.split(" · ");
    if (!grupos.has(convocatoria)) grupos.set(convocatoria, []);
    grupos.get(convocatoria).push({ tema: f.tema, parte: parte || f.tema, total: f.total });
  });

  const ordenConvocatorias = [...grupos.keys()].sort().reverse();

  function enlaceQuiz(tema) {
    return `quiz.html?materia=${encodeURIComponent("EXÁMENES")}&tema=${encodeURIComponent(tema)}&modo=tema`;
  }

  cont.innerHTML = ordenConvocatorias.map((convocatoria) => {
    const partes = grupos.get(convocatoria);
    const primera = partes.find((p) => p.parte === "Primera Parte");
    const supuestos = partes.filter((p) => p.parte !== "Primera Parte");
    return `
    <section class="convocatoria-grupo">
      <h2 class="convocatoria-titulo">${convocatoria}</h2>
      <div class="tarjetas-convocatoria">
        ${primera ? `
        <a class="convocatoria-card" href="${enlaceQuiz(primera.tema)}">
          <div class="convocatoria-anio">Primera Parte</div>
          <div class="convocatoria-n">${primera.total} preguntas</div>
          <span class="btn btn-primario btn-bloque">Empezar →</span>
        </a>` : ""}
        ${supuestos.map((s) => `
        <a class="convocatoria-card" href="${enlaceQuiz(s.tema)}">
          <div class="convocatoria-anio">${s.parte}</div>
          <div class="convocatoria-n">${s.total} preguntas</div>
          <span class="btn btn-primario btn-bloque">Empezar →</span>
        </a>`).join("")}
        ${supuestos.length > 1 ? `
        <button type="button" class="convocatoria-card btn-sorpresa" data-convocatoria="${escaparAtributo(convocatoria)}">
          <div class="convocatoria-anio">🎲 Sorpréndeme</div>
          <div class="convocatoria-n">Elige un supuesto al azar, como el día del examen</div>
          <span class="btn btn-secundario btn-bloque">Elegir por mí →</span>
        </button>` : ""}
      </div>
    </section>`;
  }).join("");

  cont.querySelectorAll(".btn-sorpresa").forEach((btn) => {
    btn.addEventListener("click", () => {
      const convocatoria = btn.dataset.convocatoria;
      const supuestos = grupos.get(convocatoria).filter((p) => p.parte !== "Primera Parte");
      const elegido = supuestos[Math.floor(Math.random() * supuestos.length)];
      window.location.href = enlaceQuiz(elegido.tema);
    });
  });
})();

function escaparAtributo(s) {
  return String(s || "").replace(/"/g, "&quot;");
}
