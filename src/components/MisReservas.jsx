import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, Users, Hash, Trash2 } from 'lucide-react';
import supabase from '../lib/supabase';

const ESTADO_STYLES = {
  pendiente:  { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: 'Pendiente'  },
  confirmada: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Confirmada' },
  cancelada:  { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', label: 'Cancelada'  },
};

// Formatea "2026-04-04" → "sáb 4 abr 2026"
const formatFecha = (fecha) => {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

// Formatea "13:00:00" o "13:00" → "13:00"
const formatHora = (hora) => {
  if (!hora) return '—';
  return hora.slice(0, 5);
};

// Parsea notas y extrae etiquetas relevantes
const parsearNotas = (notas) => {
  if (!notas) return [];
  const tags = [];
  if (notas.includes('Solo ida'))     tags.push({ label: 'Solo ida',    color: '#6b7280' });
  if (notas.includes('Ida y vuelta')) tags.push({ label: 'Ida y vuelta', color: '#2563eb' });
  if (notas.includes('IDA'))          tags.push({ label: 'Ida',          color: '#2563eb' });
  if (notas.includes('REGRESO'))      tags.push({ label: 'Regreso',      color: '#7c3aed' });
  if (notas.includes('Van privada'))  tags.push({ label: 'Van privada',  color: '#b45309' });
  if (notas.includes('Compartido'))   tags.push({ label: 'Compartido',   color: '#0369a1' });
  if (notas.includes('flexible'))     tags.push({ label: 'Hora flexible', color: '#6b7280' });
  return tags;
};

// Separa origen y destino desde el nombre de la ruta
const separarRuta = (ruta) => {
  if (!ruta) return { origen: '—', destino: '—' };
  const partes = ruta.nombre || `${ruta.origen || ''} → ${ruta.destino || ''}`;
  const idx = partes.indexOf(' → ');
  if (idx === -1) return { origen: partes, destino: '' };
  return { origen: partes.slice(0, idx), destino: partes.slice(idx + 3) };
};

// Ícono Transfer SVG línea
const IcoTransfer = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="8" width="15" height="10" rx="2"/>
    <path d="M16 11l5 2v5h-5V11z"/>
    <circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/>
  </svg>
);

const IcoVan = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l5 7v5h-2"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <path d="M9 5v7h11"/>
  </svg>
);

