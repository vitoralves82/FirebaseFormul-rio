// utils/supabase/server.ts
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
// opcional: force server-only
// import "server-only";

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

// Cliente para SSR/RSC, usando cookies do Next
export const createSSRClient = (cookieStore: ReturnType<typeof cookies>) => {
  const { url, anonKey } = getPublicConfig();
  return createServerClient(/* <Database> */ url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Chamado em Server Component (não pode setar cookie aqui). Use middleware p/ refresh de sessão.
        }
      },
    },
  });
};

export const supabaseServer = () => {
  const cookieStore = cookies();
  return createSSRClient(cookieStore);
};

// Cliente admin (service role) — use SOMENTE no backend (server actions, route handlers, jobs)
export const supabaseAdmin = (): SupabaseClient /* <Database> */ => {
  const { url, serviceRoleKey } = getServiceConfig();
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
};
