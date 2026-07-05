// シミュレーション時刻。倍速に対応し、正時(毎時0分)の通過を検出する。

export class SimClock {
  seconds: number      // 1日のなかの時刻(秒)
  simT = 0             // 連続シミュレーション秒(モーター角度の基準)
  speed = 1
  running = true
  onHour: (hour12: number) => void = () => {}

  constructor() {
    const d = new Date()
    this.seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
  }

  update(dtReal: number): void {
    if (!this.running) return
    const dt = dtReal * this.speed
    const prevHour = Math.floor(this.seconds / 3600)
    this.simT += dt
    this.seconds += dt
    if (this.seconds >= 86400) this.seconds -= 86400
    const hour = Math.floor(this.seconds / 3600)
    if (hour !== prevHour) {
      const h = hour % 12
      this.onHour(h === 0 ? 12 : h)
    }
  }

  hms(): { h: number; m: number; s: number } {
    const t = Math.floor(this.seconds)
    return { h: Math.floor(t / 3600) % 24, m: Math.floor(t / 60) % 60, s: t % 60 }
  }

  timeString(): string {
    const { h, m, s } = this.hms()
    const p = (v: number) => String(v).padStart(2, '0')
    return `${p(h)}:${p(m)}:${p(s)}`
  }
}
