import React, { useState, useEffect, useRef } from "react";
import supabase from "../lib/supabase";

const WHATSAPP_NUMBER = "56951569704";
const MAX_ASIENTOS    = 12;

// ── Hook: sesión y perfil real desde Supabase Auth ────────────────────────────
function useUsuario() {
  const [usuario,  setUsuario]  = useState(null);   // { nombre, email, telefono, avatar }
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // 1. Obtener sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) cargarPerfil(session.user);
      else setCargando(false);
    });

    // 2. Escuchar cambios de sesión (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) cargarPerfil(session.user);
      else { setUsuario(null); setCargando(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const cargarPerfil = (authUser) => {
    const emailAuth = authUser.email || "";
    const meta      = authUser.user_metadata || {};

    // full_name y phone vienen de Header.jsx → signUp options.data
    let nombre   = meta.full_name || meta.name || emailAuth.split("@")[0];
    let telefono = meta.phone || "";

    // Agregar prefijo +56 si falta
    if (telefono && !telefono.startsWith("+")) {
      telefono = "+56 " + telefono.trim();
    }

    const iniciales = nombre
      .split(" ")
      .filter(Boolean)
      .map(p => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    setUsuario({ nombre, email: emailAuth, telefono, avatar: iniciales });
    setCargando(false);
  };

  return { usuario, cargando };
}

const ORIGENES = [
  { id: "pucon",      label: "Pucón",                  emoji: "🏔️", sub: "Centro ciudad" },
  { id: "villarrica", label: "Villarrica",              emoji: "🌋", sub: "Centro ciudad" },
  { id: "aeropuerto", label: "Aeropuerto Temuco ZCO",  emoji: "✈️", sub: "Terminal principal" },
];

const DESTINOS_POR_ORIGEN = {
  pucon:      [{ id: "aeropuerto", label: "Aeropuerto Temuco ZCO", emoji: "✈️", sub: "Terminal principal" }],
  villarrica: [{ id: "aeropuerto", label: "Aeropuerto Temuco ZCO", emoji: "✈️", sub: "Terminal principal" }],
  aeropuerto: [
    { id: "pucon",      label: "Pucón",      emoji: "🏔️", sub: "Centro ciudad" },
    { id: "villarrica", label: "Villarrica", emoji: "🌋", sub: "Centro ciudad" },
  ],
};

const PRECIOS = {
  "pucon-aeropuerto":      { persona: 15000, van: 120000, km: "95 km", duracion: "1h 30min" },
  "villarrica-aeropuerto": { persona: 12000, van: 100000, km: "80 km", duracion: "1h 15min" },
  "aeropuerto-pucon":      { persona: 15000, van: 120000, km: "95 km", duracion: "1h 30min" },
  "aeropuerto-villarrica": { persona: 12000, van: 100000, km: "80 km", duracion: "1h 15min" },
};

const fmt    = (str) => { if (!str) return ""; const [y,m,d]=str.split("-"); return new Date(y,m-1,d).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"}); };
const precio = (n)   => `$${Math.round(n).toLocaleString("es-CL")}`;
const hoy    = new Date().toISOString().split("T")[0];

// ── Iconos SVG ────────────────────────────────────────────────────────────────
const IcoVan = ({ size = 28, c = "#1a1611" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l5 7v5h-2"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <path d="M9 5v7h11"/>
  </svg>
);
const IcoBus = ({ size = 28, c = "#1a1611" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="13" rx="2"/>
    <path d="M2 10h20 M7 18v2 M17 18v2"/>
    <circle cx="7" cy="14" r="1" fill={c}/><circle cx="17" cy="14" r="1" fill={c}/>
  </svg>
);
const IcoChevron = ({ dir = "right", c = "#9a9080", size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: dir === "left" ? "rotate(180deg)" : dir === "down" ? "rotate(90deg)" : "none" }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoCheck = ({ size = 18 }) => (
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

// ── Componente principal ──────────────────────────────────────────────────────
export default function Reservas() {
  const { usuario, cargando: cargandoAuth } = useUsuario();

  const [pantalla,   setPantalla]   = useState("inicio");
  const [origenId,   setOrigenId]   = useState("");
  const [destinoId,  setDestinoId]  = useState("");
  const [fecha,      setFecha]      = useState("");
  const [pasajeros,  setPasajeros]  = useState(1);
  const [tipoViaje,  setTipoViaje]  = useState("");
  const [modoPago,   setModoPago]   = useState("abono");
  const [enviando,   setEnviando]   = useState(false);
  const [reservaId,  setReservaId]  = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState(0);
  const [error,      setError]      = useState("");
  const topRef = useRef(null);

  const rutaKey   = origenId && destinoId ? `${origenId}-${destinoId}` : null;
  const rutaData  = rutaKey ? PRECIOS[rutaKey] : null;
  const origen    = ORIGENES.find(o => o.id === origenId);
  const destino   = DESTINOS_POR_ORIGEN[origenId]?.find(d => d.id === destinoId);
  const rutaLabel = origen && destino ? `${origen.label} → ${destino.label}` : "";
  const montoTotal = !rutaData ? 0 : tipoViaje === "van_completa" ? rutaData.van : rutaData.persona * pasajeros;
  const aPagar     = tipoViaje === "van_completa" && modoPago === "abono" ? montoTotal * 0.5 : montoTotal;
  const asientosLibres = Math.max(0, MAX_ASIENTOS - asientosOcupados);

  const scroll = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  const ir = (p) => { setPantalla(p); scroll(); };

  useEffect(() => {
    if (!origenId || !destinoId || !fecha || tipoViaje !== "compartido") return;
    supabase.from("reservas").select("pasajeros")
      .eq("ruta", rutaLabel).eq("fecha", fecha)
      .eq("tipo_reserva", "compartido").neq("estado", "cancelado")
      .then(({ data }) => setAsientosOcupados(data ? data.reduce((a,r) => a+(r.pasajeros||1), 0) : 0));
  }, [origenId, destinoId, fecha, tipoViaje]);

  const confirmar = async () => {
    setError(""); setEnviando(true);
    try {
      const { data, error: dbErr } = await supabase.from("reservas").insert([{
        nombre:       usuario?.nombre   || "",
        email:        usuario?.email    || "",
        telefono:     usuario?.telefono || "",
        ruta:         rutaLabel,
        fecha,
        vuelo_numero: "SIN_VUELO",
        pasajeros:    Number(pasajeros),
        tipo_reserva: tipoViaje,
        estado:       "pendiente_pago",
        notas:        tipoViaje === "van_completa"
          ? `Pago: ${modoPago === "abono" ? "50% abono ("+precio(aPagar)+")" : "Completo ("+precio(montoTotal)+")"}`
          : "Reserva compartida - sin pago previo",
      }]).select().single();
      if (dbErr) throw new Error("Error al guardar");
      setReservaId(data.id);
      setEnviando(false);
      if (tipoViaje === "compartido") {
        abrirWhatsApp(data.id);
        ir("ok");
      } else {
        abrirWhatsApp(data.id);
        window.open("https://www.flow.cl/btn.php?token=o6f0a50ad75e315233752a57fb02bdba9453e509", "_blank");
        ir("ok");
      }
    } catch {
      setError("Error al procesar. Intenta de nuevo.");
      setEnviando(false);
    }
  };

  const abrirWhatsApp = (id) => {
    const msg = encodeURIComponent(
      `🚐 *${tipoViaje === "compartido" ? "Reserva Compartida" : "Van Completa"} - Araucanía Viajes*\n\n` +
      `👤 *${usuario?.nombre}* · ${usuario?.telefono}\n` +
      `🗺️ ${rutaLabel}\n📅 ${fmt(fecha)}\n👥 ${pasajeros} pasajero(s)\n\n` +
      `💰 Total: ${precio(montoTotal)}\n` +
      (tipoViaje === "compartido"
        ? `⏳ *Reserva apartada sin costo.*\n`
        : `💳 Pago: ${precio(aPagar)} (${modoPago === "abono" ? "50% abono" : "completo"})\n`) +
      `🆔 Ref: ${id}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  const reset = () => {
    setPantalla("inicio"); setOrigenId(""); setDestinoId(""); setFecha("");
    setPasajeros(1); setTipoViaje(""); setModoPago("abono");
    setReservaId(null); setError(""); scroll();
  };



  // ════════════════════════════════════════════════════════════════════════════
  // PANTALLA: OK ✓
  // ════════════════════════════════════════════════════════════════════════════
  if (pantalla === "ok") return (
    <div ref={topRef} style={S.root}>
      <style>{css}</style>
      <div style={S.okWrap} className="fade-in">
        <div style={S.okCircle}>
          <IcoCheck size={32}/>
        </div>
        <h2 style={S.okTitle}>
          {tipoViaje === "compartido" ? "¡Reserva lista!" : "¡Van reservada!"}
        </h2>
        <p style={S.okSub}>
          {tipoViaje === "compartido"
            ? `Te avisamos por WhatsApp cuando se llene el cupo (${MAX_ASIENTOS} pax).`
            : "Revisa tu WhatsApp con los detalles del pago."}
        </p>

        <div style={S.okCard}>
          <Row label="Ruta"      val={rutaLabel}/>
          <Row label="Fecha"     val={fmt(fecha)}/>
          <Row label="Pasajeros" val={`${pasajeros} pax`}/>
          <Row label="Total"     val={precio(montoTotal)} bold/>
        </div>

        <button className="btn-wa" onClick={() => abrirWhatsApp(reservaId)}>
          <IcoWA/> Abrir WhatsApp
        </button>
        <button className="btn-ghost" onClick={reset} style={{ marginTop: 10 }}>
          Nueva reserva
        </button>
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

    // Sin sesión → pedir login antes de confirmar
    if (!cargandoAuth && !usuario) return (
      <div ref={topRef} style={S.root}>
        <style>{css}</style>
        <div style={S.wrap}>
          <div style={S.topBar}>
            <button className="btn-back" onClick={() => ir("tarifas")}>
              <IcoChevron dir="left" c="#1a1611" size={20}/>
            </button>
            <span style={S.topTitle}>Confirmar viaje</span>
            <div style={{ width: 36 }}/>
          </div>
          <div style={S.rutaPill} className="fade-in">
            <div style={S.rutaDot}/>
            <div style={{ flex: 1 }}>
              <div style={S.rutaTexto}>{origen?.label}</div>
              <div style={S.rutaLinea}/>
              <div style={S.rutaTexto}>{destino?.label}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={S.pillMeta}>{fmt(fecha).split(",")[0]}</div>
              <div style={S.pillMeta}>{precio(montoTotal)}</div>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "2rem 0 1rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: 10 }}>🔐</div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.2rem", fontWeight: 800, color: "#1a1611", marginBottom: 6 }}>
              Inicia sesión para confirmar
            </h3>
            <p style={{ color: "#9a9080", fontSize: "0.82rem", lineHeight: 1.6, marginBottom: 20 }}>
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

        {/* Header */}
        <div style={S.topBar}>
          <button className="btn-back" onClick={() => ir("tarifas")}>
            <IcoChevron dir="left" c="#1a1611" size={20}/>
          </button>
          <span style={S.topTitle}>Confirmar viaje</span>
          <div style={{ width: 36 }}/>
        </div>

        {/* Ruta pill */}
        <div style={S.rutaPill} className="fade-in">
          <div style={S.rutaDot}/>
          <div style={{ flex: 1 }}>
            <div style={S.rutaTexto}>{origen?.label}</div>
            <div style={S.rutaLinea}/>
            <div style={S.rutaTexto}>{destino?.label}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={S.pillMeta}>{rutaData?.km}</div>
            <div style={S.pillMeta}>{rutaData?.duracion}</div>
          </div>
        </div>

        {/* Detalles */}
        <div style={S.section}>
          <Row label="Fecha"    val={fmt(fecha)}/>
          <Row label="Pasajeros" val={`${pasajeros} pax`}/>
          <Row label="Tipo"     val={tipoViaje === "compartido" ? "Compartido" : "Van privada"}/>
        </div>

        {/* Modo pago — solo van */}
        {tipoViaje === "van_completa" && (
          <div style={{ ...S.section, paddingTop: 0 }}>
            <p style={S.sectionLabel}>Modo de pago</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { id: "abono", label: "50% ahora",    monto: precio(montoTotal * 0.5), sub: "Resto al viajar" },
                { id: "total", label: "Pago completo", monto: precio(montoTotal),      sub: "Todo ahora" },
              ].map(m => (
                <button key={m.id}
                  className={`pago-opt${modoPago === m.id ? " pago-opt-on" : ""}`}
                  onClick={() => setModoPago(m.id)}>
                  <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>{m.label}</span>
                  <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>{m.monto}</span>
                  <span style={{ fontSize: "0.68rem", opacity: 0.6 }}>{m.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Aviso compartido */}
        {tipoViaje === "compartido" && (
          <div style={S.aviso}>
            <span style={{ fontSize: "1rem" }}>🕐</span>
            <span style={{ fontSize: "0.78rem", color: "#92400e", lineHeight: 1.5 }}>
              <strong>Sin costo ahora.</strong> Confirmamos cuando se complete el cupo de {MAX_ASIENTOS} pasajeros.
              Quedan <strong>{asientosLibres} lugares.</strong>
            </span>
          </div>
        )}

        {/* Quién viaja */}
        <div style={S.section}>
          <p style={S.sectionLabel}>Quién viaja</p>
          <div style={S.usuarioRow}>
            <div style={S.avatar}>{usuario?.avatar}</div>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1a1611" }}>{usuario?.nombre}</div>
              <div style={{ fontSize: "0.75rem", color: "#9a9080" }}>{usuario?.telefono || usuario?.email}</div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div style={S.totalBox}>
          <span style={{ fontSize: "0.85rem", color: "#9a9080" }}>
            {tipoViaje === "compartido" ? "Total (se cobra al confirmar)" : "A pagar ahora"}
          </span>
          <span style={{ fontSize: "clamp(1.3rem, 5vw, 1.6rem)", fontWeight: 800, color: "#1a1611" }}>{precio(aPagar)}</span>
        </div>

        {error && <div style={S.errBox}>⚠️ {error}</div>}

        {tipoViaje === "compartido" ? (
          <button className="btn-confirmar" disabled={enviando} onClick={confirmar}>
            {enviando ? "Procesando..." : "Confirmar — sin pago ahora"}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn-flow" disabled={enviando} onClick={confirmar}>
              {enviando
                ? <><span className="btn-spinner"/>Procesando...</>
                : <><IcoLock/>Pagar {precio(aPagar)} con Flow</>
              }
            </button>
            <p style={{ textAlign: "center", fontSize: "0.7rem", color: "#9a9080", lineHeight: 1.5 }}>
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

        {/* Header */}
        <div style={S.topBar}>
          <button className="btn-back" onClick={() => ir("inicio")}>
            <IcoChevron dir="left" c="#1a1611" size={20}/>
          </button>
          <span style={S.topTitle}>Elige tu viaje</span>
          <div style={{ width: 36 }}/>
        </div>

        {/* Ruta resumen */}
        <div style={S.rutaPill} className="fade-in">
          <div style={S.rutaDot}/>
          <div style={{ flex: 1 }}>
            <div style={S.rutaTexto}>{origen?.label}</div>
            <div style={S.rutaLinea}/>
            <div style={S.rutaTexto}>{destino?.label}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={S.pillMeta}>{fmt(fecha).split(",")[0]}</div>
            <div style={S.pillMeta}>{pasajeros} pax · {rutaData?.km}</div>
          </div>
        </div>

        {/* Tarjetas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>

          {/* Compartido */}
          <button
            className={`tarifa-card${tipoViaje === "compartido" ? " tarifa-on" : ""}`}
            onClick={() => setTipoViaje("compartido")}
          >
            <div style={S.tarifaIco}>
              <IcoBus size={30} c={tipoViaje === "compartido" ? "#1a1611" : "#9a9080"}/>
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1a1611" }}>Compartido</span>
                {tipoViaje === "compartido" && (
                  <span style={S.badge}>Más económico</span>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#9a9080", marginTop: 3 }}>
                {rutaData?.duracion} · {asientosLibres} asientos libres
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1a1611" }}>
                {rutaData ? precio(rutaData.persona * pasajeros) : "—"}
              </div>
              {pasajeros > 1 && (
                <div style={{ fontSize: "0.7rem", color: "#9a9080" }}>{precio(rutaData?.persona || 0)} × {pasajeros}</div>
              )}
            </div>
          </button>

          {/* Van completa */}
          <button
            className={`tarifa-card${tipoViaje === "van_completa" ? " tarifa-on" : ""}`}
            onClick={() => setTipoViaje("van_completa")}
          >
            <div style={S.tarifaIco}>
              <IcoVan size={30} c={tipoViaje === "van_completa" ? "#1a1611" : "#9a9080"}/>
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1a1611" }}>Van privada</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#9a9080", marginTop: 3 }}>
                {rutaData?.duracion} · Exclusiva hasta {MAX_ASIENTOS} pax
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1a1611" }}>
                {rutaData ? precio(rutaData.van) : "—"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#9a9080" }}>van completa</div>
            </div>
          </button>
        </div>

        {/* CTA */}
        <button
          className="btn-confirmar"
          style={{ marginTop: 20 }}
          disabled={!tipoViaje}
          onClick={() => ir("confirmar")}
        >
          {!tipoViaje
            ? "Selecciona un viaje"
            : tipoViaje === "compartido"
              ? `Reservar asiento — ${precio(rutaData?.persona * pasajeros || 0)}`
              : `Reservar van — ${precio((rutaData?.van || 0) * 0.5)} abono`
          }
        </button>

        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#C8BEA8", marginTop: 12 }}>
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

        {/* Saludo */}
        <div style={S.saludoRow} className="fade-in">
          <div>
            <p style={S.saludoSub}>{usuario ? `Hola, ${usuario.nombre.split(" ")[0]} 👋` : "¿A dónde viajas?"}</p>
            <h2 style={S.saludoTitle}>¿A dónde<br/>vamos hoy?</h2>
          </div>
          {usuario && <div style={S.avatar}>{usuario.avatar}</div>}
        </div>

        {/* Search box */}
        <div style={S.searchBox} className="fade-in">

          {/* Origen */}
          <div style={S.searchRow}>
            <div style={S.dotOrigen}/>
            <select value={origenId}
              onChange={e => { setOrigenId(e.target.value); setDestinoId(""); }}
              style={{ ...S.select, color: origenId ? "#1a1611" : "#9a9080" }}>
              <option value="">Punto de partida</option>
              {ORIGENES.map(o => <option key={o.id} value={o.id}>{o.emoji} {o.label}</option>)}
            </select>
          </div>

          <div style={S.divider}/>

          {/* Destino */}
          <div style={S.searchRow}>
            <div style={S.dotDestino}/>
            <select value={destinoId}
              onChange={e => setDestinoId(e.target.value)}
              disabled={!origenId}
              style={{ ...S.select, color: destinoId ? "#1a1611" : "#9a9080", opacity: origenId ? 1 : 0.5 }}>
              <option value="">¿A dónde vas?</option>
              {(DESTINOS_POR_ORIGEN[origenId] || []).map(d => <option key={d.id} value={d.id}>{d.emoji} {d.label}</option>)}
            </select>
          </div>
        </div>

        {/* Fecha + pasajeros */}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }} className="fade-in">

          {/* Fecha */}
          <DateBtn fecha={fecha} setFecha={setFecha} hoy={hoy} fmt={fmt}/>

          {/* Pasajeros */}
          <div style={S.pill}>
            <span style={{ fontSize: "0.78rem", color: "#9a9080", fontWeight: 600 }}>Pax</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="cnt" onClick={() => setPasajeros(Math.max(1, pasajeros - 1))}>−</button>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a1611", minWidth: 16, textAlign: "center" }}>{pasajeros}</span>
              <button className="cnt" onClick={() => setPasajeros(Math.min(MAX_ASIENTOS, pasajeros + 1))}>+</button>
            </div>
          </div>
        </div>

        {/* Botón ver tarifas */}
        <button
          className="btn-confirmar"
          style={{ marginTop: 14 }}
          disabled={!origenId || !destinoId || !fecha}
          onClick={() => ir("tarifas")}
        >
          Ver tarifas
        </button>

        {/* Sugerencias rápidas */}
        <div style={{ marginTop: 32 }} className="fade-in">
          <p style={S.sectionLabel}>Rutas frecuentes</p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { o: "aeropuerto", d: "pucon",      label: "Aeropuerto → Pucón",      meta: "95 km · 1h 30min · desde $15.000" },
              { o: "aeropuerto", d: "villarrica",  label: "Aeropuerto → Villarrica", meta: "80 km · 1h 15min · desde $12.000" },
              { o: "pucon",      d: "aeropuerto",  label: "Pucón → Aeropuerto",      meta: "95 km · 1h 30min · desde $15.000" },
              { o: "villarrica", d: "aeropuerto",  label: "Villarrica → Aeropuerto", meta: "80 km · 1h 15min · desde $12.000" },
            ].map((r, i) => (
              <button key={i} className="ruta-row"
                onClick={() => { setOrigenId(r.o); setDestinoId(r.d); }}>
                <div style={S.rutaIcoSmall}>
                  {r.o === "aeropuerto" ? "✈️" : r.o === "pucon" ? "🏔️" : "🌋"}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1a1611" }}>{r.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "#9a9080", marginTop: 2 }}>{r.meta}</div>
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

// ── DateBtn ───────────────────────────────────────────────────────────────────
function DateBtn({ fecha, setFecha, hoy, fmt }) {
  const ref = useRef(null);
  return (
    <div style={{ ...S.pill, flex: 1, cursor: "pointer" }} onClick={() => ref.current?.showPicker?.()}>
      <span style={{ fontSize: "0.78rem", color: "#9a9080", fontWeight: 600 }}>Fecha</span>
      <span style={{ fontWeight: fecha ? 700 : 400, fontSize: "0.88rem", color: fecha ? "#1a1611" : "#9a9080" }}>
        {fecha ? fmt(fecha).split(",")[0] : "Elige día"}
      </span>
      <input ref={ref} type="date" min={hoy} value={fecha}
        onChange={e => setFecha(e.target.value)}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}/>
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ label, val, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #E8E0D0" }}>
      <span style={{ fontSize: "0.82rem", color: "#9a9080" }}>{label}</span>
      <span style={{ fontSize: bold ? "1rem" : "0.85rem", fontWeight: bold ? 800 : 600, color: "#1a1611" }}>{val}</span>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Responsive base — evita zoom automático en Xiaomi/MIUI ── */
  input, select, textarea { font-size: 16px !important; } /* evita zoom en iOS/Android al enfocar */
  
  @media (max-width: 380px) {
    .btn-confirmar { font-size: 0.85rem !important; padding: 13px !important; }
    .btn-flow      { font-size: 0.85rem !important; padding: 13px !important; }
    .tarifa-card   { padding: 0.85rem 0.9rem !important; gap: 10px !important; }
    .ruta-row      { padding: 11px 4px !important; }
    .pago-opt      { padding: 0.75rem 0.8rem !important; }
  }

  @media (max-width: 320px) {
    .btn-confirmar { font-size: 0.8rem !important; padding: 12px !important; }
    .tarifa-card   { gap: 8px !important; }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn 0.3s ease both; }

  select { appearance: none; -webkit-appearance: none; }
  select option { background: #EDE5D0; color: #1a1611; }

  .btn-back {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1.5px solid #D4CBB8; background: #EDE5D0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .15s;
  }
  .btn-back:hover { background: #D4CBB8; }

  .btn-confirmar {
    width: 100%; padding: clamp(14px, 4vw, 17px);
    background: #1a1611; color: #F5EDD8;
    border: none; border-radius: 14px;
    font-size: clamp(0.9rem, 4vw, 1rem); font-weight: 800;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all .2s;
    box-shadow: 0 4px 20px rgba(26,22,17,.2);
    letter-spacing: -0.01em;
  }
  .btn-confirmar:hover:not(:disabled) {
    background: #2d2820;
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(26,22,17,.28);
  }
  .btn-confirmar:active:not(:disabled) { transform: translateY(0); }
  .btn-confirmar:disabled { background: #D4CBB8; color: #9a9080; cursor: not-allowed; box-shadow: none; }

  .btn-wa {
    width: 100%; padding: 15px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: #22c55e; color: #fff; border: none; border-radius: 14px;
    font-size: 0.95rem; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s;
    box-shadow: 0 4px 16px rgba(34,197,94,.3);
  }
  .btn-wa:hover { background: #16a34a; }

  .btn-ghost {
    width: 100%; padding: 14px;
    background: transparent; color: #9a9080;
    border: 1.5px solid #D4CBB8; border-radius: 14px;
    font-size: 0.88rem; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s;
  }
  .btn-ghost:hover { border-color: #9a9080; color: #3d3629; }

  .cnt {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1.5px solid #C8BEA8; background: transparent;
    color: #1a1611; font-size: 1.1rem; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .15s; font-family: inherit;
  }
  .cnt:hover { background: #D4CBB8; }

  .tarifa-card {
    display: flex; align-items: center; gap: 14px;
    padding: 1.1rem 1.15rem; border-radius: 16px;
    border: 1.5px solid #D4CBB8; background: #EDE5D0;
    cursor: pointer; transition: all .2s;
    font-family: 'DM Sans', sans-serif; text-align: left; width: 100%;
  }
  .tarifa-card:hover { border-color: #9a9080; background: #E8E0D0; }
  .tarifa-on {
    border-color: #1a1611 !important;
    background: #F5EDD8 !important;
    box-shadow: 0 0 0 2px #1a1611;
  }

  .pago-opt {
    display: flex; flex-direction: column; gap: 4px; padding: 1rem;
    border-radius: 14px; border: 1.5px solid #D4CBB8;
    background: #EDE5D0; color: #1a1611; cursor: pointer;
    transition: all .2s; font-family: 'DM Sans', sans-serif; text-align: left;
  }
  .pago-opt:hover { border-color: #9a9080; }
  .pago-opt-on { border-color: #1a1611 !important; background: #1a1611 !important; color: #F5EDD8 !important; }

  .ruta-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 4px; width: 100%;
    background: transparent; border: none;
    border-bottom: 1px solid #E8E0D0;
    cursor: pointer; transition: all .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .ruta-row:hover { padding-left: 10px; padding-right: 10px; background: #EDE5D0; border-radius: 12px; border-bottom-color: transparent; }
  .ruta-row:last-child { border-bottom: none; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 36px; height: 36px; border-radius: 50%;
    border: 3px solid #D4CBB8; border-top-color: #1a1611;
    animation: spin 0.7s linear infinite;
    margin: 0 auto;
  }

  /* Botón Flow (pago van) */
  .btn-flow {
    width: 100%; padding: 17px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: #c0290e; color: #fff;
    border: none; border-radius: 14px;
    font-size: 1rem; font-weight: 800;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all .2s;
    box-shadow: 0 4px 20px rgba(192,41,14,.3);
    letter-spacing: -0.01em;
  }
  .btn-flow:hover:not(:disabled) {
    background: #a5230c;
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(192,41,14,.4);
  }
  .btn-flow:active:not(:disabled) { transform: translateY(0); }
  .btn-flow:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

  .btn-mis-reservas {
    width: 100%; padding: 13px; margin-top: 8px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: transparent; color: #1a1611;
    border: 1.5px solid #1a1611; border-radius: 14px;
    font-size: 0.88rem; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s;
  }
  .btn-mis-reservas:hover { background: #1a1611; color: #fff; }

  .btn-spinner {
    width: 17px; height: 17px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.35);
    border-top-color: #fff;
    animation: spin .7s linear infinite;
    display: inline-block; flex-shrink: 0;
  }
`;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root:       { background: "#ffffff", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" },
  wrap:       { maxWidth: 480, width: "100%", margin: "0 auto", padding: "0 clamp(14px, 4vw, 24px) 80px", boxSizing: "border-box" },

  // Inicio
  saludoRow:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: "clamp(1.25rem, 5vw, 2.5rem)", paddingBottom: "1.25rem" },
  saludoSub:  { fontSize: "0.85rem", color: "#9a9080", marginBottom: 4, fontWeight: 500 },
  saludoTitle:{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.5rem,6vw,2.2rem)", fontWeight: 800, color: "#1a1611", lineHeight: 1.12 },

  searchBox:  { background: "#EDE5D0", border: "1px solid #D4CBB8", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 16px rgba(26,22,17,.07)" },
  searchRow:  { display: "flex", alignItems: "center", gap: 14, padding: "16px 18px" },
  divider:    { height: 1, background: "#D4CBB8", margin: "0 18px" },
  select:     { flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500 },

  dotOrigen:  { width: 10, height: 10, borderRadius: "50%", border: "2.5px solid #1a1611", flexShrink: 0 },
  dotDestino: { width: 10, height: 10, borderRadius: 2, background: "#1a1611", flexShrink: 0 },

  pill:       { background: "#EDE5D0", border: "1px solid #D4CBB8", borderRadius: 14, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4, position: "relative", boxShadow: "0 2px 10px rgba(26,22,17,.05)" },

  rutaIcoSmall: { width: 38, height: 38, borderRadius: 10, background: "#E8E0D0", border: "1px solid #D4CBB8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 },

  // Tarifas / Confirmar — header
  topBar:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 0 1rem" },
  topTitle:   { fontFamily: "'Syne', sans-serif", fontSize: "clamp(0.9rem, 4vw, 1.05rem)", fontWeight: 800, color: "#1a1611" },

  rutaPill:   { background: "#EDE5D0", border: "1px solid #D4CBB8", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 16, boxShadow: "0 2px 12px rgba(26,22,17,.06)" },
  rutaDot:    { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 },
  rutaTexto:  { fontSize: "0.88rem", fontWeight: 700, color: "#1a1611" },
  rutaLinea:  { height: 14, width: 1, background: "#D4CBB8", margin: "4px 0" },
  pillMeta:   { fontSize: "0.72rem", color: "#9a9080", lineHeight: 1.8 },

  tarifaIco:  { width: 52, height: 52, borderRadius: 14, background: "#E8E0D0", border: "1px solid #D4CBB8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  badge:      { fontSize: "0.65rem", background: "#1a1611", color: "#F5EDD8", padding: "2px 8px", borderRadius: 99, fontWeight: 700 },

  section:    { padding: "0.5rem 0 1rem", borderBottom: "1px solid #E8E0D0", marginBottom: "1rem" },
  sectionLabel:{ fontSize: "0.72rem", fontWeight: 700, color: "#9a9080", letterSpacing: "0.06em", marginBottom: "0.6rem" },

  aviso:      { display: "flex", gap: 10, background: "rgba(245,193,7,0.1)", border: "1px solid rgba(245,193,7,0.3)", borderRadius: 12, padding: "0.9rem", marginBottom: "1rem" },

  usuarioRow: { display: "flex", alignItems: "center", gap: 12 },
  avatar:     { width: 42, height: 42, borderRadius: "50%", background: "#1a1611", color: "#F5EDD8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, flexShrink: 0 },

  totalBox:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", marginBottom: "1rem" },
  errBox:     { padding: "0.8rem 1rem", background: "rgba(192,41,14,0.08)", border: "1px solid rgba(192,41,14,0.2)", borderRadius: 10, color: "#c0290e", fontSize: "0.82rem", marginBottom: "0.75rem" },

  // OK
  okWrap:     { maxWidth: 480, width: "100%", margin: "0 auto", padding: "clamp(2rem,8vw,4rem) clamp(14px,4vw,24px) 80px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxSizing: "border-box" },
  okCircle:   { width: 72, height: 72, borderRadius: "50%", background: "#1a1611", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  okTitle:    { fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.4rem, 5vw, 1.8rem)", fontWeight: 800, color: "#1a1611", marginBottom: 8 },
  okSub:      { fontSize: "0.85rem", color: "#9a9080", lineHeight: 1.6, maxWidth: 300, marginBottom: 24 },
  okCard:     { background: "#EDE5D0", border: "1px solid #D4CBB8", borderRadius: 16, padding: "0.5rem 1.25rem", width: "100%", marginBottom: 24 },
  spinnerWrap:{ display: "flex", justifyContent: "center", marginBottom: 8 },
};