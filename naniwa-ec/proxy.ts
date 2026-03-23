import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Supabase クライアントを作成（ミドルウェア用）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // セッションを取得（ログイン済みかどうかの確認）
  const { data: { user } } = await supabase.auth.getUser()

  // 未ログイン → /admin/login へリダイレクト
  if (!user) {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // ログイン済みだが role が 'admin' でない → トップページへリダイレクト
  // （NF-04: RLS と二重でチェック）
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    const topUrl = new URL('/', request.url)
    return NextResponse.redirect(topUrl)
  }

  return response
}

// middleware を適用するパスの設定
// /admin/login は除外（無限リダイレクト防止）
export const config = {
  matcher: ['/admin/:path*'],
}
