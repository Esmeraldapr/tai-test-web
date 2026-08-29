// ============================================================
// Lógica del Dashboard (index.html)
// ============================================================

/** Añade la tarjeta de "Los imprescindibles" a la rejilla de acciones.
 * Se pinta desde aquí y no dentro de index.html por el mismo motivo que el
 * enlace de recuperar contraseña vive en common.js: index.html lleva el logo
 * en base64 y subirlo entero para añadir seis líneas sale carísimo. Si algún
 * día se edita index.html a mano, hay que quitar esta función o saldrá la
 * tarjeta dos veces. */
function anadirTarjetaImprescindibles() {
  const rejilla = document.querySelector(".acciones-grid");
  if (!rejilla || rejilla.querySelector('a[href="imprescindibles.html"]')) return;
  const tarjeta = document.createElement("a");
  tarjeta.className = "accion-card";
  tarjeta.href = "imprescindibles.html";
  tarjeta.innerHTML = `
    <div class="accion-icono">💡</div>
    <h3>Los imprescindibles</h3>
    <p>Los conceptos que más se repiten en el examen, en fichas rápidas.</p>
    <span class="accion-flecha">Ver →</span>`;
  const tutorial = rejilla.querySelector('a[href="tutorial.html"]');
  if (tutorial && tutorial.nextSibling) rejilla.insertBefore(tarjeta, tutorial.nextSibling);
  else rejilla.appendChild(tarjeta);
}

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
  anadirTarjetaImprescindibles();

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
