// ============================================================
// Motor de test — quiz.html
// Requiere ?materia=X en la URL, además de:
//   &modo=tema&tema=Y
//   &modo=aleatorio&n=20
// ============================================================

let usuarioActual = null;
let preguntasSet = [];
let indice = 0;
let aciertos = 0;
let total = 0;
let respondida = false; // true = esta pregunta ya está resuelta EN ESTA VISITA (opciones bloqueadas)
let puedeAvanzar = false; // true = el botón "Siguiente" está habilitado (contestada o saltada)
let materiaActual = "";
let temaActual = null;
let favoritosSet = new Set();
let preguntasSaltadas = [];
// historial[i] = null (aún no llegada) | {estado:"contestada", opcionElegida, resultado} | {estado:"saltada"}
let historial = [];

function mezclar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  usuarioActual = await obtenerUsuarioWeb(sesion);
  if (!usuarioActual) {
    document.getElementById("zona-quiz").innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta.</div>`;
    return;
  }
  pintarSidebar("", usuarioActual);

  const acceso = calcularAcceso(usuarioActual);
  if (!acceso.acceso) {
    document.getElementById("zona-quiz").innerHTML = `<div class="vacio">Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  materiaActual = params.get("materia") || "";
  temaActual = params.get("tema") || null;
  const modo = params.get("modo") || "aleatorio";
  const n = parseInt(params.get("n") || "20", 10);
  const idsParam = params.get("ids");

  if (modo !== "lista" && !materiaActual) { window.location.href = "index.html"; return; }

  document.getElementById("titulo-modo").textContent =
    modo === "tema" ? `📘 ${materiaActual} — ${temaActual}` :
    modo === "lista" ? `🎯 ${params.get("titulo") || "Preguntas seleccionadas"}` :
    `⚡ ${materiaActual} — práctica rápida`;

  favoritosSet = await obtenerFavoritosSet();

  let data, error;
  if (modo === "lista") {
    const ids = (idsParam || "").split(",").map((x) => parseInt(x, 10)).filter((x) => !isNaN(x));
    if (!ids.length) { window.location.href = "index.html"; return; }
    ({ data, error } = await sb.from("preguntas_quiz").select("*").in("id", ids));
  } else if (modo === "aleatorio") {
    // Antes se traía TODA la materia (hasta ~2900 preguntas, topado además
    // en 1000 por Supabase) solo para barajar y quedarse con "n". Esta RPC
    // elige "n" al azar directamente en el servidor.
    ({ data, error } = await sb.rpc("preguntas_aleatorias_web", { p_materia: materiaActual, p_n: n }));
  } else {
    let consulta = sb.from("preguntas_quiz").select("*").eq("materia", materiaActual);
    if (temaActual) consulta = consulta.eq("tema", temaActual);
    ({ data, error } = await consulta);
  }
  if (error) {
    console.error(error);
    document.getElementById("zona-quiz").innerHTML = `<div class="vacio">No se han podido cargar las preguntas.</div>`;
    return;
  }

      preguntasSet = mezclar(data || []);
  if (modo === "tema" && n > 0) preguntasSet = preguntasSet.slice(0, n);
  historial = new Array(preguntasSet.length).fill(null);

  if (!preguntasSet.length) {
    document.getElementById("zona-quiz").innerHTML = `<div class="vacio">No hay preguntas disponibles para esta selección.</div>`;
    return;
  }

  pintarPregunta();
})();

