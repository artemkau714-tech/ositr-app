import * as THREE from 'three';

// ========== НАСТРОЙКИ ==========
const IS_MOBILE = /Mobi|Android|iPhone/i.test(navigator.userAgent);
const WOOD_FOR_AXE = 3;

// ========== СЦЕНА ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 25, 50);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ========== СВЕТ ==========
const ambient = new THREE.AmbientLight(0x6688aa, 0.5);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffeedd, 1.8);
sun.position.set(20, 30, 10);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 50;
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;
scene.add(sun);

const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.6);
scene.add(hemi);

// ========== ОКЕАН ==========
const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x1a6e8a, transparent: true, opacity: 0.85, roughness: 0.3, metalness: 0.1 })
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -0.15;
scene.add(ocean);

// ========== ОСТРОВ (ЗЕЛЁНАЯ ЗЕМЛЯ) ==========
const island = new THREE.Mesh(
    new THREE.CircleGeometry(6, 64),
    new THREE.MeshStandardMaterial({ color: 0x6b8e23, roughness: 0.9 })
);
island.rotation.x = -Math.PI / 2;
island.position.y = -0.1;
island.receiveShadow = true;
scene.add(island);

const grassLayer = new THREE.Mesh(
    new THREE.CircleGeometry(5.8, 64),
    new THREE.MeshStandardMaterial({ 
        color: 0x7cb342, 
        roughness: 1,
        transparent: true,
        opacity: 0.6
    })
);
grassLayer.rotation.x = -Math.PI / 2;
grassLayer.position.y = -0.08;
scene.add(grassLayer);

// ========== ВЫСОКАЯ ТРАВА ==========
const grassBlades = [];
const grassMat = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color().setHSL(0.28, 0.6, 0.35),
    roughness: 0.9,
    side: THREE.DoubleSide
});

for (let i = 0; i < 600; i++) {
    const height = 0.15 + Math.random() * 0.35;
    const blade = new THREE.Mesh(
        new THREE.PlaneGeometry(0.02, height),
        grassMat.clone()
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 5.2;
    blade.position.set(
        Math.cos(angle) * radius,
        -0.05 + height/2,
        Math.sin(angle) * radius
    );
    blade.rotation.y = Math.random() * Math.PI * 2;
    blade.rotation.x = -0.1 + Math.random() * 0.2;
    blade.castShadow = false;
    
    blade.userData = {
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        baseRot: blade.rotation.x
    };
    scene.add(blade);
    grassBlades.push(blade);
}

// ========== ЦВЕТЫ ==========
const flowerColors = [0xff6b6b, 0xffd93d, 0x6c5ce7, 0xff9ff3, 0xf368e0];
for (let i = 0; i < 40; i++) {
    const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.02, 6),
        new THREE.MeshStandardMaterial({ 
            color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
            roughness: 0.5
        })
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.8 + Math.random() * 4.5;
    flower.position.set(
        Math.cos(angle) * radius,
        0.02,
        Math.sin(angle) * radius
    );
    flower.castShadow = false;
    scene.add(flower);
    
    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.008, 0.05, 4),
        new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
    );
    stem.position.copy(flower.position);
    stem.position.y = -0.02;
    scene.add(stem);
}

// ========== БАБОЧКИ ==========
const butterflies = [];

function createButterfly() {
    const group = new THREE.Group();
    
    const wingMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 0.8, 0.5 + Math.random() * 0.3),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    
    const wingGeo = new THREE.PlaneGeometry(0.08, 0.04);
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.x = -0.04;
    leftWing.rotation.y = 0.3;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.x = 0.04;
    rightWing.rotation.y = -0.3;
    group.add(rightWing);
    
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.005, 0.03, 4),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    const angle = Math.random() * Math.PI * 2;
    const radius = 1 + Math.random() * 4;
    group.position.set(
        Math.cos(angle) * radius,
        0.4 + Math.random() * 1.5,
        Math.sin(angle) * radius
    );
    group.rotation.y = Math.random() * Math.PI * 2;
    group.scale.setScalar(0.5 + Math.random() * 0.5);
    
    group.userData = {
        angle: angle,
        radius: radius,
        speed: 0.2 + Math.random() * 0.3,
        flapSpeed: 2 + Math.random() * 2,
        heightOffset: Math.random() * 10,
        wingAngle: 0
    };
    
    scene.add(group);
    butterflies.push(group);
    return group;
}

for (let i = 0; i < 8; i++) {
    createButterfly();
}

// ========== ПТИЦЫ ==========
const birds = [];

