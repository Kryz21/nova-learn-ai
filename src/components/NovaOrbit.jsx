import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, ListChecks, Layers } from 'lucide-react'

// ─── Node layout (screen %, for label cards) ───────────────────────────────
// Top-center, bottom-right, bottom-left
const NODES = [
  { Icon: FileText,   label: 'Notes',      color: '#00F0FF', lx: 50, ly: 6  },
  { Icon: ListChecks, label: 'Quiz',        color: '#FF2EC4', lx: 88, ly: 72 },
  { Icon: Layers,     label: 'Flashcards',  color: '#7C3AED', lx: 12, ly: 72 },
]

const COLORS = ['#00F0FF', '#FF2EC4', '#7C3AED']

// Three rings, each tilted so its topmost point faces the matching node card
const RINGS = [
  { nodeIdx: 0, tiltX:  0.35, tiltZ:  0.0  },   // Notes    – ring leans back
  { nodeIdx: 1, tiltX: -0.25, tiltZ: -0.9  },   // Quiz     – ring leans right
  { nodeIdx: 2, tiltX: -0.25, tiltZ:  0.9  },   // Flashcards – ring leans left
]

const RES     = 420
const RING_R  = 148
const SPHERE_R = 54
const N_SPHERE = 220
const FOV     = 600

// ── 3-D helpers ──────────────────────────────────────────────────────────────
function rotX(x, y, z, a) {
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]
}
function rotZ(x, y, z, a) {
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]
}
function rotY(x, y, z, a) {
  return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]
}
function project(x, y, z, CX, CY) {
  const scale = FOV / (FOV + z + 200)
  return { sx: CX + x * scale, sy: CY + y * scale, scale }
}

