import * as THREE from 'three'

// 共有マテリアル。個別の透明度が要る場合のみ clone する。

const std = (color: number, metalness: number, roughness: number) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness })

// 真鍮のバリエーション(2Dの GEAR_COLORS を継承した暖色系、深みを出すためやや暗め)
export const BRASS: THREE.MeshStandardMaterial[] = [
  std(0xbd8a2e, 0.9, 0.34),
  std(0xa8743a, 0.88, 0.4),
  std(0xa5643f, 0.85, 0.44),
  std(0x9c722c, 0.9, 0.37),
  std(0xb8860b, 0.92, 0.32),
  std(0xab8439, 0.88, 0.38),
]

export function brassFor(teeth: number): THREE.MeshStandardMaterial {
  return BRASS[teeth % BRASS.length]
}

export const brassLight = std(0xe6c26a, 0.9, 0.3)     // 2段ギアの小さい方
export const steel = std(0x9aa4b0, 0.9, 0.28)
export const darkSteel = std(0x4a4f58, 0.85, 0.4)
export const axleDark = std(0x4a3520, 0.6, 0.5)
export const motorBlue = std(0x5b8dd9, 0.25, 0.55)
export const motorPink = std(0xe2679a, 0.25, 0.55)
export const pinionWhite = std(0xdfe8f4, 0.7, 0.35)
export const pinionPinkish = std(0xf7dbe7, 0.7, 0.35)
export const wood = std(0x9a6b3f, 0.05, 0.85)
export const woodDark = std(0x6e4520, 0.05, 0.85)
export const brassPlate = std(0xc9a869, 0.85, 0.45)
export const camOrange = std(0xe08838, 0.55, 0.5)
export const followerGray = std(0x7a6a52, 0.5, 0.6)
export const bobGold = std(0xc9a227, 0.92, 0.28)
export const anchorRed = std(0xa04a3a, 0.6, 0.5)
export const handRed = std(0xd64545, 0.5, 0.4)
export const handSteel = std(0x2b3a55, 0.75, 0.35)

// ドラッグ中のゴースト表示用
export const ghostMat = new THREE.MeshStandardMaterial({
  color: 0xd9a441, metalness: 0.5, roughness: 0.5,
  transparent: true, opacity: 0.45, depthWrite: false,
})

// ヒット判定用(見えないが Raycaster には当たる)
export const hitMat = new THREE.MeshBasicMaterial({
  transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
})
