-- Columnas que la Edge Function flow-payment necesita para seguir un pago.
-- Idempotente: se puede correr sobre una base que ya las tenga.

alter table public.reservas_hostal
  add column if not exists flow_token   text,
  add column if not exists flow_pago_id text;

-- El webhook de Flow busca la reserva por su token para confirmarla.
create index if not exists reservas_hostal_flow_token_idx
  on public.reservas_hostal (flow_token);

comment on column public.reservas_hostal.flow_token   is 'Token de la orden de pago en Flow.cl';
comment on column public.reservas_hostal.flow_pago_id is 'flowOrder devuelto por Flow al confirmarse el pago';
