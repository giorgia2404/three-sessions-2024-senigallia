// Importa Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; //aggiungi orbitcontrols

// SCENE
const scene = new THREE.Scene();

// CAMERA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

// RENDER
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls( camera, renderer.domElement );

// NEONCOLORS 
const neoncolors = [
    0xE48CFF, // Violet
    0x4DFFFF, // Light blue
    0xffffff, // White
    0x0000FF, // Blue
    0xFFFF00, // Yellow
    0xFFF3D6, // Light Yellow
    0xFFCFC0, // Pink
    0xFF0000, // Red
    0x93FF22, // Light green
    0x00CF00, // Dark green
    0x000000  // Black
];

// BASECOLORS 
const colors = [
    0x532B5F, // Violet
    0x9eddec, // Light blue
    0xffffff, // White
    0x0140A6, // Blue
    0xFFC702, // Yellow
    0xFED374, // Light Yellow
    0xFACDA4, // Pink
    0xE33117, // Red
    0x92BE23, // Light green
    0x1E841E, // Dark green
    0x232323  // Black
];

// DESATCOLORS
const desatcolors = [
    0xBDA7C4, // Violet
    0xA3BCC3, // Light blue
    0xF2F2F2, // White
    0x2C5DAB, // Blue
    0xBFA132, // Yellow
    0xBFAE88, // Light Yellow
    0xCFBDAB, // Pink
    0xA34739, // Red
    0x6B8037, // Light green
    0x45631E, // Dark green
    0x3B3B3B  // Black
];

// DARKCOLORS 
const darkcolors = [
    0x46324D, // Violet
    0x1F3C43, // Light blue
    0x9E9E9E, // White
    0x1A2433, // Blue
    0x896930, // Yellow
    0x403726, // Light Yellow
    0x332110, // Pink
    0x4E201E, // Red
    0x3A402B, // Light green
    0x214521, // Dark green
    0x000000  // Black
];


// NEONSPHERES
const neonnumSpheres = 11;
const neonsphereRadius = 1;
const neonspheres = [];
for (let i = 0; i < neonnumSpheres; i++) {
    const neongeometry = new THREE.SphereGeometry(neonsphereRadius, 32, 32);
    const neonmaterial = new THREE.MeshPhongMaterial({ color: neoncolors[i], emissive: neoncolors[i],
        shininess: 200});
    const lightsphere = new THREE.Mesh(neongeometry, neonmaterial);
    lightsphere.position.x = (i - neonnumSpheres / 2) * 2 * neonsphereRadius * 1.1; // Posiziona le sfere vicine l'una all'altra
    lightsphere.position.y = 4
    neonspheres.push(lightsphere);
    scene.add(lightsphere);
}

// BASESPHERES
const numSpheres = 11;
const sphereRadius = 1;
const spheres = [];
for (let i = 0; i < numSpheres; i++) {
    const geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: colors[i],  shininess: 100});
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.x = (i - numSpheres / 2) * 2 * sphereRadius * 1.1; // Posiziona le sfere vicine l'una all'altra
    spheres.push(sphere);
    scene.add(sphere);
}

// DESATSPHERES
const desatnumSpheres = 11;
const desatsphereRadius = 1;
const desatspheres = [];
for (let i = 0; i < desatnumSpheres; i++) {
    const desatgeometry = new THREE.SphereGeometry(desatsphereRadius, 32, 32);
    const desatmaterial = new THREE.MeshPhongMaterial({ color: desatcolors[i],  shininess: 100});
    const newsphere = new THREE.Mesh(desatgeometry, desatmaterial);
    newsphere.position.x = (i - desatnumSpheres / 2) * 2 * desatsphereRadius * 1.1; // Posiziona le sfere vicine l'una all'altra
    newsphere.position.y = -4
    desatspheres.push(newsphere);
    scene.add(newsphere);
}

// DARKSPHERES
const darknumSpheres = 11;
const darksphereRadius = 1;
const darkspheres = [];
for (let i = 0; i < darknumSpheres; i++) {
    const darkgeometry = new THREE.SphereGeometry(darksphereRadius, 32, 32);
    const darkmaterial = new THREE.MeshPhongMaterial({ color: darkcolors[i],  shininess: 100 });
    const othersphere = new THREE.Mesh(darkgeometry, darkmaterial);
    othersphere.position.x = (i - darknumSpheres / 2) * 2 * darksphereRadius * 1.1; // Posiziona le sfere vicine l'una all'altra
    othersphere.position.y = -8
    darkspheres.push(othersphere);
    scene.add(othersphere);
}

// LIGHTS
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const light = new THREE.DirectionalLight( 0xffffff, 3 );
light.position.set( 0, 1, 1 ); //default; light shining from top
scene.add( light );

controls.update(); //controlla Orbit

// RENDER
function animate() {
    requestAnimationFrame(animate);
    
    spheres.forEach(sphere => {
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;
    });

    desatspheres.forEach(newsphere => {
        newsphere.rotation.x += 0.01;
        newsphere.rotation.y += 0.01;
    });

    darkspheres.forEach(othersphere => {
        othersphere.rotation.x += 0.01;
        othersphere.rotation.y += 0.01;
    });

    neonspheres.forEach(lightsphere => {
        lightsphere.rotation.x += 0.01;
        lightsphere.rotation.y += 0.01;
    });

    renderer.render(scene, camera);
}


animate();