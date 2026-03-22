import React, { useState, useEffect, useRef } from "react";
import supabase from "../lib/supabase";

const WHATSAPP_NUMBER    = "56951569704";
const MAX_ASIENTOS       = 10;
const PAX_COMPARTIDO     = 10;
const MARGEN_COMP        = 1.25;
const RECARGO_IDA_VUELTA = 1.5;

const PRECIO_VAN_BASE = 40000;
const PRECIO_KM_VAN   = 1000;
const PRECIO_MIN_VAN  = 40000;

const paxDesdeVan = (precioVan) =>
  Math.round((precioVan * MARGEN_COMP) / PAX_COMPARTIDO / 500) * 500;

const aplicarRecargo = (monto, esIdaVuelta) =>
  esIdaVuelta ? Math.round(monto * RECARGO_IDA_VUELTA) : monto;

const uuid = () => crypto.randomUUID?.() ||
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });

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
  "pucon-aeropuerto":      "Pucón → Temuco ZCO",
  "villarrica-aeropuerto": "Villarrica → Temuco ZCO",
  "aeropuerto-pucon":      "Temuco ZCO → Pucón",
  "aeropuerto-villarrica": "Temuco ZCO → Villarrica",
};

const fmt    = (str) => { if (!str) return ""; const [y,m,d]=str.split("-"); return new Date(y,m-1,d).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"}); };
const precio = (n)   => `$${Math.round(n).toLocaleString("es-CL")}`;
const hoy    = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

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
async function obtenerOCrearViaje({ rutaKey, origenId, destinoId, fecha, hora, tipo, precio_por_pax, origenLabel, destinoLabel }) {
  const rutaNombre = RUTA_NOMBRE[rutaKey] || `${origenLabel || origenId} → ${destinoLabel || destinoId}`;
  const { data: rutaExistente } = await supabase.from("rutas").select("id").eq("nombre", rutaNombre).maybeSingle();
  let rutaId = rutaExistente?.id;
  if (!rutaId) {
    const { data: nuevaRuta, error: errRuta } = await supabase.from("rutas")
      .insert({ nombre:rutaNombre, origen:origenLabel||"", destino:destinoLabel||"", activa:true })
      .select("id").single();
    if (errRuta) throw new Error("No se pudo crear la ruta");
    rutaId = nuevaRuta?.id;
  }
  if (!rutaId) throw new Error("No se pudo obtener la ruta");
  const { data: viajeExistente } = await supabase.from("viajes").select("id, capacidad, estado")
    .eq("ruta_id", rutaId).eq("fecha", fecha).eq("tipo", tipo).not("estado","eq","cancelado").maybeSingle();
  if (viajeExistente) return viajeExistente.id;
  const { data: nuevoViaje, error } = await supabase.from("viajes")
    .insert({ ruta_id:rutaId, tipo, fecha, hora_salida: hora || "08:00", capacidad: tipo==="compartido" ? MAX_ASIENTOS : 8, precio_por_pax, estado:"en_espera" })
    .select("id").single();
  if (error) throw new Error("No se pudo crear el viaje");
  return nuevoViaje.id;
}

async function contarAsientosOcupados(rutaKey, fecha) {
  const rutaNombre = RUTA_NOMBRE[rutaKey];
  if (!rutaNombre) return 0;
  const { data: viaje } = await supabase.from("viajes").select("id").eq("fecha",fecha).eq("tipo","compartido").not("estado","eq","cancelado").maybeSingle();
  if (!viaje) return 0;
  const { data: reservas } = await supabase.from("reservas").select("num_asientos").eq("viaje_id",viaje.id).neq("estado","cancelada");
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
  "aeropuerto-panguipulli": { van:110000, persona:paxDesdeVan(110000) },
  "panguipulli-aeropuerto": { van:110000, persona:paxDesdeVan(110000) },
  "aeropuerto-valdivia":    { van:140000, persona:paxDesdeVan(140000) },
  "valdivia-aeropuerto":    { van:140000, persona:paxDesdeVan(140000) },
  "temuco-panguipulli":     { van:110000, persona:paxDesdeVan(110000) },
  "panguipulli-temuco":     { van:110000, persona:paxDesdeVan(110000) },
  "temuco-valdivia":        { van:140000, persona:paxDesdeVan(140000) },
  "valdivia-temuco":        { van:140000, persona:paxDesdeVan(140000) },
  "pucon-panguipulli":      { van:50000,  persona:paxDesdeVan(50000)  },
  "panguipulli-pucon":      { van:50000,  persona:paxDesdeVan(50000)  },
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

const PUNTOS_FRECUENTES = [
  { id:"aeropuerto", label:"Temuco ZCO", sub:"Aeropuerto Araucanía · La Araucanía", lat:-38.9258, lng:-72.6372 },
  { id:"pucon",      label:"Pucón",                 sub:"Pucón, La Araucanía",               lat:-39.2724, lng:-71.9766 },
  { id:"villarrica", label:"Villarrica",             sub:"Villarrica, La Araucanía",          lat:-39.2833, lng:-72.2333 },
  { id:"panguipulli",label:"Panguipulli",            sub:"Panguipulli, Los Ríos",             lat:-39.6417, lng:-72.3333 },
  { id:"valdivia",   label:"Valdivia",               sub:"Valdivia, Los Ríos",                lat:-39.8142, lng:-73.2459 },
  { id:"victoria",   label:"Victoria",               sub:"Victoria, La Araucanía",            lat:-38.2317, lng:-72.3317 },
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

  const [fechaComp,    setFechaComp]    = useState("");
  const [horaComp,     setHoraComp]     = useState("");
  const [fechaVan,     setFechaVan]     = useState("");
  const [horaVan,      setHoraVan]      = useState("");
  const [tipoRuta,     setTipoRuta]     = useState("ida");
  const [horaRegreso,  setHoraRegreso]  = useState("");
  const [horaFlexible, setHoraFlexible] = useState(false);
  const [pasajeros,    setPasajeros]    = useState(1);
  const [tipoViaje,    setTipoViaje]    = useState("");
  const [modoPago,     setModoPago]     = useState("abono");
  const [enviando,     setEnviando]     = useState(false);
  const [reservaId,    setReservaId]    = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState(0);
  const [error,        setError]        = useState("");
  const [calculando,   setCalculando]   = useState(false);
  const [rutaDataDyn,  setRutaDataDyn]  = useState(null);

  // ── Bloqueos desde Supabase ───────────────────────────────────────────────
  const [bloqueos, setBloqueos] = useState([]);

  useEffect(() => {
    supabase.from("bloqueos").select("*").then(({ data }) => setBloqueos(data || []));
  }, []);

  useEffect(() => {
    const f = fechaComp || fechaVan;
    if (f) {
      supabase.from("bloqueos").select("*").then(({ data }) => setBloqueos(data || []));
    }
  }, [fechaComp, fechaVan]);

  const esBloqueadoPorTipo = (fechaStr, tipo) => {
    if (!fechaStr) return false;
    const f = new Date(fechaStr + "T12:00:00");
    return bloqueos.some(b => {
      const afecta = b.aplica_a === "ambos" || b.aplica_a === tipo;
      if (!afecta) return false;
      if (b.tipo === "dia") return b.fecha === fechaStr;
      if (b.tipo === "mes") return b.mes === f.getMonth()+1 && b.anio === f.getFullYear();
      return false;
    });
  };

  // fecha/hora activa según tipo seleccionado
  const fecha = tipoViaje === "van_completa" ? fechaVan : fechaComp;
  const hora  = tipoViaje === "van_completa" ? horaVan  : horaComp;
  const setFecha = tipoViaje === "van_completa" ? setFechaVan : setFechaComp;
  const setHora  = tipoViaje === "van_completa" ? setHoraVan  : setHoraComp;

  const fechaSeleccionada = tipoViaje === "van_completa" ? !!fechaVan  : !!fechaComp;
  const horaSeleccionada  = tipoViaje === "van_completa" ? !!horaVan   : !!horaComp;

  const sinCupoCompartido = esBloqueadoPorTipo(fechaComp, "compartido");
  const sinCupoPrivado    = esBloqueadoPorTipo(fechaVan,  "privado");

  const topRef = useRef(null);

  useEffect(() => { setRutaDataDyn(null); }, [origen, destino]);
  useEffect(() => { setHoraRegreso(""); setHoraFlexible(false); }, [tipoRuta]);
  useEffect(() => { setHoraRegreso(""); }, [horaComp]);

  const esIdaVuelta = tipoRuta === "ida_vuelta";

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
    if (origen && destino) verTarifas();
  }, [origen, destino]); // eslint-disable-line

  useEffect(() => {
    if (!rutaKey || !fechaComp || tipoViaje !== "compartido") return;
    contarAsientosOcupados(rutaKey, fechaComp).then(setAsientosOcupados);
  }, [rutaKey, fechaComp, tipoViaje]);

  const verTarifas = async () => {
    if (!origen || !destino) return;
    setCalculando(true); setError("");
    try {
      guardar(origen); guardar(destino);
      const metros  = await obtenerDistancia(origen, destino);
      const tarifas = calcularTarifas(metros, origen, destino);
      setRutaDataDyn({ ...tarifas, duracion:`~${Math.round(metros/1000/60)} min` });
    } catch {
      setError("No se pudo calcular la ruta.");
    } finally {
      setCalculando(false);
    }
  };

  // ── Navegar directo a confirmar calculando tarifas si hace falta ──────────
  // ── Reservar directo sin pantalla de confirmación ──────────────────────
  const reservarDirecto = async () => {
  if (!usuario) {
    setError("Debes iniciar sesión para reservar.");
    document.querySelector(".hdr__signin, .hdr__register")?.click();
    return;
  }
  setError("");

  // ── Verificación de bloqueo en tiempo real ──────────────
  const tipoCheck  = tipoViaje === "van_completa" ? "privado" : "compartido";
  const fechaCheck = tipoViaje === "van_completa" ? fechaVan  : fechaComp;

  // Re-consultar bloqueos frescos desde Supabase
  const { data: bloqueosFrescos } = await supabase.from("bloqueos").select("*");
  const bloqueosActuales = bloqueosFrescos || [];

  const estaBloqueado = bloqueosActuales.some(b => {
    const afecta = !b.aplica_a || b.aplica_a === "ambos" || b.aplica_a === tipoCheck;
    if (!afecta) return false;
    const f = new Date(fechaCheck + "T12:00:00");
    if (b.tipo === "dia") return b.fecha === fechaCheck;
    if (b.tipo === "mes") return b.mes === f.getMonth()+1 && b.anio === f.getFullYear();
    return false;
  });

  if (estaBloqueado) {
    setError(
      tipoCheck === "compartido"
        ? "El Transfer no está disponible en esta fecha. Puedes reservar una Van Privada."
        : "La Van Privada no está disponible en esta fecha."
    );
    return;
  }
  // ────────────────────────────────────────────────────────

  if (!rutaData) {
    await verTarifas();
  }
  await confirmar();
};

  const confirmar = async () => {
    setError(""); setEnviando(true);
    try {
      const grupoId   = esIdaVuelta ? uuid() : null;
      const tipo      = tipoViaje === "compartido" ? "compartido" : "privado";
      const precioPax = tipoViaje === "compartido" ? precioPersona : precioVan;

      const viajeId = await obtenerOCrearViaje({
        rutaKey, origenId, destinoId, fecha, hora, tipo,
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

      if (esIdaVuelta) {
        const rutaKeyRet = `${destinoId}-${origenId}`;
        const viajeIdRet = await obtenerOCrearViaje({
          rutaKey: rutaKeyRet, origenId: destinoId, destinoId: origenId,
          fecha, hora: horaRegreso || hora, tipo, precio_por_pax: precioPax,
          origenLabel: destino?.label || "", destinoLabel: origen?.label || "",
        });
        await supabase.from("reservas").insert([{
          viaje_id: viajeIdRet,
          nombre: usuario?.nombre || "", email: usuario?.email || "",
          telefono: usuario?.telefono || "",
          num_asientos: Number(pasajeros), estado: "pendiente",
          origen_reserva: "web", tipo_ruta: "ida", grupo_reserva: grupoId,
          hora_flexible: horaFlexible,
          notas: [tipoViaje === "van_completa" ? "Van privada" : "Compartido",
            `REGRESO (grupo: ${grupoId?.slice(0,8)})`,
            horaFlexible ? "⏰ Hora flexible — coordinar por WhatsApp" : `Hora: ${horaRegreso}`].join(" · "),
        }]);
      }

      if (tipoViaje === "van_completa") {
        const edgeFn = `https://pyloifgprupypgkhkqmx.supabase.co/functions/v1/flow-payment/create`;
        const res    = await fetch(edgeFn, {
          method:"POST",
          headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ reservaId: resIda.id, monto: aPagar, email: usuario?.email || "",
            descripcion: `Araucanía Viajes · ${rutaLabel} · ${fmt(fecha)} ${hora}${esIdaVuelta?" · Ida y vuelta":""}` }),
        });
        const json = await res.json();
        if (!res.ok || !json.urlPago) throw new Error(json.error || "No se pudo iniciar el pago");
        setEnviando(false);
        window.location.href = json.urlPago;
        return;
      }

      setEnviando(false);
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
      `🗺️ ${rutaLabel}\n📅 ${fmt(fecha)} · 🕐 ${hora}\n` +
      `🎫 ${esIdaVuelta?"Ida y vuelta":"Solo ida"} · 👥 ${pasajeros} pax` +
      regresoTxt + `\n\n💰 Total: ${precio(montoTotal)}\n` +
      (tipoViaje==="compartido"
        ? `⏳ *Sin costo ahora — se confirma al completar cupo.*\n`
        : `💳 Abono 50%: ${precio(aPagar)} — pagado vía Flow\n`) +
      `🆔 Ref: ${id}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`,"_blank");
  };

  const reset = () => {
    setPantalla("inicio"); setOrigen(null); setDestino(null);
    setFechaComp(""); setHoraComp(""); setFechaVan(""); setHoraVan("");
    setPasajeros(1); setTipoViaje(""); setModoPago("abono");
    setTipoRuta("ida"); setHoraRegreso(""); setHoraFlexible(false);
    setReservaId(null); setError(""); scroll();
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PANTALLA: OK
  // ════════════════════════════════════════════════════════════════════════════
  if (pantalla === "ok") return (
    <div ref={topRef} style={S.root}>
      <style>{css}</style>
      <div style={S.okWrap} className="fade-in">

        {/* Header compacto */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, marginBottom:16 }}>
          <div style={{ width:50, height:50, borderRadius:"50%", background:"#16a34a", boxShadow:"0 6px 20px rgba(22,163,74,0.35)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <IcoCheck size={24}/>
          </div>
          <div style={{ textAlign:"center" }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(1.2rem,5vw,1.45rem)", fontWeight:800, color:"#1a1611", marginBottom:2 }}>
              {tipoViaje==="compartido" ? "¡Reserva confirmada!" : "¡Van reservada!"}
            </h2>
            <p style={{ fontSize:"0.76rem", color:"#9a9080", lineHeight:1.4 }}>
              {tipoViaje==="compartido"
                ? "Sin costo ahora · Te avisamos cuando se llene el cupo"
                : "Tu van está reservada"}
            </p>
          </div>
        </div>

        {/* Card compacta */}
        <div style={{ background:"#EDE5D0", border:"1px solid #D4CBB8", borderRadius:16, width:"100%", marginBottom:12, overflow:"hidden" }}>

          {/* Ruta — fila horizontal con subetiquetas */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderBottom:"1px solid #D4CBB8", background:"#E8E0D0" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#1a1611", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {origen?.label || ""}
              </div>
              {(origen?.id === "aeropuerto" || (origen?.label || "").toLowerCase().includes("zco")) && (
                <div style={{ fontSize:"0.68rem", color:"#9a9080", marginTop:1 }}>Aeropuerto de Temuco</div>
              )}
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9a9080" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <div style={{ flex:1, minWidth:0, textAlign:"right" }}>
              <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#1a1611", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {destino?.label || ""}
              </div>
              {(destino?.id === "aeropuerto" || (destino?.label || "").toLowerCase().includes("zco")) && (
                <div style={{ fontSize:"0.68rem", color:"#9a9080", marginTop:1 }}>Aeropuerto de Temuco</div>
              )}
            </div>
          </div>

          {/* Grilla 2x2 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
            <div style={{ padding:"10px 16px", borderBottom:"1px solid #D4CBB8", borderRight:"1px solid #D4CBB8" }}>
              <div style={{ fontSize:"0.62rem", color:"#9a9080", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:3 }}>Salida</div>
              <div style={{ fontSize:"0.8rem", fontWeight:700, color:"#1a1611" }}>{fmt(fecha)}</div>
              <div style={{ fontSize:"0.78rem", fontWeight:600, color:"#6b5e4e", marginTop:1 }}>{hora}</div>
            </div>
            <div style={{ padding:"10px 16px", borderBottom:"1px solid #D4CBB8" }}>
              <div style={{ fontSize:"0.62rem", color:"#9a9080", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:3 }}>Servicio</div>
              <div style={{ fontSize:"0.8rem", fontWeight:700, color:"#1a1611" }}>
                {tipoViaje==="compartido" ? "Transfer" : "Van privada"}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:2, marginTop:3 }}>
                {tipoViaje==="compartido"
                  ? Array.from({ length: Math.min(pasajeros,5) }).map((_,i) => (
                      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b5e4e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    ))
                  : <span style={{ fontSize:"0.7rem", color:"#6b5e4e" }}>Exclusivo</span>
                }
                {tipoViaje==="compartido" && pasajeros > 5 && <span style={{ fontSize:"0.68rem", color:"#9a9080" }}>+{pasajeros-5}</span>}
              </div>
            </div>

            {/* Total */}
            <div style={{ gridColumn:"1/-1", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"0.62rem", color:"#9a9080", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:2 }}>
                  {tipoViaje==="compartido" ? "Total al confirmar cupo" : "Total"}
                </div>
                {tipoViaje==="compartido" && (
                  <div style={{ fontSize:"0.68rem", color:"#16a34a", fontWeight:600 }}>✓ Sin cargo ahora</div>
                )}
              </div>
              <span style={{ fontSize:"1.45rem", fontWeight:800, color:"#1a1611", letterSpacing:"-0.02em" }}>
                {precio(montoTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA WhatsApp */}
        <button className="btn-wa" onClick={() => abrirWhatsApp(reservaId)} style={{ marginBottom:6 }}>
          <IcoWA/> Confirmar por WhatsApp
        </button>
        <p style={{ fontSize:"0.68rem", color:"#9a9080", textAlign:"center", marginBottom:10, lineHeight:1.4 }}>
          Envía los detalles a nuestro equipo por WhatsApp
        </p>

        <div style={{ display:"flex", gap:8, width:"100%" }}>
          <button className="btn-ghost" onClick={reset} style={{ flex:1, padding:"12px" }}>Nueva reserva</button>
          <button className="btn-mis-reservas" style={{ flex:1, margin:0, padding:"12px" }} onClick={() => document.dispatchEvent(new CustomEvent("openMisReservas"))}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            Mis reservas
          </button>
        </div>
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
            <button className="btn-back" onClick={() => ir("inicio")}><IcoChevron dir="left" c="#1a1611" size={20}/></button>
            <span style={S.topTitle}>Confirmar viaje</span>
            <div style={{ width:44 }}/>
          </div>
          <div style={{ textAlign:"center", padding:"2rem 0 1rem" }}>
            <div style={{ fontSize:"2rem", marginBottom:10 }}>🔐</div>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:"#1a1611", marginBottom:6 }}>Inicia sesión para confirmar</h3>
            <p style={{ color:"#9a9080", fontSize:"0.82rem", lineHeight:1.6, marginBottom:20 }}>Tus datos se cargan automáticamente.<br/>No necesitas escribir nada al reservar.</p>
            <button className="btn-confirmar" onClick={() => document.querySelector('.hdr__signin, .hdr__register')?.click()}>
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
            <button className="btn-back" onClick={() => ir("inicio")}><IcoChevron dir="left" c="#1a1611" size={20}/></button>
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
            <Row label="Salida" val={`${fmt(fecha)} · ${hora}`}/>
            {esIdaVuelta && <Row label="Regreso" val={horaFlexible ? "Hora flexible (WhatsApp)" : `${fmt(fecha)} · ${horaRegreso}`}/>}
            <Row label="Pasajeros" val={
              <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                {Array.from({ length: Math.min(pasajeros, 5) }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1611" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                ))}
                {pasajeros > 5 && <span style={{ fontSize:"0.75rem", color:"#9a9080", fontWeight:600 }}>+{pasajeros - 5}</span>}
                <span style={{ fontWeight:700, fontSize:"0.88rem", color:"#1a1611", marginLeft:2 }}>{pasajeros}</span>
              </span>
            }/>
            <Row label="Tipo" val={tipoViaje==="compartido" ? "Compartido" : "Van privada"}/>
          </div>
          {tipoViaje === "van_completa" && (
            <div style={{ ...S.section, paddingTop:0 }}>
              <p style={S.sectionLabel}>Modo de pago</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { id:"abono", label:"50% ahora", monto:precio(montoTotal*0.5), sub:"Resto al viajar" },
                  { id:"total", label:"Pago completo", monto:precio(montoTotal), sub:"Todo ahora" },
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
                <strong>Sin costo ahora.</strong> Confirmamos cuando se complete el cupo de {MAX_ASIENTOS} pasajeros. Quedan <strong>{asientosLibres} lugares.</strong>
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
            <span style={{ fontSize:"0.85rem", color:"#9a9080" }}>{tipoViaje==="compartido" ? "Total (se cobra al confirmar)" : "A pagar ahora"}</span>
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
              <p style={{ textAlign:"center", fontSize:"0.7rem", color:"#9a9080", lineHeight:1.5 }}>Pago seguro vía Flow.cl · El resto lo pagas el día del viaje</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PANTALLA: INICIO
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div ref={topRef} style={S.root}>
      <style>{css}</style>
      <div style={S.wrap}>

        {/* ── Saludo ── */}
        <div style={S.saludoRow} className="fade-in">
          <div style={{ flex:1, minWidth:0 }}>
            <p style={S.saludoSub}>{usuario ? `Hola, ${usuario.nombre.split(" ")[0]} 👋` : "¿A dónde viajas?"}</p>
            <FrasesRotativas />
            <h2 style={S.saludoTitle}>¿A dónde<br/>vamos hoy?</h2>
          </div>
          {usuario && <div style={S.avatar}>{usuario.avatar}</div>}
        </div>

        {/* ── Inputs de lugar ── */}
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

        {/* ── Tarjetas de tipo de servicio (Transfer / Van Privada) ── */}
        <div style={{ display:"flex", gap:8, marginTop:8 }} className="fade-in">
          {[
            { id:"compartido",   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="8" width="15" height="10" rx="2"/><path d="M16 11l5 2v5h-5V11z"/><circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/></svg>, label:"Transfer",   p: rutaData ? precio(precioPersona) : calculando ? "…" : null, sub:"por pasajero" },
            { id:"van_completa", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l5 7v5h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 5v7h11"/></svg>, label:"Van Privada", p: rutaData ? precio(precioVan)     : calculando ? "…" : null, sub:"van completa" },
          ].map(op => {
            const bloqueada = op.id === "compartido" && sinCupoCompartido;
            return (
            <div
              key={op.id}
              style={{
                flex:1, padding:"12px 14px", borderRadius:12,
                border: bloqueada
                  ? "1.5px solid #D4CBB8"
                  : tipoViaje===op.id ? "2px solid #1a1611" : "1.5px solid #D4CBB8",
                background: bloqueada ? "#F5F2EC" : tipoViaje===op.id ? "#1a1611" : "#EDE5D0",
                cursor: bloqueada ? "not-allowed" : "pointer",
                transition:"all .18s",
                display:"flex", flexDirection:"column", gap:6,
                opacity: bloqueada ? 0.7 : 1,
                position:"relative", overflow:"hidden",
              }}
              onClick={() => !bloqueada && setTipoViaje(op.id)}
            >
              {/* Banda "Sin cupo" cuando está bloqueada */}
              {bloqueada && (
                <div style={{
                  position:"absolute", top:10, right:-20,
                  color:"#ef4444",
                  fontSize:"0.58rem", fontWeight:800, letterSpacing:"0.08em",
                  padding:"2px 28px", transform:"rotate(35deg)",
                  textTransform:"uppercase", pointerEvents:"none",
                }}>
                  Sin cupo
                </div>
              )}

              <span style={{ fontSize:"0.82rem", fontWeight:700, color: bloqueada ? "#B8AFA0" : tipoViaje===op.id?"#F5EDD8":"#6b5e4e", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ opacity: bloqueada ? 0.5 : 1, color: bloqueada ? "#B8AFA0" : tipoViaje===op.id ? "#F5EDD8" : "#6b5e4e" }}>
                  {op.icon}
                </span>
                {op.label}
              </span>

              {/* Texto de fecha bloqueada */}
              {bloqueada && fecha && (
                <span style={{ fontSize:"0.72rem", color:"#B8AFA0", fontWeight:500 }}>
                  Sin disponibilidad · {new Date(fecha+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"short"})}
                </span>
              )}

              {/* ── Fecha + Hora (iconos clicables) ── */}
              <div onClick={e => e.stopPropagation()} style={{ display:"flex", alignItems:"center", gap:8 }}>

                {/* Ícono calendario + texto día/mes */}
                <div style={{ position:"relative", display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
                  <div className={origen && destino && tipoViaje===op.id && !(op.id==="van_completa"?fechaVan:fechaComp) && !bloqueada ? "ico-pulse-red" : ""}>
                    <IcoCal size={22} c={(() => {
                      const f = op.id === "van_completa" ? fechaVan : fechaComp;
                      if (bloqueada) return "#C8BEA8";
                      if (origen && destino && tipoViaje===op.id && !f) return "#ef4444";
                      if (tipoViaje===op.id && f) return "#22c55e";
                      if (tipoViaje===op.id) return "#F5EDD8";
                      return "#9a9080";
                    })()}/>
                  </div>
                  {(op.id === "van_completa" ? fechaVan : fechaComp) && (
                    <span style={{
                      fontSize:"0.78rem", fontWeight:700, lineHeight:1,
                      color: bloqueada ? "#B8AFA0" : tipoViaje===op.id ? "#F5EDD8" : "#1a1611",
                      pointerEvents:"none",
                    }}>
                      {new Date((op.id === "van_completa" ? fechaVan : fechaComp) + "T12:00:00").toLocaleDateString("es-CL", { day:"numeric", month:"short" })}
                    </span>
                  )}
                  <input
                    type="date"
                    min={hoy}
                    value={op.id === "van_completa" ? fechaVan : fechaComp}
                    onChange={e => op.id === "van_completa" ? setFechaVan(e.target.value) : setFechaComp(e.target.value)}
                    style={{ position:"absolute", opacity:0, cursor:"pointer", top:0, left:0, width:"100%", height:"100%", fontSize:16 }}
                  />
                </div>

                <div style={{ width:1, height:16, background: tipoViaje===op.id?"rgba(245,237,216,0.3)":"#D4CBB8", flexShrink:0 }}/>

                {/* Ícono reloj + texto hora */}
                <div style={{ position:"relative", display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
                  <div className={origen && destino && tipoViaje===op.id && !!(op.id==="van_completa"?fechaVan:fechaComp) && !(op.id==="van_completa"?horaVan:horaComp) ? "ico-pulse-red" : ""}>
                    <svg
                      width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke={(() => {
                        const f = op.id === "van_completa" ? fechaVan : fechaComp;
                        const h = op.id === "van_completa" ? horaVan  : horaComp;
                        if (bloqueada) return "#C8BEA8";
                        if (origen && destino && tipoViaje===op.id && f && !h) return "#ef4444";
                        if (tipoViaje===op.id && h) return "#22c55e";
                        if (tipoViaje===op.id) return "#F5EDD8";
                        return "#9a9080";
                      })()}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  {(op.id === "van_completa" ? horaVan : horaComp) && (
                    <span style={{
                      fontSize:"0.78rem", fontWeight:700, lineHeight:1,
                      color: tipoViaje===op.id ? "#F5EDD8" : "#1a1611",
                      pointerEvents:"none",
                    }}>
                      {op.id === "van_completa" ? horaVan : horaComp}
                    </span>
                  )}
                  <select
                    value={op.id === "van_completa" ? horaVan : horaComp}
                    onChange={e => op.id === "van_completa" ? setHoraVan(e.target.value) : setHoraComp(e.target.value)}
                    style={{ position:"absolute", opacity:0, cursor:"pointer", top:0, left:0, width:"100%", height:"100%", fontSize:16 }}
                  >
                    <option value="">—</option>
                    {HORAS_BASE.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {/* Precio + contador pasajeros (solo Transfer) */}
              <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginTop:2 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                  {op.p && (
                    <span style={{ fontSize:"1.1rem", fontWeight:800, lineHeight:1, color: tipoViaje===op.id?"#F5EDD8":"#1a1611" }}>
                      {op.p}
                    </span>
                  )}
                  <span style={{ fontSize:"0.72rem", color: tipoViaje===op.id?"rgba(245,237,216,0.7)":"#9a9080" }}>
                    {op.sub}
                  </span>
                </div>

                {op.id === "compartido" && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{ display:"flex", alignItems:"center", gap:3 }}
                  >
                    {/* Botón − */}
                    <button
                      onClick={() => setPasajeros(p => Math.max(1, p - 1))}
                      disabled={pasajeros <= 1}
                      style={{
                        width:20, height:20, borderRadius:6,
                        border:"none",
                        background:"transparent",
                        color: tipoViaje===op.id ? "rgba(245,237,216,0.5)" : "#B8AFA0",
                        fontSize:"1rem", fontWeight:400, lineHeight:1,
                        cursor: pasajeros <= 1 ? "not-allowed" : "pointer",
                        opacity: pasajeros <= 1 ? 0.3 : 1,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        transition:"all .15s", flexShrink:0, padding:0,
                      }}
                    >−</button>

                    {/* Ícono persona + número */}
                    <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={tipoViaje===op.id ? "#F5EDD8" : "#1a1611"}
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span style={{
                        fontSize:"0.85rem", fontWeight:800, lineHeight:1,
                        color: tipoViaje===op.id ? "#F5EDD8" : "#1a1611",
                        minWidth:12, textAlign:"center",
                      }}>
                        {pasajeros}
                      </span>
                    </div>

                    {/* Botón + */}
                    <button
                      onClick={() => setPasajeros(p => Math.min(MAX_ASIENTOS, p + 1))}
                      disabled={pasajeros >= MAX_ASIENTOS}
                      style={{
                        width:20, height:20, borderRadius:6,
                        border:"none",
                        background:"transparent",
                        color: tipoViaje===op.id ? "rgba(245,237,216,0.5)" : "#B8AFA0",
                        fontSize:"1rem", fontWeight:400, lineHeight:1,
                        cursor: pasajeros >= MAX_ASIENTOS ? "not-allowed" : "pointer",
                        opacity: pasajeros >= MAX_ASIENTOS ? 0.3 : 1,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        transition:"all .15s", flexShrink:0, padding:0,
                      }}
                    >+</button>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
        {/* ── FIN tarjetas ── */}

        {/* ── Regreso (ida y vuelta) ── */}
        {esIdaVuelta && (
          <div style={S.regresoBox} className="fade-in">
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#1a1611", letterSpacing:"0.03em" }}>🔄 REGRESO — mismo día</span>
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

        {esIdaVuelta && (
          <div style={S.infoIV} className="fade-in">
            <span>ℹ️</span>
            <span>Ida y vuelta disponible <strong>solo el mismo día</strong>. Para otra fecha, reserva el regreso como un viaje aparte.</span>
          </div>
        )}

        {/* ── Botón principal ── */}
        <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:6 }}>
          <button
            className={enviando ? "btn-confirmar btn-confirmar-loading" : "btn-confirmar"}
            disabled={
              !origen || !destino || !fecha || !hora || !tipoViaje || calculando || enviando ||
              (esIdaVuelta && !horaFlexible && !horaRegreso) ||
              (tipoViaje === "compartido" && sinCupoCompartido)
            }
            onClick={reservarDirecto}
          >
            {enviando
              ? <><span className="btn-spinner" style={{ marginRight:8 }}/> Procesando…</>
              : calculando
                ? <><span className="btn-spinner" style={{ marginRight:8 }}/> Calculando…</>
                : !tipoViaje
                  ? "Selecciona Transfer o Van Privada"
                  : tipoViaje === "compartido"
                    ? rutaData ? `Reservar asiento — ${precio(precioPersona * pasajeros)}` : "Reservar asiento"
                    : rutaData ? `Pagar abono — ${precio(precioVan * 0.5)}` : "Reservar van"
            }
          </button>
          {tipoViaje === "compartido" && origen && destino && (
            <p style={{ textAlign:"center", fontSize:"0.72rem", color:"#9a9080", lineHeight:1.5 }}>
              Sin costo ahora · Confirmamos cuando se llene el cupo de {MAX_ASIENTOS} pax
            </p>
          )}
          {tipoViaje === "van_completa" && origen && destino && (
            <p style={{ textAlign:"center", fontSize:"0.70rem", color:"#9a9080", lineHeight:1.5 }}>
              Pago seguro vía Flow.cl · El resto lo pagas el día del viaje
            </p>
          )}
          {error && <div style={S.errBox}>⚠️ {error}</div>}
        </div>

        {/* ── Mensajes de validación ── */}
        {!tipoViaje && origen && destino && fecha && hora && (
          <p style={{ textAlign:"center", fontSize:"0.72rem", color:"#c0290e", marginTop:6 }}>
            Elige Transfer o Van Privada para continuar
          </p>
        )}
        {esIdaVuelta && !horaFlexible && !horaRegreso && hora && (
          <p style={{ textAlign:"center", fontSize:"0.72rem", color:"#c0290e", marginTop:6 }}>
            Elige hora de regreso o activa "No sé la hora exacta"
          </p>
        )}

        {/* ── Destinos ── */}
        <div style={{ marginTop:32 }} className="fade-in">
          <p style={S.sectionLabel}>Destinos</p>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {[
              { o:PUNTOS_FRECUENTES[0], d:PUNTOS_FRECUENTES[1], label:"Temuco ZCO → Pucón",        meta:`~95 km · desde ${precio(paxDesdeVan(95000))}/pax · van ${precio(95000)}`,  ico:"plane"    },
              { o:PUNTOS_FRECUENTES[0], d:PUNTOS_FRECUENTES[2], label:"Temuco ZCO → Villarrica",   meta:`~80 km · desde ${precio(paxDesdeVan(80000))}/pax · van ${precio(80000)}`,  ico:"plane"    },
              { o:PUNTOS_FRECUENTES[0], d:PUNTOS_FRECUENTES[3], label:"Temuco ZCO → Panguipulli",  meta:`~110 km · desde ${precio(paxDesdeVan(110000))}/pax · van ${precio(110000)}`, ico:"plane"  },
              { o:PUNTOS_FRECUENTES[0], d:PUNTOS_FRECUENTES[4], label:"Temuco ZCO → Valdivia",     meta:`~140 km · desde ${precio(paxDesdeVan(140000))}/pax · van ${precio(140000)}`, ico:"plane"  },
              { o:PUNTOS_FRECUENTES[0], d:PUNTOS_FRECUENTES[5], label:"Temuco ZCO → Victoria",     meta:`~90 km · desde ${precio(paxDesdeVan(90000))}/pax · van ${precio(90000)}`,  ico:"plane"    },
              { o:PUNTOS_FRECUENTES[1], d:PUNTOS_FRECUENTES[0], label:"Pucón → Temuco ZCO",        meta:`~95 km · desde ${precio(paxDesdeVan(95000))}/pax · van ${precio(95000)}`,  ico:"mountain" },
              { o:PUNTOS_FRECUENTES[2], d:PUNTOS_FRECUENTES[0], label:"Villarrica → Temuco ZCO",   meta:`~80 km · desde ${precio(paxDesdeVan(80000))}/pax · van ${precio(80000)}`,  ico:"city"     },
              { o:PUNTOS_FRECUENTES[3], d:PUNTOS_FRECUENTES[0], label:"Panguipulli → Temuco ZCO",  meta:`~110 km · desde ${precio(paxDesdeVan(110000))}/pax · van ${precio(110000)}`, ico:"city"   },
              { o:PUNTOS_FRECUENTES[4], d:PUNTOS_FRECUENTES[0], label:"Valdivia → Temuco ZCO",     meta:`~140 km · desde ${precio(paxDesdeVan(140000))}/pax · van ${precio(140000)}`, ico:"city"   },
            ].map((r,i) => (
              <button key={i} className="ruta-row" onClick={() => { setOrigen(r.o); setDestino(r.d); }}>
                <div style={S.rutaIcoSmall}>
                  {r.ico === "plane" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9080" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                  )}
                  {r.ico === "mountain" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9080" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 20l6-12 3 5 3-3 6 10H3z"/>
                    </svg>
                  )}
                  {r.ico === "city" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9080" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M9 21V7l6-4v18M9 11h6M9 15h6M9 19h6"/>
                    </svg>
                  )}
                </div>
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

// ── HoraPicker (usado solo en regreso) ────────────────────────────────────────
function HoraPicker({ hora, setHora, horas=HORAS_BASE, label="Hora", placeholder="Elige hora", disabled=false }) {
  const selectRef = useRef(null);
  return (
    <div
      style={{ ...S.pill, flex:1, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1 }}
      onClick={() => !disabled && selectRef.current?.focus()}
    >
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9a9080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        <span style={{ fontSize:"0.72rem", color:"#9a9080", fontWeight:600, letterSpacing:"0.02em" }}>{label}</span>
      </div>
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        <select
          ref={selectRef}
          value={hora}
          onChange={e => setHora(e.target.value)}
          disabled={disabled}
          style={{ ...S.select, fontWeight:hora?700:400, color:hora?"#1a1611":"#9a9080", fontSize:"0.9rem", paddingRight:16 }}
        >
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

// ── LugarInput ────────────────────────────────────────────────────────────────
const EJEMPLOS_DIRECCIONES = [
  "O'Higgins 310, Villarrica","Urrutia 477, Pucón",
  "Caupolicán 285, Temuco","Freire 250, Villarrica",
  "Colo-Colo 355, Temuco","Lincoyan 542, Pucón",
];

function PlaceholderTicker() {
  const [_idx, _setIdx] = useState(0);
  const [estado, setEstado] = useState("visible");
  useEffect(() => {
    const c = setInterval(() => {
      setEstado("saliendo");
      setTimeout(() => { _setIdx(i => (i+1)%EJEMPLOS_DIRECCIONES.length); setEstado("entrando"); setTimeout(() => setEstado("visible"), 20); }, 300);
    }, 2800);
    return () => clearInterval(c);
  }, []);
  const T = { visible:"translateX(0)", saliendo:"translateX(-120%)", entrando:"translateX(60%)" };
  const O = { visible:1, saliendo:0, entrando:0 };
  return (
    <span style={{ display:"block", overflow:"hidden", flex:1, pointerEvents:"none" }}>
      <span style={{ display:"block", fontSize:"0.9rem", color:"#B8AFA0", fontFamily:"'DM Sans',sans-serif", fontWeight:400, whiteSpace:"nowrap", transform:T[estado], opacity:O[estado], transition:estado==="saliendo"?"transform 0.28s cubic-bezier(.4,0,1,1), opacity 0.22s ease":estado==="visible"?"transform 0.38s cubic-bezier(.2,.8,.3,1), opacity 0.28s ease":"none" }}>
        {EJEMPLOS_DIRECCIONES[_idx]}
      </span>
    </span>
  );
}

function LugarInput({ placeholder, value, onChange, dotStyle, disabled, historial=[], onEliminarHistorial }) {
  const [query, setQuery]           = useState("");
  const [abierto, setAbierto]       = useState(false);
  const [activo, setActivo]         = useState(false);
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando]     = useState(false);
  const [geolocando, setGeolocando] = useState(false);
  const [geoFallback, setGeoFallback] = useState(false);
  const wrapRef = useRef(null), timerRef = useRef(null), inputRef = useRef(null);

  const ubicarme = (silencioso=false) => {
    if (!navigator.geolocation) { if (!silencioso) alert("Tu navegador no soporta geolocalización."); setGeoFallback(true); return; }
    if (location.protocol!=="https:" && location.hostname!=="localhost") { if (!silencioso) alert("La geolocalización precisa requiere conexión segura (https)."); setGeoFallback(true); return; }
    setGeolocando(true);
    navigator.geolocation.getCurrentPosition(
      async ({coords}) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=es&zoom=18`);
          const data = await res.json();
          const label = [data.address?.road,data.address?.house_number,data.address?.suburb||data.address?.neighbourhood||data.address?.city_district,data.address?.city||data.address?.town].filter(Boolean).join(", ");
          const labelFinal = label || data.display_name.split(",").slice(0,3).join(",").trim();
          onChange({ label:labelFinal, lat:coords.latitude, lng:coords.longitude }); setQuery(labelFinal); setGeoFallback(false);
        } catch { if (!silencioso) setQuery("No se pudo obtener la dirección"); setGeoFallback(true); }
        finally { setGeolocando(false); }
      },
      () => { setGeolocando(false); setGeoFallback(true); },
      { enableHighAccuracy:true, timeout:8000, maximumAge:0 }
    );
  };

  useEffect(() => { if (dotStyle==="origen" && !value) ubicarme(true); }, []); // eslint-disable-line
  useEffect(() => { if (!activo) setQuery(value ? value.label : ""); }, [value, activo]);
  useEffect(() => {
    const fn = (e) => { if (!wrapRef.current?.contains(e.target)) { setAbierto(false); setActivo(false); } };
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length < 3) { setResultados([]); return; }
    timerRef.current = setTimeout(async () => { setBuscando(true); const res = await buscarDirecciones(query); setResultados(res); setBuscando(false); }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const frecuentes   = PUNTOS_FRECUENTES.filter(p => !query || p.label.toLowerCase().includes(query.toLowerCase()) || p.sub.toLowerCase().includes(query.toLowerCase()));
  const histFiltrado = historial.filter(h => !query || h.label.toLowerCase().includes(query.toLowerCase()));
  const seleccionar  = (punto) => { onChange(punto); setQuery(punto.label.replace(/^[^\w\s]{1,3}\s*/,"").trim()); setAbierto(false); setActivo(false); setResultados([]); };
  const dot = dotStyle==="origen" ? <div style={S.dotOrigen}/> : <div style={S.dotDestino}/>;
  const mostrarDropdown = abierto && (frecuentes.length>0 || resultados.length>0 || histFiltrado.length>0 || buscando || query.length>=3);

  return (
    <div ref={wrapRef} style={{ position:"relative" }}>
      <div style={{ ...S.searchBoxSingle, borderColor:activo?"#1a1611":"#D4CBB8", boxShadow:activo?"0 0 0 2px rgba(26,22,17,.12)":"0 2px 12px rgba(26,22,17,.06)", opacity:disabled?0.5:1 }}>
        <div style={S.searchRow}>
          {dot}
          <div style={{ flex:1, position:"relative", display:"flex", alignItems:"center", overflow:"hidden" }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setAbierto(true); }}
              onFocus={() => { setActivo(true); setAbierto(true); }}
              onBlur={() => setTimeout(() => { if (!wrapRef.current?.contains(document.activeElement)) { setActivo(false); setAbierto(false); } }, 150)}
              placeholder={activo ? placeholder : ""}
              disabled={disabled}
              autoComplete="off"
              style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:"0.95rem", fontFamily:"'DM Sans',sans-serif", fontWeight:value?600:400, color:value?"#1a1611":"#9a9080" }}
            />
            {dotStyle==="origen" && !value && !query && !activo && !geolocando && (
              <div style={{ position:"absolute", left:0, right:0, top:0, bottom:0, display:"flex", alignItems:"center", pointerEvents:"none", overflow:"hidden" }}>
                <PlaceholderTicker/>
              </div>
            )}
            {dotStyle==="origen" && geolocando && !value && (
              <div style={{ position:"absolute", left:0, display:"flex", alignItems:"center", gap:6, pointerEvents:"none" }}>
                <span className="btn-spinner" style={{ width:13, height:13, borderWidth:1.5, borderTopColor:"#9a9080", borderColor:"#D4CBB8" }}/>
                <span style={{ fontSize:"0.82rem", color:"#B8AFA0" }}>Buscando tu ubicación…</span>
              </div>
            )}
          </div>
          {buscando && <span className="btn-spinner" style={{ width:14, height:14, borderWidth:1.5, borderTopColor:"#9a9080", borderColor:"#D4CBB8", flexShrink:0 }}/>}
          {value && !buscando && (
            <button
              onMouseDown={e => { e.preventDefault(); onChange(null); setQuery(""); setResultados([]); }}
              style={{ background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", color:"#C8BEA8", fontSize:"1.1rem", flexShrink:0 }}
            >×</button>
          )}
          {dotStyle==="origen" && !value && !buscando && (
            <button
              onMouseDown={e => { e.preventDefault(); ubicarme(false); }}
              style={{ background:"none", border:"none", cursor:geolocando?"wait":"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", color:geolocando?"#C8BEA8":"#9a9080", flexShrink:0 }}
            >
              {geolocando
                ? <span className="btn-spinner" style={{ width:14, height:14, borderWidth:1.5, borderTopColor:"#9a9080", borderColor:"#D4CBB8" }}/>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                    <circle cx="12" cy="12" r="8" strokeDasharray="2 3"/>
                  </svg>
              }
            </button>
          )}
        </div>
      </div>

      {mostrarDropdown && (
        <div style={S.dropdown}>
          {dotStyle==="origen" && !value && (
            <button className="drop-item" onMouseDown={e => { e.preventDefault(); ubicarme(); setAbierto(false); }} style={{ borderBottom:"1px solid #F0EBE0" }}>
              <div style={{ ...S.dropIcon, background:"#EEF9F0" }}>📍</div>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontSize:"0.85rem", fontWeight:600, color:"#1a7a3f" }}>{geolocando ? "Obteniendo ubicación…" : "Usar mi ubicación actual"}</div>
                <div style={{ fontSize:"0.72rem", color:"#9a9080", marginTop:1 }}>GPS del dispositivo</div>
              </div>
            </button>
          )}
          {histFiltrado.length > 0 && (<>
            <div style={S.dropHeader}>Usadas recientemente</div>
            {histFiltrado.map((h,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center" }}>
                <button className="drop-item" style={{ flex:1 }} onMouseDown={() => seleccionar(h)}>
                  <div style={{ ...S.dropIcon, background:"#F0EBE0" }}>🕐</div>
                  <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
                    <div style={{ fontSize:"0.85rem", fontWeight:600, color:"#1a1611", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.label}</div>
                    {h.sub && <div style={{ fontSize:"0.72rem", color:"#9a9080", marginTop:1 }}>{h.sub}</div>}
                  </div>
                </button>
                <button
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onEliminarHistorial?.(h.label); }}
                  style={{ background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", color:"#C8BEA8", fontSize:"1rem", flexShrink:0 }}
                >×</button>
              </div>
            ))}
          </>)}
          {frecuentes.length > 0 && (<>
            <div style={S.dropHeader}>Rutas frecuentes</div>
            {frecuentes.map(p => (
              <button key={p.id} className="drop-item" onMouseDown={() => seleccionar(p)}>
                <div style={S.dropIcon}>{p.label.slice(0,2)}</div>
                <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
                  <div style={{ fontSize:"0.85rem", fontWeight:600, color:"#1a1611", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.label.replace(/^[^\w\s]{1,3}\s*/,"")}</div>
                  <div style={{ fontSize:"0.72rem", color:"#9a9080", marginTop:1 }}>{p.sub}</div>
                </div>
              </button>
            ))}
          </>)}
          {resultados.length > 0 && (<>
            <div style={S.dropHeader}>Resultados</div>
            {resultados.map((r,i) => (
              <button key={i} className="drop-item" onMouseDown={() => seleccionar(r)}>
                <div style={{ ...S.dropIcon, fontSize:"0.9rem" }}>📍</div>
                <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
                  <div style={{ fontSize:"0.85rem", fontWeight:600, color:"#1a1611", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.label}</div>
                  {r.sub && <div style={{ fontSize:"0.72rem", color:"#9a9080", marginTop:1 }}>{r.sub}</div>}
                </div>
              </button>
            ))}
          </>)}
          {buscando && (
            <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:8, color:"#9a9080", fontSize:"0.8rem" }}>
              <span className="btn-spinner" style={{ width:13, height:13, borderWidth:1.5, borderTopColor:"#9a9080", borderColor:"#D4CBB8" }}/>
              Buscando direcciones…
            </div>
          )}
          {!buscando && query.length>=3 && resultados.length===0 && frecuentes.length===0 && histFiltrado.length===0 && (
            <div style={S.dropAviso}><span>🔍</span><span>Sin resultados para "{query}"</span></div>
          )}
        </div>
      )}
    </div>
  );
}

// ── FrasesRotativas ───────────────────────────────────────────────────────────
const FRASES = [
  { texto:"Una nueva forma de viajar",           emoji:"✨" },
  { texto:"Más económico que un taxi",           emoji:"💸" },
  { texto:"Más cómodo que el bus",               emoji:"😌" },
  { texto:"Más personalizado, siempre",          emoji:"🎯" },
  { texto:"Sin filas. Sin esperas.",             emoji:"⚡" },
  { texto:"Tu ruta, a tu hora",                 emoji:"🕐" },
  { texto:"Paga solo cuando se confirma",        emoji:"🙌" },
  { texto:"De puerta a puerta en la Araucanía",  emoji:"🏔️" },
];
function FrasesRotativas() {
  const [_idx, _setIdx] = useState(0);
  const [estado, setEstado] = useState("visible");
  useEffect(() => {
    const c = setInterval(() => {
      setEstado("saliendo");
      setTimeout(() => { _setIdx(i => (i+1)%FRASES.length); setEstado("entrando"); setTimeout(() => setEstado("visible"), 30); }, 380);
    }, 3200);
    return () => clearInterval(c);
  }, []);
  const frase = FRASES[_idx];
  const tM = { visible:"translateX(0) scale(1)", saliendo:"translateX(-28px) scale(0.94)", entrando:"translateX(22px) scale(0.96)" };
  const oM = { visible:1, saliendo:0, entrando:0 };
  return (
    <div style={{ overflow:"hidden", margin:"8px 0 12px", height:30, display:"flex", alignItems:"center" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, transform:tM[estado], opacity:oM[estado], transition:estado==="saliendo"?"transform 0.35s cubic-bezier(.4,0,.6,1), opacity 0.28s ease":estado==="visible"?"transform 0.4s cubic-bezier(.2,.8,.4,1), opacity 0.32s ease":"none" }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#1a1611", color:"#F5EDD8", borderRadius:99, padding:"3px 11px 3px 7px", fontSize:"0.78rem", fontWeight:700, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>
          <span style={{ fontSize:"0.82rem", lineHeight:1 }}>{frase.emoji}</span>
          {frase.texto}
        </span>
      </div>
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ label, val, bold }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.6rem 0", borderBottom:"1px solid #E8E0D0" }}>
      <span style={{ fontSize:"0.82rem", color:"#9a9080" }}>{label}</span>
      <span style={{ fontSize:bold?"1rem":"0.85rem", fontWeight:bold?800:600, color:"#1a1611" }}>{val}</span>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input, select, textarea { font-size: 16px !important; }
  html, body { overflow-x: hidden; max-width: 100%; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .fade-in { animation: fadeIn 0.3s ease both; }
  select { appearance: none; -webkit-appearance: none; }
  select option { background: #EDE5D0; color: #1a1611; }
  .btn-back { width:44px; height:44px; border-radius:50%; border:1.5px solid #D4CBB8; background:#EDE5D0; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .15s; }
  .btn-back:hover { background: #D4CBB8; }
  .btn-confirmar { width:100%; padding:clamp(14px,4vw,17px); background:#1a1611; color:#F5EDD8; border:none; border-radius:14px; font-size:clamp(0.9rem,4vw,1rem); font-weight:800; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; box-shadow:0 4px 20px rgba(26,22,17,.2); letter-spacing:-0.01em; display:flex; align-items:center; justify-content:center; gap:6px; }
  .btn-confirmar:hover:not(:disabled) { background:#2d2820; transform:translateY(-1px); }
  .btn-confirmar:disabled { background:#D4CBB8; color:#9a9080; cursor:not-allowed; box-shadow:none; }
  .btn-wa { width:100%; padding:15px; display:flex; align-items:center; justify-content:center; gap:8px; background:#22c55e; color:#fff; border:none; border-radius:14px; font-size:0.95rem; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; }
  .btn-wa:hover { background: #16a34a; }
  .btn-ghost { width:100%; padding:14px; background:transparent; color:#9a9080; border:1.5px solid #D4CBB8; border-radius:14px; font-size:0.88rem; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; }
  .btn-ghost:hover { border-color:#9a9080; color:#3d3629; }
  .pago-opt { display:flex; flex-direction:column; gap:4px; padding:1rem; border-radius:14px; border:1.5px solid #D4CBB8; background:#EDE5D0; color:#1a1611; cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif; text-align:left; }
  .pago-opt:hover { border-color:#9a9080; }
  .pago-opt-on { border-color:#1a1611 !important; background:#1a1611 !important; color:#F5EDD8 !important; }
  .ruta-row { display:flex; align-items:center; gap:14px; padding:14px 4px; width:100%; background:transparent; border:none; border-bottom:1px solid #E8E0D0; cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif; }
  .ruta-row:hover { padding-left:10px; padding-right:10px; background:#EDE5D0; border-radius:12px; border-bottom-color:transparent; }
  .ruta-row:last-child { border-bottom:none; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .btn-flow { width:100%; padding:17px; display:flex; align-items:center; justify-content:center; gap:8px; background:#c0290e; color:#fff; border:none; border-radius:14px; font-size:1rem; font-weight:800; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; }
  .btn-flow:hover:not(:disabled) { background:#a5230c; transform:translateY(-1px); }
  .btn-flow:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-mis-reservas { width:100%; padding:13px; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:8px; background:transparent; color:#1a1611; border:1.5px solid #1a1611; border-radius:14px; font-size:0.88rem; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; }
  .btn-mis-reservas:hover { background:#1a1611; color:#fff; }
  .btn-spinner { width:17px; height:17px; border-radius:50%; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; animation:spin .7s linear infinite; display:inline-block; flex-shrink:0; }
  .drop-item { display:flex; align-items:center; gap:12px; width:100%; padding:10px 16px; background:transparent; border:none; cursor:pointer; transition:background .15s; font-family:'DM Sans',sans-serif; min-height:44px; }
  .drop-item:hover { background:#FAF7F2; }
  @keyframes pulseRed { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.25); opacity:0.6; } }
  @keyframes pulseGreen { 0%,100% { transform:scale(1); } 50% { transform:scale(1.3); } }
  .ico-pulse-red { animation: pulseRed 0.8s ease-in-out infinite; display:inline-flex; }
  .ico-pulse-green { animation: pulseGreen 0.7s ease-in-out infinite; }
`;

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
  section:     { padding:"0.5rem 0 1rem", borderBottom:"1px solid #E8E0D0", marginBottom:"1rem" },
  sectionLabel:{ fontSize:"0.72rem", fontWeight:700, color:"#9a9080", letterSpacing:"0.06em", marginBottom:"0.6rem" },
  aviso:       { display:"flex", gap:10, background:"rgba(245,193,7,0.1)", border:"1px solid rgba(245,193,7,0.3)", borderRadius:12, padding:"0.9rem", marginBottom:"1rem" },
  usuarioRow:  { display:"flex", alignItems:"center", gap:12 },
  avatar:      { width:42, height:42, borderRadius:"50%", background:"#1a1611", color:"#F5EDD8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", fontWeight:800, flexShrink:0 },
  totalBox:    { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1rem 0", marginBottom:"1rem" },
  errBox:      { padding:"0.8rem 1rem", background:"rgba(192,41,14,0.08)", border:"1px solid rgba(192,41,14,0.2)", borderRadius:10, color:"#c0290e", fontSize:"0.82rem", marginBottom:"0.75rem" },
  okWrap:      { maxWidth:480, width:"100%", margin:"0 auto", padding:"clamp(1rem,4vw,1.8rem) clamp(14px,4vw,24px) 60px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", boxSizing:"border-box" },
  okCircle:    { width:72, height:72, borderRadius:"50%", background:"#1a1611", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 },
  okTitle:     { fontFamily:"'Syne',sans-serif", fontSize:"clamp(1.4rem,5vw,1.8rem)", fontWeight:800, color:"#1a1611", marginBottom:8 },
  okSub:       { fontSize:"0.85rem", color:"#9a9080", lineHeight:1.6, maxWidth:300, marginBottom:24 },
  okCard:      { background:"#EDE5D0", border:"1px solid #D4CBB8", borderRadius:16, padding:"0.5rem 1.25rem", width:"100%", marginBottom:24 },
  regresoBox:  { background:"#F0EBE0", border:"1.5px solid #D4CBB8", borderRadius:14, padding:"14px 16px", marginTop:10 },
  infoIV:      { display:"flex", alignItems:"flex-start", gap:8, background:"#F5EDD8", border:"1px solid #E8D8B0", borderRadius:10, padding:"10px 14px", marginTop:8, fontSize:"0.74rem", color:"#6b5e4e", lineHeight:1.5 },
};