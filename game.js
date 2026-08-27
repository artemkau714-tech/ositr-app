import * as THREE from 'three';

// ========== НАСТРОЙКИ ==========
const IS_MOBILE = /Mobi|Android|iPhone/i.test(navigator.userAgent);
const WOOD_REQUIRED = 5; // Древесины для крафта топора

// ========== СЦЕНА ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 40);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ========== СВЕТ ==========
const ambient = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
sun.position.set(20, 30, 10);
sun.castShadow = true;
sun.shadow.mapSize.width = 1024;
sun.shadow.mapSize.height = 1024;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 50;
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;
scene.add(sun);

const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.4);
scene.add(hemi);

// ========== ОКЕАН ==========
const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x1a6e8a, transparent: true, opacity: 0.8, roughness: 0.3 })
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -0.2;
scene.add(ocean);

// ========== ОСТРОВ ==========
const island = new THREE.Mesh(
    new THREE.CircleGeometry(6, 64),
    new THREE.MeshStandardMaterial({ color: 0xc2b280, roughness: 0.9 })
);
island.rotation.x = -Math.PI / 2;
island.position.y = -0.1;
island.receiveShadow = true;
scene.add(island);

// ========== ТРАВА ==========
for (let i = 0; i < 400; i++) {
    const grass = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.03, 0.08),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.28 + Math.random()*0.07, 0.6, 0.3 + Math.random()*0.15) })
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 5.5;
    grass.position.set(Math.cos(angle) * radius, -0.05, Math.sin(angle) * radius);
    grass.rotation.y = Math.random() * Math.PI;
    scene.add(grass);
}

// ========== ДЕРЕВЬЯ ==========
const trees = [];
const treeLogs = [];

function createTree(x, z) {
    const group = new THREE.Group();
    const height = 1.5 + Math.random() * 1.0;
    
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.25, height, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 })
    );
    trunk.position.y = height/2;
    trunk.castShadow = true;
    group.add(trunk);
    
    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.7 + Math.random()*0.3, 7),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.28 + Math.random()*0.05, 0.7, 0.3 + Math.random()*0.15) })
    );
    crown.position.y = height + 0.3;
    crown.castShadow = true;
    group.add(crown);
    
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
    trees.push(group);
    
    return group;
}

// Расставляем деревья
for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 2.0 + Math.random() * 2.8;
    createTree(Math.cos(angle) * radius, Math.sin(angle) * radius);
}
createTree(1.2, 0.5);
createTree(-0.8, -1.2);
createTree(0.3, -1.8);

// ========== ТЕЛО ИГРОКА ==========
const playerGroup = new THREE.Group();

// Тело (туловище)
const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a7db4, roughness: 0.7 })
);
body.position.y = 0.3;
body.castShadow = true;
playerGroup.add(body);

// Голова
const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8),
    new THREE.MeshStandardMaterial({ color: 0xfdbcb4, roughness: 0.5 })
);
head.position.y = 0.75;
head.castShadow = true;
playerGroup.add(head);

// Ноги
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

// Руки (будут анимироваться при рубке)
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

// Топор (в правой руке)
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
    gap: 30px;
    font-size: 16px;
    user-select: none;
    pointer-events: none;
`;
inventoryDiv.innerHTML = `
    <div>🪵 Древесина: <span id="woodCount">0</span></div>
    <div>🪵 Брёвна: <span id="logCount">0</span></div>
    <div id="axeStatus">🪓 Нет топора</div>
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
    height: 20px;
    background: rgba(0,0,0,0.7);
    border-radius: 10px;
    border: 2px solid #ffd700;
    z-index: 300;
    display: none;
    overflow: hidden;
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

// ========== УПРАВЛЕНИЕ ==========
let moveX = 0, moveZ = 0;
let pitch = -0.1, yaw = 0;
let isLooking = false;

