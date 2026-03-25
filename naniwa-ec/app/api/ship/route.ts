import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resend } from "@/lib/resend"
import { taxIncluded } from "@/lib/utils/price"

const TRACKING_URLS: Record<string, string> = {
  "ヤマト運輸": "https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id={n}",
  "佐川急便":   "https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo={n}",
  "ゆうパック": "https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1={n}",
}

function buildTrackingUrl(carrier: string, trackingNumber: string): string | null {
  const template = TRACKING_URLS[carrier]
  return template ? template.replace("{n}", encodeURIComponent(trackingNumber)) : null
}

type OrderItem = {
  product_name: string
  unit_price: number
  quantity: number
}

function buildEmailHtml(params: {
  shippingName: string
  orderNumber: string
  carrier: string
  trackingNumber: string
  trackingUrl: string | null
  orderItems: OrderItem[]
  shippingFee: number
}): string {
  const { shippingName, orderNumber, carrier, trackingNumber, trackingUrl, orderItems, shippingFee } = params

  const trackingSection = trackingUrl
    ? `<tr>
        <td style="padding:6px 0;color:#666;width:100px;">追跡URL</td>
        <td style="padding:6px 0;">
          <a href="${trackingUrl}" style="color:#1a1a1a;">${trackingUrl}</a>
        </td>
      </tr>`
    : ""

  const itemRows = orderItems.map(item => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px solid #eee;">${item.product_name}</td>
      <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">
        ¥${item.unit_price.toLocaleString("ja-JP")} × ${item.quantity}
      </td>
    </tr>`).join("")

  const preTaxSubtotal = orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const displaySubtotal = taxIncluded(preTaxSubtotal)
  const displayTotal = displaySubtotal + shippingFee

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #ddd;border-radius:4px;overflow:hidden;">

        <!-- ヘッダー -->
        <tr>
          <td style="background:#1a1a1a;padding:24px 32px;">
            <p style="margin:0;color:#fff;font-size:18px;font-weight:bold;">なにわセレクトショップ</p>
          </td>
        </tr>

        <!-- 本文 -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;">${shippingName} 様</p>
            <p style="margin:0 0 24px;">この度はなにわセレクトショップをご利用いただきありがとうございます。<br>
            ご注文の商品を発送いたしました。</p>

            <!-- 発送情報テーブル -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9f9f9;border:1px solid #ddd;border-radius:4px;padding:16px 20px;margin-bottom:24px;">
              <tr>
                <td colspan="2" style="padding-bottom:12px;font-weight:bold;font-size:13px;color:#666;border-bottom:1px solid #ddd;letter-spacing:1px;">
                  発送情報
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;width:100px;">注文番号</td>
                <td style="padding:6px 0;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;">配送業者</td>
                <td style="padding:6px 0;">${carrier}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;">追跡番号</td>
                <td style="padding:6px 0;">${trackingNumber}</td>
              </tr>
              ${trackingSection}
            </table>

            <!-- 注文内容テーブル -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9f9f9;border:1px solid #ddd;border-radius:4px;padding:16px 20px;margin-bottom:24px;">
              <tr>
                <td colspan="2" style="padding-bottom:12px;font-weight:bold;font-size:13px;color:#666;border-bottom:1px solid #ddd;letter-spacing:1px;">
                  注文内容
                </td>
              </tr>
              ${itemRows}
              <tr>
                <td style="padding:6px 0;color:#666;">小計（税込）</td>
                <td style="padding:6px 0;text-align:right;">¥${displaySubtotal.toLocaleString("ja-JP")}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;">送料</td>
                <td style="padding:6px 0;text-align:right;">¥${shippingFee.toLocaleString("ja-JP")}</td>
              </tr>
              <tr>
                <td style="padding:8px 0 0;font-weight:bold;">合計（税込）</td>
                <td style="padding:8px 0 0;font-weight:bold;text-align:right;">¥${displayTotal.toLocaleString("ja-JP")}</td>
              </tr>
            </table>

            <p style="margin:0 0 8px;">お届けまでしばらくお待ちください。</p>
          </td>
        </tr>

        <!-- 店舗情報・フッター -->
        <tr>
          <td style="background:#f4f4f4;padding:20px 32px;border-top:1px solid #ddd;font-size:12px;color:#666;">
            <p style="margin:0 0 4px;font-weight:bold;color:#444;">なにわセレクトショップ</p>
            <p style="margin:0 0 2px;">運営責任者：浪速 太郎（なにわ たろう）</p>
            <p style="margin:0 0 2px;">所在地：〒540-0032 大阪府大阪市中央区天満橋京町 1-1</p>
            <p style="margin:0 0 2px;">電話番号：06-0141-1539（受付時間 10:00〜18:00 ／ 土日祝を除く）</p>
            <p style="margin:0;">メール：<a href="mailto:support@naniwa-select.example.com" style="color:#666;">support@naniwa-select.example.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // adminチェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ message: "ログインが必要です" }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") {
    return NextResponse.json({ message: "権限がありません" }, { status: 403 })
  }

  const { order_id, carrier, tracking_number } = await request.json() as {
    order_id: string
    carrier: string
    tracking_number: string
  }

  // 注文情報取得（注文商品・金額も含む）
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("guest_email, order_number, shipping_name, shipping_fee, order_items(product_name, unit_price, quantity)")
    .eq("id", order_id)
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ message: "注文が見つかりません" }, { status: 404 })
  }

  // ステータス・発送情報を更新
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "shipped", carrier, tracking_number })
    .eq("id", order_id)

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 })
  }

  // 追跡URL生成・メール送信
  const trackingUrl = buildTrackingUrl(carrier, tracking_number)
  const fromAddress = process.env.RESEND_FROM ?? "なにわセレクトショップ <onboarding@resend.dev>"

  // RESEND_TEST_TO が設定されている場合は自分のアドレスへ転送（ドメイン未検証時の開発用）
  const toAddress = process.env.RESEND_TEST_TO ?? order.guest_email

  const { error: emailError } = await resend.emails.send({
    from: fromAddress,
    to: toAddress,
    subject: "【なにわセレクトショップ】ご注文商品を発送しました",
    html: buildEmailHtml({
      shippingName:   order.shipping_name,
      orderNumber:    order.order_number,
      carrier,
      trackingNumber: tracking_number,
      trackingUrl,
      orderItems:     order.order_items as OrderItem[],
      shippingFee:    order.shipping_fee,
    }),
  })

  if (emailError) {
    // DBは更新済みのためロールバックせず、メールエラーのみ通知
    return NextResponse.json(
      { message: `発送処理は完了しましたが、メール送信に失敗しました: ${emailError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
