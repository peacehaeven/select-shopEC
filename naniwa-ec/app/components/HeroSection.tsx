"use client"

import { useEffect, useRef } from "react"
import styles from "@/app/page.module.css"

/**
 * 物理シミュレーションおよび描画パラメータの定数定義
 * パーティクルの視覚的属性および物理挙動の制御パラメータ。
 */
const TAKO_SIZE = 30 // たこのサイズ（px）
const TAKO_RADIUS = TAKO_SIZE / 2
const BIN_WIDTH = 24 // たこが積もる際の「枠」の幅
const SPAWN_INTERVAL = 210 // たこが生成される間隔（ミリ秒）
const MAX_ACTIVE_PARTICLES = 120 // 画面内で動くたこの最大数
const GRAVITY_MIN = 0.014 // 重力の最小値
const GRAVITY_MAX = 0.024 // 重力の最大値
const INITIAL_VY_MIN = 0.16 // 初速（垂直方向）の最小値
const INITIAL_VY_MAX = 0.34 // 初速（垂直方向）の最大値
const MAX_FALL_SPEED = 1.28 // 落下速度の最大制限
const SWAY_AMPLITUDE_MIN = 14 // 左右の揺れ幅の最小値
const SWAY_AMPLITUDE_MAX = 34 // 左右の揺れ幅の最大値
const SWAY_SPEED_MIN = 0.0011 // 左右の揺れの速さ
const SWAY_SPEED_MAX = 0.0025
const DRIFT_MIN = -0.065 // 左右へのわずかな流れ（ドリフト）
const DRIFT_MAX = 0.065
const AIR_DRAG = 0.992 // 空気抵抗（速度を減衰させる）
const FLOOR_FRICTION = 0.84 // 地面の摩擦
const WALL_BOUNCE = 0.46 // 壁（画面端）で跳ね返るときの強さ
const BOUNCE_DAMPING = 0.08 // 地面で跳ねるときの減衰
const SETTLE_SPEED = 0.34 // 運動エネルギーがこの値を下回ると「静止状態」の候補とする
const SETTLE_FRAMES = 9 // 静止状態への確定に必要な連続フレーム数
const PILE_STEP = TAKO_SIZE * 0.34 // 1つのたこが積もったときに増える高さ
const PILE_SPREAD = PILE_STEP * 0.62 // 隣の枠に広がる積雪量（たこ量）
const PILE_CAP_MULTIPLIER = 0.58 // フッターの高さに対して、最大どれだけ積もるか

/**
 * たこ（パーティクル）一つ一つの状態を管理するインターフェース
 */
interface Particle {
  x: number // 現在のX座標
  y: number // 現在のY座標
  vx: number // X方向の速度
  vy: number // Y方向の速度
  gravity: number // そのたこに適用される重力
  baseX: number // 左右の揺れの中心となるX座標
  swayAmplitude: number // 左右の揺れ幅
  swaySpeed: number // 左右の揺れ速度
  phase: number // 揺れのタイミングをずらすための位相
  drift: number // 蓄積される左右の流れ
  rotation: number // 回転角度
  rotationSpeed: number // 回転速度
  settled: boolean // 地面に積もったかどうか
  slowFrames: number // 低速状態が何フレーム続いているか（静止判定用）
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

/**
 * HeroSectionコンポーネント
 * 背景に「たこ焼き」が舞い落ちて積もるアニメーションを表示するヒーローセクション。
 */
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
    let pileHeights: number[] = [] // 地面に積もっている高さ（配列）
    const particles: Particle[] = [] // 画面内の全パーティクル
    const image = new Image()

    /**
     * 【解説：積み上げアルゴリズム】
     * 画面の水平解像度を `BIN_WIDTH` ごとに離散化し、各区分（ビン）の累積高さを `pileHeights` 配列で保持する。
     * パーティクルが衝突判定をパスし接地した際、対応するビンのインデックスに値を加算することで、
     * 擬似的な形状の堆積を表現する。
     */

