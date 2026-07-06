import type { App } from '../app'
import { pendulumPeriod } from '../core/escapement'
import { MAX_LAYER, isAxle, type Part } from '../core/types'
import { CAM_DEFS } from '../core/cam'
import { DIAL_DEFS } from '../data/dials'
import { DOLL_DEFS, dollDef } from '../data/dolls'
import { HAND_DESIGNS, HAND_LABEL } from '../data/hands'

const GEAR_TEETH = [8, 10, 12, 15, 16, 20, 24, 30, 36, 40, 45, 48, 60, 72, 80, 90, 96, 100, 120]
const PINION_TEETH = [8, 10, 12, 16, 20]
const ESC_TEETH = [20, 24, 30, 36, 40]

const KIND_LABEL: Record<Part['kind'], string> = {
  motor: '⚡ モーター', gear: '⚙️ はぐるま', escapement: '🕰️ ふりこ(だっしんき)',
  karakuriMotor: '🎠 からくりモーター(まいしょうじにうごく)', hand: 'はり', rack: '➖ ラック',
  cam: '🥚 カム', doll: '🎎 にんぎょう', dial: '🕛 もじばん',
}

export function initInspector(app: App): { refresh: () => void } {
  const el = document.getElementById('inspector')!

  const step = (list: number[], cur: number, dir: 1 | -1): number => {
    const i = list.findIndex(v => v >= cur)
    const at = i < 0 ? list.length - 1 : (list[i] === cur ? i : (dir > 0 ? i - 1 : i))
    const next = Math.min(list.length - 1, Math.max(0, at + dir))
    return list[next]
  }

  const mkBtn = (label: string, cls: string, onClick: () => void): HTMLButtonElement => {
    const b = document.createElement('button')
    b.className = cls
    b.textContent = label
    b.addEventListener('click', onClick)
    return b
  }

  const numberEditor = (label: string, get: () => number, set: (v: number) => void, list: number[]): HTMLElement => {
    const wrap = document.createElement('div')
    wrap.className = 'insGroup'
    const lab = document.createElement('span')
    lab.className = 'insLabel'
    lab.textContent = label
    const minus = mkBtn('−', 'btn insStep', () => { app.world.pushUndo(); set(step(list, get(), -1)); refresh() })
    const val = document.createElement('span')
    val.className = 'insValue'
    val.textContent = String(get())
    const plus = mkBtn('＋', 'btn insStep', () => { app.world.pushUndo(); set(step(list, get(), 1)); refresh() })
    wrap.append(lab, minus, val, plus)
    return wrap
  }

  const cycleEditor = (label: string, options: { key: string; label: string }[], get: () => string, set: (v: string) => void): HTMLElement => {
    const wrap = document.createElement('div')
    wrap.className = 'insGroup'
    const lab = document.createElement('span')
    lab.className = 'insLabel'
    lab.textContent = label
    const cur = options.find(o => o.key === get()) ?? options[0]
    const btn = mkBtn(`${cur.label} ▸`, 'btn insCycle', () => {
      const i = options.findIndex(o => o.key === get())
      app.world.pushUndo()
      set(options[(i + 1) % options.length].key)
      refresh()
    })
    wrap.append(lab, btn)
    return wrap
  }

  const refresh = () => {
    const p = app.world.byId(app.selectedId)
    if (!p) { el.hidden = true; el.innerHTML = ''; return }
    el.hidden = false
    el.innerHTML = ''

    const title = document.createElement('div')
    title.className = 'insTitle'
    title.textContent = p.kind === 'hand' ? `🕐 ${HAND_LABEL[p.hand]}` : KIND_LABEL[p.kind]
    el.appendChild(title)

    if (p.kind === 'gear') {
      el.appendChild(numberEditor('は(おおきい)', () => p.wheels[0], v => { p.wheels[0] = v }, GEAR_TEETH))
      if (p.wheels.length >= 2) {
        el.appendChild(numberEditor('は(ちいさい)', () => p.wheels[1], v => { p.wheels[1] = v }, GEAR_TEETH))
        el.appendChild(mkBtn('1だんに もどす', 'btn', () => { app.world.pushUndo(); p.wheels = [p.wheels[0]]; refresh() }))
      } else {
        el.appendChild(mkBtn('2だんギアに する', 'btn', () => { app.world.pushUndo(); p.wheels = [p.wheels[0], 10]; refresh() }))
      }
    } else if (p.kind === 'motor') {
      el.appendChild(numberEditor('ピニオンのは', () => p.teeth, v => { p.teeth = v }, PINION_TEETH))
      el.appendChild(cycleEditor('はやさ', [
        { key: '1', label: '1ぷんで1かいてん' },
        { key: '60', label: '1びょうで1かいてん' },
      ], () => String(p.rpm), v => { p.rpm = parseInt(v, 10) }))
    } else if (p.kind === 'karakuriMotor') {
      el.appendChild(numberEditor('ピニオンのは', () => p.teeth, v => { p.teeth = v }, PINION_TEETH))
      el.appendChild(numberEditor('はやさ(rpm)', () => p.rpm, v => { p.rpm = v }, [5, 10, 20, 40, 60]))
      el.appendChild(mkBtn('▶ テスト(6びょう)', 'btn insAction', () => { app.sim.testKarakuri(p.id) }))
    } else if (p.kind === 'escapement') {
      el.appendChild(numberEditor('ガンギぐるまのは', () => p.escapeTeeth, v => { p.escapeTeeth = v }, ESC_TEETH))
      const wrap = document.createElement('div')
      wrap.className = 'insGroup insSlider'
      const lab = document.createElement('span')
      lab.className = 'insLabel'
      const fmt = () => `ふりこのながさ ${Math.round(p.pendulumLength * 100)}cm(1おうふく ${pendulumPeriod(p.pendulumLength).toFixed(2)}びょう)`
      lab.textContent = fmt()
      const slider = document.createElement('input')
      slider.type = 'range'
      slider.min = '0.25'; slider.max = '1.6'; slider.step = '0.001'
      slider.value = String(p.pendulumLength)
      slider.addEventListener('input', () => {
        p.pendulumLength = parseFloat(slider.value)
        lab.textContent = fmt()
      })
      const reset = mkBtn('99cmにする', 'btn insStep', () => { p.pendulumLength = 0.994; slider.value = '0.994'; lab.textContent = fmt() })
      wrap.append(lab, slider, reset)
      el.appendChild(wrap)
    } else if (p.kind === 'hand') {
      el.appendChild(cycleEditor('デザイン', HAND_DESIGNS, () => p.design, v => { p.design = v }))
      el.appendChild(mkBtn('🕒 じこくあわせ', 'btn insAction', () => {
        if (!p.mountId) { app.toast('まず はぐるまのじくに のせてね'); return }
        const sec = app.sim.clock.seconds
        const desired =
          p.hand === 'sec' ? 2 * Math.PI * ((sec % 60) / 60) :
          p.hand === 'min' ? 2 * Math.PI * (((sec / 60) % 60) / 60) :
          2 * Math.PI * (((sec / 3600) % 12) / 12)
        p.offset = desired - app.sim.axleAngle(p.mountId)
        app.toast('はりを いまのじこくに あわせたよ!')
      }))
    } else if (p.kind === 'cam') {
      el.appendChild(cycleEditor('かたち', CAM_DEFS, () => p.profile, v => { p.profile = v }))
      if (!p.mountId) {
        const hint = document.createElement('span')
        hint.className = 'insHint'
        hint.textContent = 'はぐるまのじくに かさねてね'
        el.appendChild(hint)
      }
    } else if (p.kind === 'doll') {
      el.appendChild(cycleEditor('しゅるい', DOLL_DEFS, () => p.doll, v => { p.doll = v; p.mountId = null; app.world.snapPart(p) }))
      if (!p.mountId) {
        const hint = document.createElement('span')
        hint.className = 'insHint'
        hint.textContent = dollDef(p.doll).hint
        el.appendChild(hint)
      }
    } else if (p.kind === 'dial') {
      el.appendChild(cycleEditor('スタイル', DIAL_DEFS, () => p.style, v => { p.style = v }))
      el.appendChild(cycleEditor('かさねじゅん', [
        { key: 'back', label: 'はぐるまの うしろ' },
        { key: 'front', label: 'はぐるまの まえ' },
      ], () => (p.front ? 'front' : 'back'), v => { p.front = v === 'front' }))
    } else if (p.kind === 'rack') {
      el.appendChild(numberEditor('ながさ', () => p.length, v => { p.length = v }, [160, 200, 240, 280, 320, 360]))
      el.appendChild(cycleEditor('はしのスイッチ', [
        { key: 'none', label: 'なし' },
        { key: 'reverse', label: 'はんてん(モーターがぎゃくまわり)' },
        { key: 'stop', label: 'ストップ(モーターがとまる)' },
      ], () => p.endStop ?? 'none', v => { p.endStop = v as 'none' | 'stop' | 'reverse' }))
      const hint = document.createElement('span')
      hint.className = 'insHint'
      hint.textContent = 'からくりモーター(🎠)に きくよ'
      el.appendChild(hint)
    }

    // 奥行きの層(軸パーツとラック)
    if (isAxle(p) || p.kind === 'rack') {
      const span = p.kind === 'gear' ? p.wheels.length : 1
      const list = Array.from({ length: MAX_LAYER - span + 2 }, (_, i) => i)
      el.appendChild(numberEditor('おくゆき(だん)', () => p.layer, v => { p.layer = v }, list))
    }

    const del = mkBtn('🗑 すてる', 'btn insDelete', () => {
      app.world.pushUndo()
      app.world.remove(p.id)
      app.select(null)
    })
    el.appendChild(del)

    const close = mkBtn('✕', 'btn insClose', () => app.select(null))
    el.appendChild(close)
  }

  return { refresh }
}
