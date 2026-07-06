// 本物の3Dで作ったからくり人形たち(球・円柱・円錐のプリミティブ構成)。
// 原点=取り付け点(足もと)。人形は +z(画面手前)を向いている。
// input: 回転人形は角度(rad)、直動人形は 0..1

import * as THREE from 'three'

export interface Doll3 {
  group: THREE.Group
  update(input: number, time: number): void
}

const std = (color: number, roughness = 0.65) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 })

// 共有マテリアル(disposeしない)
const M = {
  skin: std(0xffe0c2),
  pink: std(0xe26fa0),
  blue: std(0x5b8dd9),
  green: std(0x4a6a4f),
  red: std(0xb04a4a),
  wood: std(0x9a6b3f),
  woodDark: std(0x6e4520),
  white: std(0xf2f2e8),
  grayWhite: std(0xd8d8c8),
  dark: std(0x333333, 0.5),
  gold: std(0xf4c542, 0.4),
  orange: std(0xf4a83c, 0.5),
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(geo, mat)
}

// 顔つきの頭(目としてちいさな球を2つ)
function head(r: number): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new THREE.SphereGeometry(r, 20, 14), M.skin))
  for (const sx of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(r * 0.11, 8, 6), M.dark)
    eye.position.set(sx * r * 0.35, r * 0.08, r * 0.88)
    g.add(eye)
  }
  return g
}

function pedestal(r: number): THREE.Mesh {
  const p = mesh(new THREE.CylinderGeometry(r, r + 3, 7, 20), M.woodDark)
  p.position.y = 3.5
  return p
}

// くるくるダンサー(本当に3Dで回る!)
function dancer(): Doll3 {
  const group = new THREE.Group()
  group.add(pedestal(26))
  const spin = new THREE.Group()
  spin.position.y = 7
  group.add(spin)

  const skirt = mesh(new THREE.ConeGeometry(25, 52, 22), M.pink)
  skirt.position.y = 26
  const waist = mesh(new THREE.SphereGeometry(8, 14, 10), M.pink)
  waist.position.y = 54
  // 両うでを上げたポーズ
  for (const sx of [-1, 1]) {
    const arm = mesh(new THREE.CylinderGeometry(2.6, 2.6, 26, 8), M.skin)
    arm.position.set(sx * 13, 68, 0)
    arm.rotation.z = sx * 0.7
    const hand = mesh(new THREE.SphereGeometry(3.5, 8, 6), M.skin)
    hand.position.set(sx * 21, 79, 0)
    spin.add(arm, hand)
  }
  const hd = head(14)
  hd.position.y = 72
  const bun = mesh(new THREE.SphereGeometry(5, 10, 8), M.gold)
  bun.position.y = 88
  spin.add(skirt, waist, hd, bun)

  return {
    group,
    update(input) {
      spin.rotation.y = -input
    },
  }
}

// てをふるこ
function waver(): Doll3 {
  const group = new THREE.Group()
  group.add(pedestal(24))

  const body = mesh(new THREE.CylinderGeometry(10, 17, 42, 16), M.blue)
  body.position.y = 7 + 21
  const hd = head(14)
  hd.position.y = 64
  // ひだりうで(そえたまま)
  const armL = mesh(new THREE.CylinderGeometry(2.8, 2.8, 22, 8), M.skin)
  armL.position.set(-14, 40, 0)
  armL.rotation.z = 0.5
  group.add(body, hd, armL)

  // みぎうで(ふる!)かたを支点に回る
  const shoulder = new THREE.Group()
  shoulder.position.set(13, 48, 0)
  const armR = mesh(new THREE.CylinderGeometry(2.8, 2.8, 24, 8), M.skin)
  armR.position.y = 12
  const hand = mesh(new THREE.SphereGeometry(4.5, 10, 8), M.skin)
  hand.position.y = 26
  shoulder.add(armR, hand)
  group.add(shoulder)

  return {
    group,
    update(input) {
      shoulder.rotation.z = -(0.9 + Math.sin(input) * 0.6)
    },
  }
}

