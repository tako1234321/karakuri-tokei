import * as THREE from 'three'
import type { Vec2 } from '../core/types'

// 3Dカメラ。普段は正面(azimuth=polar=0)で2D時代と同じ感覚、
// 空白を1本指でドラッグすると盤面のまわりをぐるっと回れる。

export class Camera3 {
  camera = new THREE.PerspectiveCamera(40, 1, 10, 12000)
  target = new THREE.Vector3(0, 0, 40)
  distance = 950
  azimuth = 0   // 左右の回り込み(rad)
  polar = 0     // 上下の見下ろし/見上げ(rad)
  cssW = 1
  cssH = 1
  dpr = 1

  readonly maxAzimuth = Math.PI / 3     // ±60°
  readonly maxPolar = Math.PI / 4       // ±45°

  private ray = new THREE.Raycaster()
  private ndc = new THREE.Vector2()
  private animT = -1
  private animFrom = { az: 0, po: 0 }

  update(dt: number): void {
    if (this.animT >= 0) {
      this.animT = Math.min(1, this.animT + dt / 0.4)
      const e = 1 - Math.pow(1 - this.animT, 3)
      this.azimuth = this.animFrom.az * (1 - e)
      this.polar = this.animFrom.po * (1 - e)
      if (this.animT >= 1) this.animT = -1
    }
    const cp = Math.cos(this.polar)
    this.camera.position.set(
      this.target.x + this.distance * Math.sin(this.azimuth) * cp,
      this.target.y + this.distance * Math.sin(this.polar),
      this.target.z + this.distance * Math.cos(this.azimuth) * cp,
    )
    this.camera.lookAt(this.target)
    this.camera.updateMatrixWorld()
  }

  resize(w: number, h: number, dpr: number): void {
    this.cssW = Math.max(1, w)
    this.cssH = Math.max(1, h)
    this.dpr = Math.min(2, dpr)
    this.camera.aspect = this.cssW / this.cssH
    this.camera.updateProjectionMatrix()
  }

  orbit(dxPx: number, dyPx: number): void {
    this.animT = -1
    this.azimuth = clamp(this.azimuth - dxPx * 0.005, -this.maxAzimuth, this.maxAzimuth)
    this.polar = clamp(this.polar + dyPx * 0.005, -this.maxPolar, this.maxPolar)
  }

  panBy(dxPx: number, dyPx: number): void {
    const wpp = this.worldPerPixel()
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0)
    const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1)
    this.target.addScaledVector(right, -dxPx * wpp)
    this.target.addScaledVector(up, dyPx * wpp)
  }

  dolly(factor: number): void {
    this.distance = clamp(this.distance / factor, 260, 3600)
  }

  worldPerPixel(): number {
    return 2 * this.distance * Math.tan(this.camera.fov * Math.PI / 360) / this.cssH
  }

  resetFront(): void {
    this.animFrom = { az: this.azimuth, po: this.polar }
    this.animT = 0
  }

  raycaster(sx: number, sy: number): THREE.Raycaster {
    this.ndc.set(sx / this.cssW * 2 - 1, -(sy / this.cssH) * 2 + 1)
    this.ray.setFromCamera(this.ndc, this.camera)
    return this.ray
  }

  // 画面座標 → 平面 z=planeZ 上のシミュレーション座標
  screenToWorld(sx: number, sy: number, planeZ = 0): Vec2 {
    const rc = this.raycaster(sx, sy)
    const dz = rc.ray.direction.z
    const t = Math.abs(dz) < 1e-6 ? 0 : (planeZ - rc.ray.origin.z) / dz
    const px = rc.ray.origin.x + rc.ray.direction.x * t
    const py = rc.ray.origin.y + rc.ray.direction.y * t
    return { x: px, y: -py }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}
