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
      return;
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
})();
