import type { Melody, Voice } from './melodies'

// Web Audio による音の合成。音源ファイルは使わない。
// iOSではユーザー操作(タップ)後でないと音が出せないため、
// タイトル画面の「はじめる」で unlock() を呼ぶ。

const SEMITONE: Record<string, number> = {
  C: -9, 'C#': -8, D: -7, 'D#': -6, E: -5, F: -4,
  'F#': -3, G: -2, 'G#': -1, A: 0, 'A#': 1, B: 2,
}

export function noteFreq(name: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(name)
  if (!m) return 440
  const semi = SEMITONE[m[1]] + (parseInt(m[2], 10) - 4) * 12
  return 440 * Math.pow(2, semi / 12)
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  enabled = true

  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state !== 'running') void this.ctx.resume()
  }

  setEnabled(on: boolean): void {
    this.enabled = on
    if (this.master) this.master.gain.value = on ? 0.5 : 0
  }

  private get ready(): boolean {
    return !!this.ctx && !!this.master && this.enabled
  }

  now(): number {
    return this.ctx ? this.ctx.currentTime : 0
  }

  // ベルの音(倍音を重ねて合成)
  bell(freq: number, when: number, dur = 2.0, vel = 0.4): void {
    if (!this.ready) return
    const ctx = this.ctx!
    const partials = [1, 2.0, 2.76, 4.07]
    const gains = [1, 0.5, 0.3, 0.15]
    for (let i = 0; i < partials.length; i++) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq * partials[i]
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, when)
      g.gain.exponentialRampToValueAtTime(vel * gains[i], when + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur * (1 - i * 0.15))
      osc.connect(g).connect(this.master!)
      osc.start(when)
      osc.stop(when + dur + 0.1)
    }
  }

  // 笛の音(サイン波+ビブラート)
  flute(freq: number, when: number, dur = 1.0, vel = 0.35): void {
    if (!this.ready) return
    const ctx = this.ctx!
    const end = when + Math.max(0.25, dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(vel, when + 0.06)
    g.gain.setValueAtTime(vel, Math.max(when + 0.06, end - 0.12))
    g.gain.exponentialRampToValueAtTime(0.0001, end)
    g.connect(this.master!)

    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    // ビブラート(少し遅れてかかる)
    const vib = ctx.createOscillator()
    vib.frequency.value = 5.5
    const vg = ctx.createGain()
    vg.gain.setValueAtTime(0, when)
    vg.gain.linearRampToValueAtTime(freq * 0.008, when + 0.3)
    vib.connect(vg).connect(o.frequency)
    // かすかな倍音
    const h = ctx.createOscillator()
    h.type = 'sine'
    h.frequency.value = freq * 2
    const hg = ctx.createGain()
    hg.gain.value = 0.12
    h.connect(hg).connect(g)
    o.connect(g)
    o.start(when); o.stop(end + 0.05)
    h.start(when); h.stop(end + 0.05)
    vib.start(when); vib.stop(end + 0.05)
  }

  // 弦の音(デチューンした2本のノコギリ波+ローパス)
  strings(freq: number, when: number, dur = 1.0, vel = 0.3): void {
    if (!this.ready) return
    const ctx = this.ctx!
    const end = when + Math.max(0.3, dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(vel, when + 0.13)
    g.gain.setValueAtTime(vel, Math.max(when + 0.13, end - 0.2))
    g.gain.exponentialRampToValueAtTime(0.0001, end + 0.1)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = Math.min(5200, freq * 4.5)
    lp.Q.value = 0.4
    g.connect(lp).connect(this.master!)
    for (const cents of [-5, 5]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = freq
      o.detune.value = cents
      const og = ctx.createGain()
      og.gain.value = 0.5
      o.connect(og).connect(g)
      o.start(when)
      o.stop(end + 0.15)
    }
  }

  private playNote(voice: Voice, freq: number, when: number, dur: number, vel: number): void {
    if (voice === 'flute') this.flute(freq, when, dur, vel)
    else if (voice === 'strings') this.strings(freq, when, dur, vel)
    else this.bell(freq, when, Math.min(2.4, 0.5 + dur * 1.6), vel)
  }

  // 時打ちの「ボーン」
  strike(when: number): void {
    this.bell(164.81, when, 2.8, 0.7)   // E3
  }

  // 振り子の「チッ」
  tick(): void {
    if (!this.ready) return
    const ctx = this.ctx!
    if (!this.noiseBuf) {
      const len = Math.floor(ctx.sampleRate * 0.04)
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d = this.noiseBuf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
    }
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3400
    bp.Q.value = 2.5
    const g = ctx.createGain()
    g.gain.value = 0.25
    src.connect(bp).connect(g).connect(this.master!)
    src.start()
  }

  // ことりの「カッコー」
  cuckoo(): void {
    if (!this.ready) return
    const ctx = this.ctx!
    const t0 = ctx.currentTime + 0.02
    const notes: [number, number, number][] = [[740, t0, 0.22], [587, t0 + 0.28, 0.34]]
    for (const [f, when, dur] of notes) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = f
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, when)
      g.gain.exponentialRampToValueAtTime(0.35, when + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
      osc.connect(g).connect(this.master!)
      osc.start(when)
      osc.stop(when + dur + 0.05)
    }
  }

  // メロディ+時打ちを予約再生し、全体の長さ(秒)を返す
  playChime(melody: Melody, strikes: number): number {
    const beat = 60 / melody.bpm
    let total = 0
    for (const n of melody.notes) total += n.d * beat
    const strikeGap = 1.4
    const strikesStart = total + 0.6
    const fullDur = strikesStart + strikes * strikeGap + 1.5

    if (this.ready) {
      const t0 = this.ctx!.currentTime + 0.08
      const voice = melody.voice ?? 'bell'
      let acc = 0
      for (const n of melody.notes) {
        if (n.n) this.playNote(voice, noteFreq(n.n), t0 + acc, n.d * beat, voice === 'bell' ? 0.38 : 0.32)
        acc += n.d * beat
      }
      // 伴奏(小さめのベル)
      if (melody.accomp) {
        let acc2 = 0
        for (const n of melody.accomp) {
          if (n.n) this.bell(noteFreq(n.n), t0 + acc2, Math.min(2.6, 0.7 + n.d * beat * 1.4), 0.15)
          acc2 += n.d * beat
        }
      }
      for (let i = 0; i < strikes; i++) {
        this.strike(t0 + strikesStart + i * strikeGap)
      }
    }
    return fullDur
  }

  // ミッション達成のファンファーレ
  fanfare(): void {
    if (!this.ready) return
    const t0 = this.ctx!.currentTime + 0.03
    const seq = ['C5', 'E5', 'G5', 'C6']
    seq.forEach((n, i) => this.bell(noteFreq(n), t0 + i * 0.13, 1.2, 0.3))
  }
}
