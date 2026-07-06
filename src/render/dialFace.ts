// 文字盤の絵を Canvas に描く(3DのCanvasTextureと共用するため独立させた)

import { DIAL_RADIUS } from '../data/dials'

// おはな文字盤の花びらぶんの余白も含めた描画半径
export const DIAL_TEX_RADIUS = DIAL_RADIUS + 45

export function renderDialFace(canvas: HTMLCanvasElement, style: string): void {
  const S = canvas.width
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, S, S)
  const scale = S / (DIAL_TEX_RADIUS * 2)
  ctx.translate(S / 2, S / 2)
  ctx.scale(scale, scale)

  const R = DIAL_RADIUS

  if (style === 'flower') {
    ctx.fillStyle = '#f9c9d8'
    for (let i = 0; i < 12; i++) {
      ctx.save()
      ctx.rotate(i * Math.PI / 6)
      ctx.beginPath()
      ctx.ellipse(0, -R + 12, 34, 52, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  ctx.fillStyle = '#fffaf0'
  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#4a3a28'
  ctx.strokeStyle = '#4a3a28'
  if (style === 'ticks') {
    for (let i = 0; i < 60; i++) {
      const a = i * Math.PI / 30 - Math.PI / 2
      const major = i % 5 === 0
      ctx.lineWidth = major ? 5 : 2
      const r1 = R - (major ? 26 : 16)
      ctx.beginPath()
      ctx.moveTo(r1 * Math.cos(a), r1 * Math.sin(a))
      ctx.lineTo((R - 8) * Math.cos(a), (R - 8) * Math.sin(a))
      ctx.stroke()
    }
  } else {
    // 時計の伝統で4時は「IIII」と書く
    const ROMAN = ['', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
    const roman = style === 'roman'
    ctx.font = roman
      ? `bold 24px Georgia, 'Times New Roman', serif`
      : `bold ${style === 'flower' ? 26 : 30}px 'Segoe UI', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = 1; i <= 12; i++) {
      const a = i * Math.PI / 6 - Math.PI / 2
      const r1 = R - 30
      ctx.fillText(roman ? ROMAN[i] : String(i), r1 * Math.cos(a), r1 * Math.sin(a))
    }
    ctx.lineWidth = 2
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue
      const a = i * Math.PI / 30
      ctx.beginPath()
      ctx.moveTo((R - 14) * Math.cos(a), (R - 14) * Math.sin(a))
      ctx.lineTo((R - 8) * Math.cos(a), (R - 8) * Math.sin(a))
      ctx.stroke()
    }
  }

  // 中心点(針や軸を合わせる目印)
  ctx.fillStyle = '#4a3a28'
  ctx.beginPath()
  ctx.arc(0, 0, 6, 0, Math.PI * 2)
  ctx.fill()
}