function pintarPregunta() {
  detenerLectura();
  const p = preguntasSet[indice];
  const previo = historial[indice];
  // Al volver a una pregunta ya contestada se muestra en modo solo-lectura
  // (con la corrección ya pintada); si se había saltado, se puede responder
  // ahora mismo o volver a pasar.
  respondida = !!(previo && previo.estado === "contestada");
  puedeAvanzar = !!previo;

  const pct = Math.round((indice / preguntasSet.length) * 100);
  const letras = ["a", "b", "c", "d"];
  const opciones = [p.opcion_a, p.opcion_b, p.opcion_c, p.opcion_d];
  const esUltima = indice + 1 >= preguntasSet.length;

  const opcionesHtml = opciones.map((op, i) => {
    const letra = letras[i];
    let clases = "opcion";
    if (respondida) {
      clases += " deshabilitada";
      if (letra === previo.resultado.respuesta_correcta) clases += " correcta";
      else if (letra === previo.opcionElegida) clases += " incorrecta";
    }
    return `
      <button type="button" class="${clases}" data-opcion="${letra}" ${respondida ? "disabled" : ""}>
        <span class="letra">${letra.toUpperCase()}</span>
        <span>${op}</span>
            </button>`;
  }).join("");

  const explicacionHtml = respondida
    ? `<div class="explicacion-caja ${previo.resultado.es_correcta ? "bien" : "mal"}">
        <strong>${previo.resultado.es_correcta ? "✅ ¡Correcto!" : "❌ Incorrecto"}</strong><br/>
        <span class="parrafo-leible">${previo.resultado.explicacion || ""}</span>
      </div>`
    : previo && previo.estado === "saltada"
    ? `<div class="explicacion-caja">⏭️ Ya habías pasado esta pregunta. Puedes responderla ahora o volver a pasar.</div>`
    : "";

  document.getElementById("zona-quiz").innerHTML = `
    <div class="quiz-barra"><div style="width:${pct}%"></div></div>
    <div class="pregunta-caja">
      <div class="info-superior">
        <span class="chip oficial">${indice + 1} / ${preguntasSet.length}</span>
        ${p.subtema ? `<span class="chip no-oficial">${p.subtema}</span>` : ""}
        <button class="btn-favorito" id="btn-leer" type="button" title="Escuchar la pregunta y las respuestas">🔊</button>
        <button class="btn-favorito" id="btn-favorito" type="button" title="Marcar como favorita" data-activo="${favoritosSet.has(p.id) ? "1" : "0"}">${favoritosSet.has(p.id) ? "⭐" : "☆"}</button>
      </div>
      ${p.imagen_url ? `<img class="ampliable" src="${p.imagen_url}" alt="Imagen de la pregunta" style="border-radius:12px;margin-bottom:16px;border:1px solid var(--borde)" />` : ""}
      <div class="enunciado parrafo-leible">${p.pregunta}</div>
      <div class="opciones" id="opciones">${opcionesHtml}</div>
      <div id="zona-explicacion">${explicacionHtml}</div>
      <button class="btn-reportar" id="btn-reportar" type="button">🚩 Reportar esta pregunta</button>
      <div id="caja-reportar"></div>
    </div>
    <div class="acciones-quiz">
      <a href="index.html" class="btn btn-secundario">← Salir</a>
      <div style="display:flex; gap:10px; flex-wrap:wrap">
        <button id="btn-anterior" class="btn btn-secundario" type="button" ${indice === 0 ? "disabled" : ""}>← Anterior</button>
        <button id="btn-pasar" class="btn btn-secundario" type="button" ${respondida ? "disabled" : ""}>Pasar sin responder →</button>
        <button id="btn-siguiente" class="btn btn-primario" ${puedeAvanzar ? "" : "disabled"}>${esUltima ? "Ver resultado →" : "Siguiente →"}</button>
      </div>
    </div>
  `;

  document.querySelectorAll(".opcion").forEach((el) => el.addEventListener("click", () => elegirOpcion(el, p)));
  document.getElementById("btn-siguiente").addEventListener("click", siguientePregunta);
  document.getElementById("btn-anterior").addEventListener("click", anteriorPregunta);
  document.getElementById("btn-pasar").addEventListener("click", () => saltarPregunta(p));
  document.getElementById("btn-reportar").addEventListener("click", () => abrirFormularioReporte(p.id));
  document.getElementById("btn-favorito").addEventListener("click", () => alternarFavorito(p.id));
  document.getElementById("btn-leer").addEventListener("click", () => leerPreguntaCompleta(p, opciones, letras));
}

function anteriorPregunta() {
  if (indice === 0) return;
  indice--;
  pintarPregunta();
}

/** Lee en voz alta el enunciado y las 4 opciones seguidas — pensado para
 * usuarios con dislexia que prefieren escuchar la pregunta completa. */
