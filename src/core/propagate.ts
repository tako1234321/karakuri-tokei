// 回転の伝播: 軸をノード、噛み合いをエッジとするグラフを作り、
// 動力(モーター/振り子/からくりモーター)から角度を伝える。
// 矛盾(奇数ループや動力どうしのぶつかり)はジャムとして検出する。

import { MESH_EPS, dist, rackPitchY, wheelsOf } from './gear'
import { MODULE, isAxle, type AxleState, type PartId } from './types'
import { fmul, frac, type Fraction } from './ratio'
import type { World } from './world'

export interface MeshEdge { a: PartId; ai: number; b: PartId; bi: number }
export interface RackMesh { gearId: PartId; wheelIndex: number; rackId: PartId }

export interface Graph {
  meshes: MeshEdge[]
  racks: RackMesh[]
  interfering: Set<PartId>
}

export function buildGraph(world: World): Graph {
  const axles = world.axles()
  const meshes: MeshEdge[] = []
  const interfering = new Set<PartId>()

  for (let i = 0; i < axles.length; i++) {
    for (let j = i + 1; j < axles.length; j++) {
      const A = axles[i], B = axles[j]
      const d = dist(A.pos, B.pos)
      const wa = wheelsOf(A), wb = wheelsOf(B)
      let meshed = false
      for (let ai = 0; ai < wa.length; ai++) {
        for (let bi = 0; bi < wb.length; bi++) {
          if (wa[ai].layer !== wb[bi].layer) continue   // 同じ層のホイール同士だけ噛み合う
          const target = wa[ai].radius + wb[bi].radius
          if (Math.abs(d - target) < MESH_EPS) {
            meshes.push({ a: A.id, ai, b: B.id, bi })
            meshed = true
          }
        }
      }
      if (!meshed) {
        // 同じ層で「あとちょっとで噛み合うのに近すぎて潰れている」ときだけ警告する。
        // (別の層どうしの重なりは実物の時計と同じく高さ違いの配置なので許す)
        for (const w1 of wa) {
          for (const w2 of wb) {
            if (w1.layer !== w2.layer) continue
            const target = w1.radius + w2.radius
            if (d < target - MESH_EPS && d > target - MODULE * 5.5) {
              interfering.add(A.id)
              interfering.add(B.id)
            }
          }
        }
      }
    }
  }

  const racks: RackMesh[] = []
  for (const r of world.parts) {
    if (r.kind !== 'rack') continue
    for (const a of axles) {
      const inX = Math.abs(a.pos.x - r.pos.x) < r.length / 2
      if (!inX || a.pos.y > r.pos.y) continue
      const wa = wheelsOf(a)
      for (let wi = 0; wi < wa.length; wi++) {
        if (wa[wi].layer !== r.layer) continue
        if (Math.abs(rackPitchY(r) - a.pos.y - wa[wi].radius) < MESH_EPS) {
          racks.push({ gearId: a.id, wheelIndex: wi, rackId: r.id })
        }
      }
    }
  }

  return { meshes, racks, interfering }
}

export interface DriverState {
  angle: number
  omega: number
  rpm: number
  rpmFrac: Fraction | null
}

export function assignAxles(
  world: World,
  graph: Graph,
  drivers: Map<PartId, DriverState>,
  prev: Map<PartId, AxleState>,
): Map<PartId, AxleState> {
  const parts = new Map(world.axles().map(p => [p.id, p] as const))
  const res = new Map<PartId, AxleState>()
  for (const [id] of parts) {
    const pv = prev.get(id)
    res.set(id, { angle: pv?.angle ?? 0, omega: 0, driven: false, jammed: false, rpm: 0, rpmFrac: null })
  }

  interface Adj { other: PartId; myWheel: number; otherWheel: number }
  const adj = new Map<PartId, Adj[]>()
  const push = (from: PartId, e: Adj) => {
    const list = adj.get(from) ?? []
    list.push(e)
    adj.set(from, list)
  }
  for (const m of graph.meshes) {
    push(m.a, { other: m.b, myWheel: m.ai, otherWheel: m.bi })
    push(m.b, { other: m.a, myWheel: m.bi, otherWheel: m.ai })
  }

  const owner = new Map<PartId, PartId>()

  const jamComponent = (startId: PartId) => {
    const q = [startId]
    const seen = new Set<PartId>([startId])
    while (q.length) {
      const id = q.shift()!
      const st = res.get(id)
      if (st) {
        st.jammed = true
        st.omega = 0
        st.rpm = 0
        st.rpmFrac = null
        st.angle = prev.get(id)?.angle ?? st.angle   // その場で固まる
      }
      for (const e of adj.get(id) ?? []) {
        if (!seen.has(e.other)) { seen.add(e.other); q.push(e.other) }
      }
    }
  }

  for (const [did, dstate] of drivers) {
    if (!parts.has(did)) continue
    if (owner.has(did)) { jamComponent(did); continue }   // 動力どうしがぶつかった

    owner.set(did, did)
    const dst = res.get(did)!
    dst.angle = dstate.angle
    dst.omega = dstate.omega
    dst.driven = true
    dst.rpm = dstate.rpm
    dst.rpmFrac = dstate.rpmFrac

    let jam = false
    const q: PartId[] = [did]
    while (q.length) {
      const aId = q.shift()!
      const aPart = parts.get(aId)!
      const aSt = res.get(aId)!
      for (const e of adj.get(aId) ?? []) {
        const bPart = parts.get(e.other)!
        const bSt = res.get(e.other)!
        const za = wheelsOf(aPart)[e.myWheel].teeth
        const zb = wheelsOf(bPart)[e.otherWheel].teeth
        const ratio = za / zb
        const alpha = Math.atan2(bPart.pos.y - aPart.pos.y, bPart.pos.x - aPart.pos.x)
        // 歯と谷がきちんと向き合う位相になるように角度を決める
        const angle = (1 + ratio) * alpha + Math.PI + Math.PI / zb - ratio * aSt.angle
        const omega = -ratio * aSt.omega
        if (owner.has(e.other)) {
          const consistent =
            owner.get(e.other) === did &&
            Math.abs(bSt.omega - omega) < 1e-9 * (1 + Math.abs(omega))
          if (!consistent) jam = true
          continue
        }
        owner.set(e.other, did)
        bSt.angle = angle
        bSt.omega = omega
        bSt.driven = true
        bSt.rpm = -ratio * aSt.rpm
        bSt.rpmFrac = aSt.rpmFrac ? fmul(aSt.rpmFrac, frac(-za, zb)) : null
        q.push(e.other)
      }
    }
    if (jam) jamComponent(did)
  }

  return res
}

// このパーツと噛み合っている相手がいるか(ミッション判定などに使う)
export function meshedWith(graph: Graph, id: PartId): PartId[] {
  const out: PartId[] = []
  for (const m of graph.meshes) {
    if (m.a === id) out.push(m.b)
    if (m.b === id) out.push(m.a)
  }
  return out
}
