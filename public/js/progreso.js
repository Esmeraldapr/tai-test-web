// ============================================================
// Lógica de "Mi progreso" (progreso.html)
// ============================================================

function claveDiaLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const contenedor = document.getElementById("progreso");

  if (!usuario) {
    contenedor.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta. Recarga la página en unos segundos.</div>`;
    return;
  }

  pintarSidebar("progreso.html", usuario);
  pintarBannerAcceso(usuario);
  registrarConexion();

  const { data: filas, error } = await sb
    .from("resultados_web")
    .select("materia, aciertos, total, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar tu progreso. Recarga la página.</div>`;
    return;
  }

  if (!filas || !filas.length) {
    contenedor.innerHTML = `<div class="vacio"><div class="icono">📈</div>Aún no tienes resultados guardados.<br/>Completa un test y aquí empezarás a ver tu evolución.</div>`;
    return;
  }

  // --- Racha de días practicados ---
  // Los días se calculan en el huso horario LOCAL del navegador (no UTC), para que
  // "hoy" y el calendario coincidan con el día real del usuario. Antes se usaba
  // toISOString() (siempre UTC), lo que en España (UTC+1/+2) hacía que un test
  // completado "hoy" no contara para la racha hasta el día siguiente.
  const diasPracticados = new Set(filas.map((f) => claveDiaLocal(new Date(f.created_at))));
  const HOY = new Date();
  HOY.setHours(0, 0, 0, 0);

  let racha = 0;
  {
    let i = 0;
    while (i < 1000) {
      const d = new Date(HOY);
      d.setDate(d.getDate() - i);
      const clave = claveDiaLocal(d);
      if (diasPracticados.has(clave)) {
        racha++;
        i++;
      } else if (i === 0) {
        // hoy todavía no has practicado: no rompe la racha, se comprueba desde ayer
        i++;
      } else {
        break;
      }
    }
  }

  const DIAS_CALENDARIO = 21;
  let calendarioHtml = "";
  for (let i = DIAS_CALENDARIO - 1; i >= 0; i--) {
    const d = new Date(HOY);
    d.setDate(d.getDate() - i);
    const clave = claveDiaLocal(d);
    const practicado = diasPracticados.has(clave);
    const esHoy = i === 0;
    const etiqueta = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" });
    calendarioHtml += `<div class="dia-racha${practicado ? " practicado" : ""}${esHoy ? " hoy" : ""}" title="${etiqueta}">${d.getDate()}</div>`;
  }

  // --- Evolución del % de aciertos (últimos 30 días con datos) ---
  const porDia = new Map();
  for (const f of filas) {
    const clave = claveDiaLocal(new Date(f.created_at));
    if (!porDia.has(clave)) porDia.set(clave, { aciertos: 0, total: 0 });
    const d = porDia.get(clave);
    d.aciertos += f.aciertos;
    d.total += f.total;
  }
  const diasOrdenados = [...porDia.keys()].sort().slice(-30);
  const etiquetasEvolucion = diasOrdenados.map((c) => {
    const [, m, d] = c.split("-");
    return `${d}/${m}`;
  });
  const datosEvolucion = diasOrdenados.map((c) => {
    const { aciertos, total } = porDia.get(c);
    return total ? Math.round((aciertos / total) * 100) : 0;
  });

  // --- Comparativa por bloque / fundamento ---
  const porMateria = new Map();
  for (const f of filas) {
    if (!porMateria.has(f.materia)) porMateria.set(f.materia, { aciertos: 0, total: 0 });
    const m = porMateria.get(f.materia);
    m.aciertos += f.aciertos;
    m.total += f.total;
  }
  const materiasOrdenadas = [...porMateria.entries()]
    .map(([materia, v]) => ({ materia, pct: v.total ? Math.round((v.aciertos / v.total) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct);

  const totalTests = filas.length;
  const totalAciertos = filas.reduce((acc, f) => acc + f.aciertos, 0);
  const totalPreguntas = filas.reduce((acc, f) => acc + f.total, 0);
  const pctGlobal = totalPreguntas ? Math.round((totalAciertos / totalPreguntas) * 100) : 0;

  contenedor.innerHTML = `
    <div class="stats-grid" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-icono">🔥</div>
        <div class="stat-numero">${racha}</div>
        <div class="stat-etiqueta">día${racha === 1 ? "" : "s"} seguidos</div>
      </div>
      <div class="stat-card">
        <div class="stat-icono">📝</div>
        <div class="stat-numero">${totalTests}</div>
        <div class="stat-etiqueta">tests completados</div>
      </div>
      <div class="stat-card">
        <div class="stat-icono">🎯</div>
        <div class="stat-numero">${pctGlobal}%</div>
        <div class="stat-etiqueta">acierto global</div>
      </div>
    </div>

    <div class="panel">
      <h2>Tu racha</h2>
      <div class="calendario-racha">${calendarioHtml}</div>
    </div>

    <div class="panel">
      <h2>Evolución del acierto</h2>
      <canvas id="grafica-evolucion" height="90"></canvas>
    </div>

    <div class="panel">
      <h2>Por bloque / fundamento</h2>
      <canvas id="grafica-bloques" height="${Math.max(90, materiasOrdenadas.length * 34)}"></canvas>
    </div>
  `;

  new Chart(document.getElementById("grafica-evolucion"), {
    type: "line",
    data: {
      labels: etiquetasEvolucion,
      datasets: [
        {
          label: "% aciertos",
          data: datosEvolucion,
          borderColor: "#7c3aed",
          backgroundColor: "rgba(124,58,237,.12)",
          tension: 0.3,
          fill: true,
          pointBackgroundColor: "#7c3aed",
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } },
    },
  });

  new Chart(document.getElementById("grafica-bloques"), {
    type: "bar",
    data: {
      labels: materiasOrdenadas.map((m) => m.materia),
      datasets: [
        {
          label: "% aciertos",
          data: materiasOrdenadas.map((m) => m.pct),
          backgroundColor: "#7c6ff0",
          borderRadius: 8,
        },
      ],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: { x: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } },
    },
  });
})();
