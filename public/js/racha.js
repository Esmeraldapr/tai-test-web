// ============================================================
// "Mi racha" (racha.html) — sustituye a Progreso.
// De momento SOLO accesible por URL directa: no está enlazada en el menú
// (common.js) hasta que la usuaria decida activarla para todas. Es la
// primera versión, pensada para probarla solo con su propia cuenta.
//
// Cada día toca un ciclo de 5: los días 1-4 un bloque distinto, el día 5
// mezclado. Dentro del bloque del día, además se elige un tema concreto
// (rotando con el día del año) para la tercera tarea. Todo lo calcula
// racha_estado_hoy_web() en Supabase, así que aquí solo se pinta.
//
// Las 3 tareas del día:
//   1) Imprescindibles — 4 fichas del bloque/tema de hoy, en un modal propio.
//   2) Preguntas del bloque — quiz normal de 15 preguntas del bloque de hoy.
//   3) Ejercicio del tema — quiz de 10 preguntas del tema concreto de hoy.
// Las tareas 2 y 3 marcan su barra al terminar el quiz (ver el parámetro
// &racha=N que se añade al enlace, leído por quiz.js).
// ============================================================

const NOMBRES_BLOQUE_CORTOS = {
  "BLOQUE 1: DERECHO": "Derecho",
  "BLOQUE 2: TECNOLOGÍA": "Tecnología",
  "BLOQUE 3: DESARROLLO": "Desarrollo",
  "BLOQUE 4: SISTEMAS Y COMUNICACIONES": "Sistemas y Comunicaciones",
  "MEZCLADO": "Mezclado (los 4 bloques)",
};

let estadoActual = null;
let usuarioActual = null;

function escaparHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  usuarioActual = await obtenerUsuarioWeb(sesion);
  if (!usuarioActual) {
    document.getElementById("contenido-racha").innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta.</div>`;
    return;
  }
  pintarSidebar("racha.html", usuarioActual);

  const acceso = calcularAcceso(usuarioActual);
  if (!acceso.acceso) {
    document.getElementById("contenido-racha").innerHTML = `<div class="vacio">Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  await cargarTodo();

  // Si el navegador restaura esta página desde su caché en memoria (típico
  // al pulsar el botón "atrás" del móvil tras volver de un quiz), los
  // scripts no se vuelven a ejecutar y se ve la foto de "antes" de completar
  // la barra, aunque en la base de datos ya esté bien guardado. Se detecta
  // con event.persisted y se recarga el estado real.
  window.addEventListener("pageshow", (evento) => {
    if (evento.persisted) cargarTodo();
  });
})();

async function cargarTodo() {
  const [{ data: estado, error: errEstado }, { data: semana, error: errSemana }] = await Promise.all([
    sb.rpc("racha_estado_hoy_web"),
    sb.rpc("racha_semana_web"),
  ]);
  if (errEstado || !estado || !estado.length) {
    console.error(errEstado);
    document.getElementById("contenido-racha").innerHTML = `<div class="vacio">No se ha podido cargar tu racha. Recarga la página.</div>`;
    return;
  }
  estadoActual = estado[0];
  pintarPagina(estadoActual, semana || []);
}

