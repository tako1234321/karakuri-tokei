import { pitchRadius } from '../core/gear'
import { MODULE } from '../core/types'

const cache = new Map<string, Path2D>()

export const HOLE_R = 9

// 普通の歯車の歯形(歯数ごとにキャッシュ)。歯の中心がローカル角度0を向く。
export function gearPath(z: number): Path2D {
  const key = 'g' + z
  const hit = cache.get(key)
  if (hit) return hit

  const r = pitchRadius(z)
  const rt = r + MODULE            // 歯先
  const rr = Math.max(HOLE_R + 4, r - MODULE * 1.25)  // 歯底
  const pitch = 2 * Math.PI / z
  const twTip = pitch * 0.14
  const twRoot = pitch * 0.30

  const p = new Path2D()
  for (let k = 0; k < z; k++) {
    const a = k * pitch
    if (k === 0) p.moveTo(rr * Math.cos(a - twRoot), rr * Math.sin(a - twRoot))
    else p.lineTo(rr * Math.cos(a - twRoot), rr * Math.sin(a - twRoot))
    p.lineTo(rt * Math.cos(a - twTip), rt * Math.sin(a - twTip))
    p.lineTo(rt * Math.cos(a + twTip), rt * Math.sin(a + twTip))
    p.lineTo(rr * Math.cos(a + twRoot), rr * Math.sin(a + twRoot))
    p.arc(0, 0, rr, a + twRoot, a + pitch - twRoot)
  }
  p.closePath()

  // 軸穴(evenoddで抜く)
  p.moveTo(HOLE_R, 0)
  p.arc(0, 0, HOLE_R, 0, Math.PI * 2)

  // 大きい歯車には抜きスポーク
  if (z >= 40) {
    const holes = z >= 80 ? 5 : 4
    const cr = (rr + HOLE_R) / 2
    const hr = Math.min((rr - HOLE_R) * 0.30, cr * 0.55)
    for (let k = 0; k < holes; k++) {
      const a = k * 2 * Math.PI / holes + Math.PI / holes
      const cx = cr * Math.cos(a)
      const cy = cr * Math.sin(a)
      p.moveTo(cx + hr, cy)
      p.arc(cx, cy, hr, 0, Math.PI * 2)
    }
  }

  cache.set(key, p)
  return p
}

// ガンギ車(のこぎり歯)
export function escapeWheelPath(z: number): Path2D {
  const key = 'e' + z
  const hit = cache.get(key)
  if (hit) return hit

  const r = pitchRadius(z)
  const rt = r + MODULE
  const rr = r - MODULE * 0.8
  const pitch = 2 * Math.PI / z

  const p = new Path2D()
  for (let k = 0; k < z; k++) {
    const a = k * pitch
    if (k === 0) p.moveTo(rr * Math.cos(a), rr * Math.sin(a))
    else p.lineTo(rr * Math.cos(a), rr * Math.sin(a))
    p.lineTo(rt * Math.cos(a + pitch * 0.38), rt * Math.sin(a + pitch * 0.38))
    p.lineTo(rr * Math.cos(a + pitch * 0.5), rr * Math.sin(a + pitch * 0.5))
    p.arc(0, 0, rr, a + pitch * 0.5, a + pitch)
  }
  p.closePath()
  p.moveTo(HOLE_R, 0)
  p.arc(0, 0, HOLE_R, 0, Math.PI * 2)

  cache.set(key, p)
  return p
}