// おじぎにんぎょう(こしから上がたおれる)
function bower(): Doll3 {
  const group = new THREE.Group()
  group.add(pedestal(24))

  const hakama = mesh(new THREE.CylinderGeometry(13, 17, 26, 14), M.green)
  hakama.position.y = 7 + 13
  group.add(hakama)

  const hip = new THREE.Group()
  hip.position.y = 33
  const torso = mesh(new THREE.CylinderGeometry(9, 13, 30, 14), M.red)
  torso.position.y = 15
  for (const sx of [-1, 1]) {
    const arm = mesh(new THREE.CylinderGeometry(2.6, 2.6, 20, 8), M.skin)
    arm.position.set(sx * 13, 14, 0)
    arm.rotation.z = sx * 0.35
    hip.add(arm)
  }
  const hd = head(12)
  hd.position.y = 40
  const hat = mesh(new THREE.SphereGeometry(5, 10, 8), M.dark)
  hat.position.y = 51
  hip.add(torso, hd, hat)
  group.add(hip)

  return {
    group,
    update(input) {
      hip.rotation.x = Math.min(1, Math.max(0, input)) * 0.95
    },
  }
}

// とびだすことり(とびらが3Dでひらいて、ことりが手前にとびだす)
function cuckoo(): Doll3 {
  const group = new THREE.Group()

  // 小屋
  const house = mesh(new THREE.BoxGeometry(64, 54, 40), M.wood)
  house.position.y = 27
  const roof = mesh(new THREE.ConeGeometry(48, 28, 4), M.woodDark)
  roof.rotation.y = Math.PI / 4
  roof.position.y = 54 + 14
  // 出入り口(くらい奥)
  const hole = mesh(new THREE.CircleGeometry(15, 20), M.dark)
  hole.position.set(0, 32, 20.2)
  group.add(house, roof, hole)

  // とびら(左右にひらく)
  const doorL = new THREE.Group()
  doorL.position.set(-16, 32, 21)
  const dl = mesh(new THREE.BoxGeometry(16, 32, 2), std(0xc98d5a))
  dl.position.x = 8
  doorL.add(dl)
  const doorR = new THREE.Group()
  doorR.position.set(16, 32, 21)
  const dr = mesh(new THREE.BoxGeometry(16, 32, 2), std(0xc98d5a))
  dr.position.x = -8
  doorR.add(dr)
  group.add(doorL, doorR)

  // ことり
  const bird = new THREE.Group()
  bird.position.set(0, 30, 6)
  const body = mesh(new THREE.SphereGeometry(10, 16, 12), M.white)
  body.scale.set(1, 0.95, 1.25)
  const hd = mesh(new THREE.SphereGeometry(6.5, 14, 10), M.white)
  hd.position.set(0, 8, 7)
  const beak = mesh(new THREE.ConeGeometry(2.6, 7, 8), M.orange)
  beak.rotation.x = Math.PI / 2
  beak.position.set(0, 7.5, 14)
  for (const sx of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(1.2, 6, 5), M.dark)
    eye.position.set(sx * 3, 10, 11)
    bird.add(eye)
  }
  const wingL = new THREE.Group()
  wingL.position.set(-8, 2, 0)
  const wl = mesh(new THREE.SphereGeometry(7, 10, 8), M.grayWhite)
  wl.scale.set(1.4, 0.35, 0.9)
  wl.position.x = -6
  wingL.add(wl)
  const wingR = new THREE.Group()
  wingR.position.set(8, 2, 0)
  const wr = mesh(new THREE.SphereGeometry(7, 10, 8), M.grayWhite)
  wr.scale.set(1.4, 0.35, 0.9)
  wr.position.x = 6
  wingR.add(wr)
  bird.add(body, hd, beak, wingL, wingR)
  group.add(bird)

  return {
    group,
    update(input, time) {
      const out = Math.min(1, Math.max(0, input))
      bird.visible = out > 0.03
      bird.position.z = 6 + out * 34
      doorL.rotation.y = -out * 1.9
      doorR.rotation.y = out * 1.9
      const flap = out > 0.6 ? Math.sin(time * 16) * 0.55 : 0
      wingL.rotation.z = 0.35 + flap
      wingR.rotation.z = -(0.35 + flap)
    },
  }
}

export function buildDoll3(kind: string): Doll3 {
  if (kind === 'dancer') return dancer()
  if (kind === 'waver') return waver()
  if (kind === 'bower') return bower()
  return cuckoo()
}
