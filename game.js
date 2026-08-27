import * as THREE from 'three';

// ========== НАСТРОЙКИ ==========
const IS_MOBILE = /Mobi|Android|iPhone/i.test(navigator.userAgent);
const WOOD_FOR_AXE = 3;
const HOTBAR_SLOTS = 9;

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

// ========== ОСТРОВ ==========
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

// ========== ТРАВА ==========
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

// ========== ПАЛКИ НА ЗЕМЛЕ ==========
const sticks = [];
for (let i = 0; i < 25; i++) {
    const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.015, 0.1 + Math.random() * 0.1, 4),
        new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 })
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 4.5;
    stick.position.set(
        Math.cos(angle) * radius,
        0.02,
        Math.sin(angle) * radius
    );
    stick.rotation.x = Math.random() * 0.5;
    stick.rotation.z = Math.random() * 0.5;
    stick.castShadow = true;
    scene.add(stick);
    sticks.push(stick);
}// ========== МАЙНКРАФТ-ИНВЕНТАРЬ (ХОТБАР) ==========
let inventory = { 
    wood: 0, 
    logs: 0,
    slots: new Array(HOTBAR_SLOTS).fill(null),
    selectedSlot: 0
};

// Первый слот - палки, второй - брёвна (для демонстрации)
inventory.slots[0] = { id: 'stick', name: 'Палка', icon: '🥢', count: 0 };
inventory.slots[1] = { id: 'log', name: 'Бревно', icon: '🪵', count: 0 };
inventory.slots[2] = { id: 'axe', name: 'Топор', icon: '🪓', count: 0 };

let hasAxe = false;
let isChopping = false;
let chopProgress = 0;
let targetTree = null;

// Создаём HOTBAR (как в Майнкрафт)
const hotbarDiv = document.createElement('div');
hotbarDiv.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    z-index: 150;
    background: rgba(0,0,0,0.6);
    padding: 6px 10px;
    border-radius: 8px;
    border: 2px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
`;

// Создаём 9 слотов
const slotElements = [];
for (let i = 0; i < HOTBAR_SLOTS; i++) {
    const slot = document.createElement('div');
    slot.style.cssText = `
        width: 48px;
        height: 48px;
        background: rgba(0,0,0,0.4);
        border: 2px solid ${i === 0 ? '#ffd700' : 'rgba(255,255,255,0.2)'};
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        position: relative;
        transition: all 0.2s;
        cursor: pointer;
    `;
    slot.innerHTML = `
        <span style="font-size:22px;line-height:1;" class="slot-icon">${i === 0 ? '🥢' : ''}</span>
        <span style="font-size:10px;position:absolute;bottom:2px;right:4px;color:#ffd700;font-weight:bold;" class="slot-count">${i === 0 ? '0' : ''}</span>
    `;
    slot.dataset.index = i;
    
    // Клик для выбора слота (как в Майнкрафт)
    slot.addEventListener('click', () => {
        selectSlot(i);
    });
    
    hotbarDiv.appendChild(slot);
    slotElements.push(slot);
}
document.body.appendChild(hotbarDiv);

// Функция выбора слота
function selectSlot(index) {
    inventory.selectedSlot = index;
    slotElements.forEach((el, i) => {
        el.style.border = i === index ? '2px solid #ffd700' : '2px solid rgba(255,255,255,0.2)';
        el.style.background = i === index ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.4)';
    });
}

// Обновление инвентаря (как в Майнкрафт)
function updateHotbar() {
    // Обновляем слоты
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
        const data = inventory.slots[i];
        const iconEl = slotElements[i].querySelector('.slot-icon');
        const countEl = slotElements[i].querySelector('.slot-count');
        
        if (data && data.count > 0) {
            iconEl.textContent = data.icon || '📦';
            countEl.textContent = data.count;
            countEl.style.display = 'block';
        } else {
            iconEl.textContent = '';
            countEl.textContent = '';
            countEl.style.display = 'none';
        }
    }
    
    // Обновляем статус топора
    const axeStatus = document.getElementById('axeStatus');
    if (axeStatus) {
        if (hasAxe) {
            axeStatus.textContent = '🪓 Есть';
            axeStatus.style.color = '#ffd700';
        } else {
            axeStatus.textContent = '🔨 Нет';
            axeStatus.style.color = '#ff6b6b';
        }
    }
}

// Функция добавления предмета в инвентарь
function addToInventory(itemId, itemName, icon, count = 1) {
    // Ищем существующий слот с таким же предметом
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
        if (inventory.slots[i] && inventory.slots[i].id === itemId) {
            inventory.slots[i].count += count;
            updateHotbar();
            return true;
        }
    }
    
    // Ищем пустой слот
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
        if (!inventory.slots[i] || inventory.slots[i].count === 0) {
            inventory.slots[i] = { id: itemId, name: itemName, icon: icon, count: count };
            updateHotbar();
            return true;
        }
    }
    
    return false; // Инвентарь полон
}

// Инициализация: добавляем примеры предметов
addToInventory('stick', 'Палка', '🥢', 0);
addToInventory('log', 'Бревно', '🪵', 0);

// Создаём дополнительный HUD для ресурсов (сверху)
const resourceHUD = document.createElement('div');
resourceHUD.style.cssText = `
    position: absolute;
    top: 70px;
    right: 20px;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,215,0,0.2);
    color: white;
    font-family: 'Segoe UI', sans-serif;
    z-index: 150;
    font-size: 13px;
    user-select: none;
    pointer-events: none;
    min-width: 120px;