function pintarPagina(estado, semana) {
  const nombreBloque = NOMBRES_BLOQUE_CORTOS[estado.bloque_dia] || estado.bloque_dia;
  const todasCompletas = estado.barra1 && estado.barra2 && estado.barra3;

  const diasSemana = ["D", "L", "M", "X", "J", "V", "S"];
  const tiraSemanal = semana
    .map((d) => {
      const fecha = new Date(d.fecha + "T00:00:00");
      const letra = diasSemana[fecha.getDay()];
      const clase = d.completo ? "tira-dia completo" : d.es_hoy ? "tira-dia hoy" : "tira-dia";
      return `<div class="${clase}"><span class="llama">${d.completo ? "🔥" : "○"}</span><span class="letra-dia">${letra}</span></div>`;
    })
    .join("");

  document.getElementById("contenido-racha").innerHTML = `
    <div class="cabecera-racha">
      <div class="stat-racha"><span class="stat-icono">🔥</span><span class="stat-num">${estado.racha_actual}</span></div>
      <div class="stat-racha"><span class="stat-icono">📅</span><span class="stat-num">${nombreBloque}</span></div>
    </div>

    <div class="barra-especialidad">
      <span>${htmlTextoEspecialidad(usuarioActual.especialidad)}</span>
      <button type="button" class="link-especialidad" id="btn-cambiar-especialidad">${usuarioActual.especialidad ? "Cambiar" : "Elegir"}</button>
    </div>

    <div class="tira-semanal">${tiraSemanal}</div>

    <div class="tarjeta-tareas">
      <h2>Tareas de hoy</h2>
      <p class="tema-del-dia">Hoy toca: <strong>${escaparHtml(nombreBloque)}</strong>${estado.tema_especifico ? ` · <strong>${escaparHtml(estado.tema_especifico)}</strong>` : ""}</p>

      ${htmlTarea(1, "📖", "Imprescindibles de hoy", estado.barra1, "abrirImprescindiblesHoy()")}
      ${htmlTarea(2, "❓", `Preguntas de ${nombreBloque}`, estado.barra2, null, enlaceQuizBloque(estado, 2))}
      ${htmlTarea(3, "🎯", estado.tema_especifico ? `Ejercicio de ${estado.tema_especifico}` : "Ejercicio mezclado", estado.barra3, null, enlaceQuizTema(estado, 3))}
    </div>

    <div class="acciones-racha">
      <a href="index.html" class="btn btn-secundario">← Volver</a>
      <button type="button" class="btn btn-primario" id="btn-ver-historico">📅 Histórico de rachas</button>
    </div>
  `;

  document.getElementById("btn-ver-historico").addEventListener("click", () => abrirHistorico());
  document.getElementById("btn-cambiar-especialidad").addEventListener("click", () => abrirSelectorEspecialidad());

  if (todasCompletas) {
    setTimeout(() => mostrarCelebracion(estado), 400);
  }
}

function htmlTarea(numero, icono, texto, completa, onclickJs, href) {
  const clase = completa ? "tarea-fila completa" : "tarea-fila";
  const contenido = `<span class="tarea-icono">${icono}</span><span class="tarea-texto">${escaparHtml(texto)}</span><span class="tarea-marca">${completa ? "✓" : "›"}</span>`;
  if (completa) {
    return `<div class="${clase}">${contenido}</div>`;
  }
  if (href) {
    return `<a class="${clase}" href="${href}">${contenido}</a>`;
  }
  return `<button type="button" class="${clase}" onclick="${onclickJs}">${contenido}</button>`;
}

function enlaceQuizBloque(estado, numeroBarra) {
  const materia = estado.bloque_dia === "MEZCLADO" ? "" : estado.bloque_dia;
  if (!materia) {
    // Día mezclado: la barra 2 usa aleatorio general (todas las materias BLOQUE).
    return `quiz.html?materia=${encodeURIComponent("BLOQUE 1: DERECHO")}&modo=aleatorio&n=15&racha=${numeroBarra}`;
  }
  return `quiz.html?materia=${encodeURIComponent(materia)}&modo=aleatorio&n=15&racha=${numeroBarra}`;
}

function enlaceQuizTema(estado, numeroBarra) {
  if (estado.tema_especifico && estado.bloque_dia !== "MEZCLADO") {
    return `quiz.html?materia=${encodeURIComponent(estado.bloque_dia)}&modo=tema&tema=${encodeURIComponent(estado.tema_especifico)}&n=10&racha=${numeroBarra}`;
  }
  // Día mezclado: preguntas aleatorias de un bloque al azar entre los 4.
  const bloques = ["BLOQUE 1: DERECHO", "BLOQUE 2: TECNOLOGÍA", "BLOQUE 3: DESARROLLO", "BLOQUE 4: SISTEMAS Y COMUNICACIONES"];
  const elegido = bloques[Math.floor(Math.random() * bloques.length)];
  return `quiz.html?materia=${encodeURIComponent(elegido)}&modo=aleatorio&n=10&racha=${numeroBarra}`;
}

