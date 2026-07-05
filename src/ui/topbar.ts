import type { App } from '../app'
import { MELODIES } from '../audio/melodies'
import { exportJson, importJson, loadSlot, saveSlot, slotList } from '../storage/saves'
import { button, closeModal, showModal } from './modal'

export function initTopbar(app: App): { update: () => void } {
  const el = document.getElementById('topbar')!

  el.innerHTML = `
    <div class="tbLogo">⚙️ からくりとけい</div>
    <div class="tbClock" id="tbClock">--:--:--</div>
    <button class="btn tbBtn" id="tbPlay" title="うごかす/とめる">⏸</button>
    <div class="tbSpeeds">
      <button class="btn tbSpeed active" data-speed="1">×1</button>
      <button class="btn tbSpeed" data-speed="60">×60</button>
      <button class="btn tbSpeed" data-speed="600">×600</button>
    </div>
    <button class="btn tbBtn" id="tbCheck">✔ チェック</button>
    <button class="btn tbBtn" id="tbShow">♪ ショー</button>
    <button class="btn tbBtn" id="tbMode">🧭 ガイド</button>
    <button class="btn tbBtn" id="tbUndo" title="もどす">↩</button>
    <button class="btn tbBtn" id="tbMenu">☰</button>
  `

  const clockEl = el.querySelector('#tbClock') as HTMLElement
  const playBtn = el.querySelector('#tbPlay') as HTMLButtonElement

  playBtn.addEventListener('click', () => {
    app.sim.clock.running = !app.sim.clock.running
  })

  el.querySelectorAll<HTMLButtonElement>('.tbSpeed').forEach(b => {
    b.addEventListener('click', () => {
      app.sim.clock.speed = parseInt(b.dataset.speed!, 10)
      el.querySelectorAll('.tbSpeed').forEach(x => x.classList.toggle('active', x === b))
    })
  })

  el.querySelector('#tbCheck')!.addEventListener('click', () => {
    const cp = document.getElementById('checkPanel')!
    cp.hidden = !cp.hidden
  })

  el.querySelector('#tbShow')!.addEventListener('click', () => app.requestShow())

  const modeBtn = el.querySelector('#tbMode') as HTMLButtonElement
  modeBtn.addEventListener('click', () => {
    app.mode = app.mode === 'guide' ? 'free' : 'guide'
    modeBtn.textContent = app.mode === 'guide' ? '🎨 じゆうへ' : '🧭 ガイド'
  })

  el.querySelector('#tbUndo')!.addEventListener('click', () => {
    if (!app.world.undo()) app.toast('もどすものが ないよ')
    app.select(null)
  })

  el.querySelector('#tbMenu')!.addEventListener('click', () => openMenu(app))

  const update = () => {
    clockEl.textContent = app.sim.clock.timeString()
    playBtn.textContent = app.sim.clock.running ? '⏸' : '▶'
  }
  return { update }
}

function openMenu(app: App): void {
  showModal('メニュー', body => {
    // ほぞん / よみこみ
    const sec1 = document.createElement('div')
    sec1.className = 'menuSection'
    sec1.innerHTML = '<div class="menuHead">💾 ほぞん と よみこみ</div>'
    slotList().forEach((slot, i) => {
      const row = document.createElement('div')
      row.className = 'menuRow'
      const label = document.createElement('span')
      label.className = 'menuSlotName'
      label.textContent = slot
        ? `${i + 1}: ${slot.name}(${new Date(slot.createdAt).toLocaleDateString('ja-JP')})`
        : `${i + 1}: (あき)`
      row.appendChild(label)
      row.appendChild(button('ほぞん', () => {
        saveSlot(i, app.world, app.settings.melody)
        app.toast(`スロット${i + 1}に ほぞんしたよ!`)
        closeModal()
      }))
      if (slot) {
        row.appendChild(button('よみこみ', () => {
          const d = loadSlot(i)
          if (d) {
            app.world.pushUndo()
            app.world.parts = d.parts
            app.settings.melody = d.melody
            app.select(null)
            app.toast('よみこんだよ!')
          }
          closeModal()
        }))
      }
      sec1.appendChild(row)
    })
    body.appendChild(sec1)

    // きょく
    const sec2 = document.createElement('div')
    sec2.className = 'menuSection'
    sec2.innerHTML = '<div class="menuHead">🎵 せいじの きょく</div>'
    const row2 = document.createElement('div')
    row2.className = 'menuRow'
    for (const m of MELODIES) {
      const b = button(m.label, () => {
        app.settings.melody = m.key
        row2.querySelectorAll('button').forEach(x => x.classList.toggle('active', x.textContent === m.label))
      })
      if (app.settings.melody === m.key) b.classList.add('active')
      row2.appendChild(b)
    }
    sec2.appendChild(row2)
    body.appendChild(sec2)

    // おと
    const sec3 = document.createElement('div')
    sec3.className = 'menuSection'
    sec3.innerHTML = '<div class="menuHead">🔊 おと</div>'
    const sndBtn = button(app.audio.enabled ? 'おと ON' : 'おと OFF', () => {
      app.audio.setEnabled(!app.audio.enabled)
      sndBtn.textContent = app.audio.enabled ? 'おと ON' : 'おと OFF'
    })
    sec3.appendChild(sndBtn)
    body.appendChild(sec3)

    // かきだし / よみこみ(JSON)
    const sec4 = document.createElement('div')
    sec4.className = 'menuSection'
    sec4.innerHTML = '<div class="menuHead">📤 さくひんの かきだし・うけとり</div>'
    const ta = document.createElement('textarea')
    ta.className = 'menuTextarea'
    ta.placeholder = 'ここに さくひんデータを はりつけてね'
    const row4 = document.createElement('div')
    row4.className = 'menuRow'
    row4.appendChild(button('かきだす', () => {
      ta.value = exportJson(app.world, app.settings.melody)
      ta.select()
      try { void navigator.clipboard.writeText(ta.value) } catch { /* */ }
      app.toast('コピーしたよ!メモちょうなどに はっておいてね')
    }))
    row4.appendChild(button('よみこむ', () => {
      const d = importJson(ta.value)
      if (!d) { app.toast('よみこめなかった… データを たしかめてね'); return }
      app.world.pushUndo()
      app.world.parts = d.parts
      app.settings.melody = d.melody
      app.select(null)
      closeModal()
      app.toast('よみこんだよ!')
    }))
    sec4.append(row4, ta)
    body.appendChild(sec4)

    // ぜんぶけす
    const sec5 = document.createElement('div')
    sec5.className = 'menuSection'
    sec5.appendChild(button('🧹 ばんめんを ぜんぶけす', () => {
      if (confirm('ほんとうに ぜんぶけす?(↩で もどせるよ)')) {
        app.world.pushUndo()
        app.world.parts = []
        app.select(null)
        closeModal()
      }
    }))
    body.appendChild(sec5)

    // つかいかた
    const sec6 = document.createElement('div')
    sec6.className = 'menuSection'
    sec6.innerHTML = `
      <div class="menuHead">📖 つかいかた</div>
      <div class="menuHelp">
        ・ひだりの パーツを ばんめんに ドラッグしておこう<br>
        ・はぐるまどうしを ちかづけると かみあうよ<br>
        ・はり・カム・にんぎょうは はぐるまのじくに のせよう<br>
        ・2ほんゆびで ズーム、ゆびドラッグで うごかせるよ<br>
        ・「×60」「×600」で じかんを はやおくり!<br>
        ・まいしょうじ(0ふん)に メロディが ながれて からくりが うごくよ
      </div>`
    body.appendChild(sec6)
  })
}
