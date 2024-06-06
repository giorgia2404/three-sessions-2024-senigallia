// TANGO

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

let scene, camera, animation
let light1, light2
let onWindowResize, controls, onPostStep
let world
let noise3D
let directorTimeOut

let composer
let renderPass
let bloomPass



export function sketch() {
    // PARAMETERS
    const p = {
        // camera
        lookAtCenter: new THREE.Vector3(0, -5, 0),
        cameraPosition: new THREE.Vector3(25, 0, 80),
        autoRotate: true,
        autoRotateSpeed: 7,
        camera: 35,
    }

    // CAMERA
    let near = 0.2, far = 1000
    camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth /
        window.innerHeight, near, far)
    camera.position.copy(p.cameraPosition)
    camera.lookAt(p.lookAtCenter)

    // WINDOW RESIZE
    onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.01
    // controls.maxPolarAngle = Math.PI / 2 + 0.2
    // controls.minPolarAngle = Math.PI / 2 - 0.4
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter
    controls.update()

    // SCENE
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.Fog(scene.background, 100, 1000)

    // LIGHT
    const light = new THREE.PointLight(0xffffff, 5 * PI)
    light.position.set(-10, 10, 10)
    light.castShadow = true
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 20
    light.decay = 0
    scene.add(light)

    light1 = new THREE.SpotLight(0xE33117, 5 * PI)
    light1.position.set(10, 5, 5)
    // light1.angle = Math.PI / 4
    // light1.penumbra = 0.5
    light1.decay = 0
    scene.add(light1)

    light2 = new THREE.SpotLight(0xE33117, 3 * PI)
    light2.position.set(-5, 5, 5)
    // light2.angle = Math.PI / 4
    // light2.penumbra = 0.5
    light2.castShadow = true
    light2.shadow.mapSize.width = 1024
    light2.shadow.mapSize.height = 1024
    light2.shadow.camera.near = 0.5
    light2.shadow.camera.far = 20
    light2.decay = 0
    scene.add(light2)

    //CANNON WORD
    world = new CANNON.World()
    world.gravity.set(0, -1, 0) // setting minimal gravity otherwise you lose friction calculations

    // POST-PROCESSING
    composer = new EffectComposer(renderer)
    renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = p.bloomThreshold
    bloomPass.strength = p.bloomStrength
    bloomPass.radius = p.bloomRadius
    composer.addPass(bloomPass)

    //MATERIAL
    //material = new THREE.MeshPhongMaterial({ 
    // color: 0x3300ff, specular:
    // 0x555555, shininess: 30
    // })
    // material = new THREE.MeshStandardMaterial({
    // color: 0xE33117,
    // emissive: 0xE33117,
    // metalness: 0.7,
    // roughness: 0.2
    // })

    // material = new THREE.MeshStandardMaterial({
    // envMap: cubeTextures[0].texture,
    // color: 0xE33117,
    // emissive: 0xE33117,
    // metalness: 0.7,
    // roughness: 0.2,
    // transparent: true, // Abilita la trasparenza
    // opacity: 0.8 // Imposta il livello di trasparenza (0.5 è un esempio, puoi modificarlo come preferisci)
    // });

    const material = new THREE.MeshPhysicalMaterial({
        envMap: cubeTextures[0].texture,
        color: 0xffffff,
        metalness: 0,
        roughness: .1,
        transmission: 1,
        // thickness: 1,
        flatShading: true,
        // specultarIntensity: 1,
        // specularColor: 0xffffff,
        // ior: 1.5,
        tranparent: true
    });

    const sphereCenterRadius = 5
    const sphereCenterGeom = new THREE.SphereGeometry(sphereCenterRadius, 8, 5)
    const sphereCenter = new THREE.Mesh(sphereCenterGeom, material)
    sphereCenter.position.x = 0
    sphereCenter.position.y = 0
    sphereCenter.position.z = 0
    sphereCenter.castShadow = true
    sphereCenter.receiveShadow = true
    scene.add(sphereCenter)
    const sphereCenterShape = new CANNON.Sphere(sphereCenterRadius, 5, 5)
    const sphereCenterBody = new CANNON.Body({ mass: 0 })
    sphereCenterBody.addShape(sphereCenterShape)
    sphereCenterBody.position.x = 0
    sphereCenterBody.position.y = 0
    sphereCenterBody.position.z = 0

    // Add random angular velocity
    const randomAngularVelocity = new CANNON.Vec3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
    )
    sphereCenterBody.angularVelocity.set(randomAngularVelocity.x,
        randomAngularVelocity.y, randomAngularVelocity.z)

    // Set angular damping
    sphereCenterBody.angularDamping = 0.1

    world.addBody(sphereCenterBody)

    const clock = new THREE.Clock()
    let delta

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin()

        delta = Math.min(clock.getDelta(), 0.1)
        world.step(delta)

        // Apply gravitational force to the central sphere
        // v.set(-sphereCenterBody.position.x, -sphereCenterBody.position.y, -sphereCenterBody.position.z).normalize()
        // v.scale(1, sphereCenterBody.force)
        // sphereCenterBody.applyLocalForce(v)
        // sphereCenterBody.force.y += sphereCenterBody.mass


        sphereCenter.position.set(sphereCenterBody.position.x, sphereCenterBody.position.y, sphereCenterBody.position.z)
        sphereCenter.quaternion.set(
            sphereCenterBody.quaternion.x,
            sphereCenterBody.quaternion.y,
            sphereCenterBody.quaternion.z,
            sphereCenterBody.quaternion.w
        )

        bloomPass.strength = MIC.getHighsVol(.1, 1)

        controls.update()
        renderer.render(scene, camera)
        composer.render() // POST-PROCESSING
        if (showStats) stats.end()

        animation = requestAnimationFrame(animate)
    }

    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    camera = null
    light1?.dispose()
    light2?.dispose()
    // world = null
    noise3D = null
    window.removeEventListener('resize', onWindowResize)
}