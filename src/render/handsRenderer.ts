import type { HandKind } from '../core/types'

const LEN: Record<HandKind, number> = { sec: 150, min: 134, hour: 92 }
const WID: Record<HandKind, number> = { sec: 4, min: 9, hour: 12 }

export function handColor(kind: HandKind): string {
  return kind === 'sec' ? '#d64545' : '#2b3a55'
}

// 針を描く。angle=0 が12時の向き。
export function drawHand(
  ctx: CanvasRenderingContext2D,
  design: string,
  kind: HandKind,
  angle: number,
): void {
  ctx.save()
  ctx.rotate(angle)
  const len = LEN[kind]
  const w = WID[kind]
  const color = handColor(kind)
  ctx.fillStyle = color
  ctx.strokeStyle = color

  if (design === 'bar') {
    rounded(ctx, -w / 2, -len, w, len + 26, w / 2)
    ctx.fill()
  } else if (design === 'sword') {
    ctx.beginPath()
    ctx.moveTo(0, -len)
    ctx.lineTo(w * 0.9, 6)
    ctx.lineTo(0, 22)
    ctx.lineTo(-w * 0.9, 6)
    ctx.closePath()
    ctx.fill()
  } else if (design === 'breguet') {
    ctx.lineWidth = Math.max(3, w * 0.55)
    ctx.beginPath()
    ctx.moveTo(0, 20)
    ctx.lineTo(0, -len + 34)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, -len + 22, 11, 0, Math.PI * 2)   // 透かしリング
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, -len)
    ctx.lineTo(6, -len + 12)
    ctx.lineTo(-6, -len + 12)
    ctx.closePath()
    ctx.fill()
  } else {
    // classic: 軸+しずく形
    ctx.lineWidth = Math.max(3, w * 0.5)
    ctx.beginPath()
    ctx.moveTo(0, 22)
    ctx.lineTo(0, -len * 0.55)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(0, -len * 0.72, w * 0.9, len * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, -len)
    ctx.lineTo(0, -len * 0.9)
    ctx.lineWidth = Math.max(2, w * 0.35)
    ctx.stroke()
  }

  // 中心キャップ
  ctx.beginPath()
  ctx.arc(0, 0, kind === 'sec' ? 6 : 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
