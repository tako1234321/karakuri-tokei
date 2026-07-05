// 減速比を厳密に扱うための有理数(分数)演算。
// 浮動小数の誤差で 1/60 の判定を外さないために使う。

export interface Fraction { n: number; d: number }

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b)
  while (b) { const t = a % b; a = b; b = t }
  return a || 1
}

export function frac(n: number, d: number): Fraction {
  if (d < 0) { n = -n; d = -d }
  const g = gcd(n, d)
  return { n: n / g, d: d / g }
}

export function fmul(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.n, a.d * b.d)
}

export function feq(a: Fraction, b: Fraction): boolean {
  return a.n === b.n && a.d === b.d
}

export function fnum(a: Fraction): number {
  return a.n / a.d
}

export function fstr(a: Fraction): string {
  if (a.d === 1) return `${a.n}`
  return `${a.n}/${a.d}`
}
