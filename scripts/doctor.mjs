#!/usr/bin/env node
/*
 * Diagnóstico de la conexión con Supabase.
 *   npm run doctor
 *
 * Comprueba credenciales, tablas, columnas, la RPC de disponibilidad y los
 * datos mínimos para que la app funcione. No escribe nada en la base y nunca
 * imprime la clave, así que el resultado se puede compartir sin riesgo.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const ok    = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const fail  = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const warn  = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
const info  = (m) => console.log(`    ${m}`);
const bloque = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

let errores = 0;
let avisos  = 0;
const malo  = (m) => { fail(m); errores++; };
const ojo   = (m) => { warn(m); avisos++; };

// ── Variables de entorno ─────────────────────────────────────────────────────
bloque('1. Credenciales');

const env = {};
for (const archivo of ['.env', '.env.local']) {
  if (!existsSync(archivo)) continue;
  for (const linea of readFileSync(archivo, 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  info(`leído ${archivo}`);
}

const URL  = process.env.VITE_SUPABASE_URL      || env.VITE_SUPABASE_URL;
const KEY  = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!URL) malo('falta VITE_SUPABASE_URL');
else      ok(`VITE_SUPABASE_URL = ${URL}`);

if (!KEY) malo('falta VITE_SUPABASE_ANON_KEY');
else      ok(`VITE_SUPABASE_ANON_KEY presente (${KEY.length} caracteres, no se muestra)`);

if (KEY && /service_role/.test(Buffer.from((KEY.split('.')[1] || ''), 'base64').toString('utf8'))) {
  malo('¡ESA ES LA SERVICE_ROLE KEY! Salta todos los permisos y no debe ir en el front. Usa la clave anon/publishable.');
}

if (!URL || !KEY) {
  console.log('\nSin credenciales no se puede seguir. Copia .env.example a .env y complétalo.\n');
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

// ── Conectividad ─────────────────────────────────────────────────────────────
bloque('2. Conexión');
{
  let error;
  try {
    ({ error } = await sb.from('hostales').select('id').limit(1));
  } catch (e) {
    error = e;
  }
  /* PostgREST responde con un `code` de Postgres ('42P01', '42501'...): eso
     significa que el servidor contestó, aunque sea para negar. Un error sin
     code es de red, y entonces no tiene sentido seguir probando nada más. */
  if (error && !error.code) {
    malo(`no se pudo conectar: ${error.message}`);
    if (/allowlist|egress/i.test(error.message)) {
      info('El bloqueo lo pone la red desde donde corres esto, no Supabase.');
    } else if (/fetch|ENOTFOUND|EAI_AGAIN|network/i.test(error.message)) {
      info('Si el proyecto estaba pausado, espera a que su estado sea "Healthy" y reintenta.');
      info('Supabase le quita el DNS a los proyectos pausados.');
    }
    console.log('');
    process.exit(1);
  }
  ok('el proyecto responde');
}

// ── Tablas ───────────────────────────────────────────────────────────────────
bloque('3. Tablas');
const tablas = ['hostales', 'habitaciones', 'reservas_hostal', 'bloqueos'];
for (const t of tablas) {
  const { error } = await sb.from(t).select('*').limit(1);
  if (!error) ok(t);
  else if (error.code === '42P01' || /does not exist/i.test(error.message)) malo(`${t} — no existe`);
  else if (error.code === '42501' || /permission|policy/i.test(error.message)) ojo(`${t} — existe pero RLS bloquea la lectura anónima`);
  else malo(`${t} — ${error.message}`);
}

// ── Columnas de reservas_hostal ──────────────────────────────────────────────
bloque('4. Columnas de reservas_hostal');
for (const [col, nota] of [
  ['total',        'el panel la usa para las métricas; si falta, las deriva del precio'],
  ['flow_token',   'la necesita la Edge Function de pagos'],
  ['flow_pago_id', 'la necesita la Edge Function de pagos'],
]) {
  const { error } = await sb.from('reservas_hostal').select(col).limit(1);
  if (!error) ok(col);
  else if (error.code === '42703' || /column/i.test(error.message)) ojo(`${col} — no existe · ${nota}`);
  else info(`${col} — no se pudo comprobar (${error.message})`);
}

// ── Datos ────────────────────────────────────────────────────────────────────
bloque('5. Datos');
const { data: hostales, error: eH } = await sb
  .from('hostales').select('id, tenant_id, nombre, activo, admin_email');

if (eH) {
  malo(`no se pudieron leer los hostales: ${eH.message}`);
} else if (!hostales?.length) {
  malo('no hay ningún hostal cargado — la app mostrará "No hay hostales disponibles"');
} else {
  ok(`${hostales.length} hostal(es)`);
  for (const h of hostales) {
    const activo = h.activo ? 'activo' : 'INACTIVO (no se mostrará)';
    if (!h.activo) avisos++;
    if (!h.tenant_id) { malo(`"${h.nombre}" no tiene tenant_id — su página pública es inalcanzable`); continue; }

    const { count } = await sb
      .from('habitaciones').select('id', { count: 'exact', head: true })
      .eq('hostal_id', h.id).eq('activa', true);

    info(`· ${h.nombre} — /${h.tenant_id} — ${activo} — ${count ?? 0} habitación(es) activa(s)`);
    if (!count) ojo(`  "${h.nombre}" no tiene habitaciones activas: no se podrá reservar`);
    if (!h.admin_email) ojo(`  "${h.nombre}" no tiene admin_email: el login del panel no lo encontrará`);
  }
}

// ── RPC de disponibilidad ────────────────────────────────────────────────────
bloque('6. RPC verificar_disponibilidad');
const { data: hab } = await sb.from('habitaciones').select('id').limit(1).maybeSingle();
if (!hab) {
  info('sin habitaciones para probarla');
} else {
  const hoy    = new Date();
  const manana = new Date(Date.now() + 86400000);
  const iso    = (d) => d.toISOString().slice(0, 10);
  const { data, error } = await sb.rpc('verificar_disponibilidad', {
    p_habitacion_id: hab.id, p_entrada: iso(hoy), p_salida: iso(manana),
  });
  if (error) malo(`falla: ${error.message}`);
  else if (typeof data !== 'boolean') ojo(`responde "${data}" en vez de true/false — la app espera un booleano`);
  else ok(`responde ${data} para hoy → mañana`);
}

// ── Resumen ──────────────────────────────────────────────────────────────────
bloque('Resumen');
if (errores) console.log(`  \x1b[31m${errores} problema(s)\x1b[0m que impiden que la app funcione` + (avisos ? `, y ${avisos} aviso(s)` : ''));
else if (avisos) console.log(`  \x1b[33mSin errores graves, ${avisos} aviso(s) a revisar\x1b[0m`);
else console.log('  \x1b[32mTodo correcto — la app debería funcionar\x1b[0m');

if (hostales?.length) {
  const h = hostales.find(x => x.activo && x.tenant_id) || hostales[0];
  if (h?.tenant_id) {
    console.log(`\n  Rutas para probar con "npm run dev":`);
    console.log(`    /                     landing`);
    console.log(`    /hostelia             vitrina`);
    console.log(`    /${h.tenant_id}${' '.repeat(Math.max(1, 21 - h.tenant_id.length))}página del hostal`);
    console.log(`    /${h.tenant_id}/admin/login${' '.repeat(Math.max(1, 9 - h.tenant_id.length))}panel`);
  }
}
console.log('');
process.exit(errores ? 1 : 0);
