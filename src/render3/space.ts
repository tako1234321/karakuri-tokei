// シミュレーション座標(y下向き・正角=画面時計回り)と
// three.js 座標(y上向き・右手系)の対応を一元管理する。
//   (x, y)sim → (x, −y, z)three、 回転 θ → rotation.z = −θ
// (y反転+角度反転=鏡映なので、伝播計算の位相式のまま歯と谷が噛み合う)

import { MAX_LAYER } from '../core/types'

export const GEAR_THICK = 8          // 歯車の厚み
export const LAYER_GAP = 14          // 層と層の間隔

export function zOfLayer(layer: number): number {
  return layer * LAYER_GAP
}

// 前面ゾーン(層の手前に付くパーツ)
export const FRONT_Z = zOfLayer(MAX_LAYER) + 22
export const CAM_Z = FRONT_Z + 4
export const DIAL_FRONT_Z = FRONT_Z + 16
export const DIAL_BACK_Z = -7   // 地板(-14)より手前・歯車(0)より奥
export const HAND_Z: Record<string, number> = {
  hour: FRONT_Z + 26,
  min: FRONT_Z + 31,
  sec: FRONT_Z + 36,
}
export const DOLL_Z = FRONT_Z + 14
export const PLATE_Z = -14           // 真鍮地板
