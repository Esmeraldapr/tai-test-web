// ============================================================
// Servidor mínimo: solo sirve los archivos estáticos de /public
// y expone las rutas de pago con PayPal (el PAYPAL_SECRET no puede
// vivir en el navegador). Todo lo demás (login, leer preguntas,
// guardar resultados, reportar incidencias) va directo del
// navegador a Supabase, protegido por RLS.
// ============================================================
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const nodemailer = require('nodemailer');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com';
const PRECIO_EUROS = process.env.PRECIO_EUROS || '2.50';
const DIAS_ACCESO_PAGADO = 30;
const DIAS_TRIAL = 14;
const HORAS_TRIAL = DIAS_TRIAL * 24;
const WEBAPP_URL = process.env.WEBAPP_URL || '';
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYPAL_CLIENT_ID, PAYPAL_SECRET');
  process.exit(1);
}

process.on('uncaughtException', (err) => {
  console.error('Error no controlado (el servidor sigue funcionando):', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Promesa rechazada no controlada (el servidor sigue funcionando):', err);
});

// Cliente con la service_role key: SOLO se usa aquí (nunca en el navegador),
// porque ignora RLS. Hace falta para verificar el JWT del usuario y para
// activar el acceso pagado tras confirmar un cobro real.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Envío de correo (agradecimiento a quien reporta una incidencia, avisándole
// si se ha corregido su reporte o no). Usa una cuenta de Gmail normal con
// "contraseña de aplicación" (no la contraseña de la cuenta) vía SMTP.
// Si faltan las variables de entorno, el envío se salta sin tumbar el
// servidor (igual que con OG_BUHO_BASE64 más abajo).
let transporterCorreo = null;
if (EMAIL_USER && EMAIL_APP_PASSWORD) {
  transporterCorreo = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
  });
} else {
  console.error('EMAIL_USER / EMAIL_APP_PASSWORD no configurados: no se podrán enviar correos de incidencias.');
}

/** Manda el correo de vuelta a quien reportó una incidencia.
 * corregido: true si se ha aplicado un cambio en la pregunta, false si se ha
 * revisado y no hacía falta cambiar nada.
 * NOTA: esta función todavía no se llama desde ningún sitio — falta decidir
 * con la usuaria si la revisión que decide "corregido: true/false" es
 * automática o pasa antes por su aprobación. Cuando se decida, se engancha
 * aquí, tras marcar la incidencia como revisada en incidencias_web. */
