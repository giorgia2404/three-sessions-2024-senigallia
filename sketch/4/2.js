//TEST CLOTH + 3D MODEL

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, animation, onWindowResize, controls
let groundGeom
let groundMate, clothMaterial, mirrorMate
let world
let cloth, clothParticles, constraints = []
// let objectBody

export function sketch() {
    const p = {
        // view
        lookAtCenter: new THREE.Vector3(0, 0, 0),
        cameraPosition: new THREE.Vector3(0, 4, -20),
        autoRotate: false,
        autoRotateSpeed: -1 + Math.random() * 2,
        camera: 48,
        // world
        background: new THREE.Color(0x000000),
        clothMass: 1,
        gravity: -9.75,
        floor: -7,
    };

    // other parameters
    let near = 0.2, far = 1000;
    let shadowMapWidth = 2048, shadowMapHeight = 2048;
    let paused = false;

    // CAMERA
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
    camera.position.copy(p.cameraPosition)
    camera.lookAt(p.lookAtCenter)

    // WINDOW RESIZE
    onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // SCENE
    scene = new THREE.Scene()
    scene.background = p.background
    scene.fog = new THREE.Fog(scene.background, 10, 50)
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, p.gravity, 0)
    });


    // Static ground plane
    // groundGeom = new THREE.PlaneGeometry(50, 50);
    // groundMate = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1 });
    // let ground = new THREE.Mesh(groundGeom, groundMate);
    // ground.position.set(0, p.floor, 0);
    // ground.rotation.x = - Math.PI / 2;
    // ground.scale.set(100, 100, 100);
    // ground.castShadow = false;
    // ground.receiveShadow = true;
    // scene.add(ground);
    // const groundBody = new CANNON.Body({
    //     position: new CANNON.Vec3(0, p.floor, 0),
    //     mass: 0,
    //     shape: new CANNON.Plane(),
    // });
    // groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    // groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    // world.addBody(groundBody);
    // ground.position.copy(groundBody.position);
    // ground.quaternion.copy(groundBody.quaternion);

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
    const cWidth = 7, cHeight = 7
    const cResX = 20, cResY = 20

    const clothGeometry = new THREE.PlaneGeometry(cWidth, cHeight, cResX, cResY)
    //    clothMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    mirrorMate = new THREE.MeshPhongMaterial({
        color: 0x444444,
        envMap: cubeTextures[0].texture,
        side: THREE.DoubleSide,
        // combine: THREE.addOperation,
        reflectivity: 1,
        // specular: 0x999999,
        fog: false
    })

    cloth = new THREE.Mesh(clothGeometry, mirrorMate)
    cloth.position.set(0, p.floor + 0.5 + cHeight, 0)
    cloth.castShadow = true
    cloth.receiveShadow = true
    scene.add(cloth)

    const restDistanceX = cWidth / cResX
    const restDistanceY = cHeight / cResY
    clothParticles = []
    const mass = p.clothMass

    const connectParticles = (x1, y1, x2, y2) => {
        const particleA = clothParticles[x1][y1];
        const particleB = clothParticles[x2][y2];
        const distance = particleA.position.distanceTo(particleB.position);
        const constraint = new CANNON.DistanceConstraint(particleA, particleB, distance);
        world.addConstraint(constraint);
        constraints.push(constraint);
    }

    for (let x = 0; x <= cResX; x++) {
        clothParticles.push([])
        for (let y = 0; y <= cResY; y++) {
            const particle = new CANNON.Body({
                mass: y === cResY ? 0 : mass,
                // mass: y === 0 && x === 0 || y === cResY && x === 0 ? 0 : mass,
                // mass: y === cResY && x === cResX || y === cResY && x === 0 ? 0 : mass,
                position: new CANNON.Vec3(
                    x * restDistanceX - cWidth / 2,
                    2,
                    y * restDistanceY - cHeight / 2
                ),
                shape: new CANNON.Particle(),
                velocity: new CANNON.Vec3(0, 0, 0),
                linearDamping: .5
            });

            clothParticles[x].push(particle);
            world.addBody(particle);
        }
    }

    for (let x = 0; x < cResX; x++) {
        for (let y = 0; y < cResY; y++) {
            connectParticles(x, y, x, y + 1);
            connectParticles(x, y, x + 1, y);
            if (x === cResX - 1 && y < cResY) {
                connectParticles(x, y, x + 1, y + 1);
                connectParticles(x + 1, y, x, y + 1);
            }
        }
    }

    // Initialize the vertices of the cloth
    const vertices = [];
    for (let x = 0; x <= cResX; x++) {
        for (let y = 0; y <= cResY; y++) {
            vertices.push(new THREE.Vector3());
        }
    }
    clothGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3));

    // LOAD 3D MODEL
    // const loader = new GLTFLoader();
    // loader.load('./assets/STATUA.glb', function (gltf) {
    //     const object = gltf.scene;
    //     object.position.set(0, 0, 0);
    //     object.scale.set(0.04, 0.04, 0.04);
    //     scene.add(object);

    //     // Add physics to the custom 3D model
    //     const boundingBox = new THREE.Box3().setFromObject(object);
    //     const size = new THREE.Vector3();
    //     boundingBox.getSize(size);
    //     const boxShape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    //     objectBody = new CANNON.Body({ mass: 0 });
    //     objectBody.addShape(boxShape);
    //     objectBody.position.copy(object.position);
    //     world.addBody(objectBody);

    //     // Ensure objectBody is in the correct position
    //     objectBody.position.set(object.position.x, object.position.y, object.position.z);
    // });

    const light = new THREE.DirectionalLight(0xffffff, 10)
    light.position.set(0, 2, -5)
    light.target = cloth
    light.castShadow = true
    light.shadow.radius = 8
    light.shadow.camera.near = 2
    light.shadow.camera.far = 200
    light.shadow.bias = 0.0001
    light.shadow.mapSize.width = shadowMapWidth
    light.shadow.mapSize.height = shadowMapHeight
    scene.add(light)
    // const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    // scene.add(lightHelper);

    const lightD = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(0, 3, -3)
    light.target.position.set(0, 0, 0)
    scene.add(lightD)
    // const pointLight = new THREE.PointLight(0xffffff, 2)
    // pointLight.position.set(20, 20, 20)
    // scene.add(pointLight)
    // const pointLight2 = new THREE.PointLight(0xffffff, .1)
    // pointLight2.position.set(-30, 20, -20)
    // scene.add(pointLight2)
    // const ambientLight = new THREE.AmbientLight(0xffffff)
    // scene.add(ambientLight)


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
            for (let x = 0; x <= cResX; x++) {
                for (let y = 0; y <= cResY; y++) {
                    const particle = clothParticles[x][y];
                    const index = (x * (cResX + 1) + y) * 3; // xxx
                    positions[index] = particle.position.x;
                    positions[index + 1] = particle.position.y;
                    positions[index + 2] = particle.position.z;
                }
            }
            cloth.geometry.attributes.position.needsUpdate = true;
        }

        controls.update();
        renderer.render(scene, camera);
        if (showStats) stats.end();

        animation = requestAnimationFrame(animate);
    };
    animate();
}

export function dispose() {
    cancelAnimationFrame(animation);
    controls?.dispose();
    clothMaterial?.dispose();
    mirrorMate?.dispose();
    groundGeom?.dispose();
    groundMate?.dispose();
    world = null;
    window?.removeEventListener('resize', onWindowResize);
}
