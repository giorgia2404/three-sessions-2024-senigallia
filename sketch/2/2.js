
// Planets + DiffisionMap + Noise
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { LoopSubdivision } from 'three-subdivide'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';



let scene
let geometry, groundGeom, parentGeometry
let material, material2, groundMate
let reflectionCube, dispMap
let animation
let onWindowResize
let noise3D
let controls
let composer
let bloomPass

export function sketch() {
    // console.log("Sketch launched")

    const p = {
        // planets 
        parentScale: 3,
        childScale: 1,
        parentPos: new THREE.Vector3(0, -3.2, 0),
        childPos: new THREE.Vector3(6, 1.5, 0),
        parentSpeed: 0.5,
        childSpeed: 1,
        parentRotationSpeed: 0.002,
        childLight: false,
        // view
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(Math.random() * -2, -3, 1),
        autoRotate: false,
        autoRotateSpeed: -0.1,
        camera: 35, 
        // world
        floor: -5,
    }

    // other parameters
    let near = 0.2, far = 1000
    let shadowMapWidth = 2048, shadowMapHeight = 2048

    // CAMERA
    let camera = new THREE.PerspectiveCamera(-5, window.innerWidth / window.innerHeight, near, far)
    //camera.position.copy(p.cameraPosition)
    camera.lookAt(p.lookAtCenter)

     

    // WINDOW RESIZE
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        composer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onWindowResize)

    

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 10
    controls.maxDistance = 25
    controls.maxPolarAngle = Math.PI / 2 + 0.2
    controls.minPolarAngle = Math.PI / 2 - 0.4
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter

    // SCENE
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
   // scene.fog = new THREE.Fog(scene.background, 5, 100)
    geometry = new THREE.SphereGeometry(1, 32, 32)

    // child
    let child
    material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        //envMap: cubeTextures[4].texture,
        reflectivity: 1.0,
        transmission: 1.0,
        roughness: 0.0,
        metalness: 0.2,
        clearcoat: 0.2,
        clearcoatRoughness: 0.0,
        ior: 1.5,
        thickness: 4,
        //fog: false,
        side: THREE.DoubleSide
    })
    
    // parent
    const iterations = 4
    parentGeometry = LoopSubdivision.modify(geometry, iterations, {
        split: false,
        uvSmooth: false,
        preserveEdges: false,
        flatOnly: false,
        maxTriangles: 5000
    })
    mergeVertices(parentGeometry)
    let parent
    dispMap = textures[0].texture, 
    material2 = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF, 
        color: 0x9c9c9c,
        opacity: 0.5 ,
        transparent: true,
        map: textures[1].texture,
        displacementMap: dispMap,
        displacementScale: 0.02,
        displacementBias: 0.0,
        bumpMap: dispMap,
        bumpScale: 0.06,
        //roughness: .06,
      
       
    })
    dispMap.wrapS = dispMap.wrapT = THREE.RepeatWrapping
    dispMap.repeat.set(1, 1)
    parent = new THREE.Mesh(parentGeometry, material2)
    parent.position.y = -3
    parent.position.x = -3
    parent.scale.set(p.parentScale, p.parentScale, p.parentScale)
    parent.castShadow = true
    parent.receiveShadow = true
    scene.add(parent)
    // LIGHTS
    
    const ambientLight = new THREE.AmbientLight(0xffffff)
    scene.add(ambientLight)



   // NOISE
    noise3D = NOISE.createNoise3D()
    const t0 = Math.random() * 10

    function initPostProcessing() {
        const renderPass = new RenderPass(scene, camera);

        const bloomParams = {
            exposure: 1,
            bloomStrength: 1,
            bloomThreshold: 0,
            bloomRadius: 2.5
        };
        bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            bloomParams.bloomStrength,
            bloomParams.bloomRadius,
            bloomParams.bloomThreshold
        );

        composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);
    }

    initPostProcessing();



    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX

        const t = t0 + performance.now() * 0.0001

        // ANIMATION
        if (parent) {
            const t1 = t * p.parentSpeed
            parent.position.x = p.parentPos.x + noise3D(0, t1, 0) * .2
            parent.position.y = p.parentPos.y + noise3D(t1 + 4, 0, 0) * .3
            parent.position.z = p.parentPos.z + noise3D(0, 0, t1 + 8) * .1
            parent.rotation.y += noise3D(0, 0, t + 10) * p.parentRotationSpeed
        }
        if (child) {
            const t2 = t * p.childSpeed + 10
            child.position.x = p.childPos.x + noise3D(0, t2, 0) * .5
            child.position.y = p.childPos.y + noise3D(t2 + 4, 0, 0) * 1.5
            child.position.z = p.childPos.z + noise3D(0, 0, t2 + 8) * .4
            if (p.childLight) pointLight.position.copy(child.position)
        }
        // ...
 
        controls.update()
        //renderer.render(scene, camera) // RENDER
        composer.render();
        if (showStats) stats.end() // XXX
   

        animation = requestAnimationFrame(animate) // CIAK
    }
    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    geometry?.dispose()
    parentGeometry?.dispose()
    groundGeom?.dispose()
    material?.dispose()
    material2?.dispose()
    groundMate?.dispose()
    reflectionCube?.dispose()
    dispMap?.dispose()
    noise3D = null
    window.removeEventListener('resize', onWindowResize)
}