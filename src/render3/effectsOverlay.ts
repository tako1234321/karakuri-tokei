// WebGLの上に重ねた透明2Dキャンバスに紙吹雪を描く

import type { App } from '../app'

const CONFETTI_COLORS = ['#e26fa0', '#5b8dd9', '#f4c542', '#6cc07a', '#c98d5a', '#9a7fd1']

export function spawnConfetti(app: App, n = 80): void {
  for (let i = 0; i < n; i++) {
    app.particles.push({
      x: Math.random() * app.camera.cssW,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 60,
      vy: 80 + Math.random() * 120,
      life: 0,
      maxLife: 3.5 + Math.random() * 2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 8,
    })
  }
  if (app.particles.length > 400) app.particles.splice(0, app.particles.length - 400)
}

export function drawEffects(app: App): void {
  const ctx = app.overlayCtx
  const dpr = app.camera.dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, app.camera.cssW, app.camera.cssH)
  if (app.particles.length === 0) return

  const dt = Math.min(0.05, app.dt)
  for (const pt of app.particles) {
    pt.life += dt
    pt.x += (pt.vx + Math.sin(pt.life * 4 + pt.rot) * 30) * dt
    pt.y += pt.vy * dt
    pt.rot += pt.vr * dt
  }
  app.particles = app.particles.filter(pt => pt.life < pt.maxLife && pt.y < app.camera.cssH + 30)
  for (const pt of app.particles) {
    ctx.save()
    ctx.translate(pt.x, pt.y)
    ctx.rotate(pt.rot)
    ctx.globalAlpha = Math.max(0, 1 - pt.life / pt.maxLife)
    ctx.fillStyle = pt.color
    ctx.fillRect(-pt.size / 2, -pt.size / 3, pt.size, pt.size * 0.66)
    ctx.restore()
  }
  ctx.globalAlpha = 1
}
