/*
 * Monedas y conversión, compartidas por la página del hostal y el formulario.
 * Antes cada componente tenía su propia tabla y la de la página pública ni
 * siquiera convertía: cambiaba la etiqueta y dejaba los precios en pesos.
 *
 * Las tasas son fijas y por tanto se desactualizan. Sirven para orientar al
 * huésped; el cobro siempre ocurre en CLP a través de la pasarela.
 */
export const MONEDAS = [
  { id: 'CLP', nombre: 'Peso chileno',    tasa: 1,       decimales: 0 },
  { id: 'USD', nombre: 'Dólar',           tasa: 0.00106, decimales: 2 },
  { id: 'EUR', nombre: 'Euro',            tasa: 0.00096, decimales: 2 },
  { id: 'BRL', nombre: 'Real brasileño',  tasa: 0.00526, decimales: 2 },
  { id: 'ARS', nombre: 'Peso argentino',  tasa: 1.12,    decimales: 0 },
  { id: 'MXN', nombre: 'Peso mexicano',   tasa: 0.019,   decimales: 0 },
];

export const monedaPorId = (id) => MONEDAS.find(m => m.id === id) || MONEDAS[0];

/** Formatea un monto en CLP mostrándolo en la moneda elegida. */
export function precio(montoCLP, monedaId = 'CLP') {
  const m = monedaPorId(monedaId);
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: m.id,
    maximumFractionDigits: m.decimales,
  }).format((montoCLP || 0) * m.tasa);
}
