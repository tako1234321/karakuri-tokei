import type { App } from '../app'
import type { PartId, Vec2 } from '../core/types'
import { dragPlaneZ, pick3 } from '../render3/renderer3'

// キャンバス上のタッチ/マウス操作(3D):
//  1本指 パーツ上 … そのパーツの層平面上でドラッグ
//  1本指 空白     … オービット(視点をぐるっと回す)
//  タップ          … 選択 / 空白で選択解除
//  2本指           … ピンチズーム+パン(従来と同じ指づかい)

export function initPointer(app: App): void {
  const canvas = app.canvas
  const pointers = new Map<number, Vec2>()
  let dragId: PartId | null = null
  let dragOffset: Vec2 = { x: 0, y: 0 }
  let dragZ = 0
  let moved = false
  let undoPushed = false
  let orbiting = false
  let last: Vec2 | null = null
  let downAt: Vec2 | null = null
  let pinchDist = 0
  let pinchMid: Vec2 = { x: 0, y: 0 }

  const toLocal = (e: PointerEvent): Vec2 => {
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault()
    canvas.setPointerCapture(e.pointerId)
    const s = toLocal(e)
    pointers.set(e.pointerId, s)

    if (pointers.size === 1) {
      moved = false
      undoPushed = false
      downAt = s
      last = s
      const hit = pick3(app, s.x, s.y)
      if (hit) {
        dragId = hit.id
        orbiting = false
        dragZ = dragPlaneZ(app, hit)
        const w = app.camera.screenToWorld(s.x, s.y, dragZ)
        dragOffset = { x: hit.pos.x - w.x, y: hit.pos.y - w.y }
      } else {
        dragId = null
        orbiting = true
      }
    } else if (pointers.size === 2) {
      dragId = null
      orbiting = false
      app.previewPartId = null
      const [a, b] = [...pointers.values()]
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
      pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    }
  })

  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return
    const s = toLocal(e)
    pointers.set(e.pointerId, s)

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      if (pinchDist > 0) app.camera.dolly(d / pinchDist)
      app.camera.panBy(mid.x - pinchMid.x, mid.y - pinchMid.y)
      pinchDist = d
      pinchMid = mid
      return
    }

    if (!downAt || !last) return
    if (!moved && Math.hypot(s.x - downAt.x, s.y - downAt.y) > 6) {
      moved = true
      if (dragId) {
        const part = app.world.byId(dragId)
        if (part) {
          if (!undoPushed) { app.world.pushUndo(); undoPushed = true }
          // 取り付け済みパーツはドラッグで外れる
          if (part.kind === 'hand' || part.kind === 'cam' || part.kind === 'doll' || part.kind === 'dial') {
            part.mountId = null
          }
          app.previewPartId = part.id
        }
      }
    }

    if (moved && dragId) {
      const part = app.world.byId(dragId)
      if (!part) { dragId = null; return }
      const w = app.camera.screenToWorld(s.x, s.y, dragZ)
      part.pos = { x: w.x + dragOffset.x, y: w.y + dragOffset.y }
    } else if (moved && orbiting) {
      app.camera.orbit(s.x - last.x, s.y - last.y)
    }
    last = s
  })

  const finish = (e: PointerEvent) => {
    pointers.delete(e.pointerId)
    if (pointers.size === 1) {
      // ピンチ終了 → 残った指はオービット継続
      const [rest] = [...pointers.values()]
      last = rest
      downAt = rest
      orbiting = true
      dragId = null
      pinchDist = 0
      return
    }
    if (pointers.size > 0) return

    if (dragId) {
      const part = app.world.byId(dragId)
      if (part && moved) {
        app.world.snapPart(part)
      } else if (part && !moved) {
        app.select(part.id)
      }
    } else if (!moved && orbiting && e.type === 'pointerup') {
      app.select(null)
    }
    dragId = null
    orbiting = false
    last = null
    downAt = null
    app.previewPartId = null
  }

  canvas.addEventListener('pointerup', finish)
  canvas.addEventListener('pointercancel', finish)

  // デスクトップ用: ホイールでズーム
  canvas.addEventListener('wheel', e => {
    e.preventDefault()
    app.camera.dolly(e.deltaY < 0 ? 1.12 : 0.89)
  }, { passive: false })
}
