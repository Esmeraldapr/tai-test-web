// ============================================================
// Lógica de "Tutorial" (tutorial.html)
// ============================================================

const SECCIONES_TUTORIAL = [
  {
    icono: "🏠",
    titulo: "Dashboard",
    texto: "Es tu página de inicio: un resumen rápido de cuántas preguntas hay en el banco, tus aciertos, tu acceso restante y accesos directos a todas las secciones.",
  },
  {
    icono: "📘",
    titulo: "Repasar Tema",
    texto: "Aquí están los 4 bloques del temario oficial y los 5 fundamentos. Pulsa «Ver temas» para desplegar los temas de esa materia: cada uno te lleva a un test solo de ese tema. También puedes pulsar «Practicar 20 al azar» para un repaso mezclado de toda la materia.",
  },
  {
    icono: "💡",
    titulo: "Los imprescindibles",
    texto: "Fichas breves con los conceptos que más se repiten en el examen: qué es cada cosa, de qué son las siglas y el puerto cuando lo tiene. Están organizadas por bloque y tema, y muchas llevan una nota con el matiz que suele preguntarse o con la diferencia que más se confunde. Úsalas para repasar rápido antes de un test o cuando falle un concepto suelto.",
  },
  {
    icono: "🔎",
    titulo: "Buscar dentro de Los imprescindibles",
    texto: "El buscador de arriba mira en todo: el término, las siglas, la definición, la nota y el puerto. Puedes escribir «spanning tree» y te saltará STP, o poner «443» y te saldrá HTTPS. Con el desplegable de al lado te quedas solo con un bloque.",
  },
  {
    icono: "⚡",
    titulo: "Practicar",
    texto: "Elige cualquier materia y cuántas preguntas quieres, y te salen al azar. Ideal para un repaso rápido sin tener que elegir tema.",
  },
  {
    icono: "📝",
    titulo: "Cuestionarios",
    texto: "Cuestionarios con el formato de convocatorias anteriores, agrupados por año, para practicar.",
  },
  {
    icono: "📈",
    titulo: "Mi progreso",
    texto: "Tu racha de días seguidos practicando, cómo evoluciona tu % de aciertos día a día, y una comparativa de qué bloques dominas mejor.",
  },
  {
    icono: "🎯",
    titulo: "Mis fallos",
    texto: "Cada pregunta que respondes mal se guarda aquí automáticamente. Entra cuando quieras para repasar solo lo que se te resiste.",
  },
  {
    icono: "⭐",
    titulo: "Mis favoritas",
    texto: "Durante cualquier test, pulsa la estrella ☆ junto a la pregunta para guardarla. Luego las tienes todas juntas en «Mis favoritas» para repasarlas.",
  },
  {
    icono: "🔊",
    titulo: "Escuchar las preguntas",
    texto: "Durante un test, el icono de altavoz 🔊 junto a cada pregunta la lee en voz alta (enunciado y las 4 opciones). Vuelve a pulsarlo para que pare. Pensado para quien le cueste leer en pantalla, como personas con dislexia.",
  },
  {
    icono: "🎧",
    titulo: "Escuchar Los imprescindibles seguidas",
    texto: "En Los imprescindibles no hace falta ir dando al altavoz ficha por ficha. Con «Escuchar todo» se leen seguidas todas las que haya en pantalla, y si antes filtras por un bloque, se lee ese bloque entero. Cada tema tiene además su propio botón para escuchar solo ese. La ficha que suena en cada momento se queda resaltada y la página va bajando sola, así que puedes ponerte los cascos y dejarlo correr. Para parar, el mismo botón.",
  },
  {
    icono: "⏭️",
    titulo: "Pasar una pregunta / Volver atrás",
    texto: "Si una pregunta no la sabes, «Pasar sin responder» te deja seguir sin que cuente como fallo, y al terminar el test puedes repasar las que pasaste. «← Anterior» te permite volver a ver la pregunta de antes.",
  },
  {
    icono: "♿",
    titulo: "Accesibilidad: usar la web sin ratón",
    texto: "La web entera se puede manejar con el teclado. Pulsa el tabulador una vez y aparece arriba el botón «Saltar al contenido», que te lleva directo a lo importante sin recorrer el menú. Dentro del menú lateral te mueves con las flechas arriba y abajo, saltas al contenido con la flecha derecha y vuelves con la izquierda; Inicio y Fin llevan a la primera y a la última opción. En los test, las respuestas se eligen con Intro o con la barra espaciadora. Además, allí donde estés siempre se ve un recuadro morado que indica dónde tienes el foco.",
  },
  {
    icono: "🐢",
    titulo: "Velocidad de la lectura en voz alta",
    texto: "En la barra lateral, debajo de tu nombre, hay un selector de velocidad que va de muy lenta a máxima. Se aplica a todo lo que se lee en la web: preguntas, fichas y el propio tutorial. Tu elección se guarda en el navegador, así que la próxima vez que entres seguirá como la dejaste. Si tienes activada la opción de reducir animaciones en tu sistema, la web también la respeta.",
  },
  {
    icono: "🚩",
    titulo: "Reportar un error",
    texto: "Si ves que una pregunta está mal (respuesta incorrecta marcada, mal redactada...), pulsa «Reportar esta pregunta» dentro del test y cuéntamelo. Me llega el aviso y lo reviso.",
  },
];

