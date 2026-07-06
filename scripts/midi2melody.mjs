// MIDIファイルからメロディライン(単旋律)を抽出して
// アプリの譜面データ形式 { n: 'F#5', d: 1.5 } に変換する開発用ツール。
// 使い方:
//   node scripts/midi2melody.mjs file.mid                 → トラック一覧と先頭の音
//   node scripts/midi2melody.mjs file.mid --track 1       → そのトラックの全メロディ
//   node scripts/midi2melody.mjs file.mid --track 1 --from 16 --beats 32 --emit
//        → 16拍目から32拍ぶんを melodies.ts 用のコードとして出力
//   --transpose N で半音単位の移調

import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const file = args[0]
const opt = (name, def) => {
  const i = args.indexOf('--' + name)
  return i >= 0 ? Number(args[i + 1]) : def
}
const has = name => args.includes('--' + name)

const buf = readFileSync(file)
let pos = 0
const u32 = () => { const v = buf.readUInt32BE(pos); pos += 4; return v }
const u16 = () => { const v = buf.readUInt16BE(pos); pos += 2; return v }
const u8 = () => buf[pos++]
const varlen = () => {
  let v = 0
  for (;;) {
    const b = u8()
    v = (v << 7) | (b & 0x7f)
    if (!(b & 0x80)) return v
  }
}

if (u32() !== 0x4d546864) throw new Error('MThd がありません')
u32() // header length
const format = u16()
const ntrks = u16()
const division = u16()
if (division & 0x8000) throw new Error('SMPTE分割は未対応')

const tracks = []
for (let t = 0; t < ntrks; t++) {
  if (u32() !== 0x4d54726b) throw new Error('MTrk がありません')
  const len = u32()
  const end = pos + len
  let tick = 0
  let status = 0
  const on = new Map()   // pitch → {start}
  const notes = []
  let name = ''
  while (pos < end) {
    tick += varlen()
    let b = u8()
    if (b < 0x80) { pos--; b = status } else { status = b }
    const type = b & 0xf0
    if (type === 0x90 || type === 0x80) {
      const pitch = u8()
      const vel = u8()
      if (type === 0x90 && vel > 0) {
        on.set(pitch, tick)
      } else {
        const start = on.get(pitch)
        if (start !== undefined) {
          notes.push({ start, end: tick, pitch })
          on.delete(pitch)
        }
      }
    } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) { pos += 2 }
    else if (type === 0xc0 || type === 0xd0) { pos += 1 }
    else if (b === 0xff) {
      const meta = u8()
      const mlen = varlen()
      if (meta === 0x03) name = buf.toString('latin1', pos, pos + mlen)
      pos += mlen
    } else if (b === 0xf0 || b === 0xf7) { pos += varlen() }
    else throw new Error(`不明なイベント 0x${b.toString(16)} @${pos}`)
  }
  notes.sort((a, b2) => a.start - b2.start || b2.pitch - a.pitch)
  tracks.push({ name, notes })
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const noteName = p => `${NAMES[p % 12]}${Math.floor(p / 12) - 1}`

// スカイライン: 同時に鳴る音は最高音だけ残す単旋律化
function skyline(notesIn, transpose = 0) {
  const floor = opt('floor', 0)   // このMIDIノート番号未満は伴奏とみなして捨てる
  const notes = floor ? notesIn.filter(n => n.pitch >= floor) : notesIn
  const CHORD = division / 8   // ほぼ同時とみなす幅
  const line = []
  for (const n of notes) {
    const last = line[line.length - 1]
    if (last && n.start - last.start < CHORD) {
      if (n.pitch > last.pitch) { last.pitch = n.pitch; last.end = n.end }
      continue
    }
    if (last && last.end > n.start) last.end = n.start   // 次の音が来たら切る
    line.push({ start: n.start, end: n.end, pitch: n.pitch + transpose })
  }
  return line
}

const q = v => Math.round(v * 8) / 8   // 1/8拍に量子化

function toMelody(line, fromBeat, beats) {
  const out = []
  const t0 = fromBeat * division
  const t1 = (fromBeat + beats) * division
  let cursor = t0
  for (const n of line) {
    if (n.end <= t0 || n.start >= t1) continue
    const s = Math.max(n.start, t0)
    const gap = q((s - cursor) / division)
    if (gap >= 0.25) out.push({ n: null, d: gap })
    const d = q((Math.min(n.end, t1) - s) / division)
    if (d >= 0.125) out.push({ n: noteName(n.pitch), d })
    cursor = s + d * division
  }
  return out
}

const trackArg = opt('track', -1)
if (trackArg < 0) {
  console.log(`format=${format} tracks=${ntrks} division=${division}`)
  tracks.forEach((t, i) => {
    if (t.notes.length === 0) { console.log(`[${i}] "${t.name}" (音なし)`); return }
    const line = skyline(t.notes)
    const pitches = line.map(n => n.pitch)
    const head = line.slice(0, 24).map(n =>
      `${noteName(n.pitch)}@${q(n.start / division)}`).join(' ')
    console.log(`[${i}] "${t.name}" notes=${t.notes.length} range=${noteName(Math.min(...pitches))}..${noteName(Math.max(...pitches))}`)
    console.log(`     ${head}`)
  })
} else {
  const line = skyline(tracks[trackArg].notes, opt('transpose', 0))
  const mel = toMelody(line, opt('from', 0), opt('beats', 64))
  if (has('emit')) {
    const rows = mel.map(m =>
      m.n ? `{ n: '${m.n}', d: ${m.d} },` : `{ n: null, d: ${m.d} },`)
    console.log(rows.join('\n'))
  } else {
    let acc = opt('from', 0)
    for (const m of mel) {
      console.log(`${String(acc).padStart(7)}  ${m.n ?? '(rest)'} : ${m.d}`)
      acc = q(acc + m.d)
    }
  }
}
