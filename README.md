# 🏠 ReservasSaaS

Plataforma multi-tenant de reservas en línea para hostales y hospedajes.

> Cada hostal tiene su propia página de reservas con su marca, su panel de
> administración y sus pagos — sin comisión por reserva. La vitrina comercial
> del producto se llama **Hostelia**.

---

## 🏗️ Arquitectura

```
├── Frontend        React 18 + Vite 5
├── Router          React Router 7
├── Base de datos   Supabase (PostgreSQL)
├── Auth            Supabase Auth (email/password)
├── Pagos           Flow.cl (Edge Function en Deno)
└── Deploy          Netlify
```

## 🗺️ Rutas

| Ruta | Vista |
|---|---|
| `/` | Landing del hostal principal |
| `/hostelia` | Vitrina comercial del SaaS |
| `/:slug` | Página pública del hostal — búsqueda y habitaciones |
| `/:slug/reservar/:habitacion_id` | Formulario de reserva (2 pasos) |
| `/:slug/confirmacion` | Confirmación de la reserva |
| `/:slug/admin/login` | Login del panel, con marca del hostal |
| `/:slug/admin` | Panel de administración |

El `:slug` corresponde a `hostales.tenant_id`. Las rutas estáticas se declaran
antes que las dinámicas para que `/:slug` no las capture.

## 🗄️ Base de datos

```sql
hostales        — id, tenant_id, nombre, ciudad, direccion, telefono,
                  descripcion, admin_email, activo
habitaciones    — id, hostal_id, nombre, descripcion, capacidad,
                  precio_noche, activa
reservas_hostal — id, hostal_id, habitacion_id, huesped_nombre, huesped_email,
                  huesped_telefono, fecha_entrada, fecha_salida,
                  precio_por_noche, num_huespedes, notas, estado,
                  flow_token, flow_pago_id
bloqueos        — id, hostal_id, habitacion_id, fecha_inicio, fecha_fin, motivo
```

**Estados de reserva:** `pendiente` · `pagado` · `cancelado` · `completado`

**RPC:** `verificar_disponibilidad(p_habitacion_id, p_entrada, p_salida)` →
`boolean`. Se consulta al listar habitaciones, al cambiar fechas en el
formulario y otra vez justo antes de insertar, para evitar sobreventa.

## ✨ Funcionalidades

### Reserva pública
- Búsqueda por rango de fechas con calendario a pantalla completa
- Disponibilidad en vivo por habitación
- Dos tarifas: Flexible y No reembolsable (−15%)
- Selector de idioma y moneda
- Anticipo del 30% al reservar, resto al check-in

### Panel de administración
- Métricas: ingresos del mes, por confirmar, check-ins de hoy
- Gráfico de reservas de las últimas 6 semanas
- Filtros: hoy / próximas / todas
- Cambio de estado, contacto por WhatsApp y eliminación de reservas
- Reserva manual y bloqueo de fechas por habitación

---

## 🚀 Instalación local

```bash
git clone https://github.com/multix20/reservassaas.git
cd reservassaas
npm install
cp .env.example .env
# Edita .env con tus credenciales de Supabase
npm run dev
```

### Variables de entorno

Solo dos, ambas del panel de Supabase (Project Settings → API):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Si faltan, la app muestra una pantalla explicando qué configurar en vez de
quedarse en blanco.

### Scripts

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción a dist/
npm run preview  # sirve el build local
npm run lint     # eslint, sin warnings permitidos
npm run doctor   # diagnostica la conexión con Supabase
```

### Diagnóstico

Antes de dar por buena una instalación, `npm run doctor` comprueba contra tu
base que estén las credenciales, las cuatro tablas, las columnas que usan el
panel y los pagos, la RPC de disponibilidad y los datos mínimos (un hostal
activo con `tenant_id`, `admin_email` y habitaciones). Solo lee: no escribe
nada ni imprime la clave, así que su salida se puede compartir sin riesgo.

---

## 💳 Pagos (Flow.cl)

La Edge Function `supabase/functions/flow-payment` expone dos rutas:

- `POST /flow-payment/create` — crea la orden y devuelve la URL de pago.
  Recalcula el monto desde la base; nunca confía en el que envía el cliente.
- `POST /flow-payment/webhook` — Flow confirma el pago y la reserva pasa a
  `pagado` (o a `cancelado` si se rechaza o anula).

Sus secrets **no** llevan prefijo `VITE_` — eso los publicaría en el bundle:

```bash
supabase secrets set FLOW_API_KEY=... FLOW_SECRET=... \
  FLOW_WEBHOOK_URL=https://<proyecto>.supabase.co/functions/v1/flow-payment/webhook \
  SITE_URL=https://tu-dominio.cl \
  SB_URL=... SB_SERVICE_ROLE_KEY=...
```

Antes de desplegarla, aplica la migración que agrega `flow_token` y
`flow_pago_id`:

```bash
supabase db push
```

> ⚠️ **Estado actual:** el formulario de reserva todavía no llama a esta
> función — inserta la reserva en estado `pendiente` y va directo a la
> confirmación. Los botones de MercadoPago y Stripe son decorativos: no hay
> integración detrás de ellos.

---

## 🌐 Deploy en Netlify

`netlify.toml` y `public/_redirects` ya están configurados para SPA.
Define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en
Site configuration → Environment variables.

---

## 📋 Pendientes

- [ ] Conectar el formulario de reserva con `flow-payment/create`
- [ ] Integrar MercadoPago y Stripe, o quitar los botones
- [ ] Confirmar si `reservas_hostal.total` es columna calculada
      (el panel la deriva del precio si llega nula)
- [ ] Email automático al confirmar y al cancelar
- [ ] Conversión de monedas con tasas reales — hoy están fijas en el código
- [ ] Traducir la interfaz: el selector de idioma aún no cambia los textos
- [ ] Fotos de habitaciones desde la base, no desde un array fijo
