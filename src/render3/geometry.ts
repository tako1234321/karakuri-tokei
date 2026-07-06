// 3Dジオメトリの生成とキャッシュ。
// 歯形は2D版(render/gearPath.ts)と同じ数式を THREE.Shape に移植している。

import * as THREE from 'three'
import { camRadius } from '../core/cam'
import { pitchRadius } from '../core/gear'
import { MODULE, type HandKind } from '../core/types'
import { GEAR_THICK } from './space'

export const HOLE_R = 9

const cache = new Map<string, THREE.BufferGeometry>()

function cached(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  const hit = cache.get(key)
  if (hit) return hit
  const g = make()
  cache.set(key, g)
  return g
}

export function disposeAllGeometry(): void {
  for (const g of cache.values()) g.dispose()
  cache.clear()
}

const EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: GEAR_THICK,
  bevelEnabled: true,
  bevelThickness: 0.7,
  bevelSize: 0.7,
  bevelSegments: 1,
  curveSegments: 6,
}

function circleHole(r: number, cx = 0, cy = 0): THREE.Path {
  const p = new THREE.Path()
  p.absarc(cx, cy, r, 0, Math.PI * 2, true)
  return p
}

// ---------- 歯車 ----------

function gearShape(z: number): THREE.Shape {
  const r = pitchRadius(z)
  const rt = r + MODULE
  const rr = Math.max(HOLE_R + 4, r - MODULE * 1.25)
  const pitch = 2 * Math.PI / z
  const twTip = pitch * 0.14
  const twRoot = pitch * 0.30

  const s = new THREE.Shape()
  s.moveTo(rr * Math.cos(-twRoot), rr * Math.sin(-twRoot))
  for (let k = 0; k < z; k++) {
    const a = k * pitch
    if (k > 0) s.lineTo(rr * Math.cos(a - twRoot), rr * Math.sin(a - twRoot))
    s.lineTo(rt * Math.cos(a - twTip), rt * Math.sin(a - twTip))
    s.lineTo(rt * Math.cos(a + twTip), rt * Math.sin(a + twTip))
    s.lineTo(rr * Math.cos(a + twRoot), rr * Math.sin(a + twRoot))
    s.absarc(0, 0, rr, a + twRoot, a + pitch - twRoot, false)
  }
  s.closePath()

  s.holes.push(circleHole(HOLE_R))
  if (z >= 40) {
    const holes = z >= 80 ? 5 : 4
    const cr = (rr + HOLE_R) / 2
    const hr = Math.min((rr - HOLE_R) * 0.30, cr * 0.55)
    for (let k = 0; k < holes; k++) {
      const a = k * 2 * Math.PI / holes + Math.PI / holes
      s.holes.push(circleHole(hr, cr * Math.cos(a), cr * Math.sin(a)))
    }
  }
  return s
}

export function gearGeometry(z: number): THREE.BufferGeometry {
  return cached('g' + z, () => {
    const g = new THREE.ExtrudeGeometry(gearShape(z), EXTRUDE)
    g.translate(0, 0, -GEAR_THICK / 2)
    return g
  })
}

// ---------- ガンギ車(のこぎり歯) ----------

export function escapeWheelGeometry(z: number): THREE.BufferGeometry {
  return cached('e' + z, () => {
    const r = pitchRadius(z)
    const rt = r + MODULE
    const rr = r - MODULE * 0.8
    const pitch = 2 * Math.PI / z
    const s = new THREE.Shape()
    s.moveTo(rr, 0)
    for (let k = 0; k < z; k++) {
      const a = k * pitch
      if (k > 0) s.lineTo(rr * Math.cos(a), rr * Math.sin(a))
      s.lineTo(rt * Math.cos(a + pitch * 0.38), rt * Math.sin(a + pitch * 0.38))
      s.lineTo(rr * Math.cos(a + pitch * 0.5), rr * Math.sin(a + pitch * 0.5))
      s.absarc(0, 0, rr, a + pitch * 0.5, a + pitch, false)
    }
    s.closePath()
    s.holes.push(circleHole(HOLE_R))
    const g = new THREE.ExtrudeGeometry(s, { ...EXTRUDE, depth: 6 })
    g.translate(0, 0, -3)
    return g
  })
}

// ---------- 針(+y方向=12時の向きに作る) ----------

export const HAND_LEN: Record<HandKind, number> = { sec: 150, min: 134, hour: 92 }
export const HAND_WID: Record<HandKind, number> = { sec: 4, min: 9, hour: 12 }

