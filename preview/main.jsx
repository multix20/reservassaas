import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HostalPublico from '../src/components/HostalPublico';
import FormularioReserva from '../src/components/FormularioReserva';
import Confirmacion from '../src/components/Confirmacion';
import '../src/index.css';

/* Vista previa autocontenida: no hay Supabase detrás, así que se
   responden las consultas con datos de ejemplo desde el propio navegador. */
const HOSTAL = {
  id: 'h1', tenant_id: 'demo', nombre: 'Hostal Kütral', ciudad: 'Pucón, Chile',
  direccion: 'Camino Volcán 1420', telefono: '+56951569704',
  descripcion: 'Casa de montaña a diez minutos del centro. Cocina abierta, fogón encendido todas las noches y vista directa al Villarrica.',
  activo: true,
};

const HABS = [
  { id: 'r1', hostal_id: 'h1', nombre: 'Camarote compartido', descripcion: 'Seis camas en madera, casilleros con llave y baño compartido.', capacidad: 6, precio_noche: 14000, activa: true },
  { id: 'r2', hostal_id: 'h1', nombre: 'Doble privada',        descripcion: 'Cama matrimonial, baño propio y escritorio junto a la ventana.',  capacidad: 2, precio_noche: 38000, activa: true },
  { id: 'r3', hostal_id: 'h1', nombre: 'Premium vista volcán', descripcion: 'Ventanal completo al Villarrica, calefacción central y terraza.',  capacidad: 2, precio_noche: 56000, activa: true },
  { id: 'r4', hostal_id: 'h1', nombre: 'Cabaña familiar',      descripcion: 'Dos ambientes, cocina propia y living con estufa a leña.',        capacidad: 5, precio_noche: 72000, activa: true },
];

const original = window.fetch.bind(window);
window.fetch = async (entrada, opciones = {}) => {
  const url = typeof entrada === 'string' ? entrada : entrada.url;
  if (!url.includes('demo.supabase.co')) return original(entrada, opciones);

  /* `.single()` no cambia la URL: se distingue por la cabecera Accept, que
     llega como objeto plano o como Headers según cómo se haga la llamada. */
  const cabeceras = opciones.headers;
  let accept = '';
  if (cabeceras instanceof Headers) accept = cabeceras.get('accept') || '';
  else if (cabeceras) accept = cabeceras.accept || cabeceras.Accept || '';
  if (!accept && typeof entrada !== 'string') accept = entrada.headers?.get('accept') || '';
  const unico = accept.includes('pgrst.object');
  const json  = (cuerpo) => new Response(JSON.stringify(cuerpo), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });

  if (url.includes('verificar_disponibilidad')) {
    const cuerpo = opciones.body ? JSON.parse(opciones.body) : {};
    return json(cuerpo.p_habitacion_id !== 'r3');       // r3 sale agotada
  }
  if (url.includes('/hostales'))        return json(unico ? HOSTAL : [HOSTAL]);
  if (url.includes('/habitaciones'))    return json(HABS);
  if (url.includes('/reservas_hostal')) return json(unico ? {} : []);
  return json([]);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <MemoryRouter initialEntries={['/demo']}>
    <Routes>
      <Route path="/:slug"                         element={<HostalPublico />} />
      <Route path="/:slug/reservar/:habitacion_id" element={<FormularioReserva />} />
      <Route path="/:slug/confirmacion"            element={<Confirmacion />} />
    </Routes>
  </MemoryRouter>
);
