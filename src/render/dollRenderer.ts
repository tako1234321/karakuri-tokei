// からくり人形の描画。原点=取り付け点(軸の中心 or カム/ラックの上)。
// input: 回転人形は角度(rad)、直動人形は 0..1。

export function drawDoll(
  ctx: CanvasRenderingContext2D,
  doll: string,
  input: number,
  time: number,
): void {
  ctx.save()
  if (doll === 'dancer') drawDancer(ctx, input)
  else if (doll === 'waver') drawWaver(ctx, input)
  else if (doll === 'bower') drawBower(ctx, input)
  else drawCuckoo(ctx, input, time)
  ctx.restore()
}

function head(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, skin = '#ffe0c2'): void {
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  // ほっぺ
  ctx.fillStyle = 'rgba(255,140,140,0.5)'
  ctx.beginPath()
  ctx.arc(x - r * 0.5, y + r * 0.25, r * 0.2, 0, Math.PI * 2)
  ctx.arc(x + r * 0.5, y + r * 0.25, r * 0.2, 0, Math.PI * 2)
  ctx.fill()
  // 目
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(x - r * 0.3, y - r * 0.05, r * 0.11, 0, Math.PI * 2)
  ctx.arc(x + r * 0.3, y - r * 0.05, r * 0.11, 0, Math.PI * 2)
  ctx.fill()
  // くち
  ctx.strokeStyle = '#c46a5a'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.arc(x, y + r * 0.3, r * 0.28, 0.25 * Math.PI, 0.75 * Math.PI)
  ctx.stroke()
}

// 軸の上でくるくる回るダンサー(疑似3D: cosで幅をつぶす)
function drawDancer(ctx: CanvasRenderingContext2D, angle: number): void {
  // 台座
  ctx.fillStyle = '#9a6b3f'
  ctx.beginPath()
  ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2)
  ctx.fill()

  const c = Math.cos(angle)
  const flip = c < 0 ? -1 : 1
  const sq = Math.max(0.25, Math.abs(c))
  ctx.translate(0, -6)
  ctx.scale(sq * flip, 1)

  // スカート
  ctx.fillStyle = '#e26fa0'
  ctx.beginPath()
  ctx.moveTo(0, -58)
  ctx.quadraticCurveTo(34, -14, 24, -4)
  ctx.quadraticCurveTo(0, 4, -24, -4)
  ctx.quadraticCurveTo(-34, -14, 0, -58)
  ctx.fill()
  // うで(両手を上げてポーズ)
  ctx.strokeStyle = '#ffe0c2'
  ctx.lineWidth = 5.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-10, -56)
  ctx.quadraticCurveTo(-30, -72, -22, -88)
  ctx.moveTo(10, -56)
  ctx.quadraticCurveTo(30, -72, 22, -88)
  ctx.stroke()
  head(ctx, 0, -74, 15)
  // かみかざり
  ctx.fillStyle = '#f4c542'
  ctx.beginPath()
  ctx.arc(0, -88, 4.5, 0, Math.PI * 2)
  ctx.fill()
}

// 手をふる子(入力角度に合わせて腕がふれる)
function drawWaver(ctx: CanvasRenderingContext2D, angle: number): void {
  ctx.fillStyle = '#9a6b3f'
  ctx.beginPath()
  ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.translate(0, -6)

  // からだ
  ctx.fillStyle = '#5b8dd9'
  ctx.beginPath()
  ctx.moveTo(-18, 0)
  ctx.quadraticCurveTo(-20, -52, 0, -54)
  ctx.quadraticCurveTo(20, -52, 18, 0)
  ctx.closePath()
  ctx.fill()
  // 左うで(そえたまま)
  ctx.strokeStyle = '#ffe0c2'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-14, -42)
  ctx.lineTo(-24, -18)
  ctx.stroke()
  // 右うで(ふる!)
  const wave = Math.sin(angle) * 0.55
  ctx.save()
  ctx.translate(14, -44)
  ctx.rotate(-0.9 + wave)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -26)
  ctx.stroke()
  ctx.fillStyle = '#ffe0c2'
  ctx.beginPath()
  ctx.arc(0, -30, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  head(ctx, 0, -68, 15)
}

