import type { App } from '../app'
import { dist } from '../core/gear'
import type { Part, PartId, Vec2 } from '../core/types'
import { partHitRadius } from '../render/renderer'

// キャンバス上のタッチ/マウス操作:
//  1本指 … パーツのドラッグ or 盤面のパン、タップで選択
//  2本指 … ピンチズーム+パン

const HIT_ORDER: Record<Part['kind'], number> = {
  doll: 0, hand: 1, cam: 2, motor: 3, karakuriMotor: 3, gear: 3,
  escapement: 3, rack: 4, dial: 5,
}

function hitTest(app: App, w: Vec2): Part | null {
  const sorted = [...app.world.parts].sort((a, b) => HIT_ORDER[a.kind] - HIT_ORDER[b.kind])
  for (const p of sorted) {
    const pad = 10 / app.camera.scale
    if (dist(p.pos, w) < partHitRadius(p) + pad) return p
  }
  return null
}

export function initPointer(app: App): void {
  const canvas = app.canvas
  const pointers = new Map<number, Vec2>()
  let dragId: PartId | null = null
  let dragOffset: Vec2 = { x: 0, y: 0 }
  let moved = false
  let undoPushed = false
  let panLast: Vec2 | null = null
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
      const w = app.camera.screenToWorld(s.x, s.y)
      const hit = hitTest(app, w)
      moved = false
      undoPushed = false
      if (hit) {
        dragId = hit.id
        dragOffset = { x: hit.pos.x - w.x, y: hit.pos.y - w.y }
      } else {
        dragId = null
        panLast = s
      }
    } else if (pointers.size === 2) {
      dragId = null
      panLast = null
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
      if (pinchDist > 0) app.camera.zoomAt(mid.x, mid.y, d / pinchDist)
      app.camera.panBy(mid.x - pinchMid.x, mid.y - pinchMid.y)
      pinchDist = d
      pinchMid = mid
      return
    }

    if (dragId) {
      const part = app.world.byId(dragId)
      if (!part) { dragId = null; return }
      const w = app.camera.screenToWorld(s.x, s.y)
      const next = { x: w.x + dragOffset.x, y: w.y + dragOffset.y }
      if (!moved && dist(part.pos, next) > 5 / app.camera.scale) {
        moved = true
        if (!undoPushed) { app.world.pushUndo(); undoPushed = true }
        // 取り付け済みパーツはドラッグで外れる
        if (part.kind === 'hand' || part.kind === 'cam' || part.kind === 'doll') part.mountId = null
        app.previewPartId = part.id
      }
      if (moved) part.pos = next
    } else if (panLast) {
      app.camera.panBy(s.x - panLast.x, s.y - panLast.y)
      panLast = s
    }
  })

  const finish = (e: PointerEvent) => {
    pointers.delete(e.pointerId)
    if (pointers.size === 1) {
      // ピンチ終了 → 残った指でパン継続
      const [rest] = [...pointers.values()]
      panLast = rest
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
    } else if (!moved && panLast && e.type === 'pointerup') {
      app.select(null)
    }
    dragId = null
    panLast = null
    app.previewPartId = null
  }

  canvas.addEventListener('pointerup', finish)
  canvas.addEventListener('pointercancel', finish)

  // デスクトップ用: ホイールでズーム
  canvas.addEventListener('wheel', e => {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    app.camera.zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.12 : 0.89)
  }, { passive: false })
}
