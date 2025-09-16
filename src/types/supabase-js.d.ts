declare module '@supabase/supabase-js' {
  export interface SupabaseClient<Database = any> {
    from: (table: string) => any;
    auth: any;
  }

  export interface SupabaseClientOptions {
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
      detectSessionInUrl?: boolean;
    };
  }

  export function createClient<Database = any>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions
  ): SupabaseClient<Database>;
}