// おじぎ人形(t=0..1 で上体が前にたおれる)
function drawBower(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#9a6b3f'
  ctx.beginPath()
  ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.translate(0, -4)

  // はかま(下半身)
  ctx.fillStyle = '#4a6a4f'
  ctx.beginPath()
  ctx.moveTo(-16, 0)
  ctx.lineTo(-12, -26)
  ctx.lineTo(12, -26)
  ctx.lineTo(16, 0)
  ctx.closePath()
  ctx.fill()

  // 上体(こしでかたむく)
  ctx.save()
  ctx.translate(0, -26)
  ctx.rotate(t * 0.95)
  ctx.fillStyle = '#b04a4a'
  ctx.beginPath()
  ctx.moveTo(-14, 0)
  ctx.quadraticCurveTo(-16, -30, 0, -32)
  ctx.quadraticCurveTo(16, -30, 14, 0)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#ffe0c2'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-11, -22)
  ctx.lineTo(-16, -4)
  ctx.moveTo(11, -22)
  ctx.lineTo(16, -4)
  ctx.stroke()
  head(ctx, 0, -44, 13)
  // ちょんまげ風のぼうし
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(0, -55, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// とびだすことり(はと時計)。t=0..1 で扉が開いて鳥が出てくる。
function drawCuckoo(ctx: CanvasRenderingContext2D, t: number, time: number): void {
  const out = Math.min(1, Math.max(0, t))

  // 小屋
  ctx.fillStyle = '#8a5a2b'
  ctx.fillRect(-34, -58, 68, 58)
  ctx.fillStyle = '#6e4520'
  ctx.beginPath()
  ctx.moveTo(-42, -58)
  ctx.lineTo(0, -86)
  ctx.lineTo(42, -58)
  ctx.closePath()
  ctx.fill()

  // 出入り口(奥)
  ctx.fillStyle = '#3a2812'
  ctx.beginPath()
  ctx.arc(0, -34, 17, Math.PI, 0)
  ctx.rect(-17, -34, 34, 26)
  ctx.fill()

  // ことり(手前にスライドして出てくる)
  const slide = out * 30
  ctx.save()
  ctx.translate(0, -30 - slide * 0.2)
  ctx.scale(0.5 + out * 0.5, 0.5 + out * 0.5)
  if (out > 0.05) {
    // からだ
    ctx.fillStyle = '#f2f2e8'
    ctx.beginPath()
    ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    // はね(出ているあいだパタパタ)
    const flap = out > 0.6 ? Math.sin(time * 16) * 0.6 : 0
    ctx.fillStyle = '#d8d8c8'
    ctx.save()
    ctx.translate(-6, -2)
    ctx.rotate(-0.5 + flap)
    ctx.beginPath()
    ctx.ellipse(-8, 0, 10, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.translate(6, -2)
    ctx.rotate(0.5 - flap)
    ctx.beginPath()
    ctx.ellipse(8, 0, 10, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // あたま
    ctx.fillStyle = '#f2f2e8'
    ctx.beginPath()
    ctx.arc(0, -12, 8, 0, Math.PI * 2)
    ctx.fill()
    // くちばし・目
    ctx.fillStyle = '#f4a83c'
    ctx.beginPath()
    ctx.moveTo(0, -12)
    ctx.lineTo(0 + 9, -9)
    ctx.lineTo(0, -7)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(-3, -13, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // とびら(左右にひらく)
  ctx.fillStyle = '#c98d5a'
  const dw = 17 * (1 - out)
  if (dw > 0.5) {
    ctx.fillRect(-17, -51, dw, 43)
    ctx.fillRect(17 - dw, -51, dw, 43)
  }
}
