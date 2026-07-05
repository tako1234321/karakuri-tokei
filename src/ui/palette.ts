import type { App } from '../app'
import type { Part, Vec2 } from '../core/types'
import { uid } from '../core/world'

interface PaletteItem {
  key: string
  label: string
  icon: string
  make: (pos: Vec2) => Part
}

const ITEMS: PaletteItem[] = [
  { key: 'motor', label: 'モーター', icon: '⚡', make: pos => ({ kind: 'motor', id: uid(), pos, teeth: 12, rpm: 1 }) },
  { key: 'gear', label: 'はぐるま', icon: '⚙️', make: pos => ({ kind: 'gear', id: uid(), pos, wheels: [30] }) },
  { key: 'gear2', label: '2だんギア', icon: '🔩', make: pos => ({ kind: 'gear', id: uid(), pos, wheels: [60, 10] }) },
  { key: 'escapement', label: 'ふりこ', icon: '🕰️', make: pos => ({ kind: 'escapement', id: uid(), pos, escapeTeeth: 30, pendulumLength: 0.994 }) },
  { key: 'handSec', label: 'びょうしん', icon: '🔴', make: pos => ({ kind: 'hand', id: uid(), pos, hand: 'sec', design: 'classic', mountId: null, offset: 0 }) },
  { key: 'handMin', label: 'ふんしん', icon: '🕑', make: pos => ({ kind: 'hand', id: uid(), pos, hand: 'min', design: 'classic', mountId: null, offset: 0 }) },
  { key: 'handHour', label: 'じしん', icon: '🕐', make: pos => ({ kind: 'hand', id: uid(), pos, hand: 'hour', design: 'classic', mountId: null, offset: 0 }) },
  { key: 'dial', label: 'もじばん', icon: '🕛', make: pos => ({ kind: 'dial', id: uid(), pos, style: 'classic' }) },
  { key: 'rack', label: 'ラック', icon: '➖', make: pos => ({ kind: 'rack', id: uid(), pos, length: 240, disp: 0 }) },
  { key: 'cam', label: 'カム', icon: '🥚', make: pos => ({ kind: 'cam', id: uid(), pos, profile: 'egg', mountId: null }) },
  { key: 'doll', label: 'にんぎょう', icon: '🎎', make: pos => ({ kind: 'doll', id: uid(), pos, doll: 'dancer', mountId: null }) },
  { key: 'karakuri', label: 'からくりモーター', icon: '♪', make: pos => ({ kind: 'karakuriMotor', id: uid(), pos, teeth: 12, rpm: 20 }) },
]

export function initPalette(app: App): void {
  const el = document.getElementById('palette')!
  for (const item of ITEMS) {
    const div = document.createElement('div')
    div.className = 'palItem'
    div.innerHTML = `<div class="palIcon">${item.icon}</div><div class="palLabel">${item.label}</div>`

    div.addEventListener('pointerdown', e => {
      e.preventDefault()
      div.setPointerCapture(e.pointerId)
      const pos = clientToWorld(app, e.clientX, e.clientY)
      app.dragGhostPart = item.make(pos)

      const move = (ev: PointerEvent) => {
        if (!app.dragGhostPart) return
        app.dragGhostPart.pos = clientToWorld(app, ev.clientX, ev.clientY)
      }
      const up = (ev: PointerEvent) => {
        div.removeEventListener('pointermove', move)
        div.removeEventListener('pointerup', up)
        div.removeEventListener('pointercancel', cancel)
        const ghost = app.dragGhostPart
        app.dragGhostPart = null
        if (!ghost) return
        // キャンバスの上で離したら配置する
        const rect = app.canvas.getBoundingClientRect()
        if (ev.clientX >= rect.left && ev.clientX <= rect.right &&
            ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
          app.world.pushUndo()
          ghost.pos = clientToWorld(app, ev.clientX, ev.clientY)
          app.world.add(ghost)
          app.world.snapPart(ghost)
          app.select(ghost.id)
        }
      }
      const cancel = () => {
        app.dragGhostPart = null
        div.removeEventListener('pointermove', move)
        div.removeEventListener('pointerup', up)
        div.removeEventListener('pointercancel', cancel)
      }
      div.addEventListener('pointermove', move)
      div.addEventListener('pointerup', up)
      div.addEventListener('pointercancel', cancel)
    })

    el.appendChild(div)
  }
}

function clientToWorld(app: App, cx: number, cy: number): Vec2 {
  const rect = app.canvas.getBoundingClientRect()
  return app.camera.screenToWorld(cx - rect.left, cy - rect.top)
}
