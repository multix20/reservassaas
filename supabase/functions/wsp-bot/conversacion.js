/*
 * Motor de la conversación del bot de reservas.
 *
 * Es lógica pura: no sabe nada de WhatsApp ni de Supabase. Recibe el estado
 * actual, el mensaje del cliente y un `repo` con los accesos a datos, y
 * devuelve el estado nuevo más lo que hay que responder. Así el mismo motor
 * corre en el webhook de producción y en el simulador de terminal, y se puede
 * probar sin levantar nada.
 *
 * Se escribe en JavaScript a propósito: Deno y Node lo importan igual.
 */

// ── Utilidades de formato ───────────────────────────────────────────────────
export const plata = (n) => '$' + Number(n || 0).toLocaleString('es-CL');

const DIAS  = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function fechaLarga(iso) {
  const d = new Date(iso + 'T12:00:00');
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

const hora = (h) => (h || '').slice(0, 5);

// ── Interpretación de lo que escribe el cliente ─────────────────────────────
const limpiar = (t) => (t || '').trim().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '');   // quita tildes

const PALABRAS_NUMERO = {
  // cardinales
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  // ordinales — la gente responde "el segundo" tanto como "2"
  primer: 1, primero: 1, primera: 1,
  segundo: 2, segunda: 2,
  tercer: 3, tercero: 3, tercera: 3,
  cuarto: 4, cuarta: 4,
  quinto: 5, quinta: 5,
  sexto: 6, sexta: 6,
  septimo: 7, septima: 7,
  octavo: 8, octava: 8,
  noveno: 9, novena: 9,
  decimo: 10, decima: 10,
};

/* Devuelve el número que el cliente quiso decir, o null.
   Acepta "2", "dos", "somos 4", "la 1", "el segundo", "opción 3".
   `total` permite resolver "el último". */
export function leerNumero(texto, total) {
  const t = limpiar(texto);
  const digito = t.match(/\d+/);
  if (digito) return parseInt(digito[0], 10);
  if (total && /\b(ultimo|ultima)\b/.test(t)) return total;
  for (const [palabra, n] of Object.entries(PALABRAS_NUMERO)) {
    if (new RegExp(`\\b${palabra}\\b`).test(t)) return n;
  }
  return null;
}

const esSaludo   = (t) => /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|menu|inicio|empezar)\b/.test(limpiar(t));
const esCancelar = (t) => /^(cancelar|salir|chao|adios|nada|olvidalo)\b/.test(limpiar(t));
const esAyuda    = (t) => /^(ayuda|help|no entiendo|\?)\b/.test(limpiar(t));
const esVolver   = (t) => /^(volver|atras|anterior)\b/.test(limpiar(t));
const esSi       = (t) => /^(si|s|dale|ya|confirmo|confirmar|correcto|listo|ok|okey|bueno|perfecto)\b/.test(limpiar(t));
const esNo       = (t) => /^(no|n|nop|todavia no|aun no)\b/.test(limpiar(t));
const esPersona  = (t) => /\b(persona|humano|asesor|alguien|operador|hablar con)\b/.test(limpiar(t));

const emailValido = (t) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((t || '').trim());

// ── Textos reutilizados ─────────────────────────────────────────────────────
const AYUDA = 'Escribe *menú* para empezar de nuevo o *cancelar* para salir. ' +
              'Si prefieres hablar con una persona, dilo y te derivo.';

const listarTours = (tours) => tours
  .map((t, i) => `*${i + 1}.* ${t.nombre} — ${plata(t.precio_persona)} por persona`)
  .join('\n');

const listarSalidas = (salidas) => salidas
  .map((s, i) => {
    const libres = s.cupos_totales - s.cupos_vendidos;
    const aviso  = libres <= 3 ? `  ⚠️ quedan ${libres}` : `  ${libres} cupos`;
    return `*${i + 1}.* ${fechaLarga(s.fecha)} · ${hora(s.hora)}${aviso}`;
  })
  .join('\n');

// ── Estado inicial ──────────────────────────────────────────────────────────
export const estadoInicial = () => ({ estado: 'inicio', datos: {} });

/*
 * Procesa un mensaje.
 *
 * @param {string}  texto    lo que escribió el cliente
 * @param {string}  estado   paso actual de la conversación
 * @param {object}  datos    lo acumulado hasta ahora
 * @param {object}  repo     accesos a datos (ver simulador para el contrato)
 * @param {object}  negocio  { nombre, telefono }
 * @returns {{ estado, datos, respuestas: string[] }}
 */
