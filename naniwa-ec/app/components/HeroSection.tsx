"use client"

import { useEffect, useRef } from "react"
import styles from "@/app/page.module.css"

const TAKO_SIZE = 30
const TAKO_RADIUS = TAKO_SIZE / 2
const BIN_WIDTH = 24
const SPAWN_INTERVAL = 210
const MAX_ACTIVE_PARTICLES = 120
const GRAVITY_MIN = 0.014
const GRAVITY_MAX = 0.024
const INITIAL_VY_MIN = 0.16
const INITIAL_VY_MAX = 0.34
const MAX_FALL_SPEED = 1.28
const SWAY_AMPLITUDE_MIN = 14
const SWAY_AMPLITUDE_MAX = 34
const SWAY_SPEED_MIN = 0.0011
const SWAY_SPEED_MAX = 0.0025
const DRIFT_MIN = -0.065
const DRIFT_MAX = 0.065
const AIR_DRAG = 0.992
const FLOOR_FRICTION = 0.84
const WALL_BOUNCE = 0.46
const BOUNCE_DAMPING = 0.08
const SETTLE_SPEED = 0.34
const SETTLE_FRAMES = 9
const PILE_STEP = TAKO_SIZE * 0.34
const PILE_SPREAD = PILE_STEP * 0.62
const PILE_CAP_MULTIPLIER = 0.58

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  gravity: number
  baseX: number
  swayAmplitude: number
  swaySpeed: number
  phase: number
  drift: number
  rotation: number
  rotationSpeed: number
  settled: boolean
  slowFrames: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const amount = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0
    let rafId = 0
    let lastSpawnAt = 0
    let started = false
    let pileHeights: number[] = []
    const particles: Particle[] = []
    const image = new Image()

    const syncCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const binCount = Math.max(1, Math.ceil(width / BIN_WIDTH))
      if (pileHeights.length !== binCount) {
        const next = new Array<number>(binCount).fill(0)
        for (let index = 0; index < Math.min(binCount, pileHeights.length); index += 1) {
          next[index] = pileHeights[index]
        }
        pileHeights = next
      }
    }

    const getFooterMetrics = () => {
      const footer = document.querySelector(".footer") as HTMLElement | null
      const documentBottom = document.documentElement.scrollHeight
      const footerTop = footer ? footer.offsetTop : documentBottom - 180
      const footerHeight = footer ? footer.offsetHeight : 220

      return {
        footerTop,
        footerHeight,
        documentBottom,
        pileCap: Math.max(TAKO_SIZE * 4, footerHeight * PILE_CAP_MULTIPLIER),
      }
    }

    const getHeroBottom = () => {
      const heroSection = canvas.parentElement?.querySelector("section") as HTMLElement | null
      return heroSection ? heroSection.offsetTop + heroSection.offsetHeight : window.innerHeight
    }

    const getPileHeightAtX = (x: number) => {
      const normalizedX = clamp(x / BIN_WIDTH, 0, Math.max(pileHeights.length - 1, 0))
      const left = Math.floor(normalizedX)
      const right = Math.min(left + 1, pileHeights.length - 1)
      const amount = normalizedX - left
      const leftHeight = pileHeights[left] ?? 0
      const rightHeight = pileHeights[right] ?? leftHeight
      return lerp(leftHeight, rightHeight, amount)
    }

    const addPileHeight = (bin: number, amount: number, cap: number) => {
      if (bin < 0 || bin >= pileHeights.length) return
      pileHeights[bin] = Math.min(cap, pileHeights[bin] + amount)
    }

    const settleParticle = (particle: Particle, metrics: ReturnType<typeof getFooterMetrics>) => {
      const bin = clamp(Math.floor(particle.x / BIN_WIDTH), 0, pileHeights.length - 1)

      addPileHeight(bin, PILE_STEP, metrics.pileCap)
      addPileHeight(bin - 1, PILE_SPREAD, metrics.pileCap)
      addPileHeight(bin + 1, PILE_SPREAD, metrics.pileCap)
      addPileHeight(bin - 2, PILE_SPREAD * 0.52, metrics.pileCap)
      addPileHeight(bin + 2, PILE_SPREAD * 0.52, metrics.pileCap)
      addPileHeight(bin - 3, PILE_SPREAD * 0.22, metrics.pileCap)
      addPileHeight(bin + 3, PILE_SPREAD * 0.22, metrics.pileCap)

      particle.settled = true
      particle.vx = 0
      particle.vy = 0
      particle.rotationSpeed = 0
      particle.slowFrames = 0
      particle.y = metrics.documentBottom - getPileHeightAtX(particle.x) - TAKO_RADIUS
    }

    const spawnParticle = (scrollY: number) => {
      const baseX = randomRange(TAKO_RADIUS, width - TAKO_RADIUS)
      particles.push({
        x: baseX,
        y: scrollY - TAKO_SIZE - randomRange(12, 90),
        vx: randomRange(-0.16, 0.16),
        vy: randomRange(INITIAL_VY_MIN, INITIAL_VY_MAX),
        gravity: randomRange(GRAVITY_MIN, GRAVITY_MAX),
        baseX,
        swayAmplitude: randomRange(SWAY_AMPLITUDE_MIN, SWAY_AMPLITUDE_MAX),
        swaySpeed: randomRange(SWAY_SPEED_MIN, SWAY_SPEED_MAX),
        phase: randomRange(0, Math.PI * 2),
        drift: randomRange(DRIFT_MIN, DRIFT_MAX),
        rotation: randomRange(0, Math.PI * 2),
        rotationSpeed: randomRange(-0.013, 0.013),
        settled: false,
        slowFrames: 0,
      })
    }

    const updateParticle = (particle: Particle, time: number, metrics: ReturnType<typeof getFooterMetrics>) => {
      if (particle.settled) return

      particle.baseX = clamp(particle.baseX + particle.drift, TAKO_RADIUS, width - TAKO_RADIUS)
      const targetX = clamp(
        particle.baseX + Math.sin(time * particle.swaySpeed + particle.phase) * particle.swayAmplitude,
        TAKO_RADIUS,
        width - TAKO_RADIUS,
      )

      particle.vx += (targetX - particle.x) * 0.012
      particle.vx *= AIR_DRAG
      particle.vy = Math.min(particle.vy + particle.gravity, MAX_FALL_SPEED)
      particle.x += particle.vx
      particle.y += particle.vy
      particle.rotation += particle.rotationSpeed + particle.vx * 0.045

      if (particle.x < TAKO_RADIUS) {
        particle.x = TAKO_RADIUS
        particle.vx = Math.abs(particle.vx) * WALL_BOUNCE
        particle.rotationSpeed *= -0.7
      }

      if (particle.x > width - TAKO_RADIUS) {
        particle.x = width - TAKO_RADIUS
        particle.vx = -Math.abs(particle.vx) * WALL_BOUNCE
        particle.rotationSpeed *= -0.7
      }

      const leftHeight = getPileHeightAtX(particle.x - BIN_WIDTH)
      const rightHeight = getPileHeightAtX(particle.x + BIN_WIDTH)
      const surfaceSlope = (rightHeight - leftHeight) / (BIN_WIDTH * 2)
      const surfaceY = metrics.documentBottom - getPileHeightAtX(particle.x) - TAKO_RADIUS

      if (particle.y >= surfaceY) {
        particle.y = surfaceY
        particle.vy = -Math.abs(particle.vy) * BOUNCE_DAMPING
        particle.vx += -surfaceSlope * 2.4 + particle.drift * 0.03
        particle.vx *= FLOOR_FRICTION
        particle.rotationSpeed = particle.vx * 0.028
      }

      const speed = Math.abs(particle.vx) + Math.abs(particle.vy)
      const touchingSurface = particle.y >= surfaceY - 0.8
      const isStableArea = Math.abs(rightHeight - leftHeight) < PILE_STEP * 0.95

      if (touchingSurface && speed < 0.72) {
        particle.vx *= 0.76
        particle.vy *= 0.42
        particle.rotationSpeed *= 0.7
      }

      if (touchingSurface && isStableArea && speed < SETTLE_SPEED) {
        particle.slowFrames += 1
        if (particle.slowFrames >= SETTLE_FRAMES) {
          settleParticle(particle, metrics)
        }
      } else {
        particle.slowFrames = 0
      }
    }

    const resolveParticleCollisions = () => {
      for (let i = 0; i < particles.length; i += 1) {
        const first = particles[i]
        if (first.settled) continue

        for (let j = i + 1; j < particles.length; j += 1) {
          const second = particles[j]
          if (second.settled) continue

          const dx = second.x - first.x
          const dy = second.y - first.y
          const distanceSquared = dx * dx + dy * dy
          const minDistance = TAKO_SIZE

          if (distanceSquared >= minDistance * minDistance || distanceSquared < 0.01) continue

          const distance = Math.sqrt(distanceSquared)
          const overlap = minDistance - distance
          const normalX = dx / distance
          const normalY = dy / distance

          first.x -= normalX * overlap * 0.5
          first.y -= normalY * overlap * 0.5
          second.x += normalX * overlap * 0.5
          second.y += normalY * overlap * 0.5

          const relativeVelocityX = first.vx - second.vx
          const relativeVelocityY = first.vy - second.vy
          const approachSpeed = relativeVelocityX * normalX + relativeVelocityY * normalY

          if (approachSpeed > 0) {
            const impulse = approachSpeed * 0.58
            first.vx -= impulse * normalX
            first.vy -= impulse * normalY
            second.vx += impulse * normalX
            second.vy += impulse * normalY
          }

          first.rotationSpeed += (-normalY * first.vx + normalX * first.vy) * 0.004
          second.rotationSpeed += (-normalY * second.vx + normalX * second.vy) * 0.004
        }
      }
    }

    const getParticleAlpha = (
      particle: Particle,
      heroBottom: number,
      footerTop: number,
    ) => {
      const heroAlpha = particle.settled ? 0.9 : 0.96
      const bodyAlpha = particle.settled ? 0.24 : 0.16
      const footerAlpha = particle.settled ? 0.72 : 0.62

      const heroBlend = smoothstep(heroBottom - 180, heroBottom + 260, particle.y)
      const footerBlend = smoothstep(footerTop - 320, footerTop + 180, particle.y)

      const baseAlpha = lerp(heroAlpha, bodyAlpha, heroBlend)
      return lerp(baseAlpha, footerAlpha, footerBlend)
    }

    const drawParticles = (scrollY: number, heroBottom: number, footerTop: number) => {
      ctx.clearRect(0, 0, width, height)

      if (!image.complete || image.naturalWidth === 0) return

      for (const particle of particles) {
        const viewportY = particle.y - scrollY
        if (viewportY < -TAKO_SIZE || viewportY > height + TAKO_SIZE) continue

        ctx.save()
        ctx.globalAlpha = getParticleAlpha(particle, heroBottom, footerTop)
        ctx.translate(particle.x, viewportY)
        ctx.rotate(particle.rotation)
        ctx.drawImage(image, -TAKO_RADIUS, -TAKO_RADIUS, TAKO_SIZE, TAKO_SIZE)
        ctx.restore()
      }
    }

    const animate = (time: number) => {
      const scrollY = window.scrollY
      const heroBottom = getHeroBottom()
      const footerMetrics = getFooterMetrics()
      let activeCount = particles.filter((particle) => !particle.settled).length

      while (time - lastSpawnAt >= SPAWN_INTERVAL && activeCount < MAX_ACTIVE_PARTICLES) {
        lastSpawnAt += SPAWN_INTERVAL
        spawnParticle(scrollY)
        activeCount += 1

        if (Math.random() > 0.55 && activeCount < MAX_ACTIVE_PARTICLES) {
          spawnParticle(scrollY)
          activeCount += 1
        }
      }

      for (const particle of particles) {
        updateParticle(particle, time, footerMetrics)
      }

      resolveParticleCollisions()
      drawParticles(scrollY, heroBottom, footerMetrics.footerTop)
      rafId = window.requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (started) return
      started = true
      syncCanvas()
      lastSpawnAt = performance.now() - SPAWN_INTERVAL
      rafId = window.requestAnimationFrame(animate)
    }

    image.onload = startAnimation
    image.src = "/images/falling-tako.png"
    if (image.complete) {
      startAnimation()
    }

    syncCanvas()
    window.addEventListener("resize", syncCanvas)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("resize", syncCanvas)
    }
  }, [])

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      <section className={styles.hero}>
        <div className={styles.heroBackgroundGrid}>
          <img src="/images/tutenkaku.jpg" alt="通天閣" className={styles.bgImage} />
          <img src="/images/kissaten.png" alt="純喫茶" className={styles.bgImage} />
        </div>
        <div className={styles.heroOverlayContent}>
          <div className={styles.textGlassCard}>
            <div className={styles.heroBadge}>大阪産 | 厳選</div>
            <h2 className={styles.heroTitle}>
              <span className={styles.heroEnglishText}>OSAKA</span>
              <span className={styles.heroSubText}>なにわセレクトショップ</span>
            </h2>
            <p className={styles.heroCopy}>
              ええもん、うまいもん。大阪の日常を、あなたに。
            </p>
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
