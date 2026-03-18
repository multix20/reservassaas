import { createClient } from "@supabase/supabase-js";

let supabase;

if (typeof window !== "undefined") {
  if (!window.__sb__) {
    window.__sb__ = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          storageKey: "av_session",  // clave única evita conflictos
        }
      }
    );
  }
  supabase = window.__sb__;
}

export default supabase;