    /**
     * キャンバスの解像度をデバイスの物理ピクセル密度に同期する
     * 
     * ※DPR (Device Pixel Ratio): 物理ピクセル解像度に対する論理ピクセル（CSSピクセル）の比率。
     * キャンバスの内部バッファサイズを `物理ピクセル数 = 論理ピクセル数 * DPR` で更新しない場合、
     * ブラウザによる線形補間（アップスケーリング）が生じ、描画の鮮明度が低下する。
     */
    const syncCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      // キャンバス内部の解像度をDPR倍にする（物理ピクセルに合わせる）
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      // 表示上のサイズはCSS（論理ピクセル）で指定。
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      // 描画全体をDPR倍にスケールすることで、コード上では通常のピクセル単位で扱えるようにする。
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // 水平座標の離散化に使用するビン数を算出
      const binCount = Math.max(1, Math.ceil(width / BIN_WIDTH))
      if (pileHeights.length !== binCount) {
        // 解像度変更時、既存の堆積データを新規配列へ転送
        const next = new Array<number>(binCount).fill(0)
        for (let index = 0; index < Math.min(binCount, pileHeights.length); index += 1) {
          next[index] = pileHeights[index]
        }
        pileHeights = next
      }
    }

    /**
     * フッターの位置情報を取得
     * たこがどこに積もるべきかを判断するのに使用
     */
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

    /**
     * ヒーローセクションの下端を取得
     * 
     * ※canvas.parentElement?.querySelector("section") について:
     * このコンポーネント内の <section> 要素を探し、その位置と高さを計算。
     * これにより、テキストが重なっている範囲を動的に特定できる。
     */
    const getHeroBottom = () => {
      const heroSection = canvas.parentElement?.querySelector("section") as HTMLElement | null
      return heroSection ? heroSection.offsetTop + heroSection.offsetHeight : window.innerHeight
    }

    /**
     * 指定した単一の水平座標 X における累積高さを取得。隣接するビン間の値は線形補間する。
     * 
     * ※線形補間（Linear Interpolation）: 離散的なデータ点の間を 1次関数で補完する手法。
     * これにより、ビン境界での不連続な段差を解消し、連続的な勾配（法線ベクトル）の算出を可能にする。
     */
    const getPileHeightAtX = (x: number) => {
      const normalizedX = clamp(x / BIN_WIDTH, 0, Math.max(pileHeights.length - 1, 0))
      const left = Math.floor(normalizedX)
      const right = Math.min(left + 1, pileHeights.length - 1)
      const amount = normalizedX - left
      const leftHeight = pileHeights[left] ?? 0
      const rightHeight = pileHeights[right] ?? leftHeight
      return lerp(leftHeight, rightHeight, amount)
    }

    /**
     * 指定したビンに高さを追加（積もらせる処理）
     */
    const addPileHeight = (bin: number, amount: number, cap: number) => {
      if (bin < 0 || bin >= pileHeights.length) return
      pileHeights[bin] = Math.min(cap, pileHeights[bin] + amount)
    }

    /**
     * たこが地面についたとき、地面を高くして消滅（積もった状態に）させる。
     */
    const settleParticle = (particle: Particle, metrics: ReturnType<typeof getFooterMetrics>) => {
      const bin = clamp(Math.floor(particle.x / BIN_WIDTH), 0, pileHeights.length - 1)

      // 接地点を中心にガウス分布状に値を分散させ、堆積物の不連続性を抑制する
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
      // たこの最終的な高さを、現在の積雪量に合わせる
      particle.y = metrics.documentBottom - getPileHeightAtX(particle.x) - TAKO_RADIUS
    }

    /**
     * 新しいたおを生成して、配列に追加する
     */
    const spawnParticle = (scrollY: number) => {
      const baseX = randomRange(TAKO_RADIUS, width - TAKO_RADIUS)
      particles.push({
        x: baseX,
        // scrollY を足すことで、現在のスクロール位置に応じた「画面の一番上」に出現させる。
        y: scrollY - TAKO_SIZE - randomRange(12, 90), // 画面外（上）から降らせる
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

    /**
     * 各フレームごとに、たこの位置や速度を更新する（物理演算）
     */
    const updateParticle = (particle: Particle, time: number, metrics: ReturnType<typeof getFooterMetrics>) => {
      if (particle.settled) return

      // 横方向の動き：ドリフト（流れ）とSway（揺れ）
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

      // 画面左右の壁で跳ね返る
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

      // 地面（あるいは積もった山）との衝突判定
      const leftHeight = getPileHeightAtX(particle.x - BIN_WIDTH)
      const rightHeight = getPileHeightAtX(particle.x + BIN_WIDTH)
      /**
       * surfaceSlope: 山の斜面（傾き）を計算。
       * 右側が高ければマイナス、左側が高ければプラスの値になり、
       * これを使って「斜面を転がる動き」を作る。
       */
      const surfaceSlope = (rightHeight - leftHeight) / (BIN_WIDTH * 2)
      const surfaceY = metrics.documentBottom - getPileHeightAtX(particle.x) - TAKO_RADIUS

      if (particle.y >= surfaceY) {
        particle.y = surfaceY
        particle.vy = -Math.abs(particle.vy) * BOUNCE_DAMPING // 地面でバウンド
        // 斜面の傾き（surfaceSlope）に応じて、横方向の速度（vx）を変化させる（転がる処理）。
        particle.vx += -surfaceSlope * 2.4 + particle.drift * 0.03 
        particle.vx *= FLOOR_FRICTION
        particle.rotationSpeed = particle.vx * 0.028
      }

      // 静止判定
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

    /**
     * たこ同士の衝突判定
     * お互いにぶつかったときに跳ね返るように計算。
     */
    const resolveParticleCollisions = () => {
      for (let i = 0; i < particles.length; i += 1) {
        const first = particles[i]
        if (first.settled) continue

        // 二重ループで、全てのたこの組み合わせについてぶつかっているかを確認。
        // j = i + 1 とすることで、自分自身との判定や、同じペアの二重判定を防ぐ。
        for (let j = i + 1; j < particles.length; j += 1) {
          const second = particles[j]
          if (second.settled) continue

          // 2点間の距離を計算（ピタゴラスの定理: a^2 + b^2 = c^2）
          const dx = second.x - first.x
          const dy = second.y - first.y
          // 処理速度向上のため、高価な Math.sqrt() を使う前に「距離の2乗」で判定。
          const distanceSquared = dx * dx + dy * dy
          const minDistance = TAKO_SIZE

          // 2点間の距離がサイズ（直径）よりも小さい場合、衝突しているとみなす。
          if (distanceSquared >= minDistance * minDistance || distanceSquared < 0.01) continue

          // ここから衝突の解消（押し出し）のための計算
          const distance = Math.sqrt(distanceSquared)
          const overlap = minDistance - distance // 重なっている距離
          // 法線ベクトル（衝突した方向を示すベクトル）
          const normalX = dx / distance
          const normalY = dy / distance

          // 押し出し処理
          first.x -= normalX * overlap * 0.5
          first.y -= normalY * overlap * 0.5
          second.x += normalX * overlap * 0.5
          second.y += normalY * overlap * 0.5

          // 相対的な速度を計算し、お互いが「近づいている」場合のみ跳ね返す
          const relativeVelocityX = first.vx - second.vx
          const relativeVelocityY = first.vy - second.vy
          const approachSpeed = relativeVelocityX * normalX + relativeVelocityY * normalY

          if (approachSpeed > 0) {
            // インパルス（衝撃）を与えて、速度の向きを反転させる
            const impulse = approachSpeed * 0.58
            first.vx -= impulse * normalX
            first.vy -= impulse * normalY
            second.vx += impulse * normalX
            second.vy += impulse * normalY
          }

          // ぶつかった衝撃で少し回転させる
          first.rotationSpeed += (-normalY * first.vx + normalX * first.vy) * 0.004
          second.rotationSpeed += (-normalY * second.vx + normalX * second.vy) * 0.004
        }
      }
    }

    /**
     * 垂直座標 Y に基づき、セクションごとの描画不透明度（Alpha）を階層的に合成する。
     */
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

    /**
     * たこを描画。
     */
    const drawParticles = (scrollY: number, heroBottom: number, footerTop: number) => {
      ctx.clearRect(0, 0, width, height)

      if (!image.complete || image.naturalWidth === 0) return

      for (const particle of particles) {
        const viewportY = particle.y - scrollY // スクロールオフセットを減算し、ビューポート座標系へ変換
        // ビューポート外のパーティクルはレンダリング対象から除外（カリングによる最適化）
        if (viewportY < -TAKO_SIZE || viewportY > height + TAKO_SIZE) continue

        // ctx.save() / ctx.restore(): 描画コンテキストの状態（変形行列、透明度等）をスタックで管理。
        // 個別のパーティクルによる状態変化が後続の描画ルーチンに波及するのを防ぐ。
        ctx.save()
        // 透明度の設定（場所によって透け方を変える）
        ctx.globalAlpha = getParticleAlpha(particle, heroBottom, footerTop)
        // 描画の中心をたこの位置に移動し、回転させてから画像を描く
        ctx.translate(particle.x, viewportY)
        ctx.rotate(particle.rotation)
        ctx.drawImage(image, -TAKO_RADIUS, -TAKO_RADIUS, TAKO_SIZE, TAKO_SIZE)
        ctx.restore()
      }
    }

    /**
     * メインのアニメーションループ
     */
    const animate = (time: number) => {
      const scrollY = window.scrollY
      const heroBottom = getHeroBottom()
      const footerMetrics = getFooterMetrics()
      let activeCount = particles.filter((particle) => !particle.settled).length

      // 定期的に新しいたこを降らせる
      while (time - lastSpawnAt >= SPAWN_INTERVAL && activeCount < MAX_ACTIVE_PARTICLES) {
        lastSpawnAt += SPAWN_INTERVAL
        spawnParticle(scrollY)
        activeCount += 1

        if (Math.random() > 0.55 && activeCount < MAX_ACTIVE_PARTICLES) {
          spawnParticle(scrollY)
          activeCount += 1
        }
      }

      // 各たこの計算と描画
      for (const particle of particles) {
        updateParticle(particle, time, footerMetrics)
      }

      resolveParticleCollisions()
      drawParticles(scrollY, heroBottom, footerMetrics.footerTop)
      rafId = window.requestAnimationFrame(animate)
    }

    /**
     * アニメーションの開始処理
     */
    const startAnimation = () => {
      if (started) return
      started = true
      syncCanvas()
      // performance.now(): ブラウザ起動時からの経過時間をミリ秒単位で取得（Date.now()より高精度）。
      lastSpawnAt = performance.now() - SPAWN_INTERVAL
      rafId = window.requestAnimationFrame(animate)
    }

    // 画像の読み込み完了を待ってアニメーションを開始
    image.onload = startAnimation
    image.src = "/images/falling-tako.png"
    if (image.complete) {
      startAnimation()
    }

    syncCanvas()
    window.addEventListener("resize", syncCanvas)

    // クリーンアップ処理（メモリリーク防止）
    // コンポーネントがアンマウント（画面から消える）されたときに、
    // アニメーションのループやイベントリスナーを停止・削除。
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("resize", syncCanvas)
    }
  }, []) // 第二引数が空配列 [] なので、初回マウント時のみ実行。

  return (
    <div className={styles.container}>
      {/* 
          固定配置されたCanvas。
          画面最前面でたこが降る演出を担うが、pointerEvents: "none" により
          下のテキストやボタンへのクリックを邪魔しない。
      */}
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

      {/* ヒーローセクションの内容 */}
      <section className={styles.hero}>
        {/* 背景画像（通天閣と純喫茶）をグリッドで表示 */}
        <div className={styles.heroBackgroundGrid}>
          <img src="/images/tutenkaku.jpg" alt="通天閣" className={styles.bgImage} />
          <img src="/images/kissaten.png" alt="純喫茶" className={styles.bgImage} />
        </div>

        {/* ガラス背景調のテキストコンテンツ */}
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
            {/* スムーズスクロールで商品一覧へ移動 */}
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
