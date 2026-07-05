import { dollDef } from '../data/dolls'
import { RACK_H, SNAP_RANGE, dist, rackPitchY, wheelsOf } from './gear'
import { isAxle, type AxlePart, type Part, type PartId, type RackPart } from './types'

export function uid(): PartId {
  return 'p' + Math.random().toString(36).slice(2, 10)
}

const MOUNT_R = 52

export class World {
  parts: Part[] = []
  private undoStack: string[] = []

  byId(id: PartId | null): Part | undefined {
    if (!id) return undefined
    return this.parts.find(p => p.id === id)
  }

  axles(): AxlePart[] {
    return this.parts.filter(isAxle)
  }

  pushUndo(): void {
    this.undoStack.push(JSON.stringify(this.parts))
    if (this.undoStack.length > 30) this.undoStack.shift()
  }

  undo(): boolean {
    const s = this.undoStack.pop()
    if (!s) return false
    this.parts = JSON.parse(s)
    return true
  }

  add(p: Part): void {
    this.parts.push(p)
  }

  remove(id: PartId): void {
    this.parts = this.parts.filter(p => p.id !== id)
    for (const p of this.parts) {
      if ((p.kind === 'hand' || p.kind === 'cam' || p.kind === 'doll') && p.mountId === id) {
        p.mountId = null
      }
    }
  }

  // ドロップ・移動後のスナップ処理(噛み合い位置へ吸着 / 軸へ取り付け)
  snapPart(p: Part): void {
    if (isAxle(p)) this.snapAxle(p)
    else if (p.kind === 'rack') this.snapRack(p)
    else if (p.kind === 'hand' || p.kind === 'cam' || p.kind === 'doll') this.tryMount(p)
  }

  private snapAxle(part: AxlePart): void {
    let best: { err: number; apply: () => void } | null = null
    for (const other of this.axles()) {
      if (other.id === part.id) continue
      const d = dist(part.pos, other.pos)
      if (d < 1) continue
      for (const w1 of wheelsOf(part)) {
        for (const w2 of wheelsOf(other)) {
          const target = w1.radius + w2.radius
          const err = Math.abs(d - target)
          if (err < SNAP_RANGE && (!best || err < best.err)) {
            const ux = (part.pos.x - other.pos.x) / d
            const uy = (part.pos.y - other.pos.y) / d
            const o = other.pos
            best = {
              err,
              apply: () => { part.pos = { x: o.x + ux * target, y: o.y + uy * target } },
            }
          }
        }
      }
    }
    for (const r of this.parts) {
      if (r.kind !== 'rack') continue
      for (const w1 of wheelsOf(part)) {
        const desiredY = rackPitchY(r) - w1.radius
        const err = Math.abs(part.pos.y - desiredY)
        const inX = Math.abs(part.pos.x - r.pos.x) < r.length / 2
        if (inX && err < SNAP_RANGE && (!best || err < best.err)) {
          const x = part.pos.x
          best = { err, apply: () => { part.pos = { x, y: desiredY } } }
        }
      }
    }
    best?.apply()
  }

  private snapRack(rack: RackPart): void {
    let best: { err: number; y: number } | null = null
    for (const other of this.axles()) {
      const inX = Math.abs(other.pos.x - rack.pos.x) < rack.length / 2
      if (!inX) continue
      for (const w of wheelsOf(other)) {
        const desiredY = other.pos.y + w.radius + RACK_H / 2
        const err = Math.abs(rack.pos.y - desiredY)
        if (err < SNAP_RANGE && (!best || err < best.err)) {
          best = { err, y: desiredY }
        }
      }
    }
    if (best) rack.pos = { x: rack.pos.x, y: best.y }
  }

  // 針・カム・人形を近くの相手に取り付ける
  tryMount(p: Part): void {
    if (p.kind === 'hand' || p.kind === 'cam') {
      let best: { d: number; id: PartId } | null = null
      for (const a of this.axles()) {
        const d = dist(p.pos, a.pos)
        if (d < MOUNT_R && (!best || d < best.d)) best = { d, id: a.id }
      }
      p.mountId = best ? best.id : null
    } else if (p.kind === 'doll') {
      const def = dollDef(p.doll)
      let best: { d: number; id: PartId } | null = null
      for (const t of this.parts) {
        if (t.id === p.id) continue
        const ok = def.input === 'rotate' ? isAxle(t) : (t.kind === 'cam' || t.kind === 'rack')
        if (!ok) continue
        const d = dist(p.pos, t.pos)
        const range = def.input === 'rotate' ? MOUNT_R : MOUNT_R * 1.6
        if (d < range && (!best || d < best.d)) best = { d, id: t.id }
      }
      p.mountId = best ? best.id : null
    }
    this.syncMounts()
  }

  // 取り付け先に合わせて位置を追従させる
  syncMounts(): void {
    for (const p of this.parts) {
      if (p.kind === 'hand' || p.kind === 'cam') {
        const m = p.mountId ? this.byId(p.mountId) : undefined
        if (!m) { p.mountId = null; continue }
        p.pos = { ...m.pos }
      } else if (p.kind === 'doll') {
        const m = p.mountId ? this.byId(p.mountId) : undefined
        if (!m) { p.mountId = null; continue }
        if (isAxle(m)) p.pos = { ...m.pos }
        else if (m.kind === 'cam') p.pos = { x: m.pos.x, y: m.pos.y - 78 }
        else if (m.kind === 'rack') p.pos = { x: m.pos.x + m.disp, y: m.pos.y - RACK_H / 2 - 6 }
      }
    }
  }
}