// --- Lectura continua del tutorial entero --------------------------------
// Reproductor propio, igual que en Los imprescindibles: leerTexto() de
// common.js solo lee un texto y corta lo anterior al empezar.
const lectorTut = { indice: 0, activo: false };

function actualizarBotonTutorial() {
  const btn = document.getElementById("tut-btn-todo");
  const prog = document.getElementById("tut-progreso");
  if (btn) btn.textContent = lectorTut.activo ? "⏹️ Parar" : "🔊 Escuchar el tutorial entero";
  if (prog) {
    prog.textContent = lectorTut.activo
      ? `Sección ${lectorTut.indice + 1} de ${SECCIONES_TUTORIAL.length}`
      : "";
  }
}

function pararTutorial() {
  lectorTut.activo = false;
  lectorTut.indice = 0;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  document.querySelectorAll(".tutorial-item.sonando").forEach((el) => el.classList.remove("sonando"));
  actualizarBotonTutorial();
}

function siguienteSeccion() {
  if (!lectorTut.activo) return;
  if (lectorTut.indice >= SECCIONES_TUTORIAL.length) {
    pararTutorial();
    return;
  }
  const idx = lectorTut.indice;
  const s = SECCIONES_TUTORIAL[idx];
  document.querySelectorAll(".tutorial-item.sonando").forEach((el) => el.classList.remove("sonando"));
  const item = document.querySelector(`.tutorial-item[data-item="${idx}"]`);
  if (item) {
    item.classList.add("sonando");
    item.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById(`cuerpo-tutorial-${idx}`).classList.add("abierta");
    document.getElementById(`chevron-tutorial-${idx}`).classList.add("abierto");
  }
  actualizarBotonTutorial();
  const u = new SpeechSynthesisUtterance(`${s.titulo}. ${s.texto}`);
  u.lang = "es-ES";
  u.rate = typeof VELOCIDAD_VOZ !== "undefined" ? VELOCIDAD_VOZ : 0.95;
  u.onend = () => { lectorTut.indice += 1; siguienteSeccion(); };
  u.onerror = () => { lectorTut.indice += 1; siguienteSeccion(); };
  window.speechSynthesis.speak(u);
}

