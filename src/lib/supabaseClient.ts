import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn('⚠️ Variáveis NEXT_PUBLIC_SUPABASE_URL/ANON_KEY ausentes no runtime.');
}
