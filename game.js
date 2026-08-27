import * as THREE from 'three';

// ========== НАСТРОЙКИ ==========
const WOOD_FOR_AXE = 3;
const HOTBAR_SLOTS = 9;
const TREE_REGROW_TIME = 20000; // 20 секунд
const SHARK_SPAWN_INTERVAL = 30000; // 30 секунд

// ========== СЦЕНА ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 30, 60);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.7, 0);

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
scene.add(sun);
const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.6);
scene.add(hemi);

// ========== ОКЕАН ==========
const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x1a6e8a, transparent: true, opacity: 0.85, roughness: 0.3 })
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

// ========== ТРАВА ==========
const grassBlades = [];
for (let i = 0; i < 400; i++) {
    const blade = new THREE.Mesh(
        new THREE.PlaneGeometry(0.02, 0.15 + Math.random() * 0.25),
        new THREE.MeshStandardMaterial({ color: 0x4caf50, side: THREE.DoubleSide })
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 5.2;
    blade.position.set(Math.cos(angle) * radius, -0.05, Math.sin(angle) * radius);
    blade.rotation.y = Math.random() * Math.PI * 2;
    blade.rotation.x = -0.1 + Math.random() * 0.2;
    blade.userData = { phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 0.5, baseRot: blade.rotation.x };
    scene.add(blade);
    grassBlades.push(blade);
}

// ========== ДЕРЕВЬЯ (С РЕГЕНЕРАЦИЕЙ) ==========
const trees = [];
const treeLogs = [];
const treePositions = [];

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
        new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 })
    );
    crown.position.y = height + 0.2;
    crown.castShadow = true;
    group.add(crown);
    
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
    trees.push(group);
    treePositions.push({ x, z, regrowTimer: 0, isGrowing: false });
    return group;
}

// Расставляем деревья
for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 1.5 + Math.random() * 3.5;
    createTree(Math.cos(angle) * radius, Math.sin(angle) * radius);
}
createTree(0.8, 0.8);
createTree(-0.6, -1.0);

// ========== ЖИВОТНЫЕ ==========
const animals = [];

function createAnimal(type, x, z) {
    const group = new THREE.Group();
    const colors = {
        cow: { body: 0xffffff, spots: 0x333333 },
        chicken: { body: 0xffd700, comb: 0xff0000 },
        pig: { body: 0xffb6c1, spots: 0xff69b4 }
    };
    const color = colors[type] || colors.cow;
    
    // Тело
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8),
        new THREE.MeshStandardMaterial({ color: color.body, roughness: 0.8 })
    );
    body.scale.set(1, 0.8, 1.2);
    body.position.y = 0.15;
    body.castShadow = true;
    group.add(body);
    
    // Голова
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6),
        new THREE.MeshStandardMaterial({ color: color.body, roughness: 0.8 })
    );
    head.position.set(0.12, 0.2, 0.1);
    group.add(head);
    
    // Ноги
    const legMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    for (let side of [-0.08, 0.08]) {
        for (let front of [-0.08, 0.08]) {
            const leg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.025, 0.08, 4),
                legMat
            );
            leg.position.set(side, 0.04, front);
            group.add(leg);
        }
    }
    
    group.position.set(x, 0, z);
    group.userData = {
        type: type,
        angle: Math.random() * Math.PI * 2,
        radius: 0.5 + Math.random() * 1.5,
        speed: 0.2 + Math.random() * 0.3,
        centerX: x,
        centerZ: z,
        phase: Math.random() * Math.PI * 2
    };
    scene.add(group);
    animals.push(group);
    return group;
}

// Расставляем животных
const animalTypes = ['cow', 'chicken', 'pig'];
for (let i = 0; i < 9; i++) {
    const type = animalTypes[i % 3];
    const angle = Math.random() * Math.PI * 2;
    const radius = 1 + Math.random() * 3.5;
    createAnimal(type, Math.cos(angle) * radius, Math.sin(angle) * radius);
}

// ========== РЕСУРСЫ В ВОДЕ ==========
const waterResources = [];
const resourceTypes = [
    { name: 'paper', color: 0xf5f5dc, icon: '📄' },
    { name: 'stone', color: 0x808080, icon: '🪨' },
    { name: 'iron', color: 0x8B8B8B, icon: '⛏️' },
    { name: 'wood', color: 0x8B5A2B, icon: '🪵' },
    { name: 'barrel', color: 0x8B4513, icon: '🛢️' },
    { name: 'chest', color: 0xDAA520, icon: '📦' }
];