`;
resourceHUD.innerHTML = `
    <div>🪵 Древесина: <span id="woodCount" style="color:#ffd700;">0</span></div>
    <div>📦 Брёвна: <span id="logCount" style="color:#ffd700;">0</span></div>
    <div id="axeStatus" style="color:#ff6b6b;">🔨 Нет топора</div>
`;
document.body.appendChild(resourceHUD);

// ========== УПРАВЛЕНИЕ ==========
let moveX = 0, moveZ = 0;
let pitch = -0.1, yaw = 0;
let isLooking = false;

// --- Джойстик ---
const joystick = document.createElement('div');
joystick.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 30px;
    width: 120px;
    height: 120px;
    border-radius: 60px;
    background: rgba(255,255,255,0.12);
    border: 2px solid rgba(255,255,255,0.25);
    backdrop-filter: blur(4px);
    z-index: 200;
    touch-action: none;
`;
document.body.appendChild(joystick);

const knob = document.createElement('div');
knob.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50px;
    height: 50px;
    border-radius: 25px;
    background: radial-gradient(circle, rgba(255,255,255,0.5), rgba(255,255,255,0.2));
    transform: translate(-50%, -50%);
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
`;
joystick.appendChild(knob);

// --- Кнопка действия (рубить/собирать) ---
const actionBtn = document.createElement('div');
actionBtn.style.cssText = `
    position: fixed;
    bottom: 110px;
    right: 30px;
    width: 70px;
    height: 70px;
    border-radius: 35px;
    background: rgba(255, 200, 0, 0.25);
    border: 3px solid #ffd700;
    color: #ffd700;
    font-size: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    user-select: none;
    touch-action: none;
    backdrop-filter: blur(4px);
    box-shadow: 0 0 30px rgba(255,215,0,0.1);
`;
actionBtn.textContent = '⚔️';
document.body.appendChild(actionBtn);

// --- Кнопка переключения вида ---
const viewBtn = document.createElement('div');
viewBtn.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 25px;
    background: rgba(0,0,0,0.5);
    border: 2px solid rgba(255,255,255,0.2);
    color: white;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    user-select: none;
    touch-action: none;
    backdrop-filter: blur(4px);
`;
viewBtn.textContent = '👤';
document.body.appendChild(viewBtn);

// ========== ОБРАБОТКА ДЖОЙСТИКА ==========
joystick.addEventListener('touchstart', handleJoystick);
joystick.addEventListener('touchmove', handleJoystick);
joystick.addEventListener('touchend', () => {
    moveX = 0;
    moveZ = 0;
    knob.style.transform = 'translate(-50%, -50%)';
});

