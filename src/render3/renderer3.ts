// 3Dレンダラーの本体。毎フレーム world.parts とシーングラフを突き合わせる。

import * as THREE from 'three'
import type { App } from '../app'
import type { Part, PartId } from '../core/types'
import { ghostMat } from './materials'
import { Overlay3 } from './overlay3'
import { createScene, type SceneHandles } from './scene'
import { drawEffects } from './effectsOverlay'
import { createVisual, revKey, type PartVisual } from './visuals'

let handles: SceneHandles | null = null
let overlay: Overlay3 | null = null
const visuals = new Map<PartId, { v: PartVisual; key: string }>()
let ghost: { v: PartVisual; key: string } | null = null
const hitMeshes: THREE.Mesh[] = []

export function initRender3(app: App): void {
  handles = createScene(app.canvas)
  overlay = new Overlay3()
  handles.scene.add(overlay.group)
  resize3(app)
}

export function resize3(app: App): void {
  if (!handles) return
  const stage = app.canvas.parentElement
  const w = Math.max(1, stage?.clientWidth ?? 1)
  const h = Math.max(1, stage?.clientHeight ?? 1)
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  handles.renderer.setPixelRatio(dpr)
  handles.renderer.setSize(w, h, false)
  app.camera.resize(w, h, dpr)
  // 紙吹雪用オーバーレイも合わせる
  const ov = app.overlayCtx.canvas
  ov.width = Math.round(w * app.camera.dpr)
  ov.height = Math.round(h * app.camera.dpr)
}

function reconcile(app: App): void {
  const seen = new Set<PartId>()
  for (const part of app.world.parts) {
    seen.add(part.id)
    const key = revKey(part)
    const cur = visuals.get(part.id)
    if (!cur || cur.key !== key) {
      if (cur) {
        handles!.partsRoot.remove(cur.v.group)
        cur.v.dispose()
      }
      const v = createVisual(part)
      handles!.partsRoot.add(v.group)
      visuals.set(part.id, { v, key })
    }
  }
  for (const [id, cur] of visuals) {
    if (!seen.has(id)) {
      handles!.partsRoot.remove(cur.v.group)
      cur.v.dispose()
      visuals.delete(id)
    }
  }

  // ヒット判定リストを更新
  hitMeshes.length = 0
  for (const { v } of visuals.values()) {
    if (v.hit) hitMeshes.push(v.hit)
  }
}

// パレットから配置中のゴースト
function updateGhost(app: App): void {
  const part = app.dragGhostPart
  if (!part) {
    if (ghost) {
      handles!.partsRoot.remove(ghost.v.group)
      ghost.v.dispose()
      ghost = null
    }
    return
  }
  const key = revKey(part)
  if (!ghost || ghost.key !== key) {
    if (ghost) {
      handles!.partsRoot.remove(ghost.v.group)
      ghost.v.dispose()
    }
    const v = createVisual(part)
    v.group.traverse(o => {
      if (o instanceof THREE.Mesh && o !== v.hit) o.material = ghostMat
      if (o instanceof THREE.Sprite) o.visible = false
    })
    if (v.hit) v.hit.visible = false
    handles!.partsRoot.add(v.group)
    ghost = { v, key }
  }
  ghost.v.update(app, part)
}

export function draw3(app: App): void {
  if (!handles || !overlay) return
  reconcile(app)
  for (const part of app.world.parts) {
    visuals.get(part.id)?.v.update(app, part)
  }
  updateGhost(app)
  overlay.update(app)
  app.camera.update(app.dt)
  handles.renderer.render(handles.scene, app.camera.camera)
  drawEffects(app)
}

// 画面座標からパーツを拾う(最前面優先はカメラ距離で自然に決まる)
export function pick3(app: App, sx: number, sy: number): Part | null {
  if (!handles) return null
  const ray = app.camera.raycaster(sx, sy)
  const hits = ray.intersectObjects(hitMeshes, false)
  for (const h of hits) {
    const id = h.object.userData.partId as PartId | undefined
    if (id) {
      const p = app.world.byId(id)
      if (p) return p
    }
  }
  return null
}

// ドラッグ時にパーツを動かす基準平面の z
export function dragPlaneZ(_app: App, part: Part): number {
  const hit = visuals.get(part.id)?.v.hit
  if (hit) {
    const wp = new THREE.Vector3()
    hit.getWorldPosition(wp)
    return wp.z
  }
  return 0
}
