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

  // Aviso de "Mi racha", SOLO la primera vez que se entra cada día (no en
  // cada visita). La marca de "ya visto hoy" se guarda en localStorage con
  // la fecha de hoy en la clave, así al día siguiente vuelve a salir una vez.
  mostrarAvisoRachaSiToca();
})();

async function mostrarAvisoRachaSiToca() {
  const hoyStr = new Date().toISOString().slice(0, 10);
  const clave = "racha-aviso-mostrado-" + hoyStr;
  if (localStorage.getItem(clave)) return;

  const { data, error } = await sb.rpc("racha_estado_hoy_web");
  if (error || !data || !data.length) return;
  const estado = data[0];
  localStorage.setItem(clave, "1");

  const NOMBRES_BLOQUE_CORTOS = {
    "BLOQUE 1: DERECHO": "Derecho", "BLOQUE 2: TECNOLOGÍA": "Tecnología",
    "BLOQUE 3: DESARROLLO": "Desarrollo", "BLOQUE 4: SISTEMAS Y COMUNICACIONES": "Sistemas y Comunicaciones",
    "MEZCLADO": "mezclado, los 4 bloques",
  };
  const nombreBloque = NOMBRES_BLOQUE_CORTOS[estado.bloque_dia] || estado.bloque_dia;
  const yaCompleta = estado.barra1 && estado.barra2 && estado.barra3;

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(20,16,40,.78);display:flex;align-items:center;justify-content:center;padding:20px;z-index:2000;";
  overlay.innerHTML = `
    <div style="background:var(--tarjeta);border-radius:20px;padding:26px 24px;max-width:400px;width:100%;text-align:center;">
      <div style="font-size:2.6rem;margin-bottom:6px">🔥</div>
      <h2 style="margin:0 0 8px">${estado.racha_actual > 0 ? `Llevas ${estado.racha_actual} ${estado.racha_actual === 1 ? "día" : "días"} seguidos` : "¡Empieza tu racha hoy!"}</h2>
      <p style="margin:0 0 18px;opacity:.85">${yaCompleta ? "Ya has completado las tareas de hoy. ¡Vuelve mañana!" : `Hoy toca <strong>${nombreBloque}</strong>. Tres tareas cortas y listo.`}</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button type="button" class="btn btn-secundario" id="btn-aviso-racha-luego">Ahora no</button>
        ${yaCompleta ? "" : `<a href="racha.html" class="btn btn-primario">Ir a mi racha →</a>`}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById("btn-aviso-racha-luego").addEventListener("click", () => overlay.remove());
}
