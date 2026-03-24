import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const TRACKING_URLS: Record<string, string> = {
  'ヤマト運輸': 'https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id=',
  '佐川急便': 'https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=',
  'ゆうパック': 'https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. adminチェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
  }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ message: '管理者権限が必要です' }, { status: 403 })
  }

  const { order_id, carrier, tracking_number } = await request.json() as {
    order_id: string
    carrier: string
    tracking_number: string
  }

  if (!order_id || !carrier || !tracking_number) {
    return NextResponse.json({ message: '必須項目が不足しています' }, { status: 400 })
  }

  // 2. DB更新
  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update({ status: 'shipped', carrier, tracking_number })
    .eq('id', order_id)
    .select('order_number, guest_email, shipping_name')
    .single()

  if (updateError) {
    return NextResponse.json({ message: '発送情報の更新に失敗しました' }, { status: 500 })
  }

  // 3. メール送信
  const trackingUrl = TRACKING_URLS[carrier]
    ? `${TRACKING_URLS[carrier]}${tracking_number}`
    : null

  const trackingLine = trackingUrl
    ? `追跡URL: ${trackingUrl}`
    : `追跡番号: ${tracking_number}`

  const { error: mailError } = await resend.emails.send({
    from: 'naniwa-select@resend.dev',
    to: order.guest_email,
    subject: '【なにわセレクトショップ】ご注文商品を発送しました',
    text: `${order.shipping_name} 様\n\nご注文商品を発送いたしました。\n\n注文番号: ${order.order_number}\n配送業者: ${carrier}\n${trackingLine}\n\nなにわセレクトショップ`,
  })

  if (mailError) {
    return NextResponse.json(
      { message: `発送ステータスは更新しましたが、メール送信に失敗しました: ${mailError.message}` },
      { status: 200 }
    )
  }

  return NextResponse.json({ message: '発送処理が完了しました' }, { status: 200 })
}
