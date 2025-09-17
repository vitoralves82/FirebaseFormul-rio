import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key) {
  // Ajuda durante build/local
  // eslint-disable-next-line no-console
  console.warn('⚠️ Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env');
}

export const supabase = createClient(url, key);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn('⚠️ Variáveis NEXT_PUBLIC_SUPABASE_URL/ANON_KEY ausentes no runtime.');
}
