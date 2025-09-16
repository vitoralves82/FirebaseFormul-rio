import "server-only";

import { createClient, type SupabaseClient } from "./rest-client";

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  }

  return url;
};

const getAnonKey = () => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return anonKey;
};

const getServiceRoleKey = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");
  }

  return serviceRoleKey;
};

const createServerClient = (supabaseKey: string): SupabaseClient => {
  const supabaseUrl = getSupabaseUrl();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

export const supabaseServer = async (): Promise<SupabaseClient> => {
  return createServerClient(getAnonKey());
};

export const supabaseAdmin = (): SupabaseClient => {
  return createServerClient(getServiceRoleKey());
};
