import { CAM_AMP, CAM_R0 } from '../core/cam'
import { maxRadius } from '../core/gear'
import { isAxle, type Part } from '../core/types'
import { DIAL_RADIUS } from '../data/dials'

// タップ判定などに使うパーツの見かけ半径
export function partHitRadius(p: Part): number {
  if (isAxle(p)) return maxRadius(p)
  if (p.kind === 'rack') return p.length / 2 + 8
  if (p.kind === 'dial') return DIAL_RADIUS
  if (p.kind === 'doll') return 64
  if (p.kind === 'cam') return CAM_R0 + CAM_AMP + 6
  return 44   // hand
}
