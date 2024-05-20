//TEST CLOTH + 3D MODEL

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, groundGeom, groundMate, material, animation, onWindowResize, world, controls, composer, renderPass, bloomPass;
const pieceMaterials = [];
let cloth, clothParticles, constraints = [];
let objectBody;

export function sketch() {
    const p = {
        // start
        fromSky: false,
        slowBuild: true,
        slowBuildDelay: 1,
        pauseAfterBuild: true,
        pauseAfterBuildTime: 20,
         // columns
        columnsNo: 8,
        columnsRadius: 12,
        piecesNo: 11,
        piaceMaxSize: 0.9,
        // view
        lookAtCenter: new THREE.Vector3(Math.random() * -4, 4, Math.random() * 4),
        cameraPosition: new THREE.Vector3(0, 0.5, 0),
        autoRotate: true,
        autoRotateSpeed: -1 + Math.random() * 2,
        camera: 75,
        // bloom
        exposure: 0.5,
        bloomStrength: 2,
        bloomThreshold: 0.2,
        bloomRadius: 0.7,
        // world
        gravity: -5.0,
        floor: -1,
    };

    // other parameters
    let near = 0.2, far = 1000;
    let shadowMapWidth = 2048, shadowMapHeight = 2048;
    let paused = false;

    // CAMERA
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far);
    camera.position.copy(p.cameraPosition);
    camera.position.z = - p.columnsRadius / 2;
    camera.lookAt(p.lookAtCenter);

    // WINDOW RESIZE
    onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(scene.background, 15, 100);
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, p.gravity, 0)
    });

    // POST-PROCESSING
    // composer = new EffectComposer(renderer);
    // renderPass = new RenderPass(scene, camera);
    // composer.addPass(renderPass);
    // bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    // bloomPass.threshold = p.bloomThreshold;
    // bloomPass.strength = p.bloomStrength;
    // bloomPass.radius = p.bloomRadius;
    // composer.addPass(bloomPass);


    // Static ground plane
    groundGeom = new THREE.PlaneGeometry(50, 50);
    groundMate = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1 });
    let ground = new THREE.Mesh(groundGeom, groundMate);
    ground.position.set(0, p.floor, 0);
    ground.rotation.x = - Math.PI / 2;
    ground.scale.set(100, 100, 100);
    ground.castShadow = false;
    ground.receiveShadow = true;
    scene.add(ground);
    const groundBody = new CANNON.Body({
        position: new CANNON.Vec3(0, p.floor, 0),
        mass: 0,
        shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);
    ground.position.copy(groundBody.position);
    ground.quaternion.copy(groundBody.quaternion);

    // LIGHTS
    let lightS = new THREE.SpotLight(0xffffff, 1, 200, Math.PI / 5, 0.1);
    lightS.position.set(0, 50, 0);
    lightS.target.position.set(0, 0, 0);
    lightS.castShadow = true;
    lightS.shadow.camera.near = 5;
    lightS.shadow.camera.far = 200;
    lightS.shadow.bias = 0.0001;
    lightS.shadow.mapSize.width = shadowMapWidth;
    lightS.shadow.mapSize.height = shadowMapHeight;
    scene.add(lightS);

    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(-4, 4, 0);
    light.target.position.set(0, 10, 10);
    scene.add(light);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
    pointLight2.position.set(0, 2, 0);
    scene.add(pointLight2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Reduced intensity
    scene.add(ambientLight);

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 2 + 0.2;
    controls.minPolarAngle = Math.PI / 2 - 0.4;
    controls.autoRotate = p.autoRotate;
    controls.autoRotateSpeed = p.autoRotateSpeed;
    controls.target = p.lookAtCenter;

    // CREATE THE CLOTH
    const clothSize = 7;
    const clothSegments = 40; // Increased resolution
    const clothGeometry = new THREE.PlaneGeometry(clothSize, clothSize, clothSegments, clothSegments);
    const clothMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, side: THREE.DoubleSide 
    });
    cloth = new THREE.Mesh(clothGeometry, clothMaterial);
    cloth.position.set(0, 4, 0); 
    scene.add(cloth);

    const mass = 0.05; // Reduced mass for better interaction
    const restDistance = clothSize / clothSegments;
    clothParticles = [];

    for (let i = 0; i <= clothSegments; i++) {
        clothParticles.push([]);
        for (let j = 0; j <= clothSegments; j++) {
            const particle = new CANNON.Body({
                mass: mass,
                position: new CANNON.Vec3(
                    i * restDistance - clothSize / 2,
                    2,
                    j * restDistance - clothSize / 2
                ),
                shape: new CANNON.Particle(),
                velocity: new CANNON.Vec3(0, 0, 0)
            });
            clothParticles[i].push(particle);
            world.addBody(particle);
        }
    }

    const connectParticles = (i1, j1, i2, j2) => {
        const particleA = clothParticles[i1][j1];
        const particleB = clothParticles[i2][j2];
        const distance = particleA.position.distanceTo(particleB.position);
        const constraint = new CANNON.DistanceConstraint(particleA, particleB, distance);
        world.addConstraint(constraint);
        constraints.push(constraint);
    };

    for (let i = 0; i < clothSegments; i++) {
        for (let j = 0; j < clothSegments; j++) {
            connectParticles(i, j, i, j + 1);
            connectParticles(i, j, i + 1, j);
            if (i < clothSegments && j < clothSegments) {
                connectParticles(i, j, i + 1, j + 1);
                connectParticles(i + 1, j, i, j + 1);
            }
        }
    }

    // Fix the vertices of the cloth
    clothParticles[0][0].mass = 0;
    clothParticles[clothSegments][0].mass = 0;
    clothParticles[0][clothSegments].mass = 0;
    clothParticles[clothSegments][clothSegments].mass = 0;

    // After 2 sec, release the vertices of the cloth
    setTimeout(() => {
        clothParticles[0][0].mass = mass;
        clothParticles[clothSegments][0].mass = mass;
        clothParticles[0][clothSegments].mass = mass;
        clothParticles[clothSegments][clothSegments].mass = mass;
    }, 2000);

    // Initialize the vertices of the cloth
    const vertices = [];
    for (let i = 0; i <= clothSegments; i++) {
        for (let j = 0; j <= clothSegments; j++) {
            vertices.push(new THREE.Vector3());
        }
    }
    clothGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3));

    // LOAD 3D MODEL
    const loader = new GLTFLoader();
    loader.load('./assets/STATUA.glb', function (gltf) {
        const object = gltf.scene;
        object.position.set(0, 0, 0);
        object.scale.set(0.04, 0.04, 0.04);
        scene.add(object);

        // Add physics to the custom 3D model
        const boundingBox = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const boxShape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        objectBody = new CANNON.Body({ mass: 0 });
        objectBody.addShape(boxShape);
        objectBody.position.copy(object.position);
        world.addBody(objectBody);

        // Ensure objectBody is in the correct position
        objectBody.position.set(object.position.x, object.position.y, object.position.z);
    });


    // ANIMATE
    const timeStep = 1 / 60;
    let lastCallTime;
    const animate = () => {
        if (showStats) stats.begin();
        // ANIMATION
        if (!paused) {
            const time = performance.now() / 1000;
            if (!lastCallTime) {
                world.step(timeStep);
            } else {
                const dt = time - lastCallTime;
                world.step(timeStep, dt);
            }
            lastCallTime = time;

            // CANNON
            const positions = cloth.geometry.attributes.position.array;
            for (let i = 0; i <= clothSegments; i++) {
                for (let j = 0; j <= clothSegments; j++) {
                    const particle = clothParticles[i][j];
                    const index = (i * (clothSegments + 1) + j) * 3;
                    positions[index] = particle.position.x;
                    positions[index + 1] = particle.position.y;
                    positions[index + 2] = particle.position.z;
                }
            }
            cloth.geometry.attributes.position.needsUpdate = true;
        }

        controls.update();
        renderer.render(scene, camera);
        // composer.render();
        if (showStats) stats.end();

        animation = requestAnimationFrame(animate);
    };
    animate();
}

export function dispose() {
    cancelAnimationFrame(animation);
    controls?.dispose();
    groundGeom?.dispose();
    groundMate?.dispose();
    pieceGeometry?.dispose();
    material?.dispose();
    for (let i = 0; i < pieceMaterials.length; i++) {
        pieceMaterials[i]?.dispose();
    }
    world = null;
    let id = window.setTimeout(function () { }, 0);
    while (id--) {
        window.clearTimeout(id);
    }
    composer?.dispose();
    renderPass?.dispose();
    window?.removeEventListener('resize', onWindowResize);
}
