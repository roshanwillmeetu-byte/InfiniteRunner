const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// AUDIO
const bgMusic = new Audio('music.mp3');
bgMusic.loop = true;
const crashSound = new Audio('crash.wav');

// GAME STATE
let gameStarted = false;
let gameOver = false;
let score = 0;
let obstacles = [];
const keys = {};

// CAR
const car = new THREE.Group();
const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
const roof = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1), new THREE.MeshStandardMaterial({ color: 0xffffff }));
roof.position.y = 0.4;
car.add(body, roof);
car.position.y = 0.3;
scene.add(car);

// ROAD
const road = new THREE.Mesh(new THREE.PlaneGeometry(12, 1000), new THREE.MeshStandardMaterial({ color: 0x111111 }));
road.rotation.x = -Math.PI / 2;
scene.add(road);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(0, 10, 5);
scene.add(light);

camera.position.set(0, 3, 7);
camera.lookAt(car.position);

// UI ELEMENTS
const ui = document.getElementById('ui');
const startBtn = document.getElementById('startBtn');
const controls = document.getElementById('controls');

// MOBILE INPUTS
const setupMobile = () => {
    const left = document.getElementById('leftBtn');
    const right = document.getElementById('rightBtn');
    
    left.addEventListener('touchstart', (e) => { e.preventDefault(); keys['KeyA'] = true; });
    left.addEventListener('touchend', () => { keys['KeyA'] = false; });
    right.addEventListener('touchstart', (e) => { e.preventDefault(); keys['KeyD'] = true; });
    right.addEventListener('touchend', () => { keys['KeyD'] = false; });
};
setupMobile();

// START LOGIC
const startGame = () => {
    if (gameStarted) return;
    gameStarted = true;
    startBtn.style.display = 'none';
    controls.style.visibility = 'visible';
    bgMusic.play().catch(() => console.log("Music file missing"));
};

startBtn.addEventListener('click', startGame);
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') startGame();
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

function spawnObstacle() {
    const obstacle = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.7, 2),
        new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
    );
    const lanes = [-3, 0, 3];
    obstacle.position.set(lanes[Math.floor(Math.random() * 3)], 0.35, -60);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function animate() {
    requestAnimationFrame(animate);
    if (gameStarted && !gameOver) {
        score++;
        ui.innerHTML = `SCORE: ${score}`;

        if (keys['KeyA'] || keys['ArrowLeft']) car.position.x -= 0.15;
        if (keys['KeyD'] || keys['ArrowRight']) car.position.x += 0.15;
        car.position.x = Math.max(Math.min(car.position.x, 5), -5);

        if (Math.random() < 0.02) spawnObstacle();

        obstacles.forEach((obj, index) => {
            obj.position.z += 0.8;
            const playerBox = new THREE.Box3().setFromObject(car);
            const obstacleBox = new THREE.Box3().setFromObject(obj);
            
            if (playerBox.intersectsBox(obstacleBox)) {
                gameOver = true;
                bgMusic.pause();
                crashSound.play().catch(() => {});
                if (navigator.vibrate) navigator.vibrate(200);
                ui.style.top = "40%";
                ui.innerHTML = `CRASHED!<br>FINAL SCORE: ${score}<br>REFRESH TO PLAY`;
            }
            if (obj.position.z > 10) {
                scene.remove(obj);
                obstacles.splice(index, 1);
            }
        });
    }
    renderer.render(scene, camera);
}
animate();