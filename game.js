import * as THREE from 'three';

// --- СЦЕНА ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- СВЕТ ---
const ambient = new THREE.AmbientLight(0x404060);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
sun.position.set(20, 30, 10);
sun.castShadow = true;
scene.add(sun);

// --- ОКЕАН ---
const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x1a6e8a, transparent: true, opacity: 0.8 })
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -0.2;
scene.add(ocean);

// --- ОСТРОВ ---
const island = new THREE.Mesh(
    new THREE.CircleGeometry(5, 32),
    new THREE.MeshStandardMaterial({ color: 0xc2b280, roughness: 0.9 })
);
island.rotation.x = -Math.PI / 2;
island.position.y = -0.1;
island.receiveShadow = true;
scene.add(island);

// --- ТРАВА ---
for (let i = 0; i < 300; i++) {
    const grass = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.02, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x3cb371 })
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 3.5;
    grass.position.set(Math.cos(angle) * radius, -0.05, Math.sin(angle) * radius);
    scene.add(grass);
}

// --- ДЕРЕВЬЯ ---
const trees = [];
const woodCountSpan = document.getElementById('woodCount');
let wood = 0;

function createTree(x, z) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 1.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    group.add(trunk);
    
    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 7),
        new THREE.MeshStandardMaterial({ color: 0x228B22 })
    );
    crown.position.y = 2.0;
    crown.castShadow = true;
    group.add(crown);
    
    group.position.set(x, 0, z);
    scene.add(group);
    trees.push(group);
}

for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 2.5 + Math.random() * 1.5;
    createTree(Math.cos(angle) * radius, Math.sin(angle) * radius);
}
createTree(0.8, 0.8);
createTree(-0.7, -0.9);

// --- СОЗДАЁМ КНОПКИ (ПРЯМО В JS) ---

// 1. Джойстик (левая нижняя часть)
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

// 2. Кнопка рубки (правая нижняя часть)
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
    font-weight: bold;
`;
chopBtn.textContent = '🪓';
document.body.appendChild(chopBtn);

// --- ПЕРЕМЕННЫЕ ДВИЖЕНИЯ ---
let moveX = 0, moveZ = 0;
let pitch = 0, yaw = 0;
const speed = 0.05;

// --- ДЖОЙСТИК: ОБРАБОТКА ---
joystick.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = rect.width/2 - 25;
    
    if (dist > maxDist) {
        moveX = (dx/dist) * 0.8;
        moveZ = (dy/dist) * 0.8;
    } else {
        moveX = dx/maxDist * 0.8;
        moveZ = dy/maxDist * 0.8;
    }
    knob.style.transform = `translate(calc(-50% + ${moveX*50}px), calc(-50% + ${moveZ*50}px))`;
});

joystick.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = rect.width/2 - 25;
    
    if (dist > maxDist) {
        moveX = (dx/dist) * 0.8;
        moveZ = (dy/dist) * 0.8;
    } else {
        moveX = dx/maxDist * 0.8;
        moveZ = dy/maxDist * 0.8;
    }
    knob.style.transform = `translate(calc(-50% + ${moveX*50}px), calc(-50% + ${moveZ*50}px))`;
});

joystick.addEventListener('touchend', (e) => {
    e.preventDefault();
    moveX = 0;
    moveZ = 0;
    knob.style.transform = 'translate(-50%, -50%)';
});

// --- ПОВОРОТ КАМЕРЫ (СВАЙП) ---
let touchStartX = 0, touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    if (e.target === joystick || e.target === chopBtn || e.target === knob) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
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
    pitch = Math.max(-1.0, Math.min(1.0, pitch));
}, { passive: false });

// --- РУБКА ДЕРЕВА ---
function chopTree() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(trees);
    
    if (intersects.length > 0) {
        const hit = intersects[0].object;
        // Находим родительскую группу
        let parent = hit;
        while (parent.parent && !trees.includes(parent)) {
            parent = parent.parent;
        }
        const index = trees.indexOf(parent);
        if (index !== -1) {
            scene.remove(trees[index]);
            trees.splice(index, 1);
            wood += 1;
            woodCountSpan.textContent = wood;
        }
    }
}

chopBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    chopTree();
});

chopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chopTree();
});

// --- АНИМАЦИЯ ---
function animate() {
    requestAnimationFrame(animate);
    
    // Движение
    if (moveX !== 0 || moveZ !== 0) {
        const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        camera.position.x += forward.x * moveZ * speed + right.x * moveX * speed;
        camera.position.z += forward.z * moveZ * speed + right.z * moveX * speed;
    }
    
    // Ограничение островом
    const dist = Math.sqrt(camera.position.x**2 + camera.position.z**2);
    if (dist > 4.8) {
        camera.position.x = (camera.position.x/dist) * 4.8;
        camera.position.z = (camera.position.z/dist) * 4.8;
    }
    
    // Поворот камеры
    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
