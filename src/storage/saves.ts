import { MESH_EPS, dist, pitchRadius } from '../core/gear'
import { MAX_LAYER, isAxle, type AxlePart, type Part, type SaveData } from '../core/types'
import type { World } from '../core/world'

const PREFIX = 'karakuri:save:'
export const SLOT_COUNT = 5

// 直前の読み込みで旧形式(層なし)からの変換が行われたか
let lastLoadMigrated = false
export function wasMigrated(): boolean {
  const v = lastLoadMigrated
  lastLoadMigrated = false
  return v
}

export function saveSlot(slot: number | 'auto', world: World, melody: string, name = ''): void {
  const data: SaveData = {
    version: 1,
    name: name || `さくひん ${typeof slot === 'number' ? slot + 1 : ''}`.trim(),
    createdAt: new Date().toISOString(),
    parts: world.parts,
    melody,
  }
  try {
    localStorage.setItem(PREFIX + slot, JSON.stringify(data))
  } catch { /* 容量オーバーなどは無視 */ }
}

export function loadSlot(slot: number | 'auto'): SaveData | null {
  try {
    const s = localStorage.getItem(PREFIX + slot)
    if (!s) return null
    return validate(JSON.parse(s))
  } catch {
    return null
  }
}

export function slotList(): (SaveData | null)[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => loadSlot(i))
}

export function exportJson(world: World, melody: string): string {
  const data: SaveData = {
    version: 1,
    name: 'かきだしさくひん',
    createdAt: new Date().toISOString(),
    parts: world.parts,
    melody,
  }
  return JSON.stringify(data)
}

export function importJson(text: string): SaveData | null {
  try {
    return validate(JSON.parse(text))
  } catch {
    return null
  }
}

function validate(d: unknown): SaveData | null {
  if (!d || typeof d !== 'object') return null
  const data = d as SaveData
  if (data.version !== 1 || !Array.isArray(data.parts)) return null
  const kinds = new Set(['motor', 'gear', 'escapement', 'karakuriMotor', 'hand', 'rack', 'cam', 'doll', 'dial'])
  const parts = (data.parts as Part[]).filter(p =>
    p && typeof p === 'object' && kinds.has(p.kind) &&
    typeof p.id === 'string' && p.pos && typeof p.pos.x === 'number' && typeof p.pos.y === 'number')
  if (migrateLayers(parts)) lastLoadMigrated = true
  return { ...data, parts, melody: typeof data.melody === 'string' ? data.melody : 'westminster' }
}

// 旧形式(layerなし)の作品を層つきに変換する。
// 旧ルール(層を無視した距離だけ)の噛み合いから、
// 「ホイールaiとbiが噛む → layer(b) = layer(a) + ai − bi」で層を推定する。
function migrateLayers(parts: Part[]): boolean {
  const needs = parts.filter(p =>
    (isAxle(p) || p.kind === 'rack') && typeof (p as { layer?: unknown }).layer !== 'number')
  if (needs.length === 0) return false
  for (const p of needs) (p as { layer: number }).layer = 0

  const rawWheels = (p: AxlePart): { teeth: number; radius: number }[] => {
    if (p.kind === 'gear') return p.wheels.map(t => ({ teeth: t, radius: pitchRadius(t) }))
    if (p.kind === 'escapement') return [{ teeth: p.escapeTeeth, radius: pitchRadius(p.escapeTeeth) }]
    return [{ teeth: p.teeth, radius: pitchRadius(p.teeth) }]
  }

  const axles = parts.filter(isAxle)
  interface Edge { other: AxlePart; delta: number }
  const adj = new Map<string, Edge[]>()
  const push = (from: AxlePart, e: Edge) => {
    const list = adj.get(from.id) ?? []
    list.push(e)
    adj.set(from.id, list)
  }
  for (let i = 0; i < axles.length; i++) {
    for (let j = i + 1; j < axles.length; j++) {
      const A = axles[i], B = axles[j]
      const d = dist(A.pos, B.pos)
      const wa = rawWheels(A), wb = rawWheels(B)
      for (let ai = 0; ai < wa.length; ai++) {
        for (let bi = 0; bi < wb.length; bi++) {
          if (Math.abs(d - (wa[ai].radius + wb[bi].radius)) < MESH_EPS) {
            push(A, { other: B, delta: ai - bi })
            push(B, { other: A, delta: bi - ai })
          }
        }
      }
    }
  }

  // 連結成分ごとにBFSで層を割り当て、最小を0に平行移動
  const assigned = new Map<string, number>()
  for (const start of axles) {
    if (assigned.has(start.id)) continue
    const comp: AxlePart[] = [start]
    assigned.set(start.id, 0)
    const q = [start]
    while (q.length) {
      const a = q.shift()!
      for (const e of adj.get(a.id) ?? []) {
        if (assigned.has(e.other.id)) continue   // 矛盾エッジは無視(干渉表示に委ねる)
        assigned.set(e.other.id, assigned.get(a.id)! + e.delta)
        comp.push(e.other)
        q.push(e.other)
      }
    }
    const min = Math.min(...comp.map(p => assigned.get(p.id)!))
    for (const p of comp) {
      const span = rawWheels(p).length
      p.layer = Math.max(0, Math.min(MAX_LAYER - (span - 1), assigned.get(p.id)! - min))
    }
  }

  // ラックは噛んでいた歯車のホイール層をコピー
  for (const r of parts) {
    if (r.kind !== 'rack') continue
    for (const a of axles) {
      if (Math.abs(a.pos.x - r.pos.x) > r.length / 2 || a.pos.y > r.pos.y) continue
      const wa = rawWheels(a)
      const pitchY = r.pos.y - 13   // RACK_H/2
      for (let wi = 0; wi < wa.length; wi++) {
        if (Math.abs(pitchY - a.pos.y - wa[wi].radius) < MESH_EPS) r.layer = a.layer + wi
      }
    }
  }
  return true
}
