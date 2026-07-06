// パーツ1つぶんの3D表現。renderer3 が world.parts と突き合わせて管理する。

import * as THREE from 'three'
import type { App } from '../app'
import { CAM_AMP, CAM_R0, camFollower } from '../core/cam'
import { escStateAt } from '../core/escapement'
import { RACK_H, wheelsOf } from '../core/gear'
import {
  type CamPart, type DialPart, type DollPart, type EscapementPart,
  type GearPart, type HandPart, type KarakuriMotorPart, type MotorPart,
  type Part, type RackPart,
} from '../core/types'
import { DIAL_TEX_RADIUS, renderDialFace } from '../render/dialFace'
import { partHitRadius } from '../render/partMetrics'
import { buildDoll3, type Doll3 } from './dolls3'
import * as G from './geometry'
import * as M from './materials'
import { CAM_Z, DIAL_BACK_Z, DIAL_FRONT_Z, DOLL_Z, GEAR_THICK, HAND_Z, zOfLayer } from './space'

export interface PartVisual {
  group: THREE.Group
  hit: THREE.Mesh | null
  update(app: App, part: Part): void
  dispose(): void
}

// 幾何を作り直す必要がある変化を表すキー
export function revKey(p: Part): string {
  switch (p.kind) {
    case 'gear': return `gear:${p.wheels.join(',')}:${p.layer}`
    case 'motor': return `motor:${p.teeth}:${p.layer}`
    case 'karakuriMotor': return `kara:${p.teeth}:${p.layer}`
    case 'escapement': return `esc:${p.escapeTeeth}:${p.layer}`
    case 'hand': return `hand:${p.hand}:${p.design}`
    case 'cam': return `cam:${p.profile}`
    case 'rack': return `rack:${p.length}:${p.layer}:${p.endStop ?? 'none'}`
    case 'dial': return `dial:${p.style}:${p.front ? 1 : 0}`
    case 'doll': return `doll:${p.doll}`
  }
}

export function createVisual(part: Part): PartVisual {
  switch (part.kind) {
    case 'gear': return new GearVisual(part)
    case 'motor': return new MotorVisual(part)
    case 'karakuriMotor': return new MotorVisual(part)
    case 'escapement': return new EscapementVisual(part)
    case 'hand': return new HandVisual(part)
    case 'cam': return new CamVisual(part)
    case 'rack': return new RackVisual(part)
    case 'dial': return new DialVisual(part)
    case 'doll': return new DollVisual(part)
  }
}

// ---------- 共通ヘルパー ----------

function hitDisk(part: Part, z: number): THREE.Mesh {
  const m = new THREE.Mesh(G.circleGeo(partHitRadius(part) + 10, 24), M.hitMat)
  m.position.z = z
  m.userData.partId = part.id
  return m
}

// 接地影(地板の上のやわらかい影)
let shadowMat: THREE.MeshBasicMaterial | null = null
function getShadowMat(): THREE.MeshBasicMaterial {
  if (!shadowMat) {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64)
    g.addColorStop(0, 'rgba(50,32,14,0.5)')
    g.addColorStop(1, 'rgba(50,32,14,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(c)
    shadowMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  }
  return shadowMat
}

function contactShadow(radius: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2.4, radius * 2.4), getShadowMat())
  m.position.z = -8.4
  return m
}

// 同軸スタックで奥の軸ほど細く長く見せる(実物の筒カナ構造ふう)
function shaftRadius(layer: number): number {
  return Math.max(2.2, 6 - layer * 0.55)
}

// この軸に取り付いている針・カムまでシャフトを伸ばす
function shaftTopZ(app: App, partId: string, baseTop: number): number {
  let top = baseTop
  for (const p of app.world.parts) {
    if (p.kind === 'hand' && p.mountId === partId) top = Math.max(top, HAND_Z[p.hand] + 2)
    else if (p.kind === 'cam' && p.mountId === partId) top = Math.max(top, CAM_Z + 4)
  }
  return top
}

// 位置(+ジャム時の震え)を反映
function place(group: THREE.Group, part: Part, app: App, jammed: boolean): void {
  let jx = 0, jy = 0
  if (jammed) {
    jx = Math.sin(app.time * 55 + part.pos.x) * 1.8
    jy = Math.cos(app.time * 47) * 1.8
  }
  group.position.set(part.pos.x + jx, -(part.pos.y + jy), 0)
}