async function abrirImprescindiblesHoy() {
  const materia = estadoActual.bloque_dia === "MEZCLADO" ? null : estadoActual.bloque_dia;
  let query = sb.from("imprescindibles_web").select("termino, definicion, nota").eq("activa", true);
  if (materia) query = query.eq("materia", materia);
  if (estadoActual.tema_especifico) query = query.eq("tema", estadoActual.tema_especifico);

  let { data, error } = await query.limit(50);
  if ((error || !data || !data.length) && materia) {
    // si el tema concreto no tiene fichas propias, se cae a todo el bloque
    ({ data, error } = await sb.from("imprescindibles_web").select("termino, definicion, nota").eq("activa", true).eq("materia", materia).limit(50));
  }
  if (error || !data || !data.length) {
    alert("No se han podido cargar las fichas de hoy. Inténtalo de nuevo en un momento.");
    return;
  }

  const elegidas = mezclarArray(data).slice(0, 4);
  pintarModalImprescindibles(elegidas);
}

function mezclarArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pintarModalImprescindibles(fichas) {
  const overlay = document.createElement("div");
  overlay.className = "modal-racha-overlay";
  overlay.innerHTML = `
    <div class="modal-racha-caja">
      <h2>📖 Imprescindibles de hoy</h2>
      <div class="fichas-racha">
        ${fichas
          .map(
            (f, i) => `
          <div class="ficha-racha">
            <div class="ficha-racha-cabecera">
              <strong>${escaparHtml(f.termino)}</strong>
              <button type="button" class="btn-favorito btn-leer-ficha" data-indice="${i}" title="Escuchar">🔊</button>
            </div>
            <p class="parrafo-leible" id="ficha-def-${i}">${escaparHtml(f.definicion)}</p>
            ${f.nota ? `<p class="nota-racha">💡 ${escaparHtml(f.nota)}</p>` : ""}
          </div>`
          )
          .join("")}
      </div>
      <button type="button" class="btn btn-primario" id="btn-ya-me-las-se">Ya me las sé — comprobar con 5 preguntas →</button>
      <button type="button" class="btn btn-secundario" id="btn-cerrar-modal-racha">Cerrar</button>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById("btn-cerrar-modal-racha").addEventListener("click", () => overlay.remove());
  overlay.querySelectorAll(".btn-leer-ficha").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = btn.dataset.indice;
      leerTexto(document.getElementById("ficha-def-" + i), btn);
    });
  });
  document.getElementById("btn-ya-me-las-se").addEventListener("click", () => {
    // No se marca la barra aquí directamente: se comprueba con un mini test
    // de 5 preguntas del mismo tema, y es quiz.js quien marca la barra 1
    // al terminarlo (con &racha=1 en la URL), igual que hacen las otras dos.
    const materia = estadoActual.bloque_dia === "MEZCLADO" ? null : estadoActual.bloque_dia;
    let url;
    if (materia && estadoActual.tema_especifico) {
      url = `quiz.html?materia=${encodeURIComponent(materia)}&modo=tema&tema=${encodeURIComponent(estadoActual.tema_especifico)}&n=5&racha=1`;
    } else if (materia) {
      url = `quiz.html?materia=${encodeURIComponent(materia)}&modo=aleatorio&n=5&racha=1`;
    } else {
      const bloques = ["BLOQUE 1: DERECHO", "BLOQUE 2: TECNOLOGÍA", "BLOQUE 3: DESARROLLO", "BLOQUE 4: SISTEMAS Y COMUNICACIONES"];
      const elegido = bloques[Math.floor(Math.random() * bloques.length)];
      url = `quiz.html?materia=${encodeURIComponent(elegido)}&modo=aleatorio&n=5&racha=1`;
    }
    window.location.href = url;
  });
}

async function marcarBarra(numero) {
  const { data, error } = await sb.rpc("racha_completar_barra_web", { p_barra: numero });
  if (error || !data || !data.length) {
    console.error(error);
    return;
  }
  estadoActual.barra1 = data[0].barra1;
  estadoActual.barra2 = data[0].barra2;
  estadoActual.barra3 = data[0].barra3;
  estadoActual.racha_actual = data[0].racha_actual;
  await cargarTodo();
}

function mostrarCelebracion(estado) {
  if (sessionStorage.getItem("racha-celebrada-" + estado.dia_actual)) return;
  sessionStorage.setItem("racha-celebrada-" + estado.dia_actual, "1");

  const overlay = document.createElement("div");
  overlay.className = "modal-racha-overlay celebracion";
  overlay.innerHTML = `
    <div class="modal-racha-caja celebracion-caja">
      <div class="emoji-celebracion">🎉</div>
      <h2>¡Meta completada!</h2>
      <p>Has terminado las 3 tareas de hoy.</p>
      <p class="racha-grande">🔥 ${estado.racha_actual} ${estado.racha_actual === 1 ? "día" : "días"} seguidos</p>
      <button type="button" class="btn btn-primario" id="btn-cerrar-celebracion">Continuar</button>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById("btn-cerrar-celebracion").addEventListener("click", () => overlay.remove());
  lanzarConfeti();
}

