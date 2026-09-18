// ============================================================
// "Mi progreso" (progreso.html) — rehecho el 18/09.
// Antes tenía un calendario de racha y una comparativa por bloque entero
// (barras horizontales); ambas cosas se han quitado de aquí: el calendario
// y la racha viven ahora en racha.html, y "por bloque entero" daba muy poca
// información real. En su lugar: un mapa de calor por TEMA (no por bloque),
// para saber justo dónde reforzar, y la evolución del acierto en el tiempo.
//
// Los datos salen de respuestas_web (una fila por pregunta respondida, con
// su pregunta_id), cruzada con preguntas para saber la materia y el tema de
// cada una. Esto es más fino que resultados_web (que agrega por sesión de
// test y en modo aleatorio no guarda tema), y funciona igual venga la
// pregunta de donde venga: Test por temas, Practicar, o Mi racha.
// ============================================================

const NOMBRES_MATERIA_CORTOS = {
  "BLOQUE 1: DERECHO": "Bloque 1 · Derecho",
  "BLOQUE 2: TECNOLOGÍA": "Bloque 2 · Tecnología",
  "BLOQUE 3: DESARROLLO": "Bloque 3 · Desarrollo",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES": "Bloque 4 · Sistemas y Comunicaciones",
  "FUNDAMENTOS 1: INFORMÁTICA": "Fundamentos · Informática",
  "FUNDAMENTOS 2: PROGRAMACIÓN": "Fundamentos · Programación",
  "FUNDAMENTOS 3: REDES": "Fundamentos · Redes",
  "FUNDAMENTOS 4: BASES DE DATOS": "Fundamentos · Bases de datos",
  "FUNDAMENTOS 5: SSOO": "Fundamentos · Sistemas Operativos",
};

function escaparHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const contenedor = document.getElementById("contenido-progreso");

  if (!usuario) {
    contenedor.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta.</div>`;
    return;
  }

  pintarSidebar("progreso.html", usuario);
  pintarBannerAcceso(usuario);
  registrarConexion();

  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    contenedor.innerHTML = `<div class="vacio">Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  const [{ data: mapaCalor, error: errMapa }, { data: evolucion, error: errEvol }] = await Promise.all([
    sb.rpc("progreso_mapa_calor_web"),
    sb.rpc("progreso_evolucion_web"),
  ]);

  if (errMapa || errEvol) {
    console.error(errMapa || errEvol);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar tu progreso. Recarga la página.</div>`;
    return;
  }

  const conDatos = (mapaCalor || []).filter((t) => t.total > 0);
  if (!conDatos.length) {
    contenedor.innerHTML = `<div class="vacio"><div class="icono">📊</div>Aún no tienes respuestas guardadas.<br/>Completa un test y aquí empezarás a ver en qué temas vas mejor.</div>`;
    return;
  }

  const totalPreguntas = conDatos.reduce((acc, t) => acc + t.total, 0);
  const totalAciertos = conDatos.reduce((acc, t) => acc + t.aciertos, 0);
  const pctGlobal = totalPreguntas ? Math.round((totalAciertos / totalPreguntas) * 100) : 0;
  const temasVerdes = conDatos.filter((t) => t.aciertos / t.total >= 0.7).length;
  const temasRojos = conDatos.filter((t) => t.aciertos / t.total < 0.4).length;
  const temasSinTocar = (mapaCalor || []).filter((t) => t.total === 0).length;

  let html = `
    <div class="stats-grid" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-icono">🎯</div>
        <div class="stat-numero">${pctGlobal}%</div>
        <div class="stat-etiqueta">acierto global (${totalPreguntas} preguntas)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icono">🟢</div>
        <div class="stat-numero">${temasVerdes}</div>
        <div class="stat-etiqueta">temas dominados</div>
      </div>
      <div class="stat-card">
        <div class="stat-icono">🔴</div>
        <div class="stat-numero">${temasRojos}</div>
        <div class="stat-etiqueta">temas para reforzar</div>
      </div>
      <div class="stat-card">
        <div class="stat-icono">⚪</div>
        <div class="stat-numero">${temasSinTocar}</div>
        <div class="stat-etiqueta">temas sin tocar todavía</div>
      </div>
    </div>

    <div class="panel">
      <h2>Mapa de temas</h2>
      <div class="leyenda-calor">
        <span><span class="leyenda-punto" style="background:#d1f5e6"></span> 70% o más</span>
        <span><span class="leyenda-punto" style="background:#fdecc8"></span> entre 40% y 70%</span>
        <span><span class="leyenda-punto" style="background:#fbdada"></span> menos de 40%</span>
        <span><span class="leyenda-punto" style="background:#eef0f2"></span> sin tocar todavía</span>
      </div>
      <p style="font-size:0.85rem;opacity:0.75;margin:0 0 14px">Pulsa el nombre de un bloque para repasarlo entero, o una celda para repasar solo ese tema.</p>
      ${htmlMapaCalor(mapaCalor || [], usuario.especialidad)}
    </div>

    <div class="panel">
      <h2>Evolución del acierto</h2>
      <canvas id="grafica-evolucion" height="90"></canvas>
    </div>
  `;

  contenedor.innerHTML = html;
  pintarGraficaEvolucion(evolucion || []);
})();

function htmlMapaCalor(filas, especialidad) {
  const porMateria = new Map();
  for (const f of filas) {
    if (!porMateria.has(f.materia)) porMateria.set(f.materia, []);
    porMateria.get(f.materia).push(f);
  }

  let ordenMaterias = [
    "BLOQUE 1: DERECHO", "BLOQUE 2: TECNOLOGÍA", "BLOQUE 3: DESARROLLO", "BLOQUE 4: SISTEMAS Y COMUNICACIONES",
    "FUNDAMENTOS 1: INFORMÁTICA", "FUNDAMENTOS 2: PROGRAMACIÓN", "FUNDAMENTOS 3: REDES", "FUNDAMENTOS 4: BASES DE DATOS", "FUNDAMENTOS 5: SSOO",
  ];
  // Si hay especialidad elegida, su bloque se enseña el primero de todos.
  const bloqueEspecialidad = especialidad === "desarrollo" ? "BLOQUE 3: DESARROLLO" : especialidad === "sistemas" ? "BLOQUE 4: SISTEMAS Y COMUNICACIONES" : null;
  if (bloqueEspecialidad) {
    ordenMaterias = [bloqueEspecialidad, ...ordenMaterias.filter((m) => m !== bloqueEspecialidad)];
  }

  return ordenMaterias
    .filter((m) => porMateria.has(m))
    .map((materia) => {
      const temas = porMateria.get(materia);
      const esEspecialidad = materia === bloqueEspecialidad;
      return `
        <div class="mapa-calor-bloque">
          <h3><a class="titulo-bloque-calor" href="quiz.html?materia=${encodeURIComponent(materia)}&modo=aleatorio&n=20">${esEspecialidad ? "⭐ " : ""}${escaparHtml(NOMBRES_MATERIA_CORTOS[materia] || materia)} →</a></h3>
          <div class="rejilla-calor">
            ${temas.map((t) => htmlCeldaCalor(materia, t)).join("")}
          </div>
        </div>`;
    })
    .join("");
}

function htmlCeldaCalor(materia, t) {
  if (t.total === 0) {
    return `<div class="celda-calor calor-gris"><span class="tema-nombre">${escaparHtml(t.tema)}</span><span class="tema-pct">Sin tocar</span></div>`;
  }
  const pct = Math.round((t.aciertos / t.total) * 100);
  const clase = pct >= 70 ? "calor-verde" : pct >= 40 ? "calor-amarillo" : "calor-rojo";
  const url = `quiz.html?materia=${encodeURIComponent(materia)}&modo=tema&tema=${encodeURIComponent(t.tema)}&n=10`;
  return `
    <button type="button" class="celda-calor ${clase}" onclick="window.location.href='${url}'" title="Practicar este tema">
      <span class="tema-nombre">${escaparHtml(t.tema)}</span>
      <span class="tema-pct">${pct}% · ${t.total} preg.</span>
    </button>`;
}

function pintarGraficaEvolucion(filas) {
  const ultimos30 = filas.slice(-30);
  const etiquetas = ultimos30.map((f) => {
    const [, m, d] = f.dia.split("-");
    return `${d}/${m}`;
  });
  const datos = ultimos30.map((f) => (f.total ? Math.round((f.aciertos / f.total) * 100) : 0));

  new Chart(document.getElementById("grafica-evolucion"), {
    type: "line",
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: "% aciertos",
          data: datos,
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
}
