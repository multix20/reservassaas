import { createClient } from "@supabase/supabase-js";

const url     = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const key     = "__supabase_admin__";

/* Mismo criterio que lib/supabase.js: sin credenciales no se instancia
   el cliente, App corta antes de montar cualquier vista. */
let supabaseAdmin = null;

if (url && anonKey && typeof window !== "undefined") {
  if (!window[key]) {
    window[key] = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        storageKey: "av_admin_session",
        autoRefreshToken: true,
      }
    });
  }
  supabaseAdmin = window[key];
}

export default supabaseAdmin;
