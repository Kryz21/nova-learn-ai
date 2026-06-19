import { useEffect, useRef } from 'react'

// Multi-layer parallax starfield. Layers move at different speeds on scroll
// and drift slowly on their own, giving genuine depth rather than a flat png.
export default function StarField() {
  const canvasRef = useRef(null)
  const scrollRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf
    let stars = []
    let width, height

    const LAYERS = [
      { count: 90, size: [0.4, 1.1], speed: 0.02, color: '230,230,255', twinkle: 0.15 },
      { count: 55, size: [0.8, 1.8], speed: 0.05, color: '0,240,255', twinkle: 0.35 },
      { count: 28, size: [1.2, 2.6], speed: 0.11, color: '255,46,196', twinkle: 0.5 },
    ]

    function resize() {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight * 1
      buildStars()
    }

    function buildStars() {
      stars = []
      LAYERS.forEach((layer, li) => {
        for (let i = 0; i < layer.count; i++) {
          stars.push({
            x: Math.random() * width,
            y: Math.random() * height * 3,
            r: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
            layer: li,
            phase: Math.random() * Math.PI * 2,
          })
        }
      })
    }

    function onScroll() {
      scrollRef.current = window.scrollY
    }

    let t = 0
    function draw() {
      t += 0.01
      ctx.clearRect(0, 0, width, height)
      const grad = ctx.createRadialGradient(width * 0.8, height * 0.1, 0, width * 0.8, height * 0.1, width * 0.9)
      grad.addColorStop(0, 'rgba(124,58,237,0.08)')
      grad.addColorStop(1, 'rgba(5,5,10,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      stars.forEach((s) => {
        const layer = LAYERS[s.layer]
        const y = (s.y - scrollRef.current * layer.speed) % (height * 3)
        const yy = y < 0 ? y + height * 3 : y
        if (yy > height) return
        const tw = layer.twinkle * Math.sin(t * 2 + s.phase) * 0.5 + (1 - layer.twinkle * 0.5)
        ctx.beginPath()
        ctx.fillStyle = `rgba(${layer.color},${Math.min(1, Math.max(0.15, tw))})`
        ctx.shadowColor = `rgba(${layer.color},0.8)`
        ctx.shadowBlur = s.r * 3
        ctx.arc(s.x, yy, s.r, 0, Math.PI * 2)
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  )
}