async function enviarCorreoIncidencia(destinatario, { mensajeOriginal, corregido, notas }) {
  if (!transporterCorreo) {
    console.error('No se ha enviado el correo de incidencia: falta configurar EMAIL_USER/EMAIL_APP_PASSWORD.');
    return false;
  }
  const asunto = corregido
    ? '✅ Hemos corregido la pregunta que reportaste — Oposición TAI'
    : 'Hemos revisado tu reporte — Oposición TAI';
  const cuerpo = `
    <p>¡Hola!</p>
    <p>Gracias por avisarnos de un posible fallo en una pregunta de la web de Oposición TAI. Tu colaboración nos ayuda a mantener el contenido lo más correcto posible para todas las personas que se preparan la oposición.</p>
    <p><strong>Lo que reportaste:</strong><br/>${mensajeOriginal || '(sin mensaje adicional)'}</p>
    <p>${corregido
      ? 'Hemos revisado la pregunta y <strong>hemos aplicado una corrección</strong>.'
      : 'Hemos revisado la pregunta y, tras comprobarlo, <strong>no hemos encontrado ningún error que corregir</strong>.'}</p>
    ${notas ? `<p>${notas}</p>` : ''}
    <p>¡Gracias de nuevo por tu ayuda!<br/>Oposición TAI</p>
  `;
  try {
    await transporterCorreo.sendMail({
      from: `"Oposición TAI" <${EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: cuerpo,
    });
    return true;
  } catch (e) {
    console.error('Error enviando correo de incidencia:', e);
    return false;
  }
}

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.send('OK'));
app.use(express.static(path.join(__dirname, 'public')));

// Imagen para las vistas previas al compartir el enlace (og:image / twitter:image).
// La leemos del propio favicon incrustado en public/index.html en vez de guardarla
// como archivo binario en el repo: los archivos binarios subidos vía MCP de GitHub
// se corrompen (bug conocido, ver decisiones-y-hallazgos.md). Mismo motivo por el
// que LOGO_BUHO en public/js/config.js también va en base64 dentro de un archivo de texto.
let OG_BUHO_BASE64 = null;
try {
  const indexHtml = require('fs').readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  const match = indexHtml.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/);
  if (match) OG_BUHO_BASE64 = match[1];
} catch (e) {
  console.error('No se pudo leer el favicon para servir /img/og-buho.jpg:', e);
}

app.get('/img/og-buho.jpg', (req, res) => {
  if (!OG_BUHO_BASE64) return res.status(404).send('Imagen no disponible');
  res.set('Content-Type', 'image/jpeg');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(Buffer.from(OG_BUHO_BASE64, 'base64'));
});

async function requiereSesion(req, res, next) {
  const cabecera = req.headers['authorization'] || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Falta autenticación.' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data || !data.user) {
    return res.status(401).json({ error: 'Sesión inválida o caducada.' });
  }
  req.userId = data.user.id;
  next();
}

/** Igual que calcularAcceso() en public/js/common.js, pero en el servidor
 * (aquí no tenemos acceso al navegador). Se usa para no dejar pagar dos
 * veces seguidas por error a quien ya tiene un acceso de pago vigente.
 * IMPORTANTE: se comprueba primero el PAGO y luego el trial (no al revés).
 * Si se comprobara el trial primero, alguien que paga mientras su trial
 * todavía no ha terminado seguiría teniendo motivo "trial" en vez de
 * "pago", y este guardarraíl nunca bloquearía una orden duplicada — dejando
 * pagar dos veces de verdad. Con el pago comprobado primero, en cuanto hay
 * un pago vigente manda sobre el trial. */
function tieneAccesoValido(usuario) {
  const ahora = new Date();
  if (usuario.fecha_expiracion) {
    const finPago = new Date(usuario.fecha_expiracion);
    if (ahora < finPago) return { acceso: true, motivo: 'pago', hasta: finPago };
  }
  if (usuario.fecha_inicio_trial) {
    const finTrial = new Date(usuario.fecha_inicio_trial);
    finTrial.setHours(finTrial.getHours() + HORAS_TRIAL);
    if (ahora < finTrial) return { acceso: true, motivo: 'trial', hasta: finTrial };
  }
  return { acceso: false };
}

async function getPaypalAccessToken() {
  const credenciales = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credenciales}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error('Error obteniendo token de PayPal:', data);
    throw new Error('No se pudo conectar con PayPal.');
  }
  return data.access_token;
}

async function crearOrdenPaypal(userId) {
  const token = await getPaypalAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id: userId,
        description: 'Acceso 30 días - Oposición TAI (web)',
        amount: { currency_code: 'EUR', value: PRECIO_EUROS },
      }],
      application_context: {
        brand_name: 'Oposición TAI',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: `${WEBAPP_URL}/pago-exito`,
        cancel_url: `${WEBAPP_URL}/pago-cancelado`,
      },
    }),
  });
  const data = await res.json();
  if (!data.id) {
    console.error('Error creando orden de PayPal:', data);
    throw new Error('No se pudo crear el pago.');
  }
  const linkAprobacion = (data.links || []).find((l) => l.rel === 'approve');
  return { id: data.id, approveUrl: linkAprobacion ? linkAprobacion.href : null };
}

async function capturarOrdenPaypal(orderId) {
  const token = await getPaypalAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.json();
}

async function activarAccesoPagado(userId) {
  const ahora = new Date();
  const { data: usuario, error: errorUsuario } = await supabase
    .from('usuarios_web').select('fecha_expiracion').eq('auth_user_id', userId).maybeSingle();

  let base = ahora;
  if (!errorUsuario && usuario && usuario.fecha_expiracion && new Date(usuario.fecha_expiracion) > base) {
    base = new Date(usuario.fecha_expiracion);
  }

  const expiracion = new Date(base);
  expiracion.setDate(expiracion.getDate() + DIAS_ACCESO_PAGADO);

  const { error } = await supabase.from('usuarios_web').update({
    fecha_activacion: ahora.toISOString(),
    fecha_expiracion: expiracion.toISOString(),
  }).eq('auth_user_id', userId);

  if (error) { console.error('Error activando acceso pagado:', error); return null; }
  return expiracion;
}

function paginaSimple(mensaje) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Oposición TAI</title>
  <style>body{font-family:sans-serif;background:#f4f7f6;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;}
  .caja{background:white;padding:30px;border-radius:12px;box-shadow:0 5px 15px rgba(0,0,0,0.1);max-width:420px;font-size:1.05rem;color:#2c3e50;}
  a{color:#7c3aed;font-weight:700;}</style>
  </head><body><div class="caja">${mensaje}<br/><br/><a href="/index.html">Volver a la web</a></div></body></html>`;
}

app.post('/api/paypal/crear-orden', requiereSesion, async (req, res) => {
  try {
    // No dejamos pagar dos veces seguidas por error: si ya tiene un acceso
    // de pago vigente (no un trial, un pago ya activo), avisamos y no
    // creamos la orden. Si está en trial sí puede pagar (es su primer pago).
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios_web').select('fecha_inicio_trial, fecha_expiracion').eq('auth_user_id', req.userId).maybeSingle();
    if (!errorUsuario && usuario) {
      const acceso = tieneAccesoValido(usuario);
      if (acceso.acceso && acceso.motivo === 'pago') {
        return res.status(400).json({ error: 'Ya tienes un acceso de pago activo, no hace falta que pagues de nuevo.' });
      }
    }

    const orden = await crearOrdenPaypal(req.userId);
    if (!orden.approveUrl) return res.status(500).json({ error: 'PayPal no ha devuelto un link de pago válido.' });
    res.json(orden);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/pago-exito', async (req, res) => {
  const orderId = req.query.token;
  if (!orderId) return res.send(paginaSimple('Falta información del pago. Vuelve a la web e inténtalo de nuevo.'));

  const { data: pagoExistente } = await supabase.from('pagos_web').select('id').eq('order_id', orderId).maybeSingle();
  if (pagoExistente) return res.send(paginaSimple('Este pago ya se procesó anteriormente. Vuelve a la web, tu acceso ya debería estar activo.'));

  try {
    const resultado = await capturarOrdenPaypal(orderId);
    const estado = resultado.status;
    const captura = resultado.purchase_units && resultado.purchase_units[0] &&
      resultado.purchase_units[0].payments && resultado.purchase_units[0].payments.captures &&
      resultado.purchase_units[0].payments.captures[0];
    const customId = captura && captura.custom_id;
    const monto = captura && captura.amount && captura.amount.value;

    if (estado !== 'COMPLETED' || !customId) {
      console.error('Pago no completado en /pago-exito:', resultado);
      await supabase.from('pagos_web').insert({ order_id: orderId, auth_user_id: customId || null, monto: monto || '', estado: 'FALLIDO' });
      return res.send(paginaSimple('El pago no se ha podido confirmar. Si te han cobrado, contacta con soporte.'));
    }

    await supabase.from('pagos_web').insert({ order_id: orderId, auth_user_id: customId, monto: monto || PRECIO_EUROS, estado: 'COMPLETADO' });

    const expiracion = await activarAccesoPagado(customId);
    if (!expiracion) return res.send(paginaSimple('Pago recibido, pero hubo un error activando tu acceso. Contacta con soporte.'));

    const cuando = expiracion.toLocaleDateString('es-ES');
    return res.send(paginaSimple(`✅ ¡Pago recibido! Tu acceso está activo hasta el ${cuando}.`));
  } catch (e) {
    console.error('Error en /pago-exito:', e);
    return res.send(paginaSimple('Ha habido un error procesando tu pago. Contacta con soporte.'));
  }
});

app.get('/pago-cancelado', (req, res) => {
  res.send(paginaSimple('Pago cancelado. Puedes volver a la web e intentarlo de nuevo cuando quieras.'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));
