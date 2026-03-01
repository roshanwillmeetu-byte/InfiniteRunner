// 1. ENGINE SETUP
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. AUDIO (Fallback included so it won't crash if files are missing)
const bgMusic = new Audio('music.mp3');
bgMusic.loop = true;
const crashSound = new Audio('crash.wav');

// 3. GAME STATE
let gameStarted = false;
let gameOver = false;
let score = 0;
let obstacles = [];
const keys = {};

// 4. THE CAR (Player)
const car = new THREE.Group();
const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
const roof = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1), new THREE.MeshStandardMaterial({ color: 0xffffff }));
roof.position.y = 0.4;
car.add(body, roof);
car.position.y = 0.3;
scene.add(car);

// 5. THE WORLD
const road = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 1000),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
);
road.rotation.x = -Math.PI / 2;
scene.add(road);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(0, 10, 5);
scene.add(light);

camera.position.set(0, 3, 7);
camera.lookAt(car.position);

// 6. UI & INPUTS
const ui = document.getElementById('ui');
const startBtn = document.getElementById('startBtn');

// Keyboard Support
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') startGame();
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Touch Support
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

if(leftBtn && rightBtn) {
    leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys['KeyA'] = true; });
    leftBtn.addEventListener('touchend', () => { keys['KeyA'] = false; });
    rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys['KeyD'] = true; });
    rightBtn.addEventListener('touchend', () => { keys['KeyD'] = false; });
}

if(startBtn) {
    startBtn.addEventListener('click', startGame);
}

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        if(startBtn) startBtn.style.display = 'none';
        ui.innerHTML = "SCORE: 0";
        bgMusic.play().catch(() => console.log("Audio files missing"));
    }
}

// 7. OBSTACLES
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

// 8. GAME LOOP
function animate() {
    requestAnimationFrame(animate);

    if (gameStarted && !gameOver) {
        score++;
        ui.innerHTML = `SCORE: ${score}`;

        // Movement Logic
        if (keys['KeyA'] || keys['ArrowLeft']) car.position.x -= 0.12;
        if (keys['KeyD'] || keys['ArrowRight']) car.position.x += 0.12;
        car.position.x = Math.max(Math.min(car.position.x, 5), -5);

        // Spawn logic
        if (Math.random() < 0.02) spawnObstacle();

        // Move obstacles
        obstacles.forEach((obj, index) => {
            obj.position.z += 0.7;

            // Collision Detection
            const playerBox = new THREE.Box3().setFromObject(car);
            const obstacleBox = new THREE.Box3().setFromObject(obj);
            
            if (playerBox.intersectsBox(obstacleBox)) {
                gameOver = true;
                bgMusic.pause();
                crashSound.play().catch(() => {});
                ui.innerHTML = `CRASHED!<br>SCORE: ${score}<br>REFRESH TO RESTART`;
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