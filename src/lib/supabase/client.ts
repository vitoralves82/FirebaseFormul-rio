import { createClient, type SupabaseClient } from "./rest-client";

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

export const createBrowserSupabaseClient = (): SupabaseClient => {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseConfig();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
};

let browserClient: SupabaseClient | null = null;

export const getBrowserSupabaseClient = (): SupabaseClient => {
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }

  return browserClient;
};
