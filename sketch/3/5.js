import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

let scene
let groundMate
let groundGeom
let animation
let onWindowResize
let gui
let controls

//

export function sketch() {
    // console.log("Sketch launched")

    // PARAMETERS
    const p = {
        // objects
        // ...
        // view
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(0, 1, -10),
        autoRotate: true,
        autoRotateSpeed: -.05,
        camera: 35,
        // ...
        // world
        background: new THREE.Color(0x333333),
        floor: 0,
        // ...
    }

    // CAMERA
    let near = 0.2, far = 200
    let shadowMapWidth = 2048, shadowMapHeight = 2048

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
    // controls.minDistance = 10
    // controls.maxDistance = 25
    controls.maxPolarAngle = Math.PI / 2 + 0.2
    controls.minPolarAngle = Math.PI / 2 - 0.4
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter
    controls.update()

    // SCENE
    scene = new THREE.Scene()
    scene.background = p.background
    scene.fog = new THREE.Fog(scene.background, 10, 50)
    // materials
    groundMate = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 1,
        metalness: 0,
        fog: true,
    })
    // ...

    // GEOMETRIES
    // let's make a ground
    groundGeom = new THREE.PlaneGeometry(20, 20)
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)
    // ...

    const video = document.getElementById('video');
    video.crossOrigin = "anonymous";
    video.playsinline = "true";
    video.loop = 'true';
    video.play();
    const texture = new THREE.VideoTexture(video);
    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.decay = 0;
    spotLight.position.set(0, 10, 0);
    spotLight.map = texture
    // spotLight.castShadow = true;
    // spotLight.shadow.mapSize.width = 1024;
    // spotLight.shadow.mapSize.height = 1024;
    // spotLight.shadow.camera.near = 500;
    // spotLight.shadow.camera.far = 4000;
    // spotLight.shadow.camera.fov = 30;
    scene.add(spotLight);
    const spotlightHelper = new THREE.DirectionalLightHelper(spotLight, 5);
    // scene.add(spotlightHelper);

    const light = new THREE.DirectionalLight(0xffffff, .4)
    light.position.set(0, 2, 10)
    // light.target = cube
    light.castShadow = true
    light.shadow.radius = 8
    light.shadow.camera.near = 2
    light.shadow.camera.far = 200
    light.shadow.bias = 0.0001
    light.shadow.mapSize.width = shadowMapWidth
    light.shadow.mapSize.height = shadowMapHeight
    scene.add(light)
    // ...
    // scene.add(a)
    // scene.add(b)
    // scene.add(c)

    // GUI
    // gui = new GUI.GUI()
    // const nameFolder = gui.addFolder('Name of the folder')
    // nameFolder.add(cube.rotation, 'x', 0, Math.PI * 2)
    // nameFolder.open()
    // ...

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX
        controls.update()

        // ANIMATION
        // ...

        renderer.render(scene, camera) // RENDER
        if (showStats) stats.end() // XXX

        animation = requestAnimationFrame(animate) // CIAK
    }
    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    // geometry?.dispose()
    // material?.dispose()
    // gui?.destroy()
    // ...
    window.removeEventListener('resize', onWindowResize)
}