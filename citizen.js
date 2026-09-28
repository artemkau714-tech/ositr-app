// ============ МИРНЫЙ ЖИТЕЛЬ (NPC-ГОРОЖАНИН) ============
// Ходит по городу, при атаке — агрится и бьёт руками.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { getTerrainHeight } from './world.js';

let citizenModel = null;
let citizenAnimations = [];
let modelLoaded = false;
let modelLoading = false;
const modelCallbacks = [];

// ============ ОЗВУЧКА ЖИТЕЛЕЙ ============
const CITIZEN_SOUNDS = {
  angry: ['orionov_angry.mp3']
};

const audioCache = {};

function playRandomSound(category, volume = 0.6) {
  const list = CITIZEN_SOUNDS[category];
  if (!list || list.length === 0) return;

  const src = list[Math.floor(Math.random() * list.length)];

  if (!audioCache[src]) {
    audioCache[src] = new Audio(src);
    audioCache[src].preload = 'auto';
  }

  const audio = audioCache[src].cloneNode();
  audio.volume = volume;
  audio.playbackRate = 0.95 + Math.random() * 0.1;

  audio.play().catch(e => {
    console.log('Звук не сыграл:', src, e.message);
  });
}

export function playCitizenAngry() {
  playRandomSound('angry', 0.3);
}

// ============ ЗАГРУЗКА МОДЕЛИ ============
export function loadCitizenModel(url = 'npc.glb') {
  if (modelLoaded) return Promise.resolve(citizenModel);
  if (modelLoading) return new Promise(res => modelCallbacks.push(res));

  modelLoading = true;
  const loader = new GLTFLoader();

  return new Promise((resolve) => {
    loader.load(url,
      (gltf) => {
        const rawModel = gltf.scene;

        citizenAnimations = gltf.animations || [];
        console.log('🎬 Найдено анимаций:', citizenAnimations.length);
        citizenAnimations.forEach((clip, i) => {
          console.log(`  [${i}] "${clip.name}"`);
        });

        const box = new THREE.Box3().setFromObject(rawModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const targetHeight = 2.4;
        const scaleFactor = targetHeight / Math.max(size.y, 0.0001);

        rawModel.userData._normalizeScale = scaleFactor;
        rawModel.userData._center = { x: center.x, y: box.min.y, z: center.z };

        rawModel.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
          }
        });

        citizenModel = rawModel;
        modelLoaded = true;
        modelLoading = false;
        modelCallbacks.forEach(cb => cb(citizenModel));
        modelCallbacks.length = 0;
        console.log('✅ npc.glb загружен и нормализован');
        resolve(citizenModel);
      },
      undefined,
      (err) => {
        console.error('❌ Не удалось загрузить npc.glb:', err);
        modelLoading = false;
        resolve(null);
      }
    );
  });
}

export function isCitizenModelLoaded() {
  return modelLoaded;
}

// ============ ПОИСК АНИМАЦИИ ============
function findAnimation(actions, ...keywords) {
  for (const keyword of keywords) {
    const lower = keyword.toLowerCase();
    for (const name in actions) {
      if (name.toLowerCase().includes(lower)) return actions[name];
    }
  }
  return null;
}

// ============ СОЗДАНИЕ ЖИТЕЛЯ ============
export function createCitizen(x, z, scene) {
  const group = new THREE.Group();

  let mixer = null;
  const actions = {};

  if (modelLoaded && citizenModel) {
    const clone = skeletonClone(citizenModel);

    const wrapper = new THREE.Group();
    wrapper.add(clone);
    wrapper.scale.setScalar(citizenModel.userData._normalizeScale || 1);

    const c = citizenModel.userData._center || { x: 0, y: 0, z: 0 };
    clone.position.x = -c.x;
    clone.position.z = -c.z;
    clone.position.y = -c.y;

    clone.traverse(child => {
      if (child.isMesh) child.frustumCulled = false;
    });

    group.add(wrapper);

    if (citizenAnimations.length > 0) {
      mixer = new THREE.AnimationMixer(wrapper);

      citizenAnimations.forEach(clip => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        actions[clip.name] = action;
      });
    }
  } else {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 1.2, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x4466aa })
    );
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);
  }

  const groundH = getTerrainHeight(x, z);
  group.position.set(x, groundH, z);

  const citizen = {
    group,
    mixer,
    actions,
    currentAction: null,
    hp: 30,
    maxHp: 30,
    damage: 5,
    attackRange: 1.8,
    attackRate: 0.7,
    attackTimer: 0,
    speed: 1.8,
    state: 'patrol',
    angry: false,
    alertTimer: 0,
    patrolTarget: { x: x + (Math.random() - 0.5) * 20, z: z + (Math.random() - 0.5) * 20 },
    patrolTimer: 3 + Math.random() * 5,
    lastPos: { x, z },
    walkCycle: 0,
    hitFlash: 0,
    punchAnim: 0,
    _hitSoundPlayed: false
  };

  playCitizenAction(citizen, 'Idle', 'Idle_Crouch', 'Tpose');

  scene.add(group);
  return citizen;
}

