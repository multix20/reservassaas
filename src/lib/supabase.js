import { createClient } from "@supabase/supabase-js";

const url     = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/* Sin credenciales, createClient() lanza y deja la app en blanco.
   Exponemos la bandera para que App muestre una pantalla explicativa. */
export const configOk = Boolean(url && anonKey);

let supabase = null;

if (configOk && typeof window !== "undefined") {
  if (!window.__sb__) {
    window.__sb__ = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        storageKey: "rss_session",  // clave única evita conflictos
      }
    });
  }
  supabase = window.__sb__;
}

export default supabase;
