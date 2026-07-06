import { dollDef } from '../data/dolls'
import { camFollower } from './cam'
import { SimClock } from './clock'
import { escRpm, escRpmFrac, escStateAt } from './escapement'
import { rackTravel, wheelsOf } from './gear'
import { assignAxles, buildGraph, type DriverState, type Graph } from './propagate'
import { frac } from './ratio'
import { isAxle, type AxleState, type DollPart, type HandPart, type PartId } from './types'
import type { World } from './world'

export class Simulation {
  world: World
  clock = new SimClock()
  graph: Graph = { meshes: [], racks: [], interfering: new Set() }
  axles = new Map<PartId, AxleState>()
  showTimer = 0
  showDuration = 0
  private karakuriAngles = new Map<PartId, number>()
  private karakuriTest = new Map<PartId, number>()
  private prevAngles = new Map<PartId, number>()
  private cuckooOut = new Map<PartId, boolean>()
  private lastTicks = new Map<PartId, number>()
  onTick: () => void = () => {}
  onCuckoo: () => void = () => {}

  constructor(world: World) {
    this.world = world
  }

  update(dtReal: number): void {
    this.clock.update(dtReal)
    if (this.showTimer > 0) this.showTimer = Math.max(0, this.showTimer - dtReal)

    const drivers = new Map<PartId, DriverState>()
    for (const p of this.world.parts) {
      if (p.kind === 'motor') {
        drivers.set(p.id, {
          angle: 2 * Math.PI * p.rpm * this.clock.simT / 60,
          omega: 2 * Math.PI * p.rpm / 60,
          rpm: p.rpm,
          rpmFrac: frac(p.rpm, 1),
        })
      } else if (p.kind === 'escapement') {
        const st = escStateAt(this.clock.simT, p)
        drivers.set(p.id, {
          angle: st.wheelAngle,
          omega: st.wheelOmega,
          rpm: escRpm(p),
          rpmFrac: escRpmFrac(p),
        })
        const last = this.lastTicks.get(p.id)
        if (last !== undefined && st.ticks !== last && this.clock.speed <= 2 && this.clock.running) {
          this.onTick()
        }
        this.lastTicks.set(p.id, st.ticks)
      } else if (p.kind === 'karakuriMotor') {
        const test = this.karakuriTest.get(p.id) ?? 0
        const active = this.showTimer > 0 || test > 0
        if (test > 0) this.karakuriTest.set(p.id, Math.max(0, test - dtReal))
        let a = this.karakuriAngles.get(p.id) ?? 0
        if (active) a += 2 * Math.PI * p.rpm / 60 * dtReal   // ショーは実時間で動く
        this.karakuriAngles.set(p.id, a)
        drivers.set(p.id, { angle: a, omega: active ? 2 * Math.PI * p.rpm / 60 : 0, rpm: 0, rpmFrac: null })
      }
    }

    this.graph = buildGraph(this.world)
    this.axles = assignAxles(this.world, this.graph, drivers, this.axles)

    // ラック&ピニオン: 歯車の角度の増分から直動を積分
    for (const rm of this.graph.racks) {
      const gear = this.world.byId(rm.gearId)
      const st = this.axles.get(rm.gearId)
      const rack = this.world.byId(rm.rackId)
      if (!gear || !st || !rack || rack.kind !== 'rack' || !isAxle(gear) || st.jammed) continue
      const r = wheelsOf(gear)[rm.wheelIndex].radius
      const prevA = this.prevAngles.get(rm.gearId)
      if (prevA !== undefined) {
        const dTheta = st.angle - prevA
        if (Math.abs(dTheta) < 1) {   // 配置変更時の角度ジャンプは無視
          const tr = rackTravel(rack) / 2
          rack.disp = Math.max(-tr, Math.min(tr, rack.disp - dTheta * r))
        }
      }
    }
    for (const [id, st] of this.axles) this.prevAngles.set(id, st.angle)

    // ラックのばね戻り: 動力が止まっている(または外れている)ラックは
    // ゆっくり元の位置へ戻る(実物のばね仕掛けと同じ。ことりが引っ込む動き)
    for (const p of this.world.parts) {
      if (p.kind !== 'rack' || p.disp === 0) continue
      const driven = this.graph.racks.some(rm => {
        if (rm.rackId !== p.id) return false
        const st = this.axles.get(rm.gearId)
        return !!st && !st.jammed && Math.abs(st.omega) > 1e-6
      })
      if (!driven) {
        p.disp *= Math.max(0, 1 - dtReal * 2.5)
        if (Math.abs(p.disp) < 0.3) p.disp = 0
      }
    }

    this.world.syncMounts()

    // ことりが飛び出した瞬間 → 鳴き声
    for (const p of this.world.parts) {
      if (p.kind !== 'doll' || p.doll !== 'cuckoo') continue
      const t = this.dollInput(p)
      const was = this.cuckooOut.get(p.id) ?? false
      const out = t > 0.85
      if (out && !was) this.onCuckoo()
      this.cuckooOut.set(p.id, out)
    }
  }

  axleAngle(id: PartId | null): number {
    if (!id) return 0
    return this.axles.get(id)?.angle ?? 0
  }

  // 人形への入力: 回転人形→角度(rad) / 直動人形→0..1
  dollInput(d: DollPart): number {
    const m = d.mountId ? this.world.byId(d.mountId) : undefined
    if (!m) return 0
    const def = dollDef(d.doll)
    if (def.input === 'rotate') return this.axleAngle(m.id)
    if (m.kind === 'cam') return camFollower(m.profile, this.axleAngle(m.mountId))
    if (m.kind === 'rack') return (m.disp + rackTravel(m) / 2) / rackTravel(m)
    return 0
  }

  handAngle(h: HandPart): number {
    return this.axleAngle(h.mountId) + h.offset
  }

  startShow(durationSec: number): void {
    this.showTimer = durationSec
    this.showDuration = durationSec
  }

  testKarakuri(id: PartId, sec = 6): void {
    this.karakuriTest.set(id, sec)
  }
}