function createWaterResource(type, x, z) {
    const data = resourceTypes.find(r => r.name === type) || resourceTypes[0];
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.7 })
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 6.5 + Math.random() * 3;
    mesh.position.set(Math.cos(angle) * radius, -0.05, Math.sin(angle) * radius);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.castShadow = true;
    mesh.userData = { type: type, bobPhase: Math.random() * Math.PI * 2, icon: data.icon };
    scene.add(mesh);
    waterResources.push(mesh);
    return mesh;
}

// Создаём ресурсы в воде
for (let i = 0; i < 15; i++) {
    const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)].name;
    createWaterResource(type);
}

// ========== АКУЛА ==========
let shark = null;
let sharkActive = false;
let sharkTimer = 0;

function createShark() {
    if (shark) {
        scene.remove(shark);
        shark = null;
    }
    
    const group = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.15, 0.4, 6),
        new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 })
    );
    body.rotation.x = Math.PI / 2;
    body.position.z = 0.05;
    group.add(body);
    
    const fin = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.08, 4),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    fin.position.set(0, 0.06, -0.05);
    group.add(fin);
    
    const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.06, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    tail.position.set(0, 0, -0.2);
    group.add(tail);
    
    const angle = Math.random() * Math.PI * 2;
    const radius = 7 + Math.random() * 2;
    group.position.set(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius);
    group.rotation.y = -angle + Math.PI / 2;
    group.userData = {
        angle: angle,
        radius: radius,
        speed: 0.3 + Math.random() * 0.2,
        direction: 1
    };
    scene.add(group);
    shark = group;
    sharkActive = true;
    showMessage('🦈 Акула появилась в воде!');
}

// ========== ВЕРСТАК ==========
const workbench = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.1, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 })
);
workbench.position.set(0, 0.05, 0);
workbench.castShadow = true;
workbench.receiveShadow = true;
scene.add(workbench);

// Ножки верстака
for (let x of [-0.2, 0.2]) {
    for (let z of [-0.2, 0.2]) {
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.025, 0.05, 4),
            new THREE.MeshStandardMaterial({ color: 0x5D4037 })
        );
        leg.position.set(x, -0.02, z);
        scene.add(leg);
    }
}

// Инструменты на верстаке (декор)
const toolMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
for (let i = 0; i < 3; i++) {
    const tool = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.01, 0.04),
        toolMat
    );
    tool.position.set(-0.1 + i * 0.1, 0.1, 0.1);
    tool.rotation.x = Math.random() * 0.3;
    scene.add(tool);
}

// ========== ИНВЕНТАРЬ (ХОТБАР) ==========
let inventory = { slots: new Array(HOTBAR_SLOTS).fill(null), selectedSlot: 0 };
let hunger = 100;
let hasAxe = false;
let isChopping = false;
let chopProgress = 0;
let targetTree = null;
let isCrafting = false;

// Создаём хотбар
const hotbarDiv = document.createElement('div');
hotbarDiv.style.cssText = `
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 4px; z-index: 150;
    background: rgba(0,0,0,0.6); padding: 6px 10px; border-radius: 8px;
    border: 2px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px);
`;
const slotElements = [];
for (let i = 0; i < HOTBAR_SLOTS; i++) {
    const slot = document.createElement('div');
    slot.className = 'hotbar-slot';
    slot.style.cssText = `
        width: 48px; height: 48px; background: rgba(0,0,0,0.4);
        border: 2px solid ${i === 0 ? '#ffd700' : 'rgba(255,255,255,0.2)'};
        border-radius: 4px; display: flex; flex-direction: column;
        align-items: center; justify-content: center; color: white;
        font-size: 20px; position: relative; transition: all 0.2s;
        cursor: pointer;
    `;
    slot.innerHTML = `<span class="slot-icon"></span><span class="slot-count" style="font-size:10px;position:absolute;bottom:2px;right:4px;color:#ffd700;font-weight:bold;"></span>`;
    slot.dataset.index = i;
    slot.addEventListener('click', () => selectSlot(i));
    hotbarDiv.appendChild(slot);
    slotElements.push(slot);
}
document.body.appendChild(hotbarDiv);

// Кнопки управления
const actionBtn = document.createElement('div');
actionBtn.style.cssText = `
    position: fixed; bottom: 100px; right: 30px; width: 70px; height: 70px;
    border-radius: 35px; background: rgba(255,200,0,0.25); border: 3px solid #ffd700;
    color: #ffd700; font-size: 30px; display: flex; align-items: center;
    justify-content: center; z-index: 200; user-select: none; touch-action: none;
    backdrop-filter: blur(4px);
`;
actionBtn.textContent = '⚔️';
document.body.appendChild(actionBtn);

