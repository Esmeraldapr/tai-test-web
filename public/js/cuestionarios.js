// ============================================================
// Lógica de "Cuestionarios" (cuestionarios.html) — exámenes
// oficiales de convocatorias anteriores (materia EXÁMENES).
//
// Navegación en tres pasos, para no amontonar todo en una sola
// pantalla: AÑO → TURNO (solo si ese año tiene ingreso libre y
// promoción interna) → PARTE (Primera Parte / cada supuesto).
// Cada tema en Supabase viene como "2018 IL · Primera Parte",
// "2019 · Supuesto I", etc. — se separa aquí para construir el árbol.
// ============================================================

const NOMBRES_TURNO = { IL: "Ingreso libre", PI: "Promoción interna", "": "Ingreso libre" };

function parsearTema(temaCompleto) {
  const [prefijo, parte] = temaCompleto.split(" · ");
  const m = prefijo.match(/^(\d{4})\s*(IL|PI)?$/);
  const anio = m ? m[1] : prefijo;
  const turno = m && m[2] ? m[2] : "";
  return { anio, turno, parte: parte || temaCompleto };
}

function enlaceQuiz(tema) {
  return `quiz.html?materia=${encodeURIComponent("EXÁMENES")}&tema=${encodeURIComponent(tema)}&modo=tema&n=0`;
}

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// árbol: { "2018": { "IL": [{parte,tema,total}], "PI": [...] }, "2019": { "": [...] } }
let arbol = {};
let vista = { nivel: "anios", anio: null, turno: null };

function totalDe(nodo) {
  if (Array.isArray(nodo)) return nodo.reduce((s, p) => s + p.total, 0);
  return Object.values(nodo).reduce((s, lista) => s + totalDe(lista), 0);
}

