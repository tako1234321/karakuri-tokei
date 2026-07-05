import type { App } from '../app'
import { handStatus } from '../core/check'
import { fstr } from '../core/ratio'
import type { HandKind } from '../core/types'
import { HAND_LABEL } from '../data/hands'
import { spawnConfetti } from '../render/renderer'

const TARGET_TEXT: Record<HandKind, string> = {
  sec: 'めあて: 1ぷんで 1しゅう',
  min: 'めあて: 60ぷんで 1しゅう',
  hour: 'めあて: 12じかんで 1しゅう',
}

function fmtPeriod(minutes: number): string {
  if (!isFinite(minutes) || minutes > 100000) return '…'
  if (minutes < 1.5) return `${Math.round(minutes * 60)}びょう`
  if (minutes < 90) return `${Math.round(minutes * 10) / 10}ぷん`
  return `${Math.round(minutes / 6) / 10}じかん`
}

export function initCheckPanel(app: App): { update: () => void } {
  const el = document.getElementById('checkPanel')!
  let frame = 0
  let celebrated = false

  const update = () => {
    if (el.hidden) return
    if (frame++ % 15 !== 0) return   // 4Hz程度で更新

    const kinds: HandKind[] = ['sec', 'min', 'hour']
    let allOk = true
    let html = '<div class="cpTitle">はやさチェック</div>'
    for (const k of kinds) {
      const st = handStatus(app.sim, k)
      let mark = '−'
      let cls = 'cpNone'
      let detail = 'はりが まだないよ'
      if (st.exists && !st.mounted) {
        detail = 'はりを じくに のせてね'
      } else if (st.mounted && !st.driven) {
        detail = 'どうりょくに つながってないよ'
      } else if (st.mounted && st.ok) {
        mark = '○'; cls = 'cpOk'; detail = 'ばっちり!'
      } else if (st.mounted && st.reverse) {
        mark = '×'; cls = 'cpNg'; detail = 'ぎゃくまわりだよ! はぐるまを 1まい たそう'
      } else if (st.mounted) {
        mark = '×'; cls = 'cpNg'
        const rpm = Math.abs(st.rpm)
        const cur = st.rpmFrac ? `1ぷんに ${fstr({ n: Math.abs(st.rpmFrac.n), d: st.rpmFrac.d })}かいてん` : `${fmtPeriod(rpm > 1e-9 ? 1 / rpm : Infinity)}で 1しゅう`
        detail = `いまは ${cur}`
      }
      if (!(st.mounted && st.ok)) allOk = false
      html += `<div class="cpRow ${cls}"><span class="cpMark">${mark}</span>` +
        `<span class="cpName">${HAND_LABEL[k]}</span>` +
        `<span class="cpDetail">${detail}<br><small>${TARGET_TEXT[k]}</small></span></div>`
    }
    if (allOk) {
      html += '<div class="cpDone">🎉 とけい かんせい!すごい!</div>'
      if (!celebrated) {
        celebrated = true
        spawnConfetti(app, 100)
        app.audio.fanfare()
      }
    } else {
      celebrated = false
    }
    el.innerHTML = html
  }

  return { update }
}