function leerPreguntaCompleta(pregunta, opciones, letras) {
  const btn = document.getElementById("btn-leer");
  const partes = [pregunta.pregunta];
  opciones.forEach((op, i) => partes.push(`Opción ${letras[i].toUpperCase()}: ${op}`));
  leerTexto(partes.join(". "), btn);
}

// "Pasar" no cuenta como fallo: no llama a comprobar_respuesta_web (así no se
// guarda ninguna fila en respuestas_web), y no toca aciertos/total — una
// pregunta no respondida no debe penalizar igual que una fallada. Es idempotente:
// volver a pasar una pregunta ya marcada como saltada no la añade dos veces.
function saltarPregunta(pregunta) {
  if (respondida) return;
  if (!historial[indice]) {
    historial[indice] = { estado: "saltada" };
    preguntasSaltadas.push(pregunta.id);
  }
  respondida = true;
  puedeAvanzar = true;

  
   siguientePregunta();
  }
async function alternarFavorito(preguntaId) {
  const btn = document.getElementById("btn-favorito");
  btn.disabled = true;
  const yaEsFavorita = favoritosSet.has(preguntaId);
  const ok = yaEsFavorita ? await desmarcarFavorito(preguntaId) : await marcarFavorito(preguntaId);
  if (ok) {
    if (yaEsFavorita) favoritosSet.delete(preguntaId);
    else favoritosSet.add(preguntaId);
    btn.textContent = favoritosSet.has(preguntaId) ? "⭐" : "☆";
    btn.dataset.activo = favoritosSet.has(preguntaId) ? "1" : "0";
  }
  btn.disabled = false;
}

async function elegirOpcion(el, pregunta) {
  if (respondida) return;
  const previoAlEntrar = historial[indice]; // por si esta pregunta ya estaba marcada como "saltada"
  respondida = true;
  puedeAvanzar = true;

  const { data, error } = await sb.rpc("comprobar_respuesta_web", {
    p_pregunta_id: pregunta.id,
    p_respuesta: el.dataset.opcion,
  });

  if (error || !data || !data.length) {
    console.error(error);
    document.getElementById("zona-explicacion").innerHTML = `<div class="explicacion-caja mal">No se ha podido comprobar la respuesta. Vuelve a intentarlo.</div>`;
    // Se deshace el bloqueo para que la persona pueda volver a pulsar una opción.
    respondida = false;
    puedeAvanzar = !!previoAlEntrar;
    document.getElementById("btn-siguiente").toggleAttribute("disabled", !puedeAvanzar);
    return;
  }

  const resultado = data[0];
  total++;
  if (resultado.es_correcta) aciertos++;

  // Si se responde ahora una pregunta que antes se había pasado, deja de contar como saltada.
  if (previoAlEntrar && previoAlEntrar.estado === "saltada") {
    const pos = preguntasSaltadas.indexOf(pregunta.id);
    if (pos !== -1) preguntasSaltadas.splice(pos, 1);
  }
  historial[indice] = { estado: "contestada", opcionElegida: el.dataset.opcion, resultado };

  document.querySelectorAll(".opcion").forEach((o) => {
    o.classList.add("deshabilitada");
    if (o.dataset.opcion === resultado.respuesta_correcta) o.classList.add("correcta");
    else if (o === el) o.classList.add("incorrecta");
  });
  document.getElementById("btn-pasar").disabled = true;

  document.getElementById("zona-explicacion").innerHTML = `
    <div class="explicacion-caja ${resultado.es_correcta ? "bien" : "mal"}">
      <strong>${resultado.es_correcta ? "✅ ¡Correcto!" : "❌ Incorrecto"}</strong><br/>
      <span class="parrafo-leible">${resultado.explicacion || ""}</span>
    </div>`;

  document.getElementById("btn-siguiente").removeAttribute("disabled");
}