function textSprite(text: string, size = 28, color = '#4a3a28'): THREE.Sprite {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 64
  const ctx = c.getContext('2d')!
  ctx.font = `bold ${size}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(text, 64, 34)
  const tex = new THREE.CanvasTexture(c)
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
  sp.scale.set(56, 28, 1)
  return sp
}

function disposeSprite(sp: THREE.Sprite): void {
  sp.material.map?.dispose()
  sp.material.dispose()
}

// ---------- 歯車 ----------

class GearVisual implements PartVisual {
  group = new THREE.Group()
  hit: THREE.Mesh
  private wheels: THREE.Mesh[] = []
  private shaft: THREE.Mesh
  private baseTop: number

  constructor(part: GearPart) {
    const ws = wheelsOf(part)
    ws.forEach((w, i) => {
      const mesh = new THREE.Mesh(G.gearGeometry(w.teeth), i === 0 ? M.brassFor(w.teeth) : M.brassLight)
      mesh.position.z = zOfLayer(w.layer)
      this.wheels.push(mesh)
      this.group.add(mesh)
    })
    this.baseTop = zOfLayer(ws[ws.length - 1].layer) + GEAR_THICK
    this.shaft = new THREE.Mesh(G.cylZ, M.axleDark)
    this.hit = hitDisk(part, zOfLayer(part.layer) + GEAR_THICK)
    const r = Math.max(...ws.map(w => w.radius))
    this.group.add(this.shaft, this.hit, contactShadow(r))
  }

  update(app: App, part: Part): void {
    if (part.kind !== 'gear') return
    const st = app.sim.axles.get(part.id)
    place(this.group, part, app, st?.jammed ?? false)
    const a = -(st?.angle ?? 0)
    for (const w of this.wheels) w.rotation.z = a
    // シャフト: 奥の軸ほど細く、取り付いた針・カムまで伸びる
    const top = shaftTopZ(app, part.id, this.baseTop)
    const r = shaftRadius(part.layer)
    this.shaft.scale.set(r, r, top + 8)
    this.shaft.position.z = (top - 8) / 2
  }

  dispose(): void { /* ジオメトリ/マテリアルは共有キャッシュ */ }
}

// ---------- モーター / からくりモーター ----------

class MotorVisual implements PartVisual {
  group = new THREE.Group()
  hit: THREE.Mesh
  private pinion: THREE.Mesh

  constructor(part: MotorPart | KarakuriMotorPart) {
    const isK = part.kind === 'karakuriMotor'
    const r = wheelsOf(part)[0].radius
    const z = zOfLayer(part.layer)

    const housing = new THREE.Mesh(G.cylZ, isK ? M.motorPink : M.motorBlue)
    housing.scale.set(r + 20, r + 20, 14)
    housing.position.z = z - 9

    this.pinion = new THREE.Mesh(G.gearGeometry(part.teeth), isK ? M.pinionPinkish : M.pinionWhite)
    this.pinion.position.z = z

    const cap = new THREE.Mesh(G.cylZ, M.axleDark)
    cap.scale.set(5, 5, 10)
    cap.position.z = z + 5

    const icon = textSprite(isK ? '🎠' : '⚡', 40, '#ffffff')
    icon.position.set(0, -(r + 20) * 0.62, z + 4)
    icon.scale.set(30, 15, 1)

    // かざりネジ
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4
      const bolt = new THREE.Mesh(G.cylZ, M.pinionWhite)
      bolt.scale.set(3.5, 3.5, 4)
      bolt.position.set((r + 12) * Math.cos(a), (r + 12) * Math.sin(a), z - 1)
      this.group.add(bolt)
    }

    this.hit = hitDisk(part, z + GEAR_THICK)
    this.group.add(housing, this.pinion, cap, icon, this.hit, contactShadow(r + 20))
  }

  update(app: App, part: Part): void {
    const st = app.sim.axles.get(part.id)
    place(this.group, part, app, st?.jammed ?? false)
    this.pinion.rotation.z = -(st?.angle ?? 0)
  }

  dispose(): void {
    this.group.traverse(o => { if (o instanceof THREE.Sprite) disposeSprite(o) })
  }
}

// ---------- 振り子+脱進機 ----------

class EscapementVisual implements PartVisual {
  group = new THREE.Group()
  hit: THREE.Mesh
  private wheel: THREE.Mesh
  private pend = new THREE.Group()
  private rod: THREE.Mesh
  private bob: THREE.Mesh
  private pivotY: number

  constructor(part: EscapementPart) {
    const r = wheelsOf(part)[0].radius
    const z = zOfLayer(part.layer)
    this.pivotY = r + 46   // three座標では上が+y

    this.wheel = new THREE.Mesh(G.escapeWheelGeometry(part.escapeTeeth), M.bobGold)
    this.wheel.position.z = z

    // 支柱
    const post = new THREE.Mesh(G.cylY, M.wood)
    post.scale.set(3.6, this.pivotY + 10, 3.6)
    post.position.set(0, (this.pivotY + 10) / 2 - 5, z - GEAR_THICK)

    // 振り子(アンクルと一体で首をふる)
    this.pend.position.set(0, this.pivotY, z + GEAR_THICK)
    this.rod = new THREE.Mesh(G.cylY, M.woodDark)
    this.bob = new THREE.Mesh(G.sphere, M.bobGold)
    const anchor = new THREE.Mesh(G.anchorGeometry(), M.anchorRed)
    this.pend.add(this.rod, this.bob, anchor)

    const bracket = new THREE.Mesh(G.sphere, M.wood)
    bracket.scale.set(7, 7, 7)
    bracket.position.set(0, this.pivotY, z + GEAR_THICK)

    const axleCap = new THREE.Mesh(G.cylZ, M.axleDark)
    axleCap.scale.set(4, 4, 14)
    axleCap.position.z = z

    this.hit = hitDisk(part, z + GEAR_THICK)
    this.group.add(this.wheel, post, this.pend, bracket, axleCap, this.hit, contactShadow(r + 6))
  }

  update(app: App, part: Part): void {
    if (part.kind !== 'escapement') return
    const st = app.sim.axles.get(part.id)
    place(this.group, part, app, st?.jammed ?? false)
    this.wheel.rotation.z = -(st?.angle ?? 0)

    const esc = escStateAt(app.sim.clock.simT, part)
    const swing = app.sim.clock.running && !(st?.jammed) ? esc.pendAngle : 0
    this.pend.rotation.z = -swing

    const lenPx = 90 + part.pendulumLength * 200
    this.rod.scale.set(2.6, lenPx, 2.6)
    this.rod.position.y = -lenPx / 2
    this.bob.scale.set(20, 20, 9)
    this.bob.position.y = -lenPx
  }

  dispose(): void { /* 共有 */ }
}

// ---------- 針 ----------

class HandVisual implements PartVisual {
  group = new THREE.Group()
  hit: THREE.Mesh
  private mesh: THREE.Mesh
  private cap: THREE.Mesh
  private mat: THREE.MeshStandardMaterial

  constructor(part: HandPart) {
    this.mat = (part.hand === 'sec' ? M.handRed : M.handSteel).clone()
    this.mat.transparent = true
    this.mesh = new THREE.Mesh(G.handGeometry(part.design, part.hand), this.mat)
    this.cap = new THREE.Mesh(G.cylZ, this.mat)
    const capR = part.hand === 'sec' ? 6 : 8
    this.cap.scale.set(capR, capR, 5)
    this.cap.position.z = 1
    this.group.position.z = HAND_Z[part.hand]
    this.hit = hitDisk(part, 0)
    this.group.add(this.mesh, this.cap, this.hit)
  }

  update(app: App, part: Part): void {
    if (part.kind !== 'hand') return
    this.group.position.set(part.pos.x, -part.pos.y, HAND_Z[part.hand])
    if (part.mountId) {
      this.mesh.rotation.z = -app.sim.handAngle(part)
      this.mat.opacity = 1
    } else {
      this.mesh.rotation.z = -0.6
      this.mat.opacity = 0.55
    }
  }

  dispose(): void { this.mat.dispose() }
}

// ---------- 文字盤 ----------

class DialVisual implements PartVisual {
  group = new THREE.Group()
  hit: THREE.Mesh
  private tex: THREE.CanvasTexture
  private mat: THREE.MeshBasicMaterial
  private geo: THREE.PlaneGeometry

  constructor(part: DialPart) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1024
    renderDialFace(canvas, part.style)
    this.tex = new THREE.CanvasTexture(canvas)
    this.tex.colorSpace = THREE.SRGBColorSpace
    this.tex.anisotropy = 4
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true })
    this.geo = new THREE.PlaneGeometry(DIAL_TEX_RADIUS * 2, DIAL_TEX_RADIUS * 2)
    const face = new THREE.Mesh(this.geo, this.mat)
    this.hit = hitDisk(part, 1)
    this.group.add(face, this.hit)
  }

  update(_app: App, part: Part): void {
    if (part.kind !== 'dial') return
    this.group.position.set(part.pos.x, -part.pos.y, part.front ? DIAL_FRONT_Z : DIAL_BACK_Z)
  }

  dispose(): void {
    this.tex.dispose()
    this.mat.dispose()
    this.geo.dispose()
  }
}

// ---------- カム ----------

class CamVisual implements PartVisual {
  group = new THREE.Group()
  hit: THREE.Mesh
  private cam: THREE.Mesh
  private rod: THREE.Mesh
  private roller: THREE.Mesh

  constructor(part: CamPart) {
    this.cam = new THREE.Mesh(G.camGeometry(part.profile), M.camOrange)
    this.rod = new THREE.Mesh(G.cylY, M.followerGray)
    this.roller = new THREE.Mesh(G.sphere, M.followerGray)
    this.hit = hitDisk(part, 4)
    this.group.add(this.cam, this.rod, this.roller, this.hit)
    this.group.position.z = CAM_Z
  }

  update(app: App, part: Part): void {
    if (part.kind !== 'cam') return
    this.group.position.set(part.pos.x, -part.pos.y, CAM_Z)
    const angle = app.sim.axleAngle(part.mountId)
    this.cam.rotation.z = -angle

    const hasDoll = app.world.parts.some(d => d.kind === 'doll' && d.mountId === part.id)
    this.rod.visible = this.roller.visible = hasDoll
    if (hasDoll) {
      const lift = camFollower(part.profile, angle)
      const contactR = CAM_R0 + CAM_AMP * lift
      const topY = 70   // 人形の足もと(pos.y-78 のあたり)まで
      this.roller.scale.set(6, 6, 6)
      this.roller.position.y = contactR + 5
      const len = Math.max(6, topY - (contactR + 5))
      this.rod.scale.set(3, len, 3)
      this.rod.position.y = contactR + 5 + len / 2
    }
  }

  dispose(): void { /* 共有 */ }
}

// ---------- ラック ----------

class RackVisual implements PartVisual {
  group = new THREE.Group()
  hit: THREE.Mesh
  private bar = new THREE.Group()

  constructor(part: RackPart) {
    const z = zOfLayer(part.layer)
    const guideLen = part.length + Math.max(40, part.length * 0.45) + 16

    const rail = new THREE.Mesh(G.box, M.woodDark)
    rail.scale.set(guideLen, 7, 6)
    rail.position.set(0, -(RACK_H / 2 - 1), z - 2)

    const barBody = new THREE.Mesh(G.box, M.wood)
    barBody.scale.set(part.length, RACK_H - 8, GEAR_THICK)
    barBody.position.y = -4
    const teeth = new THREE.Mesh(G.rackTeethGeometry(part.length), M.brassLight)
    teeth.position.y = 4
    this.bar.add(barBody, teeth)
    this.bar.position.z = z

    this.hit = hitDisk(part, z + GEAR_THICK)
    this.group.add(rail, this.bar, this.hit)

    // 端っこのマイクロスイッチ(赤い小箱)
    if ((part.endStop ?? 'none') !== 'none') {
      for (const sx of [-1, 1]) {
        const sw = new THREE.Mesh(G.box, M.anchorRed)
        sw.scale.set(8, 14, 10)
        sw.position.set(sx * (guideLen / 2 - 5), -6, z)
        this.group.add(sw)
      }
    }
  }

  update(app: App, part: Part): void {
    if (part.kind !== 'rack') return
    this.group.position.set(part.pos.x, -part.pos.y, 0)
    this.bar.position.x = part.disp
  }

  dispose(): void { /* 共有 */ }
}

// ---------- からくり人形(本物の3D) ----------

class DollVisual implements PartVisual {
  group = new THREE.Group()
  hit: THREE.Mesh
  private doll: Doll3

  constructor(part: DollPart) {
    this.doll = buildDoll3(part.doll)
    this.hit = hitDisk(part, 2)
    this.hit.position.y = 30
    this.group.add(this.doll.group, this.hit)
  }

  update(app: App, part: Part): void {
    if (part.kind !== 'doll') return
    const input = part.mountId ? app.sim.dollInput(part) : 0
    let y = -part.pos.y
    // おじぎ人形はカムの持ち上げで上下する
    if (part.mountId && part.doll === 'bower') {
      const m = app.world.byId(part.mountId)
      if (m && m.kind === 'cam') y += input * CAM_AMP
    }
    this.group.position.set(part.pos.x, y, DOLL_Z)
    this.doll.update(input, app.time)
  }

  dispose(): void {
    this.doll.group.traverse(o => {
      if (o instanceof THREE.Mesh) o.geometry.dispose()
    })
  }
}
