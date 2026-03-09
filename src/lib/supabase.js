import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://pyloifgprupypgkhkqmx.supabase.co",
  "sb_publishable_UN__-qAOLiEli5p9xY9ypQ_Qr9wxajL"
);

export default supabase;