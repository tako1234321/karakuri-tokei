// 選択リング・スナップ候補リング・ジャム表示などの3Dオーバーレイ

import * as THREE from 'three'
import type { App } from '../app'
import { SNAP_RANGE, dist, wheelsOf } from '../core/gear'
import { isAxle, type Part } from '../core/types'
import { partHitRadius } from '../render/partMetrics'
import { zOfLayer, FRONT_Z, GEAR_THICK } from './space'

function unitRing(): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0))
  }
  return new THREE.BufferGeometry().setFromPoints(pts)
}

const RING_GEO = unitRing()

function makeRing(color: number): THREE.LineLoop {
  const mat = new THREE.LineDashedMaterial({ color, dashSize: 0.18, gapSize: 0.12, linewidth: 2 })
  const ring = new THREE.LineLoop(RING_GEO, mat)
  ring.computeLineDistances()
  ring.visible = false
  return ring
}

function jamSprite(): THREE.Sprite {
  const c = document.createElement('canvas')
  c.width = 192; c.height = 64
  const ctx = c.getContext('2d')!
  ctx.font = 'bold 34px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#d63c3c'
  ctx.fillText('ギギギ…', 96, 34)
  const tex = new THREE.CanvasTexture(c)
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
  sp.scale.set(96, 32, 1)
  sp.visible = false
  return sp
}

export class Overlay3 {
  group = new THREE.Group()
  private selRing = makeRing(0x3c82e6)
  private greenRings: THREE.LineLoop[] = []
  private blueRings: THREE.LineLoop[] = []
  private jams: THREE.Sprite[] = []

  constructor() {
    this.group.add(this.selRing)
  }

  private take(pool: THREE.LineLoop[], i: number, color: number): THREE.LineLoop {
    while (pool.length <= i) {
      const r = makeRing(color)
      pool.push(r)
      this.group.add(r)
    }
    return pool[i]
  }

  private takeJam(i: number): THREE.Sprite {
    while (this.jams.length <= i) {
      const s = jamSprite()
      this.jams.push(s)
      this.group.add(s)
    }
    return this.jams[i]
  }

  update(app: App): void {
    // 選択リング
    const sel = app.world.byId(app.selectedId)
    if (sel) {
      const r = partHitRadius(sel) + 10
      const z = isAxle(sel) ? zOfLayer(sel.layer) + GEAR_THICK + 4 : FRONT_Z + 30
      this.selRing.visible = true
      this.selRing.position.set(sel.pos.x, -sel.pos.y, z)
      this.selRing.scale.set(r, r, 1)
    } else {
      this.selRing.visible = false
    }

    // スナップ候補リング(ドラッグ中)
    let gi = 0, bi = 0
    const part: Part | undefined = app.dragGhostPart ?? app.world.byId(app.previewPartId)
    if (part) {
      if (isAxle(part)) {
        for (const other of app.world.axles()) {
          if (other.id === part.id) continue
          const d = dist(part.pos, other.pos)
          for (const w1 of wheelsOf(part)) {
            for (const w2 of wheelsOf(other)) {
              if (Math.abs(d - (w1.radius + w2.radius)) < SNAP_RANGE * 1.4) {
                const ring = this.take(this.greenRings, gi++, 0x46b45a)
                ring.visible = true
                ring.position.set(other.pos.x, -other.pos.y, zOfLayer(w2.layer) + GEAR_THICK + 3)
                ring.scale.set(w2.radius, w2.radius, 1)
              }
            }
          }
          // 同軸スタック候補(中心に近い)
          if (d < 34) {
            const ring = this.take(this.blueRings, bi++, 0x4696dc)
            ring.visible = true
            ring.position.set(other.pos.x, -other.pos.y, FRONT_Z + 8)
            ring.scale.set(18, 18, 1)
          }
        }
      } else if (part.kind === 'hand' || part.kind === 'cam' || part.kind === 'doll' || part.kind === 'dial') {
        for (const a of app.world.axles()) {
          if (dist(part.pos, a.pos) < 90) {
            const ring = this.take(this.blueRings, bi++, 0x4696dc)
            ring.visible = true
            ring.position.set(a.pos.x, -a.pos.y, FRONT_Z + 8)
            ring.scale.set(26, 26, 1)
          }
        }
      }
    }
    for (let i = gi; i < this.greenRings.length; i++) this.greenRings[i].visible = false
    for (let i = bi; i < this.blueRings.length; i++) this.blueRings[i].visible = false

    // ジャム表示
    let ji = 0
    for (const [id, st] of app.sim.axles) {
      if (!st.jammed) continue
      const p = app.world.byId(id)
      if (!p || !isAxle(p)) continue
      const sp = this.takeJam(ji++)
      sp.visible = true
      sp.position.set(p.pos.x, -p.pos.y + partHitRadius(p) + 26, FRONT_Z + 40)
    }
    for (let i = ji; i < this.jams.length; i++) this.jams[i].visible = false
  }
}
