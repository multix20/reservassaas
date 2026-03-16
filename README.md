# 🚐 Araucanía Viajes

Plataforma de reservas de transfers y servicios de transporte 
turístico en la Región de la Araucanía, Chile.

> Conecta conductores socios con pasajeros, con gestión en 
tiempo real de viajes compartidos, vans privadas y transfers 
de aeropuerto.

🌐 **Producción:** [araucaniaviajes.cl](https://araucaniaviajes.cl)

---

## 🏗️ Arquitectura
```
araucaniaviajes.cl
├── Frontend        React 18 + Vite
├── Base de datos   Supabase (PostgreSQL)
├── Auth            Supabase Auth (email/password)
├── Pagos           Flow.cl (pasarela chilena)
├── Tiempo real     Supabase Realtime (WebSockets)
├── Deploy          Netlify
└── Vuelos          AviationStack API (ZCO)
```

## ✨ Funcionalidades

### Panel de Administración
- 📅 Dashboard calendario con vista mensual
- 🚌 Viajes Compartidos
- 🚐 Van Privada
- 🔒 Bloqueo de fechas por tipo de servicio
- ✈️ Integración vuelos ZCO
- 💳 Registro de pagos
- 📨 Notificaciones WhatsApp

### Reservas públicas
- Formulario online por ruta y fecha
- Pago via Flow.cl
- Confirmación por email
- Panel "Mis Reservas"

---

## 🛠️ Stack

| Tecnología | Uso |
|---|---|
| React 18 | UI principal |
| Vite | Build tool |
| Supabase | DB + Auth + Realtime |
| Flow.cl | Pagos en CLP |
| Netlify | Hosting + CI/CD |

---

## 🗄️ Base de datos
```sql
rutas        — id, nombre, origen, destino, activa
viajes       — id, ruta_id, tipo, fecha, hora_salida, capacidad, precio_por_pax
reservas     — id, viaje_id, nombre, email, telefono, estado
pagos        — id, reserva_id, monto, metodo, estado
bloqueos     — id, tipo, fecha, mes, anio, motivo, aplica_a
notificaciones — id, reserva_id, canal, mensaje, estado
```

---

## 🚀 Instalación local
```bash
git clone https://github.com/multix20/Transporte.git
cd Transporte
npm install
cp .env.example .env.local
# Edita .env.local con tus credenciales
npm run dev
```

### Variables de entorno
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_AVIATIONSTACK_KEY=tu_api_key  # opcional
```

---

## 🌐 Deploy en Netlify

El archivo `netlify.toml` ya está configurado.
```bash
npm run build
# Netlify despliega automáticamente desde main
```

---

## 📋 Roadmap

### v1.1
- [ ] Email automático al cancelar reserva
- [ ] Panel del conductor socio
- [ ] Vuelos ZCO en producción

### v1.2
- [ ] Minicampers / Van de viajes
- [ ] Multiempresa
- [ ] PWA para conductores

---

## 📞 Contacto

**Araucanía Viajes**
🌐 [araucaniaviajes.cl](https://araucaniaviajes.cl)
📱 WhatsApp: +56 9 5156 9704
📍 Región de La Araucanía, Chile

---
*Hecho con ❤️ en la Araucanía 🌋*