function handleJoystick(e) {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = rect.width/2 - 25;
    
    const normalizedDy = -dy;
    
    if (dist > maxDist) {
        moveX = (dx/dist) * 0.8;
        moveZ = (normalizedDy/dist) * 0.8;
    } else {
        moveX = dx/maxDist * 0.8;
        moveZ = normalizedDy/maxDist * 0.8;
    }
    knob.style.transform = `translate(calc(-50% + ${moveX*50}px), calc(-50% + ${-moveZ*50}px))`;
}

// ========== ПОВОРОТ КАМЕРЫ ==========
let touchStartX = 0, touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    if (e.target === joystick || e.target === actionBtn || e.target === viewBtn || e.target === knob) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isLooking = true;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (e.target === joystick || e.target === actionBtn || e.target === viewBtn || e.target === knob) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    yaw -= dx * 0.005;
    pitch -= dy * 0.005;
    pitch = Math.max(-0.8, Math.min(0.8, pitch));
}, { passive: false });

document.addEventListener('touchend', () => {
    isLooking = false;
});

// ========== ПРОГРЕСС РУБКИ ==========
const progressDiv = document.createElement('div');
progressDiv.style.cssText = `
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 220px;
    height: 28px;
    background: rgba(0,0,0,0.85);
    border-radius: 14px;
    border: 2px solid #ffd700;
    z-index: 300;
    display: none;
    overflow: hidden;
    box-shadow: 0 0 40px rgba(255,215,0,0.15);
`;
const progressFill = document.createElement('div');
progressFill.style.cssText = `
    width: 0%;
    height: 100%;
    background: linear-gradient(90deg, #ff6b6b, #ffd700, #ff6b6b);
    background-size: 200% 100%;
    border-radius: 12px;
    transition: width 0.1s;
    animation: shimmer 1s linear infinite;
`;
progressDiv.appendChild(progressFill);
document.body.appendChild(progressDiv);

const styleShimmer = document.createElement('style');
styleShimmer.textContent = `
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
`;
document.head.appendChild(styleShimmer);

// ========== УЛУЧШЕННЫЕ УВЕДОМЛЕНИЯ ==========
let notificationTimeout = null;

function showMessage(text) {
    const oldMsg = document.querySelector('.notification');
    if (oldMsg) {
        oldMsg.remove();
        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
            notificationTimeout = null;
        }
    }
    
    const msg = document.createElement('div');
    msg.className = 'notification';
    msg.textContent = text;
    document.body.appendChild(msg);
    
    notificationTimeout = setTimeout(() => {
        if (msg.parentNode) {
            msg.remove();
        }
        notificationTimeout = null;
    }, 2500);
    }// ========== ЛОГИКА СБОРА ==========
function collectStick() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(sticks);
    
    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const index = sticks.indexOf(hit);
        if (index !== -1) {
            scene.remove(sticks[index]);
            sticks.splice(index, 1);
            
            // Добавляем в инвентарь
            addToInventory('stick', 'Палка', '🥢', 1);
            updateHotbar();
            showMessage('🥢 +1 палка');
            
            // Проверяем, можно ли создать топор
            const stickCount = inventory.slots[0] ? inventory.slots[0].count : 0;
            if (stickCount >= WOOD_FOR_AXE && !hasAxe) {
                showMessage(`🔨 Собери ${WOOD_FOR_AXE} палок и нажми ⚔️ чтобы создать топор!`);
            }
            return true;
        }
    }
    return false;
}

function collectLogs() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(treeLogs);
    
    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const index = treeLogs.indexOf(hit);
        if (index !== -1) {
            scene.remove(treeLogs[index]);
            treeLogs.splice(index, 1);
            
            addToInventory('log', 'Бревно', '🪵', 1);
            updateHotbar();
            showMessage('🪵 +1 бревно');
            return true;
        }
    }
    return false;
}

