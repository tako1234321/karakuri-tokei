import { MODULE, type AxlePart, type RackPart, type Vec2, type Wheel } from './types'

export function pitchRadius(teeth: number): number {
  return MODULE * teeth / 2
}

export function outerRadius(teeth: number): number {
  return pitchRadius(teeth) + MODULE
}

// 軸パーツが持つ歯車(ホイール)の一覧。ホイールiは層 layer+i に存在する
export function wheelsOf(p: AxlePart): Wheel[] {
  if (p.kind === 'gear') return p.wheels.map((t, i) => ({ teeth: t, radius: pitchRadius(t), layer: p.layer + i }))
  if (p.kind === 'escapement') return [{ teeth: p.escapeTeeth, radius: pitchRadius(p.escapeTeeth), layer: p.layer }]
  return [{ teeth: p.teeth, radius: pitchRadius(p.teeth), layer: p.layer }]
}

// パーツが占有する層の一覧
export function layersOf(p: AxlePart): number[] {
  return wheelsOf(p).map(w => w.layer)
}

export function maxRadius(p: AxlePart): number {
  return Math.max(...wheelsOf(p).map(w => w.radius)) + MODULE
}

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

// 噛み合いとして拾う許容誤差(子供の指でも掛かるよう甘め)
export const MESH_EPS = MODULE * 0.9
// ドロップ時にスナップで吸い付く範囲(子供の指でも掛かるようかなり甘め)
export const SNAP_RANGE = MODULE * 5.5

export const RACK_H = 26

// ラックのピッチ線(歯は上側に付いている)
export function rackPitchY(r: RackPart): number {
  return r.pos.y - RACK_H / 2
}

export function rackTravel(r: RackPart): number {
  return Math.max(40, r.length * 0.45)
}