// --- Джойстик ---
const joystick = document.createElement('div');
joystick.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 30px;
    width: 120px;
    height: 120px;
    border-radius: 60px;
    background: rgba(255,255,255,0.15);
    border: 2px solid rgba(255,255,255,0.3);
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
    background: rgba(255,255,255,0.4);
    transform: translate(-50%, -50%);
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
`;
joystick.appendChild(knob);

// --- Кнопка рубки ---
const chopBtn = document.createElement('div');
chopBtn.style.cssText = `
    position: fixed;
    bottom: 40px;
    right: 30px;
    width: 80px;
    height: 80px;
    border-radius: 40px;
    background: rgba(255, 200, 0, 0.3);
    border: 3px solid #ffd700;
    color: #ffd700;
    font-size: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    user-select: none;
    touch-action: none;
    backdrop-filter: blur(4px);
`;
chopBtn.textContent = '🪓';
document.body.appendChild(chopBtn);

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
    
    // ИНВЕРТИРУЕМ Y для правильного направления (вверх = вперёд)
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
    if (e.target === joystick || e.target === chopBtn || e.target === knob) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isLooking = true;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (e.target === joystick || e.target === chopBtn || e.target === knob) return;
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

// ========== РУБКА ==========
function startChopping() {
    if (isChopping) return;
    if (!hasAxe) {
        // Крафтим топор
        if (inventory.wood >= WOOD_REQUIRED) {
            inventory.wood -= WOOD_REQUIRED;
            hasAxe = true;
            updateInventory();
            document.getElementById('axeStatus').textContent = '🪓 Есть топор!';
            document.getElementById('axeStatus').style.color = '#ffd700';
            showMessage('✅ Топор создан!');
        } else {
            showMessage(`❌ Нужно ${WOOD_REQUIRED} древесины для топора`);
        }
        return;
    }
    
    // Ищем ближайшее дерево
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
    document.getElementById('axeStatus').textContent = '🪓 Рубка...';
}

function updateChopping() {
    if (!isChopping || !targetTree) return;
    
    chopProgress += 0.02; // 5 секунд (100% / 50 шагов)
    progressFill.style.width = `${Math.min(chopProgress * 100, 100)}%`;
    
    // Анимация топора
    const swingAngle = Math.sin(chopProgress * 30) * 0.8;
    axeGroup.rotation.x = -0.5 + swingAngle;
    axeGroup.rotation.z = -0.5 + swingAngle * 0.3;
    
    // Анимация руки
    rightArm.rotation.z = -0.3 + swingAngle * 0.5;
    
    if (chopProgress >= 1) {
        finishChopping();
    }
}

function finishChopping() {
    isChopping = false;
    progressDiv.style.display = 'none';
    document.getElementById('axeStatus').textContent = '🪓 Готово!';
    
    if (targetTree) {
        // Создаём брёвна
        const treePos = targetTree.position.clone();
        scene.remove(targetTree);
        const index = trees.indexOf(targetTree);
        if (index !== -1) trees.splice(index, 1);
        
        // Создаём 3-4 бревна
        for (let i = 0; i < 3 + Math.floor(Math.random() * 2); i++) {
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
        
        // Даём брёвна в инвентарь
        inventory.logs += 3 + Math.floor(Math.random() * 2);
        updateInventory();
        showMessage('🪵 Брёвна собраны!');
    }
    
    targetTree = null;
    // Возвращаем топор в исходное положение
    axeGroup.rotation.x = -0.5;
    axeGroup.rotation.z = -0.5;
    rightArm.rotation.z = -0.3;
}

// ========== СБОР БРЁВЕН ==========
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
            inventory.wood += 1;
            updateInventory();
            showMessage('🪵 +1 древесина');
        }
    }
}

// ========== UI ВСПОМОГАТЕЛЬНЫЕ ==========
function updateInventory() {
    document.getElementById('woodCount').textContent = inventory.wood;
    document.getElementById('logCount').textContent = inventory.logs;
}

function showMessage(text) {
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px 30px;
        border-radius: 12px;
        font-size: 20px;
        z-index: 500;
        pointer-events: none;
        font-family: 'Segoe UI', sans-serif;
        border: 2px solid rgba(255,215,0,0.3);
        animation: fadeOut 2s forwards;
    `;
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
}

