-- Tours de un día y sus salidas.
--
-- La tabla `hostales` hace de tenant: cada fila es un negocio (hostal hoy,
-- agencia de tours ahora). Se mantiene el nombre para no romper las rutas
-- por slug ni el panel, que ya la usan en toda la app.
--
-- Diferencia clave con el alojamiento: un hostal se reserva por RANGO de
-- fechas y hay que comprobar solapamientos; un tour se vende por SALIDA
-- puntual y la disponibilidad es una resta de cupos.

-- ── Catálogo: lo que no cambia entre una salida y otra ──────────────────────
create table if not exists public.tours (
  id              uuid primary key default gen_random_uuid(),
  hostal_id       uuid not null references public.hostales(id) on delete cascade,
  nombre          text not null,
  descripcion     text,
  duracion_horas  numeric(4,1),
  precio_persona  integer not null check (precio_persona >= 0),
  punto_encuentro text,
  incluye         text[] default '{}',
  foto_url        text,
  orden           integer default 0,
  activo          boolean not null default true,
  creado_en       timestamptz not null default now()
);

create index if not exists tours_hostal_idx on public.tours (hostal_id) where activo;

-- ── Salidas: cada fecha concreta en que el tour se realiza ──────────────────
create table if not exists public.salidas (
  id             uuid primary key default gen_random_uuid(),
  tour_id        uuid not null references public.tours(id) on delete cascade,
  fecha          date not null,
  hora           time not null,
  cupos_totales  integer not null check (cupos_totales > 0),
  cupos_vendidos integer not null default 0 check (cupos_vendidos >= 0),
  estado         text not null default 'programada'
                 check (estado in ('programada', 'cerrada', 'cancelada')),
  creado_en      timestamptz not null default now(),

  -- No se puede vender más de lo que cabe
  constraint salidas_cupos_coherentes check (cupos_vendidos <= cupos_totales),
  -- Un tour no puede tener dos salidas a la misma fecha y hora
  constraint salidas_sin_duplicados unique (tour_id, fecha, hora)
);

create index if not exists salidas_proximas_idx
  on public.salidas (tour_id, fecha) where estado = 'programada';

-- ── Reservas de tour ────────────────────────────────────────────────────────
create table if not exists public.reservas_tour (
  id               uuid primary key default gen_random_uuid(),
  salida_id        uuid not null references public.salidas(id) on delete restrict,
  hostal_id        uuid not null references public.hostales(id) on delete cascade,
  cliente_nombre   text not null,
  cliente_telefono text,
  cliente_email    text,
  num_personas     integer not null check (num_personas > 0),
  precio_persona   integer not null,
  total            integer generated always as (precio_persona * num_personas) stored,
  estado           text not null default 'pendiente'
                   check (estado in ('pendiente', 'pagado', 'cancelado', 'completado')),
  canal            text not null default 'web' check (canal in ('web', 'whatsapp', 'manual')),
  notas            text,
  flow_token       text,
  flow_pago_id     text,
  creado_en        timestamptz not null default now()
);

create index if not exists reservas_tour_salida_idx on public.reservas_tour (salida_id);
create index if not exists reservas_tour_hostal_idx on public.reservas_tour (hostal_id, creado_en desc);
create index if not exists reservas_tour_flow_idx   on public.reservas_tour (flow_token);

-- ── Cupos disponibles de una salida ─────────────────────────────────────────
create or replace function public.cupos_disponibles(p_salida_id uuid)
returns integer
language sql
stable
as $$
  select greatest(0, s.cupos_totales - s.cupos_vendidos)
  from public.salidas s
  where s.id = p_salida_id and s.estado = 'programada';
$$;

-- ── Reservar cupos de forma atómica ─────────────────────────────────────────
-- Dos personas reservando los últimos cupos a la vez no pueden pasar ambas:
-- el UPDATE condicional bloquea la fila y solo una cumple la condición.
create or replace function public.reservar_cupos(
  p_salida_id uuid,
  p_personas  integer
)
returns boolean
language plpgsql
as $$
declare
  filas integer;
begin
  update public.salidas
     set cupos_vendidos = cupos_vendidos + p_personas
   where id = p_salida_id
     and estado = 'programada'
     and cupos_vendidos + p_personas <= cupos_totales;

  get diagnostics filas = row_count;
  return filas > 0;
end;
$$;

-- ── Memoria del bot de WhatsApp ─────────────────────────────────────────────
-- Guarda en qué paso va cada conversación. Sin esto el bot no recuerda nada
-- entre un mensaje y el siguiente.
create table if not exists public.wsp_conversaciones (
  telefono      text primary key,
  hostal_id     uuid references public.hostales(id) on delete cascade,
  estado        text not null default 'inicio',
  datos         jsonb not null default '{}',
  actualizado_en timestamptz not null default now()
);

comment on table public.tours              is 'Catálogo de tours de un día';
comment on table public.salidas            is 'Fecha y hora concretas en que se realiza un tour, con sus cupos';
comment on table public.reservas_tour      is 'Reservas de tours; canal indica si vino de web, WhatsApp o carga manual';
comment on table public.wsp_conversaciones is 'Estado de cada conversación del bot de WhatsApp, por número de teléfono';