// Джойстик
const joystick = document.createElement('div');
joystick.style.cssText = `
    position: fixed; bottom: 100px; left: 30px; width: 120px; height: 120px;
    border-radius: 60px; background: rgba(255,255,255,0.12);
    border: 2px solid rgba(255,255,255,0.25); backdrop-filter: blur(4px);
    z-index: 200; touch-action: none;
`;
const knob = document.createElement('div');
knob.style.cssText = `
    position: absolute; top: 50%; left: 50%; width: 50px; height: 50px;
    border-radius: 25px; background: radial-gradient(circle, rgba(255,255,255,0.5), rgba(255,255,255,0.2));
    transform: translate(-50%, -50%); box-shadow: 0 0 20px rgba(0,0,0,0.3);
`;
joystick.appendChild(knob);
document.body.appendChild(joystick);

// ========== ФУНКЦИИ ИНВЕНТАРЯ ==========
function selectSlot(index) {
    inventory.selectedSlot = index;
    slotElements.forEach((el, i) => {
        el.style.border = i === index ? '2px solid #ffd700' : '2px solid rgba(255,255,255,0.2)';
        el.style.background = i === index ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.4)';
    });
}

function updateHotbar() {
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
}

function addToInventory(itemId, itemName, icon, count = 1) {
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
        if (inventory.slots[i] && inventory.slots[i].id === itemId) {
            inventory.slots[i].count += count;
            updateHotbar();
            return true;
        }
    }
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
        if (!inventory.slots[i] || inventory.slots[i].count === 0) {
            inventory.slots[i] = { id: itemId, name: itemName, icon: icon, count: count };
            updateHotbar();
            return true;
        }
    }
    return false;
}

function hasItem(itemId) {
    for (let slot of inventory.slots) {
        if (slot && slot.id === itemId && slot.count > 0) return true;
    }
    return false;
}

function removeItem(itemId, count = 1) {
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
        if (inventory.slots[i] && inventory.slots[i].id === itemId) {
            if (inventory.slots[i].count >= count) {
                inventory.slots[i].count -= count;
                updateHotbar();
                return true;
            }
        }
    }
    return false;
                                       }// ========== УПРАВЛЕНИЕ ==========
let moveX = 0, moveZ = 0;
let pitch = -0.1, yaw = 0;

joystick.addEventListener('touchstart', handleJoystick);
joystick.addEventListener('touchmove', handleJoystick);
joystick.addEventListener('touchend', () => {
    moveX = 0; moveZ = 0;
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

// Поворот камеры
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', (e) => {
    if (e.target === joystick || e.target === actionBtn || e.target === knob) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (e.target === joystick || e.target === actionBtn || e.target === knob) return;
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

// ========== СБОР РЕСУРСОВ ==========
function collectResource() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(waterResources);
    
    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const index = waterResources.indexOf(hit);
        if (index !== -1) {
            const type = hit.userData.type;
            const icon = hit.userData.icon || '📦';
            scene.remove(hit);
            waterResources.splice(index, 1);
            
            addToInventory(type, type, icon, 1);
            showMessage(`${icon} +1 ${type}`);
            
            // Респавн ресурса через 10 секунд
            setTimeout(() => {
                const newType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)].name;
                createWaterResource(newType);
            }, 10000);
            return true;
        }
    }
    return false;
}

// Сбор палок
function collectStick() {
    // (упрощённо - палки теперь не нужны, ресурсы в воде)
    return false;
}

// ========== РУБКА ==========
function startChopping() {
    if (isChopping) return;
    
    // Проверяем топор
    if (!hasItem('axe')) {
        showMessage('🔨 Нужен топор! Собери ресурсы и создай на верстаке');
        return;
    }
    
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
    document.getElementById('hunger').textContent = `🪓 Рубка...`;
}

function updateChopping() {
    if (!isChopping || !targetTree) return;
    chopProgress += 0.02;
    if (chopProgress >= 1) {
        finishChopping();
    }
}