function createBird() {
    const group = new THREE.Group();
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const wingMat = new THREE.MeshStandardMaterial({ 
        color: 0x444444, 
        side: THREE.DoubleSide,
        roughness: 0.9
    });
    
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6), bodyMat);
    body.scale.set(1, 0.8, 1.5);
    group.add(body);
    
    const wingGeo = new THREE.PlaneGeometry(0.12, 0.04);
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.05, 0, 0);
    leftWing.rotation.z = 0.3;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.05, 0, 0);
    rightWing.rotation.z = -0.3;
    group.add(rightWing);
    
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.random() * 3;
    group.position.set(
        Math.cos(angle) * radius,
        2 + Math.random() * 3,
        Math.sin(angle) * radius
    );
    group.scale.setScalar(0.5 + Math.random() * 0.5);
    
    group.userData = {
        angle: angle,
        radius: radius,
        speed: 0.1 + Math.random() * 0.2,
        flapSpeed: 3 + Math.random() * 2,
        heightOffset: Math.random() * 10,
        wingAngle: 0,
        circleRadius: 3 + Math.random() * 2
    };
    
    scene.add(group);
    birds.push(group);
    return group;
}

for (let i = 0; i < 4; i++) {
    createBird();
}

// ========== ДЕРЕВЬЯ ==========
const trees = [];
const treeLogs = [];

function createTree(x, z) {
    const group = new THREE.Group();
    const height = 1.5 + Math.random() * 1.0;
    
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.25, height, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 })
    );
    trunk.position.y = height/2;
    trunk.castShadow = true;
    group.add(trunk);
    
    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.6 + Math.random() * 0.3, 7),
        new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(0.28 + Math.random()*0.05, 0.7, 0.3 + Math.random()*0.15),
            roughness: 0.8
        })
    );
    crown.position.y = height + 0.2;
    crown.castShadow = true;
    group.add(crown);
    
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
    trees.push(group);
    
    return group;
}

for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 2.0 + Math.random() * 2.5;
    createTree(Math.cos(angle) * radius, Math.sin(angle) * radius);
}
createTree(1.0, 0.8);
createTree(-0.6, -1.0);

// ========== ТЕЛО ИГРОКА ==========
const playerGroup = new THREE.Group();

const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a7db4, roughness: 0.7 })
);
body.position.y = 0.3;
body.castShadow = true;
playerGroup.add(body);

const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8),
    new THREE.MeshStandardMaterial({ color: 0xfdbcb4, roughness: 0.5 })
);
head.position.y = 0.75;
head.castShadow = true;
playerGroup.add(head);

const legMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.8 });
for (let side of [-0.1, 0.1]) {
    const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.07, 0.3, 6),
        legMat
    );
    leg.position.set(side, 0.15, 0);
    leg.castShadow = true;
    playerGroup.add(leg);
}

const armMat = new THREE.MeshStandardMaterial({ color: 0xfdbcb4, roughness: 0.5 });
const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6), armMat);
leftArm.position.set(-0.3, 0.45, 0);
leftArm.rotation.z = 0.3;
leftArm.castShadow = true;
playerGroup.add(leftArm);

const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6), armMat);
rightArm.position.set(0.3, 0.45, 0);
rightArm.rotation.z = -0.3;
rightArm.castShadow = true;
playerGroup.add(rightArm);

const axeGroup = new THREE.Group();
const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.025, 0.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
);
handle.position.y = -0.1;
handle.rotation.x = Math.PI / 2;
axeGroup.add(handle);

const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.05, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 })
);
blade.position.set(0.15, -0.02, 0);
axeGroup.add(blade);

axeGroup.position.set(0.45, 0.35, 0.1);
axeGroup.rotation.z = -0.5;
axeGroup.rotation.x = 0.3;
playerGroup.add(axeGroup);

playerGroup.position.set(0, -0.1, 0);
scene.add(playerGroup);

// ========== ИНВЕНТАРЬ ==========
let inventory = { wood: 0, logs: 0 };
let hasAxe = false;
let isChopping = false;
let chopProgress = 0;
let targetTree = null;

// Создаём UI инвентаря
const inventoryDiv = document.createElement('div');
inventoryDiv.style.cssText = `
    position: absolute;
    bottom: 140px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(8px);
    padding: 12px 24px;
    border-radius: 16px;
    border: 1px solid rgba(255,215,0,0.3);
    color: white;
    font-family: 'Segoe UI', sans-serif;
    z-index: 150;
    display: flex;
    gap: 25px;
    font-size: 15px;
    user-select: none;
    pointer-events: none;
    flex-wrap: wrap;
    justify-content: center;
`;
inventoryDiv.innerHTML = `
    <div class="inv-item">🪵 Древесина: <span id="woodCount">0</span></div>
    <div class="inv-item">🪵 Брёвна: <span id="logCount">0</span></div>
    <div class="inv-item" id="axeStatus">🔨 Нет топора</div>
`;
document.body.appendChild(inventoryDiv);

// Прогресс рубки
const progressDiv = document.createElement('div');
progressDiv.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 24px;
    background: rgba(0,0,0,0.8);
    border-radius: 12px;
    border: 2px solid #ffd700;
    z-index: 300;
    display: none;
    overflow: hidden;
    box-shadow: 0 0 30px rgba(255,215,0,0.2);
`;
const progressFill = document.createElement('div');
progressFill.style.cssText = `
    width: 0%;
    height: 100%;
    background: linear-gradient(90deg, #ff6b6b, #ffd700);
    border-radius: 10px;
    transition: width 0.1s;
`;
progressDiv.appendChild(progressFill);
document.body.appendChild(progressDiv);
