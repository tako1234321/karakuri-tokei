// お手本シーン: 本当に時計として動く歯車の置き方。
// モーター(12歯・1回転/分)から、中心(0,0)の同軸3軸
// (秒 1/1・分 1/60・時 1/720)まで、実物の時計と同じ構造で組む。
// すべての噛み合い距離は厳密に計算済み(検証テスト済み)。

import type { App } from '../app'
import { pitchRadius } from '../core/gear'
import type { Part, Vec2 } from '../core/types'
import { uid } from '../core/world'

// 2円の交点(x が大きい方)
function circleX(c1: Vec2, r1: number, c2: Vec2, r2: number): Vec2 {
  const dx = c2.x - c1.x, dy = c2.y - c1.y
  const d = Math.hypot(dx, dy)
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a))
  const mx = c1.x + a * dx / d, my = c1.y + a * dy / d
  const p1 = { x: mx + h * dy / d, y: my - h * dx / d }
  const p2 = { x: mx - h * dy / d, y: my + h * dx / d }
  return p1.x > p2.x ? p1 : p2
}

export function sampleClockParts(): Part[] {
  const pr = pitchRadius
  const C: Vec2 = { x: 0, y: 0 }
  // X は 中心の8歯ピニオンに噛む(距離196、見やすい斜め上に)
  const X: Vec2 = { x: -196 * Math.cos(Math.PI / 3), y: 196 * Math.sin(Math.PI / 3) }
  // Y は X の小歯車に噛む(距離175)
  const Y: Vec2 = { x: X.x + 175 * Math.cos(Math.PI * 40 / 180), y: X.y + 175 * Math.sin(Math.PI * 40 / 180) }
  // I2 は「Yの小歯車(距離126)」と「中心の30歯(距離189)」の両方に噛む位置
  const I2: Vec2 = circleX(C, pr(24) + pr(30), Y, pr(12) + pr(24))

  const mk = <K extends Part['kind']>(kind: K, pos: Vec2, extra: object): Part =>
    ({ kind, id: uid(), pos: { ...pos }, ...extra }) as Part

  const secAxle = mk('gear', C, { wheels: [12, 8], layer: 0 })        // 秒軸: +1
  const minAxle = mk('gear', C, { wheels: [30, 15], layer: 3 })       // 分軸: +1/60
  const hourAxle = mk('gear', C, { wheels: [48], layer: 5 })          // 時軸: +1/720

  return [
    mk('motor', { x: -364, y: 0 }, { teeth: 12, rpm: 1, layer: 0 }),
    mk('gear', { x: -182, y: 0 }, { wheels: [40], layer: 0 }),        // アイドラ(向きを+に)
    secAxle,
    mk('gear', X, { wheels: [48, 10], layer: 1 }),                    // 1/6
    mk('gear', Y, { wheels: [40, 12], layer: 2 }),                    // ×1/4
    mk('gear', I2, { wheels: [24], layer: 3 }),                       // アイドラ
    minAxle,                                                          // ×24/30 → 1/60
    mk('gear', { x: 210, y: 0 }, { wheels: [45, 12], layer: 4 }),     // 日の裏車(15:45→12:48)
    hourAxle,
    mk('hand', C, { hand: 'sec', design: 'classic', mountId: secAxle.id, offset: 0 }),
    mk('hand', C, { hand: 'min', design: 'classic', mountId: minAxle.id, offset: 0 }),
    mk('hand', C, { hand: 'hour', design: 'classic', mountId: hourAxle.id, offset: 0 }),
    mk('dial', C, { style: 'classic', front: false, mountId: hourAxle.id }),
  ]
}

// からくりショーのお手本:
// からくりモーター(♪)は「毎正時のショーのあいだだけ」回る動力。
// 歯車→ダンサー/手をふる子、ラック&ピニオン→とびだすことり、
// カム→おじぎ人形、と4種類のからくりを全部つないだ見本。
export function sampleShowParts(): Part[] {
  const mk = <K extends Part['kind']>(kind: K, pos: Vec2, extra: object): Part =>
    ({ kind, id: uid(), pos: { ...pos }, ...extra }) as Part

  // からくりモーターの左=ダンサーの歯車、右=ラックのピニオン(直結で+方向に回り、ことりが飛び出す)
  const kara = mk('karakuriMotor', { x: -180, y: -20 }, { teeth: 12, rpm: 5, layer: 0 })
  const g1 = mk('gear', { x: -180 - pitchRadius(12) - pitchRadius(36), y: -20 }, { wheels: [36], layer: 0 })   // x=-348
  const g2 = mk('gear', { x: -180 + pitchRadius(12) + pitchRadius(12), y: -20 }, { wheels: [12], layer: 0 })   // x=-96
  const g3 = mk('gear', { x: -348, y: -20 - pitchRadius(36) - pitchRadius(24) }, { wheels: [24], layer: 0 })   // y=-230
  // ながさ160: となりのからくりモーターのピニオンには届かない長さにする
  const rack = mk('rack', { x: -96, y: -20 + pitchRadius(12) + 13 }, { length: 160, disp: 0, layer: 0 })       // y=35
  const cam = mk('cam', { x: -180, y: -20 }, { profile: 'snail', mountId: kara.id })

  return [
    kara, g1, g2, g3, rack, cam,
    mk('doll', { x: -348, y: -20 }, { doll: 'dancer', mountId: g1.id }),
    mk('doll', { x: -348, y: -230 }, { doll: 'waver', mountId: g3.id }),
    mk('doll', { x: -96, y: 35 }, { doll: 'cuckoo', mountId: rack.id }),
    mk('doll', { x: -180, y: -98 }, { doll: 'bower', mountId: cam.id }),
  ]
}

export function loadShowSample(app: App): void {
  app.world.pushUndo()
  app.world.parts = sampleShowParts()
  app.select(null)
  app.sim.update(0)
  app.camera.resetFront()
  app.toast('「♪ショー」をおしてみて!まいしょうじにも かってにうごくよ')
}

// お手本を読み込み、針を現在時刻に合わせる
export function loadSample(app: App): void {
  app.world.pushUndo()
  app.world.parts = sampleClockParts()
  app.select(null)
  app.sim.update(0)   // 角度伝播を一度回してから針を合わせる

  const sec = app.sim.clock.seconds
  for (const p of app.world.parts) {
    if (p.kind !== 'hand' || !p.mountId) continue
    const desired =
      p.hand === 'sec' ? 2 * Math.PI * ((sec % 60) / 60) :
      p.hand === 'min' ? 2 * Math.PI * (((sec / 60) % 60) / 60) :
      2 * Math.PI * (((sec / 3600) % 12) / 12)
    p.offset = desired - app.sim.axleAngle(p.mountId)
  }
  app.camera.resetFront()
  app.toast('うごく とけいの おてほんだよ!ななめから のぞいてみてね')
}
