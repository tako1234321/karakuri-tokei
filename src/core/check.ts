// 針の速さが正しいかの判定。
// 目標(1シミュ分あたりの回転数): 秒針=1、分針=1/60、時針=1/720

import { feq, fnum, frac, type Fraction } from './ratio'
import type { Simulation } from './simulation'
import type { HandKind, HandPart } from './types'

export const HAND_TARGET: Record<HandKind, Fraction> = {
  sec: frac(1, 1),
  min: frac(1, 60),
  hour: frac(1, 720),
}

export interface HandStatus {
  exists: boolean
  mounted: boolean
  driven: boolean
  ok: boolean
  reverse: boolean   // 速さは合っているが逆回り
  rpm: number
  rpmFrac: Fraction | null
}

export function handStatus(sim: Simulation, kind: HandKind): HandStatus {
  const hands = sim.world.parts.filter((p): p is HandPart => p.kind === 'hand' && p.hand === kind)
  let best: HandStatus = {
    exists: hands.length > 0, mounted: false, driven: false,
    ok: false, reverse: false, rpm: 0, rpmFrac: null,
  }
  const target = HAND_TARGET[kind]
  const targetN = fnum(target)

  for (const h of hands) {
    if (!h.mountId) continue
    const st = sim.axles.get(h.mountId)
    if (!st) continue
    const ok = st.rpmFrac
      ? feq(st.rpmFrac, target)
      : st.driven && !st.jammed && Math.abs(st.rpm - targetN) <= targetN * 0.012
    const reverse = !ok && (st.rpmFrac
      ? feq(frac(-st.rpmFrac.n, st.rpmFrac.d), target)
      : st.driven && Math.abs(-st.rpm - targetN) <= targetN * 0.012)
    const cur: HandStatus = {
      exists: true, mounted: true, driven: st.driven && !st.jammed,
      ok, reverse, rpm: st.rpm, rpmFrac: st.rpmFrac,
    }
    if (ok || (!best.ok && (cur.driven || !best.driven))) best = { ...cur, exists: true }
    if (ok) break
  }
  return best
}