function roundedRect(x: number, y: number, w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

function ellipseShape(cx: number, cy: number, rx: number, ry: number): THREE.Shape {
  const s = new THREE.Shape()
  s.absellipse(cx, cy, rx, ry, 0, Math.PI * 2, false, 0)
  return s
}

function handShapes(design: string, kind: HandKind): THREE.Shape[] {
  const len = HAND_LEN[kind]
  const w = HAND_WID[kind]

  if (design === 'bar') {
    return [roundedRect(-w / 2, -26, w, len + 26, w / 2)]
  }
  if (design === 'sword') {
    const s = new THREE.Shape()
    s.moveTo(0, len)
    s.lineTo(w * 0.9, -6)
    s.lineTo(0, -22)
    s.lineTo(-w * 0.9, -6)
    s.closePath()
    return [s]
  }
  if (design === 'breguet') {
    const stemW = Math.max(3, w * 0.55)
    const stem = roundedRect(-stemW / 2, -20, stemW, len - 34 + 20, stemW / 2)
    const ring = ellipseShape(0, len - 22, 13, 13)
    ring.holes.push(circleHole(9, 0, len - 22))
    const tip = new THREE.Shape()
    tip.moveTo(0, len)
    tip.lineTo(6, len - 12)
    tip.lineTo(-6, len - 12)
    tip.closePath()
    return [stem, ring, tip]
  }
  // classic
  const stemW = Math.max(3, w * 0.5)
  const stem = roundedRect(-stemW / 2, -22, stemW, len * 0.58 + 22, stemW / 2)
  const drop = ellipseShape(0, len * 0.72, w * 0.9, len * 0.2)
  const tipW = Math.max(2, w * 0.35)
  const tip = roundedRect(-tipW / 2, len * 0.88, tipW, len * 0.12, tipW / 2)
  return [stem, drop, tip]
}

export function handGeometry(design: string, kind: HandKind): THREE.BufferGeometry {
  return cached(`h:${design}:${kind}`, () => {
    const g = new THREE.ExtrudeGeometry(handShapes(design, kind), {
      depth: 2.2, bevelEnabled: false, curveSegments: 10,
    })
    g.translate(0, 0, -1.1)
    return g
  })
}

// ---------- カム ----------

export function camGeometry(profile: string): THREE.BufferGeometry {
  return cached('cam:' + profile, () => {
    const s = new THREE.Shape()
    const N = 72
    for (let i = 0; i <= N; i++) {
      const t3 = i / N * Math.PI * 2
      // three側の角度 t3 に対して、シム側プロファイルは鏡映(-t3)で参照する
      const r = camRadius(profile, -t3)
      const x = r * Math.cos(t3)
      const y = r * Math.sin(t3)
      if (i === 0) s.moveTo(x, y)
      else s.lineTo(x, y)
    }
    s.closePath()
    s.holes.push(circleHole(HOLE_R - 2))
    const g = new THREE.ExtrudeGeometry(s, { ...EXTRUDE, depth: 6, bevelSize: 0.5, bevelThickness: 0.5 })
    g.translate(0, 0, -3)
    return g
  })
}

// ---------- ラック ----------

export const RACK_TOOTH_H = 13

// 歯つきストリップ(上辺がのこぎり)。原点=バーの中心、+yが歯の向き
export function rackTeethGeometry(length: number): THREE.BufferGeometry {
  return cached('rt' + length, () => {
    const pitch = Math.PI * MODULE
    const s = new THREE.Shape()
    const x0 = -length / 2 + 4
    s.moveTo(x0, 0)
    for (let x = x0; x < length / 2 - pitch / 2; x += pitch) {
      s.lineTo(x + pitch * 0.32, RACK_TOOTH_H)
      s.lineTo(x + pitch * 0.62, 0)
    }
    s.lineTo(length / 2 - 4, 0)
    s.lineTo(length / 2 - 4, -5)
    s.lineTo(x0, -5)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: GEAR_THICK, bevelEnabled: false })
    g.translate(0, 0, -GEAR_THICK / 2)
    return g
  })
}

// ---------- アンクル(振り子の爪) ----------

export function anchorGeometry(): THREE.BufferGeometry {
  return cached('anchor', () => {
    // 2D版の頂点を y 反転(three は下向きが -y)
    const pts: [number, number][] = [
      [0, -6], [-34, -34], [-26, -44], [-4, -26], [4, -26], [26, -44], [34, -34],
    ]
    const s = new THREE.Shape()
    s.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1])
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 5, bevelEnabled: false })
    g.translate(0, 0, -2.5)
    return g
  })
}

// ---------- 汎用 ----------

// z軸方向の円柱(単位サイズ、scaleで使う)
export const cylZ = (() => {
  const g = new THREE.CylinderGeometry(1, 1, 1, 20)
  g.rotateX(Math.PI / 2)
  return g
})()

// y軸方向の円柱(振り子の棒など)
export const cylY = new THREE.CylinderGeometry(1, 1, 1, 16)

export const sphere = new THREE.SphereGeometry(1, 24, 16)
export const box = new THREE.BoxGeometry(1, 1, 1)

export function circleGeo(r: number, segments = 48): THREE.CircleGeometry {
  return new THREE.CircleGeometry(r, segments)
}
