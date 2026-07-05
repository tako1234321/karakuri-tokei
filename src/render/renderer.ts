import type { App, Particle } from '../app'
import { CAM_AMP, CAM_R0, camDef, camFollower } from '../core/cam'
import { escStateAt } from '../core/escapement'
import { RACK_H, SNAP_RANGE, dist, maxRadius, rackPitchY, rackTravel, wheelsOf } from '../core/gear'
import { MODULE, isAxle, type AxlePart, type Part } from '../core/types'
import { DIAL_RADIUS } from '../data/dials'
import { dollDef } from '../data/dolls'
import { drawDoll } from './dollRenderer'
import { escapeWheelPath, gearPath, HOLE_R } from './gearPath'
import { drawHand } from './handsRenderer'

const GEAR_COLORS = ['#d9a441', '#c98f4e', '#c67b52', '#b98a3a', '#d4a017', '#caa24f']
const GEAR_DARK = '#7a521e'

function gearColor(teeth: number): string {
  return GEAR_COLORS[teeth % GEAR_COLORS.length]
}

export function draw(app: App): void {
  const { ctx, camera, world, sim } = app
  ctx.setTransform(camera.dpr, 0, 0, camera.dpr, 0, 0)
  ctx.fillStyle = '#f6ecdc'
  ctx.fillRect(0, 0, camera.cssW, camera.cssH)

  camera.apply(ctx)
  drawGrid(app)

  // 下の層から順に描く(文字盤は「まえ」設定なら歯車より前)
  for (const p of world.parts) if (p.kind === 'dial' && !p.front) drawDial(app, p)
  for (const p of world.parts) if (p.kind === 'rack') drawRack(app, p)
  for (const p of world.parts) if (isAxle(p)) drawAxlePart(app, p)
  for (const p of world.parts) if (p.kind === 'cam') drawCam(app, p)
  for (const p of world.parts) if (p.kind === 'dial' && p.front) drawDial(app, p)
  for (const p of world.parts) if (p.kind === 'hand') drawHandPart(app, p)
  for (const p of world.parts) if (p.kind === 'doll') drawDollPart(app, p)

  drawSnapPreview(app)
  drawSelection(app)
  drawJamMarks(app)

  if (app.dragGhostPart) {
    ctx.globalAlpha = 0.55
    drawAnyPart(app, app.dragGhostPart)
    ctx.globalAlpha = 1
  }

  // 画面座標に戻して紙吹雪
  ctx.setTransform(camera.dpr, 0, 0, camera.dpr, 0, 0)
  updateParticles(app)
}

function drawAnyPart(app: App, p: Part): void {
  if (p.kind === 'dial') drawDial(app, p)
  else if (p.kind === 'rack') drawRack(app, p)
  else if (isAxle(p)) drawAxlePart(app, p)
  else if (p.kind === 'cam') drawCam(app, p)
  else if (p.kind === 'hand') drawHandPart(app, p)
  else if (p.kind === 'doll') drawDollPart(app, p)
}

