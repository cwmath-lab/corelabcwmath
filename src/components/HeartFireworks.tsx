import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; rotation: number; spin: number; life: number; color: string
}

const COLORS = ['#ff5da9', '#b277ff', '#62e8ca', '#ffe06b', '#ff8fc8', '#7c6cff']

export default function HeartFireworks({ durationMs = 5000 }: { durationMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const maxParticles = reducedMotion ? 24 : 140
    const burstSize = reducedMotion ? 5 : 18
    const particles: Particle[] = []
    let animationFrame = 0
    let lastTime = performance.now()
    const startedAt = lastTime
    let nextBurstAt = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const createBurst = () => {
      const originX = window.innerWidth * (0.15 + Math.random() * 0.7)
      const originY = window.innerHeight * (0.25 + Math.random() * 0.35)
      for (let index = 0; index < burstSize && particles.length < maxParticles; index += 1) {
        const angle = Math.random() * Math.PI * 2
        const speed = 90 + Math.random() * 150
        particles.push({
          x: originX, y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 85,
          size: 7 + Math.random() * 9,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 3,
          life: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        })
      }
    }

    const drawHeart = (particle: Particle) => {
      context.save()
      context.translate(particle.x, particle.y)
      context.rotate(particle.rotation)
      context.scale(particle.size / 20, particle.size / 20)
      context.globalAlpha = Math.max(0, particle.life)
      context.fillStyle = particle.color
      context.beginPath()
      context.moveTo(0, 7)
      context.bezierCurveTo(-18, -5, -10, -20, 0, -10)
      context.bezierCurveTo(10, -20, 18, -5, 0, 7)
      context.fill()
      context.restore()
    }

    const animate = (now: number) => {
      const elapsed = now - startedAt
      const delta = Math.min((now - lastTime) / 1000, 0.034)
      lastTime = now
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      if (elapsed >= nextBurstAt && elapsed < durationMs - 500) {
        createBurst()
        nextBurstAt += reducedMotion ? 1400 : 520
      }
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index]
        particle.x += particle.vx * delta
        particle.y += particle.vy * delta
        particle.vy += 150 * delta
        particle.rotation += particle.spin * delta
        particle.life -= delta * 0.48
        particle.size *= 0.998
        if (particle.life <= 0) particles.splice(index, 1)
        else drawHeart(particle)
      }
      if (elapsed < durationMs) animationFrame = requestAnimationFrame(animate)
      else context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }

    resize()
    window.addEventListener('resize', resize)
    animationFrame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
  }, [durationMs])

  return <canvas ref={canvasRef} className="heart-fireworks" aria-hidden="true" />
}
