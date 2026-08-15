#!/usr/bin/env node
/*
 * Simulador del bot de WhatsApp.
 *
 *   npm run bot            conversación de ejemplo, de principio a fin
 *   npm run bot -- --chat  modo interactivo, escribes tú
 *
 * Usa datos en memoria: no toca Supabase ni WhatsApp. Sirve para afinar los
 * textos y el flujo antes de conectar nada.
 */
import { createInterface } from 'node:readline/promises';
import { procesarMensaje, estadoInicial, plata } from '../supabase/functions/wsp-bot/conversacion.js';

const NEGOCIO = { nombre: 'Araucanía Aventura', telefono: '+56951569704' };

const dia = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const TOURS = [
  {
    id: 't1', nombre: 'Volcán Villarrica', precio_persona: 95000, duracion_horas: 9,
    descripcion: 'Ascenso guiado a la cumbre con vista a los lagos.',
    punto_encuentro: 'Plaza de Pucón', incluye: ['guía', 'equipo', 'almuerzo'],
  },
  {
    id: 't2', nombre: 'Parque Huerquehue', precio_persona: 45000, duracion_horas: 6,
    descripcion: 'Caminata entre araucarias y lagos de montaña.',
    punto_encuentro: 'Plaza de Pucón', incluye: ['transporte', 'entrada', 'snack'],
  },
  {
    id: 't3', nombre: 'Termas de noche', precio_persona: 32000, duracion_horas: 4,
    descripcion: 'Termas naturales bajo las estrellas.',
    punto_encuentro: 'Terminal de Pucón', incluye: ['transporte', 'toalla'],
  },
];

const SALIDAS = [
  { id: 's1', tour_id: 't1', fecha: dia(2), hora: '06:00', cupos_totales: 8,  cupos_vendidos: 5 },
  { id: 's2', tour_id: 't1', fecha: dia(5), hora: '06:00', cupos_totales: 8,  cupos_vendidos: 1 },
  { id: 's3', tour_id: 't2', fecha: dia(1), hora: '09:00', cupos_totales: 12, cupos_vendidos: 10 },
  { id: 's4', tour_id: 't2', fecha: dia(3), hora: '09:00', cupos_totales: 12, cupos_vendidos: 2 },
  { id: 's5', tour_id: 't3', fecha: dia(1), hora: '19:00', cupos_totales: 10, cupos_vendidos: 4 },
];

const reservas = [];

const repo = {
  listarTours:   async () => TOURS,
  listarSalidas: async (tourId) => SALIDAS.filter(s => s.tour_id === tourId && s.cupos_vendidos < s.cupos_totales),
  obtenerSalida: async (id) => SALIDAS.find(s => s.id === id),
  crearReserva:  async ({ salida_id, num_personas, ...resto }) => {
    const s = SALIDAS.find(x => x.id === salida_id);
    if (!s || s.cupos_vendidos + num_personas > s.cupos_totales) return { ok: false, motivo: 'sin_cupos' };
    s.cupos_vendidos += num_personas;
    const r = { id: `r${reservas.length + 1}`, salida_id, num_personas, ...resto };
    reservas.push(r);
    return { ok: true, id: r.id };
  },
  generarLinkPago: async (id) => `https://flow.cl/pagar/${id}`,
};

// ── Presentación en terminal ────────────────────────────────────────────────
const gris  = (t) => `\x1b[90m${t}\x1b[0m`;
const verde = (t) => `\x1b[32m${t}\x1b[0m`;

const negrita = (t) => t.replace(/\*([^*]+)\*/g, '\x1b[1m$1\x1b[0m');

function pintarCliente(t) { console.log(`\n${gris('cliente ›')} ${t}`); }
function pintarBot(rs)     { rs.forEach(r => console.log(`${verde('bot     ›')} ${negrita(r).replace(/\n/g, '\n            ')}`)); }

// ── Bucle ───────────────────────────────────────────────────────────────────
let { estado, datos } = estadoInicial();

async function decir(texto) {
  pintarCliente(texto);
  const r = await procesarMensaje({ texto, estado, datos, repo, negocio: NEGOCIO });
  estado = r.estado;
  datos  = r.datos;
  pintarBot(r.respuestas);
}

const interactivo = process.argv.includes('--chat');

console.log(`\n\x1b[1m${NEGOCIO.nombre}\x1b[0m ${gris('· simulador del bot')}`);
console.log(gris('─'.repeat(64)));

if (interactivo) {
  console.log(gris('Escribe "hola" para empezar. Ctrl+C para salir.'));
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  for (;;) {
    const t = await rl.question('\n› ');
    if (!t.trim()) continue;
    const r = await procesarMensaje({ texto: t, estado, datos, repo, negocio: NEGOCIO });
    estado = r.estado; datos = r.datos;
    pintarBot(r.respuestas);
  }
} else {
  // Conversación de ejemplo, incluye equivocaciones a propósito
  const guion = [
    'hola',
    'el segundo',            // elige por número escrito en palabras
    '2',                     // salida
    'somos 4',               // cantidad en lenguaje natural
    'Ana',                   // nombre demasiado corto
    'Ana Salazar',
    'ana@',                  // correo inválido
    'ana@mail.cl',
    'si',
  ];
  for (const t of guion) await decir(t);

  console.log(gris('\n' + '─'.repeat(64)));
  console.log(`${reservas.length} reserva(s) creada(s):`);
  for (const r of reservas) {
    const s = SALIDAS.find(x => x.id === r.salida_id);
    const t = TOURS.find(x => x.id === s.tour_id);
    console.log(`  ${r.id} · ${t.nombre} · ${r.cliente_nombre} · ${r.num_personas} pax · ${plata(r.precio_persona * r.num_personas)}`);
    console.log(`       cupos de esa salida: ${s.cupos_vendidos}/${s.cupos_totales}`);
  }
  console.log('');
}
