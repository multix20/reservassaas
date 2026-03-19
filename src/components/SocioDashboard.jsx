import React, { useState, useEffect, useCallback } from "react";
import supabase from "../lib/supabaseAdmin";

// ─── Helpers ──────────────────────────────────────────────────
const fmtPeso       = (n) => `$${Number(n||0).toLocaleString("es-CL")}`;
const fmtFechaCorta = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"short"}) : "";
const fmtFecha      = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"}) : "";

const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES       = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ESTADO_CFG = {
  en_espera:         { label:"En espera",           color:"#9a9080", bg:"#f5f0e8" },
  listo_para_cobrar: { label:"Listo para cobrar",   color:"#b85c00", bg:"#fff3e0" },
  confirmado:        { label:"Confirmado",           color:"#2d6a4f", bg:"#e8f5e9" },
  cancelado:         { label:"Cancelado",            color:"#991b1b", bg:"#fef2f2" },
  completado:        { label:"Completado",           color:"#374151", bg:"#f3f4f6" },
};

// ─── CSS ──────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .sd{font-family:'DM Sans',sans-serif;background:#f7f5f2;min-height:100vh;color:#1a1611}

  /* Header */
  .sd-hdr{background:#1a1611;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
  .sd-hdr-marca{display:flex;align-items:center;gap:10px}
  .sd-hdr-ico{width:36px;height:36px;border-radius:10px;background:#ffffff15;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem}
  .sd-hdr-titulo{font-size:.9rem;font-weight:800;color:#EDE5D0;line-height:1.2}
  .sd-hdr-sub{font-size:.62rem;color:#9a8e80}
  .sd-live{width:7px;height:7px;border-radius:50%;background:#22c55e;animation:livePulse 1.5s ease-in-out infinite}
  @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
  .sd-btn-salir{background:transparent;border:1px solid #ffffff20;color:#9a8e80;border-radius:8px;padding:6px 14px;font-family:'DM Sans',sans-serif;font-size:.75rem;cursor:pointer;transition:all .2s}
  .sd-btn-salir:hover{background:#ffffff10;color:#EDE5D0}

  /* Main */
  .sd-main{padding:20px;max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:20px}

  /* Banner */
  .sd-banner{background:linear-gradient(135deg,#2d2418 0%,#3d3020 100%);border-radius:16px;padding:20px 24px;color:#EDE5D0;display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid #ffffff10}
  .sd-banner-nombre{font-size:1.2rem;font-weight:800;margin-bottom:2px}
  .sd-banner-sub{font-size:.78rem;color:#9a8e80}
  .sd-vehiculo-tag{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:5px 12px;font-size:.75rem;color:#D4CBB8;font-weight:600}

  /* KPIs */
  .sd-kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  .sd-kpi{background:#fff;border-radius:14px;padding:18px;border:1px solid #ede8e0;display:flex;flex-direction:column;gap:4px}
  .sd-kpi-num{font-size:1.8rem;font-weight:700;color:#1a1611;font-family:'Playfair Display',serif;line-height:1;letter-spacing:-.03em}
  .sd-kpi-num.green{color:#16a34a}
  .sd-kpi-num.orange{color:#d97706}
  .sd-kpi-num.money{font-size:1.2rem}
  .sd-kpi-label{font-size:.65rem;font-weight:700;color:#9a8e80;text-transform:uppercase;letter-spacing:.08em;margin-top:6px}
  .sd-kpi-sub{font-size:.65rem;color:#c0b8b0}

  /* Calendario */
  .sd-cal{background:#fff;border-radius:16px;border:1px solid #ede8e0;overflow:hidden}
  .sd-cal-hdr{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f2ede6}
  .sd-cal-mes{font-size:1rem;font-weight:700;color:#1a1611}
  .sd-cal-nav{background:#f7f5f2;border:1px solid #ede8e0;color:#6b5e4e;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:.8rem;display:flex;align-items:center;justify-content:center;transition:all .15s}
  .sd-cal-nav:hover{background:#ede8e0}
  .sd-cal-grid{display:grid;grid-template-columns:repeat(7,1fr)}
  .sd-cal-dow{padding:8px 0;text-align:center;font-size:.62rem;font-weight:700;color:#c0b8b0;text-transform:uppercase;letter-spacing:.06em;background:#faf8f5}
  .sd-cal-day{min-height:72px;padding:6px;border-right:1px solid #f2ede6;border-bottom:1px solid #f2ede6;transition:background .12s}
  .sd-cal-day:nth-child(7n){border-right:none}
  .sd-cal-day.vacio{background:#faf8f5}
  .sd-cal-day.hoy .sd-dia-num{background:#1a1611;color:#fff;border-radius:99px;width:24px;height:24px;display:flex;align-items:center;justify-content:center}
  .sd-cal-day.tiene-viajes{cursor:pointer}
  .sd-cal-day.tiene-viajes:hover{background:#faf5ee}
  .sd-dia-num{font-size:.75rem;font-weight:600;color:#1a1611;margin-bottom:4px;width:24px;height:24px;display:flex;align-items:center;justify-content:center}
  .sd-dia-num.otro-mes{color:#d4cfc8}
  .sd-dia-dots{display:flex;flex-direction:column;gap:3px}
  .sd-dia-dot{padding:1px 6px;border-radius:99px;font-size:.55rem;font-weight:700;white-space:nowrap;overflow:hidden}
  .sd-dia-dot.compartido{background:#eff6ff;color:#2563eb}
  .sd-dia-dot.privado{background:#fff7ed;color:#c2410c}

  /* Sección */
  .sd-sec-hdr{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#b0a898;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #ede8e0}

  /* Cards viajes */
  .sd-cards{display:flex;flex-direction:column;gap:8px}
  .sd-card{background:#fff;border-radius:14px;border:1px solid #ede8e0;padding:16px;transition:box-shadow .15s}
  .sd-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.06)}
  .sd-card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px}
  .sd-card-ruta{font-size:.92rem;font-weight:700;color:#1a1611}
  .sd-card-fecha{font-size:.75rem;font-weight:700;color:#6b5e4e}
  .sd-card-meta{display:flex;align-items:center;gap:12px;font-size:.75rem;color:#9a8e80;flex-wrap:wrap}
  .sd-card-meta span{display:flex;align-items:center;gap:3px;font-weight:500}
  .sd-estado{font-size:.62rem;font-weight:700;padding:3px 10px;border-radius:99px;white-space:nowrap}

  /* Pasajeros */
  .sd-pax-list{display:flex;flex-direction:column;gap:4px;margin-top:10px;padding-top:10px;border-top:1px solid #f2ede6}
  .sd-pax-row{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:#faf8f5;border-radius:10px}
  .sd-pax-name{font-size:.8rem;font-weight:600;color:#1a1611}
  .sd-pax-sub{font-size:.65rem;color:#b0a898;margin-top:1px}
  .sd-btn-wa{background:#16a34a;color:#fff;border:none;border-radius:99px;padding:5px 12px;font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:700;cursor:pointer}

  /* Modal */
  .sd-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
  .sd-modal{background:#fff;border-radius:20px;width:100%;max-width:560px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
  .sd-modal-hdr{background:#1a1611;padding:18px 22px;border-radius:20px 20px 0 0;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0}
  .sd-modal-titulo{font-size:1rem;color:#fff;font-weight:700}
  .sd-modal-sub{font-size:.7rem;color:#9a8e80;margin-top:2px}
  .sd-modal-close{background:#ffffff18;border:none;color:#fff;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:.85rem}
  .sd-modal-body{padding:18px 22px}
  .sd-modal-seccion{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#b0a898;margin:14px 0 10px;padding-bottom:5px;border-bottom:1px solid #f2ede6}

  /* Spinner / empty */
  .sd-spinner-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:12px;color:#b0a898;font-size:.85rem}
  .sd-spinner{width:28px;height:28px;border:2.5px solid #ede8e0;border-top-color:#1a1611;border-radius:50%;animation:spin .7s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .sd-empty{text-align:center;padding:40px 20px;color:#b0a898;font-size:.82rem}

  @media(max-width:768px){
    .sd-kpi-grid{grid-template-columns:repeat(2,1fr)}
    .sd-main{padding:12px}
    .sd-cal-day{min-height:54px;padding:4px}
  }
`;

const loginCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
  .lg-root{min-height:100vh;background:#2d2820;display:flex;align-items:center;justify-content:center;padding:20px;font-family:'DM Sans',sans-serif}
  .lg-card{background:#EDE5D0;border-radius:24px;padding:40px 36px;width:100%;max-width:400px;box-shadow:0 24px 60px rgba(0,0,0,.4)}
  .lg-logo{font-size:2.2rem;text-align:center;margin-bottom:6px}
  .lg-title{font-size:1.45rem;color:#2d2820;text-align:center;font-weight:700;margin-bottom:4px}
  .lg-sub{font-size:.78rem;color:#9a9080;text-align:center;margin-bottom:28px}
  .lg-field{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
  .lg-field label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9a9080}
  .lg-input-wrap{position:relative}
  .lg-input{width:100%;padding:11px 14px;border-radius:11px;border:1.5px solid #D4CBB8;font-family:'DM Sans',sans-serif;font-size:.9rem;color:#2d2820;background:#fff;outline:none;box-sizing:border-box;transition:border-color .2s}
  .lg-input:focus{border-color:#2d2820}
  .lg-input.err{border-color:#dc2626}
  .lg-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;color:#9a9080}
  .lg-error{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:10px 14px;font-size:.8rem;color:#991b1b;margin-bottom:16px}
  .lg-btn{width:100%;padding:13px;border-radius:11px;background:#2d2820;color:#EDE5D0;border:none;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;margin-top:4px}
  .lg-btn:hover:not(:disabled){background:#3d3829}
  .lg-btn:disabled{opacity:.6;cursor:not-allowed}
  .lg-footer{text-align:center;margin-top:20px;font-size:.72rem;color:#9a9080}
  .lg-spinner{width:18px;height:18px;border:2px solid #D4CBB840;border-top-color:#EDE5D0;border-radius:50%;animation:lgspin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:8px}
  @keyframes lgspin{to{transform:rotate(360deg)}}
`;

// ─── Login ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Credenciales incorrectas. Intenta de nuevo.");
    else onLogin();
  };

  return (
    <>
      <style>{loginCss}</style>
      <div className="lg-root">
        <div className="lg-card">
          <div className="lg-logo">🚐</div>
          <div className="lg-title">Araucanía Viajes</div>
          <div className="lg-sub">Portal del conductor · acceso privado</div>
          {error && <div className="lg-error">⚠️ {error}</div>}
          <form onSubmit={handleLogin}>
            <div className="lg-field">
              <label>Correo electrónico</label>
              <input className={`lg-input ${error?"err":""}`} type="email" placeholder="tu@correo.com"
                value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/>
            </div>
            <div className="lg-field">
              <label>Contraseña</label>
              <div className="lg-input-wrap">
                <input className={`lg-input ${error?"err":""}`} type={showPass?"text":"password"} placeholder="••••••••"
                  value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/>
                <button type="button" className="lg-eye" onClick={()=>setShowPass(s=>!s)}>{showPass?"🙈":"👁️"}</button>
              </div>
            </div>
            <button className="lg-btn" type="submit" disabled={loading}>
              {loading ? <><span className="lg-spinner"/>Verificando…</> : "Entrar al portal"}
            </button>
          </form>
          <div className="lg-footer">araucaniaviajes.cl · MULTIX SPA</div>
        </div>
      </div>
    </>
  );
}

// ─── SocioAuthGate ────────────────────────────────────────────
function SocioAuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [perfil,  setPerfil]  = useState(undefined);

  const verificar = async (s) => {
    if (!s?.user) { setPerfil(null); return; }

    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .eq("user_id", s.user.id)
      .maybeSingle();

    // Solo socios pueden entrar aquí
    if (error || !data || data.rol !== "socio") {
      await supabase.auth.signOut();
      setPerfil(null);
      return;
    }
    setPerfil(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      verificar(s);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) { setPerfil(null); return; }
      verificar(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined || (session && perfil === undefined)) return (
    <div style={{minHeight:"100vh",background:"#1a1611",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
      <div style={{width:36,height:36,border:"3px solid #D4CBB840",borderTopColor:"#EDE5D0",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{color:"#D4CBB880",fontSize:".8rem",fontFamily:"DM Sans,sans-serif"}}>Verificando acceso…</span>
    </div>
  );

  if (!session || perfil === null) return (
    <LoginScreen onLogin={() =>
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        verificar(s);
      })
    }/>
  );

  return children({ perfil, session });
}

// ─── Calendario del socio ─────────────────────────────────────
function CalendarioSocio({ viajes, onDiaClick }) {
  const hoy = new Date();
  const [mes,  setMes]  = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const primerDia  = new Date(anio, mes, 1).getDay();
  const diasEnMes  = new Date(anio, mes + 1, 0).getDate();
  const diasAnt    = new Date(anio, mes, 0).getDate();

  const viajesPorFecha = viajes
    .filter(v => v.estado !== "cancelado")
    .reduce((acc, v) => {
      if (!acc[v.fecha]) acc[v.fecha] = [];
      acc[v.fecha].push(v);
      return acc;
    }, {});

  const navMes = (d) => {
    let nm = mes + d, na = anio;
    if (nm < 0) { nm = 11; na--; }
    if (nm > 11) { nm = 0; na++; }
    setMes(nm); setAnio(na);
  };

  const celdas = [];
  for (let i = primerDia - 1; i >= 0; i--)
    celdas.push({ dia: diasAnt - i, otroMes: true });
  for (let d = 1; d <= diasEnMes; d++) {
    const mm  = String(mes + 1).padStart(2, "0");
    const dd  = String(d).padStart(2, "0");
    const key = `${anio}-${mm}-${dd}`;
    celdas.push({ dia: d, otroMes: false, fecha: key, viajes: viajesPorFecha[key] || [] });
  }
  const resto = 7 - (celdas.length % 7);
  if (resto < 7) for (let i = 1; i <= resto; i++) celdas.push({ dia: i, otroMes: true });

  const todayKey = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

  return (
    <div className="sd-cal">
      <div className="sd-cal-hdr">
        <button className="sd-cal-nav" onClick={() => navMes(-1)}>◀</button>
        <span className="sd-cal-mes">{MESES[mes]} {anio}</span>
        <button className="sd-cal-nav" onClick={() => navMes(1)}>▶</button>
      </div>
      <div className="sd-cal-grid">
        {DIAS_SEMANA.map(d => <div key={d} className="sd-cal-dow">{d}</div>)}
      </div>
      <div className="sd-cal-grid">
        {celdas.map((c, i) => {
          if (c.otroMes) return (
            <div key={i} className="sd-cal-day vacio">
              <div className="sd-dia-num otro-mes">{c.dia}</div>
            </div>
          );
          const tieneViajes = c.viajes?.length > 0;
          const esHoy       = c.fecha === todayKey;
          const compartidos = c.viajes?.filter(v => v.tipo === "compartido") || [];
          const privados    = c.viajes?.filter(v => v.tipo === "privado") || [];
          return (
            <div key={i}
              className={`sd-cal-day${tieneViajes ? " tiene-viajes" : ""}${esHoy ? " hoy" : ""}`}
              onClick={() => tieneViajes && onDiaClick(c.fecha, c.viajes)}>
              <div className={`sd-dia-num${c.otroMes ? " otro-mes" : ""}`}>{c.dia}</div>
              <div className="sd-dia-dots">
                {compartidos.length > 0 && <div className="sd-dia-dot compartido">🚌 {compartidos.length}</div>}
                {privados.length > 0    && <div className="sd-dia-dot privado">🚐 {privados.length}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal día ────────────────────────────────────────────────
function ModalDia({ fecha, viajes, onClose }) {
  if (!fecha) return null;
  return (
    <div className="sd-ov" onClick={onClose}>
      <div className="sd-modal" onClick={e => e.stopPropagation()}>
        <div className="sd-modal-hdr">
          <div>
            <div className="sd-modal-titulo">📅 {fmtFecha(fecha)}</div>
            <div className="sd-modal-sub">{viajes.length} viaje(s)</div>
          </div>
          <button className="sd-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="sd-modal-body">
          {viajes.map(v => {
            const cfg = ESTADO_CFG[v.estado] || ESTADO_CFG.en_espera;
            const reservasActivas = v.reservas?.filter(r => r.estado !== "cancelada") || [];
            return (
              <div key={v.id} style={{background:"#faf8f5",border:"1px solid #ede8e0",borderRadius:12,padding:"14px",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:".9rem",color:"#1a1611"}}>{v.ruta?.nombre || "Ruta sin nombre"}</div>
                    <div style={{fontSize:".7rem",color:"#9a8e80",marginTop:2}}>
                      🕐 {v.hora_salida?.slice(0,5)} · {v.tipo === "compartido" ? "🚌 Compartido" : "🚐 Van privada"}
                    </div>
                  </div>
                  <span className="sd-estado" style={{color:cfg.color,background:cfg.bg}}>{cfg.label}</span>
                </div>
                {reservasActivas.length > 0 && (
                  <div className="sd-pax-list">
                    <div className="sd-modal-seccion">Pasajeros ({reservasActivas.reduce((s,r)=>s+r.num_asientos,0)})</div>
                    {reservasActivas.map(r => (
                      <div key={r.id} className="sd-pax-row">
                        <div>
                          <div className="sd-pax-name">{r.nombre}</div>
                          <div className="sd-pax-sub">{r.num_asientos} asiento(s)</div>
                        </div>
                        <button className="sd-btn-wa" onClick={() => {
                          const msg = encodeURIComponent(`Hola ${r.nombre.split(" ")[0]} 👋, soy tu conductor de Araucanía Viajes para el viaje del ${fmtFechaCorta(fecha)}.`);
                          window.open(`https://wa.me/${r.telefono.replace(/\D/g,"")}?text=${msg}`, "_blank");
                        }}>💬</button>
                      </div>
                    ))}
                  </div>
                )}
                {reservasActivas.length === 0 && (
                  <div style={{fontSize:".78rem",color:"#b0a898",paddingTop:4}}>Sin pasajeros activos</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Principal ──────────────────────────────────────
function SocioDashboardInner({ perfil }) {
  const [socio,    setSocio]    = useState(null);
  const [viajes,   setViajes]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modalDia, setModalDia] = useState(null);

  const hoy = new Date().toISOString().split("T")[0];

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    // Cargar datos del socio
    const { data: socioData } = await supabase
      .from("socios")
      .select("*, vehiculos(*)")
      .eq("user_id", perfil.user_id)
      .maybeSingle();
    setSocio(socioData);

    if (socioData) {
      // Cargar viajes del socio (RLS filtra automáticamente)
      const { data: viajesData } = await supabase
        .from("viajes")
        .select(`*, ruta:rutas(nombre,origen,destino),
          reservas(id,nombre,telefono,num_asientos,estado)`)
        .eq("socio_id", socioData.id)
        .neq("estado", "cancelado")
        .order("fecha",      { ascending: true })
        .order("hora_salida",{ ascending: true });
      setViajes(viajesData || []);
    }
    setLoading(false);
  }, [perfil.user_id]);

  useEffect(() => {
    cargarDatos();
    // Realtime
    const ch = supabase.channel("socio-rt")
      .on("postgres_changes", { event:"*", schema:"public", table:"viajes"  }, cargarDatos)
      .on("postgres_changes", { event:"*", schema:"public", table:"reservas"}, cargarDatos)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [cargarDatos]);

  // ── Stats ────────────────────────────────────────────────
  const viajesHoy   = viajes.filter(v => v.fecha === hoy);
  const viajesProx  = viajes.filter(v => v.fecha > hoy).slice(0, 6);
  const totalPax    = viajes.reduce((acc, v) =>
    acc + (v.reservas?.filter(r => r.estado !== "cancelada").reduce((s,r) => s + r.num_asientos, 0) || 0), 0);
  const comisionEst = viajes.reduce((acc, v) => {
    const ingresos = (v.precio_por_pax || 0) *
      (v.reservas?.filter(r => r.estado !== "cancelada").reduce((s,r) => s + r.num_asientos, 0) || 0);
    return acc + ingresos * ((socio?.comision_porcentaje || 0) / 100);
  }, 0);

  return (
    <>
      <style>{css}</style>
      <div className="sd">

        {/* Header */}
        <div className="sd-hdr">
          <div className="sd-hdr-marca">
            <div className="sd-hdr-ico">🚐</div>
            <div>
              <div className="sd-hdr-titulo">{socio?.nombre_completo || perfil.nombre}</div>
              <div className="sd-hdr-sub">Portal conductor · Araucanía Viajes</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="sd-live"/>
            <button className="sd-btn-salir" onClick={() => supabase.auth.signOut()}>Salir</button>
          </div>
        </div>

        <div className="sd-main">

          {loading ? (
            <div className="sd-spinner-wrap">
              <div className="sd-spinner"/>
              Cargando tus viajes…
            </div>
          ) : (
            <>
              {/* Banner */}
              <div className="sd-banner">
                <div>
                  <div className="sd-banner-nombre">Hola, {socio?.nombre_completo?.split(" ")[0]} 👋</div>
                  <div className="sd-banner-sub">
                    {viajesHoy.length > 0
                      ? `Tienes ${viajesHoy.length} viaje(s) hoy`
                      : "No tienes viajes hoy"}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                  {socio?.vehiculos?.map(v => (
                    <div key={v.id} className="sd-vehiculo-tag">
                      🚐 {v.patente} · {v.marca} {v.modelo}
                    </div>
                  ))}
                </div>
              </div>

              {/* KPIs */}
              <div className="sd-kpi-grid">
                <div className="sd-kpi">
                  <div className="sd-kpi-num orange">{viajesHoy.length}</div>
                  <div className="sd-kpi-label">Viajes hoy</div>
                </div>
                <div className="sd-kpi">
                  <div className="sd-kpi-num green">{totalPax}</div>
                  <div className="sd-kpi-label">Pasajeros totales</div>
                  <div className="sd-kpi-sub">en tus viajes activos</div>
                </div>
                <div className="sd-kpi">
                  <div className="sd-kpi-num money">{fmtPeso(comisionEst)}</div>
                  <div className="sd-kpi-label">Comisión estimada</div>
                  <div className="sd-kpi-sub">{socio?.comision_porcentaje}% de ingresos</div>
                </div>
              </div>

              {/* Calendario */}
              <CalendarioSocio
                viajes={viajes}
                onDiaClick={(fecha, v) => setModalDia({ fecha, viajes: v })}
              />

              {/* Viajes de hoy */}
              {viajesHoy.length > 0 && (
                <div>
                  <div className="sd-sec-hdr">VIAJES DE HOY ({viajesHoy.length})</div>
                  <div className="sd-cards">
                    {viajesHoy.map(v => {
                      const cfg = ESTADO_CFG[v.estado] || ESTADO_CFG.en_espera;
                      const pax = v.reservas?.filter(r => r.estado !== "cancelada").reduce((s,r) => s+r.num_asientos, 0) || 0;
                      return (
                        <div key={v.id} className="sd-card">
                          <div className="sd-card-top">
                            <div className="sd-card-ruta">{v.ruta?.nombre || "Ruta sin nombre"}</div>
                            <span className="sd-estado" style={{color:cfg.color,background:cfg.bg}}>{cfg.label}</span>
                          </div>
                          <div className="sd-card-meta">
                            <span>🕐 {v.hora_salida?.slice(0,5)}</span>
                            <span>👥 {pax} pasajero(s)</span>
                            <span>{v.tipo === "compartido" ? "🚌 Compartido" : "🚐 Van privada"}</span>
                          </div>
                          {v.reservas?.filter(r => r.estado !== "cancelada").map(r => (
                            <div key={r.id} className="sd-pax-list">
                              <div className="sd-pax-row">
                                <div>
                                  <div className="sd-pax-name">{r.nombre}</div>
                                  <div className="sd-pax-sub">{r.num_asientos} asiento(s)</div>
                                </div>
                                <button className="sd-btn-wa" onClick={() => {
                                  const msg = encodeURIComponent(`Hola ${r.nombre.split(" ")[0]} 👋, soy tu conductor de hoy en Araucanía Viajes. Estoy en camino 🚐`);
                                  window.open(`https://wa.me/${r.telefono.replace(/\D/g,"")}?text=${msg}`, "_blank");
                                }}>💬</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Próximos viajes */}
              {viajesProx.length > 0 && (
                <div>
                  <div className="sd-sec-hdr">PRÓXIMOS VIAJES ({viajesProx.length})</div>
                  <div className="sd-cards">
                    {viajesProx.map(v => {
                      const pax = v.reservas?.filter(r => r.estado !== "cancelada").reduce((s,r) => s+r.num_asientos, 0) || 0;
                      return (
                        <div key={v.id} className="sd-card">
                          <div className="sd-card-top">
                            <div className="sd-card-ruta">{v.ruta?.nombre || "Ruta sin nombre"}</div>
                            <div className="sd-card-fecha">{fmtFechaCorta(v.fecha)}</div>
                          </div>
                          <div className="sd-card-meta">
                            <span>🕐 {v.hora_salida?.slice(0,5)}</span>
                            <span>👥 {pax} pax</span>
                            <span>{v.tipo === "compartido" ? "🚌" : "🚐"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viajes.length === 0 && (
                <div className="sd-empty">
                  <div style={{fontSize:"2rem",marginBottom:8}}>🗓️</div>
                  No tienes viajes asignados aún.
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal día */}
        {modalDia && (
          <ModalDia
            fecha={modalDia.fecha}
            viajes={modalDia.viajes}
            onClose={() => setModalDia(null)}
          />
        )}
      </div>
    </>
  );
}

export default function SocioDashboard() {
  return (
    <SocioAuthGate>
      {({ perfil }) => <SocioDashboardInner perfil={perfil} />}
    </SocioAuthGate>
  );
}