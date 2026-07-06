import type { Fraction } from './ratio'

export type PartId = string

export interface Vec2 { x: number; y: number }

// 歯1枚あたりの大きさ(モジュール)。全歯車で統一する。
export const MODULE = 7

// 奥行きレイヤー(層)。ホイールは 0..MAX_LAYER のどこかの層に存在し、
// 同じ層のホイール同士だけが噛み合う。同じ位置でも層が違えば
// 別の軸として共存できる(=同軸に秒針・分針・時針を重ねられる)。
export const MAX_LAYER = 7

export type HandKind = 'sec' | 'min' | 'hour'

export interface MotorPart {
  kind: 'motor'; id: PartId; pos: Vec2
  teeth: number   // 出力ピニオンの歯数
  rpm: number     // 1分あたりの回転数(標準は1)
  layer: number
}

export interface GearPart {
  kind: 'gear'; id: PartId; pos: Vec2
  wheels: number[]  // 歯数のリスト。要素2つで同軸2段ギア(大→小)
  layer: number     // wheels[i] は層 layer+i に存在する
}

export interface EscapementPart {
  kind: 'escapement'; id: PartId; pos: Vec2
  escapeTeeth: number       // ガンギ車の歯数
  pendulumLength: number    // 振り子の長さ(メートル)
  layer: number
}

export interface KarakuriMotorPart {
  kind: 'karakuriMotor'; id: PartId; pos: Vec2
  teeth: number
  rpm: number   // ショー中の回転数(1分あたり)
  layer: number
}

export interface HandPart {
  kind: 'hand'; id: PartId; pos: Vec2
  hand: HandKind
  design: string
  mountId: PartId | null   // 取り付いている軸パーツ
  offset: number           // 時刻合わせ用の角度オフセット
}

export interface RackPart {
  kind: 'rack'; id: PartId; pos: Vec2
  length: number
  disp: number   // スライド変位(-travel/2 .. +travel/2)
  layer: number
  // 端っこのマイクロスイッチ: 端に当たったとき、駆動しているからくりモーターを
  // 反転(reverse)または停止(stop)させる。省略時は なし
  endStop?: 'none' | 'stop' | 'reverse'
}

export interface CamPart {
  kind: 'cam'; id: PartId; pos: Vec2
  profile: string
  mountId: PartId | null
}

export interface DollPart {
  kind: 'doll'; id: PartId; pos: Vec2
  doll: string
  mountId: PartId | null   // 回転人形→軸 / 直動人形→カムかラック
}

export interface DialPart {
  kind: 'dial'; id: PartId; pos: Vec2
  style: string
  front?: boolean   // true: 歯車より前に描く(本物の時計ふう)/ 省略時: 背面(スケルトンふう)
  mountId?: PartId | null   // 軸パーツに取り付けると中心がぴったり合い、追従する
}

export type Part =
  | MotorPart | GearPart | EscapementPart | KarakuriMotorPart
  | HandPart | RackPart | CamPart | DollPart | DialPart

export type AxlePart = MotorPart | GearPart | EscapementPart | KarakuriMotorPart

export function isAxle(p: Part): p is AxlePart {
  return p.kind === 'motor' || p.kind === 'gear' || p.kind === 'escapement' || p.kind === 'karakuriMotor'
}

export interface Wheel { teeth: number; radius: number; layer: number }

// 各軸の毎フレームの状態(伝播計算の結果)
export interface AxleState {
  angle: number
  omega: number          // rad / シミュ秒
  driven: boolean        // 動力につながっているか
  jammed: boolean        // 矛盾して動けない
  rpm: number            // 1シミュ分あたりの回転数(数値)
  rpmFrac: Fraction | null  // 動力が有理数のときの厳密な回転数
  driver: PartId | null  // この軸を動かしている動力パーツ
}

export interface SaveData {
  version: 1
  name: string
  createdAt: string
  parts: Part[]
  melody: string
}
