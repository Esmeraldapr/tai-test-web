(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  if (usuario) pintarSidebar("", usuario);
  document.getElementById("precio-mostrado").textContent = `${PRECIO_EUROS}€`;

  // Si ya tiene un acceso de pago vigente (no un trial), no le dejamos pagar
  // otra vez por error: escondemos el botón y mostramos un aviso claro.
  if (usuario) {
    const acceso = calcularAcceso(usuario);
    if (acceso.acceso && acceso.motivo === "pago") {
      const cuando = acceso.hasta.toLocaleDateString("es-ES");
      document.getElementById("precio-mostrado").style.display = "none";
      document.getElementById("btn-pagar").style.display = "none";
      const aviso = document.getElementById("aviso-ya-activo");
      aviso.style.display = "block";
      aviso.innerHTML = `✅ Ya tienes acceso activo hasta el <strong>${cuando}</strong>. No hace falta que pagues otra vez.`;
    }
  }

  document.getElementById("btn-pagar").addEventListener("click", async () => {
    const estado = document.getElementById("estado-pago");
    estado.textContent = "Conectando con PayPal...";
    estado.style.color = "var(--texto-suave)";
    try {
      const res = await fetch("/api/paypal/crear-orden", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sesion.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        estado.textContent = data.error || "No se ha podido iniciar el pago.";
        estado.style.color = "var(--rojo)";
        return;
      }
      window.location.href = data.approveUrl;
    } catch (e) {
      estado.textContent = "Error de conexión. Inténtalo de nuevo.";
      estado.style.color = "var(--rojo)";
    }
  });

  // --- Canjear código de acceso ---
  const formCodigo = document.getElementById("form-codigo");
  formCodigo.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const input = document.getElementById("input-codigo");
    const estado = document.getElementById("estado-codigo");
    const boton = document.getElementById("btn-canjear");
    const codigo = input.value.trim();
    if (!codigo) return;

    boton.disabled = true;
    estado.textContent = "Comprobando código...";
    estado.style.color = "var(--texto-suave)";

    try {
      const { data, error } = await sb.rpc("canjear_codigo_web", { p_codigo: codigo });
      if (error) {
        estado.textContent = "No se ha podido canjear el código. Inténtalo de nuevo.";
        estado.style.color = "var(--rojo)";
        return;
      }
      if (!data || !data.ok) {
        const mensajes = {
          codigo_invalido: "Ese código no existe. Revisa que lo has escrito bien.",
          codigo_ya_usado: "Ese código ya se ha usado.",
          usuario_no_encontrado: "Ha habido un problema cargando tu cuenta. Recarga la página.",
          no_autenticado: "Tienes que iniciar sesión para canjear un código.",
        };
        estado.textContent = mensajes[data && data.error] || "No se ha podido canjear el código.";
        estado.style.color = "var(--rojo)";
        return;
      }
      const hasta = new Date(data.hasta).toLocaleDateString("es-ES");
      estado.textContent = `✅ ¡Código canjeado! Ahora tienes acceso hasta el ${hasta}.`;
      estado.style.color = "var(--verde, green)";
      input.value = "";
      input.disabled = true;
      // Refrescamos la parte de arriba para que refleje el nuevo acceso.
      document.getElementById("precio-mostrado").style.display = "none";
      document.getElementById("btn-pagar").style.display = "none";
      const aviso = document.getElementById("aviso-ya-activo");
      aviso.style.display = "block";
      aviso.innerHTML = `✅ Ya tienes acceso activo hasta el <strong>${hasta}</strong>.`;
    } catch (e) {
      estado.textContent = "Error de conexión. Inténtalo de nuevo.";
      estado.style.color = "var(--rojo)";
    } finally {
      boton.disabled = false;
    }
  });
})();