function abrirFormularioReporte(preguntaId) {
  const caja = document.getElementById("caja-reportar");
  if (caja.dataset.abierta === "1") { caja.innerHTML = ""; caja.dataset.abierta = "0"; return; }
  caja.dataset.abierta = "1";
  caja.innerHTML = `
    <div class="caja-reportar">
      <select id="reporte-tipo">
        <option value="respuesta_incorrecta">La respuesta correcta está mal marcada</option>
        <option value="mala_redaccion">La pregunta está mal redactada</option>
        <option value="otro">Otro problema</option>
      </select>
      <textarea id="reporte-mensaje" rows="2" placeholder="Cuéntame qué está mal (opcional)"></textarea>
      <button class="btn btn-primario" id="btn-enviar-reporte" type="button">Enviar reporte</button>
      <div id="reporte-mensaje-estado" style="margin-top:8px;font-size:.85rem"></div>
    </div>`;
  document.getElementById("btn-enviar-reporte").addEventListener("click", () => enviarReporte(preguntaId));
}

async function enviarReporte(preguntaId) {
  const tipo = document.getElementById("reporte-tipo").value;
  const mensaje = document.getElementById("reporte-mensaje").value.trim();
  const estado = document.getElementById("reporte-mensaje-estado");
  const { error } = await sb.from("incidencias_web").insert({ pregunta_id: preguntaId, tipo, mensaje });
  if (error) {
    estado.textContent = "Has alcanzado el límite de 5 reportes por hoy, o tu acceso no está vigente. Inténtalo mañana.";
    estado.style.color = "var(--rojo)";
    return;
  }
  estado.textContent = "✅ Gracias, reporte enviado.";
  estado.style.color = "var(--verde)";
}

function siguientePregunta() {
  if (!puedeAvanzar) return;
  indice++;
  if (indice >= preguntasSet.length) pintarResultado();
  else pintarPregunta();
}

async function pintarResultado() {
   const pct = total ? Math.round((aciertos / total) * 100) : 0;
  const nSaltadas = preguntasSaltadas.length;
  // Nota con la penalización real del examen: cada 3 fallos anulan un acierto.
  // Se calcula sobre TODAS las preguntas del test (incluidas las que se dejan
  // en blanco), que es como se corrige de verdad.
  const nFallos = total - aciertos;
  const totalExamen = total + nSaltadas;
  const puntos = aciertos - nFallos / 3;
  const nota = totalExamen ? Math.max(0, (puntos / totalExamen) * 10) : 0;
  document.getElementById("zona-quiz").innerHTML = `
    <div class="quiz-barra"><div style="width:100%"></div></div>
    <div class="pregunta-caja resultado-final">
      <div class="porcentaje">${pct}%</div>
      <p style="font-size:1.1rem;font-weight:700;margin:8px 0 4px">${aciertos} de ${total} correctas</p>
          <p class="meta" style="margin:10px 0">✅ ${aciertos} acertada${aciertos === 1 ? "" : "s"} · ❌ ${nFallos} fallada${nFallos === 1 ? "" : "s"} · ⏭️ ${nSaltadas} en blanco</p>
      <div style="background:#f4f7f6;border-radius:10px;padding:12px;margin:12px 0">
        <p style="margin:0;font-size:1.05rem"><strong>Nota con penalización: ${nota.toFixed(2)} / 10</strong></p>
        <p style="margin:4px 0 0;font-size:0.85rem;color:#6b7280">En el examen real cada 3 fallos anulan un acierto. Las preguntas en blanco no restan.</p>
      </div>
      <p class="subtitulo">${pct >= 80 ? "¡Excelente trabajo! 🎉" : pct >= 50 ? "Vas por buen camino, sigue practicando 💪" : "Repasa este tema con calma, tú puedes 🙂"}</p>
      <div style="display:flex; gap:12px; justify-content:center; margin-top:20px; flex-wrap:wrap">
        <a href="index.html" class="btn btn-secundario">Volver</a>
        <a href="quiz.html?${new URLSearchParams(window.location.search).toString()}" class="btn btn-primario">Otra práctica</a>
        ${nSaltadas ? `<a href="quiz.html?modo=lista&ids=${preguntasSaltadas.join(",")}&titulo=${encodeURIComponent("Preguntas saltadas")}" class="btn btn-primario">Repasar las saltadas →</a>` : ""}
      </div>
    </div>
  `;

  if (total > 0) {
    const { error } = await sb.from("resultados_web").insert({ materia: materiaActual, tema: temaActual, aciertos, total });
    if (error) console.error("Error guardando resultado:", error);
  }
}
