// ============================================================
// Lógica de "Los imprescindibles" (imprescindibles.html)
// Fichas de conceptos clave, agrupadas por bloque y tema.
// La lectura (una ficha suelta, un tema entero o todo lo filtrado) usa
// leerTexto()/leerEnCola() de common.js, pasando los elementos del DOM de
// cada ficha para que se resalte palabra a palabra mientras suena.
// ============================================================

// El favicon se pone desde aquí con LOGO_BUHO (config.js) en vez de repetir el
// base64 dentro del HTML: mismo patrón que recuperar.html.
(function ponerFavicon() {
  if (typeof LOGO_BUHO === "undefined") return;
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/jpeg";
  link.href = LOGO_BUHO;
  document.head.appendChild(link);
})();

// Estilos del reproductor. Se inyectan desde aquí para no tener que tocar
// imprescindibles.html cada vez que se ajuste algo.
(function ponerEstilosLector() {
  const tag = document.createElement("style");
  tag.textContent = `
    .imp-lector { display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      margin: 4px 0 16px; padding: 10px 12px; border-radius: 10px;
      border: 1px solid rgba(128,128,128,0.28); background: rgba(128,128,128,0.05); }
    .imp-btn-lector { cursor: pointer; font-family: inherit; font-size: 0.9rem;
      padding: 7px 14px; border-radius: 999px; color: inherit;
      border: 1px solid rgba(128,128,128,0.45); background: rgba(128,128,128,0.10); }
    .imp-btn-lector:hover { background: rgba(128,128,128,0.22); }
    .imp-progreso { font-size: 0.85rem; opacity: 0.75; }
    .imp-tema-cabecera { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .imp-btn-tema { cursor: pointer; font-family: inherit; font-size: 0.78rem;
      padding: 4px 10px; border-radius: 999px; color: inherit; white-space: nowrap;
      border: 1px solid rgba(128,128,128,0.45); background: rgba(128,128,128,0.08); }
    .imp-btn-tema:hover { background: rgba(128,128,128,0.2); }
    .imp-btn-tema[disabled] { opacity: 0.45; cursor: default; }
    .imp-ficha.imp-sonando { outline: 2px solid rgba(128,128,128,0.55); outline-offset: 2px; }
  `;
  document.head.appendChild(tag);
})();

let TODAS = [];
let VISIBLES = [];

// --- Lectura continua -------------------------------------
// El progreso ("Ficha 3 de 12") y qué ficha está sonando ahora se llevan
// aparte, en paralelo a la cola que gestiona leerEnCola() de common.js.
let progresoLectura = { total: 0, activo: false };

/** Devuelve, en el orden en que se leen visualmente, los elementos del DOM
 * de una ficha ya pintada (para resaltar mientras se lee). */
function elementosDeFicha(articleEl) {
  if (!articleEl) return [];
  return Array.from(
    articleEl.querySelectorAll(".imp-termino, .imp-puerto, .imp-siglas, .imp-definicion, .imp-nota")
  );
}

function marcarSonando(id) {
  document.querySelectorAll(".imp-ficha.imp-sonando").forEach((el) => el.classList.remove("imp-sonando"));
  if (!id) return;
  const ficha = document.querySelector(`.imp-ficha[data-ficha="${id}"]`);
  if (!ficha) return;
  ficha.classList.add("imp-sonando");
  ficha.scrollIntoView({ behavior: "smooth", block: "center" });
}

function actualizarBotonesLector() {
  const btn = document.getElementById("imp-btn-todo");
  const prog = document.getElementById("imp-progreso");
  if (btn) btn.textContent = progresoLectura.activo ? "⏹️ Parar" : "🔊 Escuchar todo";
  if (prog) prog.textContent = "";
  document.querySelectorAll(".imp-btn-tema").forEach((b) => { b.disabled = progresoLectura.activo; });
}

function pararLectura() {
  progresoLectura = { total: 0, activo: false };
  if (typeof detenerLectura === "function") detenerLectura();
  marcarSonando(null);
  actualizarBotonesLector();
}

function empezarLectura(fichas, boton) {
  if (!fichas.length) return;
  progresoLectura = { total: fichas.length, activo: true };
  const prog = document.getElementById("imp-progreso");
  const items = fichas.map((f, i) => ({
    elementos: elementosDeFicha(document.querySelector(`.imp-ficha[data-ficha="${f.id}"]`)),
    alEmpezar: () => {
      marcarSonando(f.id);
      if (prog) prog.textContent = `Ficha ${i + 1} de ${fichas.length}`;
      document.querySelectorAll(".imp-btn-tema").forEach((b) => { b.disabled = true; });
      const btnTodo = document.getElementById("imp-btn-todo");
      if (btnTodo) btnTodo.textContent = "⏹️ Parar";
    },
  }));
  leerEnCola(items, {
    boton,
    alTerminarTodo: () => {
      progresoLectura = { total: 0, activo: false };
      marcarSonando(null);
      actualizarBotonesLector();
    },
  });
}

// --- Pintado --------------------------------------------------------------

