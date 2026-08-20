# Web TAI

Versión web (no Telegram) del test de la oposición TAI. Mismo contenido y misma base de datos Supabase que el bot [@OposicionTAI_bot](https://github.com/Esmeraldapr/bot-tai), con login propio (Supabase Auth) en vez de Telegram.

## Arquitectura

- **Frontend** (`public/`): páginas HTML estáticas + JS que hablan directamente con Supabase (login, listar materias/temas, hacer el test, guardar resultados, reportar preguntas con fallo). Sin backend de por medio para nada de esto — todo protegido con políticas de Row Level Security en la base de datos.
- **Backend mínimo** (`server.js`): un Express pequeño que SOLO existe para la parte de pago con PayPal, porque las credenciales secretas de PayPal no pueden vivir en el navegador. Sirve además los archivos estáticos de `public/`.

## Variables de entorno

Ver `.env.example`. En Render hay que configurar:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (la service_role, no la anon — Ajustes → API en Supabase)
- `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` (mismas credenciales Live que usa `bot-tai`)
- `PRECIO_EUROS`, `WEBAPP_URL`

## Desarrollo local

```bash
npm install
cp .env.example .env   # y rellenar los valores
npm start
```

## Base de datos

Proyecto Supabase "TAI" (`gwzzsvehzllizxdxdzhv`), compartido con el bot. Las tablas propias de la web (`usuarios_web`, `resultados_web`, `incidencias_web`, `pagos_web`, `revision_contenido`) y las políticas RLS se gestionan por migraciones en Supabase (no están en este repo todavía).
