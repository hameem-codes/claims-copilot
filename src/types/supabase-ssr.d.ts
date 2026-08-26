declare module "@supabase/ssr" {
  export function createBrowserClient<
    Database = Record<string, unknown>,
    SchemaName extends string & keyof Database = "public" extends keyof Database ? "public" : string & keyof Database
  >(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>
  ): import("@supabase/supabase-js").SupabaseClient<Database, SchemaName>;

  export function createServerClient<
    Database = Record<string, unknown>,
    SchemaName extends string & keyof Database = "public" extends keyof Database ? "public" : string & keyof Database
  >(
    supabaseUrl: string,
    supabaseKey: string,
    options: {
      cookies: {
        getAll(): { name: string; value: string }[] | Promise<{ name: string; value: string }[]>;
        setAll?(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ): void | Promise<void>;
      };
      cookieOptions?: Record<string, unknown>;
      cookieEncoding?: "raw" | "base64url";
    }
  ): import("@supabase/supabase-js").SupabaseClient<Database, SchemaName>;
}