// ========== РУБКА ==========
function startChopping() {
    if (isChopping) return;
    
    // Проверяем, есть ли топор в инвентаре
    const axeSlot = inventory.slots.find(s => s && s.id === 'axe');
    const hasAxeInInventory = axeSlot && axeSlot.count > 0;
    
    if (!hasAxeInInventory) {
        // Пробуем создать топор из палок
        const stickSlot = inventory.slots[0];
        if (stickSlot && stickSlot.count >= WOOD_FOR_AXE) {
            // Забираем палки
            stickSlot.count -= WOOD_FOR_AXE;
            // Добавляем топор
            addToInventory('axe', 'Топор', '🪓', 1);
            hasAxe = true;
            updateHotbar();
            showMessage('🪓 Топор создан! Теперь руби деревья!');
        } else {
            showMessage(`🔨 Нужно ${WOOD_FOR_AXE} палок для топора (собирай палки с земли)`);
        }
        return;
    }
    
    // Ищем дерево
    let nearest = null;
    let nearestDist = Infinity;
    for (const tree of trees) {
        const dist = camera.position.distanceTo(tree.position);
        if (dist < nearestDist && dist < 4) {
            nearestDist = dist;
            nearest = tree;
        }
    }
    
    if (!nearest) {
        showMessage('🌴 Подойди ближе к дереву!');
        return;
    }
    
    targetTree = nearest;
    isChopping = true;
    chopProgress = 0;
    progressDiv.style.display = 'block';
    progressFill.style.width = '0%';
}

function updateChopping() {
    if (!isChopping || !targetTree) return;
    
    chopProgress += 0.02;
    progressFill.style.width = `${Math.min(chopProgress * 100, 100)}%`;
    
    const swingAngle = Math.sin(chopProgress * 30) * 0.8;
    axeGroup.rotation.x = -0.5 + swingAngle;
    axeGroup.rotation.z = -0.5 + swingAngle * 0.3;
    rightArm.rotation.z = -0.3 + swingAngle * 0.5;
    
    if (chopProgress >= 1) {
        finishChopping();
    }
}

function finishChopping() {
    isChopping = false;
    progressDiv.style.display = 'none';
    
    if (targetTree) {
        const treePos = targetTree.position.clone();
        scene.remove(targetTree);
        const index = trees.indexOf(targetTree);
        if (index !== -1) trees.splice(index, 1);
        
        // Создаём брёвна
        const logCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < logCount; i++) {
            const log = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.07, 0.2 + Math.random()*0.2, 5),
                new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 })
            );
            log.position.copy(treePos);
            log.position.x += (Math.random() - 0.5) * 0.4;
            log.position.z += (Math.random() - 0.5) * 0.4;
            log.position.y = 0.1 + Math.random() * 0.1;
            log.rotation.x = Math.random() * 0.5;
            log.rotation.z = Math.random() * 0.5;
            log.castShadow = true;
            scene.add(log);
            treeLogs.push(log);
        }
        
        showMessage(`🪵 Дерево срублено! Собери брёвна с земли`);
    }
    
    targetTree = null;
    axeGroup.rotation.x = -0.5;
    axeGroup.rotation.z = -0.5;
    rightArm.rotation.z = -0.3;
}

// ========== ОБРАБОТЧИКИ КНОПОК ==========
actionBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isChopping) startChopping();
});

actionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isChopping) startChopping();
});

// Сбор предметов по тапу
document.addEventListener('click', (e) => {
    if (e.target === actionBtn || e.target === joystick || e.target === knob || e.target === viewBtn) return;
    if (!isChopping) {
        if (!collectStick()) {
            collectLogs();
        }
    }
});

// ========== ПЕРЕКЛЮЧЕНИЕ ВИДА ==========
let isFirstPerson = true;

viewBtn.addEventListener('click', toggleCameraView);
viewBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCameraView();
});

