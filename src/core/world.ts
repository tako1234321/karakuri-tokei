import { dollDef } from '../data/dolls'
import { HAND_TARGET } from './check'
import { RACK_H, SNAP_RANGE, dist, layersOf, rackPitchY, wheelsOf } from './gear'
import { feq, type Fraction } from './ratio'
import { MAX_LAYER, isAxle, type AxlePart, type Part, type PartId, type RackPart, type Vec2 } from './types'

export function uid(): PartId {
  return 'p' + Math.random().toString(36).slice(2, 10)
}

const MOUNT_R = 52
const COAX_R = 30   // この距離まで軸の中心に近づけたら「同軸に重ねる」意図とみなす

export class World {
  parts: Part[] = []
  private undoStack: string[] = []

  // 針の取り付け先タイブレーク用に、シミュレーションから軸の回転数を引けるようにする
  rpmFracOf: (id: PartId) => Fraction | null = () => null

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
      if ((p.kind === 'hand' || p.kind === 'cam' || p.kind === 'doll' || p.kind === 'dial') && p.mountId === id) {
        p.mountId = null
      }
    }
  }

  // pos と同じ位置にある軸たちが使っている層の集合
  layersAt(pos: Vec2, excludeId?: PartId): Set<number> {
    const s = new Set<number>()
    for (const a of this.axles()) {
      if (a.id === excludeId) continue
      if (dist(a.pos, pos) > 2) continue
      for (const l of layersOf(a)) s.add(l)
    }
    return s
  }

  // 同じ位置に重なっている軸パーツ(同軸スタック)
  coaxialAt(pos: Vec2): AxlePart[] {
    return this.axles().filter(a => dist(a.pos, pos) <= 2)
  }

  // part(のホイール数ぶんの連続した層)が入る空き層を探す。なければ null
  private freeLayerAt(pos: Vec2, part: AxlePart): number | null {
    const used = this.layersAt(pos, part.id)
    const span = wheelsOf(part).length
    for (let l = 0; l + span - 1 <= MAX_LAYER; l++) {
      let ok = true
      for (let i = 0; i < span; i++) {
        if (used.has(l + i)) { ok = false; break }
      }
      if (ok) return l
    }
    return null
  }

  // ドロップ・移動後のスナップ処理(噛み合い位置へ吸着 / 同軸に重ねる / 軸へ取り付け)
  snapPart(p: Part): void {
    if (isAxle(p)) this.snapAxle(p)
    else if (p.kind === 'rack') this.snapRack(p)
    else if (p.kind === 'hand' || p.kind === 'cam' || p.kind === 'doll' || p.kind === 'dial') this.tryMount(p)
  }

  private snapAxle(part: AxlePart): void {
    // ① 同軸スナップ: 別の軸の中心のすぐ近くに落としたら、同じ位置の空いている層に重ねる
    let coax: { d: number; pos: Vec2 } | null = null
    for (const other of this.axles()) {
      if (other.id === part.id) continue
      const d = dist(part.pos, other.pos)
      if (d < COAX_R && (!coax || d < coax.d)) coax = { d, pos: other.pos }
    }
    if (coax) {
      const layer = this.freeLayerAt(coax.pos, part)
      if (layer !== null) {
        part.pos = { ...coax.pos }
        part.layer = layer
        return
      }
    }

    // ② 噛み合いスナップ: 同じ層を少しだけ優先しつつ、層は自動で相手に合わせる
    let best: { score: number; apply: () => void } | null = null
    const myWheels = wheelsOf(part)

    for (const other of this.axles()) {
      if (other.id === part.id) continue
      const d = dist(part.pos, other.pos)
      if (d < 1) continue
      for (let wi = 0; wi < myWheels.length; wi++) {
        for (const w2 of wheelsOf(other)) {
          const target = myWheels[wi].radius + w2.radius
          const err = Math.abs(d - target)
          if (err >= SNAP_RANGE) continue
          const newLayer = w2.layer - wi
          if (newLayer < 0 || newLayer + myWheels.length - 1 > MAX_LAYER) continue
          const score = err + (newLayer === part.layer ? 0 : 3)
          if (!best || score < best.score) {
            const ux = (part.pos.x - other.pos.x) / d
            const uy = (part.pos.y - other.pos.y) / d
            const o = other.pos
            best = {
              score,
              apply: () => {
                part.pos = { x: o.x + ux * target, y: o.y + uy * target }
                part.layer = newLayer
              },
            }
          }
        }
      }
    }

    // ラックへのスナップ
    for (const r of this.parts) {
      if (r.kind !== 'rack') continue
      for (let wi = 0; wi < myWheels.length; wi++) {
        const desiredY = rackPitchY(r) - myWheels[wi].radius
        const err = Math.abs(part.pos.y - desiredY)
        const inX = Math.abs(part.pos.x - r.pos.x) < r.length / 2
        if (!inX || err >= SNAP_RANGE) continue
        const newLayer = r.layer - wi
        if (newLayer < 0 || newLayer + myWheels.length - 1 > MAX_LAYER) continue
        const score = err + (newLayer === part.layer ? 0 : 3)
        if (!best || score < best.score) {
          const x = part.pos.x
          best = {
            score,
            apply: () => {
              part.pos = { x, y: desiredY }
              part.layer = newLayer
            },
          }
        }
      }
    }

    best?.apply()
  }

  private snapRack(rack: RackPart): void {
    let best: { err: number; y: number; layer: number } | null = null
    for (const other of this.axles()) {
      const inX = Math.abs(other.pos.x - rack.pos.x) < rack.length / 2
      if (!inX) continue
      for (const w of wheelsOf(other)) {
        const desiredY = other.pos.y + w.radius + RACK_H / 2
        const err = Math.abs(rack.pos.y - desiredY)
        if (err < SNAP_RANGE && (!best || err < best.err)) {
          best = { err, y: desiredY, layer: w.layer }
        }
      }
    }
    if (best) {
      rack.pos = { x: rack.pos.x, y: best.y }
      rack.layer = best.layer
    }
  }

  // 針・カム・人形・文字盤を近くの相手に取り付ける
  tryMount(p: Part): void {
    if (p.kind === 'hand') {
      // 同軸スタックでは距離がほぼ同じになるため、
      // 「めあての速さ(秒1/1・分1/60・時1/720)で回っている軸」を最優先で選ぶ
      const target = HAND_TARGET[p.hand]
      let best: { d: number; id: PartId; match: boolean; layer: number } | null = null
      for (const a of this.axles()) {
        const d = dist(p.pos, a.pos)
        if (d >= MOUNT_R) continue
        const rf = this.rpmFracOf(a.id)
        const match = !!rf && feq(rf, target)
        const better = !best
          || (match && !best.match)
          || (match === best.match && d < best.d - 2)
          || (match === best.match && Math.abs(d - best.d) <= 2 && a.layer > best.layer)
        if (better) best = { d, id: a.id, match, layer: a.layer }
      }
      p.mountId = best ? best.id : null
    } else if (p.kind === 'cam' || p.kind === 'dial') {
      const range = p.kind === 'dial' ? MOUNT_R * 1.7 : MOUNT_R
      let best: { d: number; id: PartId; layer: number } | null = null
      for (const a of this.axles()) {
        const d = dist(p.pos, a.pos)
        if (d >= range) continue
        const better = !best || d < best.d - 2 || (Math.abs(d - best.d) <= 2 && a.layer > best.layer)
        if (better) best = { d, id: a.id, layer: a.layer }
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
      if (p.kind === 'hand' || p.kind === 'cam' || p.kind === 'dial') {
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
