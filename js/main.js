// Generate Scene and create Perspective Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

renderer.setClearColor( 0xb7c3f3, 1 )

const light = new THREE.AmbientLight( 0xffffff ); // soft white light
scene.add( light );

// Global var
const start_position = 3;
const end_position = -start_position;
const text = document.querySelector('.text');
const timeLimit = 10;
let gameStat = 'loading';
let isLookingBackward = true;



// EXAMPLE CUBE -- Create geometry (box), material (just color) and finally the mesh (cube)
// Add the cube to the scene

function createCube( size, positionX, rotationY, color = 0xfbc851 ){
    const geometry = new THREE.BoxGeometry( size.w, size.y, size.d );
    const material = new THREE.MeshBasicMaterial( { color: color } );
    const cube = new THREE.Mesh( geometry, material );
    cube.position.x = positionX;
    cube.rotation.y = rotationY;
    scene.add( cube );

    return cube;
}

camera.position.z = 5;
const loader = new THREE.GLTFLoader();  // Add THREE since it's laoded locally

// It returns a promise that will resolve after the given time
// La promesa se cumple pero para resolverse y devolver algo tiene que esperar el timeout que se le pasa
function delay(time) {
    return new Promise( resolve => setTimeout(resolve, time));
}


// class Squidward {
//     constructor() {
//         loader.load(
//            '../models/squidaward/scene.gltf'
//            , function (gltf) {
//                scene.add( gltf.scene );
//                gltf.scene.scale.set(.4, .4, .4);
//                gltf.scene.position.set(0, -1, 0);
//            }
//        )
//     }
// }


class Doll {
    constructor() {
        loader.load(
            '/models/squid_game/scene.gltf'
           , (gltf) => {
               scene.add( gltf.scene );
               gltf.scene.scale.set(.4, .4, .4);
               gltf.scene.position.set(0, -1.5, 0.3);
               this.doll = gltf.scene;
           }
       )
    }

    lookBackward() {
        // this.doll.rotation.y = -3.15; // We now use GSAP to animate rotation
        gsap.to(this.doll.rotation, {y: -3.15, duration: .45});
        // the time it gets the doll to turn
        setTimeout(() => isLookingBackward = true, 150)
    }
    lookForward() {
        gsap.to(this.doll.rotation, {y: 0, duration: .45});
        setTimeout(() => isLookingBackward = false, 450)

    }

    async start(){
        this.lookBackward();
        // A number between 1000 and 2000ms to turn back
        // tiene que esperar que se cumpla el delay para seguir
        await delay((Math.random() * 1000) + 1000);
        this.lookForward();
        await delay((Math.random() * 750) + 1000);
        // it calls itself to keep the game running
        this.start();
    }
}

// The wall we aim to reach
function createTrack() {
    // back wall
    createCube( {w: start_position * 2 + .2, y: 1.5, d: 1}, 0, 0, 0xe5a716 ).position.z = -1;
    // sides
    createCube( {w: .2, y: 1.5, d: 1}, start_position, -.35 );
    createCube( {w: .2, y: 1.5, d: 1}, end_position, .35 );
}

createTrack();

class Player {
    constructor () {
        const geometry = new THREE.SphereGeometry( .3, 32, 16 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        const sphere = new THREE.Mesh( geometry, material );
        sphere.position.z = 1;
        sphere.position.x = start_position;
        scene.add( sphere );
        this.player = sphere;
        this.playerInfo = {
            positionX : start_position,
            velocity : 0
        }
    }
    
    run() {
        this.playerInfo.velocity = -0.2;
    }
    stop() {
        // animate to make it interesting (?)
        gsap.to(this.playerInfo, {velocity: 0, duration: .1})
    }
    
    check() {
        if(this.playerInfo.velocity > 0 && !isLookingBackward){
            text.innerText = 'You loose';
            gameStat = 'over';
        }
        if(this.playerInfo.position < end_position + .4) {
            text.innerText = 'You win!';
            gameStat = 'over';
        }
    }

    update(){
        this.check();
        // update permanent position based on adding velocity
        this.playerInfo.positionX += this.playerInfo.velocity;
        // update sphere position based on info
        this.player.position.x = this.playerInfo.positionX;
    }
}

const player = new Player;
let doll = new Doll;

async function init(){
    await delay(3000);
    text.innerText = 'Starting in 3';
    await delay(1000);
    text.innerText = 'Starting in 2';
    await delay(1000);
    text.innerText = 'Starting in 1';
    await delay(1000);
    text.innerText = 'Go!';
    startGame();
}

function startGame(){
    gameStat = 'started';
    let progressBar = createCube({w: 5, h: .1, d:1}, 0);
    progressBar.position.y = 3.35;
    gsap.to(progressBar.scale, {x: 0, duration: timeLimit, ease: 'none'});
    doll.start();
    setTimeout( () => {
        if (gameStat != 'over'){
            text.innerText = 'Time over!'
            gameStat = 'over';
        }
    }, timeLimit * 1000) // multiply because of miliseconds
}

init();


// Render
function animate() {
    if(gameStat == 'over') {
        return;
    }
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
    player.update();
}

animate();

// Make it responsive
window.addEventListener('resize', onWindowResize, false);

function onWindowResize () {
    camera.aspect = ( window.innerWidth /  window.innerHeight );
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

// Move Player
window.addEventListener('keydown', (e) => {
    if (gameStat != 'started') {
        return;
    }
    if(e.key == 'ArrowUp') {
        player.run();
    }
})
window.addEventListener('keyup', (e) => {
    if(e.key == 'ArrowUp') {
        player.stop();
    }
})
