"use client"

import styles from "@/app/page.module.css"

// JS setInterval を廃止し、CSS アニメーションのみで実装（再レンダリングなし）
const TAKOYAKIS = [
  { left: "5%",  delay: "0s"   },
  { left: "15%", delay: "1.5s" },
  { left: "28%", delay: "3.2s" },
  { left: "40%", delay: "0.8s" },
  { left: "52%", delay: "2.4s" },
  { left: "63%", delay: "4.1s" },
  { left: "75%", delay: "1.1s" },
  { left: "88%", delay: "2.9s" },
]

export default function HeroSection() {
  return (
    <div className={styles.container}>
      {/* 背景アニメーションレイヤー */}
      <div className={styles.takoLayer}>
        {TAKOYAKIS.map((tako, i) => (
          <span
            key={i}
            className={styles.fallingTakoyaki}
            style={{ left: tako.left, animationDelay: tako.delay }}
          >
            <img src="/images/falling-tako.png" alt="" className={styles.fallingTakoImg} />
          </span>
        ))}
      </div>

      {/* Heroセクション */}
      <section className={styles.hero}>
        <div className={styles.heroBackgroundGrid}>
          <img src="/images/tutenkaku.jpg" alt="通天閣" className={styles.bgImage} />
          <img src="/images/kissaten.png" alt="喫茶店" className={styles.bgImage} />
        </div>
        <div className={styles.heroOverlayContent}>
          <div className={styles.textGlassCard}>
            <div className={styles.heroBadge}>
              大阪産 | 厳選
            </div>
            <h2 className={styles.heroTitle}>
              <span className={styles.heroEnglishText}>OSAKA</span>
              <span className={styles.heroSubText}>なにわセレクトショップ</span>
            </h2>
            <p className={styles.heroCopy}>ええもん、うまいもん。大阪の日常を、あなたに。</p>
            <div
              className={styles.heroCtaLabel}
              style={{ cursor: "pointer" }}
              onClick={() => document.getElementById("product-list")?.scrollIntoView({ behavior: "smooth" })}
            >
              大阪のこだわり特産品を見る↓
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
