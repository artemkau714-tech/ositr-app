import * as THREE from 'three';

// --- Инициализация ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// Камера на уровне 0.5 (чуть выше земли, чтобы видеть траву)
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- Свет ---
const ambient = new THREE.AmbientLight(0x404060);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
sun.position.set(20, 30, 10);
sun.castShadow = true;
scene.add(sun);

// --- Океан ---
const oceanGeo = new THREE.PlaneGeometry(200, 200);
const oceanMat = new THREE.MeshStandardMaterial({ color: 0x1a6e8a, transparent: true, opacity: 0.8 });
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -0.2;
scene.add(ocean);

// --- Остров (земля) ---
const islandGeo = new THREE.CircleGeometry(5, 32);
const islandMat = new THREE.MeshStandardMaterial({ color: 0xc2b280, roughness: 0.9 });
const island = new THREE.Mesh(islandGeo, islandMat);
island.rotation.x = -Math.PI / 2;
island.position.y = -0.1;
island.receiveShadow = true;
scene.add(island);

// --- Трава ---
for (let i = 0; i < 300; i++) {
    const grass = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.02, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x3cb371 })
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 3.5;
    grass.position.set(Math.cos(angle) * radius, -0.05, Math.sin(angle) * radius);
    grass.rotation.y = Math.random() * Math.PI;
    scene.add(grass);
}

// --- Деревья (чуть больше, чтобы быть выше игрока) ---
const trees = [];
const woodCountSpan = document.getElementById('woodCount');
let wood = 0;

function createTree(x, z) {
    const group = new THREE.Group();
    
    // Ствол выше (1.8)
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 1.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    group.add(trunk);
    
    // Крона больше
    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 7),
        new THREE.MeshStandardMaterial({ color: 0x228B22 })
    );
    crown.position.y = 2.0;
    crown.castShadow = true;
    group.add(crown);
    
    group.position.set(x, 0, z);
    scene.add(group);
    
    trees.push({
        mesh: group,
        pos: new THREE.Vector3(x, 0, z),
        radius: 1.0
    });
}

// Расставляем деревья
for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 2.5 + Math.random() * 1.5;
    createTree(Math.cos(angle) * radius, Math.sin(angle) * radius);
}
createTree(0.8, 0.8);
createTree(-0.7, -0.9);

// --- ДЖОЙСТИК (для телефона) ---
const joystickContainer = document.createElement('div');
joystickContainer.style.cssText = `
    position: absolute;
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
document.body.appendChild(joystickContainer);

const joystickKnob = document.createElement('div');
joystickKnob.style.cssText = `
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
joystickContainer.appendChild(joystickKnob);

// --- КНОПКА РУБКИ (для телефона) ---
const chopBtn = document.createElement('div');
chopBtn.style.cssText = `
    position: absolute;
    bottom: 40px;
    right: 30px;
    width: 80px;
    height: 80px;
    border-radius: 40px;
    background: rgba(255, 200, 0, 0.3);
    border: 3px solid #ffd700;
    color: #ffd700;
    font-size: 30px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    user-select: none;
    touch-action: none;
    text-shadow: 0 0 10px rgba(255,215,0,0.5);
    backdrop-filter: blur(4px);
`;
chopBtn.textContent = '🪓';
document.body.appendChild(chopBtn);

// --- Переменные для движения ---
let moveX = 0;
let moveZ = 0;
let pitch = 0;
let yaw = 0;
const speed = 0.05;

// --- Управление джойстиком ---
joystickContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystickContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = rect.width / 2 - 25;
    
    if (dist > maxDist) {
        moveX = (dx / dist) * 0.8;
        moveZ = (dy / dist) * 0.8;
    } else {
        moveX = dx / maxDist * 0.8;
        moveZ = dy / maxDist * 0.8;
    }
    
    joystickKnob.style.transform = `translate(calc(-50% + ${moveX * 50}px), calc(-50% + ${moveZ * 50}px))`;
});

joystickContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystickContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = rect.width / 2 - 25;
    
    if (dist > maxDist) {
        moveX = (dx / dist) * 0.8;
        moveZ = (dy / dist) * 0.8;
    } else {
        moveX = dx / maxDist * 0.8;
        moveZ = dy / maxDist * 0.8;
    }
    
    joystickKnob.style.transform = `translate(calc(-50% + ${moveX * 50}px), calc(-50% + ${moveZ * 50}px))`;
});

joystickContainer.addEventListener('touchend', (e) => {
    e.preventDefault();
    moveX = 0;
    moveZ = 0;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
});

// --- Поворот камеры (свайп по экрану) ---
let touchStartX = 0, touchStartY = 0;

renderer.domElement.addEventListener('touchstart', (e) => {
    // Игнорируем, если коснулись джойстика или кнопки
    if (e.target === joystickContainer || e.target === chopBtn || e.target === joystickKnob) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

renderer.domElement.addEventListener('touchmove', (e) => {
    if (e.target === joystickContainer || e.target === chopBtn || e.target === joystickKnob) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    yaw -= dx * 0.005;
    pitch -= dy * 0.005;
    pitch = Math.max(-1.0, Math.min(1.0, pitch));
});

// --- Кнопка рубки ---
chopBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    chopTree();
});

chopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chopTree();
});

// --- Функция рубки дерева ---
function chopTree() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const treeMeshes = trees.map(t => t.mesh);
    const intersects = raycaster.intersectObjects(treeMeshes);
    
    if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const index = trees.findIndex(t => t.mesh === hitMesh);
        if (index !== -1) {
            scene.remove(trees[index].mesh);
            trees.splice(index, 1);
            wood += 1;
            woodCountSpan.textContent = wood;
        }
    }
}

// --- Сбор ресурсов (ПК) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
    if (event.target === joystickContainer || event.target === chopBtn) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const treeMeshes = trees.map(t => t.mesh);
    const intersects = raycaster.intersectObjects(treeMeshes);
    
    if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const index = trees.findIndex(t => t.mesh === hitMesh);
        if (index !== -1) {
            scene.remove(trees[index].mesh);
            trees.splice(index, 1);
            wood += 1;
            woodCountSpan.textContent = wood;
        }
    }
});

// --- Обновление HUD ---
const hint = document.getElementById('hint');
if (hint) {
    hint.innerHTML = '🕹️ Джойстик — ходьба | 🪓 Кнопка — рубить | Свайп — крутить головой';
}

// --- Анимация ---
function animate() {
    requestAnimationFrame(animate);
    
    // Движение от джойстика
    if (moveX !== 0 || moveZ !== 0) {
        const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        
        // Перемещение (Z - вперёд, X - вправо)
        camera.position.x += forward.x * moveZ * speed + right.x * moveX * speed;
        camera.position.z += forward.z * moveZ * speed + right.z * moveX * speed;
    }
    
    // Ограничение островом
    const distFromCenter = Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z);
    if (distFromCenter > 4.8) {
        camera.position.x = (camera.position.x / distFromCenter) * 4.8;
        camera.position.z = (camera.position.z / distFromCenter) * 4.8;
    }
    
    // Поворот камеры
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
    
    renderer.render(scene, camera);
}
animate();

// --- Адаптация под экран ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
