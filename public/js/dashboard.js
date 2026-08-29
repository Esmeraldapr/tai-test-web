// ============================================================
// Lógica del Dashboard (index.html)
// ============================================================

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const stats = document.getElementById("stats");

  if (!usuario) {
    stats.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta. Recarga la página en unos segundos.</div>`;
    return;
  }

  pintarSidebar("index.html", usuario);
  pintarBannerAcceso(usuario);
  registrarConexion();

  const acceso = calcularAcceso(usuario);
  let textoAcceso = "Caducado";
  if (acceso.acceso) {
    const msRestantes = acceso.hasta.getTime() - Date.now();
    const horas = msRestantes / (1000 * 60 * 60);
    textoAcceso = horas <= 24 ? `${Math.max(1, Math.round(horas))} h` : `${Math.ceil(horas / 24)} días`;
  }

  const [{ data: resumen }, { count: totalResueltas }, { count: totalAciertos }, { count: totalFavoritas }] = await Promise.all([
    sb.from("preguntas_resumen").select("total"),
    sb.from("respuestas_web").select("*", { count: "exact", head: true }),
    sb.from("respuestas_web").select("*", { count: "exact", head: true }).eq("es_correcta", true),
    sb.from("favoritos_web").select("*", { count: "exact", head: true }),
  ]);

  const bancoTotal = (resumen || []).reduce((acc, f) => acc + f.total, 0);
  const pctAciertos = totalResueltas ? Math.round(((totalAciertos || 0) / totalResueltas) * 100) : 0;

  stats.innerHTML = `
    <div class="stat-card">
      <div class="stat-icono">📚</div>
      <div class="stat-numero">${bancoTotal.toLocaleString("es-ES")}</div>
      <div class="stat-etiqueta">Preguntas en el banco</div>
    </div>
    <div class="stat-card">
      <div class="stat-icono">✅</div>
      <div class="stat-numero">${totalResueltas ? pctAciertos + "%" : "—"}</div>
      <div class="stat-etiqueta">Aciertos (${totalResueltas || 0} respondidas)</div>
    </div>
    <div class="stat-card">
      <div class="stat-icono">⭐</div>
      <div class="stat-numero">${totalFavoritas || 0}</div>
      <div class="stat-etiqueta">Preguntas favoritas</div>
    </div>
    <div class="stat-card">
      <div class="stat-icono">⏳</div>
      <div class="stat-numero">${textoAcceso}</div>
      <div class="stat-etiqueta">Acceso restante</div>
    </div>
  `;
})();
