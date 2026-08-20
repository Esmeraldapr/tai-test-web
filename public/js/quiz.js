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
let respondida = false;
let materiaActual = "";
let temaActual = null;

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
  pintarNavbar("", usuarioActual);

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

  if (!materiaActual) { window.location.href = "index.html"; return; }

  document.getElementById("titulo-modo").textContent =
    modo === "tema" ? `📘 ${materiaActual} — ${temaActual}` : `⚡ ${materiaActual} — práctica rápida`;

  let data, error;
  if (modo === "aleatorio") {
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

  if (!preguntasSet.length) {
    document.getElementById("zona-quiz").innerHTML = `<div class="vacio">No hay preguntas disponibles para esta selección.</div>`;
    return;
  }

  pintarPregunta();
})();

function pintarPregunta() {
  detenerLectura();
  respondida = false;
  const p = preguntasSet[indice];
  const pct = Math.round((indice / preguntasSet.length) * 100);
  const letras = ["a", "b", "c", "d"];
  const opciones = [p.opcion_a, p.opcion_b, p.opcion_c, p.opcion_d];
  const esUltima = indice + 1 >= preguntasSet.length;

  document.getElementById("zona-quiz").innerHTML = `
    <div class="quiz-barra"><div style="width:${pct}%"></div></div>
    <div class="pregunta-caja">
      <div class="info-superior">
        <span class="chip oficial">${indice + 1} / ${preguntasSet.length}</span>
        ${p.subtema ? `<span class="chip no-oficial">${p.subtema}</span>` : ""}
      </div>
      ${p.imagen_url ? `<img class="ampliable" src="${p.imagen_url}" alt="Imagen de la pregunta" style="border-radius:12px;margin-bottom:16px;border:1px solid var(--borde)" />` : ""}
      <div class="enunciado parrafo-leible">${p.pregunta}</div>
      <div class="opciones" id="opciones">
        ${opciones.map((op, i) => `
          <div class="opcion" data-opcion="${letras[i]}">
            <span class="letra">${letras[i].toUpperCase()}</span>
            <span>${op}</span>
          </div>`).join("")}
      </div>
      <div id="zona-explicacion"></div>
      <button class="btn-reportar" id="btn-reportar" type="button">🚩 Reportar esta pregunta</button>
      <div id="caja-reportar"></div>
    </div>
    <div class="acciones-quiz">
      <a href="index.html" class="btn btn-secundario">← Salir</a>
      <button id="btn-siguiente" class="btn btn-primario" disabled>${esUltima ? "Ver resultado →" : "Siguiente →"}</button>
    </div>
  `;

  document.querySelectorAll(".opcion").forEach((el) => el.addEventListener("click", () => elegirOpcion(el, p)));
  document.getElementById("btn-siguiente").addEventListener("click", siguientePregunta);
  document.getElementById("btn-reportar").addEventListener("click", () => abrirFormularioReporte(p.id));
}

async function elegirOpcion(el, pregunta) {
  if (respondida) return;
  respondida = true;
  total++;

  const { data, error } = await sb.rpc("comprobar_respuesta_web", {
    p_pregunta_id: pregunta.id,
    p_respuesta: el.dataset.opcion,
  });

  if (error || !data || !data.length) {
    console.error(error);
    document.getElementById("zona-explicacion").innerHTML = `<div class="explicacion-caja mal">No se ha podido comprobar la respuesta. Inténtalo de nuevo.</div>`;
    return;
  }

  const resultado = data[0];
  if (resultado.es_correcta) aciertos++;

  document.querySelectorAll(".opcion").forEach((o) => {
    o.classList.add("deshabilitada");
    if (o.dataset.opcion === resultado.respuesta_correcta) o.classList.add("correcta");
    else if (o === el) o.classList.add("incorrecta");
  });

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
  if (!respondida) return;
  indice++;
  if (indice >= preguntasSet.length) pintarResultado();
  else pintarPregunta();
}

async function pintarResultado() {
  const pct = Math.round((aciertos / total) * 100);
  document.getElementById("zona-quiz").innerHTML = `
    <div class="quiz-barra"><div style="width:100%"></div></div>
    <div class="pregunta-caja resultado-final">
      <div class="porcentaje">${pct}%</div>
      <p style="font-size:1.1rem;font-weight:700;margin:8px 0 4px">${aciertos} de ${total} correctas</p>
      <p class="subtitulo">${pct >= 80 ? "¡Excelente trabajo! 🎉" : pct >= 50 ? "Vas por buen camino, sigue practicando 💪" : "Repasa este tema con calma, tú puedes 🙂"}</p>
      <div style="display:flex; gap:12px; justify-content:center; margin-top:20px; flex-wrap:wrap">
        <a href="index.html" class="btn btn-secundario">Volver</a>
        <a href="quiz.html?${new URLSearchParams(window.location.search).toString()}" class="btn btn-primario">Otra práctica</a>
      </div>
    </div>
  `;

  const { error } = await sb.from("resultados_web").insert({ materia: materiaActual, tema: temaActual, aciertos, total });
  if (error) console.error("Error guardando resultado:", error);
}