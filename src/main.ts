import './style.css'
import { registerSW } from 'virtual:pwa-register'
import type { App } from './app'
import { AudioEngine } from './audio/audioEngine'
import { melodyByKey } from './audio/melodies'
import { pitchRadius } from './core/gear'
import { Simulation } from './core/simulation'
import { World, uid } from './core/world'
import { gearPath } from './render/gearPath'
import { Camera3 } from './render3/camera3'
import { spawnConfetti } from './render3/effectsOverlay'
import { draw3, initRender3, resize3 } from './render3/renderer3'
import { loadSlot, saveSlot, wasMigrated } from './storage/saves'
import { initCheckPanel } from './ui/checkPanel'
import { initGuide } from './ui/guide'
import { initInspector } from './ui/inspector'
import { initPalette } from './ui/palette'
import { initPointer } from './ui/pointer'
import { initTopbar } from './ui/topbar'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const overlay = document.getElementById('overlay') as HTMLCanvasElement
const overlayCtx = overlay.getContext('2d')!
const world = new World()
const sim = new Simulation(world)
const camera = new Camera3()
const audio = new AudioEngine()

// 針を同軸スタックに乗せるとき「めあての速さの軸」を優先できるようにする
world.rpmFracOf = id => sim.axles.get(id)?.rpmFrac ?? null

const app: App = {
  world, sim, camera, canvas, overlayCtx, audio,
  selectedId: null,
  dragGhostPart: null,
  previewPartId: null,
  mode: 'free',
  settings: { melody: 'westminster' },
  particles: [],
  time: 0,
  dt: 0.016,
  karakuriTested: false,
  select: id => { app.selectedId = id; inspector.refresh() },
  toast,
  requestShow,
}

// ---------- トースト / バナー ----------

function toast(msg: string): void {
  const t = document.createElement('div')
  t.className = 'toast'
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.classList.add('show'), 10)
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400) }, 2600)
}

const bannerEl = document.getElementById('banner')!
let bannerUntil = 0
function banner(text: string, dur: number): void {
  bannerEl.textContent = text
  bannerEl.hidden = false
  bannerUntil = app.time + dur
}

// ---------- 正時ショー ----------

function requestShow(hour?: number): void {
  const { h } = sim.clock.hms()
  const strikes = hour ?? (h % 12 === 0 ? 12 : h % 12)
  const dur = audio.playChime(melodyByKey(app.settings.melody), strikes)
  sim.startShow(dur)
  banner(`♪ ${strikes}じの からくりショー ♪`, dur)
  spawnConfetti(app, 90)
  // ガイドモードの最終ミッション: からくりモーター+にんぎょうでショーをした?
  const hasK = world.parts.some(p =>
    p.kind === 'karakuriMotor' && sim.graph.meshes.some(m => m.a === p.id || m.b === p.id))
  const hasDoll = world.parts.some(p => p.kind === 'doll' && p.mountId)
  if (hasK && hasDoll) app.karakuriTested = true
}

sim.clock.onHour = h => requestShow(h)
sim.onTick = () => audio.tick()
sim.onCuckoo = () => audio.cuckoo()

// ---------- UI ----------

initPalette(app)
initPointer(app)
const inspector = initInspector(app)
const topbar = initTopbar(app)
const checkPanel = initCheckPanel(app)
const guide = initGuide(app)
initRender3(app)

// ---------- 初期シーン ----------

const auto = loadSlot('auto')
if (auto && auto.parts.length > 0) {
  world.parts = auto.parts
  app.settings.melody = auto.melody
  if (wasMigrated()) {
    setTimeout(() => toast('ふるい さくひんを あたらしいかたちに なおしたよ'), 1600)
  }
} else {
  world.add({ kind: 'motor', id: uid(), pos: { x: -170, y: 40 }, teeth: 12, rpm: 1, layer: 0 })
  world.add({
    kind: 'gear', id: uid(),
    pos: { x: -170 + pitchRadius(12) + pitchRadius(40), y: 40 },
    wheels: [40],
    layer: 0,
  })
}

// ---------- タイトル画面 ----------

const titleEl = document.getElementById('titleScreen')!
const appEl = document.getElementById('app')!

function titleGearAnim(): void {
  const c = document.getElementById('titleGear') as HTMLCanvasElement | null
  if (!c) return
  const tctx = c.getContext('2d')!
  const path = gearPath(20)
  const tick = (now: number) => {
    if (!titleEl.isConnected) return
    tctx.setTransform(1, 0, 0, 1, 0, 0)
    tctx.clearRect(0, 0, c.width, c.height)
    tctx.translate(80, 80)
    tctx.rotate(now / 1400)
    tctx.fillStyle = '#d9a441'
    tctx.strokeStyle = '#7a521e'
    tctx.lineWidth = 2
    tctx.fill(path, 'evenodd')
    tctx.stroke(path)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
titleGearAnim()

document.getElementById('startBtn')!.addEventListener('click', () => {
  audio.unlock()   // iOSの音声制限はユーザー操作で解除する
  try { void navigator.storage?.persist?.() } catch { /* */ }
  titleEl.remove()
  appEl.hidden = false
  resize3(app)
})

window.addEventListener('resize', () => {
  if (!appEl.hidden) resize3(app)
})

// iOSでまれに起きるWebGLコンテキストロストからの復帰
canvas.addEventListener('webglcontextlost', e => {
  e.preventDefault()
  saveSlot('auto', world, app.settings.melody)   // 作業内容を守ってから
  toast('がめんを なおしてるよ…')
})
canvas.addEventListener('webglcontextrestored', () => {
  location.reload()
})

// iOS Safariの「もどる」エッジスワイプ対策:
// 画面左端(32px)から始まるタッチはブラウザに渡さない。
// パーツのドラッグはPointer Eventsで動くので影響を受けない。
document.addEventListener('touchstart', e => {
  const t = e.touches[0]
  if (t && t.clientX < 32) e.preventDefault()
}, { passive: false })

// iOS Safariの「ページ全体ズーム」対策:
// ピンチがブラウザのズームとして効くと、パレットが画面外に出たまま
// リロード後も戻らなくなる。盤面のズームはPointer Eventsで別処理なので、
// ブラウザ側のズームジェスチャーは丸ごと止める。
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false })
document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false })

// キーボード表示や回転でスクロール位置がずれたら元に戻す
window.visualViewport?.addEventListener('resize', () => {
  window.scrollTo(0, 0)
  if (!appEl.hidden) resize3(app)
})
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    window.scrollTo(0, 0)
    if (!appEl.hidden) resize3(app)
  }, 300)
})

// ---------- メインループ ----------

let lastT = performance.now()
let autosaveAcc = 0

function frame(now: number): void {
  const dt = Math.min(0.1, (now - lastT) / 1000)
  lastT = now
  if (!appEl.hidden) {
    app.dt = dt
    app.time += dt
    if (canvas.width === 0) resize3(app)
    sim.update(dt)
    draw3(app)
    topbar.update()
    checkPanel.update()
    guide.update()
    if (app.time > bannerUntil) bannerEl.hidden = true
    autosaveAcc += dt
    if (autosaveAcc > 8) {
      autosaveAcc = 0
      saveSlot('auto', world, app.settings.melody)
    }
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

// 動作確認用(開発時のみ意味を持つ)
;(window as unknown as { __app: App }).__app = app

// ---------- PWA(こうしん通知) ----------

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('あたらしいバージョンが あるよ!こうしんする?')) void updateSW(true)
  },
})
