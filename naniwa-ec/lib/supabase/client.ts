import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    // process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!=sb_publishable_IYsYXORCnCG8XYIQOw2YDQ_nWxk6n2u
  );
}


