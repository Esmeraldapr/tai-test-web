(async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;
  const usuario = await obtenerUsuarioWeb(sesion);
  if (usuario) pintarNavbar("", usuario);
  document.getElementById("precio-mostrado").textContent = `${PRECIO_EUROS}€`;

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
