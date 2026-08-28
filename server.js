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
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://tai-test-web.onrender.com';
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD || '';
const CRON_SECRET = process.env.CRON_SECRET || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const REMITENTE = process.env.REMITENTE || 'Oposición TAI <hola@tai-test.es>';

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

// Envío de correo desde la cuenta propia oposiciontaitest@gmail.com, con una
// "contraseña de aplicación" de Google (no la contraseña de la cuenta) vía SMTP.
// La misma cuenta está configurada como SMTP en Supabase para los correos de
// recuperación de contraseña. Si faltan las variables de entorno, el envío se
// salta sin tumbar el servidor.
let transporterCorreo = null;
if (EMAIL_USER && EMAIL_APP_PASSWORD) {
  transporterCorreo = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
  });
} else {
  console.error('EMAIL_USER / EMAIL_APP_PASSWORD no configurados: no se podran enviar correos.');
}

function urlBajaDe(tokenBaja) {
  return `${WEBAPP_URL}/baja?t=${tokenBaja}`;
}

/** Envío genérico. Devuelve true/false en vez de lanzar, para que un fallo con
 * una persona no corte el envío al resto de la lista.
 * Si se pasa tokenBaja, se añade la cabecera List-Unsubscribe: es la que hace
 * que Gmail enseñe su propio botón de "Cancelar suscripción" arriba del correo,
 * y ayuda bastante a que estos envíos no acaben en spam. */
async function enviarCorreo(destinatario, asunto, html, tokenBaja) {
  if (!transporterCorreo) {
    console.error('No se ha enviado el correo: falta configurar EMAIL_USER/EMAIL_APP_PASSWORD.');
    return false;
  }
  const opciones = {
    from: `"Oposición TAI" <${EMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html,
  };
  if (tokenBaja) {
    opciones.headers = {
      'List-Unsubscribe': `<${urlBajaDe(tokenBaja)}>, <mailto:${EMAIL_USER}?subject=baja>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }
  try {
    await transporterCorreo.sendMail(opciones);
    return true;
  } catch (e) {
    console.error('Error enviando correo a', destinatario, ':', e.message);
    return false;
  }
}

/** Manda el correo de vuelta a quien reportó una incidencia.
 * NOTA: esta función todavía no se llama desde ningún sitio — falta decidir
 * con la usuaria si la revisión que decide "corregido: true/false" es
 * automática o pasa antes por su aprobación. */
async function enviarCorreoIncidencia(destinatario, { mensajeOriginal, corregido, notas }) {
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
  return enviarCorreo(destinatario, asunto, cuerpo);
}

// ============================================================
// Secuencia de correos durante la prueba gratuita
// ============================================================

function boton(texto, ruta) {
  return `<p style="margin:22px 0"><a href="${WEBAPP_URL}/${ruta}" style="background:#7c3aed;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">${texto}</a></p>`;
}

