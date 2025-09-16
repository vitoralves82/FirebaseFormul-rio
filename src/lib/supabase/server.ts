// utils/supabase/server.ts
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Tipar seu schema se tiver: type Database = ...;

const getPublicConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, anonKey };
};

const getServiceConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");
  return { url, serviceRoleKey };
};

// Cliente para SSR/RSC. Como não usamos helpers específicos de SSR,
// garantimos que sessões não sejam persistidas automaticamente.
export const createSSRClient = () => {
  const { url, anonKey } = getPublicConfig();
  return createSupabaseClient(/* <Database> */ url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export const supabaseServer = async () => {
  return createSSRClient();
};

// Cliente admin (service role) — use SOMENTE no backend (server actions, route handlers, jobs)
export const supabaseAdmin = (): SupabaseClient /* <Database> */ => {
  const { url, serviceRoleKey } = getServiceConfig();
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
};
