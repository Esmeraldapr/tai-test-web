// ============================================================
// Ranking (ranking.html) — voluntario, con alias elegido libremente.
// Dos listas por aciertos: "Hoy" (se reinicia cada día) y "Esta semana"
// (lunes a domingo). Pensado a propósito para el día a día, no para
// acumular ventaja histórica de meses — así alguien que se apunta hoy
// puede competir de tú a tú con quien lleve tiempo, sin sentir que
// "nunca va a alcanzar" a nadie.
//
// Nunca se muestra a nadie que no se haya apuntado voluntariamente, y
// los estados vacíos (nadie apuntada / solo tú) están resueltos a
// propósito para que la pantalla nunca se vea "muerta" con poca gente.
// ============================================================

let usuarioActualRanking = null;
let miEstadoRanking = null; // { apuntada, alias }
let pestanaActivaRanking = "diario"; // "diario" | "semanal"

function escaparHtmlRk(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  usuarioActualRanking = await obtenerUsuarioWeb(sesion);
  if (!usuarioActualRanking) {
    document.getElementById("contenido-ranking").innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta.</div>`;
    return;
  }
  pintarSidebar("ranking.html", usuarioActualRanking);

  const acceso = calcularAcceso(usuarioActualRanking);
  if (!acceso.acceso) {
    document.getElementById("contenido-ranking").innerHTML = `<div class="vacio">Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  await cargarTodo();

  window.addEventListener("pageshow", (evento) => {
    if (evento.persisted) cargarTodo();
  });
})();

async function cargarTodo() {
  const { data: estadoData, error: errorEstado } = await sb.rpc("ranking_mi_estado_web");
  if (errorEstado) {
    console.error(errorEstado);
    document.getElementById("contenido-ranking").innerHTML = `<div class="vacio">No se ha podido cargar el ranking. Recarga la página.</div>`;
    return;
  }
  miEstadoRanking = (estadoData && estadoData[0]) || { apuntada: false, alias: null };

  const rpc = pestanaActivaRanking === "diario" ? "ranking_diario_web" : "ranking_semanal_web";
  const { data: lista, error: errorLista } = await sb.rpc(rpc);
  if (errorLista) {
    console.error(errorLista);
    document.getElementById("contenido-ranking").innerHTML = `<div class="vacio">No se ha podido cargar el ranking. Recarga la página.</div>`;
    return;
  }

  pintarPagina(lista || []);
}

function pintarPagina(lista) {
  document.getElementById("contenido-ranking").innerHTML = `
    <div class="ranking-pestanas">
      <div class="ranking-pestana${pestanaActivaRanking === "diario" ? " activa" : ""}" id="tab-diario">Hoy</div>
      <div class="ranking-pestana${pestanaActivaRanking === "semanal" ? " activa" : ""}" id="tab-semanal">Esta semana</div>
    </div>

    ${miEstadoRanking.apuntada ? `
      <div class="ranking-mi-alias">
        <span class="chip">🙋 Compites como: <strong>${escaparHtmlRk(miEstadoRanking.alias)}</strong></span>
        <button type="button" id="btn-cambiar-alias">Cambiar nombre</button>
        <button type="button" id="btn-salir-ranking">Salir del ranking</button>
      </div>
    ` : `
      <div class="ranking-caja-alias">
        <p style="margin:0 0 4px"><strong>¿Quieres participar?</strong></p>
        <p style="margin:0; font-size:0.9rem; opacity:0.85">Es voluntario. Elige el nombre con el que quieres que te vean el resto — no tiene por qué ser el tuyo real.</p>
        <input type="text" id="input-alias" placeholder="Tu nombre en el ranking" maxlength="20" />
        <button type="button" class="btn btn-primario" id="btn-apuntarse">Apuntarme</button>
      </div>
    `}

    <div id="zona-lista-ranking">${htmlListaRanking(lista)}</div>
  `;

  document.getElementById("tab-diario").addEventListener("click", () => cambiarPestana("diario"));
  document.getElementById("tab-semanal").addEventListener("click", () => cambiarPestana("semanal"));

  if (miEstadoRanking.apuntada) {
    document.getElementById("btn-cambiar-alias").addEventListener("click", () => abrirCambioAlias());
    document.getElementById("btn-salir-ranking").addEventListener("click", () => confirmarSalir());
  } else {
    document.getElementById("btn-apuntarse").addEventListener("click", () => apuntarse());
    document.getElementById("input-alias").addEventListener("keydown", (e) => {
      if (e.key === "Enter") apuntarse();
    });
  }
}

function htmlListaRanking(lista) {
  if (lista.length === 0) {
    return `
      <div class="ranking-vacio">
        <p style="font-size:1.5rem; margin:0 0 8px">🏆</p>
        <p style="margin:0"><strong>Aún no hay nadie en el ranking.</strong></p>
        <p style="margin:4px 0 0; opacity:0.8">Sé la primera en apuntarte.</p>
      </div>`;
  }

  if (lista.length === 1 && lista[0].es_mi_fila) {
    return `
      <div class="ranking-vacio">
        <p style="font-size:1.5rem; margin:0 0 8px">🥇</p>
        <p style="margin:0"><strong>Vas en cabeza</strong> — de momento eres la única apuntada.</p>
        <p style="margin:4px 0 0; opacity:0.8">${lista[0].aciertos} aciertos ${pestanaActivaRanking === "diario" ? "hoy" : "esta semana"}. Invita a alguien a competir contigo.</p>
      </div>`;
  }

  const medallas = ["🥇", "🥈", "🥉"];
  return `
    <div class="ranking-lista">
      ${lista.map((fila, i) => `
        <div class="ranking-fila${fila.es_mi_fila ? " mi-fila" : ""}">
          <span class="ranking-puesto${i < 3 ? " medalla" : ""}">${i < 3 ? medallas[i] : i + 1}</span>
          <span class="ranking-nombre">${escaparHtmlRk(fila.alias)}${fila.es_mi_fila ? " (tú)" : ""}</span>
          <span class="ranking-aciertos">${fila.aciertos} aciertos</span>
        </div>
      `).join("")}
    </div>`;
}

async function cambiarPestana(pestana) {
  pestanaActivaRanking = pestana;
  await cargarTodo();
}

async function apuntarse() {
  const input = document.getElementById("input-alias");
  const alias = (input.value || "").trim();
  if (alias.length < 2) {
    alert("Escribe un nombre de al menos 2 caracteres.");
    return;
  }
  const { error } = await sb.rpc("ranking_apuntarse_web", { p_alias: alias });
  if (error) {
    console.error(error);
    alert("No se ha podido guardar. Inténtalo de nuevo.");
    return;
  }
  await cargarTodo();
}

function abrirCambioAlias() {
  const nuevo = prompt("¿Con qué nombre quieres competir a partir de ahora?", miEstadoRanking.alias);
  if (nuevo === null) return;
  const alias = nuevo.trim();
  if (alias.length < 2) {
    alert("El nombre debe tener al menos 2 caracteres.");
    return;
  }
  sb.rpc("ranking_apuntarse_web", { p_alias: alias }).then(({ error }) => {
    if (error) {
      console.error(error);
      alert("No se ha podido cambiar el nombre. Inténtalo de nuevo.");
      return;
    }
    cargarTodo();
  });
}

function confirmarSalir() {
  if (!confirm("¿Seguro que quieres salir del ranking? Dejarás de aparecer en las listas.")) return;
  sb.rpc("ranking_salir_web").then(({ error }) => {
    if (error) {
      console.error(error);
      alert("No se ha podido completar. Inténtalo de nuevo.");
      return;
    }
    cargarTodo();
  });
}
