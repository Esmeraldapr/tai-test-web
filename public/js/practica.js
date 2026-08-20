// ============================================================
// Lógica de "Practicar" (practica.html)
// ============================================================

const ORDEN_MATERIAS_PRACTICA = [
  "BLOQUE 1", "BLOQUE 2", "BLOQUE 3", "BLOQUE 4: Sistemas y Comunicaciones",
  "FUNDAMENTOS 1: INFORMÁTICA", "FUNDAMENTOS 2: PROGRAMACIÓN", "FUNDAMENTOS 3: REDES",
  "FUNDAMENTOS 4: BASES DE DATOS", "FUNDAMENTOS 5: SSOO",
];

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const panel = document.getElementById("panel-practica");
  if (!usuario) {
    panel.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta.</div>`;
    return;
  }
  pintarSidebar("practica.html", usuario);
  pintarBannerAcceso(usuario);

  if (!usuario.email_verificado) {
    panel.innerHTML = `<div class="vacio"><div class="icono">📧</div>Confirma tu correo para poder practicar.</div>`;
    return;
  }

  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    panel.innerHTML = `<div class="vacio">Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  const { data: filas, error } = await sb.from("preguntas_resumen").select("materia, total");
  if (error) {
    console.error(error);
    panel.innerHTML = `<div class="vacio">No se ha podido cargar el temario.</div>`;
    return;
  }
  const porMateria = new Map();
  for (const f of filas || []) porMateria.set(f.materia, (porMateria.get(f.materia) || 0) + f.total);
  const materias = [...porMateria.keys()].filter((m) => m !== "EXÁMENES").sort((a, b) => {
    const ia = ORDEN_MATERIAS_PRACTICA.indexOf(a), ib = ORDEN_MATERIAS_PRACTICA.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  if (!materias.length) {
    panel.innerHTML = `<div class="vacio">Aún no hay preguntas cargadas.</div>`;
    return;
  }

  panel.innerHTML = `
    <div class="campo">
      <label>Materia</label>
      <select id="sel-materia" class="materia-select">
        ${materias.map((m) => `<option value="${m}">${m} (${porMateria.get(m)})</option>`).join("")}
      </select>
    </div>
    <div class="campo">
      <label>Nº de preguntas</label>
      <select id="sel-n" class="n-select">
        <option value="10">10</option>
        <option value="20" selected>20</option>
        <option value="30">30</option>
        <option value="50">50</option>
      </select>
    </div>
    <button class="btn btn-primario btn-bloque" id="btn-empezar">Empezar práctica →</button>
  `;
  document.getElementById("btn-empezar").addEventListener("click", () => {
    const materia = document.getElementById("sel-materia").value;
    const n = document.getElementById("sel-n").value;
    window.location.href = `quiz.html?materia=${encodeURIComponent(materia)}&modo=aleatorio&n=${n}`;
  });
})();
