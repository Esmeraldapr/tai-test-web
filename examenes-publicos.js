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
    <h2>Practica este examen con corrección automática</h2>
    <p>En <strong>tai-test.es</strong> puedes hacer este examen (y todos los de convocatorias anteriores) contestando y viendo tu nota al momento, además de más de 10.000 preguntas de los 4 bloques del temario. <strong>Prueba gratis 14 días</strong>.</p>
    <a class="btn btn-primario" href="/login.html">Crear mi cuenta gratis →</a>
  </div>`;

const PIE = `
  <p class="exr-pie">Preguntas y respuestas tomadas de los cuestionarios y plantillas oficiales publicados por el INAP.
  · <a href="/examenes-tai-resueltos">Todos los exámenes TAI resueltos</a> · <a href="/test-gratis-tai.html">Test gratis</a></p>`;

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
    const titulo = `Examen TAI ${c.anio} resuelto (${nombreTurno(c.turno)}) · preguntas y respuestas oficiales`;
    const descripcion = `Examen oficial de Técnico Auxiliar de Informática (TAI) de la convocatoria ${c.anio}, ${nombreTurno(c.turno)}: ${filas.length} preguntas con la respuesta correcta según la plantilla del INAP, incluidos los supuestos prácticos.`;
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
    const titulo = 'Exámenes TAI resueltos (2018–2025) · preguntas y respuestas oficiales';
    const descripcion = 'Todos los exámenes oficiales de Técnico Auxiliar de Informática (TAI) de la AGE desde 2018, con la respuesta correcta de cada pregunta según las plantillas del INAP. Ingreso libre y promoción interna.';
    const ruta = '/examenes-tai-resueltos';
    const lista = CONVOCATORIAS.map((c) => `<li><a href="/${slug(c)}"><strong>Examen TAI ${c.anio} · ${nombreTurno(c.turno)}</strong><br><span>Primera parte y supuestos prácticos, con las respuestas oficiales.</span></a></li>`).join('');
    return cabecera({ titulo, descripcion, ruta }) + `
  <div class="exr-cab">
    <span class="exr-chip">📚 Convocatorias 2018 a 2025</span>
    <h1>Exámenes TAI resueltos</h1>
    <p>Exámenes oficiales de <strong>Técnico Auxiliar de Informática de la Administración del Estado</strong> con la respuesta correcta de cada pregunta, según las plantillas publicadas por el INAP. Elige convocatoria:</p>
  </div>
  <div class="exr-cont">
    <ul class="exr-lista">${lista}</ul>
    ${CTA}${PIE}
  </div>
</body>
</html>`;
  }

  app.get('/examenes-tai-resueltos', (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(htmlIndice());
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
