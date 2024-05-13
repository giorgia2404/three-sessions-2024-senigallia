import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

let scene
let groundMate, cubeMate
let groundGeom, cubeGeom
let animation
let onWindowResize
let noise3D
// let gui
let controls

export function sketch() {
    // console.log("Sketch launched")

    // PARAMETERS
    const p = {
        // colors
        availableColors: [0xff0000, 0x00ff00, 0x0000ff], 
        // objects
        // ...
        // view
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(0, 0.5, -10),
        autoRotate: false,
        autoRotateSpeed: -.05,
        camera: 35,
        // ...
        // world
        background: new THREE.Color(0xffffff), 
        floor: -0.5,
        // ...
    }

    // select main scene color, random choose for now
    let whichColor = p.availableColors[p.availableColors.length * Math.random() | 0]
    console.log(whichColor)
    p.background = new THREE.Color(whichColor)
    
    // other parameters
    let near = 0.2, far = 1000
    let shadowMapWidth = 2048, shadowMapHeight = 2048

    // CAMERA
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
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
    controls.maxPolarAngle = Math.PI / 2 + 0.2
    controls.minPolarAngle = Math.PI / 2 - 0.4
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter

    // SCENE
    scene = new THREE.Scene()
    scene.background = p.background
    scene.fog = new THREE.Fog(scene.background, 10, 30)
    // materials
    cubeMate = new THREE.MeshStandardMaterial({ color: p.background, roughness: 1 })
    groundMate = new THREE.MeshStandardMaterial({ color: p.background, roughness: 1 })

    // GEOMETRIES
    // Cube
    cubeGeom = new THREE.BoxGeometry(.5, 1.5)
    let cube = new THREE.Mesh(cubeGeom, cubeMate)
    scene.add(cube)
    cube.position.set(0, .25, 0)
    cube.castShadow = true
    // let's make a ground
    groundGeom = new THREE.PlaneGeometry(20, 20)
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)

    // LIGHTS
    let lightS = new THREE.SpotLight(0x999999, 1, 0, Math.PI / 5, 0.5)
    lightS.position.set(10, 10, 12)
    lightS.target.position.set(0, 0, 0)
    lightS.castShadow = true
    lightS.shadow.camera.near = 2
    lightS.shadow.camera.far = 200
    lightS.shadow.bias = 0.0001
    lightS.shadow.mapSize.width = shadowMapWidth
    lightS.shadow.mapSize.height = shadowMapHeight
    scene.add(lightS)

    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(-10, 3, 0)
    light.target.position.set(-5, 0, 0)
    scene.add(light)

    // GUI
    // gui = new GUI.GUI()
    // const nameFolder = gui.addFolder('Name of the folder')
    // nameFolder.add(cube.rotation, 'x', 0, Math.PI * 2)
    // nameFolder.open()
    // ...

    // NOISE
    noise3D = NOISE.createNoise3D()
    const t0 = Math.random() * 10

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX

        // ANIMATION
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
    cubeGeom?.dispose()
    cubeMate?.dispose()
    noise3D = null
    // gui?.destroy()
    // ...
    window.removeEventListener('resize', onWindowResize)
}