function lanzarConfeti() {
  const colores = ["#7c3aed", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];
  const contenedor = document.createElement("div");
  contenedor.className = "confeti-contenedor";
  document.body.appendChild(contenedor);
  for (let i = 0; i < 60; i++) {
    const pieza = document.createElement("div");
    pieza.className = "confeti-pieza";
    pieza.style.left = Math.random() * 100 + "vw";
    pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
    pieza.style.animationDelay = Math.random() * 0.6 + "s";
    pieza.style.animationDuration = 2.2 + Math.random() * 1.2 + "s";
    contenedor.appendChild(pieza);
  }
  setTimeout(() => contenedor.remove(), 3800);
}

// ---------------- Histórico de rachas (calendario mensual) ----------------
// Vista aparte, solo para mirar hacia atrás: qué días se completaron las 3
// tareas, mes a mes, con flechas para navegar. No afecta a la racha en sí,
// es solo para verlo de un vistazo (como pedía la usuaria de su otra app).
const NOMBRES_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

let historicoAnio = null;
let historicoMes = null; // 1-12

function abrirHistorico() {
  const hoy = new Date();
  historicoAnio = hoy.getFullYear();
  historicoMes = hoy.getMonth() + 1;

  const overlay = document.createElement("div");
  overlay.className = "modal-racha-overlay";
  overlay.id = "overlay-historico";
  overlay.innerHTML = `
    <div class="modal-racha-caja">
      <h2>📅 Histórico de rachas</h2>
      <div class="calendario-mes-cabecera">
        <button type="button" id="btn-mes-anterior">←</button>
        <span class="calendario-mes-titulo" id="titulo-mes-historico"></span>
        <button type="button" id="btn-mes-siguiente">→</button>
      </div>
      <div id="rejilla-mes-historico"><div class="spinner"></div></div>
      <button type="button" class="btn btn-secundario" id="btn-cerrar-historico">Cerrar</button>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById("btn-cerrar-historico").addEventListener("click", () => overlay.remove());
  document.getElementById("btn-mes-anterior").addEventListener("click", () => cambiarMesHistorico(-1));
  document.getElementById("btn-mes-siguiente").addEventListener("click", () => cambiarMesHistorico(1));

  cargarMesHistorico();
}

function cambiarMesHistorico(delta) {
  historicoMes += delta;
  if (historicoMes > 12) { historicoMes = 1; historicoAnio++; }
  if (historicoMes < 1) { historicoMes = 12; historicoAnio--; }
  cargarMesHistorico();
}

async function cargarMesHistorico() {
  const hoy = new Date();
  const esMesActual = historicoAnio === hoy.getFullYear() && historicoMes === hoy.getMonth() + 1;
  document.getElementById("titulo-mes-historico").textContent = `${NOMBRES_MES[historicoMes - 1]} ${historicoAnio}`;
  document.getElementById("btn-mes-siguiente").disabled = esMesActual;

  const { data, error } = await sb.rpc("racha_mes_web", { p_anio: historicoAnio, p_mes: historicoMes });
  const contenedor = document.getElementById("rejilla-mes-historico");
  if (error || !data) {
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar este mes.</div>`;
    return;
  }

  const primerDia = new Date(historicoAnio, historicoMes - 1, 1);
  // Lunes=0 ... Domingo=6, para que la semana empiece en lunes como en el resto de la web.
  const huecoInicial = (primerDia.getDay() + 6) % 7;

  const cabeceras = ["L", "M", "X", "J", "V", "S", "D"]
    .map((d) => `<div class="cabecera-dia-mes">${d}</div>`)
    .join("");
  const huecos = Array(huecoInicial).fill('<div class="celda-dia-mes vacia"></div>').join("");
  const dias = data
    .map((d) => {
      const numero = parseInt(d.fecha.split("-")[2], 10);
      return `<div class="celda-dia-mes${d.completo ? " completo" : ""}">${d.completo ? "🔥" : numero}</div>`;
    })
    .join("");

  const totalCompletos = data.filter((d) => d.completo).length;
  contenedor.innerHTML = `
    <div class="rejilla-mes">${cabeceras}${huecos}${dias}</div>
    <p style="text-align:center; margin-top:12px; font-size:0.85rem; opacity:0.75">
      ${totalCompletos} ${totalCompletos === 1 ? "día completo" : "días completos"} este mes
    </p>`;
}

