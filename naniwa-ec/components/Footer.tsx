"use clinent";

import Link from 'next/link';
import "./Footer.css"

export default function Footer() {
    return (
        <footer className="footer">
            <div className="guideHeader">
                <h2 className="guideTitle">ご利用案内</h2>
                <p className="guideSubTitle">User Guide</p>
            </div>
            <div className="guideSection">
                <div className="sectionTitleBox">
                    <span>お支払いについて</span>
                </div>
                <div className="sectionContent">
                    <p>お支払いは、クレジットカード決済のみ対応しております。</p>
                </div>
            </div>
            <div className="guideSection">
                <div className="sectionTitleBox">
                    <span>送料・配送について</span>
                    <span className="arrow"></span>
                </div>
                <div className="sectionContent">
                    <p>全国一律￥800</p>
                    <p>※ご注文から3営業日以内に発送いたします（土日祝を除く）</p>
                    <p>※地域や交通事情により、お届け日が前後する場合がございます。</p>
                </div>
            </div>
            <div className="guideSection">
                <div className="sectionTitleBox">
                    <span>ご注文のキャンセルについて</span>
                </div>
                <div className="sectionContent">
                    <p><strong>発送準備に入る前（発送連絡のメールが届くまで）</strong>であれば承ることが可能です。</p>
                    <p>キャンセルをご希望の場合は、お早めに下記までご連絡をお願いいたします。</p>
                    <p>電話番号：06-0141-1539</p>
                    <p>メール：support@naniwa-select.example.com</p>
                </div>
            </div>

            <div className="shopInfoContainer">
                <h2 className="shopInfoTitle">SHOP INFO</h2>
                <div className="shopInfoContent">
                    <div className="shopInfoRow">
                        <span className="label">店舗名</span>
                        <span className="value">なにわセレクトショップ</span>
                    </div>
                    <div className="shopInfoRow">
                        <span className="label">運営責任者</span>
                        <span className="value">浪速 太郎（なにわ たろう）</span>
                    </div>
                    <div className="shopInfoRow">
                        <span className="label">所在地</span>
                        <span className="value">〒540-0032 大阪府大阪市中央区天満橋京町 1-1</span>
                    </div>
                    <div className="shopInfoRow">
                        <span className="label">電話番号</span>
                        <div className="value">
                            <p>06-0141-1539</p>
                            <p className="note">※受付時間：10:00〜18:00（土日祝を除く）</p>
                        </div>
                    </div>
                    <div className="shopInfoRow">
                        <span className="label">メール</span>
                        <span className="value">support@naniwa-select.example.com</span>
                    </div>
                </div>
            </div>

            <small className="copyright">&copy; 2026 Naniwa Select shop</small>
        </footer>
    )
}