function pintar() {
  const cont = document.getElementById("convocatorias");

  if (vista.nivel === "anios") {
    const anios = Object.keys(arbol).sort().reverse();
    cont.innerHTML = `
      <p class="migas">Elige el año de la convocatoria.</p>
      <div class="tarjetas-convocatoria">
        ${anios.map((anio) => `
          <button type="button" class="tarjeta-nivel" data-anio="${esc(anio)}">
            <div class="tarjeta-nivel-titulo">${esc(anio)}</div>
            <div class="tarjeta-nivel-sub">${totalDe(arbol[anio])} preguntas</div>
          </button>`).join("")}
      </div>`;
    cont.querySelectorAll("[data-anio]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const anio = btn.dataset.anio;
        const turnos = Object.keys(arbol[anio]);
        if (turnos.length === 1) {
          vista = { nivel: "partes", anio, turno: turnos[0] };
        } else {
          vista = { nivel: "turnos", anio, turno: null };
        }
        pintar();
      });
    });
    return;
  }

  if (vista.nivel === "turnos") {
    const turnos = Object.keys(arbol[vista.anio]);
    cont.innerHTML = `
      <p class="migas"><a href="#" data-volver="anios">Cuestionarios</a> / ${esc(vista.anio)}</p>
      <div class="tarjetas-convocatoria">
        ${turnos.map((t) => `
          <button type="button" class="tarjeta-nivel" data-turno="${esc(t)}">
            <div class="tarjeta-nivel-titulo">${esc(NOMBRES_TURNO[t] || t)}</div>
            <div class="tarjeta-nivel-sub">${totalDe(arbol[vista.anio][t])} preguntas</div>
          </button>`).join("")}
      </div>`;
    cont.querySelector('[data-volver="anios"]').addEventListener("click", (e) => {
      e.preventDefault();
      vista = { nivel: "anios", anio: null, turno: null };
      pintar();
    });
    cont.querySelectorAll("[data-turno]").forEach((btn) => {
      btn.addEventListener("click", () => {
        vista = { nivel: "partes", anio: vista.anio, turno: btn.dataset.turno };
        pintar();
      });
    });
    return;
  }

  // vista.nivel === "partes"
  const partes = arbol[vista.anio][vista.turno];
  const primera = partes.find((p) => p.parte === "Primera Parte");
  const supuestos = partes.filter((p) => p.parte !== "Primera Parte");
  const turnosDelAnio = Object.keys(arbol[vista.anio]);
  const migaTurno = turnosDelAnio.length > 1
    ? ` / <a href="#" data-volver="turnos">${esc(NOMBRES_TURNO[vista.turno] || vista.turno)}</a>`
    : "";

  cont.innerHTML = `
    <p class="migas"><a href="#" data-volver="anios">Cuestionarios</a> / ${esc(vista.anio)}${migaTurno}</p>
    <div class="tarjetas-convocatoria">
      ${primera ? `
      <a class="tarjeta-nivel tarjeta-parte" href="${enlaceQuiz(primera.tema)}">
        <div class="tarjeta-nivel-titulo">Primera Parte</div>
        <div class="tarjeta-nivel-sub">${primera.total} preguntas</div>
        <span class="tarjeta-parte-ir">Empezar →</span>
      </a>` : ""}
      ${supuestos.map((s) => `
      <a class="tarjeta-nivel tarjeta-parte" href="${enlaceQuiz(s.tema)}">
        <div class="tarjeta-nivel-titulo">${esc(s.parte)}</div>
        <div class="tarjeta-nivel-sub">${s.total} preguntas</div>
        <span class="tarjeta-parte-ir">Empezar →</span>
      </a>`).join("")}
      ${supuestos.length > 1 ? `
      <button type="button" class="tarjeta-nivel tarjeta-parte tarjeta-sorpresa">
        <div class="tarjeta-nivel-titulo">🎲 Sorpréndeme</div>
        <div class="tarjeta-nivel-sub">Un supuesto al azar, como el día del examen</div>
        <span class="tarjeta-parte-ir">Elegir por mí →</span>
      </button>` : ""}
    </div>`;

  cont.querySelector('[data-volver="anios"]').addEventListener("click", (e) => {
    e.preventDefault();
    vista = { nivel: "anios", anio: null, turno: null };
    pintar();
  });
  const migaT = cont.querySelector('[data-volver="turnos"]');
  if (migaT) migaT.addEventListener("click", (e) => {
    e.preventDefault();
    vista = { nivel: "turnos", anio: vista.anio, turno: null };
    pintar();
  });
  const btnSorpresa = cont.querySelector(".tarjeta-sorpresa");
  if (btnSorpresa) {
    btnSorpresa.addEventListener("click", () => {
      const elegido = supuestos[Math.floor(Math.random() * supuestos.length)];
      window.location.href = enlaceQuiz(elegido.tema);
    });
  }
}

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const cont = document.getElementById("convocatorias");
  if (!usuario) {
    cont.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta.</div>`;
    return;
  }
  pintarSidebar("cuestionarios.html", usuario);
  pintarBannerAcceso(usuario);

  if (!usuario.email_verificado) {
    cont.innerHTML = `<div class="vacio"><div class="icono">📧</div>Confirma tu correo para acceder a los cuestionarios.</div>`;
    return;
  }

  const acceso = calcularAcceso(usuario);
  if (!acceso.acceso) {
    cont.innerHTML = `<div class="vacio">Tu acceso ha caducado. <a href="pago.html">Consigue ${DIAS_ACCESO_PAGADO} días por ${PRECIO_EUROS}€</a></div>`;
    return;
  }

  const { data: filas, error } = await sb.from("preguntas_resumen").select("tema, total").eq("materia", "EXÁMENES");
  if (error) {
    console.error(error);
    cont.innerHTML = `<div class="vacio">No se han podido cargar los cuestionarios.</div>`;
    return;
  }
  if (!filas || !filas.length) {
    cont.innerHTML = `<div class="vacio">No hay cuestionarios disponibles todavía.</div>`;
    return;
  }

  arbol = {};
  filas.forEach((f) => {
    const { anio, turno, parte } = parsearTema(f.tema);
    if (!arbol[anio]) arbol[anio] = {};
    if (!arbol[anio][turno]) arbol[anio][turno] = [];
    arbol[anio][turno].push({ parte, tema: f.tema, total: f.total });
  });

  pintar();
})();
