// ============================================================
// Lógica de "Test por temas" (temas.html)
// ============================================================

const ORDEN_MATERIAS = [
    "BLOQUE 1: DERECHO", "BLOQUE 2: TECNOLOGÍA", "BLOQUE 3: DESARROLLO", "BLOQUE 4: SISTEMAS Y COMUNICACIONES",
  "FUNDAMENTOS 1: INFORMÁTICA", "FUNDAMENTOS 2: PROGRAMACIÓN", "FUNDAMENTOS 3: REDES",
  "FUNDAMENTOS 4: BASES DE DATOS", "FUNDAMENTOS 5: SSOO",
];

// Pestañas de arriba (16-oct-2026): un bloque por pestaña y los
// Fundamentos juntos en la última. Si los bloques se renombran,
// hay que cambiar ORDEN_MATERIAS (arriba) y esta lista.
const PESTANAS_TEMAS = [
  { id: "1", titulo: "Bloque 1", sub: "Derecho", materias: ["BLOQUE 1: DERECHO"] },
  { id: "2", titulo: "Bloque 2", sub: "Tecnología", materias: ["BLOQUE 2: TECNOLOGÍA"] },
  { id: "3", titulo: "Bloque 3", sub: "Desarrollo", materias: ["BLOQUE 3: DESARROLLO"] },
  { id: "4", titulo: "Bloque 4", sub: "Sistemas", materias: ["BLOQUE 4: SISTEMAS Y COMUNICACIONES"] },
  { id: "f", titulo: "Fundamentos", sub: "Repaso de base", materias: null }, // el resto
];