function toggleCameraView() {
    isFirstPerson = !isFirstPerson;
    if (isFirstPerson) {
        camera.position.set(0, 0.6, 0);
        camera.fov = 70;
        playerGroup.visible = false;
        viewBtn.textContent = '👤';
        showMessage('👁️ Вид от первого лица');
    } else {
        camera.position.set(0, 1.2, 2.5);
        camera.fov = 50;
        playerGroup.visible = true;
        viewBtn.textContent = '👁️';
        showMessage('👤 Вид от третьего лица');
    }
    camera.updateProjectionMatrix();
}

playerGroup.visible = false;

// ========== АНИМАЦИЯ ПРИРОДЫ ==========
function animateNature(time) {
    for (const blade of grassBlades) {
        const wind = Math.sin(time * 0.001 * blade.userData.speed + blade.userData.phase) * 0.08;
        blade.rotation.x = blade.userData.baseRot + wind;
        blade.rotation.z = Math.sin(time * 0.0008 * blade.userData.speed + blade.userData.phase) * 0.05;
    }
    
    for (const butterfly of butterflies) {
        const data = butterfly.userData;
        data.angle += 0.005 * data.speed;
        const x = Math.cos(data.angle) * data.radius;
        const z = Math.sin(data.angle) * data.radius;
        const y = 0.4 + Math.sin(time * 0.001 * data.flapSpeed + data.heightOffset) * 0.3 + 0.3;
        butterfly.position.set(x, y, z);
        butterfly.rotation.y = -data.angle + Math.PI / 2;
        
        const wingAngle = Math.sin(time * 0.005 * data.flapSpeed + data.heightOffset) * 0.5;
        butterfly.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'PlaneGeometry') {
                child.rotation.z = wingAngle * (child.position.x < 0 ? 1 : -1);
            }
        });
    }
    
    for (const bird of birds) {
        const data = bird.userData;
        data.angle += 0.003 * data.speed;
        const x = Math.cos(data.angle) * data.circleRadius;
        const z = Math.sin(data.angle) * data.circleRadius;
        const y = 2 + Math.sin(time * 0.0008 * data.flapSpeed + data.heightOffset) * 1 + 1;
        bird.position.set(x, y, z);
        bird.rotation.y = -data.angle + Math.PI / 2;
        
        const wingAngle = Math.sin(time * 0.008 * data.flapSpeed + data.heightOffset) * 0.8;
        bird.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'PlaneGeometry') {
                child.rotation.z = wingAngle * (child.position.x < 0 ? 1 : -1);
            }
        });
    }
}

// ========== ОСНОВНОЙ ЦИКЛ ==========
function animate(time) {
    requestAnimationFrame(animate);
    
    animateNature(time);
    
    if (moveX !== 0 || moveZ !== 0) {
        const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        const speed = 0.04;
        
        const moveVec = new THREE.Vector3()
            .addScaledVector(forward, moveZ * speed)
            .addScaledVector(right, moveX * speed);
        
        camera.position.add(moveVec);
        playerGroup.position.copy(camera.position);
        playerGroup.position.y = -0.1;
        
        if (moveVec.length() > 0.001) {
            const targetAngle = Math.atan2(moveVec.x, moveVec.z);
            playerGroup.rotation.y = targetAngle;
        }
    }
    
    if (isChopping) updateChopping();
    
    const dist = Math.sqrt(camera.position.x**2 + camera.position.z**2);
    if (dist > 5.5) {
        camera.position.x = (camera.position.x/dist) * 5.5;
        camera.position.z = (camera.position.z/dist) * 5.5;
        playerGroup.position.copy(camera.position);
        playerGroup.position.y = -0.1;
    }
    
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
    
    if (!isFirstPerson) {
        const offset = new THREE.Vector3(0, 0.6, 0);
        const targetPos = playerGroup.position.clone().add(offset);
        camera.position.lerp(targetPos, 0.1);
        camera.lookAt(playerGroup.position.clone().add(new THREE.Vector3(0, 0.3, 0)));
    }
    
    renderer.render(scene, camera);
}
animate(0);

// ========== АДАПТАЦИЯ ==========
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========== СТАРТ ==========
updateHotbar();
showMessage('🌴 Собирай палки с земли (нажимай на них)');
