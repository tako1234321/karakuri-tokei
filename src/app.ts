import type { AudioEngine } from './audio/audioEngine'
import type { Simulation } from './core/simulation'
import type { Part, PartId } from './core/types'
import type { World } from './core/world'
import type { Camera } from './render/camera'

export interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  color: string; size: number
  rot: number; vr: number
}

export interface App {
  world: World
  sim: Simulation
  camera: Camera
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  audio: AudioEngine
  selectedId: PartId | null
  dragGhostPart: Part | null        // パレットから配置中のパーツ
  previewPartId: PartId | null      // ドラッグ中(スナップ候補のプレビュー用)
  mode: 'free' | 'guide'
  settings: { melody: string }
  particles: Particle[]
  time: number
  dt: number
  karakuriTested: boolean           // ガイドモードの最終ミッション用フラグ
  select: (id: PartId | null) => void
  toast: (msg: string) => void
  requestShow: (hour?: number) => void
}
