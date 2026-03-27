import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

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
    .select('order_number, guest_email, shipping_name, subtotal, shipping_fee, total, order_items(product_name, unit_price, quantity)')
    .single()

  if (updateError) {
    return NextResponse.json({ message: '発送情報の更新に失敗しました' }, { status: 500 })
  }

  // 3. メール送信
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ message: '発送処理が完了しました（メール未設定のため送信スキップ）' }, { status: 200 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const trackingUrl = TRACKING_URLS[carrier]
    ? `${TRACKING_URLS[carrier]}${tracking_number}`
    : null

  const trackingLine = trackingUrl
    ? `追跡URL: ${trackingUrl}`
    : `追跡番号: ${tracking_number}`

  const toAddress = process.env.RESEND_TEST_TO || order.guest_email

  const items = (order.order_items as { product_name: string; unit_price: number; quantity: number }[]) ?? []
  const itemLines = items.map(
    (item) => `  ・${item.product_name}　¥${item.unit_price.toLocaleString()} × ${item.quantity}点　= ¥${(item.unit_price * item.quantity).toLocaleString()}`
  ).join('\n')

  const emailText = [
    `${order.shipping_name} 様`,
    '',
    'この度はなにわセレクトショップをご利用いただき、誠にありがとうございます。',
    'ご注文商品を発送いたしましたのでお知らせします。',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '【ご注文内容】',
    `注文番号: ${order.order_number}`,
    '',
    itemLines,
    '',
    `小計:      ¥${(order.subtotal as number).toLocaleString()}`,
    `送料:      ¥${(order.shipping_fee as number).toLocaleString()}`,
    `合計:      ¥${(order.total as number).toLocaleString()}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '【配送情報】',
    `配送業者: ${carrier}`,
    trackingLine,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '【キャンセルについて】',
    '商品発送後のキャンセル・返品はお受けできません。',
    'あらかじめご了承ください。',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'ご不明な点がございましたら、下記までお問い合わせください。',
    '',
    '■ なにわセレクトショップ',
    '  運営責任者: 浪速 太郎（なにわ たろう）',
    '  所在地:     〒540-0032 大阪府大阪市中央区天満橋京町 1-1',
    '  電話番号:   06-0141-1539',
    '  受付時間:   10:00〜18:00（土日祝を除く）',
    '  メール:     support@naniwa-select.example.com',
  ].join('\n')

  const { error: mailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'naniwa-select@resend.dev',
    to: toAddress,
    subject: '【なにわセレクトショップ】ご注文商品を発送しました',
    text: emailText,
  })

  if (mailError) {
    return NextResponse.json(
      { message: `発送ステータスは更新しましたが、メール送信に失敗しました: ${mailError.message}` },
      { status: 200 }
    )
  }

  return NextResponse.json({ message: '発送処理が完了しました' }, { status: 200 })
}
