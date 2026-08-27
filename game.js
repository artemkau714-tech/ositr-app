import * as THREE from 'three';

// --- Инициализация ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 30, 60); // Туман для красоты

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.7, 5); // Рост 1.7 - глаза человека

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- Свет ---
const ambient = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffeedd, 1.8);
sun.position.set(20, 30, 10);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 50;
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
scene.add(sun);

const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.4);
scene.add(hemi);

// --- Океан (бесконечная плоскость) ---
const oceanGeo = new THREE.PlaneGeometry(200, 200);
const oceanMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a6e8a, 
    transparent: true, 
    opacity: 0.85,
    roughness: 0.3,
    metalness: 0.1
});
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -0.15;
ocean.receiveShadow = true;
scene.add(ocean);

// --- Остров (земля) ---
const islandGeo = new THREE.CircleGeometry(6, 64);
const islandMat = new THREE.MeshStandardMaterial({ 
    color: 0xc2b280, 
    roughness: 0.9,
    metalness: 0
});
const island = new THREE.Mesh(islandGeo, islandMat);
island.rotation.x = -Math.PI / 2;
island.position.y = -0.05;
island.receiveShadow = true;
scene.add(island);

// --- Трава на острове ---
for (let i = 0; i < 400; i++) {
    const grass = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, 0.08),
        new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(0.28 + Math.random()*0.07, 0.6, 0.3 + Math.random()*0.15),
            roughness: 1
        })
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 5.2;
    grass.position.set(Math.cos(angle) * radius, -0.02, Math.sin(angle) * radius);
    grass.rotation.y = Math.random() * Math.PI;
    grass.receiveShadow = true;
    scene.add(grass);
}

// --- Деревья ---
const trees = [];
const woodCountSpan = document.getElementById('woodCount');
let wood = 0;

// Функция создания пальмы
function createTree(x, z) {
    const group = new THREE.Group();
    
    // Ствол (изогнутый)
    const trunkHeight = 1.0 + Math.random() * 0.8;
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.2, trunkHeight, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 })
    );
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.rotation.z = (Math.random() - 0.5) * 0.2;
    trunk.rotation.x = (Math.random() - 0.5) * 0.2;
    group.add(trunk);
    
    // Крона (пальмовые листья)
    const leafMat = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color().setHSL(0.28 + Math.random()*0.05, 0.7, 0.3 + Math.random()*0.15),
        roughness: 0.8
    });
    
    for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 0.1, 4),
            leafMat
        );
        const angle = (i / 6) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 0.4, trunkHeight + 0.1, Math.sin(angle) * 0.4);
        leaf.rotation.x = Math.PI / 2.5;
        leaf.rotation.z = angle;
        leaf.castShadow = true;
        group.add(leaf);
    }
    
    // Центральная точка кроны
    const crownCenter = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6),
        new THREE.MeshStandardMaterial({ color: 0x228B22 })
    );
    crownCenter.position.y = trunkHeight + 0.1;
    crownCenter.castShadow = true;
    group.add(crownCenter);
    
    group.position.set(x, 0, z);
    // Случайный поворот дерева
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
    
    trees.push({
        mesh: group,
        pos: new THREE.Vector3(x, 0, z),
        radius: 0.8
    });
}

// Расставляем деревья
for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 2.0 + Math.random() * 2.5;
    createTree(Math.cos(angle) * radius, Math.sin(angle) * radius);
}
// Несколько деревьев в центре
createTree(1.0, 0.5);
createTree(-0.8, -1.0);
createTree(0.3, -1.5);

// --- Камни (декорация) ---
for (let i = 0; i < 20; i++) {
    const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.15),
        new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.1
        })
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 3.5;
    stone.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    stone.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    stone.castShadow = true;
    stone.receiveShadow = true;
    scene.add(stone);
}

// --- Управление WASD + мышь (вид от первого лица) ---
const keys = { w: false, a: false, s: false, d: false };
let pitch = 0; // Вверх-вниз
let yaw = 0;   // Влево-вправо
const velocity = new THREE.Vector3(0, 0, 0);
const speed = 0.08;
const gravity = -0.008;
let verticalVelocity = 0;
const jumpStrength = 0.15;
const groundY = 1.7; // Высота глаз над землёй

