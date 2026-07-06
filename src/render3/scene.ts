import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { PLATE_Z } from './space'
import { brassPlate, woodDark } from './materials'

export interface SceneHandles {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  partsRoot: THREE.Group
  overlayRoot: THREE.Group
}

export function createScene(canvas: HTMLCanvasElement): SceneHandles {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf2e4cb)

  // 金属の反射に効く環境マップ(外部アセット不要)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.55
  pmrem.dispose()

  scene.add(new THREE.HemisphereLight(0xfff7ea, 0x6e5230, 0.55))
  const dir = new THREE.DirectionalLight(0xfff2dd, 1.0)
  dir.position.set(400, 550, 800)
  scene.add(dir)

  // 背景の壁と、こげ茶の木の飾り台(真鍮の歯車が映えるよう暗めに)
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(12000, 9000),
    new THREE.MeshStandardMaterial({ color: 0xe6d0a8, roughness: 0.95, metalness: 0 }),
  )
  wall.position.z = -80
  scene.add(wall)

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(1700, 1150, 10),
    new THREE.MeshStandardMaterial({ color: 0x6b4a26, roughness: 0.75, metalness: 0.05 }),
  )
  plate.position.z = PLATE_Z
  scene.add(plate)

  // 飾り台のふち(真鍮)
  const rim = new THREE.Mesh(new THREE.BoxGeometry(1760, 1210, 6), brassPlate)
  rim.position.z = PLATE_Z - 4
  scene.add(rim)

  // 地板のかざりネジ(四隅)
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 8, 16), brassPlate)
    screw.rotation.x = Math.PI / 2
    screw.position.set(sx * 800, sy * 525, PLATE_Z + 6)
    scene.add(screw)
  }

  const partsRoot = new THREE.Group()
  const overlayRoot = new THREE.Group()
  scene.add(partsRoot, overlayRoot)

  return { renderer, scene, partsRoot, overlayRoot }
}
