import type { EscapementPart } from './types'
import { frac, type Fraction } from './ratio'

export const GRAVITY = 9.81

// 振り子の周期 T = 2π√(L/g)
export function pendulumPeriod(lengthM: number): number {
  return 2 * Math.PI * Math.sqrt(lengthM / GRAVITY)
}

export interface EscState {
  wheelAngle: number   // ガンギ車の角度
  wheelOmega: number   // 平均角速度(rad/シミュ秒)
  pendAngle: number    // 振り子の振れ角(rad)
  ticks: number        // 累計チック数(音のトリガーに使う)
}

// 振り子のゼロクロス(半周期)ごとにガンギ車が半歯ずつ進む
export function escStateAt(t: number, p: EscapementPart): EscState {
  const T = pendulumPeriod(p.pendulumLength)
  const half = T / 2
  const n = Math.floor(t / half)
  const f = (t - n * half) / half
  const s = Math.min(1, f / 0.15)          // 歩進の「チッ」という素早い動き
  const step = Math.PI / p.escapeTeeth      // 半歯ぶんの角度
  return {
    wheelAngle: (n + s) * step,
    wheelOmega: step / half,
    pendAngle: 0.26 * Math.sin(2 * Math.PI * t / T),
    ticks: n,
  }
}

// 1シミュ分あたりの回転数 = 60 / (T × 歯数)
export function escRpm(p: EscapementPart): number {
  return 60 / (pendulumPeriod(p.pendulumLength) * p.escapeTeeth)
}

// 周期がほぼ2秒(標準の長さ)なら厳密な分数として扱う
export function escRpmFrac(p: EscapementPart): Fraction | null {
  const T = pendulumPeriod(p.pendulumLength)
  if (Math.abs(T - 2) < 0.02) return frac(30, p.escapeTeeth)
  return null
}