export async function procesarMensaje({ texto, estado, datos, repo, negocio }) {
  /* Cada respuesta entendida reinicia el contador de intentos fallidos. */
  const responder = (nuevoEstado, nuevosDatos, ...respuestas) => ({
    estado: nuevoEstado,
    datos: { ...nuevosDatos, _intentos: 0 },
    respuestas: respuestas.filter(Boolean),
  });

  /* Para cuando no entendimos al cliente. Repetir el mismo mensaje para
     siempre es la peor experiencia posible en un bot, así que al tercer
     intento se ofrece derivar a una persona. */
  const noEntendi = (mismoEstado, ...respuestas) => {
    const intentos = (datos._intentos || 0) + 1;
    if (intentos >= 3) {
      return {
        estado: mismoEstado,
        datos: { ...datos, _intentos: 0 },
        respuestas: [
          'Parece que no nos estamos entendiendo, y no quiero hacerte perder el tiempo. 😅',
          'Escribe *persona* y te contacta alguien del equipo, o *menú* para empezar de nuevo.',
        ],
      };
    }
    return { estado: mismoEstado, datos: { ...datos, _intentos: intentos }, respuestas: respuestas.filter(Boolean) };
  };

  // ── Comandos que valen en cualquier momento ──
  if (esCancelar(texto)) {
    return responder('inicio', {},
      'Listo, cancelé la reserva. Cuando quieras retomamos — escribe *hola*. 👋');
  }
  if (esPersona(texto)) {
    return responder('derivado', datos,
      'Listo, aviso al equipo para que te escriba por acá. 🙋',
      'Mientras tanto puedes escribir *menú* si prefieres seguir por tu cuenta.');
  }
  if (esAyuda(texto)) {
    return responder(estado, datos, AYUDA);
  }
  if (esSaludo(texto) && estado !== 'inicio') {
    estado = 'inicio';
    datos = {};
  }

  switch (estado) {

    // ── Saludo y catálogo ──
    case 'inicio': {
      const tours = await repo.listarTours();
      if (!tours.length) {
        return responder('inicio', {},
          `¡Hola! Soy el asistente de *${negocio.nombre}*.`,
          'Justo ahora no tengo tours publicados. Escríbenos directamente y te contamos. 🙏');
      }
      return responder('eligiendo_tour', {},
        `¡Hola! 👋 Soy el asistente de *${negocio.nombre}*.`,
        `Estos son nuestros tours:\n\n${listarTours(tours)}\n\n¿Cuál te interesa? Responde con el número.`);
    }

    // ── Elección de tour ──
    case 'eligiendo_tour': {
      const tours = await repo.listarTours();
      const n = leerNumero(texto, tours.length);
      const porNombre = tours.find(t => limpiar(t.nombre).includes(limpiar(texto)) && limpiar(texto).length > 3);
      const tour = (n && n >= 1 && n <= tours.length) ? tours[n - 1] : porNombre;

      if (!tour) {
        return noEntendi('eligiendo_tour',
          `No te entendí. Responde con el número del tour:\n\n${listarTours(tours)}`);
      }

      const salidas = await repo.listarSalidas(tour.id);
      const detalle = [
        `*${tour.nombre}*`,
        tour.descripcion,
        tour.duracion_horas ? `⏱️ Dura ${tour.duracion_horas} horas` : null,
        tour.punto_encuentro ? `📍 Salimos de ${tour.punto_encuentro}` : null,
        tour.incluye?.length ? `✅ Incluye: ${tour.incluye.join(', ')}` : null,
        `💰 ${plata(tour.precio_persona)} por persona`,
      ].filter(Boolean).join('\n');

      if (!salidas.length) {
        return responder('inicio', {},
          detalle,
          'Por ahora no tengo fechas programadas para ese tour. Escríbenos y lo coordinamos. 🙏');
      }

      return responder('eligiendo_salida', { ...datos, tour },
        detalle,
        `Estas son las próximas salidas:\n\n${listarSalidas(salidas)}\n\n¿Cuál te acomoda?`);
    }

    // ── Elección de salida ──
    case 'eligiendo_salida': {
      const salidas = await repo.listarSalidas(datos.tour.id);
      const n = leerNumero(texto, salidas.length);
      const salida = (n && n >= 1 && n <= salidas.length) ? salidas[n - 1] : null;

      if (!salida) {
        return noEntendi('eligiendo_salida',
          `Responde con el número de la salida:\n\n${listarSalidas(salidas)}`);
      }

      const libres = salida.cupos_totales - salida.cupos_vendidos;
      return responder('eligiendo_personas', { ...datos, salida },
        `${fechaLarga(salida.fecha)} a las ${hora(salida.hora)}. 📅`,
        `¿Para cuántas personas? Quedan *${libres}* cupos.`);
    }

    // ── Cantidad de personas ──
    case 'eligiendo_personas': {
      if (esVolver(texto)) {
        const salidas = await repo.listarSalidas(datos.tour.id);
        return responder('eligiendo_salida', { ...datos, salida: undefined },
          `Estas son las salidas:\n\n${listarSalidas(salidas)}`);
      }

      const personas = leerNumero(texto);
      // Se relee la salida: los cupos pueden haber cambiado mientras conversábamos
      const salida = await repo.obtenerSalida(datos.salida.id);
      const libres = salida ? salida.cupos_totales - salida.cupos_vendidos : 0;

      if (!personas || personas < 1) {
        return noEntendi('eligiendo_personas', 'Dime un número, por ejemplo *2*.');
      }
      if (libres === 0) {
        const salidas = await repo.listarSalidas(datos.tour.id);
        return responder('eligiendo_salida', { ...datos, salida: undefined },
          'Se acaba de llenar esa salida. 😕',
          salidas.length ? `Te quedan estas:\n\n${listarSalidas(salidas)}` : 'No me quedan otras fechas por ahora.');
      }
      if (personas > libres) {
        return noEntendi('eligiendo_personas',
          `Solo me quedan *${libres}* cupos para esa salida. ¿Te sirve para ${libres} o prefieres otra fecha? (escribe *volver*)`);
      }

      const total = datos.tour.precio_persona * personas;
      return responder('pidiendo_nombre', { ...datos, personas, total, salida },
        `${personas} ${personas === 1 ? 'persona' : 'personas'} · *${plata(total)}* en total.`,
        '¿A nombre de quién hago la reserva?');
    }

    // ── Nombre ──
    case 'pidiendo_nombre': {
      const nombre = (texto || '').trim();
      if (nombre.length < 3) {
        return noEntendi('pidiendo_nombre', 'Necesito al menos tu nombre para anotar la reserva.');
      }
      return responder('pidiendo_email', { ...datos, nombre },
        `Gracias, ${nombre.split(' ')[0]}. 🙌`,
        '¿A qué correo te envío la confirmación?');
    }

    // ── Email ──
    case 'pidiendo_email': {
      const email = (texto || '').trim();
      if (!emailValido(email)) {
        return noEntendi('pidiendo_email',
          'Ese correo no me parece válido. ¿Me lo escribes de nuevo?');
      }

      const { tour, salida, personas, total, nombre } = datos;
      const resumen = [
        '📋 *Resumen de tu reserva*',
        '',
        `🎒 ${tour.nombre}`,
        `📅 ${fechaLarga(salida.fecha)} · ${hora(salida.hora)}`,
        `👥 ${personas} ${personas === 1 ? 'persona' : 'personas'}`,
        `👤 ${nombre}`,
        `📧 ${email}`,
        '',
        `💰 Total: *${plata(total)}*`,
      ].join('\n');

      return responder('confirmando', { ...datos, email },
        resumen,
        '¿Confirmo? Responde *sí* y te paso el link de pago.');
    }

    // ── Confirmación y pago ──
    case 'confirmando': {
      if (esNo(texto)) {
        return responder('inicio', {},
          'Sin problema, no reservé nada. Escribe *hola* cuando quieras retomar. 👋');
      }
      if (!esSi(texto)) {
        return noEntendi('confirmando', 'Responde *sí* para confirmar o *cancelar* para dejarlo.');
      }

      const reserva = await repo.crearReserva({
        salida_id: datos.salida.id,
        cliente_nombre: datos.nombre,
        cliente_email: datos.email,
        num_personas: datos.personas,
        precio_persona: datos.tour.precio_persona,
      });

      if (!reserva?.ok) {
        const salidas = await repo.listarSalidas(datos.tour.id);
        return responder('eligiendo_salida', { ...datos, salida: undefined },
          reserva?.motivo === 'sin_cupos'
            ? 'Justo se llenaron los cupos mientras confirmábamos. 😞'
            : 'Tuve un problema al guardar la reserva. 😞',
          salidas.length ? `¿Te sirve otra fecha?\n\n${listarSalidas(salidas)}` : 'Escríbenos y lo resolvemos.');
      }

      const link = await repo.generarLinkPago(reserva.id, datos.total, datos.email, datos.tour.nombre);

      return responder('finalizado', { ...datos, reserva_id: reserva.id },
        '¡Listo! Guardé tu reserva. ✅',
        link
          ? `Para dejarla confirmada, paga aquí:\n${link}\n\nTu cupo queda tomado por 30 minutos.`
          : 'Te contactamos en breve para coordinar el pago.',
        `Cualquier duda escríbenos. ¡Nos vemos! 🎒`);
    }

    // ── Después de reservar ──
    case 'finalizado': {
      return responder('finalizado', datos,
        'Tu reserva ya está tomada. ✅',
        'Si quieres reservar otro tour escribe *hola*, o dinos si necesitas cambiar algo.');
    }

    default:
      return responder('inicio', {}, AYUDA);
  }
}