let porMateriaTemas = new Map();
let pestanaActual = "1";

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const contenedor = document.getElementById("materias");

  if (!usuario) {
    contenedor.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta. Recarga la página en unos segundos.</div>`;
    return;
  }

  pintarSidebar("temas.html", usuario);
  pintarBannerAcceso(usuario);
  registrarConexion();

  if (!usuario.email_verificado) {
    contenedor.innerHTML = `<div class="vacio"><div class="icono">📧</div>Confirma tu correo (revisa la bandeja de entrada y el spam) para que arranque tu prueba gratuita de ${DIAS_TRIAL} días.</div>`;
    return;
  }

  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    contenedor.innerHTML = `<div class="vacio"><div class="icono">⏳</div>Tu acceso ha caducado.<br/><br/><a class="btn btn-primario" href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  // Se usa la vista agregada preguntas_resumen (cuenta en el servidor) en vez
  // de traer cada fila una a una: con 10.000+ preguntas, pedir cada fila
  // suelta chocaba con el límite de 1000 filas por consulta de Supabase.
  const { data: filas, error } = await sb.from("preguntas_resumen").select("materia, tema, total");
  if (error) {
    console.error(error);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar el temario. Recarga la página.</div>`;
    return;
  }

  porMateriaTemas = new Map();
  for (const f of filas || []) {
    if (f.materia === "EXÁMENES") continue; // esa materia tiene su propia sección: Cuestionarios
    if (!porMateriaTemas.has(f.materia)) porMateriaTemas.set(f.materia, { total: 0, temas: new Map() });
    const m = porMateriaTemas.get(f.materia);
    m.total += f.total;
    m.temas.set(f.tema, (m.temas.get(f.tema) || 0) + f.total);
  }

  if (!porMateriaTemas.size) {
    contenedor.innerHTML = `<div class="vacio">Aún no hay preguntas cargadas.</div>`;
    return;
  }

  const pedida = new URLSearchParams(window.location.search).get("b");
  if (PESTANAS_TEMAS.some((p) => p.id === pedida)) pestanaActual = pedida;

  ponerSelectorNumero();
  pintarPestanas();
  pintarPestanaActual();
})();

// ---------- Pestañas ----------
function materiasDePestana(p) {
  if (p.materias) return p.materias.filter((m) => porMateriaTemas.has(m));
  const fijas = PESTANAS_TEMAS.flatMap((x) => x.materias || []);
  return ordenarMaterias([...porMateriaTemas.keys()].filter((m) => !fijas.includes(m)));
}

function ordenarMaterias(lista) {
  return lista.sort((a, b) => {
    const ia = ORDEN_MATERIAS.indexOf(a), ib = ORDEN_MATERIAS.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, "es");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function pintarPestanas() {
  const caja = document.getElementById("tt-pestanas");
  caja.innerHTML = PESTANAS_TEMAS
    .filter((p) => materiasDePestana(p).length)
    .map((p) => `
      <button type="button" role="tab" class="tt-pestana" data-id="${p.id}"
        aria-selected="${p.id === pestanaActual}" aria-controls="materias">
        <span>${p.titulo}</span><small>${p.sub}</small>
      </button>`).join("");
  caja.querySelectorAll(".tt-pestana").forEach((btn) => {
    btn.addEventListener("click", () => {
      pestanaActual = btn.dataset.id;
      caja.querySelectorAll(".tt-pestana").forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      guardarEnUrl();
      pintarPestanaActual();
    });
  });
  // Flechas izquierda/derecha para moverse entre pestañas con el teclado
  caja.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const botones = [...caja.querySelectorAll(".tt-pestana")];
    const i = botones.indexOf(document.activeElement);
    if (i === -1) return;
    const sig = botones[(i + (e.key === "ArrowRight" ? 1 : -1) + botones.length) % botones.length];
    sig.focus();
    sig.click();
  });
}

function pintarPestanaActual() {
  const contenedor = document.getElementById("materias");
  const p = PESTANAS_TEMAS.find((x) => x.id === pestanaActual) || PESTANAS_TEMAS[0];
  const materias = materiasDePestana(p);
  const varias = materias.length > 1;

  contenedor.innerHTML = materias.map((m) => {
    const info = porMateriaTemas.get(m);
    const temas = [...info.temas.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
    const nombre = varias ? m : `${p.titulo} · ${p.sub}`;
    return `
      <section class="tt-seccion">
        <div class="tt-seccion-cabecera">
          <div>
            <h2>${escaparTexto(nombre)}</h2>
            <p class="tt-seccion-meta">${info.total.toLocaleString("es-ES")} preguntas · ${temas.length} tema${temas.length === 1 ? "" : "s"}</p>
          </div>
          <a class="btn btn-secundario tt-azar" href="quiz.html?materia=${encodeURIComponent(m)}&modo=aleatorio&n=20">🎲 20 al azar de ${varias ? "esta parte" : "todo el bloque"}</a>
        </div>
        <div class="tt-rejilla">
          ${temas.map(([t, n]) => `
            <a class="tt-tarjeta" data-materia="${escaparTexto(m)}" data-tema="${escaparTexto(t)}"
               href="${enlaceTema(m, t)}">
              <div class="tt-imagen">${imagenTema(m, t)}</div>
              <div class="tt-cuerpo">
                <h3>${escaparTexto(t)}</h3>
                <p>${n.toLocaleString("es-ES")} preguntas</p>
              </div>
              <div class="tt-pie"><span class="btn btn-primario">Practicar</span></div>
            </a>`).join("")}
        </div>
      </section>`;
  }).join("");
}

function enlaceTema(materia, tema) {
  return `quiz.html?materia=${encodeURIComponent(materia)}&tema=${encodeURIComponent(tema)}&modo=tema&n=${nPreguntas()}`;
}

function escaparTexto(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Guarda pestaña y número en la dirección, así al volver atrás desde
// un test se vuelve a la misma pestaña.
function guardarEnUrl() {
  const q = new URLSearchParams(window.location.search);
  q.set("b", pestanaActual);
  q.set("n", nPreguntas());
  history.replaceState(null, "", `?${q.toString()}`);
}

// ---------- Número de preguntas por tema ----------
let nElegido = null;
function nPreguntas() {
  return nElegido || new URLSearchParams(window.location.search).get("n") || "20";
}

function ponerSelectorNumero() {
  const caja = document.getElementById("tt-numero");
  if (!caja || document.getElementById("sel-n-tema")) return;
  caja.innerHTML = `
    <label for="sel-n-tema">Preguntas por test:</label>
    <select id="sel-n-tema">
      <option value="10">10</option>
      <option value="20">20</option>
      <option value="30">30</option>
      <option value="50">50</option>
      <option value="0">Todas</option>
    </select>`;
  const sel = document.getElementById("sel-n-tema");
  sel.value = nPreguntas();
  sel.addEventListener("change", () => {
    nElegido = sel.value;
    guardarEnUrl();
    document.querySelectorAll(".tt-tarjeta").forEach((a) => {
      a.href = enlaceTema(a.dataset.materia, a.dataset.tema);
    });
  });
}
