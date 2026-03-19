import { createClient } from "@supabase/supabase-js";

const key = "__supabase_admin__";

if (!window[key]) {
  window[key] = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        storageKey: "av_admin_session",
        autoRefreshToken: true,
      }
    }
  );
}

export default window[key];
