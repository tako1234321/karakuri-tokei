import type { App } from '../app'
import { MISSIONS } from '../data/missions'
import { spawnConfetti } from '../render/renderer'

const KEY = 'karakuri:guide'

export function initGuide(app: App): { update: () => void } {
  const el = document.getElementById('guidePanel')!
  let idx = 0
  try { idx = Math.min(MISSIONS.length, parseInt(localStorage.getItem(KEY) ?? '0', 10) || 0) } catch { /* */ }
  let cleared = false
  let rendered = ''

  const save = () => { try { localStorage.setItem(KEY, String(idx)) } catch { /* */ } }

  const render = () => {
    const key = `${idx}:${cleared}:${app.mode}`
    if (key === rendered) return
    rendered = key

    if (app.mode !== 'guide') { el.hidden = true; return }
    el.hidden = false

    if (idx >= MISSIONS.length) {
      el.innerHTML = `
        <div class="gpHead">🏆 ぜんミッション クリア!</div>
        <div class="gpText">おめでとう!きみは もう「からくりどけい マスター」だ!<br>
        じゆうモードで じぶんだけの からくりどけいを つくってみよう!</div>
        <button class="btn gpBtn" id="gpRestart">さいしょから もういちど</button>`
      el.querySelector('#gpRestart')!.addEventListener('click', () => {
        idx = 0; cleared = false; save(); rendered = ''
      })
      return
    }

    const m = MISSIONS[idx]
    const dots = MISSIONS.map((_, i) =>
      `<span class="gpDot ${i < idx ? 'done' : i === idx ? 'now' : ''}"></span>`).join('')
    el.innerHTML = `
      <div class="gpHead">ミッション ${idx + 1}/${MISSIONS.length}: ${m.title}</div>
      <div class="gpText">${m.text}</div>
      <div class="gpFoot">
        <div class="gpDots">${dots}</div>
        ${cleared
          ? '<button class="btn gpBtn" id="gpNext">🎉 クリア! つぎへ →</button>'
          : '<span class="gpWait">チャレンジちゅう…</span>'}
      </div>`
    if (cleared) {
      el.querySelector('#gpNext')!.addEventListener('click', () => {
        idx++; cleared = false; save(); rendered = ''
      })
    }
  }

  const update = () => {
    if (app.mode === 'guide' && idx < MISSIONS.length && !cleared) {
      if (MISSIONS[idx].check(app)) {
        cleared = true
        rendered = ''
        app.audio.fanfare()
        spawnConfetti(app, 60)
      }
    }
    render()
  }

  return { update }
}
