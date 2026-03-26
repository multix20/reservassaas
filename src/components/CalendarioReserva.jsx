import React, { useState } from 'react';

const fmt = (n) =>
  new Intl.NumberFormat('es-CL', { notation: 'compact', maximumFractionDigits: 0 }).format(n);

const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const isSameDay    = (a, b) => a && b && a.toDateString() === b.toDateString();
const isBetween    = (d, s, e) => s && e && d > s && d < e;
const isBeforeToday = (d) => { const h = new Date(); h.setHours(0,0,0,0); return d < h; };

const NARANJA = '#FF6A2F';

export default function CalendarioReserva({ precioNoche = 12000, onSelect, onClose, inicioInicial = null, finInicial = null }) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const parseFecha = (iso) => iso ? (() => { const d = new Date(iso + 'T12:00:00'); d.setHours(0,0,0,0); return d; })() : null;
  const [año, setAño]       = useState(() => (inicioInicial ? new Date(inicioInicial+'T12:00:00') : hoy).getFullYear());
  const [mes, setMes]       = useState(() => (inicioInicial ? new Date(inicioInicial+'T12:00:00') : hoy).getMonth());
  const [inicio, setInicio] = useState(() => parseFecha(inicioInicial));
  const [fin, setFin]       = useState(() => parseFecha(finInicial));
  const [hover, setHover]   = useState(null);

  const diasEnMes = new Date(año, mes+1, 0).getDate();
  const primerDia = new Date(año, mes, 1).getDay();

  const prevMes = () => { if (mes === 0) { setMes(11); setAño(a=>a-1); } else setMes(m=>m-1); };
  const nextMes = () => { if (mes === 11) { setMes(0); setAño(a=>a+1); } else setMes(m=>m+1); };

  const clickDia = (date) => {
    if (isBeforeToday(date)) return;
    if (!inicio || (inicio && fin)) { setInicio(date); setFin(null); }
    else {
      if (date <= inicio) { setInicio(date); setFin(null); return; }
      setFin(date);
      if (onSelect) onSelect(inicio, date, Math.round((date - inicio) / 86400000));
    }
  };

  const aplicar = () => { if (inicio && fin && onClose) onClose(inicio, fin); };
  const limpiar = () => { setInicio(null); setFin(null); };

  const celdas = [];
  for (let i = 0; i < primerDia; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(año, mes, d));

  const finEfectivo = fin || hover;

  const fmtCorto = (d) => d ? d.toLocaleDateString('es-CL', { day:'numeric', month:'short' }) : '—';

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#fff', width:'100%' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'18px 18px 0' }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#111' }}>Selecciona las fechas</div>
          <div style={{ fontSize:12, color:'#aaa', marginTop:3 }}>
            {inicio && fin
              ? `${fmtCorto(inicio)} - ${fmtCorto(fin)}`
              : inicio ? 'Selecciona la fecha de salida'
              : 'Selecciona la fecha de entrada'}
          </div>
        </div>
        {onClose && (
          <button onClick={() => onClose(inicio, fin)}
            style={{ width:30, height:30, borderRadius:'50%', border:'0.5px solid #ddd', background:'#fff', cursor:'pointer', fontSize:16, color:'#888', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            ×
          </button>
        )}
      </div>

      {/* Navegación mes */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 18px', marginBottom:14 }}>
        <button onClick={prevMes}
          style={{ width:36, height:36, borderRadius:10, border:'0.5px solid #e0e0e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 3L6 8l4 5" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ fontSize:15, fontWeight:700, color:'#111' }}>{MESES[mes]} {año}</div>
        <button onClick={nextMes}
          style={{ width:36, height:36, borderRadius:10, border:'0.5px solid #e0e0e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 3l4 5-4 5" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Días semana */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 10px', marginBottom:4 }}>
        {DIAS.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:11, color:'#bbb', fontWeight:600, padding:'2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Grid días */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 10px', gap:'2px 0' }}>
        {celdas.map((date, idx) => {
          if (!date) return <div key={`e-${idx}`}/>;
          const esInicio = isSameDay(date, inicio);
          const esFin    = isSameDay(date, fin);
          const enRango  = isBetween(date, inicio, finEfectivo);
          const pasado   = isBeforeToday(date);
          const selec    = esInicio || esFin;

          let bg = 'transparent', color = '#111', borderRadius = '50%';
          if (pasado) color = '#ccc';
          if (enRango) { bg = '#FFE8DC'; color = '#c04010'; borderRadius = '0'; }
          if (esInicio && finEfectivo) { bg = NARANJA; color = '#fff'; borderRadius = '50% 0 0 50%'; }
          if (esFin)   { bg = NARANJA; color = '#fff'; borderRadius = '0 50% 50% 0'; }
          if (esInicio && !finEfectivo) { bg = NARANJA; color = '#fff'; borderRadius = '50%'; }
          if (isSameDay(date, hover) && inicio && !fin) { bg = NARANJA; color = '#fff'; borderRadius = '50%'; }

          return (
            <div key={idx}
              onClick={() => clickDia(date)}
              onMouseEnter={() => { if (inicio && !fin) setHover(date); }}
              onMouseLeave={() => setHover(null)}
              style={{ background: bg, borderRadius, cursor: pasado?'default':'pointer', padding:'4px 0', transition:'background .1s' }}>
              <div style={{ textAlign:'center', fontSize:14, fontWeight: selec?700:400, color, lineHeight:1.3 }}>
                {date.getDate()}
              </div>
              {!pasado && (
                <div style={{ textAlign:'center', fontSize:8, color: selec?'rgba(255,255,255,.75)': enRango?'#c04010':'#bbb', lineHeight:1 }}>
                  {fmt(precioNoche)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ height:'0.5px', background:'#f0f0f0', margin:'14px 0' }}/>

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background: NARANJA }}/>
          <span style={{ fontSize:11, color:'#888' }}>Restricciones pueden aplicar</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={limpiar}
            style={{ fontSize:12, color:'#999', background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", padding:'0 4px' }}>
            Limpiar
          </button>
          <button onClick={aplicar} disabled={!inicio || !fin}
            style={{ background: inicio&&fin ? NARANJA : '#e8e5de', color: inicio&&fin?'#fff':'#aaa', border:'none', borderRadius:50, padding:'10px 22px', fontSize:13, fontWeight:700, cursor: inicio&&fin?'pointer':'default', fontFamily:"'DM Sans',sans-serif" }}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