function finishChopping() {
    isChopping = false;
    document.getElementById('hunger').innerHTML = `🍖 Голод: <span id="hungerValue">${Math.floor(hunger)}</span>%`;
    
    if (targetTree) {
        const treePos = targetTree.position.clone();
        const index = trees.indexOf(targetTree);
        if (index !== -1) {
            scene.remove(targetTree);
            trees.splice(index, 1);
            
            // Сохраняем позицию для регенерации
            const posData = treePositions[index];
            if (posData) {
                posData.regrowTimer = TREE_REGROW_TIME;
                posData.isGrowing = true;
            }
            
            // Создаём брёвна
            for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
                const log = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.07, 0.15, 5),
                    new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 })
                );
                log.position.copy(treePos);
                log.position.x += (Math.random() - 0.5) * 0.3;
                log.position.z += (Math.random() - 0.5) * 0.3;
                log.position.y = 0.08;
                log.rotation.x = Math.random() * 0.5;
                log.rotation.z = Math.random() * 0.5;
                log.castShadow = true;
                scene.add(log);
                treeLogs.push(log);
            }
            showMessage('🪵 Дерево срублено! Собери брёвна');
        }
    }
    targetTree = null;
}

// ========== КРАФТ (ВЕРСТАК) ==========
const recipes = {
    'platform': { name: 'Платформа', icon: '🪵', ingredients: { wood: 3, stone: 1 } },
    'wall': { name: 'Стена', icon: '🧱', ingredients: { wood: 2, stone: 2 } },
    'roof': { name: 'Крыша', icon: '🏠', ingredients: { wood: 4, stone: 1 } },
    'raft': { name: 'Плот', icon: '🚣', ingredients: { wood: 5, iron: 2 } },
    'axe': { name: 'Топор', icon: '🪓', ingredients: { wood: 2, stone: 2, iron: 1 } }
};

function craftItem(recipeId) {
    const recipe = recipes[recipeId];
    if (!recipe) return false;
    
    // Проверяем ингредиенты
    for (let [item, count] of Object.entries(recipe.ingredients)) {
        let total = 0;
        for (let slot of inventory.slots) {
            if (slot && slot.id === item) total += slot.count;
        }
        if (total < count) {
            showMessage(`❌ Не хватает ${item} (нужно ${count})`);
            return false;
        }
    }
    
    // Забираем ингредиенты
    for (let [item, count] of Object.entries(recipe.ingredients)) {
        removeItem(item, count);
    }
    
    // Добавляем результат
    addToInventory(recipeId, recipe.name, recipe.icon, 1);
    showMessage(`✅ Создано: ${recipe.icon} ${recipe.name}`);
    return true;
}

// ========== ВЗАИМОДЕЙСТВИЕ С ВЕРСТАКОМ ==========
function interactWithWorkbench() {
    const dist = camera.position.distanceTo(workbench.position);
    if (dist > 2) {
        showMessage('📐 Подойди ближе к верстаку!');
        return;
    }
    
    // Показываем меню крафта (упрощённо)
    let menu = '📐 Верстак:\n';
    for (let [id, recipe] of Object.entries(recipes)) {
        let req = Object.entries(recipe.ingredients).map(([k, v]) => `${k}x${v}`).join(' ');
        menu += `\n${recipe.icon} ${recipe.name} (${req})`;
    }
    showMessage(menu.replace(/\n/g, ' | '));
    
    // Автоматически крафтим платформу для теста
    if (!hasItem('platform')) {
        craftItem('platform');
    }
}

// ========== ОБРАБОТЧИКИ КНОПОК ==========
actionBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Проверяем, смотрим ли на верстак
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects([workbench]);
    if (intersects.length > 0) {
        interactWithWorkbench();
        return;
    }
    
    // Иначе рубим дерево
    startChopping();
});

actionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects([workbench]);
    if (intersects.length > 0) {
        interactWithWorkbench();
        return;
    }
    startChopping();
});

// Сбор предметов по тапу
document.addEventListener('click', (e) => {
    if (e.target === actionBtn || e.target === joystick || e.target === knob) return;
    if (!isChopping) {
        if (!collectResource()) {
            // Собираем брёвна
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            const intersects = raycaster.intersectObjects(treeLogs);
            if (intersects.length > 0) {
                const hit = intersects[0].object;
                const index = treeLogs.indexOf(hit);
                if (index !== -1) {
                    scene.remove(treeLogs[index]);
                    treeLogs.splice(index, 1);
                    addToInventory('wood', 'Древесина', '🪵', 1);
                    showMessage('🪵 +1 древесина');
                }
            }
        }
    }
});

// ========== ГОЛОД ==========
let hungerTimer = 0;
function updateHunger(delta) {
    hungerTimer += delta;
    if (hungerTimer > 5000) { // каждые 5 секунд
        hungerTimer = 0;
        hunger -= 0.5;
        if (hunger < 0) hunger = 0;
        document.getElementById('hungerValue').textContent = Math.floor(hunger);
        if (hunger < 20) {
            showMessage('⚠️ Вы голодны! Найдите еду!');
        }
    }
}