export default function NovaOrbit() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    canvas.width  = RES
    canvas.height = RES
    const CX = RES / 2
    const CY = RES / 2

    // ── Sphere particles ──────────────────────────────────────────────────
    const sphere = Array.from({ length: N_SPHERE }, () => {
      const u   = Math.random() * 2 * Math.PI
      const v   = Math.acos(2 * Math.random() - 1)
      const col = COLORS[Math.floor(Math.random() * 3)]
      return {
        ox: SPHERE_R * Math.sin(v) * Math.cos(u),
        oy: SPHERE_R * Math.sin(v) * Math.sin(u),
        oz: SPHERE_R * Math.cos(v),
        r:  Math.random() * 1.2 + 0.5,
        col,
        phase: Math.random() * Math.PI * 2,
      }
    })

    // ── Stream particles ──────────────────────────────────────────────────
    const streams = []
    let streamCooldown = 0

    function spawnStream(ringIdx) {
      const ring  = RINGS[ringIdx]
      const angle = Math.random() * Math.PI * 2
      streams.push({
        ringIdx,
        angle,
        t:     0,
        speed: 0.006 + Math.random() * 0.006,
        r:     1.4 + Math.random() * 1.2,
        trail: [],
      })
    }

    // ── Render loop ───────────────────────────────────────────────────────
    let T   = 0
    let raf

    function draw() {
      T   += 0.007
      streamCooldown -= 0.007

      ctx.clearRect(0, 0, RES, RES)

      // World Y rotation (slow spin)
      const wY = T * 0.25

      // Node card pixel positions for stream targets
      const nodePx = NODES.map(n => ({
        x: RES * (n.lx / 100),
        y: RES * (n.ly / 100),
      }))

      // ── Rings ────────────────────────────────────────────────────────────
      RINGS.forEach((ring, ri) => {
        const segments = 120
        const color    = COLORS[ring.nodeIdx]
        ctx.beginPath()
        for (let si = 0; si <= segments; si++) {
          const a  = (si / segments) * Math.PI * 2
          let [x, y, z] = [RING_R * Math.cos(a), 0, RING_R * Math.sin(a)]
          ;[x, y, z] = rotX(x, y, z, ring.tiltX)
          ;[x, y, z] = rotZ(x, y, z, ring.tiltZ)
          ;[x, y, z] = rotY(x, y, z, wY)
          const p = project(x, y, z, CX, CY)
          // depth-based alpha: front half brighter
          const depthAlpha = 0.08 + 0.22 * Math.max(0, (-z + 100) / 300)
          ctx.strokeStyle = color
          ctx.globalAlpha = depthAlpha
          if (si === 0) ctx.moveTo(p.sx, p.sy)
          else          ctx.lineTo(p.sx, p.sy)
        }
        ctx.globalAlpha = 1
        ctx.lineWidth   = 1.2
        ctx.strokeStyle = color
        ctx.globalAlpha = 0.25
        ctx.stroke()
        ctx.globalAlpha = 1

        // Orbiting bright dot on each ring
        const dotAngle = T * (0.55 + ri * 0.15) * (ri % 2 === 0 ? 1 : -1)
        let [dx, dy, dz] = [RING_R * Math.cos(dotAngle), 0, RING_R * Math.sin(dotAngle)]
        ;[dx, dy, dz] = rotX(dx, dy, dz, ring.tiltX)
        ;[dx, dy, dz] = rotZ(dx, dy, dz, ring.tiltZ)
        ;[dx, dy, dz] = rotY(dx, dy, dz, wY)
        const dp = project(dx, dy, dz, CX, CY)
        const dotDepth = Math.max(0.3, (dz + 300) / 500)
        ctx.save()
        ctx.globalAlpha = dotDepth
        ctx.fillStyle   = color
        ctx.shadowColor = color
        ctx.shadowBlur  = 18
        ctx.beginPath()
        ctx.arc(dp.sx, dp.sy, 2.8 * dp.scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // ── Sphere particles ─────────────────────────────────────────────────
      const items = sphere.map(p => {
        const puls = 1 + 0.06 * Math.sin(T * 2 + p.phase)
        let [x, y, z] = [p.ox * puls, p.oy * puls, p.oz * puls]
        ;[x, y, z] = rotY(x, y, z, wY)
        const pr   = project(x, y, z, CX, CY)
        const alpha = 0.15 + 0.65 * Math.max(0, (z + SPHERE_R) / (2 * SPHERE_R))
        return { proj: pr, r: p.r, col: p.col, alpha, glow: z > 0 ? 6 : 0 }
      }).sort((a, b) => a.proj.scale - b.proj.scale)   // back-to-front

      items.forEach(item => {
        ctx.save()
        ctx.globalAlpha = Math.min(1, item.alpha)
        ctx.fillStyle   = item.col
        if (item.glow) {
          ctx.shadowColor = item.col
          ctx.shadowBlur  = item.glow
        }
        ctx.beginPath()
        ctx.arc(item.proj.sx, item.proj.sy, Math.max(0.1, item.r), 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // ── Stream particles ─────────────────────────────────────────────────
      if (streamCooldown <= 0) {
        spawnStream(Math.floor(T * 2) % 3)
        streamCooldown = 0.18 + Math.random() * 0.15
      }

      for (let i = streams.length - 1; i >= 0; i--) {
        const s = streams[i]
        s.t += s.speed
        if (s.t > 1) { streams.splice(i, 1); continue }

        const ring = RINGS[s.ringIdx]
        const angle = s.angle
        let [x3, y3, z3] = [RING_R * Math.cos(angle), 0, RING_R * Math.sin(angle)]
        ;[x3, y3, z3] = rotX(x3, y3, z3, ring.tiltX)
        ;[x3, y3, z3] = rotZ(x3, y3, z3, ring.tiltZ)
        ;[x3, y3, z3] = rotY(x3, y3, z3, wY)
        const startP = project(x3, y3, z3, CX, CY)

        const dest = nodePx[ring.nodeIdx]
        const t1   = s.t
        const sx   = (1 - t1) * startP.sx + t1 * dest.x
        const sy   = (1 - t1) * startP.sy + t1 * dest.y

        const fade = t1 < 0.1 ? t1 / 0.1 : t1 > 0.8 ? (1 - t1) / 0.2 : 1

        s.trail.push([sx, sy])
        if (s.trail.length > 7) s.trail.shift()
        s.trail.forEach(([tx, ty], ti) => {
          ctx.save()
          ctx.globalAlpha = (ti / s.trail.length) * fade * 0.35
          ctx.fillStyle   = COLORS[s.ringIdx]
          ctx.beginPath()
          ctx.arc(tx, ty, s.r * 0.45, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        })

        ctx.save()
        ctx.globalAlpha = fade * 0.92
        ctx.fillStyle   = COLORS[s.ringIdx]
        ctx.shadowColor = COLORS[s.ringIdx]
        ctx.shadowBlur  = 14
        ctx.beginPath()
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // ── Central glow ──────────────────────────────────────────────────────
      const pulse = 0.8 + 0.2 * Math.sin(T * 1.5)
      ;[
        [42,  0.55, '#00F0FF'],
        [80,  0.20, '#7C3AED'],
        [130, 0.09, '#FF2EC4'],
      ].forEach(([r, a, col]) => {
        const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, r)
        g.addColorStop(0, col + Math.round(a * pulse * 255).toString(16).padStart(2, '0'))
        g.addColorStop(1, col + '00')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, RES, RES)
      })

      // ── Node halos ────────────────────────────────────────────────────────
      nodePx.forEach((node, i) => {
        const hp = 0.5 + 0.5 * Math.sin(T * 1.2 + i * 2.1)
        const g  = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 42)
        g.addColorStop(0, COLORS[i] + Math.round(60 * hp).toString(16).padStart(2, '0'))
        g.addColorStop(1, COLORS[i] + '00')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(node.x, node.y, 42, 0, Math.PI * 2)
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] mx-auto select-none"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Floating label cards */}
      {NODES.map(({ Icon, label, color, lx, ly }, i) => (
        <motion.div
          key={label}
          className="absolute flex flex-col items-center gap-1.5 pointer-events-none"
          style={{ left: `${lx}%`, top: `${ly}%`, transform: 'translate(-50%, -50%)' }}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 3.2 + i * 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1.1,
          }}
        >
          <div
            style={{
              width: 52, height: 52,
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(145deg, rgba(17,17,30,0.96), rgba(10,10,18,0.96))',
              border: `1px solid ${color}48`,
              boxShadow: `0 0 18px ${color}44, 0 0 48px ${color}1A, inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}
          >
            <Icon size={21} color={color} strokeWidth={1.5} />
          </div>
          <span
            className="font-mono text-[10px] tracking-widest uppercase whitespace-nowrap"
            style={{ color: color + 'BB' }}
          >
            {label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