// ---------------- Especialidad (Desarrollo o Sistemas) ----------------
// El examen real reparte la parte práctica en dos mitades claras: el
// Supuesto I es siempre de perfil Desarrollo (Bloque 3) y el Supuesto II
// siempre de perfil Sistemas (Bloque 4) — comprobado sobre 2019, 2022 y
// 2024. Quien elige una especialidad ve ese bloque reforzado en la racha
// (sale también el día que a los demás les toca Derecho), y tiene atajos
// para practicarlo en Cuestionarios y en Mi progreso.
function htmlTextoEspecialidad(especialidad) {
  if (especialidad === "desarrollo") return "🖥️ Tu especialidad: <strong>Desarrollo</strong>";
  if (especialidad === "sistemas") return "🌐 Tu especialidad: <strong>Sistemas</strong>";
  return "¿Por dónde vas a tirar en el examen: Desarrollo o Sistemas?";
}

function abrirSelectorEspecialidad() {
  const overlay = document.createElement("div");
  overlay.className = "modal-racha-overlay";
  overlay.innerHTML = `
    <div class="modal-racha-caja">
      <h2>Tu especialidad</h2>
      <p style="opacity:.8">El examen real reparte la parte práctica en dos mitades: una de Desarrollo (Bloque 3) y otra de Sistemas (Bloque 4). Si ya sabes por dónde vas a tirar, esto refuerza más ese bloque en tu racha y te da atajos para practicarlo. Puedes cambiarlo cuando quieras desde aquí mismo.</p>
      <div style="display:flex; flex-direction:column; gap:10px; margin-top:16px">
        <button type="button" class="btn btn-primario" data-esp="desarrollo">🖥️ Desarrollo</button>
        <button type="button" class="btn btn-primario" data-esp="sistemas">🌐 Sistemas</button>
        <button type="button" class="btn btn-secundario" data-esp="">Aún no lo sé</button>
      </div>
      <button type="button" class="btn btn-secundario" id="btn-cerrar-especialidad" style="margin-top:14px">Cerrar sin cambiar</button>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById("btn-cerrar-especialidad").addEventListener("click", () => overlay.remove());
  overlay.querySelectorAll("[data-esp]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const valor = btn.dataset.esp || null;
      const { error } = await sb.rpc("actualizar_especialidad_web", { p_especialidad: valor });
      if (error) {
        console.error(error);
        alert("No se ha podido guardar. Inténtalo de nuevo.");
        return;
      }
      usuarioActual.especialidad = valor;
      overlay.remove();
      await cargarTodo();
    });
  });
}
