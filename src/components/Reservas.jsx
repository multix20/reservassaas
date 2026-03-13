import React, { useState, useEffect, useRef } from "react";
import supabase from "../lib/supabase";

const WHATSAPP_NUMBER    = "56951569704";
const MAX_ASIENTOS       = 10;
const PAX_COMPARTIDO     = 10;
const MARGEN_COMP        = 1.25;
const RECARGO_IDA_VUELTA = 1.5; // ida y vuelta = precio_ida × 1.5

const PRECIO_VAN_BASE = 40000;
const PRECIO_KM_VAN   = 1000;
const PRECIO_MIN_VAN  = 40000;

// Meses sin cupo compartido (1=ene, 3=mar …)
const MESES_SIN_CUPO    = [3];
const mesFechaActual    = new Date().getMonth() + 1;
const sinCupoCompartido = MESES_SIN_CUPO.includes(mesFechaActual);

const paxDesdeVan = (precioVan) =>
  Math.round((precioVan * MARGEN_COMP) / PAX_COMPARTIDO / 500) * 500;

const aplicarRecargo = (monto, esIdaVuelta) =>
  esIdaVuelta ? Math.round(monto * RECARGO_IDA_VUELTA) : monto;

const uuid = () => crypto.randomUUID?.() ||
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });

// Horas disponibles para el retorno: mismas horas pero ≥ horaIda + 2h
const HORAS_BASE = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2,"0")}:00`);
const horasRetorno = (horaIda) => {
  if (!horaIda) return HORAS_BASE;
  const hh = parseInt(horaIda.split(":")[0]);
  return HORAS_BASE.filter(h => parseInt(h) >= hh + 2);
};

// ── Hook: sesión y perfil ─────────────────────────────────────────────────────
function useUsuario() {
  const [usuario,  setUsuario]  = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) cargarPerfil(session.user);
      else setCargando(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) cargarPerfil(session.user);
      else { setUsuario(null); setCargando(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const cargarPerfil = (authUser) => {
    const emailAuth = authUser.email || "";
    const meta      = authUser.user_metadata || {};
    let nombre   = meta.full_name || meta.name || emailAuth.split("@")[0];
    let telefono = meta.phone || "";
    if (telefono && !telefono.startsWith("+")) telefono = "+56 " + telefono.trim();
    const iniciales = nombre.split(" ").filter(Boolean).map(p => p[0]).join("").toUpperCase().slice(0,2);
    setUsuario({ nombre, email: emailAuth, telefono, avatar: iniciales });
    setCargando(false);
  };

  return { usuario, cargando };
}

// ── Hook: historial de direcciones ───────────────────────────────────────────
const ADDR_KEY = "llevu_addr_history";
const MAX_ADDR = 6;

function useAddressHistory() {
  const [historial, setHistorial] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ADDR_KEY) || "[]"); }
    catch { return []; }
  });
  const guardar = (lugar) => {
    if (!lugar?.label || lugar.id) return;
    setHistorial(prev => {
      const sin  = prev.filter(h => h.label.toLowerCase() !== lugar.label.toLowerCase());
      const nuevo = [{ ...lugar, count:1, ts:Date.now() }, ...sin].slice(0, MAX_ADDR);
      try { localStorage.setItem(ADDR_KEY, JSON.stringify(nuevo)); } catch {}
      return nuevo;
    });
  };
  const eliminar = (label) => {
    setHistorial(prev => {
      const nuevo = prev.filter(h => h.label !== label);
      try { localStorage.setItem(ADDR_KEY, JSON.stringify(nuevo)); } catch {}
      return nuevo;
    });
  };
  return { historial, guardar, eliminar };
}

const RUTA_NOMBRE = {
  "pucon-aeropuerto":      "Pucón → Aeropuerto Temuco ZCO",
  "villarrica-aeropuerto": "Villarrica → Aeropuerto Temuco ZCO",
  "aeropuerto-pucon":      "Aeropuerto Temuco ZCO → Pucón",
  "aeropuerto-villarrica": "Aeropuerto Temuco ZCO → Villarrica",
};

const fmt    = (str) => { if (!str) return ""; const [y,m,d]=str.split("-"); return new Date(y,m-1,d).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"}); };
const precio = (n)   => `$${Math.round(n).toLocaleString("es-CL")}`;
const hoy    = new Date().toISOString().split("T")[0];

// ── Iconos SVG ────────────────────────────────────────────────────────────────
const IcoVan = ({ size=28, c="#1a1611" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l5 7v5h-2"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <path d="M9 5v7h11"/>
  </svg>
);
const IcoBus = ({ size=28, c="#1a1611" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="13" rx="2"/>
    <path d="M2 10h20 M7 18v2 M17 18v2"/>
    <circle cx="7" cy="14" r="1" fill={c}/><circle cx="17" cy="14" r="1" fill={c}/>
  </svg>
);
const IcoChevron = ({ dir="right", c="#9a9080", size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: dir==="left"?"rotate(180deg)":dir==="down"?"rotate(90deg)":"none" }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoCheck = ({ size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoWA = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const IcoLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const IcoCal = ({ size=15, c="#9a9080" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4 M8 2v4 M3 10h18"/>
  </svg>
);

// ── Helpers Supabase ──────────────────────────────────────────────────────────
async function obtenerOCrearViaje({ rutaKey, origenId, destinoId, fecha, tipo, precio_por_pax, origenLabel, destinoLabel }) {
  const rutaNombre = RUTA_NOMBRE[rutaKey] || `${origenLabel || origenId} → ${destinoLabel || destinoId}`;

  const { data: rutaExistente } = await supabase
    .from("rutas").select("id").eq("nombre", rutaNombre).maybeSingle();

  let rutaId = rutaExistente?.id;
  if (!rutaId) {
    const { data: nuevaRuta, error: errRuta } = await supabase
      .from("rutas")
      .insert({ nombre:rutaNombre, origen:origenLabel||"", destino:destinoLabel||"", activa:true })
      .select("id").single();
    if (errRuta) throw new Error("No se pudo crear la ruta");
    rutaId = nuevaRuta?.id;
  }
  if (!rutaId) throw new Error("No se pudo obtener la ruta");

  const { data: viajeExistente } = await supabase
    .from("viajes").select("id, capacidad, estado")
    .eq("ruta_id", rutaId).eq("fecha", fecha).eq("tipo", tipo)
    .not("estado","eq","cancelado").maybeSingle();

  if (viajeExistente) return viajeExistente.id;

  const { data: nuevoViaje, error } = await supabase
    .from("viajes")
    .insert({
      ruta_id:rutaId, tipo, fecha, hora_salida:"08:00",
      capacidad: tipo==="compartido" ? MAX_ASIENTOS : 8,
      precio_por_pax, estado:"en_espera",
    })
    .select("id").single();

  if (error) throw new Error("No se pudo crear el viaje");
  return nuevoViaje.id;
}

async function contarAsientosOcupados(rutaKey, fecha) {
  const rutaNombre = RUTA_NOMBRE[rutaKey];
  if (!rutaNombre) return 0;
  const { data: viaje } = await supabase
    .from("viajes").select("id").eq("fecha",fecha).eq("tipo","compartido")
    .not("estado","eq","cancelado").maybeSingle();
  if (!viaje) return 0;
  const { data: reservas } = await supabase
    .from("reservas").select("num_asientos")
    .eq("viaje_id",viaje.id).neq("estado","cancelada");
  return reservas ? reservas.reduce((acc,r) => acc + (r.num_asientos||1), 0) : 0;
}

// ── Tarifas ───────────────────────────────────────────────────────────────────
const ZONAS = [
  { id:"aeropuerto", lat:-38.9258, lng:-72.6372, radio:8  },
  { id:"temuco",     lat:-38.7359, lng:-72.5904, radio:12 },
  { id:"pucon",      lat:-39.2724, lng:-71.9766, radio:10 },
  { id:"villarrica", lat:-39.2833, lng:-72.2333, radio:10 },
  { id:"freire",     lat:-38.9583, lng:-72.6333, radio:8  },
  { id:"gorbea",     lat:-39.0950, lng:-72.6783, radio:8  },
  { id:"victoria",   lat:-38.2317, lng:-72.3317, radio:8  },
  { id:"loncoche",   lat:-39.3667, lng:-72.6333, radio:8  },
  { id:"pitrufquen", lat:-38.9833, lng:-72.6500, radio:8  },
];
const TARIFAS_FIJAS = {
  "temuco-aeropuerto":     { van:40000, persona:paxDesdeVan(40000) },
  "aeropuerto-temuco":     { van:40000, persona:paxDesdeVan(40000) },
  "aeropuerto-pucon":      { van:95000, persona:paxDesdeVan(95000) },
  "pucon-aeropuerto":      { van:95000, persona:paxDesdeVan(95000) },
  "aeropuerto-villarrica": { van:80000, persona:paxDesdeVan(80000) },
  "villarrica-aeropuerto": { van:80000, persona:paxDesdeVan(80000) },
  "pucon-villarrica":      { van:40000, persona:paxDesdeVan(40000) },
  "villarrica-pucon":      { van:40000, persona:paxDesdeVan(40000) },
  "temuco-pucon":          { van:95000, persona:paxDesdeVan(95000) },
  "pucon-temuco":          { van:95000, persona:paxDesdeVan(95000) },
  "temuco-villarrica":     { van:80000, persona:paxDesdeVan(80000) },
  "villarrica-temuco":     { van:80000, persona:paxDesdeVan(80000) },
  "temuco-freire":         { van:45000, persona:paxDesdeVan(45000) },
  "freire-temuco":         { van:45000, persona:paxDesdeVan(45000) },
  "aeropuerto-freire":     { van:50000, persona:paxDesdeVan(50000) },
  "freire-aeropuerto":     { van:50000, persona:paxDesdeVan(50000) },
  "temuco-gorbea":         { van:60000, persona:paxDesdeVan(60000) },
  "gorbea-temuco":         { van:60000, persona:paxDesdeVan(60000) },
  "aeropuerto-gorbea":     { van:65000, persona:paxDesdeVan(65000) },
  "gorbea-aeropuerto":     { van:65000, persona:paxDesdeVan(65000) },
  "temuco-victoria":       { van:90000, persona:paxDesdeVan(90000) },
  "victoria-temuco":       { van:90000, persona:paxDesdeVan(90000) },
  "aeropuerto-victoria":   { van:95000, persona:paxDesdeVan(95000) },
  "victoria-aeropuerto":   { van:95000, persona:paxDesdeVan(95000) },
  "temuco-loncoche":       { van:70000, persona:paxDesdeVan(70000) },
  "loncoche-temuco":       { van:70000, persona:paxDesdeVan(70000) },
  "aeropuerto-loncoche":   { van:75000, persona:paxDesdeVan(75000) },
  "loncoche-aeropuerto":   { van:75000, persona:paxDesdeVan(75000) },
  "temuco-pitrufquen":     { van:40000, persona:paxDesdeVan(40000) },
  "pitrufquen-temuco":     { van:40000, persona:paxDesdeVan(40000) },
  "aeropuerto-pitrufquen": { van:42000, persona:paxDesdeVan(42000) },
  "pitrufquen-aeropuerto": { van:42000, persona:paxDesdeVan(42000) },
};

function detectarZona(lat, lng) {
  const R = 6371;
  for (const z of ZONAS) {
    const dLat = (lat-z.lat)*Math.PI/180, dLng = (lng-z.lng)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(z.lat*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLng/2)**2;
    if (R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)) <= z.radio) return z.id;
  }
  return null;
}

function calcularTarifas(distanciaMetros, origenObj, destinoObj) {
  const km = Math.round(distanciaMetros/1000);
  const idO = origenObj?.id, idD = destinoObj?.id;
  if (idO && idD && TARIFAS_FIJAS[`${idO}-${idD}`]) {
    const f = TARIFAS_FIJAS[`${idO}-${idD}`];
    return { persona:f.persona, van:f.van, km:`${km} km` };
  }
  const zonaO = idO || detectarZona(origenObj?.lat,origenObj?.lng);
  const zonaD = idD || detectarZona(destinoObj?.lat,destinoObj?.lng);
  const key   = zonaO && zonaD ? `${zonaO}-${zonaD}` : null;
  if (key && TARIFAS_FIJAS[key]) {
    const f = TARIFAS_FIJAS[key];
    return { persona:f.persona, van:f.van, km:`${km} km` };
  }
  const van = km<=40 ? PRECIO_VAN_BASE : Math.max(PRECIO_MIN_VAN, Math.round(km*PRECIO_KM_VAN/1000)*1000);
  return { persona:paxDesdeVan(van), van, km:`${km} km` };
}

// ── Nominatim / OSRM ──────────────────────────────────────────────────────────
async function buscarDirecciones(query) {
  if (!query || query.length<3) return [];
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query+", Chile")}&format=json&limit=5&countrycodes=cl&addressdetails=1`,{headers:{"Accept-Language":"es"}});
    const data = await res.json();
    return data.map(r => ({ label:r.display_name.split(",").slice(0,3).join(",").trim(), sub:r.display_name.split(",").slice(3,5).join(",").trim(), lat:parseFloat(r.lat), lng:parseFloat(r.lon) }));
  } catch { return []; }
}

