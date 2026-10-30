// ============================================================
// Páginas públicas de "Exámenes TAI resueltos" (para Google).
//
// El servidor genera el HTML a partir de la materia EXÁMENES de Supabase,
// así que lo que se corrija en la base de datos se ve aquí solo.
// Google recibe la página ya pintada (sin depender de JavaScript).
//
//   /examenes-tai-resueltos                         → índice de convocatorias
//   /examen-tai-2025-resuelto                       → ingreso libre
//   /examen-tai-2024-promocion-interna-resuelto     → promoción interna
//
// Las explicaciones NO se muestran: siguen siendo contenido de la web.
// Se registra en server.js con:  require('./examenes-publicos')(app, supabase);
// ============================================================

const DOMINIO = 'https://tai-test.es';
const CACHE_MS = 6 * 60 * 60 * 1000; // 6 horas
const cache = new Map();

// Convocatorias publicadas. "prefijo" es el inicio del campo tema en Supabase.
const CONVOCATORIAS = [
  { anio: '2025', turno: 'IL', prefijo: '2025' },
  { anio: '2024', turno: 'IL', prefijo: '2024' },
  { anio: '2024', turno: 'PI', prefijo: '2024 PI' },
  { anio: '2022', turno: 'IL', prefijo: '2022' },
  { anio: '2022', turno: 'PI', prefijo: '2022 PI' },
  { anio: '2019', turno: 'IL', prefijo: '2019' },
  { anio: '2019', turno: 'PI', prefijo: '2019 PI' },
  { anio: '2018', turno: 'IL', prefijo: '2018 IL' },
  { anio: '2018', turno: 'PI', prefijo: '2018 PI' },
];

// ⚠️ Texto de la próxima convocatoria. Actualizarlo cuando salga la convocatoria en el BOE.
const PROXIMA = {
  etiqueta: 'TAI 2026-2027',
  aviso: 'La oferta de empleo público de 2026 (Real Decreto 387/2026, BOE de 7 de mayo de 2026) incluye 1.120 plazas de TAI: 1.000 de acceso libre y 120 de promoción interna. El examen de esta convocatoria será previsiblemente en 2027. Practicar con los exámenes reales de años anteriores es la mejor forma de saber qué preguntan y cómo.',
};
const AVISO = `<div class="exr-aviso">🗓️ <strong>Prepara la oposición ${PROXIMA.etiqueta}.</strong> ${PROXIMA.aviso}</div>`;

// Test gratis por bloque: 10 preguntas representativas (una por cada tema con más peso
// en el banco), revisadas a mano el 30/10/2026. Para cambiar una, cambiar su id aquí.
const BLOQUES = [
  { n: 1, nombre: 'Derecho', ruta: '/test-tai-bloque-1-derecho', ids: [11205, 10662, 11348, 12646, 10094, 11501, 10522, 11980, 10439, 12558] },
  { n: 2, nombre: 'Tecnología', ruta: '/test-tai-bloque-2-tecnologia', ids: [14107, 13791, 13720, 13512, 13333, 13118, 13405, 13282, 13891, 13747] },
  { n: 3, nombre: 'Desarrollo', ruta: '/test-tai-bloque-3-desarrollo', ids: [16321, 15399, 14896, 15644, 17003, 14682, 16034, 14368, 15701, 15239] },
  { n: 4, nombre: 'Sistemas y Comunicaciones', ruta: '/test-tai-bloque-4-sistemas', ids: [17591, 17195, 18829, 18970, 18703, 17684, 18516, 18121, 19469, 19295] },
];

// Imágenes de explicación revisadas A MANO para estas páginas públicas: solo se muestran
// si ilustran exactamente lo que pregunta la pregunta (regla de oro). Añadir aquí el id
// de la pregunta tras comprobarlo.
const IMAGENES_REVISADAS = new Set([14682]);

