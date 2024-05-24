import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';


let scene;
let groundGeom, groundMate;
let mirrorBack; // reflector
let animation;
let onWindowResize;
let noise3D;
let controls;
let composer, renderPass, bloomPass;
let cloth, clothParticles, constraints = [];
let objectBody;

export function sketch() {
    const p = {
        // objects
        lightSpeed: .2,
        animate: false,
        // ...
        // view
        lookAtCenter: new THREE.Vector3(0, 1, 0),
        cameraPosition: new THREE.Vector3(- 3 + Math.random() * 6, -0.5, -5),
        autoRotate: false,
        autoRotateSpeed: -1,
        camera: 35,
        // ...
        // world
        background: new THREE.Color(0x555555),
        floor: -0.5,
        // cloth parameters
        gravity: -5.0,
        clothSize: 5,
        clothSegments: 20,
        mass: 0.1,
    };

    // other parameters
    let near = 0.2, far = 200;
    let shadowMapWidth = 2048, shadowMapHeight = 2048;

    // CAMERA
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far);
    camera.position.copy(p.cameraPosition);
    camera.lookAt(p.lookAtCenter);

    // WINDOW RESIZE
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = Math.PI / 2 - 0.8;
    controls.maxAzimuthAngle = - Math.PI / 2;
    controls.minAzimuthAngle = Math.PI / 2;
    controls.autoRotate = p.autoRotate;
    controls.autoRotateSpeed = p.autoRotateSpeed;
    controls.target = p.lookAtCenter;

    // SCENE
    scene = new THREE.Scene();
    scene.background = p.background;
    scene.fog = new THREE.Fog(scene.background, 3, 30);
    groundMate = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 1,
        metalness: 0,
        fog: true,
    });

    // REFLECTOR
    let mirrorW = 25;
    let mirrorH = 10;
    mirrorBack = new Reflector(
        new THREE.PlaneGeometry(mirrorW, mirrorH),
        {
            clipBias: 0.003,
            color: new THREE.Color(0x7f7f7f),
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
        });
    mirrorBack.position.y = p.floor + mirrorH / 2;
    mirrorBack.position.z = 3;
    mirrorBack.rotation.y = Math.PI;
    scene.add(mirrorBack);

    // Light below the mirror
    RectAreaLightUniformsLib.init();
    let rectLightIntensity = 2;
    const rectLight = new THREE.RectAreaLight(0xffffff, rectLightIntensity, mirrorW, mirrorH);
    rectLight.position.set(0, p.floor + mirrorH / 2, 3.025);
    scene.add(rectLight);
    const rectLightHelper = new RectAreaLightHelper(rectLight);
    rectLight.add(rectLightHelper);

    // Ground
    groundGeom = new THREE.PlaneGeometry(20, 20);
    let ground = new THREE.Mesh(groundGeom, groundMate);
    ground.position.set(0, p.floor, 0);
    ground.rotation.x = - Math.PI / 2;
    ground.scale.set(100, 100, 100);
    ground.castShadow = false;
    ground.receiveShadow = true;
    scene.add(ground);

    const light = new THREE.DirectionalLight(0xffffff, 10);
    light.position.set(0, 2, -5);
    light.castShadow = true;
    light.shadow.radius = 8;
    light.shadow.camera.near = 2;
    light.shadow.camera.far = 200;
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = shadowMapWidth;
    light.shadow.mapSize.height = shadowMapHeight;
    scene.add(light);

    const lightD = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 3, -3);
    light.target.position.set(0, 0, 0);
    scene.add(lightD);

    // World for cloth animation
    const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, p.gravity, 0)
    });

    // // Cloth
    // const clothGeometry = new THREE.PlaneGeometry(p.clothSize, p.clothSize, p.clothSegments, p.clothSegments);
    // const clothMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    // cloth = new THREE.Mesh(clothGeometry, clothMaterial);
    // cloth.position.set(0, 2, 0); // Position the cloth above the object
    // scene.add(cloth);

    // const restDistance = p.clothSize / p.clothSegments;
    // clothParticles = [];

    // for (let i = 0; i <= p.clothSegments; i++) {
    //     clothParticles.push([]);
    //     for (let j = 0; j <= p.clothSegments; j++) {
    //         const particle = new CANNON.Body({
    //             mass: p.mass,
    //             position: new CANNON.Vec3(
    //                 i * restDistance - p.clothSize / 2,
    //                 2,
    //                 j * restDistance - p.clothSize / 2
    //             ),
    //             shape: new CANNON.Particle(),
    //             velocity: new CANNON.Vec3(0, 0, 0)
    //         });
    //         clothParticles[i].push(particle);
    //         world.addBody(particle);
    //     }
    // }

    // const connectParticles = (i1, j1, i2, j2) => {
    //     const particleA = clothParticles[i1][j1];
    //     const particleB = clothParticles[i2][j2];
    //     const distance = particleA.position.distanceTo(particleB.position);
    //     const constraint = new CANNON.DistanceConstraint(particleA, particleB, distance);
    //     world.addConstraint(constraint);
    //     constraints.push(constraint);
    // };

    // for (let i = 0; i < p.clothSegments; i++) {
    //     for (let j = 0; j < p.clothSegments; j++) {
    //         connectParticles(i, j, i, j + 1);
    //         connectParticles(i, j, i + 1, j);
    //         if (i < p.clothSegments && j < p.clothSegments) {
    //             connectParticles(i, j, i + 1, j + 1);
    //             connectParticles(i + 1, j, i, j + 1);
    //         }
    //     }
    // }

    // // Fix the four corners of the cloth
    // clothParticles[0][0].mass = 0;
    // clothParticles[p.clothSegments][0].mass = 0;
    // clothParticles[0][p.clothSegments].mass = 0;
    // clothParticles[p.clothSegments][p.clothSegments].mass = 0;

    // // Release the corners after 2 seconds
    // setTimeout(() => {
    //     clothParticles[0][0].mass = p.mass;
    //     clothParticles[p.clothSegments][0].mass = p.mass;
    //     clothParticles[0][p.clothSegments].mass = p.mass;
    //     clothParticles[p.clothSegments][p.clothSegments].mass = p.mass;
    // }, 2000);

    // // Initialize the vertices of the cloth
    // const vertices = [];
    // for (let i = 0; i <= p.clothSegments; i++) {
    //     for (let j = 0; j <= p.clothSegments; j++) {
    //         vertices.push(new THREE.Vector3());
    //     }
    // }
    // clothGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3));

    // Load GLB model
    const loader = new GLTFLoader();
    loader.load('./assets/models/cloth/cloth_face.glb', (gltf) => {
        const model = gltf.scene;
        model.position.set(0, 2, -2); // Position the model in front of the mirror
        model.scale.set(2, 2, 2); // Adjust the scale as needed
        scene.add(model);
    }, undefined, (error) => {
        console.error('An error occurred while loading the GLB model:', error);
    });

    // Composer for post-processing
    composer = new EffectComposer(renderer);
    renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 2;
    bloomPass.radius = 0.7;
    composer.addPass(bloomPass);

    const timeStep = 1 / 60;
    let lastCallTime;
    const animate = () => {
        const time = performance.now() / 1000;
        if (!lastCallTime) {
            world.step(timeStep);
        } else {
            const dt = time - lastCallTime;
            world.step(timeStep, dt);
        }
        lastCallTime = time;

        // const positions = cloth.geometry.attributes.position.array;
        // for (let i = 0; i <= p.clothSegments; i++) {
        //     for (let j = 0; i <= p.clothSegments; j++) {
        //         const particle = clothParticles[i][j];
        //         const index = (i * (p.clothSegments + 1) + j) * 3;
        //         positions[index] = particle.position.x;
        //         positions[index + 1] = particle.position.y;
        //         positions[index + 2] = particle.position.z;
        //     }
        // }
        // cloth.geometry.attributes.position.needsUpdate = true;

        controls.update();
        renderer.render(scene, camera);
        composer.render();

        animation = requestAnimationFrame(animate);
    };
    animate();
}

export function dispose() {
    cancelAnimationFrame(animation);
    controls?.dispose();
    groundGeom?.dispose();
    groundMate?.dispose();
    mirrorBack?.dispose();
    cloth?.geometry.dispose();
    cloth?.material.dispose();
    constraints = [];
    let id = window.setTimeout(function () { }, 0);
    while (id--) {
        window.clearTimeout(id);
    }
    composer?.dispose();
    renderPass?.dispose();
    bloomPass?.dispose();
    window?.removeEventListener('resize', onWindowResize);
}
