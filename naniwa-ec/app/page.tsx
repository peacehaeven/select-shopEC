"use client";
import { useState, useEffect } from 'react';
import styles from './page.module.css'; 

export default function HomePage() {
  const [takoyakis, setTakoyakis] = useState<{ id: number; left: string; duration: string }[]>([]);

  // たこ焼きアニメーション（賑やかし）
  useEffect(() => {
    const interval = setInterval(() => {
      const newTakoyaki = {
        id: Date.now(),
        left: Math.random() * 90 + "%",
        duration: (Math.random() * 3 + 2) + "s",
      };
      setTakoyakis((prev) => [...prev.slice(-15), newTakoyaki]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className={styles.container}>
      {/* 背景アニメーションレイヤー */}
      <div className={styles.takoLayer}>
        {takoyakis.map((tako) => (
          <span key={tako.id} className={styles.fallingTakoyaki} style={{ left: tako.left, animationDuration: tako.duration }}>
            <img src="/images/falling-tako.png" alt="" className={styles.fallingTakoImg} />
          </span>
        ))}
      </div>

      {/* Heroセクション（メイン看板） */}
      <section className={styles.hero}>
        {/* 背景画像：今の2枚を活かす設定 */}
        <div className={styles.heroBackgroundGrid}>
          <img src="/images/tutenkaku.jpg" alt="通天閣" className={styles.bgImage} />
          <img src="/images/kissaten.png" alt="喫茶店" className={styles.bgImage} />
        </div>

        {/* 前面のカード */}
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
            <div className={styles.heroCtaLabel}>
              大阪のこだわり特産品を見る↓
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}