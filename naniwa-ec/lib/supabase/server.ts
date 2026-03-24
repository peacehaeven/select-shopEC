import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// これが、あなたの Next.js（フロント/サーバー）と Supabase（DB）をつなぐ 「専用の窓口」 になる
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* サーバーコンポーネントからの呼び出しはcookie書き込み不可なので無視 */
          }
        },
      },
    }
  );
}