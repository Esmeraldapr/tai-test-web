// ============================================================
// Lógica de "Los imprescindibles" (imprescindibles.html)
// Fichas de conceptos clave, agrupadas por bloque y tema.
// Lectura de una ficha suelta: leerTexto() de common.js.
// Lectura continua (tema entero o todo lo filtrado): reproductor propio,
// porque leerTexto lee un solo texto y corta lo anterior al empezar.
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

// --- Reproductor de lectura continua -------------------------------------
const lector = { cola: [], indice: 0, activo: false };

function textoDeFicha(f) {
  const partes = [f.termino];
  if (f.siglas) partes.push(f.siglas);
  partes.push(f.definicion);
  if (f.puerto) partes.push(`Puerto ${f.puerto}`);
  if (f.nota) partes.push(f.nota);
  return partes.join(". ").replace(/\s+/g, " ").trim();
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
  if (btn) btn.textContent = lector.activo ? "⏹️ Parar" : "🔊 Escuchar todo";
  if (prog) prog.textContent = lector.activo ? `Ficha ${lector.indice + 1} de ${lector.cola.length}` : "";
  document.querySelectorAll(".imp-btn-tema").forEach((b) => { b.disabled = lector.activo; });
}

function pararLectura() {
  lector.activo = false;
  lector.cola = [];
  lector.indice = 0;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  marcarSonando(null);
  actualizarBotonesLector();
}

function siguienteEnCola() {
  if (!lector.activo) return;
  if (lector.indice >= lector.cola.length) {
    pararLectura();
    return;
  }
  const ficha = lector.cola[lector.indice];
  marcarSonando(ficha.id);
  actualizarBotonesLector();
  const u = new SpeechSynthesisUtterance(textoDeFicha(ficha));
  u.lang = "es-ES";
  u.rate = typeof VELOCIDAD_VOZ !== "undefined" ? VELOCIDAD_VOZ : 0.95;
  u.onend = () => { lector.indice += 1; siguienteEnCola(); };
  u.onerror = () => { lector.indice += 1; siguienteEnCola(); };
  window.speechSynthesis.speak(u);
}

function empezarLectura(fichas) {
  if (!window.speechSynthesis) {
    alert("Tu navegador no admite la lectura en voz alta.");
    return;
  }
  if (typeof detenerLectura === "function") detenerLectura();
  window.speechSynthesis.cancel();
  lector.cola = fichas;
  lector.indice = 0;
  lector.activo = true;
  actualizarBotonesLector();
  siguienteEnCola();
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
    if (lector.activo) pararLectura();
    else empezarLectura(VISIBLES.slice());
  });

  zona.querySelectorAll(".imp-btn-tema").forEach((btn) => {
    btn.addEventListener("click", () => {
      empezarLectura(grupos[Number(btn.dataset.grupo)].fichas.slice());
    });
  });

  zona.querySelectorAll(".imp-voz").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (lector.activo) pararLectura();
      const ficha = TODAS.find((f) => String(f.id) === btn.dataset.id);
      if (ficha) leerTexto(textoDeFicha(ficha), btn);
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
