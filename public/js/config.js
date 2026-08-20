// ============================================================
// Configuración de conexión a Supabase — proyecto "TAI"
// (mismo proyecto que usa el bot de Telegram, id gwzzsvehzllizxdxdzhv)
// ============================================================
const SUPABASE_URL = "https://gwzzsvehzllizxdxdzhv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3enpzdmVoemxsaXp4ZHhkemh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMjI3OTIsImV4cCI6MjEwMDg5ODc5Mn0.dpeqKeIj_VDeNXz-IdahLOQzTcJ8avAe5UodMM0H-NA";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Deben coincidir con lo que usa el backend (server.js) al cobrar de verdad.
const PRECIO_EUROS = "2.50";
const DIAS_ACCESO_PAGADO = 30;
const HORAS_TRIAL = 48;