// ============ ПЕРЕКЛЮЧЕНИЕ АНИМАЦИЙ ============
function playCitizenAction(citizen, ...keywords) {
  if (!citizen.mixer) return false;

  const action = findAnimation(citizen.actions, ...keywords);
  if (!action) return false;
  if (citizen.currentAction === action) return true;

  for (const name in citizen.actions) {
    const a = citizen.actions[name];
    if (a !== action) a.stop();
  }

  action.reset();
  action.setEffectiveWeight(1);
  action.play();
  citizen.currentAction = action;
  return true;
}

// ============ ОБНОВЛЕНИЕ ============
export function updateCitizen(citizen, dt, playerPos, obstacles, checkCollision) {
  const g = citizen.group;

  if (citizen.mixer) citizen.mixer.update(dt);

  if (citizen.hp <= 0 && citizen.state !== 'dead') {
    citizen.state = 'dead';
    playCitizenAction(citizen, 'Dead', 'Death', 'Falling');
    g.rotation.x = -Math.PI / 2;
    g.position.y = g.position.y + 0.4;
    return 'dead';
  }
  if (citizen.state === 'dead') return 'dead';

  if (citizen.hitFlash > 0) {
    citizen.hitFlash -= dt;
    g.traverse(child => {
      if (child.isMesh && child.material) {
        if (!child._origColor && child.material.color) {
          child._origColor = child.material.color.clone();
        }
        if (child.material.color) child.material.color.setHex(0xff4444);
      }
    });
  } else {
    g.traverse(child => {
      if (child.isMesh && child._origColor && child.material && child.material.color) {
        child.material.color.copy(child._origColor);
      }
    });
  }

  const distToPlayer = Math.hypot(
    playerPos.x - g.position.x,
    playerPos.z - g.position.z
  );

  citizen.attackTimer -= dt;
  citizen.patrolTimer -= dt;
  if (citizen.alertTimer > 0) citizen.alertTimer -= dt;

  if (citizen.angry) {
    citizen.state = 'angry';
    const dx = playerPos.x - g.position.x;
    const dz = playerPos.z - g.position.z;
    const dist = Math.hypot(dx, dz);

    const targetRot = Math.atan2(dx, dz);
    let diff = targetRot - g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    g.rotation.y += diff * Math.min(1, dt * 8);

    if (dist > citizen.attackRange) {
      const nx = g.position.x + (dx / dist) * citizen.speed * dt;
      const nz = g.position.z + (dz / dist) * citizen.speed * dt;
      if (!checkCollision(nx, g.position.z, 0.4)) g.position.x = nx;
      if (!checkCollision(g.position.x, nz, 0.4)) g.position.z = nz;

      playCitizenAction(citizen, 'Run', 'Walk');
    } else {
      if (citizen.attackTimer <= 0) {
        citizen.attackTimer = citizen.attackRate;
        citizen.punchAnim = 1.0;
        playCitizenAction(citizen, 'Attack_Punch', 'Idle_Punch', 'Attack');
        return { type: 'attack', damage: citizen.damage };
      } else {
        playCitizenAction(citizen, 'Idle_Punch', 'Idle');
      }
    }

    if (dist > 40 && citizen.alertTimer <= 0) {
      citizen.angry = false;
      citizen.state = 'patrol';
    }
  } else {
    if (citizen.patrolTimer <= 0) {
      citizen.patrolTimer = 4 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 15;
      citizen.patrolTarget = {
        x: g.position.x + Math.cos(angle) * r,
        z: g.position.z + Math.sin(angle) * r
      };
    }

    const dx = citizen.patrolTarget.x - g.position.x;
    const dz = citizen.patrolTarget.z - g.position.z;
    const d = Math.hypot(dx, dz);

    if (d > 0.5) {
      const nx = g.position.x + (dx / d) * citizen.speed * 0.6 * dt;
      const nz = g.position.z + (dz / d) * citizen.speed * 0.6 * dt;
      if (!checkCollision(nx, g.position.z, 0.4)) g.position.x = nx;
      if (!checkCollision(g.position.x, nz, 0.4)) g.position.z = nz;

      const targetRot = Math.atan2(dx, dz);
      let diff = targetRot - g.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      g.rotation.y += diff * Math.min(1, dt * 5);

      playCitizenAction(citizen, 'Walk', 'Walk_Sneaking');
    } else {
      playCitizenAction(citizen, 'Idle', 'Idle_Crouch');
    }
  }

  g.position.y = getTerrainHeight(g.position.x, g.position.z);
  citizen.lastPos.x = g.position.x;
  citizen.lastPos.z = g.position.z;

  return null;
}

// ============ ПОЛУЧИТЬ УРОН ============
export function damageCitizen(citizen, amount) {
  if (citizen.state === 'dead') return;

  citizen.hp -= amount;
  citizen.hitFlash = 0.2;
  citizen.angry = true;
  citizen.alertTimer = 8;
  citizen.state = 'angry';

  // === ЗВУК ТОЛЬКО ПРИ ПЕРВОМ УДАРЕ ===
  if (!citizen._hitSoundPlayed) {
    citizen._hitSoundPlayed = true;
    playCitizenAngry();
  }
}