export default function MisReservas({ onClose }) {
  const [reservas,  setReservas]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setError('Debes iniciar sesión.'); setLoading(false); return; }
        const email = session.user.email;
        setUserEmail(email);
        const { data, error: err } = await supabase
          .from('reservas')
          .select(`
            id, estado, num_asientos, notas, created_at,
            viajes ( fecha, tipo, hora_salida, rutas ( nombre, origen, destino ) )
          `)
          .eq('email', email)
          .neq('estado', 'cancelada')
          .order('created_at', { ascending: false });
        if (err) throw err;
        setReservas(data || []);
      } catch {
        setError('No se pudieron cargar tus reservas.');
      } finally {
        setLoading(false);
      }
    };
    fetchReservas();
  }, []);

  const handleDelete = async (id) => {
    if (confirmId !== id) { setConfirmId(id); return; }
    setDeleting(id);
    try {
      const { error: err } = await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id);
      if (err) throw err;
      setReservas(prev => prev.filter(r => r.id !== id));
    } catch {
      setError('No se pudo cancelar la reserva.');
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="mr-overlay" onClick={onClose} />
      <div className="mr-panel" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="mr-header">
          <div>
            <h2 className="mr-title">Mis reservas</h2>
            {userEmail && <p className="mr-email">{userEmail}</p>}
          </div>
          <button className="mr-close" onClick={onClose} aria-label="Cerrar">
            <X size={18}/>
          </button>
        </div>

        {/* Body */}
        <div className="mr-body">
          {loading && (
            <div className="mr-center">
              <span className="mr-spinner"/>
              <span className="mr-loading-txt">Cargando reservas…</span>
            </div>
          )}
          {!loading && error && (
            <div className="mr-empty">
              <span className="mr-empty-icon">⚠️</span>
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && reservas.length === 0 && (
            <div className="mr-empty">
              <span className="mr-empty-icon">🗺️</span>
              <p className="mr-empty-title">Sin reservas aún</p>
              <p className="mr-empty-sub">Cuando reserves un viaje aparecerá aquí.</p>
            </div>
          )}

          {!loading && reservas.map((r) => {
            const st     = ESTADO_STYLES[r.estado] ?? ESTADO_STYLES.pendiente;
            const viaje  = r.viajes;
            const { origen, destino } = separarRuta(viaje?.rutas);
            const tags   = parsearNotas(r.notas);
            const esVan  = viaje?.tipo !== 'compartido';

            return (
              <div key={r.id} className="mr-card">

                {/* Badge estado */}
                <span className="mr-badge" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                  {st.label}
                </span>

                {/* Ruta vertical */}
                <div className="mr-ruta-wrap">
                  <div className="mr-ruta-dots">
                    <div className="mr-dot-o"/>
                    <div className="mr-dot-line"/>
                    <div className="mr-dot-d"/>
                  </div>
                  <div className="mr-ruta-textos">
                    <span className="mr-ruta-txt">{origen}</span>
                    <span className="mr-ruta-txt">{destino}</span>
                  </div>
                </div>

                {/* Grilla fecha / hora / pax / id */}
                <div className="mr-grid">
                  <div className="mr-data">
                    <Calendar size={13} className="mr-data-icon"/>
                    <span>{formatFecha(viaje?.fecha)}</span>
                  </div>
                  <div className="mr-data">
                    <Clock size={13} className="mr-data-icon"/>
                    <span>{formatHora(viaje?.hora_salida)}</span>
                  </div>
                  <div className="mr-data">
                    <Users size={13} className="mr-data-icon"/>
                    <span>{r.num_asientos} {r.num_asientos === 1 ? 'pasajero' : 'pasajeros'}</span>
                  </div>
                  <div className="mr-data">
                    <Hash size={13} className="mr-data-icon"/>
                    <span className="mr-id">{r.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>

                {/* Tipo de servicio + etiquetas de notas */}
                <div className="mr-tags-row">
                  <span className="mr-tipo">
                    {esVan ? <IcoVan/> : <IcoTransfer/>}
                    {esVan ? 'Van privada' : 'Compartido'}
                  </span>
                  {tags.map((t, i) => (
                    <span key={i} className="mr-tag" style={{ color: t.color, borderColor: t.color + '44', background: t.color + '11' }}>
                      {t.label}
                    </span>
                  ))}
                </div>

                {/* Footer cancelar */}
                <div className="mr-card-footer">
                  {confirmId === r.id ? (
                    <div className="mr-confirm">
                      <span>¿Cancelar esta reserva?</span>
                      <button className="mr-btn-no" onClick={() => setConfirmId(null)}>No</button>
                      <button className="mr-btn-si" onClick={() => handleDelete(r.id)} disabled={deleting === r.id}>
                        {deleting === r.id ? <span className="mr-spinner-sm"/> : 'Sí, cancelar'}
                      </button>
                    </div>
                  ) : (
                    <button className="mr-btn-delete" onClick={() => handleDelete(r.id)}>
                      <Trash2 size={13}/> Cancelar reserva
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .mr-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,.6); backdrop-filter:blur(4px); animation:mrFadeIn .2s ease both; }
  @keyframes mrFadeIn { from{opacity:0} to{opacity:1} }

  .mr-panel { position:fixed; top:0; right:0; bottom:0; z-index:501; width:min(440px,100vw); background:#fff; display:flex; flex-direction:column; animation:mrSlideIn .32s cubic-bezier(.4,0,.2,1) both; font-family:'DM Sans',sans-serif; overflow:hidden; }
  @keyframes mrSlideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }

  .mr-header { display:flex; align-items:flex-start; justify-content:space-between; padding:1.4rem 1.4rem 1rem; border-bottom:1px solid #f0ece4; flex-shrink:0; }
  .mr-title  { font-family:'Syne',sans-serif; font-size:1.3rem; font-weight:800; color:#1a1611; margin:0 0 2px; }
  .mr-email  { font-size:.75rem; color:#9a9080; margin:0; }
  .mr-close  { width:34px; height:34px; border-radius:8px; border:1px solid #e5ddd0; background:transparent; color:#9a9080; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; flex-shrink:0; }
  .mr-close:hover { border-color:#c8bea8; color:#1a1611; }

  .mr-body { flex:1; overflow-y:auto; padding:1rem 1.2rem 2rem; display:flex; flex-direction:column; gap:10px; }

  .mr-center { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:3rem 0; color:#9a9080; font-size:.9rem; }
  .mr-spinner { width:22px; height:22px; border:2.5px solid #ede5d0; border-top-color:#1a1611; border-radius:50%; animation:mrSpin .7s linear infinite; }
  @keyframes mrSpin { to{transform:rotate(360deg)} }
  .mr-loading-txt { font-size:.82rem; color:#b8afa0; }

  .mr-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem 1rem; text-align:center; color:#9a9080; }
  .mr-empty-icon  { font-size:2.5rem; margin-bottom:.75rem; }
  .mr-empty-title { font-weight:700; color:#3d3629; font-size:1rem; margin:0 0 4px; }
  .mr-empty-sub   { font-size:.82rem; color:#b8afa0; margin:0; }

  /* Card */
  .mr-card { background:#faf8f4; border:1px solid #ede5d0; border-radius:14px; padding:.9rem 1rem; display:flex; flex-direction:column; gap:8px; transition:box-shadow .2s; }
  .mr-card:hover { box-shadow:0 4px 18px rgba(26,22,17,.08); }

  .mr-badge { display:inline-flex; align-items:center; font-size:.68rem; font-weight:700; padding:3px 9px; border-radius:99px; letter-spacing:.04em; align-self:flex-start; text-transform:uppercase; }

  /* Ruta vertical */
  .mr-ruta-wrap   { display:flex; align-items:center; gap:10px; }
  .mr-ruta-dots   { display:flex; flex-direction:column; align-items:center; gap:2px; flex-shrink:0; padding:2px 0; }
  .mr-dot-o       { width:8px; height:8px; border-radius:50%; border:2px solid #1a1611; }
  .mr-dot-line    { width:1px; height:16px; background:#d4cbb8; }
  .mr-dot-d       { width:8px; height:8px; border-radius:2px; background:#1a1611; }
  .mr-ruta-textos { display:flex; flex-direction:column; gap:6px; flex:1; min-width:0; }
  .mr-ruta-txt    { font-size:.88rem; font-weight:700; color:#1a1611; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  /* Grid datos */
  .mr-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px 12px; }
  .mr-data { display:flex; align-items:center; gap:5px; font-size:.78rem; color:#6b5e4e; }
  .mr-data-icon { color:#c8bea8; flex-shrink:0; }
  .mr-id { font-family:monospace; font-size:.72rem; color:#b8afa0; letter-spacing:.04em; }

  /* Tags */
  .mr-tags-row { display:flex; flex-wrap:wrap; gap:5px; align-items:center; }
  .mr-tipo { font-size:.75rem; font-weight:600; color:#6b5e4e; background:#ede5d0; padding:4px 9px; border-radius:7px; display:inline-flex; align-items:center; gap:5px; border:1px solid #d4cbb8; }
  .mr-tag  { font-size:.7rem; font-weight:700; padding:3px 8px; border-radius:6px; border:1px solid; letter-spacing:.02em; }

  /* Footer */
  .mr-card-footer { border-top:1px solid #ede5d0; padding-top:8px; margin-top:2px; }
  .mr-btn-delete  { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:8px; border:1px solid #fecaca; background:transparent; color:#dc2626; font-size:.75rem; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .15s; }
  .mr-btn-delete:hover { background:#fef2f2; border-color:#fca5a5; }

  .mr-confirm { display:flex; align-items:center; gap:8px; font-size:.78rem; color:#6b5e4e; flex-wrap:wrap; }
  .mr-btn-no  { padding:5px 12px; border-radius:8px; border:1px solid #e5ddd0; background:transparent; color:#6b5e4e; font-size:.75rem; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .15s; }
  .mr-btn-no:hover { border-color:#c8bea8; color:#1a1611; }
  .mr-btn-si  { padding:5px 12px; border-radius:8px; border:none; background:#dc2626; color:#fff; font-size:.75rem; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:5px; }
  .mr-btn-si:hover:not(:disabled) { background:#b91c1c; }
  .mr-btn-si:disabled { opacity:.5; cursor:not-allowed; }
  .mr-spinner-sm { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:mrSpin .7s linear infinite; display:inline-block; }
`;