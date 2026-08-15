#!/usr/bin/env node
/*
 * Pruebas del motor de conversación.  npm run bot:test
 * Cubre los caminos que la conversación de ejemplo no toca: el cliente que
 * no se hace entender, los cupos insuficientes y la carrera por el último lugar.
 */
import { procesarMensaje, estadoInicial, leerNumero } from '../supabase/functions/wsp-bot/conversacion.js';

const NEGOCIO = { nombre: 'Araucanía Aventura', telefono: '+56951569704' };
const dia = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

function nuevoRepo() {
  const tours   = [{ id: 't1', nombre: 'Huerquehue', precio_persona: 45000 }];
  const salidas = [{ id: 's1', tour_id: 't1', fecha: dia(3), hora: '09:00', cupos_totales: 5, cupos_vendidos: 3 }];
  return {
    salidas,
    listarTours:   async () => tours,
    listarSalidas: async (t) => salidas.filter(s => s.tour_id === t && s.cupos_vendidos < s.cupos_totales),
    obtenerSalida: async (id) => salidas.find(s => s.id === id),
    crearReserva:  async ({ salida_id, num_personas }) => {
      const s = salidas.find(x => x.id === salida_id);
      if (!s || s.cupos_vendidos + num_personas > s.cupos_totales) return { ok: false, motivo: 'sin_cupos' };
      s.cupos_vendidos += num_personas;
      return { ok: true, id: 'r1' };
    },
    generarLinkPago: async (id) => `https://flow.cl/pagar/${id}`,
  };
}

let fallos = 0;
const comprobar = (nombre, condicion, detalle = '') => {
  console.log(`  ${condicion ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nombre}`);
  if (!condicion) { fallos++; if (detalle) console.log(`      ${detalle}`); }
};

async function conversar(repo, mensajes) {
  let { estado, datos } = estadoInicial();
  let ultimas = [];
  for (const texto of mensajes) {
    const r = await procesarMensaje({ texto, estado, datos, repo, negocio: NEGOCIO });
    estado = r.estado; datos = r.datos; ultimas = r.respuestas;
  }
  return { estado, datos, texto: ultimas.join('\n') };
}

// ── 1. Lectura de números ───────────────────────────────────────────────────
console.log('\nInterpretación de respuestas');
comprobar('"2" → 2',            leerNumero('2') === 2);
comprobar('"dos" → 2',          leerNumero('dos') === 2);
comprobar('"el segundo" → 2',   leerNumero('el segundo') === 2);
comprobar('"somos 4" → 4',      leerNumero('somos 4') === 4);
comprobar('"la última" → total', leerNumero('la ultima', 3) === 3);
comprobar('"cualquiera" → null', leerNumero('cualquiera') === null);

// ── 2. Salida del bucle tras 3 intentos ─────────────────────────────────────
console.log('\nCliente que no se hace entender');
{
  const r = await conversar(nuevoRepo(), ['hola', 'qwe', 'asdf', 'zxcv']);
  comprobar('al tercer intento ofrece una persona', /persona/i.test(r.texto), r.texto);
  comprobar('no repite la lista otra vez', !/Huerquehue —/.test(r.texto));
}
{
  const r = await conversar(nuevoRepo(), ['hola', 'qwe', 'asdf', 'zxcv', 'persona']);
  comprobar('"persona" deriva al equipo', r.estado === 'derivado', r.estado);
}

// ── 3. Cupos ────────────────────────────────────────────────────────────────
console.log('\nCupos');
{
  const r = await conversar(nuevoRepo(), ['hola', '1', '1', '9']);
  comprobar('rechaza más personas que cupos', /quedan|solo me quedan/i.test(r.texto), r.texto);
  comprobar('se queda esperando el número', r.estado === 'eligiendo_personas', r.estado);
}
{
  const repo = nuevoRepo();
  const r = await conversar(repo, ['hola', '1', '1', '2', 'Ana Salazar', 'ana@mail.cl', 'si']);
  comprobar('reserva los 2 últimos cupos', r.estado === 'finalizado', r.estado);
  comprobar('descuenta los cupos', repo.salidas[0].cupos_vendidos === 5, `vendidos=${repo.salidas[0].cupos_vendidos}`);
}

// ── 4. Carrera: la salida se llena mientras el cliente conversa ─────────────
console.log('\nLa salida se llena durante la conversación');
{
  const repo = nuevoRepo();
  let { estado, datos } = estadoInicial();
  for (const texto of ['hola', '1', '1', '2', 'Ana Salazar', 'ana@mail.cl']) {
    const r = await procesarMensaje({ texto, estado, datos, repo, negocio: NEGOCIO });
    estado = r.estado; datos = r.datos;
  }
  // Otro cliente se lleva los cupos justo antes de confirmar
  repo.salidas[0].cupos_vendidos = 5;
  const r = await procesarMensaje({ texto: 'si', estado, datos, repo, negocio: NEGOCIO });
  const txt = r.respuestas.join('\n');
  comprobar('avisa que se llenó', /llenaron|llen/i.test(txt), txt);
  comprobar('no deja la reserva a medias', r.estado !== 'finalizado', r.estado);
  comprobar('no sobrevende', repo.salidas[0].cupos_vendidos === 5, `vendidos=${repo.salidas[0].cupos_vendidos}`);
}

// ── 5. Cancelar en cualquier momento ────────────────────────────────────────
console.log('\nComandos globales');
{
  const r = await conversar(nuevoRepo(), ['hola', '1', '1', '2', 'cancelar']);
  comprobar('"cancelar" vuelve al inicio', r.estado === 'inicio', r.estado);
}
{
  const repo = nuevoRepo();
  const r = await conversar(repo, ['hola', '1', '1', '2', 'Ana Salazar', 'ana@mail.cl', 'cancelar']);
  comprobar('cancelar antes de confirmar no descuenta cupos', repo.salidas[0].cupos_vendidos === 3, `vendidos=${repo.salidas[0].cupos_vendidos}`);
}

console.log(fallos ? `\n\x1b[31m${fallos} prueba(s) fallidas\x1b[0m\n` : '\n\x1b[32mTodas las pruebas pasan\x1b[0m\n');
process.exit(fallos ? 1 : 0);
