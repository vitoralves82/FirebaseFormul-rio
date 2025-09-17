import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Falha explícita pra não “mascarar” com 401 do PostgREST
  throw new Error('Supabase: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis do Vercel.');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