(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  const contenedor = document.getElementById("tutorial");

  if (!usuario) {
    contenedor.innerHTML = `<div class="vacio">Ha habido un problema cargando tu cuenta. Recarga la página en unos segundos.</div>`;
    return;
  }

  pintarSidebar("tutorial.html", usuario);
  pintarBannerAcceso(usuario);
  registrarConexion();

  const barra = `
    <div class="imp-lector">
      <button class="imp-btn-lector" id="tut-btn-todo" type="button">🔊 Escuchar el tutorial entero</button>
      <span class="imp-progreso" id="tut-progreso"></span>
      <span class="imp-progreso">Lee seguidas todas las secciones, de arriba abajo.</span>
    </div>`;

  contenedor.innerHTML =
    barra +
    SECCIONES_TUTORIAL.map(
      (s, idx) => `
    <div class="panel tutorial-item" data-item="${idx}">
      <div class="tutorial-cabecera" data-idx="${idx}">
        <div><span class="tutorial-icono">${s.icono}</span> <strong>${s.titulo}</strong></div>
        <div style="display:flex; align-items:center; gap:10px;">
          <button class="tut-voz" type="button" data-idx="${idx}" title="Escuchar esta sección" aria-label="Escuchar la sección ${s.titulo}">🔊</button>
          <span class="chevron" id="chevron-tutorial-${idx}">▾</span>
        </div>
      </div>
      <div class="tutorial-cuerpo" id="cuerpo-tutorial-${idx}">${s.texto}</div>
    </div>`
    ).join("") +
    `
    <div class="panel" id="panel-sugerencias">
      <h2>💡 Sugerencias</h2>
      <p class="subtitulo" style="margin-bottom:14px">¿Se te ocurre algo que mejoraría la web? Cuéntamelo aquí.</p>
      <textarea id="texto-sugerencia" rows="3" placeholder="Escribe tu idea..." style="width:100%;padding:11px 13px;border-radius:10px;border:1.5px solid var(--borde);font-size:.95rem;font-family:inherit;margin-bottom:10px"></textarea>
      <button class="btn btn-primario" id="btn-enviar-sugerencia" type="button">Enviar sugerencia</button>
      <div id="estado-sugerencia" style="margin-top:10px;font-size:.88rem"></div>
    </div>`;

  document.querySelectorAll(".tutorial-cabecera").forEach((cab) => {
    cab.addEventListener("click", (e) => {
      if (e.target.closest(".tut-voz")) return; // el altavoz no despliega
      document.getElementById(`cuerpo-tutorial-${cab.dataset.idx}`).classList.toggle("abierta");
      document.getElementById(`chevron-tutorial-${cab.dataset.idx}`).classList.toggle("abierto");
    });
  });

  // Altavoz de cada sección: abre el cuerpo si estaba cerrado y lo lee entero.
  document.querySelectorAll(".tut-voz").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (lectorTut.activo) pararTutorial();
      const idx = Number(btn.dataset.idx);
      const s = SECCIONES_TUTORIAL[idx];
      const cuerpo = document.getElementById(`cuerpo-tutorial-${idx}`);
      const chevron = document.getElementById(`chevron-tutorial-${idx}`);
      if (btn.dataset.leyendo !== "1" && !cuerpo.classList.contains("abierta")) {
        cuerpo.classList.add("abierta");
        chevron.classList.add("abierto");
      }
      leerTexto(`${s.titulo}. ${s.texto}`, btn);
    });
  });

  document.getElementById("tut-btn-todo").addEventListener("click", () => {
    if (lectorTut.activo) { pararTutorial(); return; }
    if (!window.speechSynthesis) { alert("Tu navegador no admite la lectura en voz alta."); return; }
    if (typeof detenerLectura === "function") detenerLectura();
    window.speechSynthesis.cancel();
    lectorTut.indice = 0;
    lectorTut.activo = true;
    siguienteSeccion();
  });

  window.addEventListener("beforeunload", pararTutorial);
  document.getElementById("btn-enviar-sugerencia").addEventListener("click", enviarSugerencia);
})();

async function enviarSugerencia() {
  const textarea = document.getElementById("texto-sugerencia");
  const estado = document.getElementById("estado-sugerencia");
  const mensaje = textarea.value.trim();
  if (!mensaje) {
    estado.textContent = "Escribe algo antes de enviar.";
    estado.style.color = "var(--rojo)";
    return;
  }
  const btn = document.getElementById("btn-enviar-sugerencia");
  btn.disabled = true;
  const { error } = await sb.from("sugerencias_web").insert({ mensaje });
  btn.disabled = false;
  if (error) {
    console.error(error);
    estado.textContent = "Has alcanzado el límite de 5 sugerencias por hoy, o tu acceso no está vigente. Inténtalo mañana.";
    estado.style.color = "var(--rojo)";
    return;
  }
  textarea.value = "";
  estado.textContent = "✅ ¡Gracias! La he recibido.";
  estado.style.color = "var(--verde)";
}
