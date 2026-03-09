import React, { useEffect, useState } from 'react';
import { X, MapPin, Calendar, Clock, Users, Hash, Plane, Trash2 } from 'lucide-react';
import supabase from '../lib/supabase';

const ESTADO_STYLES = {
  pendiente:  { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: 'Pendiente'  },
  confirmada: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Confirmada' },
  cancelada:  { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', label: 'Cancelada'  },
};

export default function MisReservas({ onClose }) {
  const [reservas,    setReservas]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [userEmail,   setUserEmail]   = useState('');
  const [confirmId,   setConfirmId]   = useState(null);   // id en espera de confirmación
  const [deleting,    setDeleting]    = useState(null);   // id siendo eliminado

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
          .select('*')
          .eq('email', email)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setReservas(data || []);
      } catch (e) {
        setError('No se pudieron cargar tus reservas.');
      } finally {
        setLoading(false);
      }
    };
    fetchReservas();
  }, []);

  const handleDelete = async (id) => {
    if (confirmId !== id) { setConfirmId(id); return; }   // primer clic → pedir confirmación
    setDeleting(id);
    try {
      const { error: err } = await supabase.from('reservas').delete().eq('id', id);
      if (err) throw err;
      setReservas(prev => prev.filter(r => r.id !== id));
    } catch {
      setError('No se pudo eliminar la reserva.');
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    const [y, m, d] = fecha.split('-');
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
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
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="mr-body">
          {loading && (
            <div className="mr-center">
              <span className="mr-spinner" />
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
            const st = ESTADO_STYLES[r.estado] ?? ESTADO_STYLES.pendiente;
            return (
              <div key={r.id} className="mr-card">
                {/* Estado badge */}
                <span className="mr-badge" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                  {st.label}
                </span>

                {/* Ruta */}
                <div className="mr-ruta">
                  <MapPin size={14} className="mr-icon" />
                  <span>{r.ruta}</span>
                </div>

                {/* Grid de datos */}
                <div className="mr-grid">
                  <div className="mr-data">
                    <Calendar size={13} className="mr-data-icon" />
                    <span>{formatFecha(r.fecha)}</span>
                  </div>
                  {r.hora && (
                    <div className="mr-data">
                      <Clock size={13} className="mr-data-icon" />
                      <span>{r.hora}</span>
                    </div>
                  )}
                  <div className="mr-data">
                    <Users size={13} className="mr-data-icon" />
                    <span>{r.pasajeros} {r.pasajeros === 1 ? 'pasajero' : 'pasajeros'}</span>
                  </div>
                  <div className="mr-data">
                    <Hash size={13} className="mr-data-icon" />
                    <span className="mr-id">{r.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>

                {/* Vuelo (si aplica) */}
                {r.vuelo_numero && (
                  <div className="mr-vuelo">
                    <Plane size={12} />
                    <span>Vuelo {r.vuelo_numero}</span>
                    {r.vuelo_origen && <span>· {r.vuelo_origen} → {r.vuelo_destino}</span>}
                    {r.vuelo_hora_llegada && <span>· Llega {r.vuelo_hora_llegada}</span>}
                  </div>
                )}

                {/* Notas */}
                {r.notas && <p className="mr-notas">"{r.notas}"</p>}

                {/* Botón eliminar */}
                <div className="mr-card-footer">
                  {confirmId === r.id ? (
                    <div className="mr-confirm">
                      <span>¿Eliminar esta reserva?</span>
                      <button className="mr-btn-cancel-confirm" onClick={() => setConfirmId(null)}>No</button>
                      <button className="mr-btn-delete-confirm" onClick={() => handleDelete(r.id)} disabled={deleting === r.id}>
                        {deleting === r.id ? <span className="mr-spinner-sm"/> : 'Sí, eliminar'}
                      </button>
                    </div>
                  ) : (
                    <button className="mr-btn-delete" onClick={() => handleDelete(r.id)}>
                      <Trash2 size={13}/> Eliminar
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

/* ── CSS ─────────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  .mr-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.65);backdrop-filter:blur(5px);animation:mrFadeIn .2s ease both}
  @keyframes mrFadeIn{from{opacity:0}to{opacity:1}}

  .mr-panel{position:fixed;top:0;right:0;bottom:0;z-index:501;width:min(420px,100vw);background:#fff;display:flex;flex-direction:column;animation:mrSlideIn .32s cubic-bezier(.4,0,.2,1) both;font-family:'DM Sans',sans-serif;overflow:hidden}
  @keyframes mrSlideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}

  .mr-header{display:flex;align-items:flex-start;justify-content:space-between;padding:1.4rem 1.4rem 1rem;border-bottom:1px solid #f0f0f0;flex-shrink:0}
  .mr-title{font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:800;color:#000;margin:0 0 2px}
  .mr-email{font-size:.78rem;color:#999;margin:0}
  .mr-close{width:34px;height:34px;border-radius:8px;border:1px solid #e5e5e5;background:transparent;color:#999;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;flex-shrink:0}
  .mr-close:hover{border-color:#ccc;color:#000}

  .mr-body{flex:1;overflow-y:auto;padding:1rem 1.2rem;display:flex;flex-direction:column;gap:12px}

  .mr-center{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:3rem 0;color:#999;font-size:.9rem}
  .mr-spinner{width:24px;height:24px;border:2.5px solid #e5e5e5;border-top-color:#000;border-radius:50%;animation:mrSpin .7s linear infinite}
  @keyframes mrSpin{to{transform:rotate(360deg)}}
  .mr-loading-txt{font-size:.85rem;color:#aaa}

  .mr-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1rem;text-align:center;color:#999}
  .mr-empty-icon{font-size:2.5rem;margin-bottom:.75rem}
  .mr-empty-title{font-weight:700;color:#555;font-size:1rem;margin:0 0 4px}
  .mr-empty-sub{font-size:.83rem;color:#aaa;margin:0}

  .mr-card{background:#fafafa;border:1px solid #efefef;border-radius:14px;padding:1rem 1.1rem;display:flex;flex-direction:column;gap:8px;transition:box-shadow .2s}
  .mr-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.07)}

  .mr-badge{display:inline-flex;align-items:center;font-size:.72rem;font-weight:700;padding:3px 9px;border-radius:99px;letter-spacing:.03em;align-self:flex-start}

  .mr-ruta{display:flex;align-items:center;gap:6px;font-size:.95rem;font-weight:600;color:#111}
  .mr-icon{color:#888;flex-shrink:0}

  .mr-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px}
  .mr-data{display:flex;align-items:center;gap:5px;font-size:.8rem;color:#666}
  .mr-data-icon{color:#bbb;flex-shrink:0}
  .mr-id{font-family:monospace;font-size:.75rem;color:#aaa}

  .mr-vuelo{display:flex;align-items:center;gap:5px;font-size:.78rem;color:#888;background:#f5f5f5;padding:6px 9px;border-radius:7px}

  .mr-notas{font-size:.8rem;color:#999;font-style:italic;margin:0;border-left:2px solid #e5e5e5;padding-left:8px}

  .mr-card-footer{border-top:1px solid #f0f0f0;padding-top:8px;margin-top:2px}
  .mr-btn-delete{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1px solid #fee2e2;background:transparent;color:#dc2626;font-size:.78rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .18s}
  .mr-btn-delete:hover{background:#fef2f2;border-color:#fca5a5}
  .mr-confirm{display:flex;align-items:center;gap:8px;font-size:.8rem;color:#555;flex-wrap:wrap}
  .mr-btn-cancel-confirm{padding:5px 12px;border-radius:8px;border:1px solid #e5e5e5;background:transparent;color:#777;font-size:.78rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .18s}
  .mr-btn-cancel-confirm:hover{border-color:#ccc;color:#000}
  .mr-btn-delete-confirm{padding:5px 12px;border-radius:8px;border:none;background:#dc2626;color:#fff;font-size:.78rem;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:5px}
  .mr-btn-delete-confirm:hover:not(:disabled){background:#b91c1c}
  .mr-btn-delete-confirm:disabled{opacity:.5;cursor:not-allowed}
  .mr-spinner-sm{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:mrSpin .7s linear infinite;display:inline-block}
`;