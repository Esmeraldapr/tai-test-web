// ============================================================
// Lógica de la portada (index.html)
// ============================================================

const ORDEN_MATERIAS = [
  "BLOQUE 1", "BLOQUE 2", "BLOQUE 3", "BLOQUE 4: Sistemas y Comunicaciones",
  "FUNDAMENTOS 1: INFORMÁTICA", "FUNDAMENTOS 2: PROGRAMACIÓN", "FUNDAMENTOS 3: REDES",
  "FUNDAMENTOS 4: BASES DE DATOS", "FUNDAMENTOS 5: SSOO", "EXÁMENES",
];

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const contenedor = document.getElementById("materias");

  if (!usuario) {
    contenedor.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta. Recarga la página en unos segundos.</div>`;
    return;
  }

  pintarNavbar("index.html", usuario);
  pintarBannerAcceso(usuario);
  registrarConexion();

  if (!usuario.email_verificado) {
    contenedor.innerHTML = `<div class="vacio"><div class="icono">📧</div>Confirma tu correo (revisa la bandeja de entrada y el spam) para que arranque tu prueba gratuita de ${HORAS_TRIAL} horas.</div>`;
    return;
  }

  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    contenedor.innerHTML = `<div class="vacio"><div class="icono">⏳</div>Tu acceso ha caducado.<br/><br/><a class="btn btn-primario" href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  // Se usa la vista agregada preguntas_resumen (cuenta en el servidor) en vez
  // de traer cada fila una a una: con 10.000+ preguntas, pedir cada fila
  // suelta chocaba con el límite de 1000 filas por consulta de Supabase y
  // solo se veían 2-3 materias a medias.
  const { data: filas, error } = await sb.from("preguntas_resumen").select("materia, tema, total");
  if (error) {
    console.error(error);
    contenedor.innerHTML = `<div class="vacio">No se ha podido cargar el temario. Recarga la página.</div>`;
    return;
  }

  const porMateria = new Map();
  for (const f of filas || []) {
    if (!porMateria.has(f.materia)) porMateria.set(f.materia, { total: 0, temas: new Map() });
    const m = porMateria.get(f.materia);
    m.total += f.total;
    m.temas.set(f.tema, (m.temas.get(f.tema) || 0) + f.total);
  }

  const materias = [...porMateria.keys()].sort((a, b) => {
    const ia = ORDEN_MATERIAS.indexOf(a), ib = ORDEN_MATERIAS.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  if (!materias.length) {
    contenedor.innerHTML = `<div class="vacio">Aún no hay preguntas cargadas.</div>`;
    return;
  }

  contenedor.innerHTML = materias.map((m, idx) => {
    const info = porMateria.get(m);
    const temas = [...info.temas.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return `
      <div class="panel materia-tarjeta">
        <div class="materia-cabecera" data-idx="${idx}">
          <div>
            <h2 style="margin-bottom:2px">📘 ${m}</h2>
            <div class="meta">${info.total} preguntas</div>
          </div>
          <a class="btn btn-primario" href="quiz.html?materia=${encodeURIComponent(m)}&modo=aleatorio&n=20">Practicar 20 al azar</a>
        </div>
        <div class="temas-lista" id="temas-${idx}">
          ${temas.map(([t, n]) => `<a class="tema-btn" href="quiz.html?materia=${encodeURIComponent(m)}&tema=${encodeURIComponent(t)}&modo=tema">${t} (${n})</a>`).join("")}
        </div>
      </div>`;
  }).join("");

  document.querySelectorAll(".materia-cabecera").forEach((cab) => {
    cab.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      document.getElementById(`temas-${cab.dataset.idx}`).classList.toggle("abierta");
    });
  });
})();