function esc(t) {
  return String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pintarFichas(filas) {
  const zona = document.getElementById("zona-imprescindibles");
  const contador = document.getElementById("imp-contador");
  pararLectura();
  VISIBLES = filas;

  if (!filas.length) {
    contador.textContent = "";
    zona.innerHTML = `<div class="vacio"><div class="icono">🔍</div>No hay ninguna ficha que coincida con lo que buscas.</div>`;
    return;
  }

  contador.textContent = `${filas.length} ${filas.length === 1 ? "ficha" : "fichas"}`;

  // Agrupar por bloque + tema conservando el orden en que vienen.
  const grupos = [];
  const indice = new Map();
  filas.forEach((f) => {
    const clave = `${f.materia}||${f.tema}`;
    if (!indice.has(clave)) {
      indice.set(clave, grupos.length);
      grupos.push({ materia: f.materia, tema: f.tema, fichas: [] });
    }
    grupos[indice.get(clave)].fichas.push(f);
  });

  const barra = `
    <div class="imp-lector">
      <button class="imp-btn-lector" id="imp-btn-todo" type="button">🔊 Escuchar todo</button>
      <span class="imp-progreso" id="imp-progreso"></span>
      <span class="imp-progreso">Lee seguidas todas las fichas que se ven. Filtra por bloque para escuchar solo ese.</span>
    </div>`;

  zona.innerHTML = barra + grupos.map((g, i) => `
    <section class="imp-tema">
      <div class="imp-tema-cabecera">
        <h2>${esc(g.tema)}</h2>
        <button class="imp-btn-tema" type="button" data-grupo="${i}">🔊 Escuchar este tema</button>
      </div>
      <div class="imp-bloque">${esc(g.materia)}</div>
      <div class="imp-fichas">
        ${g.fichas.map((f) => `
          <article class="imp-ficha" data-ficha="${f.id}">
            <div class="imp-cabecera">
              <span class="imp-termino">${esc(f.termino)}</span>
              ${f.puerto ? `<span class="imp-puerto">Puerto ${esc(f.puerto)}</span>` : ""}
              <button class="imp-voz" type="button" data-id="${f.id}" title="Escuchar" aria-label="Escuchar la ficha de ${esc(f.termino)}">🔊</button>
            </div>
            ${f.siglas ? `<div class="imp-siglas">${esc(f.siglas)}</div>` : ""}
            <p class="imp-definicion">${esc(f.definicion)}</p>
            ${f.nota ? `<p class="imp-nota">${esc(f.nota)}</p>` : ""}
          </article>`).join("")}
      </div>
    </section>`).join("");

  document.getElementById("imp-btn-todo").addEventListener("click", () => {
    if (progresoLectura.activo) pararLectura();
    else empezarLectura(VISIBLES.slice(), document.getElementById("imp-btn-todo"));
  });

  zona.querySelectorAll(".imp-btn-tema").forEach((btn) => {
    btn.addEventListener("click", () => {
      empezarLectura(grupos[Number(btn.dataset.grupo)].fichas.slice(), document.getElementById("imp-btn-todo"));
    });
  });

  zona.querySelectorAll(".imp-voz").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (progresoLectura.activo) pararLectura();
      const articleEl = btn.closest(".imp-ficha");
      leerTexto(elementosDeFicha(articleEl), btn);
    });
  });
}

function aplicarFiltros() {
  const texto = document.getElementById("imp-buscar").value.trim().toLowerCase();
  const bloque = document.getElementById("imp-bloque").value;
  const filtradas = TODAS.filter((f) => {
    if (bloque && f.materia !== bloque) return false;
    if (!texto) return true;
    return [f.termino, f.siglas, f.definicion, f.nota, f.puerto, f.tema]
      .some((v) => v && String(v).toLowerCase().includes(texto));
  });
  pintarFichas(filtradas);
}

async function cargarImprescindibles() {
  const zona = document.getElementById("zona-imprescindibles");
  const { data, error } = await sb
    .from("imprescindibles_web")
    .select("id, materia, tema, termino, siglas, definicion, nota, puerto")
    .eq("activa", true)
    .order("materia")
    .order("tema")
    .order("orden");

  if (error) {
    console.error(error);
    zona.innerHTML = `<div class="vacio">No se han podido cargar las fichas.</div>`;
    return;
  }

  TODAS = data || [];
  if (!TODAS.length) {
    zona.innerHTML = `<div class="vacio"><div class="icono">💡</div>Todavía no hay fichas publicadas. Estamos preparándolas.</div>`;
    return;
  }

  const selector = document.getElementById("imp-bloque");
  [...new Set(TODAS.map((f) => f.materia))].sort().forEach((m) => {
    const op = document.createElement("option");
    op.value = m;
    op.textContent = m;
    selector.appendChild(op);
  });

  document.getElementById("imp-buscar").addEventListener("input", aplicarFiltros);
  selector.addEventListener("change", aplicarFiltros);
  window.addEventListener("beforeunload", pararLectura);

  pintarFichas(TODAS);
}

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const zona = document.getElementById("zona-imprescindibles");
  if (!usuario) {
    zona.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta.</div>`;
    return;
  }
  pintarSidebar("imprescindibles.html", usuario);
  pintarBannerAcceso(usuario);

  if (!usuario.email_verificado) {
    zona.innerHTML = `<div class="vacio"><div class="icono">📧</div>Confirma tu correo para ver Los imprescindibles.</div>`;
    return;
  }

  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    zona.innerHTML = `<div class="vacio">Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  await cargarImprescindibles();
})();
