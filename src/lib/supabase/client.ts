import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

const getPublicSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { supabaseUrl, supabaseAnonKey };
};

export const createBrowserClient = (): SupabaseClient => {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseConfig();

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};

let browserClient: SupabaseClient | null = null;

export const supabaseBrowser = (): SupabaseClient => {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }

  return browserClient;
};
