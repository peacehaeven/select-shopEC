"use client"

import { useEffect, useRef } from "react"
import styles from "@/app/page.module.css"

const TAKO_SIZE = 35
const R = TAKO_SIZE / 2
const GRAVITY = 0.45
const SPAWN_INTERVAL = 650
const MAX_PARTICLES = 180
const DAMPING = 0.28
const FLOOR_FRICTION = 0.80
const SETTLE_VEL = 0.35
const SETTLE_FRAMES = 10

interface Particle {
  x: number       // document座標系のX
  y: number       // document座標系のY
  vx: number
  vy: number
  rotation: number
  rotSpeed: number
  settled: boolean
  slowFrames: number
}

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let W = window.innerWidth
    let H = window.innerHeight

    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W
      canvas.height = H
    }

    resize()
    window.addEventListener("resize", resize)

    const img = new Image()
    img.src = "/images/falling-tako.png"

    const particles: Particle[] = []
    let lastSpawn = 0
    let rafId = 0

    const loop = (time: number) => {
      const scrollY = window.scrollY
      // サイトの最下部（document座標系）を床とする
      const floorDocY = document.documentElement.scrollHeight

      // スポーン：現在のビューポート上端から降らせる
      if (time - lastSpawn > SPAWN_INTERVAL && particles.length < MAX_PARTICLES) {
        lastSpawn = time
        particles.push({
          x: R + Math.random() * (W - TAKO_SIZE),
          y: scrollY - R,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 2.5 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.12,
          settled: false,
          slowFrames: 0,
        })
      }

      // 物理演算（document座標系）
      for (const p of particles) {
        if (p.settled) continue

        p.vy += GRAVITY
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotSpeed

        // 左右壁
        if (p.x < R) { p.x = R; p.vx = Math.abs(p.vx) * 0.5; p.rotSpeed *= -0.7 }
        if (p.x > W - R) { p.x = W - R; p.vx = -Math.abs(p.vx) * 0.5; p.rotSpeed *= -0.7 }

        // 床（サイト最下部）との衝突
        if (p.y + R >= floorDocY) {
          p.y = floorDocY - R
          p.vy = -Math.abs(p.vy) * DAMPING
          p.vx *= FLOOR_FRICTION
          p.rotSpeed = p.vx * 0.04
        }
      }

      // 粒子間衝突（円形衝突判定）
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          if (a.settled && b.settled) continue

          const dx = b.x - a.x
          const dy = b.y - a.y
          const distSq = dx * dx + dy * dy
          const minDist = TAKO_SIZE

          if (distSq >= minDist * minDist || distSq < 0.01) continue

          const dist = Math.sqrt(distSq)
          const overlap = minDist - dist
          const nx = dx / dist
          const ny = dy / dist

          if (a.settled && !b.settled) {
            b.x += nx * overlap
            b.y += ny * overlap
            const dot = b.vx * nx + b.vy * ny
            if (dot < 0) {
              b.vx -= (1 + DAMPING) * dot * nx
              b.vy -= (1 + DAMPING) * dot * ny
              b.vx *= FLOOR_FRICTION
              b.vy *= FLOOR_FRICTION
            }
            b.rotSpeed = (b.vx * (-ny) + b.vy * nx) * 0.03
          } else if (b.settled && !a.settled) {
            a.x -= nx * overlap
            a.y -= ny * overlap
            const dot = a.vx * nx + a.vy * ny
            if (dot > 0) {
              a.vx -= (1 + DAMPING) * dot * nx
              a.vy -= (1 + DAMPING) * dot * ny
              a.vx *= FLOOR_FRICTION
              a.vy *= FLOOR_FRICTION
            }
            a.rotSpeed = (a.vx * (-ny) + a.vy * nx) * 0.03
          } else {
            a.x -= nx * overlap * 0.5
            a.y -= ny * overlap * 0.5
            b.x += nx * overlap * 0.5
            b.y += ny * overlap * 0.5
            const dvx = a.vx - b.vx
            const dvy = a.vy - b.vy
            const dot = dvx * nx + dvy * ny
            if (dot > 0) {
              const impulse = dot * 0.65
              a.vx -= impulse * nx
              a.vy -= impulse * ny
              b.vx += impulse * nx
              b.vy += impulse * ny
            }
          }
        }
      }

      // 静止判定
      for (const p of particles) {
        if (p.settled) continue
        const speed = Math.abs(p.vx) + Math.abs(p.vy)
        if (speed < SETTLE_VEL) {
          p.slowFrames++
          if (p.slowFrames >= SETTLE_FRAMES) {
            p.settled = true
            p.vx = 0
            p.vy = 0
            p.rotSpeed = 0
          }
        } else {
          p.slowFrames = 0
        }
      }

      // 描画（document座標→viewport座標に変換して描画）
      ctx.clearRect(0, 0, W, H)
      if (img.complete && img.naturalWidth > 0) {
        for (const p of particles) {
          const viewY = p.y - scrollY  // viewport上のY座標
          // ビューポート外はスキップ
          if (viewY + R < 0 || viewY - R > H) continue
          ctx.save()
          ctx.globalAlpha = 0.85
          ctx.translate(p.x, viewY)
          ctx.rotate(p.rotation)
          ctx.drawImage(img, -R, -R, TAKO_SIZE, TAKO_SIZE)
          ctx.restore()
        }
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className={styles.container}>
      {/* Canvas でたこ焼き物理アニメーション */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 100,
        }}
      />

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
