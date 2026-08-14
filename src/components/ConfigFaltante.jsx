import React from 'react';

/*
 * Se muestra cuando faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
 * Sin esto la app queda en blanco y sin pistas de qué pasó.
 */
export default function ConfigFaltante() {
  const faltan = [
    ['VITE_SUPABASE_URL',      import.meta.env.VITE_SUPABASE_URL],
    ['VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY],
  ].filter(([, valor]) => !valor).map(([nombre]) => nombre);

  return (
    <div style={{ minHeight:'100vh', background:'#f8f8f8', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 4px 28px rgba(0,0,0,.09)', padding:'28px 26px', maxWidth:520, width:'100%' }}>

        <div style={{ width:44, height:44, borderRadius:12, background:'#fff5f0', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v5M12 16.5v.5" stroke="#FF6A2F" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="9" stroke="#FF6A2F" strokeWidth="1.8"/>
          </svg>
        </div>

        <h1 style={{ fontSize:20, fontWeight:800, color:'#111', letterSpacing:'-.02em', marginBottom:8 }}>
          Falta configurar la conexión
        </h1>
        <p style={{ fontSize:14, color:'#666', lineHeight:1.65, marginBottom:18 }}>
          La aplicación no puede conectarse a Supabase porque no encuentra sus credenciales.
          {faltan.length > 0 && ' Falta definir:'}
        </p>

        {faltan.length > 0 && (
          <ul style={{ listStyle:'none', marginBottom:18, display:'flex', flexDirection:'column', gap:6 }}>
            {faltan.map(nombre => (
              <li key={nombre} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#111' }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:'#E24B4A', flexShrink:0 }}/>
                <code style={{ background:'#f5f5f5', borderRadius:5, padding:'2px 7px', fontSize:12.5 }}>{nombre}</code>
              </li>
            ))}
          </ul>
        )}

        <p style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:8 }}>Cómo solucionarlo</p>
        <p style={{ fontSize:13, color:'#666', lineHeight:1.65, marginBottom:10 }}>
          En local, copia <code style={{ background:'#f5f5f5', borderRadius:4, padding:'1px 6px' }}>.env.example</code> a{' '}
          <code style={{ background:'#f5f5f5', borderRadius:4, padding:'1px 6px' }}>.env</code> y completa los valores del panel de Supabase
          (Project Settings → API). Después reinicia el servidor de desarrollo.
        </p>
        <p style={{ fontSize:13, color:'#666', lineHeight:1.65 }}>
          En Netlify, defínelas en Site configuration → Environment variables y vuelve a desplegar.
        </p>

      </div>
    </div>
  );
}
