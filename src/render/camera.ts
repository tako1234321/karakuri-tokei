import type { Vec2 } from '../core/types'

export class Camera {
  x = 0
  y = 0
  scale = 1
  cssW = 1
  cssH = 1
  dpr = 1

  resize(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect()
    this.cssW = Math.max(1, rect.width)
    this.cssH = Math.max(1, rect.height)
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(this.cssW * this.dpr)
    canvas.height = Math.round(this.cssH * this.dpr)
  }

  screenToWorld(sx: number, sy: number): Vec2 {
    return {
      x: (sx - this.cssW / 2) / this.scale + this.x,
      y: (sy - this.cssH / 2) / this.scale + this.y,
    }
  }

  worldToScreen(wx: number, wy: number): Vec2 {
    return {
      x: (wx - this.x) * this.scale + this.cssW / 2,
      y: (wy - this.y) * this.scale + this.cssH / 2,
    }
  }

  apply(ctx: CanvasRenderingContext2D): void {
    const s = this.scale * this.dpr
    ctx.setTransform(s, 0, 0, s,
      this.dpr * (this.cssW / 2 - this.x * this.scale),
      this.dpr * (this.cssH / 2 - this.y * this.scale))
  }

  zoomAt(sx: number, sy: number, factor: number): void {
    const p = this.screenToWorld(sx, sy)
    this.scale = Math.min(3, Math.max(0.25, this.scale * factor))
    this.x = p.x - (sx - this.cssW / 2) / this.scale
    this.y = p.y - (sy - this.cssH / 2) / this.scale
  }

  panBy(dx: number, dy: number): void {
    this.x -= dx / this.scale
    this.y -= dy / this.scale
  }
}