function drawGrid(app: App): void {
  const { ctx, camera } = app
  const tl = camera.screenToWorld(0, 0)
  const br = camera.screenToWorld(camera.cssW, camera.cssH)
  const step = 70
  ctx.fillStyle = 'rgba(138,90,43,0.10)'
  for (let x = Math.floor(tl.x / step) * step; x < br.x; x += step) {
    for (let y = Math.floor(tl.y / step) * step; y < br.y; y += step) {
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// ---------- 軸パーツ(モーター・歯車・振り子・からくりモーター) ----------

function drawAxlePart(app: App, p: AxlePart): void {
  const { ctx, sim } = app
  const st = sim.axles.get(p.id)
  const jammed = st?.jammed ?? false
  const interfering = sim.graph.interfering.has(p.id)

  ctx.save()
  ctx.translate(p.pos.x, p.pos.y)
  if (jammed) {
    // ギギギ…と震える
    const s = Math.sin(app.time * 55 + p.pos.x)
    ctx.translate(s * 1.8, Math.cos(app.time * 47) * 1.8)
  }

  if (p.kind === 'motor' || p.kind === 'karakuriMotor') {
    const isK = p.kind === 'karakuriMotor'
    const r = wheelsOf(p)[0].radius
    ctx.fillStyle = isK ? '#e2679a' : '#5b8dd9'
    ctx.strokeStyle = isK ? '#a94a74' : '#3a5f9e'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, r + 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // ネジ
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4
      ctx.beginPath()
      ctx.arc((r + 12) * Math.cos(a), (r + 12) * Math.sin(a), 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
    // 出力ピニオン
    ctx.save()
    ctx.rotate(st?.angle ?? 0)
    ctx.fillStyle = isK ? '#f7dbe7' : '#dfe8f4'
    ctx.strokeStyle = isK ? '#a94a74' : '#5a6f8f'
    ctx.lineWidth = 1.5
    const path = gearPath(p.teeth)
    ctx.fill(path, 'evenodd')
    ctx.stroke(path)
    ctx.restore()
    axleDot(ctx)
    ctx.font = '15px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(isK ? '♪' : '⚡', 0, 0)
  } else if (p.kind === 'gear') {
    // 大きい方から描く(2段ギア対応)
    const ws = wheelsOf(p)
    const order = [...ws.keys()].sort((a, b) => ws[b].radius - ws[a].radius)
    for (const wi of order) {
      const z = ws[wi].teeth
      ctx.save()
      ctx.rotate(st?.angle ?? 0)
      const path = gearPath(z)
      ctx.fillStyle = wi === 0 ? gearColor(z) : lighten(gearColor(z))
      ctx.strokeStyle = GEAR_DARK
      ctx.lineWidth = 1.6
      ctx.fill(path, 'evenodd')
      ctx.stroke(path)
      ctx.restore()
    }
    axleDot(ctx)
  } else if (p.kind === 'escapement') {
    drawEscapement(app, p)
  }

  if (interfering) {
    ctx.strokeStyle = 'rgba(220,60,60,0.85)'
    ctx.lineWidth = 4
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.arc(0, 0, maxRadius(p) + 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.restore()
}

function lighten(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, (n >> 16) + 36)
  const g = Math.min(255, ((n >> 8) & 255) + 36)
  const b = Math.min(255, (n & 255) + 36)
  return `rgb(${r},${g},${b})`
}

function axleDot(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#4a3520'
  ctx.beginPath()
  ctx.arc(0, 0, HOLE_R - 3, 0, Math.PI * 2)
  ctx.fill()
}

// 振り子+ガンギ車+アンクル(原点=ガンギ車の中心)
function drawEscapement(app: App, p: Extract<AxlePart, { kind: 'escapement' }>): void {
  const { ctx, sim } = app
  const st = sim.axles.get(p.id)
  const esc = escStateAt(sim.clock.simT, p)
  const r = wheelsOf(p)[0].radius
  const pivotY = -(r + 46)

  // 支柱
  ctx.strokeStyle = '#8a6a45'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, pivotY - 10)
  ctx.lineTo(0, 0)
  ctx.stroke()

  // 振り子
  const swing = sim.clock.running && !(st?.jammed) ? esc.pendAngle : 0
  const lenPx = 90 + p.pendulumLength * 200
  ctx.save()
  ctx.translate(0, pivotY)
  ctx.rotate(swing)
  ctx.strokeStyle = '#6e4520'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, lenPx)
  ctx.stroke()
  ctx.fillStyle = '#c9a227'
  ctx.strokeStyle = '#8f7112'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(0, lenPx, 20, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // アンクル(振り子と一体で首をふる)
  ctx.fillStyle = '#a04a3a'
  ctx.strokeStyle = '#6e2f22'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 6)
  ctx.lineTo(-34, 34)
  ctx.lineTo(-26, 44)
  ctx.lineTo(-4, 26)
  ctx.lineTo(4, 26)
  ctx.lineTo(26, 44)
  ctx.lineTo(34, 34)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // ガンギ車
  ctx.save()
  ctx.rotate(st?.angle ?? esc.wheelAngle)
  const path = escapeWheelPath(p.escapeTeeth)
  ctx.fillStyle = '#c9a227'
  ctx.strokeStyle = '#8f7112'
  ctx.lineWidth = 1.6
  ctx.fill(path, 'evenodd')
  ctx.stroke(path)
  ctx.restore()
  axleDot(ctx)

  // 軸受け
  ctx.fillStyle = '#8a6a45'
  ctx.beginPath()
  ctx.arc(0, pivotY, 6, 0, Math.PI * 2)
  ctx.fill()
}

// ---------- 文字盤 ----------

function drawDial(app: App, p: Extract<Part, { kind: 'dial' }>): void {
  const { ctx } = app
  ctx.save()
  ctx.translate(p.pos.x, p.pos.y)
  const R = DIAL_RADIUS

  if (p.style === 'flower') {
    ctx.fillStyle = '#f9c9d8'
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6
      ctx.save()
      ctx.rotate(a)
      ctx.beginPath()
      ctx.ellipse(0, -R + 12, 34, 52, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  ctx.fillStyle = '#fffaf0'
  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#4a3a28'
  ctx.strokeStyle = '#4a3a28'
  if (p.style === 'ticks') {
    for (let i = 0; i < 60; i++) {
      const a = i * Math.PI / 30 - Math.PI / 2
      const major = i % 5 === 0
      ctx.lineWidth = major ? 5 : 2
      const r1 = R - (major ? 26 : 16)
      ctx.beginPath()
      ctx.moveTo(r1 * Math.cos(a), r1 * Math.sin(a))
      ctx.lineTo((R - 8) * Math.cos(a), (R - 8) * Math.sin(a))
      ctx.stroke()
    }
  } else {
    // 時計の伝統で4時は「IIII」と書く
    const ROMAN = ['', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
    const roman = p.style === 'roman'
    ctx.font = roman
      ? `bold 24px Georgia, 'Times New Roman', serif`
      : `bold ${p.style === 'flower' ? 26 : 30}px 'Segoe UI', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = 1; i <= 12; i++) {
      const a = i * Math.PI / 6 - Math.PI / 2
      const r1 = R - 30
      ctx.fillText(roman ? ROMAN[i] : String(i), r1 * Math.cos(a), r1 * Math.sin(a))
    }
    ctx.lineWidth = 2
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue
      const a = i * Math.PI / 30
      ctx.beginPath()
      ctx.moveTo((R - 14) * Math.cos(a), (R - 14) * Math.sin(a))
      ctx.lineTo((R - 8) * Math.cos(a), (R - 8) * Math.sin(a))
      ctx.stroke()
    }
  }

  // 中心の点(針やはぐるまのじくを合わせる目印)
  ctx.fillStyle = '#4a3a28'
  ctx.beginPath()
  ctx.arc(0, 0, 6, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

// ---------- ラック ----------

function drawRack(app: App, p: Extract<Part, { kind: 'rack' }>): void {
  const { ctx } = app
  ctx.save()
  ctx.translate(p.pos.x, p.pos.y)

  // 固定レール
  const guideLen = p.length + rackTravel(p) + 16
  ctx.fillStyle = '#b7a68e'
  ctx.fillRect(-guideLen / 2, RACK_H / 2 - 5, guideLen, 8)

  // スライドする歯つきバー
  ctx.save()
  ctx.translate(p.disp, 0)
  ctx.fillStyle = '#a9814f'
  ctx.strokeStyle = '#6e4f28'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.rect(-p.length / 2, -RACK_H / 2 + 8, p.length, RACK_H - 8)
  ctx.fill()
  ctx.stroke()
  // 歯(ピッチ = 歯車と同じ π×モジュール)
  const pitch = Math.PI * MODULE
  ctx.fillStyle = '#c1975f'
  ctx.beginPath()
  for (let x = -p.length / 2 + 4; x < p.length / 2 - pitch / 2; x += pitch) {
    ctx.moveTo(x, -RACK_H / 2 + 9)
    ctx.lineTo(x + pitch * 0.32, -RACK_H / 2 - 4)
    ctx.lineTo(x + pitch * 0.62, -RACK_H / 2 + 9)
  }
  ctx.fill()
  ctx.restore()
  ctx.restore()
}

// ---------- カム ----------

function drawCam(app: App, p: Extract<Part, { kind: 'cam' }>): void {
  const { ctx, sim } = app
  const angle = sim.axleAngle(p.mountId)
  const def = camDef(p.profile)
  ctx.save()
  ctx.translate(p.pos.x, p.pos.y)

  ctx.fillStyle = 'rgba(244,140,60,0.92)'
  ctx.strokeStyle = '#a85a1e'
  ctx.lineWidth = 2
  ctx.beginPath()
  const N = 72
  for (let i = 0; i <= N; i++) {
    const phi = i / N * Math.PI * 2
    const r = CAM_R0 + CAM_AMP * def.f(phi - angle)
    const x = r * Math.cos(phi)
    const y = r * Math.sin(phi)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  axleDot(ctx)

  // フォロワー(人形が乗っているときだけ棒を描く)
  const hasDoll = app.world.parts.some(d => d.kind === 'doll' && d.mountId === p.id)
  if (hasDoll) {
    const lift = camFollower(p.profile, angle)
    const contactR = CAM_R0 + CAM_AMP * lift
    ctx.strokeStyle = '#7a6a52'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0, -contactR - 4)
    ctx.lineTo(0, -78 + 8)
    ctx.stroke()
    ctx.fillStyle = '#7a6a52'
    ctx.beginPath()
    ctx.arc(0, -contactR - 4, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// ---------- 針 ----------

function drawHandPart(app: App, p: Extract<Part, { kind: 'hand' }>): void {
  const { ctx, sim } = app
  ctx.save()
  ctx.translate(p.pos.x, p.pos.y)
  if (!p.mountId) ctx.globalAlpha = 0.55
  drawHand(ctx, p.design, p.hand, p.mountId ? sim.handAngle(p) : 0.6)
  ctx.restore()
}

// ---------- 人形 ----------

function drawDollPart(app: App, p: Extract<Part, { kind: 'doll' }>): void {
  const { ctx, sim } = app
  ctx.save()
  ctx.translate(p.pos.x, p.pos.y)
  if (!p.mountId) {
    ctx.globalAlpha = 0.75
    // 取り付けヒント
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#8a5a2b'
    ctx.fillText(dollDef(p.doll).hint, 0, 30)
  }
  // 直動人形はカムの持ち上げで上下する
  const def = dollDef(p.doll)
  const input = p.mountId ? sim.dollInput(p) : 0
  if (def.input === 'linear' && p.mountId) {
    const m = app.world.byId(p.mountId)
    if (m && m.kind === 'cam' && p.doll === 'bower') ctx.translate(0, -input * CAM_AMP)
  }
  drawDoll(ctx, p.doll, input, app.time)
  ctx.restore()
}

// ---------- スナップ候補プレビュー / 選択 / ジャム ----------

function drawSnapPreview(app: App): void {
  const part = app.dragGhostPart ?? app.world.byId(app.previewPartId)
  if (!part) return
  const { ctx } = app
  if (isAxle(part)) {
    for (const other of app.world.axles()) {
      if (other.id === part.id) continue
      const d = dist(part.pos, other.pos)
      for (const w1 of wheelsOf(part)) {
        for (const w2 of wheelsOf(other)) {
          if (Math.abs(d - (w1.radius + w2.radius)) < SNAP_RANGE * 1.4) {
            ctx.strokeStyle = 'rgba(70,180,90,0.9)'
            ctx.lineWidth = 4
            ctx.setLineDash([10, 8])
            ctx.beginPath()
            ctx.arc(other.pos.x, other.pos.y, w2.radius, 0, Math.PI * 2)
            ctx.stroke()
            ctx.setLineDash([])
          }
        }
      }
    }
  } else if (part.kind === 'hand' || part.kind === 'cam' || part.kind === 'doll' || part.kind === 'dial') {
    for (const a of app.world.axles()) {
      if (dist(part.pos, a.pos) < 80) {
        ctx.strokeStyle = 'rgba(70,150,220,0.9)'
        ctx.lineWidth = 3
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.arc(a.pos.x, a.pos.y, 26, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
  }
}

export function partHitRadius(p: Part): number {
  if (isAxle(p)) return maxRadius(p)
  if (p.kind === 'rack') return p.length / 2 + 8
  if (p.kind === 'dial') return DIAL_RADIUS
  if (p.kind === 'doll') return 64
  if (p.kind === 'cam') return CAM_R0 + CAM_AMP + 6
  return 44   // hand
}

function drawSelection(app: App): void {
  const p = app.world.byId(app.selectedId)
  if (!p) return
  const { ctx } = app
  ctx.strokeStyle = 'rgba(60,130,230,0.9)'
  ctx.lineWidth = 3.5
  ctx.setLineDash([12, 8])
  ctx.beginPath()
  ctx.arc(p.pos.x, p.pos.y, partHitRadius(p) + 8, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawJamMarks(app: App): void {
  const { ctx, sim, world } = app
  for (const [id, st] of sim.axles) {
    if (!st.jammed) continue
    const p = world.byId(id)
    if (!p || !isAxle(p)) continue
    ctx.save()
    ctx.translate(p.pos.x, p.pos.y - maxRadius(p) - 18)
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#d63c3c'
    ctx.fillText('ギギギ…', 0, 0)
    ctx.restore()
  }
}

// ---------- 紙吹雪 ----------

const CONFETTI_COLORS = ['#e26fa0', '#5b8dd9', '#f4c542', '#6cc07a', '#c98d5a', '#9a7fd1']

export function spawnConfetti(app: App, n = 80): void {
  for (let i = 0; i < n; i++) {
    app.particles.push({
      x: Math.random() * app.camera.cssW,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 60,
      vy: 80 + Math.random() * 120,
      life: 0,
      maxLife: 3.5 + Math.random() * 2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 8,
    })
  }
  if (app.particles.length > 400) app.particles.splice(0, app.particles.length - 400)
}

function updateParticles(app: App): void {
  const { ctx } = app
  const dt = Math.min(0.05, app.dt)
  for (const pt of app.particles) {
    pt.life += dt
    pt.x += (pt.vx + Math.sin(pt.life * 4 + pt.rot) * 30) * dt
    pt.y += pt.vy * dt
    pt.rot += pt.vr * dt
  }
  app.particles = app.particles.filter(pt => pt.life < pt.maxLife && pt.y < app.camera.cssH + 30)
  for (const pt of app.particles) {
    ctx.save()
    ctx.translate(pt.x, pt.y)
    ctx.rotate(pt.rot)
    ctx.globalAlpha = Math.max(0, 1 - pt.life / pt.maxLife)
    ctx.fillStyle = pt.color
    ctx.fillRect(-pt.size / 2, -pt.size / 3, pt.size, pt.size * 0.66)
    ctx.restore()
  }
  ctx.globalAlpha = 1
}