// ========== УВЕДОМЛЕНИЯ ==========
let notificationTimeout = null;
function showMessage(text) {
    const oldMsg = document.querySelector('.notification');
    if (oldMsg) { oldMsg.remove(); if (notificationTimeout) clearTimeout(notificationTimeout); }
    const msg = document.createElement('div');
    msg.className = 'notification';
    msg.textContent = text;
    document.body.appendChild(msg);
    notificationTimeout = setTimeout(() => { if (msg.parentNode) msg.remove(); }, 2500);
}// ========== АНИМАЦИЯ ПРИРОДЫ ==========
function animateNature(time) {
    // Трава
    for (const blade of grassBlades) {
        const wind = Math.sin(time * 0.001 * blade.userData.speed + blade.userData.phase) * 0.08;
        blade.rotation.x = blade.userData.baseRot + wind;
    }
    
    // Животные (ходят по кругу)
    for (const animal of animals) {
        const data = animal.userData;
        data.angle += 0.003 * data.speed;
        const x = data.centerX + Math.cos(data.angle) * data.radius;
        const z = data.centerZ + Math.sin(data.angle) * data.radius;
        animal.position.set(x, 0, z);
        animal.rotation.y = -data.angle + Math.PI / 2;
    }
    
    // Ресурсы в воде (покачиваются)
    for (const res of waterResources) {
        const phase = res.userData.bobPhase || 0;
        res.position.y = -0.05 + Math.sin(time * 0.001 + phase) * 0.03;
        res.rotation.y += 0.005;
    }
    
    // Акула
    if (shark && sharkActive) {
        const data = shark.userData;
        data.angle += 0.005 * data.speed * data.direction;
        const x = Math.cos(data.angle) * data.radius;
        const z = Math.sin(data.angle) * data.radius;
        shark.position.set(x, 0.1 + Math.sin(time * 0.002 + data.angle) * 0.05, z);
        shark.rotation.y = -data.angle + Math.PI / 2;
        // Периодически меняет направление
        if (Math.random() < 0.001) data.direction *= -1;
    }
}

// ========== РЕГЕНЕРАЦИЯ ДЕРЕВЬЕВ ==========
function updateTreeRegrowth(delta) {
    for (let i = 0; i < treePositions.length; i++) {
        const data = treePositions[i];
        if (data.isGrowing) {
            data.regrowTimer -= delta;
            if (data.regrowTimer <= 0) {
                // Восстанавливаем дерево
                const newTree = createTree(data.x, data.z);
                // Обновляем ссылку в treePositions
                data.isGrowing = false;
                data.regrowTimer = 0;
                showMessage('🌱 Дерево восстановилось!');
            }
        }
    }
}

// ========== АКУЛА (СПАВН) ==========
let sharkSpawnTimer = 0;
function updateSharkSpawn(delta) {
    sharkSpawnTimer += delta;
    if (sharkSpawnTimer > SHARK_SPAWN_INTERVAL && !sharkActive) {
        createShark();
        sharkSpawnTimer = 0;
    }
    // Акула исчезает через 15 секунд
    if (sharkActive && shark) {
        shark.userData.lifeTime = (shark.userData.lifeTime || 0) + delta;
        if (shark.userData.lifeTime > 15000) {
            scene.remove(shark);
            shark = null;
            sharkActive = false;
        }
    }
}

// ========== ОСНОВНОЙ ЦИКЛ ==========
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);
    const delta = time - lastTime;
    lastTime = time;
    
    animateNature(time);
    updateTreeRegrowth(delta);
    updateSharkSpawn(delta);
    updateHunger(delta);
    
    // Движение
    if (moveX !== 0 || moveZ !== 0) {
        const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        const speed = 0.04;
        const moveVec = new THREE.Vector3()
            .addScaledVector(forward, moveZ * speed)
            .addScaledVector(right, moveX * speed);
        camera.position.add(moveVec);
    }
    
    // Рубка
    if (isChopping) updateChopping();
    
    // Ограничение островом
    const dist = Math.sqrt(camera.position.x**2 + camera.position.z**2);
    if (dist > 5.5) {
        camera.position.x = (camera.position.x/dist) * 5.5;
        camera.position.z = (camera.position.z/dist) * 5.5;
    }
    
    // Поворот камеры
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
    
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
showMessage('🌴 Добро пожаловать! Собирай ресурсы в воде и на земле');
showMessage('📐 Подойди к верстаку и нажми ⚔️ для крафта');

// Даём крюк в начале игры
addToInventory('hook', 'Крюк', '🪝', 1);
showMessage('🪝 Вы получили крюк!');