async function obtenerDistancia(origen, destino) {
  try {
    const res  = await fetch(`https://router.project-osrm.org/route/v1/driving/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=false`);
    const data = await res.json();
    if (data.code==="Ok") return data.routes[0].distance;
  } catch {}
  const R=6371000, dLat=(destino.lat-origen.lat)*Math.PI/180, dLng=(destino.lng-origen.lng)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(origen.lat*Math.PI/180)*Math.cos(destino.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))*1.28);
}

// ── Puntos frecuentes ─────────────────────────────────────────────────────────
const PUNTOS_FRECUENTES = [
  { id:"aeropuerto", label:"✈️  Aeropuerto Temuco ZCO", sub:"Terminal principal · La Araucanía", lat:-38.9258, lng:-72.6372 },
  { id:"pucon",      label:"🏔️  Centro de Pucón",        sub:"Pucón, La Araucanía",               lat:-39.2724, lng:-71.9766 },
  { id:"villarrica", label:"🌋  Centro de Villarrica",    sub:"Villarrica, La Araucanía",          lat:-39.2833, lng:-72.2333 },
];

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function Reservas() {
  const { usuario, cargando: cargandoAuth } = useUsuario();
  const { historial, guardar, eliminar }    = useAddressHistory();

  const [pantalla,  setPantalla]  = useState("inicio");
  const [origen,    setOrigen]    = useState(null);
  const [destino,   setDestino]   = useState(null);

  const origenId  = origen?.id  || "custom";
  const destinoId = destino?.id || "custom";

  const [fecha,        setFecha]        = useState("");
  const [hora,         setHora]         = useState("");
  const [tipoRuta,     setTipoRuta]     = useState("ida");
  const [horaRegreso,  setHoraRegreso]  = useState("");
  const [horaFlexible, setHoraFlexible] = useState(false);

  const [pasajeros, setPasajeros] = useState(1);
  const [tipoViaje, setTipoViaje] = useState("");
  const [modoPago,  setModoPago]  = useState("abono");
  const [enviando,  setEnviando]  = useState(false);
  const [reservaId, setReservaId] = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState(0);
  const [error,     setError]     = useState("");

  const [calculando,  setCalculando]  = useState(false);
  const [rutaDataDyn, setRutaDataDyn] = useState(null);

  const topRef = useRef(null);

  useEffect(() => { setRutaDataDyn(null); }, [origen, destino]);
  useEffect(() => { setHoraRegreso(""); setHoraFlexible(false); }, [tipoRuta]);
  useEffect(() => { setHoraRegreso(""); }, [hora]);

  const esIdaVuelta = tipoRuta === "ida_vuelta";

  // ── Precios ──────────────────────────────────────────────────────────────
  const rutaKey   = origen?.id && destino?.id ? `${origen.id}-${destino.id}` : null;
  const rutaData  = rutaDataDyn;
  const rutaLabel = origen && destino
    ? `${origen.label.replace(/^.{3}/,"")} → ${destino.label.replace(/^.{3}/,"")}`
    : "";

  const precioBasePersona = rutaData?.persona || 0;
  const precioBaseVan     = rutaData?.van     || 0;
  const precioPersona     = aplicarRecargo(precioBasePersona, esIdaVuelta);
  const precioVan         = aplicarRecargo(precioBaseVan,     esIdaVuelta);

  const montoTotal = !rutaData ? 0
    : tipoViaje === "van_completa" ? precioVan
    : precioPersona * pasajeros;

  const aPagar = tipoViaje === "van_completa" && modoPago === "abono"
    ? montoTotal * 0.5
    : montoTotal;

  const asientosLibres = Math.max(0, MAX_ASIENTOS - asientosOcupados);

  const scroll = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 40);
  const ir     = (p) => { setPantalla(p); scroll(); };

  useEffect(() => {
    if (!rutaKey || !fecha || tipoViaje !== "compartido") return;
    contarAsientosOcupados(rutaKey, fecha).then(setAsientosOcupados);
  }, [rutaKey, fecha, tipoViaje]);

  // ── Ver tarifas ──────────────────────────────────────────────────────────
  const verTarifas = async () => {
    if (!origen || !destino || !fecha || !hora) return;
    setCalculando(true); setError("");
    try {
      guardar(origen); guardar(destino);
      const metros  = await obtenerDistancia(origen, destino);
      const tarifas = calcularTarifas(metros, origen, destino);
      setRutaDataDyn({ ...tarifas, duracion:`~${Math.round(metros/1000/60)} min` });
      ir("tarifas");
    } catch {
      setError("No se pudo calcular la ruta. Intenta de nuevo.");
    } finally {
      setCalculando(false);
    }
  };

  // ── Confirmar reserva ────────────────────────────────────────────────────
  const confirmar = async () => {
    setError(""); setEnviando(true);
    try {
      const grupoId   = esIdaVuelta ? uuid() : null;
      const tipo      = tipoViaje === "compartido" ? "compartido" : "privado";
      const precioPax = tipoViaje === "compartido" ? precioPersona : precioVan;

      // Reserva IDA
      const viajeId = await obtenerOCrearViaje({
        rutaKey, origenId, destinoId, fecha, tipo,
        precio_por_pax: precioPax,
        origenLabel:  origen?.label  || "",
        destinoLabel: destino?.label || "",
      });

      const notasIda = [
        tipoViaje === "van_completa"
          ? `Van privada · Abono 50%: ${precio(aPagar)} | Total: ${precio(montoTotal)}`
          : "Compartido",
        esIdaVuelta ? `IDA (grupo: ${grupoId?.slice(0,8)})` : "Solo ida",
      ].join(" · ");

      const { data: resIda, error: dbErr } = await supabase
        .from("reservas")
        .insert([{
          viaje_id: viajeId,
          nombre:   usuario?.nombre   || "",
          email:    usuario?.email    || "",
          telefono: usuario?.telefono || "",
          num_asientos:   Number(pasajeros),
          estado:         "pendiente",
          origen_reserva: "web",
          tipo_ruta:      tipoRuta,
          grupo_reserva:  grupoId,
          notas:          notasIda,
        }])
        .select().single();

      if (dbErr) throw new Error("Error al guardar la reserva de ida");
      setReservaId(resIda.id);

      // Reserva REGRESO (mismo día, origen/destino invertidos)
      if (esIdaVuelta) {
        const rutaKeyRet  = `${destinoId}-${origenId}`;
        const viajeIdRet  = await obtenerOCrearViaje({
          rutaKey:      rutaKeyRet,
          origenId:     destinoId,
          destinoId:    origenId,
          fecha, tipo,
          precio_por_pax: precioPax,
          origenLabel:  destino?.label || "",
          destinoLabel: origen?.label  || "",
        });
        const notasRet = [
          tipoViaje === "van_completa" ? "Van privada" : "Compartido",
          `REGRESO (grupo: ${grupoId?.slice(0,8)})`,
          horaFlexible ? "⏰ Hora flexible — coordinar por WhatsApp" : `Hora: ${horaRegreso}`,
        ].join(" · ");

        await supabase.from("reservas").insert([{
          viaje_id:       viajeIdRet,
          nombre:         usuario?.nombre   || "",
          email:          usuario?.email    || "",
          telefono:       usuario?.telefono || "",
          num_asientos:   Number(pasajeros),
          estado:         "pendiente",
          origen_reserva: "web",
          tipo_ruta:      "ida",
          grupo_reserva:  grupoId,
          hora_flexible:  horaFlexible,
          notas:          notasRet,
        }]);
      }

      // Pago Flow (van privada)
      if (tipoViaje === "van_completa") {
        const edgeFn = `https://pyloifgprupypgkhkqmx.supabase.co/functions/v1/flow-payment/create`;
        const res    = await fetch(edgeFn, {
          method:"POST",
          headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            reservaId:   resIda.id,
            monto:       aPagar,
            email:       usuario?.email || "",
            descripcion: `Araucanía Viajes · ${rutaLabel} · ${fmt(fecha)} ${hora}${esIdaVuelta?" · Ida y vuelta":""}`,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.urlPago) throw new Error(json.error || "No se pudo iniciar el pago");
        setEnviando(false);
        window.location.href = json.urlPago;
        return;
      }

      setEnviando(false);
      abrirWhatsApp(resIda.id);
      ir("ok");

    } catch (e) {
      setError(e.message || "Error al procesar. Intenta de nuevo.");
      setEnviando(false);
    }
  };

  const abrirWhatsApp = (id) => {
    const regresoTxt = esIdaVuelta
      ? `\n↩️ *Regreso:* ${fmt(fecha)} · ${horaFlexible ? "Hora a coordinar" : horaRegreso}`
      : "";
    const msg = encodeURIComponent(
      `🚐 *${tipoViaje==="compartido"?"Reserva Compartida":"Van Completa"} - Araucanía Viajes*\n\n` +
      `👤 *${usuario?.nombre}* · ${usuario?.telefono}\n` +
      `🗺️ ${rutaLabel}\n` +
      `📅 ${fmt(fecha)} · 🕐 ${hora}\n` +
      `🎫 ${esIdaVuelta?"Ida y vuelta":"Solo ida"} · 👥 ${pasajeros} pax` +
      regresoTxt + `\n\n` +
      `💰 Total: ${precio(montoTotal)}\n` +
      (tipoViaje==="compartido"
        ? `⏳ *Sin costo ahora — se confirma al completar cupo.*\n`
        : `💳 Abono 50%: ${precio(aPagar)} — pagado vía Flow\n`) +
      `🆔 Ref: ${id}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`,"_blank");
  };

  const reset = () => {
    setPantalla("inicio"); setOrigen(null); setDestino(null); setFecha("");
    setPasajeros(1); setTipoViaje(""); setModoPago("abono"); setHora("");
    setTipoRuta("ida"); setHoraRegreso(""); setHoraFlexible(false);
    setReservaId(null); setError(""); scroll();
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PANTALLA: OK ✓
  // ════════════════════════════════════════════════════════════════════════════
  if (pantalla === "ok") return (
    <div ref={topRef} style={S.root}>
      <style>{css}</style>
      <div style={S.okWrap} className="fade-in">
        <div style={S.okCircle}><IcoCheck size={32}/></div>
        <h2 style={S.okTitle}>{tipoViaje==="compartido" ? "¡Reserva lista!" : "¡Van reservada!"}</h2>
        <p style={S.okSub}>
          {tipoViaje==="compartido"
            ? `Te avisamos por WhatsApp cuando se llene el cupo (${MAX_ASIENTOS} pax).`
            : "Revisa tu WhatsApp con los detalles del pago."}
        </p>
        <div style={S.okCard}>
          <Row label="Ruta"      val={rutaLabel}/>
          <Row label="Fecha"     val={fmt(fecha)}/>
          {esIdaVuelta && <Row label="Regreso" val={horaFlexible ? "Hora a coordinar por WhatsApp" : `${fmt(fecha)} · ${horaRegreso}`}/>}
          <Row label="Pasajeros" val={`${pasajeros} pax`}/>
          <Row label="Total"     val={precio(montoTotal)} bold/>
        </div>
        <button className="btn-wa" onClick={() => abrirWhatsApp(reservaId)}><IcoWA/> Abrir WhatsApp</button>
        <button className="btn-ghost" onClick={reset} style={{ marginTop:10 }}>Nueva reserva</button>
        <button className="btn-mis-reservas" onClick={() => document.dispatchEvent(new CustomEvent("openMisReservas"))}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          Ver mis reservas
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PANTALLA: CONFIRMAR
  // ════════════════════════════════════════════════════════════════════════════
  if (pantalla === "confirmar") {
    if (!cargandoAuth && !usuario) return (
      <div ref={topRef} style={S.root}>
        <style>{css}</style>
        <div style={S.wrap}>
          <div style={S.topBar}>
            <button className="btn-back" onClick={() => ir("tarifas")}><IcoChevron dir="left" c="#1a1611" size={20}/></button>
            <span style={S.topTitle}>Confirmar viaje</span>
            <div style={{ width:44 }}/>
          </div>
          <div style={S.rutaPill} className="fade-in">
            <div style={S.rutaDot}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={S.rutaTexto}>{origen?.label}</div>
              <div style={S.rutaLinea}/>
              <div style={S.rutaTexto}>{destino?.label}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={S.pillMeta}>{fmt(fecha).split(",")[0]}</div>
              <div style={S.pillMeta}>{precio(montoTotal)}</div>
            </div>
          </div>
          <div style={{ textAlign:"center", padding:"2rem 0 1rem" }}>
            <div style={{ fontSize:"2rem", marginBottom:10 }}>🔐</div>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:"#1a1611", marginBottom:6 }}>
              Inicia sesión para confirmar
            </h3>
            <p style={{ color:"#9a9080", fontSize:"0.82rem", lineHeight:1.6, marginBottom:20 }}>
              Tus datos se cargan automáticamente.<br/>No necesitas escribir nada al reservar.
            </p>
            <button className="btn-confirmar"
              onClick={() => document.querySelector('.hdr__signin, .hdr__register')?.click()}>
              Iniciar sesión / Registrarse
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <div ref={topRef} style={S.root}>
        <style>{css}</style>
        <div style={S.wrap}>
          <div style={S.topBar}>
            <button className="btn-back" onClick={() => ir("tarifas")}><IcoChevron dir="left" c="#1a1611" size={20}/></button>
            <span style={S.topTitle}>Confirmar viaje</span>
            <div style={{ width:44 }}/>
          </div>

          <div style={S.rutaPill} className="fade-in">
            <div style={S.rutaDot}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={S.rutaTexto}>{origen?.label}</div>
              <div style={S.rutaLinea}/>
              <div style={S.rutaTexto}>{destino?.label}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={S.pillMeta}>{rutaData?.km}</div>
              <div style={S.pillMeta}>{rutaData?.duracion}</div>
            </div>
          </div>

          <div style={S.section}>
            <Row label="Salida"    val={`${fmt(fecha)} · ${hora}`}/>
            {esIdaVuelta && (
              <Row label="Regreso"
                val={horaFlexible ? "Hora flexible (WhatsApp)" : `${fmt(fecha)} · ${horaRegreso}`}/>
            )}
            <Row label="Pasajeros" val={
 <span style={{ display:"flex", alignItems:"center", gap:4 }}>
    {Array.from({ length: Math.min(pasajeros, 5) }).map((_, i) => (
      <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#1a1611" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ))}
    {pasajeros > 5 && (
      <span style={{ fontSize:"0.75rem", color:"#9a9080", fontWeight:600 }}>+{pasajeros - 5}</span>
    )}
    <span style={{ fontWeight:700, fontSize:"0.88rem", color:"#1a1611", marginLeft:2 }}>
      {pasajeros}
    </span>
  </span>
}/>
            <Row label="Tipo"      val={tipoViaje==="compartido" ? "Compartido" : "Van privada"}/>
          </div>

          {tipoViaje === "van_completa" && (
            <div style={{ ...S.section, paddingTop:0 }}>
              <p style={S.sectionLabel}>Modo de pago</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { id:"abono", label:"50% ahora",    monto:precio(montoTotal*0.5), sub:"Resto al viajar" },
                  { id:"total", label:"Pago completo", monto:precio(montoTotal),    sub:"Todo ahora" },
                ].map(m => (
                  <button key={m.id} className={`pago-opt${modoPago===m.id?" pago-opt-on":""}`} onClick={() => setModoPago(m.id)}>
                    <span style={{ fontSize:"0.78rem", opacity:0.7 }}>{m.label}</span>
                    <span style={{ fontSize:"1.05rem", fontWeight:800 }}>{m.monto}</span>
                    <span style={{ fontSize:"0.68rem", opacity:0.6 }}>{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tipoViaje === "compartido" && (
            <div style={S.aviso}>
              <span style={{ fontSize:"1rem" }}>🕐</span>
              <span style={{ fontSize:"0.78rem", color:"#92400e", lineHeight:1.5 }}>
                <strong>Sin costo ahora.</strong> Confirmamos cuando se complete el cupo de {MAX_ASIENTOS} pasajeros.
                Quedan <strong>{asientosLibres} lugares.</strong>
              </span>
            </div>
          )}

          {esIdaVuelta && horaFlexible && (
            <div style={{ ...S.aviso, background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.25)", marginBottom:"1rem" }}>
              <span style={{ fontSize:"1rem" }}>💬</span>
              <span style={{ fontSize:"0.78rem", color:"#1e40af", lineHeight:1.5 }}>
                <strong>Hora de regreso flexible.</strong> Te contactamos por WhatsApp para coordinar el horario de vuelta.
              </span>
            </div>
          )}

          <div style={S.section}>
            <p style={S.sectionLabel}>Quién viaja</p>
            <div style={S.usuarioRow}>
              <div style={S.avatar}>{usuario?.avatar}</div>
              <div>
                <div style={{ fontSize:"0.9rem", fontWeight:700, color:"#1a1611" }}>{usuario?.nombre}</div>
                <div style={{ fontSize:"0.75rem", color:"#9a9080" }}>{usuario?.telefono || usuario?.email}</div>
              </div>
            </div>
          </div>

          <div style={S.totalBox}>
            <span style={{ fontSize:"0.85rem", color:"#9a9080" }}>
              {tipoViaje==="compartido" ? "Total (se cobra al confirmar)" : "A pagar ahora"}
            </span>
            <span style={{ fontSize:"clamp(1.3rem,5vw,1.6rem)", fontWeight:800, color:"#1a1611" }}>{precio(aPagar)}</span>
          </div>

          {error && <div style={S.errBox}>⚠️ {error}</div>}

          {tipoViaje==="compartido" ? (
            <button className="btn-confirmar" disabled={enviando} onClick={confirmar}>
              {enviando ? "Procesando..." : `Confirmar${esIdaVuelta && horaFlexible ? " · coordinar regreso por WhatsApp" : ""}`}
            </button>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button className="btn-flow" disabled={enviando} onClick={confirmar}>
                {enviando ? <><span className="btn-spinner"/>Procesando...</> : <><IcoLock/>Pagar {precio(aPagar)} con Flow</>}
              </button>
              <p style={{ textAlign:"center", fontSize:"0.7rem", color:"#9a9080", lineHeight:1.5 }}>
                Pago seguro vía Flow.cl · El resto lo pagas el día del viaje
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PANTALLA: TARIFAS
  // ════════════════════════════════════════════════════════════════════════════
  if (pantalla === "tarifas") return (
    <div ref={topRef} style={S.root}>
      <style>{css}</style>
      <div style={S.wrap}>
        <div style={S.topBar}>
          <button className="btn-back" onClick={() => ir("inicio")}><IcoChevron dir="left" c="#1a1611" size={20}/></button>
          <span style={S.topTitle}>Elige tu viaje</span>
          <div style={{ width:44 }}/>
        </div>

        <div style={S.rutaPill} className="fade-in">
          <div style={S.rutaDot}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={S.rutaTexto}>{origen?.label}</div>
            <div style={S.rutaLinea}/>
            <div style={S.rutaTexto}>{destino?.label}</div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={S.pillMeta}>{fmt(fecha).split(",")[0]}</div>
            <div style={S.pillMeta}>{pasajeros} pax · {rutaData?.km || "—"}</div>
          </div>
        </div>



        <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:4 }}>

          {/* ── Compartido ── */}
          <div style={{ position:"relative", overflow:"hidden", borderRadius:16 }}>
            <button
              className={`tarifa-card${tipoViaje==="compartido"?" tarifa-on":""}`}
              onClick={() => !sinCupoCompartido && setTipoViaje("compartido")}
              style={{ width:"100%", opacity:sinCupoCompartido?0.55:1, cursor:sinCupoCompartido?"not-allowed":"pointer", pointerEvents:sinCupoCompartido?"none":"auto" }}
            >
              <div style={S.tarifaIco}><IcoBus size={30} c={tipoViaje==="compartido"?"#1a1611":"#9a9080"}/></div>
              <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, fontSize:"1rem", color:"#1a1611" }}>Compartido</span>
                  <span style={S.badge}>Más económico</span>
                </div>
                <div style={{ fontSize:"0.75rem", color:"#9a9080", marginTop:3 }}>
                  {sinCupoCompartido ? "Sin disponibilidad este mes" : `${asientosLibres} asientos libres · ${rutaData?.duracion||""}`}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0, minWidth:90 }}>
                <div style={{ fontWeight:800, fontSize:"1.15rem", color:"#1a1611", whiteSpace:"nowrap" }}>
                  {rutaData ? precio(precioPersona * pasajeros) : "—"}
                </div>
                {esIdaVuelta && rutaData ? null : pasajeros > 1 && rutaData ? (
                  <div style={{ fontSize:"0.7rem", color:"#9a9080", whiteSpace:"nowrap" }}>{precio(precioPersona)} × {pasajeros}</div>
                ) : (
                  <div style={{ fontSize:"0.7rem", color:"#9a9080" }}>por pasajero</div>
                )}
              </div>
            </button>
            {sinCupoCompartido && (
              <div style={{ position:"absolute", top:18, right:-30, width:165, background:"#c0290e", color:"#ffffff", fontSize:"0.68rem", fontWeight:800, fontFamily:"'DM Sans',sans-serif", textAlign:"center", padding:"5px 0", transform:"rotate(38deg)", letterSpacing:"0.07em", boxShadow:"0 2px 10px rgba(192,41,14,0.4)", pointerEvents:"none", zIndex:10, textTransform:"uppercase" }}>
                ¡Sin cupo!
              </div>
            )}
          </div>

          {/* ── Van privada ── */}
          <button
            className={`tarifa-card${tipoViaje==="van_completa"?" tarifa-on":""}`}
            onClick={() => setTipoViaje("van_completa")}
          >
            <div style={S.tarifaIco}><IcoVan size={30} c={tipoViaje==="van_completa"?"#1a1611":"#9a9080"}/></div>
            <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontWeight:700, fontSize:"1rem", color:"#1a1611" }}>Van privada</span>
                <span style={{ ...S.badge, background:"#3d2e1e" }}>Exclusiva</span>
              </div>
              <div style={{ fontSize:"0.75rem", color:"#9a9080", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9a9080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                12 - 15 · {rutaData?.duracion||""}
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontWeight:800, fontSize:"1.25rem", color:"#1a1611" }}>
                {rutaData ? precio(precioVan) : "—"}
              </div>
              {!esIdaVuelta && (
                <div style={{ fontSize:"0.7rem", color:"#9a9080" }}>van completa</div>
              )}
            </div>
          </button>
        </div>

        {tipoViaje && (
          <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginTop:14, padding:"10px 14px", background:"#F5EDD8", borderRadius:12, border:"1px solid #E8D8B0" }} className="fade-in">
            <span style={{ fontSize:"1rem" }}>{tipoViaje==="compartido" ? "🙌" : "🔒"}</span>
            <p style={{ fontSize:"0.76rem", color:"#6b5e4e", lineHeight:1.5 }}>
              {tipoViaje==="compartido"
                ? "Sin costo hasta que se confirme el viaje. Te avisamos por WhatsApp."
                : "Se confirma con el 50% de abono. El resto se paga al viajar."}
            </p>
          </div>
        )}

        <button
          className="btn-confirmar"
          style={{ marginTop:16 }}
          disabled={!tipoViaje}
          onClick={() => ir("confirmar")}
        >
          {!tipoViaje
            ? "Selecciona un viaje"
            : tipoViaje==="compartido"
              ? `Reservar asiento — ${precio(precioPersona * pasajeros)}`
              : `Reservar van — ${precio(precioVan * 0.5)} abono`}
        </button>
        <p style={{ textAlign:"center", fontSize:"0.72rem", color:"#C8BEA8", marginTop:10 }}>
          Sin costo adicional por reservar
        </p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PANTALLA: INICIO
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div ref={topRef} style={S.root}>
      <style>{css}</style>
      <div style={S.wrap}>

        <div style={S.saludoRow} className="fade-in">
          <div style={{ flex:1, minWidth:0 }}>
            <p style={S.saludoSub}>{usuario ? `Hola, ${usuario.nombre.split(" ")[0]} 👋` : "¿A dónde viajas?"}</p>
            <FrasesRotativas />
            <h2 style={S.saludoTitle}>¿A dónde<br/>vamos hoy?</h2>
          </div>
          {usuario && <div style={S.avatar}>{usuario.avatar}</div>}
        </div>

        {/* Origen / Destino */}
        <div style={{ display:"flex", flexDirection:"column", gap:8, position:"relative", zIndex:50 }} className="fade-in">
          <LugarInput
            placeholder="Punto de partida"
            value={origen}
            onChange={val => { setOrigen(val); setDestino(null); }}
            dotStyle="origen"
            historial={historial}
            onEliminarHistorial={eliminar}
          />
          <div style={S.arrowSep}>
            <button
              style={S.swapBtn}
              onClick={() => { const tmp=origen; setOrigen(destino); setDestino(tmp); }}
              title="Intercambiar origen y destino"
              disabled={!origen && !destino}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </button>
          </div>
          <LugarInput
            placeholder="¿A dónde vas?"
            value={destino}
            onChange={setDestino}
            dotStyle="destino"
            disabled={!origen}
            historial={historial}
            onEliminarHistorial={eliminar}
          />
        </div>

        {/* Fecha + Hora de ida */}
        <div style={{ display:"flex", gap:8, marginTop:10 }} className="fade-in">
          <DatePicker fecha={fecha} setFecha={setFecha} hoy={hoy} fmt={fmt} />
          <HoraPicker hora={hora} setHora={setHora} horas={HORAS_BASE} label="Hora salida" />
        </div>

        {/* Tipo de ruta */}
        <div style={{ marginTop:8 }} className="fade-in">
          <TipoRutaPicker tipoRuta={tipoRuta} setTipoRuta={setTipoRuta} />
        </div>

        {/* ── Sección regreso ── */}
        {esIdaVuelta && (
          <div style={S.regresoBox} className="fade-in">
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#1a1611", letterSpacing:"0.03em" }}>
                🔄 REGRESO — mismo día
              </span>
              {fecha && (
                <span style={{ fontSize:"0.7rem", color:"#9a9080", background:"#E8E0D0", padding:"2px 8px", borderRadius:99 }}>
                  {fmt(fecha).split(",")[0]}
                </span>
              )}
            </div>

            <div style={{ opacity:horaFlexible?0.4:1, transition:"opacity .2s", pointerEvents:horaFlexible?"none":"auto" }}>
              <HoraPicker
                hora={horaRegreso}
                setHora={setHoraRegreso}
                horas={horasRetorno(hora)}
                label="Hora de regreso"
                placeholder={hora ? (horasRetorno(hora)[0] ? `Desde las ${horasRetorno(hora)[0]}` : "Sin horas disponibles") : "Elige hora de salida primero"}
                disabled={!hora || horaFlexible}
              />
            </div>

            {/* Toggle hora flexible */}
            <button
              onClick={() => { setHoraFlexible(v => !v); if (!horaFlexible) setHoraRegreso(""); }}
              style={{ display:"flex", alignItems:"center", gap:10, background:"none", border:"none", cursor:"pointer", padding:"10px 0 0", fontFamily:"'DM Sans',sans-serif" }}
            >
              <div style={{ width:38, height:22, borderRadius:11, background:horaFlexible?"#1a1611":"#D4CBB8", position:"relative", transition:"background .2s", flexShrink:0 }}>
                <div style={{ position:"absolute", top:3, left:horaFlexible?19:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }}/>
              </div>
              <span style={{ fontSize:"0.78rem", color:horaFlexible?"#1a1611":"#9a9080", fontWeight:horaFlexible?700:400, textAlign:"left", lineHeight:1.4 }}>
                {horaFlexible
                  ? <>Hora flexible — <span style={{ color:"#1a1611" }}>coordinamos por WhatsApp</span></>
                  : "No sé la hora exacta de regreso"
                }
              </span>
            </button>
          </div>
        )}

        {/* Aviso ida y vuelta solo mismo día */}
        {esIdaVuelta && (
          <div style={S.infoIV} className="fade-in">
            <span>ℹ️</span>
            <span>
              Ida y vuelta disponible <strong>solo el mismo día</strong>.
              Para otra fecha, reserva el regreso como un viaje aparte.
            </span>
          </div>
        )}

        {/* Botón ver tarifas */}
        <button
          className="btn-confirmar"
          style={{ marginTop:14 }}
          disabled={
            !origen || !destino || !fecha || !hora || calculando ||
            (esIdaVuelta && !horaFlexible && !horaRegreso)
          }
          onClick={verTarifas}
        >
          {calculando
            ? <><span className="btn-spinner" style={{marginRight:8}}/> Calculando…</>
            : "Ver tarifas"}
        </button>

        {/* Hint si falta hora de regreso */}
        {esIdaVuelta && !horaFlexible && !horaRegreso && hora && (
          <p style={{ textAlign:"center", fontSize:"0.72rem", color:"#c0290e", marginTop:6 }}>
            Elige hora de regreso o activa "No sé la hora exacta"
          </p>
        )}

        {/* Rutas frecuentes */}
        <div style={{ marginTop:32 }} className="fade-in">
          <p style={S.sectionLabel}>Rutas frecuentes</p>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {[
              { o:PUNTOS_FRECUENTES[0], d:PUNTOS_FRECUENTES[1], label:"Aeropuerto → Pucón",      meta:`~95 km · desde ${precio(paxDesdeVan(95000))}/pax · van ${precio(95000)}` },
              { o:PUNTOS_FRECUENTES[0], d:PUNTOS_FRECUENTES[2], label:"Aeropuerto → Villarrica", meta:`~80 km · desde ${precio(paxDesdeVan(80000))}/pax · van ${precio(80000)}` },
              { o:PUNTOS_FRECUENTES[1], d:PUNTOS_FRECUENTES[0], label:"Pucón → Aeropuerto",      meta:`~95 km · desde ${precio(paxDesdeVan(95000))}/pax · van ${precio(95000)}` },
              { o:PUNTOS_FRECUENTES[2], d:PUNTOS_FRECUENTES[0], label:"Villarrica → Aeropuerto", meta:`~80 km · desde ${precio(paxDesdeVan(80000))}/pax · van ${precio(80000)}` },
            ].map((r,i) => (
              <button key={i} className="ruta-row" onClick={() => { setOrigen(r.o); setDestino(r.d); }}>
                <div style={S.rutaIcoSmall}>{r.o.id==="aeropuerto"?"✈️":r.o.id==="pucon"?"🏔️":"🌋"}</div>
                <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:"0.88rem", color:"#1a1611" }}>{r.label}</div>
                  <div style={{ fontSize:"0.72rem", color:"#9a9080", marginTop:2 }}>{r.meta}</div>
                </div>
                <IcoChevron/>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DatePicker ────────────────────────────────────────────────────────────────
function DatePicker({ fecha, setFecha, hoy, fmt }) {
  const inputRef = useRef(null);
  const textoFecha = fecha ? (() => {
    const [y,m,d] = fecha.split("-"), date = new Date(y,m-1,d);
    return `${date.toLocaleDateString("es-CL",{weekday:"short"})} ${date.getDate()} ${date.toLocaleDateString("es-CL",{month:"short"})}`;
  })() : "Elige día";
  const abrir = () => {
    const inp = inputRef.current; if (!inp) return;
    if (inp.showPicker) { try { inp.showPicker(); } catch(e) { inp.focus(); } } else inp.focus();
  };
  return (
    <div style={{ ...S.pill, flex:1, cursor:"pointer" }} onClick={abrir}>
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <IcoCal size={13} c="#9a9080"/>
        <span style={{ fontSize:"0.72rem", color:"#9a9080", fontWeight:600, letterSpacing:"0.02em" }}>Fecha</span>
      </div>
      <span style={{ fontWeight:fecha?700:400, fontSize:"0.9rem", color:fecha?"#1a1611":"#9a9080" }}>
        {textoFecha}
      </span>
      <input ref={inputRef} type="date" min={hoy} value={fecha}
        onChange={e => setFecha(e.target.value)}
        style={{ position:"absolute", opacity:0, pointerEvents:"none", width:0, height:0, top:0, left:0 }}
        tabIndex={-1}
      />
    </div>
  );
}

// ── HoraPicker ────────────────────────────────────────────────────────────────
function HoraPicker({ hora, setHora, horas=HORAS_BASE, label="Hora", placeholder="Elige hora", disabled=false }) {
  const selectRef = useRef(null);
  return (
    <div style={{ ...S.pill, flex:1, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1 }}
      onClick={() => !disabled && selectRef.current?.focus()}>
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9a9080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        <span style={{ fontSize:"0.72rem", color:"#9a9080", fontWeight:600, letterSpacing:"0.02em" }}>{label}</span>
      </div>
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        <select ref={selectRef} value={hora} onChange={e => setHora(e.target.value)} disabled={disabled}
          style={{ ...S.select, fontWeight:hora?700:400, color:hora?"#1a1611":"#9a9080", fontSize:"0.9rem", paddingRight:16 }}>
          <option value="">{placeholder}</option>
          {horas.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <svg style={{ position:"absolute", right:0, pointerEvents:"none" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9a9080" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  );
}

// ── TipoRutaPicker ────────────────────────────────────────────────────────────
function TipoRutaPicker({ tipoRuta, setTipoRuta }) {
  return (
    <div style={{ display:"flex", gap:8 }}>
      {[
        { id:"ida",        label:"✈️ Solo ida" },
        { id:"ida_vuelta", label:"🔄 Ida y vuelta" },
      ].map(op => (
        <button key={op.id} onClick={() => setTipoRuta(op.id)} style={{
          flex:1, padding:"10px 14px", borderRadius:12,
          border: tipoRuta===op.id ? "2px solid #1a1611" : "1.5px solid #D4CBB8",
          background: tipoRuta===op.id ? "#1a1611" : "#EDE5D0",
          color: tipoRuta===op.id ? "#F5EDD8" : "#6b5e4e",
          fontFamily:"'DM Sans',sans-serif", fontSize:"0.85rem",
          fontWeight: tipoRuta===op.id ? 700 : 500,
          cursor:"pointer", transition:"all .18s", whiteSpace:"nowrap",
        }}>
          {op.label}
        </button>
      ))}
    </div>
  );
}

// ── LugarInput ────────────────────────────────────────────────────────────────
const EJEMPLOS_DIRECCIONES = [
  "Los Leones 01256, Temuco","Av. Alemania 0480, Temuco",
  "O'Higgins 310, Villarrica","Urrutia 477, Pucón",
  "Caupolicán 285, Temuco","Freire 250, Villarrica",
  "Colo-Colo 355, Temuco","Lincoyan 542, Pucón",
];

function PlaceholderTicker() {
  const [idx,setIdx]       = useState(0);
  const [estado,setEstado] = useState("visible");
  useEffect(() => {
    const c = setInterval(() => {
      setEstado("saliendo");
      setTimeout(() => { setIdx(i=>(i+1)%EJEMPLOS_DIRECCIONES.length); setEstado("entrando"); setTimeout(()=>setEstado("visible"),20); },300);
    },2800);
    return ()=>clearInterval(c);
  },[]);
  const T={visible:"translateX(0)",saliendo:"translateX(-120%)",entrando:"translateX(60%)"};
  const O={visible:1,saliendo:0,entrando:0};
  return (
    <span style={{ display:"block", overflow:"hidden", flex:1, pointerEvents:"none" }}>
      <span style={{ display:"block", fontSize:"0.9rem", color:"#B8AFA0", fontFamily:"'DM Sans',sans-serif", fontWeight:400, whiteSpace:"nowrap", transform:T[estado], opacity:O[estado], transition:estado==="saliendo"?"transform 0.28s cubic-bezier(.4,0,1,1), opacity 0.22s ease":estado==="visible"?"transform 0.38s cubic-bezier(.2,.8,.3,1), opacity 0.28s ease":"none", willChange:"transform, opacity" }}>
        {EJEMPLOS_DIRECCIONES[idx]}
      </span>
    </span>
  );
}

function LugarInput({ placeholder, value, onChange, dotStyle, disabled, historial=[], onEliminarHistorial }) {
  const [query,setQuery]           = useState("");
  const [abierto,setAbierto]       = useState(false);
  const [activo,setActivo]         = useState(false);
  const [resultados,setResultados] = useState([]);
  const [buscando,setBuscando]     = useState(false);
  const [geolocando,setGeolocando] = useState(false);
  const [geoFallback,setGeoFallback] = useState(false);
  const wrapRef=useRef(null), timerRef=useRef(null), inputRef=useRef(null);

  const ubicarme = (silencioso=false) => {
    if (!navigator.geolocation) { if (!silencioso) alert("Tu navegador no soporta geolocalización."); setGeoFallback(true); return; }
    if (location.protocol!=="https:" && location.hostname!=="localhost") { if (!silencioso) alert("La geolocalización precisa requiere conexión segura (https)."); setGeoFallback(true); return; }
    setGeolocando(true);
    navigator.geolocation.getCurrentPosition(
      async ({coords}) => {
        try {
          const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=es&zoom=18`);
          const data=await res.json();
          const label=[data.address?.road,data.address?.house_number,data.address?.suburb||data.address?.neighbourhood||data.address?.city_district,data.address?.city||data.address?.town].filter(Boolean).join(", ");
          const labelFinal=label||data.display_name.split(",").slice(0,3).join(",").trim();
          onChange({label:labelFinal,lat:coords.latitude,lng:coords.longitude}); setQuery(labelFinal); setGeoFallback(false);
        } catch { if (!silencioso) setQuery("No se pudo obtener la dirección"); setGeoFallback(true); }
        finally { setGeolocando(false); }
      },
      ()=>{setGeolocando(false);setGeoFallback(true);},
      {enableHighAccuracy:true,timeout:8000,maximumAge:0}
    );
  };

  useEffect(()=>{if(dotStyle==="origen"&&!value)ubicarme(true);},[]);// eslint-disable-line
  useEffect(()=>{if(!activo)setQuery(value?value.label:"");},[value,activo]);
  useEffect(()=>{
    const fn=(e)=>{if(!wrapRef.current?.contains(e.target)){setAbierto(false);setActivo(false);}};
    document.addEventListener("mousedown",fn); return ()=>document.removeEventListener("mousedown",fn);
  },[]);
  useEffect(()=>{
    clearTimeout(timerRef.current);
    if(query.length<3){setResultados([]);return;}
    timerRef.current=setTimeout(async()=>{setBuscando(true);const res=await buscarDirecciones(query);setResultados(res);setBuscando(false);},400);
    return ()=>clearTimeout(timerRef.current);
  },[query]);

  const frecuentes   = PUNTOS_FRECUENTES.filter(p=>!query||p.label.toLowerCase().includes(query.toLowerCase())||p.sub.toLowerCase().includes(query.toLowerCase()));
  const histFiltrado = historial.filter(h=>!query||h.label.toLowerCase().includes(query.toLowerCase()));
  const seleccionar  = (punto)=>{onChange(punto);setQuery(punto.label.replace(/^[^\w\s]{1,3}\s*/,"").trim());setAbierto(false);setActivo(false);setResultados([]);};
  const dot = dotStyle==="origen" ? <div style={S.dotOrigen}/> : <div style={S.dotDestino}/>;
  const mostrarDropdown = abierto&&(frecuentes.length>0||resultados.length>0||histFiltrado.length>0||buscando||query.length>=3);

  return (
    <div ref={wrapRef} style={{position:"relative"}}>
      <div style={{...S.searchBoxSingle, borderColor:activo?"#1a1611":"#D4CBB8", boxShadow:activo?"0 0 0 2px rgba(26,22,17,.12)":"0 2px 12px rgba(26,22,17,.06)", opacity:disabled?0.5:1, transition:"border-color .2s, box-shadow .2s"}}>
        <div style={S.searchRow}>
          {dot}
          <div style={{flex:1,position:"relative",display:"flex",alignItems:"center",overflow:"hidden"}}>
            <input ref={inputRef} value={query}
              onChange={e=>{setQuery(e.target.value);setAbierto(true);}}
              onFocus={()=>{setActivo(true);setAbierto(true);}}
              onBlur={()=>setTimeout(()=>{if(!wrapRef.current?.contains(document.activeElement)){setActivo(false);setAbierto(false);}},150)}
              placeholder={activo?placeholder:""} disabled={disabled} autoComplete="off"
              style={{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:"0.95rem",fontFamily:"'DM Sans',sans-serif",fontWeight:value?600:400,color:value?"#1a1611":"#9a9080",caretColor:(!activo&&!query)?"transparent":undefined}}
            />
            {dotStyle==="origen"&&!value&&!query&&!activo&&!geolocando&&(
              <div style={{position:"absolute",left:0,right:0,top:0,bottom:0,display:"flex",alignItems:"center",pointerEvents:"none",overflow:"hidden"}}><PlaceholderTicker/></div>
            )}
            {dotStyle==="origen"&&geolocando&&!value&&(
              <div style={{position:"absolute",left:0,display:"flex",alignItems:"center",gap:6,pointerEvents:"none"}}>
                <span className="btn-spinner" style={{width:13,height:13,borderWidth:1.5,borderTopColor:"#9a9080",borderColor:"#D4CBB8"}}/>
                <span style={{fontSize:"0.82rem",color:"#B8AFA0"}}>Buscando tu ubicación…</span>
              </div>
            )}
          </div>
          {buscando&&<span className="btn-spinner" style={{width:14,height:14,borderWidth:1.5,borderTopColor:"#9a9080",borderColor:"#D4CBB8",flexShrink:0}}/>}
          {value&&!buscando&&(
            <button onMouseDown={e=>{e.preventDefault();onChange(null);setQuery("");setResultados([]);}}
              style={{background:"none",border:"none",cursor:"pointer",width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",color:"#C8BEA8",fontSize:"1.1rem",lineHeight:1,flexShrink:0}}>×</button>
          )}
          {dotStyle==="origen"&&!value&&!buscando&&(
            <button onMouseDown={e=>{e.preventDefault();ubicarme(false);}} title="Usar mi ubicación actual"
              style={{background:"none",border:"none",cursor:geolocando?"wait":"pointer",width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",color:geolocando?"#C8BEA8":"#9a9080",transition:"color .2s",flexShrink:0}}>
              {geolocando
                ? <span className="btn-spinner" style={{width:14,height:14,borderWidth:1.5,borderTopColor:"#9a9080",borderColor:"#D4CBB8"}}/>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8" strokeDasharray="2 3"/></svg>
              }
            </button>
          )}
        </div>
      </div>

      {mostrarDropdown&&(
        <div style={S.dropdown}>
          {dotStyle==="origen"&&!value&&(
            <button className="drop-item" onMouseDown={e=>{e.preventDefault();ubicarme();setAbierto(false);}} style={{borderBottom:"1px solid #F0EBE0"}}>
              <div style={{...S.dropIcon,background:"#EEF9F0"}}>📍</div>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{fontSize:"0.85rem",fontWeight:600,color:"#1a7a3f"}}>{geolocando?"Obteniendo ubicación…":"Usar mi ubicación actual"}</div>
                <div style={{fontSize:"0.72rem",color:"#9a9080",marginTop:1}}>GPS del dispositivo</div>
              </div>
            </button>
          )}
          {histFiltrado.length>0&&(<>
            <div style={S.dropHeader}>Usadas recientemente</div>
            {histFiltrado.map((h,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center"}}>
                <button className="drop-item" style={{flex:1}} onMouseDown={()=>seleccionar(h)}>
                  <div style={{...S.dropIcon,background:"#F0EBE0"}}>🕐</div>
                  <div style={{flex:1,textAlign:"left",minWidth:0}}>
                    <div style={{fontSize:"0.85rem",fontWeight:600,color:"#1a1611",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.label}</div>
                    {h.sub&&<div style={{fontSize:"0.72rem",color:"#9a9080",marginTop:1}}>{h.sub}</div>}
                  </div>
                </button>
                <button onMouseDown={e=>{e.preventDefault();e.stopPropagation();onEliminarHistorial?.(h.label);}}
                  style={{background:"none",border:"none",cursor:"pointer",width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",color:"#C8BEA8",fontSize:"1rem",flexShrink:0}}>×</button>
              </div>
            ))}
          </>)}
          {frecuentes.length>0&&(<>
            <div style={S.dropHeader}>Rutas frecuentes</div>
            {frecuentes.map(p=>(
              <button key={p.id} className="drop-item" onMouseDown={()=>seleccionar(p)}>
                <div style={S.dropIcon}>{p.label.slice(0,2)}</div>
                <div style={{flex:1,textAlign:"left",minWidth:0}}>
                  <div style={{fontSize:"0.85rem",fontWeight:600,color:"#1a1611",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.label.replace(/^[^\w\s]{1,3}\s*/,"")}</div>
                  <div style={{fontSize:"0.72rem",color:"#9a9080",marginTop:1}}>{p.sub}</div>
                </div>
              </button>
            ))}
          </>)}
          {resultados.length>0&&(<>
            <div style={S.dropHeader}>Resultados</div>
            {resultados.map((r,i)=>(
              <button key={i} className="drop-item" onMouseDown={()=>seleccionar(r)}>
                <div style={{...S.dropIcon,fontSize:"0.9rem"}}>📍</div>
                <div style={{flex:1,textAlign:"left",minWidth:0}}>
                  <div style={{fontSize:"0.85rem",fontWeight:600,color:"#1a1611",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.label}</div>
                  {r.sub&&<div style={{fontSize:"0.72rem",color:"#9a9080",marginTop:1}}>{r.sub}</div>}
                </div>
              </button>
            ))}
          </>)}
          {buscando&&(
            <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:8,color:"#9a9080",fontSize:"0.8rem"}}>
              <span className="btn-spinner" style={{width:13,height:13,borderWidth:1.5,borderTopColor:"#9a9080",borderColor:"#D4CBB8"}}/>
              Buscando direcciones…
            </div>
          )}
          {!buscando&&query.length>=3&&resultados.length===0&&frecuentes.length===0&&histFiltrado.length===0&&(
            <div style={S.dropAviso}><span>🔍</span><span>Sin resultados para "{query}"</span></div>
          )}
        </div>
      )}
    </div>
  );
}

// ── FrasesRotativas ───────────────────────────────────────────────────────────
const FRASES = [
  {texto:"Una nueva forma de viajar",           emoji:"✨"},
  {texto:"Más económico que un taxi",           emoji:"💸"},
  {texto:"Más cómodo que el bus",               emoji:"😌"},
  {texto:"Más personalizado, siempre",          emoji:"🎯"},
  {texto:"Sin filas. Sin esperas.",             emoji:"⚡"},
  {texto:"Tu ruta, a tu hora",                 emoji:"🕐"},
  {texto:"Paga solo cuando se confirma",        emoji:"🙌"},
  {texto:"De puerta a puerta en la Araucanía",  emoji:"🏔️"},
];
function FrasesRotativas() {
  const [idx,setIdx]=[useState(0)[0],useState(0)[1]];
  const [_idx,_setIdx] = useState(0);
  const [estado,setEstado] = useState("visible");
  useEffect(()=>{
    const c=setInterval(()=>{
      setEstado("saliendo");
      setTimeout(()=>{_setIdx(i=>(i+1)%FRASES.length);setEstado("entrando");setTimeout(()=>setEstado("visible"),30);},380);
    },3200);
    return ()=>clearInterval(c);
  },[]);
  const frase=FRASES[_idx];
  const tM={visible:"translateX(0) scale(1)",saliendo:"translateX(-28px) scale(0.94)",entrando:"translateX(22px) scale(0.96)"};
  const oM={visible:1,saliendo:0,entrando:0};
  return (
    <div style={{overflow:"hidden",margin:"8px 0 12px",height:30,display:"flex",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:7,transform:tM[estado],opacity:oM[estado],transition:estado==="saliendo"?"transform 0.35s cubic-bezier(.4,0,.6,1), opacity 0.28s ease":estado==="visible"?"transform 0.4s cubic-bezier(.2,.8,.4,1), opacity 0.32s ease":"none",willChange:"transform, opacity"}}>
        <span style={{display:"inline-flex",alignItems:"center",gap:5,background:"#1a1611",color:"#F5EDD8",borderRadius:99,padding:"3px 11px 3px 7px",fontSize:"0.78rem",fontWeight:700,letterSpacing:"-0.01em",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif"}}>
          <span style={{fontSize:"0.82rem",lineHeight:1}}>{frase.emoji}</span>
          {frase.texto}
        </span>
      </div>
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ label, val, bold }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.6rem 0",borderBottom:"1px solid #E8E0D0"}}>
      <span style={{fontSize:"0.82rem",color:"#9a9080"}}>{label}</span>
      <span style={{fontSize:bold?"1rem":"0.85rem",fontWeight:bold?800:600,color:"#1a1611"}}>{val}</span>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input, select, textarea { font-size: 16px !important; }
  html, body { overflow-x: hidden; max-width: 100%; }
  @media (max-width: 380px) {
    .btn-confirmar { font-size: 0.85rem !important; padding: 13px !important; }
    .btn-flow      { font-size: 0.85rem !important; padding: 13px !important; }
    .tarifa-card   { padding: 0.85rem 0.9rem !important; gap: 10px !important; }
    .ruta-row      { padding: 11px 4px !important; }
    .pago-opt      { padding: 0.75rem 0.8rem !important; }
  }
  @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .fade-in { animation: fadeIn 0.3s ease both; }
  select { appearance: none; -webkit-appearance: none; }
  select option { background: #EDE5D0; color: #1a1611; }
  .btn-back { width:44px; height:44px; border-radius:50%; border:1.5px solid #D4CBB8; background:#EDE5D0; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .15s; }
  .btn-back:hover { background: #D4CBB8; }
  .btn-confirmar { width:100%; padding:clamp(14px,4vw,17px); background:#1a1611; color:#F5EDD8; border:none; border-radius:14px; font-size:clamp(0.9rem,4vw,1rem); font-weight:800; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; box-shadow:0 4px 20px rgba(26,22,17,.2); letter-spacing:-0.01em; display:flex; align-items:center; justify-content:center; gap:6px; }
  .btn-confirmar:hover:not(:disabled) { background:#2d2820; transform:translateY(-1px); box-shadow:0 6px 28px rgba(26,22,17,.28); }
  .btn-confirmar:disabled { background:#D4CBB8; color:#9a9080; cursor:not-allowed; box-shadow:none; }
  .btn-wa { width:100%; padding:15px; display:flex; align-items:center; justify-content:center; gap:8px; background:#22c55e; color:#fff; border:none; border-radius:14px; font-size:0.95rem; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; box-shadow:0 4px 16px rgba(34,197,94,.3); }
  .btn-wa:hover { background: #16a34a; }
  .btn-ghost { width:100%; padding:14px; background:transparent; color:#9a9080; border:1.5px solid #D4CBB8; border-radius:14px; font-size:0.88rem; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; }
  .btn-ghost:hover { border-color:#9a9080; color:#3d3629; }
  .tarifa-card { display:flex; align-items:center; gap:14px; padding:1.1rem 1.15rem; border-radius:16px; border:1.5px solid #D4CBB8; background:#EDE5D0; cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif; text-align:left; width:100%; }
  .tarifa-card:hover { border-color:#9a9080; background:#E8E0D0; }
  .tarifa-on { border-color:#1a1611 !important; background:#F5EDD8 !important; box-shadow:0 0 0 2px #1a1611; }
  .pago-opt { display:flex; flex-direction:column; gap:4px; padding:1rem; border-radius:14px; border:1.5px solid #D4CBB8; background:#EDE5D0; color:#1a1611; cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif; text-align:left; }
  .pago-opt:hover { border-color:#9a9080; }
  .pago-opt-on { border-color:#1a1611 !important; background:#1a1611 !important; color:#F5EDD8 !important; }
  .ruta-row { display:flex; align-items:center; gap:14px; padding:14px 4px; width:100%; background:transparent; border:none; border-bottom:1px solid #E8E0D0; cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif; }
  .ruta-row:hover { padding-left:10px; padding-right:10px; background:#EDE5D0; border-radius:12px; border-bottom-color:transparent; }
  .ruta-row:last-child { border-bottom:none; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .btn-flow { width:100%; padding:17px; display:flex; align-items:center; justify-content:center; gap:8px; background:#c0290e; color:#fff; border:none; border-radius:14px; font-size:1rem; font-weight:800; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; box-shadow:0 4px 20px rgba(192,41,14,.3); }
  .btn-flow:hover:not(:disabled) { background:#a5230c; transform:translateY(-1px); }
  .btn-flow:disabled { opacity:0.5; cursor:not-allowed; box-shadow:none; }
  .btn-mis-reservas { width:100%; padding:13px; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:8px; background:transparent; color:#1a1611; border:1.5px solid #1a1611; border-radius:14px; font-size:0.88rem; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; }
  .btn-mis-reservas:hover { background:#1a1611; color:#fff; }
  .btn-spinner { width:17px; height:17px; border-radius:50%; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; animation:spin .7s linear infinite; display:inline-block; flex-shrink:0; }
  .drop-item { display:flex; align-items:center; gap:12px; width:100%; padding:10px 16px; background:transparent; border:none; cursor:pointer; transition:background .15s; font-family:'DM Sans',sans-serif; min-height:44px; }
  .drop-item:hover { background:#FAF7F2; }
`;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root:        { background:"#ffffff", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", overflowX:"hidden" },
  wrap:        { maxWidth:480, width:"100%", margin:"0 auto", padding:"0 clamp(14px,4vw,24px) 80px", boxSizing:"border-box" },
  saludoRow:   { display:"flex", justifyContent:"space-between", alignItems:"flex-start", paddingTop:"clamp(1.25rem,5vw,2.5rem)", paddingBottom:"1.25rem" },
  saludoSub:   { fontSize:"0.85rem", color:"#9a9080", marginBottom:4, fontWeight:500 },
  saludoTitle: { fontFamily:"'Syne',sans-serif", fontSize:"clamp(1.5rem,6vw,2.2rem)", fontWeight:800, color:"#1a1611", lineHeight:1.12 },
  searchBoxSingle: { background:"#EDE5D0", border:"1px solid #D4CBB8", borderRadius:16, boxShadow:"0 2px 12px rgba(26,22,17,.06)", transition:"border-color .2s, box-shadow .2s" },
  arrowSep:    { display:"flex", alignItems:"center", justifyContent:"center", height:22, position:"relative" },
  swapBtn:     { width:44, height:44, borderRadius:"50%", background:"#fff", border:"1.5px solid #D4CBB8", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#9a9080", transition:"all .2s", boxShadow:"0 1px 6px rgba(26,22,17,.08)", zIndex:1 },
  dropdown:    { position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#fff", border:"1px solid #E0D8CC", borderRadius:14, boxShadow:"0 8px 32px rgba(26,22,17,.14)", zIndex:9999, overflow:"hidden" },
  dropHeader:  { padding:"8px 16px 4px", fontSize:"0.67rem", fontWeight:700, color:"#C8BEA8", textTransform:"uppercase", letterSpacing:"0.07em" },
  dropIcon:    { width:34, height:34, borderRadius:10, background:"#F0EBE0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 },
  dropAviso:   { display:"flex", alignItems:"flex-start", gap:8, padding:"10px 16px", margin:"4px 8px 8px", background:"#FDF9F3", border:"1px solid #E8E0D0", borderRadius:10, fontSize:"0.72rem", color:"#9a9080", lineHeight:1.5 },
  searchRow:   { display:"flex", alignItems:"center", gap:10, padding:"10px 14px" },
  select:      { flex:1, background:"transparent", border:"none", outline:"none", fontSize:"0.95rem", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", fontWeight:500 },
  dotOrigen:   { width:10, height:10, borderRadius:"50%", border:"2.5px solid #1a1611", flexShrink:0 },
  dotDestino:  { width:10, height:10, borderRadius:2, background:"#1a1611", flexShrink:0 },
  pill:        { background:"#EDE5D0", border:"1px solid #D4CBB8", borderRadius:14, padding:"11px 16px", display:"flex", flexDirection:"column", gap:3, position:"relative", boxShadow:"0 2px 10px rgba(26,22,17,.05)" },
  rutaIcoSmall:{ width:38, height:38, borderRadius:10, background:"#E8E0D0", border:"1px solid #D4CBB8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 },
  topBar:      { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.5rem 0 1rem" },
  topTitle:    { fontFamily:"'Syne',sans-serif", fontSize:"clamp(0.9rem,4vw,1.05rem)", fontWeight:800, color:"#1a1611" },
  rutaPill:    { background:"#EDE5D0", border:"1px solid #D4CBB8", borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:16, boxShadow:"0 2px 12px rgba(26,22,17,.06)", overflow:"hidden" },
  rutaDot:     { display:"flex", flexDirection:"column", alignItems:"center", gap:2, flexShrink:0 },
  rutaTexto:   { fontSize:"0.88rem", fontWeight:700, color:"#1a1611", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  rutaLinea:   { height:14, width:1, background:"#D4CBB8", margin:"4px 0" },
  pillMeta:    { fontSize:"0.72rem", color:"#9a9080", lineHeight:1.8, whiteSpace:"nowrap" },
  tarifaIco:   { width:52, height:52, borderRadius:14, background:"#E8E0D0", border:"1px solid #D4CBB8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  badge:       { fontSize:"0.65rem", background:"#1a1611", color:"#F5EDD8", padding:"2px 8px", borderRadius:99, fontWeight:700, whiteSpace:"nowrap" },
  badgeIV:     { display:"flex", alignItems:"center", gap:6, background:"rgba(192,41,14,0.07)", border:"1px solid rgba(192,41,14,0.2)", borderRadius:10, padding:"7px 12px", marginBottom:4, fontSize:"0.73rem", color:"#c0290e", fontWeight:600 },
  section:     { padding:"0.5rem 0 1rem", borderBottom:"1px solid #E8E0D0", marginBottom:"1rem" },
  sectionLabel:{ fontSize:"0.72rem", fontWeight:700, color:"#9a9080", letterSpacing:"0.06em", marginBottom:"0.6rem" },
  aviso:       { display:"flex", gap:10, background:"rgba(245,193,7,0.1)", border:"1px solid rgba(245,193,7,0.3)", borderRadius:12, padding:"0.9rem", marginBottom:"1rem" },
  usuarioRow:  { display:"flex", alignItems:"center", gap:12 },
  avatar:      { width:42, height:42, borderRadius:"50%", background:"#1a1611", color:"#F5EDD8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", fontWeight:800, flexShrink:0 },
  totalBox:    { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1rem 0", marginBottom:"1rem" },
  errBox:      { padding:"0.8rem 1rem", background:"rgba(192,41,14,0.08)", border:"1px solid rgba(192,41,14,0.2)", borderRadius:10, color:"#c0290e", fontSize:"0.82rem", marginBottom:"0.75rem" },
  okWrap:      { maxWidth:480, width:"100%", margin:"0 auto", padding:"clamp(2rem,8vw,4rem) clamp(14px,4vw,24px) 80px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", boxSizing:"border-box" },
  okCircle:    { width:72, height:72, borderRadius:"50%", background:"#1a1611", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 },
  okTitle:     { fontFamily:"'Syne',sans-serif", fontSize:"clamp(1.4rem,5vw,1.8rem)", fontWeight:800, color:"#1a1611", marginBottom:8 },
  okSub:       { fontSize:"0.85rem", color:"#9a9080", lineHeight:1.6, maxWidth:300, marginBottom:24 },
  okCard:      { background:"#EDE5D0", border:"1px solid #D4CBB8", borderRadius:16, padding:"0.5rem 1.25rem", width:"100%", marginBottom:24 },
  regresoBox:  { background:"#F0EBE0", border:"1.5px solid #D4CBB8", borderRadius:14, padding:"14px 16px", marginTop:10 },
  infoIV:      { display:"flex", alignItems:"flex-start", gap:8, background:"#F5EDD8", border:"1px solid #E8D8B0", borderRadius:10, padding:"10px 14px", marginTop:8, fontSize:"0.74rem", color:"#6b5e4e", lineHeight:1.5 },
};