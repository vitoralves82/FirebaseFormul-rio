import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const getServerSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return { supabaseUrl, serviceRoleKey };
};

export const supabaseServer = (): SupabaseClient => {
  const { supabaseUrl, serviceRoleKey } = getServerSupabaseConfig();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};