// Блокировка курсора для мыши (на ПК)
renderer.domElement.addEventListener('click', () => {
    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
    }
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
        document.addEventListener('mousemove', onMouseMove);
    } else {
        document.removeEventListener('mousemove', onMouseMove);
    }
});

function onMouseMove(event) {
    yaw -= event.movementX * 0.002;
    pitch -= event.movementY * 0.002;
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
}

// Клавиши
document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === ' ' && verticalVelocity === 0) {
        verticalVelocity = jumpStrength;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

// Сенсорное управление для телефона
let touchX = 0, touchY = 0;
let touchStartX = 0, touchStartY = 0;
let isTouching = false;

renderer.domElement.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isTouching = true;
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

renderer.domElement.addEventListener('touchend', () => {
    isTouching = false;
});

// --- Сбор ресурсов по клику (Raycaster) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
    if (document.pointerLockElement !== renderer.domElement) return;
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Получаем все объекты-деревья
    const treeMeshes = trees.map(t => t.mesh);
    const intersects = raycaster.intersectObjects(treeMeshes, true);
    
    if (intersects.length > 0) {
        let hitTree = null;
        let hitIndex = -1;
        // Находим родительскую группу дерева
        for (let i = 0; i < intersects.length; i++) {
            let obj = intersects[i].object;
            while (obj.parent && !trees.some(t => t.mesh === obj)) {
                obj = obj.parent;
            }
            const index = trees.findIndex(t => t.mesh === obj);
            if (index !== -1) {
                hitIndex = index;
                hitTree = trees[index];
                break;
            }
        }
        
        if (hitTree) {
            scene.remove(hitTree.mesh);
            trees.splice(hitIndex, 1);
            wood += 1;
            woodCountSpan.textContent = wood;
        }
    }
}, false);

// Для телефона - по нажатию на экран рубим дерево по центру
renderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        // Рубим дерево в центре экрана
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const treeMeshes = trees.map(t => t.mesh);
        const intersects = raycaster.intersectObjects(treeMeshes, true);
        
        if (intersects.length > 0) {
            let hitTree = null;
            let hitIndex = -1;
            for (let i = 0; i < intersects.length; i++) {
                let obj = intersects[i].object;
                while (obj.parent && !trees.some(t => t.mesh === obj)) {
                    obj = obj.parent;
                }
                const index = trees.findIndex(t => t.mesh === obj);
                if (index !== -1) {
                    hitIndex = index;
                    hitTree = trees[index];
                    break;
                }
            }
            
            if (hitTree) {
                scene.remove(hitTree.mesh);
                trees.splice(hitIndex, 1);
                wood += 1;
                woodCountSpan.textContent = wood;
            }
        }
    }
}, { passive: true });

// --- Обновление HUD ---
// Добавляем отображение координат
const hud = document.getElementById('hud');
const coordDisplay = document.createElement('div');
coordDisplay.style.cssText = 'font-size: 12px; color: #888; margin-top: 5px;';
coordDisplay.id = 'coords';
hud.appendChild(coordDisplay);

// --- Игровой цикл ---
function animate() {
    requestAnimationFrame(animate);
    
    // --- Движение (WASD) ---
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    
    velocity.set(0, 0, 0);
    if (keys.w) velocity.add(forward);
    if (keys.s) velocity.sub(forward);
    if (keys.a) velocity.sub(right);
    if (keys.d) velocity.add(right);
    
    if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(speed);
    }
    
    // Гравитация
    verticalVelocity += gravity;
    if (verticalVelocity < -0.3) verticalVelocity = -0.3;
    
    // Перемещение
    camera.position.x += velocity.x;
    camera.position.z += velocity.z;
    camera.position.y += verticalVelocity;
    
    // Столкновение с землёй
    if (camera.position.y < groundY) {
        camera.position.y = groundY;
        verticalVelocity = 0;
    }
    
    // Ограничение островом (не даём упасть в воду)
    const distFromCenter = Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z);
    if (distFromCenter > 5.5) {
        camera.position.x = (camera.position.x / distFromCenter) * 5.5;
        camera.position.z = (camera.position.z / distFromCenter) * 5.5;
    }
    
    // Поворот камеры (вид от первого лица)
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
    
    // --- Обновление координат в HUD ---
    const coords = document.getElementById('coords');
    if (coords) {
        coords.textContent = `📍 ${camera.position.x.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
    }
    
    renderer.render(scene, camera);
}
animate();

// --- Адаптация под экран ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});