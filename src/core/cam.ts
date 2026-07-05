// カムのプロファイル: 角度θに対する持ち上げ量 f(θ) ∈ [0,1]

export const CAM_R0 = 24    // 最小半径
export const CAM_AMP = 22   // 持ち上げ量の最大

export interface CamDef {
  key: string
  label: string
  f: (theta: number) => number
}

function norm(theta: number): number {
  const t = theta % (2 * Math.PI)
  return t < 0 ? t + 2 * Math.PI : t
}

export const CAM_DEFS: CamDef[] = [
  {
    key: 'egg', label: 'たまごカム',
    f: t => (1 - Math.cos(norm(t))) / 2,   // なめらかに上下
  },
  {
    key: 'snail', label: 'かたつむりカム',
    f: t => {
      const x = norm(t) / (2 * Math.PI)    // ゆっくり上がって…ストンと落ちる
      return x > 0.96 ? (1 - x) / 0.04 : x / 0.96
    },
  },
  {
    key: 'heart', label: 'ハートカム',
    f: t => {
      const x = norm(t) / (2 * Math.PI)    // 一定の速さで往復
      return x < 0.5 ? x * 2 : 2 - x * 2
    },
  },
]

export function camDef(key: string): CamDef {
  return CAM_DEFS.find(c => c.key === key) ?? CAM_DEFS[0]
}

// カムの輪郭(ローカル角度 phi に対する半径)
export function camRadius(key: string, phi: number): number {
  return CAM_R0 + CAM_AMP * camDef(key).f(phi)
}

// 軸角度 theta のとき、真上(-90°)方向に触れているフォロワーの持ち上げ量 0..1
export function camFollower(key: string, theta: number): number {
  return camDef(key).f(-Math.PI / 2 - theta)
}
