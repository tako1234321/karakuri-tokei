// PWA用アイコンをライブラリなしで生成する(歯車+時計の絵をピクセルで描く)
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// ---- PNGエンコーダ ----
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function writePng(path, size, pixelFn) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      // 2x2スーパーサンプリングでなめらかに
      let r = 0, g = 0, b = 0, a = 0
      for (const [dx, dy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const [pr, pg, pb, pa] = pixelFn(x + dx, y + dy, size)
        r += pr; g += pg; b += pb; a += pa
      }
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = r / 4; raw[o + 1] = g / 4; raw[o + 2] = b / 4; raw[o + 3] = a / 4
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
  writeFileSync(path, png)
  console.log('wrote', path, `${size}x${size}`)
}

// ---- アイコンの絵 ----
const BG = [247, 234, 215]
const BRASS = [217, 164, 65]
const BRASS_DARK = [154, 111, 34]
const DIAL = [255, 250, 240]
const DARK = [74, 58, 40]

function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function pixel(x, y, S) {
  const cx = S / 2, cy = S / 2
  const dx = x - cx, dy = y - cy
  const d = Math.hypot(dx, dy)
  const theta = Math.atan2(dy, dx)

  // 歯車の外形(12枚歯)
  const teeth = 12
  const pitch = (Math.PI * 2) / teeth
  const local = ((theta % pitch) + pitch) % pitch
  const isTooth = local < pitch * 0.42 || local > pitch * 0.58
  const gearOuter = S * (isTooth ? 0.40 : 0.345)

  // 時計の針(10時10分)
  const hourA = -Math.PI / 2 - (2 / 12) * Math.PI * 2
  const minA = -Math.PI / 2 + (10 / 60) * Math.PI * 2
  const hourLen = S * 0.15, minLen = S * 0.21
  const dHour = distToSeg(x, y, cx, cy, cx + Math.cos(hourA) * hourLen, cy + Math.sin(hourA) * hourLen)
  const dMin = distToSeg(x, y, cx, cy, cx + Math.cos(minA) * minLen, cy + Math.sin(minA) * minLen)

  if (d < S * 0.035) return [...DARK, 255]                 // 中心キャップ
  if (dHour < S * 0.028 || dMin < S * 0.022) return [...DARK, 255]  // 針
  if (d < S * 0.26) {
    // 文字盤+めもり
    const tickLocal = ((theta + Math.PI / 12) % (Math.PI / 6) + Math.PI / 6) % (Math.PI / 6)
    const isTick = Math.abs(tickLocal - Math.PI / 12) < 0.035 && d > S * 0.215
    return isTick ? [...DARK, 255] : [...DIAL, 255]
  }
  if (d < S * 0.28) return [...BRASS_DARK, 255]            // リム
  if (d < gearOuter) return [...BRASS, 255]                // 歯車
  if (d < gearOuter + S * 0.008) return [...BRASS_DARK, 255]
  return [...BG, 255]                                       // 背景(マスカブル用に全面)
}

writePng(join(outDir, 'icon-512.png'), 512, pixel)
writePng(join(outDir, 'icon-192.png'), 192, pixel)
writePng(join(outDir, 'apple-touch-icon.png'), 180, pixel)
