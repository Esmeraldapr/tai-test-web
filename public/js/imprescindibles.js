// ============================================================
// Lógica de "Los imprescindibles" (imprescindibles.html)
// Fichas de conceptos clave, agrupadas por bloque y tema.
// La lectura en voz alta reutiliza leerTexto() de common.js.
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

let TODAS = [];

function esc(t) {
  return String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pintarFichas(filas) {
  const zona = document.getElementById("zona-imprescindibles");
  const contador = document.getElementById("imp-contador");

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

  zona.innerHTML = grupos.map((g) => `
    <section class="imp-tema">
      <h2>${esc(g.tema)}</h2>
      <div class="imp-bloque">${esc(g.materia)}</div>
      <div class="imp-fichas">
        ${g.fichas.map((f) => `
          <article class="imp-ficha">
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

  zona.querySelectorAll(".imp-voz").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ficha = TODAS.find((f) => String(f.id) === btn.dataset.id);
      if (!ficha) return;
      const partes = [ficha.termino];
      if (ficha.siglas) partes.push(ficha.siglas);
      partes.push(ficha.definicion);
      if (ficha.puerto) partes.push(`Puerto ${ficha.puerto}`);
      if (ficha.nota) partes.push(ficha.nota);
      leerTexto(partes.join(". "), btn);
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