const nombreTurno = (t) => (t === 'PI' ? 'promoción interna' : 'ingreso libre');
const slug = (c) => `examen-tai-${c.anio}${c.turno === 'PI' ? '-promocion-interna' : ''}-resuelto`;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function parrafos(s) {
  return String(s || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}
function urlImagen(u) {
  if (!u) return '';
  if (/^(https?:|data:)/.test(u)) return u;
  return '/' + u.replace(/^\/+/, '');
}

function cabecera({ titulo, descripcion, ruta, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/jpeg" href="/img/og-buho.jpg" />
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}" />
<link rel="canonical" href="${DOMINIO}${ruta}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(titulo)}" />
<meta property="og:description" content="${esc(descripcion)}" />
<meta property="og:url" content="${DOMINIO}${ruta}" />
<meta property="og:image" content="${DOMINIO}/img/og-buho.jpg" />
${extraHead}
<link rel="stylesheet" href="/css/style.css" />
<style>
  .exr-cab{max-width:820px;margin:0 auto;padding:28px 20px 6px;text-align:center;}
  .exr-cab h1{font-size:1.6rem;margin:0 0 10px;}
  .exr-cab p{color:var(--texto-suave);line-height:1.6;margin:0 auto 8px;max-width:640px;}
  .exr-chip{display:inline-block;background:var(--verde-suave);color:var(--verde);font-weight:700;font-size:.8rem;padding:5px 14px;border-radius:999px;margin-bottom:12px;}
  .exr-aviso{max-width:780px;margin:14px auto 0;background:var(--morado-suave);color:var(--texto);border-radius:var(--radio);padding:12px 16px;line-height:1.55;font-size:.92rem;text-align:left;}
  .exr-cont{max-width:820px;margin:0 auto;padding:10px 20px 60px;}
  .exr-indice{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:12px 0 4px;}
  .exr-indice a{background:var(--morado-suave);color:var(--morado-osc);font-weight:700;font-size:.85rem;padding:6px 14px;border-radius:999px;text-decoration:none;}
  .exr-parte{margin-top:34px;}
  .exr-parte h2{font-size:1.3rem;border-bottom:2px solid var(--borde);padding-bottom:6px;}
  .exr-planteamiento{background:var(--tarjeta);border:1px solid var(--borde);border-radius:var(--radio);padding:4px 18px;margin:14px 0;}
  .exr-planteamiento summary{cursor:pointer;font-weight:700;padding:12px 0;}
  .exr-planteamiento p{line-height:1.6;}
  .exr-img{display:block;max-width:100%;height:auto;margin:12px auto;border:1px solid var(--borde);border-radius:8px;background:#fff;}
  .exr-preg{background:var(--tarjeta);border:1px solid var(--borde);border-radius:var(--radio);box-shadow:var(--sombra);padding:16px 18px;margin:14px 0;}
  .exr-preg h3{font-size:1rem;font-weight:700;line-height:1.5;margin:0 0 10px;}
  .exr-preg ol{list-style:none;padding:0;margin:0 0 10px;}
  .exr-preg li{padding:6px 0;line-height:1.5;}
  .exr-preg li b{display:inline-block;width:1.6em;color:var(--morado-osc);}
  .exr-preg details summary{cursor:pointer;color:var(--morado);font-weight:700;}
  .exr-sol{margin-top:8px;padding:10px 12px;background:var(--verde-suave);border-radius:8px;}
  .exr-anulada{display:inline-block;background:#fdecea;color:#b42318;font-weight:700;font-size:.78rem;padding:3px 10px;border-radius:999px;margin-bottom:8px;}
  .exr-cta{background:var(--tarjeta);border-radius:var(--radio);box-shadow:var(--sombra);border:1px solid var(--borde);padding:26px 22px;text-align:center;margin:26px 0;}
  .exr-cta h2{margin:0 0 10px;border:0;}
  .exr-cta p{color:var(--texto-suave);margin:0 0 18px;line-height:1.6;}
  .exr-lista{list-style:none;padding:0;}
  .exr-lista li{margin:10px 0;}
  .exr-lista a{display:block;background:var(--tarjeta);border:1px solid var(--borde);border-radius:var(--radio);padding:14px 18px;text-decoration:none;color:inherit;box-shadow:var(--sombra);}
  .exr-lista a strong{color:var(--morado-osc);}
  .exr-pie{text-align:center;font-size:.85rem;color:var(--texto-suave);margin-top:30px;}
  .exr-pie a{color:var(--morado);font-weight:700;}
</style>
</head>
<body>
  <div class="navbar">
    <div class="marca"><a href="/" style="display:flex;align-items:center;gap:8px;color:inherit;text-decoration:none;">
      <img src="/img/og-buho.jpg" alt="Oposición TAI" class="logo-buho" width="32" height="32" /> Oposición TAI</a>
    </div>
    <div class="usuario"><a href="/login.html"><button>Iniciar sesión</button></a></div>
  </div>`;
}

const CTA = `
  <div class="exr-cta">
    <h2>Prepara la oposición ${PROXIMA.etiqueta}</h2>
    <p>En <strong>tai-test.es</strong> puedes hacer este examen (y todos los de convocatorias anteriores) contestando y viendo tu nota al momento, además de más de 10.000 preguntas de los 4 bloques del temario. <strong>Prueba gratis 14 días</strong>.</p>
    <a class="btn btn-primario" href="/login.html">Crear mi cuenta gratis →</a>
  </div>`;

const PIE = `
  <p class="exr-pie">Preguntas y respuestas tomadas de los cuestionarios y plantillas oficiales publicados por el INAP.
  · <a href="/examenes-tai-resueltos">Todos los exámenes TAI resueltos</a> · <a href="/test-gratis-tai.html">Test gratis</a>
  <br>Test gratis por bloque: ${BLOQUES.map((b) => `<a href="${b.ruta}">Bloque ${b.n}: ${b.nombre}</a>`).join(' · ')}</p>`;

module.exports = function registrarExamenesPublicos(app, supabase) {
  async function preguntasDe(c) {
    const hit = cache.get(c.prefijo);
    if (hit && Date.now() - hit.t < CACHE_MS) return hit.v;
    const { data, error } = await supabase
      .from('preguntas')
      .select('id, tema, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, imagen_url, contexto')
      .eq('materia', 'EXÁMENES')
      .like('tema', `${c.prefijo} · %`)
      .order('id', { ascending: true })
      .limit(1000);
    if (error) throw error;
    cache.set(c.prefijo, { t: Date.now(), v: data || [] });
    return data || [];
  }

  function htmlConvocatoria(c, filas) {
    const titulo = `Examen TAI ${c.anio} resuelto (${nombreTurno(c.turno)}) · prepara ${PROXIMA.etiqueta}`;
    const descripcion = `Examen oficial de Técnico Auxiliar de Informática (TAI) de la convocatoria ${c.anio}, ${nombreTurno(c.turno)}: ${filas.length} preguntas con la respuesta correcta según la plantilla del INAP, incluidos los supuestos prácticos. Para preparar la oposición ${PROXIMA.etiqueta}.`;
    const ruta = '/' + slug(c);

    // Agrupar por parte, manteniendo el orden de la base de datos.
    const partes = [];
    for (const f of filas) {
      const nombre = f.tema.split(' · ').slice(1).join(' · ');
      let p = partes[partes.length - 1];
      if (!p || p.nombre !== nombre) { p = { nombre, filas: [] }; partes.push(p); }
      p.filas.push(f);
    }
    const anc = (n) => 'parte-' + n.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    let cuerpo = `
  <div class="exr-cab">
    <span class="exr-chip">📄 Examen oficial · respuestas de la plantilla del INAP</span>
    <h1>Examen TAI ${c.anio} resuelto · ${nombreTurno(c.turno)}</h1>
    <p>Preguntas del examen oficial de <strong>Técnico Auxiliar de Informática de la Administración del Estado</strong>, convocatoria ${c.anio} (${nombreTurno(c.turno)}). Pulsa «Ver respuesta» en cada pregunta para comprobar la opción correcta.</p>
    ${AVISO}
    <div class="exr-indice">${partes.map((p) => `<a href="#${anc(p.nombre)}">${esc(p.nombre)} (${p.filas.length})</a>`).join('')}</div>
  </div>
  <div class="exr-cont">`;

    partes.forEach((p, ip) => {
      cuerpo += `\n  <section class="exr-parte" id="${anc(p.nombre)}"><h2>${esc(p.nombre)}</h2>`;
      // Planteamiento del supuesto: el texto de contexto más largo de la parte.
      const ctx = p.filas.map((f) => f.contexto || '').sort((a, b) => b.length - a.length)[0];
      if (ctx) {
        cuerpo += `<details class="exr-planteamiento" open><summary>📄 Planteamiento del supuesto</summary>${parrafos(ctx)}</details>`;
      }
      let imgAnterior = null;
      for (const f of p.filas) {
        const anulada = /\(ANULADA por el tribunal\)/.test(f.pregunta);
        const enunciado = f.pregunta.replace(/\s*\(ANULADA por el tribunal\)\s*/, ' ');
        let img = '';
        if (f.imagen_url && f.imagen_url !== imgAnterior) {
          img = `<img class="exr-img" src="${esc(urlImagen(f.imagen_url))}" alt="Imagen del supuesto: ${esc(p.nombre)}, examen TAI ${c.anio}" loading="lazy" />`;
        }
        imgAnterior = f.imagen_url || imgAnterior;
        const letra = (f.respuesta_correcta || '').toLowerCase();
        const textoOk = f['opcion_' + letra];
        cuerpo += `
    <article class="exr-preg">${img}
      ${anulada ? '<span class="exr-anulada">Anulada por el tribunal</span>' : ''}
      <h3>${esc(enunciado)}</h3>
      <ol>${['a', 'b', 'c', 'd'].map((l) => `<li><b>${l})</b> ${esc(f['opcion_' + l])}</li>`).join('')}</ol>
      <details><summary>Ver respuesta</summary><div class="exr-sol">${anulada
        ? 'Pregunta <strong>anulada</strong> por el tribunal en la plantilla definitiva.'
        : `Respuesta correcta: <strong>${esc(letra)}) ${esc(textoOk)}</strong>`}</div></details>
    </article>`;
      }
      cuerpo += `\n  </section>`;
      if (ip === 0) cuerpo += CTA;
    });

    cuerpo += CTA + PIE + `\n  </div>\n</body>\n</html>`;

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Oposición TAI', item: DOMINIO + '/' },
        { '@type': 'ListItem', position: 2, name: 'Exámenes TAI resueltos', item: DOMINIO + '/examenes-tai-resueltos' },
        { '@type': 'ListItem', position: 3, name: `Examen TAI ${c.anio} (${nombreTurno(c.turno)})`, item: DOMINIO + ruta },
      ],
    };
    return cabecera({ titulo, descripcion, ruta, extraHead: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` }) + cuerpo;
  }

  function htmlIndice() {
    const titulo = `Exámenes TAI resueltos 2018–2025 · prepara la oposición ${PROXIMA.etiqueta}`;
    const descripcion = `Todos los exámenes oficiales de Técnico Auxiliar de Informática (TAI) de la AGE desde 2018, con la respuesta correcta de cada pregunta según las plantillas del INAP. Ingreso libre y promoción interna. Para preparar la oposición ${PROXIMA.etiqueta}.`;
    const ruta = '/examenes-tai-resueltos';
    const lista = CONVOCATORIAS.map((c) => `<li><a href="/${slug(c)}"><strong>Examen TAI ${c.anio} · ${nombreTurno(c.turno)}</strong><br><span>Primera parte y supuestos prácticos, con las respuestas oficiales.</span></a></li>`).join('');
    return cabecera({ titulo, descripcion, ruta }) + `
  <div class="exr-cab">
    <span class="exr-chip">📚 Convocatorias 2018 a 2025</span>
    <h1>Exámenes TAI resueltos</h1>
    <p>Exámenes oficiales de <strong>Técnico Auxiliar de Informática de la Administración del Estado</strong> con la respuesta correcta de cada pregunta, según las plantillas publicadas por el INAP. Elige convocatoria:</p>
    ${AVISO}
  </div>
  <div class="exr-cont">
    <ul class="exr-lista">${lista}</ul>
    <h2 style="text-align:center;margin-top:30px;">Test gratis por bloque</h2>
    <ul class="exr-lista">${BLOQUES.map((b) => `<li><a href="${b.ruta}"><strong>Test TAI Bloque ${b.n}: ${b.nombre}</strong><br><span>10 preguntas de los temas que más pesan, con solución y explicación.</span></a></li>`).join('')}</ul>
    ${CTA}${PIE}
  </div>
</body>
</html>`;
  }

  app.get('/examenes-tai-resueltos', (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(htmlIndice());
  });

  async function preguntasBloque(b) {
    const clave = 'bloque-' + b.n;
    const hit = cache.get(clave);
    if (hit && Date.now() - hit.t < CACHE_MS) return hit.v;
    const { data, error } = await supabase
      .from('preguntas')
      .select('id, tema, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, imagen_url')
      .in('id', b.ids);
    if (error) throw error;
    const orden = new Map(b.ids.map((id, i) => [id, i]));
    const v = (data || []).sort((x, y) => orden.get(x.id) - orden.get(y.id));
    cache.set(clave, { t: Date.now(), v });
    return v;
  }

  function htmlBloque(b, filas) {
    const titulo = `Test TAI Bloque ${b.n}: ${b.nombre} gratis · preguntas con solución · ${PROXIMA.etiqueta}`;
    const descripcion = `Test gratis del Bloque ${b.n} (${b.nombre}) de la oposición TAI: ${filas.length} preguntas de los temas que más pesan, con la respuesta correcta y su explicación. Sin registro. Para preparar la oposición ${PROXIMA.etiqueta}.`;
    let cuerpo = `
  <div class="exr-cab">
    <span class="exr-chip">✅ Gratis · sin registro · con explicaciones</span>
    <h1>Test TAI Bloque ${b.n}: ${esc(b.nombre)}</h1>
    <p>${filas.length} preguntas del <strong>Bloque ${b.n} (${esc(b.nombre)})</strong> de la oposición de Técnico Auxiliar de Informática, una por cada uno de los temas con más peso. Pulsa «Ver respuesta» para ver la solución y por qué.</p>
    ${AVISO}
    <div class="exr-indice">${BLOQUES.filter((o) => o.n !== b.n).map((o) => `<a href="${o.ruta}">Bloque ${o.n}: ${esc(o.nombre)}</a>`).join('')}</div>
  </div>
  <div class="exr-cont">`;
    filas.forEach((f, i) => {
      const letra = (f.respuesta_correcta || '').toLowerCase();
      const img = f.imagen_url && IMAGENES_REVISADAS.has(f.id)
        ? `<img class="exr-img" src="${esc(urlImagen(f.imagen_url))}" alt="Esquema explicativo: ${esc(f.tema)}" loading="lazy" />` : '';
      cuerpo += `
    <article class="exr-preg">
      <span class="exr-chip" style="background:var(--morado-suave);color:var(--morado-osc);margin-bottom:8px;">${esc(f.tema)}</span>
      <h3>${i + 1}. ${esc(f.pregunta)}</h3>
      <ol>${['a', 'b', 'c', 'd'].map((l) => `<li><b>${l})</b> ${esc(f['opcion_' + l])}</li>`).join('')}</ol>
      <details><summary>Ver respuesta</summary><div class="exr-sol">Respuesta correcta: <strong>${esc(letra)}) ${esc(f['opcion_' + letra])}</strong>${f.explicacion ? `<p style="margin:8px 0 0;">${esc(f.explicacion)}</p>` : ''}${img}</div></details>
    </article>`;
      if (i === 4) cuerpo += CTA;
    });
    cuerpo += CTA + PIE + `\n  </div>\n</body>\n</html>`;
    return cabecera({ titulo, descripcion, ruta: b.ruta }) + cuerpo;
  }

  BLOQUES.forEach((b) => {
    app.get(b.ruta, async (req, res) => {
      try {
        const filas = await preguntasBloque(b);
        if (!filas.length) return res.status(404).send('Test no disponible.');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(htmlBloque(b, filas));
      } catch (e) {
        console.error('Error generando el test del bloque', b.n, e);
        res.status(500).send('No se ha podido cargar el test. Inténtalo de nuevo en unos minutos.');
      }
    });
  });

  CONVOCATORIAS.forEach((c) => {
    app.get('/' + slug(c), async (req, res) => {
      try {
        const filas = await preguntasDe(c);
        if (!filas.length) return res.status(404).send('Examen no disponible.');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(htmlConvocatoria(c, filas));
      } catch (e) {
        console.error('Error generando la página de examen', c.prefijo, e);
        res.status(500).send('No se ha podido cargar el examen. Inténtalo de nuevo en unos minutos.');
      }
    });
  });
};

module.exports.CONVOCATORIAS = CONVOCATORIAS;
module.exports.slug = slug;
module.exports.BLOQUES = BLOQUES;