// Добавляем CSS анимацию
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -60%) scale(0.9); }
    }
`;
document.head.appendChild(style);

// ========== ОБРАБОТЧИКИ КНОПОК ==========
chopBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isChopping) {
        startChopping();
    }
});

chopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isChopping) {
        startChopping();
    }
});

// Сбор брёвен по тапу на экран (кроме кнопок)
document.addEventListener('click', (e) => {
    if (e.target === chopBtn || e.target === joystick || e.target === knob) return;
    if (!isChopping) {
        collectLogs();
    }
});

// ========== ПЕРЕКЛЮЧЕНИЕ ВИДА ==========
let isFirstPerson = true;
document.addEventListener('dblclick', () => {
    toggleCameraView();
});

// Двойной тап для телефона
let lastTap = 0;
document.addEventListener('touchstart', (e) => {
    if (e.target === chopBtn || e.target === joystick || e.target === knob) return;
    const now = Date.now();
    if (now - lastTap < 300) {
        toggleCameraView();
    }
    lastTap = now;
});

function toggleCameraView() {
    isFirstPerson = !isFirstPerson;
    if (isFirstPerson) {
        camera.position.set(0, 0.6, 0);
        camera.fov = 70;
        playerGroup.visible = false;
        showMessage('👁️ Вид от первого лица');
    } else {
        camera.position.set(0, 1.2, 2.5);
        camera.fov = 50;
        playerGroup.visible = true;
        showMessage('👤 Вид от третьего лица');
    }
    camera.updateProjectionMatrix();
}

// По умолчанию скрываем тело в первом лице
playerGroup.visible = false;

// ========== ОСНОВНОЙ ЦИКЛ ==========
function animate() {
    requestAnimationFrame(animate);
    
    // Движение
    if (moveX !== 0 || moveZ !== 0) {
        const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        const speed = 0.04;
        
        // Двигаем камеру и тело
        const moveVec = new THREE.Vector3()
            .addScaledVector(forward, moveZ * speed)
            .addScaledVector(right, moveX * speed);
        
        camera.position.add(moveVec);
        playerGroup.position.copy(camera.position);
        playerGroup.position.y = -0.1;
        
        // Поворачиваем тело в направлении движения
        if (moveVec.length() > 0.001) {
            const targetAngle = Math.atan2(moveVec.x, moveVec.z);
            playerGroup.rotation.y = targetAngle;
        }
    }
    
    // Обновляем рубку
    if (isChopping) {
        updateChopping();
    }
    
    // Ограничение островом
    const dist = Math.sqrt(camera.position.x**2 + camera.position.z**2);
    if (dist > 5.5) {
        camera.position.x = (camera.position.x/dist) * 5.5;
        camera.position.z = (camera.position.z/dist) * 5.5;
        playerGroup.position.copy(camera.position);
        playerGroup.position.y = -0.1;
    }
    
    // Поворот камеры
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
    
    // В 3-м лице камера смотрит на игрока
    if (!isFirstPerson) {
        const offset = new THREE.Vector3(0, 0.6, 0);
        const targetPos = playerGroup.position.clone().add(offset);
        camera.position.lerp(targetPos, 0.1);
        camera.lookAt(playerGroup.position.clone().add(new THREE.Vector3(0, 0.3, 0)));
    }
    
    renderer.render(scene, camera);
}
animate();

// ========== АДАПТАЦИЯ ==========
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========== СТАРТОВОЕ СООБЩЕНИЕ ==========
showMessage('🌴 Добро пожаловать! Собери 5 древесины для топора');
