import * as THREE from 'three';

// --- Инициализация ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// Камера на уровне глаз (1.7) - вид от первого лица
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.7, 0);

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
    grass.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    grass.rotation.y = Math.random() * Math.PI;
    scene.add(grass);
}

// --- Деревья ---
const trees = [];
const woodCountSpan = document.getElementById('woodCount');
let wood = 0;

function createTree(x, z) {
    const group = new THREE.Group();
    
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    trunk.position.y = 0.6;
    trunk.castShadow = true;
    group.add(trunk);
    
    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 6),
        new THREE.MeshStandardMaterial({ color: 0x228B22 })
    );
    crown.position.y = 1.5;
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

// --- Управление от первого лица (только поворот камеры) ---
let pitch = 0;
let yaw = 0;

// Поворот мышью (ПК)
document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === renderer.domElement) {
        yaw -= event.movementX * 0.002;
        pitch -= event.movementY * 0.002;
        pitch = Math.max(-1.2, Math.min(1.2, pitch));
    }
});

// Поворот на телефоне (по свайпу)
let touchStartX = 0, touchStartY = 0;

renderer.domElement.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

renderer.domElement.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    yaw -= dx * 0.005;
    pitch -= dy * 0.005;
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
});

// Клик для блокировки курсора (ПК)
renderer.domElement.addEventListener('click', () => {
    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
    }
});

// --- Сбор ресурсов ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function handleTreeHit(event) {
    if (event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
    } else {
        // Для телефона - луч по центру
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    }
    
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

renderer.domElement.addEventListener('click', handleTreeHit);

// Тап по экрану на телефоне
renderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        handleTreeHit(null);
    }
}, { passive: true });

// --- Анимация (без движения, просто обновляем поворот камеры) ---
function animate() {
    requestAnimationFrame(animate);
    
    // Применяем поворот камеры
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
