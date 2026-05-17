import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dvigqhxdiaazupoxrzpn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aWdxaHhkaWFhenVwb3hyenBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgzMTU2OSwiZXhwIjoyMDk0NDA3NTY5fQ.QzFgorHWx7u7xqRvmPD0d67-1_3ZtoVv0ikSTVsncUw';

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
      autoRefreshToken: false,
          persistSession: false
            }
            });
