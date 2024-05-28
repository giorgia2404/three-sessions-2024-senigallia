

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene
let animation
let clock, mixer, actions, activeAction, previousAction;
let model;
let camera, gui

const api = { state: 'Walk' };

init();
animate();

function init() {

  
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
  camera.position.set( - 5, 3, 10 );
  camera.lookAt( 0, 2, 0 );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xe0e0e0 );
  scene.fog = new THREE.Fog( 0xe0e0e0, 20, 100 );

  clock = new THREE.Clock();

  // lights

  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 3 );
  hemiLight.position.set( 0, 20, 0 );
  scene.add( hemiLight );

  const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  dirLight.position.set( 0, 20, 10 );
  scene.add( dirLight );

  // ground

  const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
  mesh.rotation.x = - Math.PI / 2;
  scene.add( mesh );

  const grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add( grid );

  // model

  const loader = new GLTFLoader();
  loader.load( './assets/models/human-pose/Orlando_pose_threejs.glb', function ( gltf ) {

    model = gltf.scene;
    scene.add( model );

    createGUI( model, gltf.animations );

  }, undefined, function ( e ) {

    console.error( e );

  } );

  /*renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement ); */

  /*window.addEventListener( 'resize', onWindowResize );

  // stats
  stats = new Stats();
  container.appendChild( stats.dom ); */

}

function createGUI( model, animations ) {

  const states = [ 'appeso', 'eremita', 'forza', 'giustizia', 'idle', 'imperatore', 'imperatrice', 'innamorati', 'mago', 'matto', 'morte', 'run', 'ruota', 'sole', 'Walk' ];

  gui = new GUI();

  mixer = new THREE.AnimationMixer( model );

  actions = {};

  for ( let i = 0; i < animations.length; i ++ ) {

    const clip = animations[ i ];
    const action = mixer.clipAction( clip );
    actions[ clip.name ] = action;

    if ( states.indexOf( clip.name )) {

      action.clampWhenFinished = true;
      action.loop = THREE.LoopRepeat;

    }

  }

  // states

  const statesFolder = gui.addFolder( 'States' );

  const clipCtrl = statesFolder.add( api, 'state' ).options( states );

  clipCtrl.onChange( function () {

    fadeToAction( api.state, 0.5 );

  } );

  statesFolder.open();

  activeAction = actions[ 'Walk' ];
  activeAction.play();


}

function fadeToAction( name, duration ) {

  previousAction = activeAction;
  activeAction = actions[ name ];

  if ( previousAction !== activeAction ) {

    previousAction.fadeOut( duration );

  }

  activeAction
    .reset()
    .setEffectiveTimeScale( 1 )
    .setEffectiveWeight( 1 )
    .fadeIn( duration )
    .play();

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

  const dt = clock.getDelta();

  if ( mixer ) mixer.update( dt );

  requestAnimationFrame( animate );

  renderer.render( scene, camera );

  stats.update();

}
