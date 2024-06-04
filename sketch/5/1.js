// BACKGROUNDS - ALL

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let camera
let scene
let animation
let onWindowResize
let controls
let groundGeom
let groundMate
let noise3D
let rectLight, light, rectLightHelper
let directorTimeOut

export function sketch() {
  // console.log("Sketch launched")

  // PARAMETERS
  const p = {
    // colors
    availableColorsHighlights: [
      // 0xE48CFF, // Violet
      // 0x4DFFFF, // Light blue
      // 0xffffff, // White
      // 0x0000FF, // Blue
      // 0xFFFF00, // Yellow
      // 0xFFF3D6, // Light Yellow
      // 0xFFCFC0, // Pink
      0xFF0000, // Red
      // 0x93FF22, // Light green
      // 0x00CF00, // Dark green
      // 0x000000  // Black
    ],
    availableColors: [
      // 0x532B5F, // Violet
      // 0x9eddec, // Light blue
      // 0xaaaaaa, // White
      // 0x0140A6, // Blue
      // 0xFFC702, // Yellow
      // 0xFED374, // Light Yellow
      // 0xFACDA4, // Pink
      0xE33117, // Red
      // 0x92BE23, // Light green
      // 0x1E841E, // Dark green
      // 0x232323  // Black
    ],
    // view
    lookAtCenter: new THREE.Vector3(0, 0, 0),
    cameraPosition: new THREE.Vector3(-1, 10, 0),
    autoRotate: false,
    autoRotateSpeed: -.05,
    camera: 35,
    // world
    background: new THREE.Color(0xffffff),
    floor: 0,
    // ...
  }

  // select main scene color, random choose for now
  let whichColor = p.availableColors.length * Math.random() | 0
  const color = new THREE.Color(p.availableColors[whichColor])
  const hightLight = new THREE.Color(p.availableColorsHighlights[whichColor])
  p.background = hightLight

  // other parameters
  let near = 0.2, far = 200
  let shadowMapWidth = 2048, shadowMapHeight = 2048

  // CAMERA
  camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
  camera.position.copy(p.cameraPosition)
  camera.lookAt(p.lookAtCenter)

  // WINDOW RESIZE
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onWindowResize)

  // CONTROLS
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enablePan = false
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 5
  controls.maxDistance = 15
  controls.maxPolarAngle = Math.PI
  controls.minPolarAngle = 0
  controls.maxAzimuthAngle = - Math.PI / 2
  controls.minAzimuthAngle = Math.PI / 2
  controls.autoRotate = p.autoRotate
  controls.autoRotateSpeed = p.autoRotateSpeed
  controls.target = p.lookAtCenter

  // SCENE
  scene = new THREE.Scene()
  scene.background = p.background
  scene.fog = new THREE.Fog(scene.background, 10, 30)

  // MATERIALS
  groundMate = new THREE.MeshStandardMaterial({
    color: p.background,
    roughness: .5,
    metalness: .5,
    fog: true,
  })

  // GROUND
  // let's make a ground
  groundGeom = new THREE.PlaneGeometry(20, 20)
  let ground = new THREE.Mesh(groundGeom, groundMate)
  ground.position.set(0, p.floor, 0)
  ground.rotation.x = - Math.PI / 2
  ground.scale.set(100, 100, 100)
  scene.add(ground)

  // LIGHTS
  RectAreaLightUniformsLib.init();
  let rectLightWidth = 3
  let rectLightHeight = 5.5
  let rectLightIntensity = 6 * PI
  rectLight = new THREE.RectAreaLight(hightLight, rectLightIntensity, rectLightWidth, rectLightHeight)
  rectLight.position.set(0, p.floor + rectLightHeight / 2, 0)
  rectLight.rotation.y = Math.PI / 2
  scene.add(rectLight)
  rectLightHelper = new RectAreaLightHelper(rectLight)
  // rectLight.add(rectLightHelper)

  light = new THREE.DirectionalLight(hightLight, 4 * PI)
  light.position.set(0, 2, 5)
  light.decay = 0
  scene.add(light)

  // NOISE
  noise3D = NOISE.createNoise3D()
  const t0 = Math.random() * 10

  // ANIMATE
  const animate = () => {
    if (showStats) stats.begin() // XXX

    // ANIMATION
    const t = t0 + performance.now() * 0.0001
    const t1 = t * p.lightSpeed + 0
    light.position.x = -3 + noise3D(0, t1, 0) * 6
    // ...

    controls.update()
    renderer.render(scene, camera) // RENDER
    if (showStats) stats.end() // XXX

    animation = requestAnimationFrame(animate) // CIAK
  }
  animate()

}

export function dispose() {
  cancelAnimationFrame(animation)
  controls?.dispose()
  groundGeom?.dispose()
  groundMate?.dispose()
  noise3D = null
  rectLight?.dispose();
  rectLightHelper?.dispose();
  light?.dispose();
  // scene = null;
  camera = null;
  // gui?.destroy()
  // ...
  window.removeEventListener('resize', onWindowResize)
}