function envoltorio(contenido, tokenBaja) {
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:560px">
    ${contenido}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:26px 0" />
    <p style="color:#6b7280;font-size:13px">Te escribimos porque tienes una cuenta en la web de Oposición TAI.<br/>
    <a href="${urlBajaDe(tokenBaja)}" style="color:#6b7280">Darme de baja de estos correos</a></p>
  </div>`;
}

/** Cada plantilla recibe la fila del usuario y devuelve { asunto, html }. */
const PLANTILLAS_TRIAL = {
  bienvenida: (u) => ({
    asunto: 'Ya tienes tus 14 días',
    html: envoltorio(`
      <p>¡Hola!</p>
      <p>Tu cuenta ya está activa. Tienes <strong>14 días completos y gratis</strong>, sin tarjeta y sin nada que cancelar después.</p>
      <p>Entra cuando quieras y empieza por donde te venga mejor.</p>
      ${boton('Entrar en la web', 'index.html')}
      <p>Dos cosas que conviene saber:</p>
      <ul>
        <li>Todo lo que falles se guarda en <strong>"Mis fallos"</strong>, para que puedas volver sobre ello. Es la sección que más rinde: una pregunta que fallas y no repasas, la vuelves a fallar en el examen.</li>
        <li>Si ves una pregunta mal, <strong>repórtala</strong> con el botón que hay en la propia pregunta.</li>
      </ul>
      <p>Cualquier duda, responde a este correo y te leo.</p>
      <p>Mucho ánimo,<br/>Oposición TAI</p>`, u.token_baja),
  }),

  dia7: (u) => ({
    asunto: 'Vas por la mitad de la prueba',
    html: envoltorio(`
      <p>¡Hola!</p>
      <p>Estás en el día 7 de tus 14. Buen momento para mirar atrás un segundo.</p>
      ${boton('Ver mi progreso', 'progreso.html')}
      <p>Ahí tienes tres números: los días seguidos que llevas practicando, cuántos tests has completado y tu porcentaje de acierto. El de la racha es el que más engaña: la constancia rinde más que las sesiones maratonianas de domingo.</p>
      <p>Si el porcentaje te parece bajo, es normal al principio y no significa nada todavía. Lo que importa es si sube.</p>
      <p>Y si esta semana has estudiado poco, tampoco pasa nada: te quedan 7 días y siguen siendo gratis.</p>
      <p>Oposición TAI</p>`, u.token_baja),
  }),

  final: (u) => {
    const fin = new Date(u.fecha_inicio_trial);
    fin.setDate(fin.getDate() + DIAS_TRIAL);
    const cuando = fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    return {
      asunto: `Tu prueba acaba el ${cuando}`,
      html: envoltorio(`
        <p>¡Hola!</p>
        <p>Tu prueba gratuita termina el <strong>${cuando}</strong>. Te aviso para que no te pille de sorpresa.</p>
        <p>Como no pedimos tarjeta, <strong>no se te va a cobrar nada de forma automática</strong>. El acceso simplemente queda en pausa hasta que decidas. Tu historial, tus fallos y tus favoritas se quedan guardados.</p>
        <p>Si quieres seguir, son <strong>${PRECIO_EUROS}€ cada ${DIAS_ACCESO_PAGADO} días</strong>, sin permanencia. Es lo que sostiene el mantenimiento de las preguntas y la actualización cuando cambia una ley.</p>
        ${boton(`Continuar por ${PRECIO_EUROS}€`, 'pago.html')}
        <p>Y si no es tu momento, de verdad que no pasa nada. Gracias por probarlo.</p>
        <p>Si decides quedarte o marcharte, me ayudarías mucho contándome en dos líneas qué te ha faltado. Responde a este correo y ya está.</p>
        <p>Mucha suerte con la oposición,<br/>Oposición TAI</p>`, u.token_baja),
    };
  },
};

// Días de prueba cumplidos a partir de los cuales toca cada correo.
// Solo tres en catorce días, a propósito: más cansa y la gente se da de baja.
const HITOS_TRIAL = [
  { tipo: 'bienvenida', dia: 0 },
  { tipo: 'dia7', dia: 7 },
  { tipo: 'final', dia: 14 },
];

/** Envía como mucho UN correo por persona y ejecución: el hito más avanzado
 * que le toque. Los hitos anteriores que se hubiera saltado se marcan como
 * enviados sin mandarlos, para que no le lleguen cuatro correos de golpe a
 * quien lleve ya doce días registrado.
 * Si se pasa soloEmail, solo se escribe a esa dirección: sirve para probar
 * la secuencia sin molestar a nadie más. */
async function procesarCorreosTrial(soloEmail, maximo = 5) {
  const resumen = { revisados: 0, enviados: 0, marcados: 0, fallidos: 0, destinatarios: [] };

  const { data: usuarios, error } = await supabase
    .from('usuarios_web')
    .select('auth_user_id, email, fecha_inicio_trial, fecha_expiracion, email_verificado, baja_correos, token_baja');
  if (error) {
    console.error('Error leyendo usuarios_web:', error);
    return { error: 'No se ha podido leer la lista de usuarios.' };
  }

  const { data: yaEnviados } = await supabase
    .from('correos_enviados_web')
    .select('auth_user_id, tipo');
  const enviadosSet = new Set((yaEnviados || []).map((c) => `${c.auth_user_id}|${c.tipo}`));

  const ahora = Date.now();

    for (const u of usuarios || []) {
    if (resumen.enviados >= maximo) { resumen.quedan_para_la_proxima = true; break; }
    if (soloEmail && u.email !== soloEmail) continue;
    // Fuera: sin correo, dado de baja, sin confirmar, sin trial arrancado, o
    // ya pagando (a quien ha pagado no se le manda la secuencia de la prueba).
    if (!u.email || u.baja_correos || !u.email_verificado || !u.fecha_inicio_trial) continue;
    if (u.fecha_expiracion && new Date(u.fecha_expiracion).getTime() > ahora) continue;

    resumen.revisados++;

    const dias = (ahora - new Date(u.fecha_inicio_trial).getTime()) / (1000 * 60 * 60 * 24);
    if (dias > DIAS_TRIAL + 1) continue; // margen de un día para que quepa el correo final

    const pendientes = HITOS_TRIAL
      .filter((h) => dias >= h.dia && !enviadosSet.has(`${u.auth_user_id}|${h.tipo}`));
    if (!pendientes.length) continue;

    const aEnviar = pendientes[pendientes.length - 1]; // el más avanzado
    const saltados = pendientes.slice(0, -1);

    for (const s of saltados) {
      await supabase.from('correos_enviados_web')
        .insert({ auth_user_id: u.auth_user_id, tipo: s.tipo });
      resumen.marcados++;
    }

    const { asunto, html } = PLANTILLAS_TRIAL[aEnviar.tipo](u);
    const ok = await enviarCorreo(u.email, asunto, html, u.token_baja);
    if (ok) {
      await supabase.from('correos_enviados_web')
        .insert({ auth_user_id: u.auth_user_id, tipo: aEnviar.tipo });
      resumen.enviados++;
      resumen.destinatarios.push(`${u.email} (${aEnviar.tipo})`);
    } else {
      resumen.fallidos++;
    }
  }

  return resumen;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.send('OK'));

/** Lo llama una tarea diaria de Supabase (pg_cron + pg_net).
 * La clave va en una cabecera y no en la URL, para que no acabe escrita en los
 * registros del servidor. Admitiendo {"solo":"correo@ejemplo.com"} en el cuerpo
 * se puede hacer una pasada de prueba a una sola dirección. */
app.post('/api/tareas/correos-trial', async (req, res) => {
  if (!CRON_SECRET) {
    return res.status(503).json({ error: 'CRON_SECRET no configurado en el servidor.' });
  }
  if (req.headers['x-cron-secret'] !== CRON_SECRET) {
    console.error('Intento de llamada a /api/tareas/correos-trial con clave incorrecta.');
    return res.status(401).json({ error: 'No autorizado.' });
  }
    const solo = req.body && req.body.solo ? String(req.body.solo).trim() : null;
  // Contestamos ya y enviamos por detrás: con 18 personas el envío tarda más
  // de un minuto y la llamada daría timeout antes de terminar.
  // Esperamos a terminar antes de contestar: en el plan gratuito de Render el
  // proceso se suspende en cuanto la peticion termina, asi que lo que se deje
  // "para despues" no llega a ejecutarse. Por eso van tandas cortas.
  const resumen = await procesarCorreosTrial(solo);
  console.log('Secuencia de correos de la prueba:', JSON.stringify(resumen));
  res.json(resumen);
});
// ---------------- Baja de los correos ----------------
// Dos pasos a propósito: el enlace del correo solo enseña una página de
// confirmación, y la baja se aplica al pulsar el botón. Si se diera de baja
// con solo abrir el enlace, los antivirus y escaneadores de correo que
// visitan los enlaces automáticamente darían de baja a gente sin querer.
app.get('/baja', async (req, res) => {
  const token = req.query.t;
  if (!token) return res.send(paginaSimple('Falta el código del enlace.'));

  const { data: usuario } = await supabase
    .from('usuarios_web').select('email, baja_correos').eq('token_baja', token).maybeSingle();

  if (!usuario) return res.send(paginaSimple('Este enlace no es válido.'));
  if (usuario.baja_correos) {
    return res.send(paginaSimple('Ya estabas dado de baja. No te enviaremos más correos.'));
  }

  res.send(paginaSimple(`
    <p>¿Quieres dejar de recibir los correos de Oposición TAI?</p>
    <p style="font-size:0.9rem;color:#6b7280">Tu cuenta y tu acceso a la web no se tocan, solo dejamos de escribirte.</p>
    <form method="POST" action="/baja">
      <input type="hidden" name="t" value="${token}" />
      <button type="submit" style="background:#7c3aed;color:#fff;border:none;padding:12px 22px;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer">Sí, darme de baja</button>
    </form>`));
});

app.post('/baja', async (req, res) => {
  const token = req.body && req.body.t;
  if (!token) return res.send(paginaSimple('Falta el código del enlace.'));

  const { data, error } = await supabase
    .from('usuarios_web').update({ baja_correos: true }).eq('token_baja', token).select('email');

  if (error || !data || !data.length) {
    console.error('Error dando de baja:', error);
    return res.send(paginaSimple('No se ha podido completar la baja. Escríbenos y lo hacemos a mano.'));
  }
  res.send(paginaSimple('✅ Hecho. No volveremos a escribirte. Tu cuenta sigue igual.'));
});

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
  <style>body{font-family:sans-serif;background:#f4f7f6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center;}
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
