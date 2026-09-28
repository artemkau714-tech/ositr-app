// ============ БИОМ: ПУСТЫНЯ ============
// Генерация объектов и рельефа для пустыни.
// Вызывается из world.js, когда BIOME.current === 'desert'.

import * as THREE from 'three';
import { addObstacle, SETTINGS } from './world.js';

// ============ ТЕКСТУРА ПЕСКА ============
export function makeSandTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 256;
  const ctx = cvs.getContext('2d');

  // Основа — песочный цвет
  ctx.fillStyle = '#d4b87a';
  ctx.fillRect(0, 0, 256, 256);

  // 5 слоёв песчинок
  for (let layer = 0; layer < 5; layer++) {
    const alpha = 0.15 + layer * 0.05;
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 256, y = Math.random() * 256;
      const r = 180 + Math.random() * 60;
      const g = 150 + Math.random() * 60;
      const b = 90 + Math.random() * 50;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
  }

  // Тёмные пятна (камни, тени)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 2 + Math.random() * 6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${130 + Math.random()*40}, ${110 + Math.random()*30}, ${60 + Math.random()*20}, 0.35)`;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============ РЕЛЬЕФ ПУСТЫНИ ============
export function getDesertHeight(x, z, mountainFactor, flatStart) {
  // Плавные песчаные дюны
  const dune1 = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
  const dune2 = Math.sin(x * 0.12 + z * 0.08) * 1.2;
  const dune3 = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.4;
  const dunes = (dune1 + dune2 + dune3) * flatStart;

  // Большие барханы вдали
  const bigDune = Math.pow(Math.max(0, Math.sin(x * 0.02 + z * 0.02)), 3) * 6 * mountainFactor;

  // Впадины (высохшие озёра)
  const trench = Math.sin(x * 0.06) * Math.cos(z * 0.05);
  const trenchDip = trench < -0.6 ? (trench + 0.6) * 10 * flatStart : 0;

  return dunes + bigDune + trenchDip;
}

// ============ КАКТУС ============
export function createCactus(x, z, rand, group, getTerrainHeight) {
  const scale = 0.8 + rand() * 0.6;
  const h = 2 + rand() * 2;
  const groundH = getTerrainHeight(x, z);

  const cactusMat = new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 0.8 });

  // Главный столб
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3 * scale, 0.35 * scale, h, 8),
    cactusMat
  );
  body.position.set(x, groundH + h/2, z);
  body.castShadow = SETTINGS.shadows;
  group.add(body);

  // Руки кактуса (2-3 штуки)
  const arms = Math.floor(rand() * 2) + 1;
  for (let i = 0; i < arms; i++) {
    const armH = 0.8 + rand() * 0.6;
    const armY = groundH + h * (0.4 + rand() * 0.3);
    const angle = rand() * Math.PI * 2;

    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 * scale, 0.18 * scale, armH, 6),
      cactusMat
    );
    arm.position.set(
      x + Math.cos(angle) * 0.35 * scale,
      armY,
      z + Math.sin(angle) * 0.35 * scale
    );
    arm.rotation.z = Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
    arm.rotation.y = angle;
    arm.castShadow = SETTINGS.shadows;
    group.add(arm);
  }

  addObstacle(x, z, 0.4 * scale);
}

// ============ КАМЕНЬ / СКАЛА ============
export function createRock(x, z, rand, group, getTerrainHeight) {
  const scale = 0.5 + rand() * 1.5;
  const groundH = getTerrainHeight(x, z);

  const rockMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.08, 0.15, 0.4 + rand() * 0.15),
    roughness: 1
  });

  const rock = new THREE.Mesh(
    new THREE.IcosahedronGeometry(scale, 1),
    rockMat
  );
  rock.position.set(x, groundH + scale * 0.4, z);
  rock.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
  rock.scale.set(1 + rand() * 0.3, 0.6 + rand() * 0.3, 1 + rand() * 0.3);
  rock.castShadow = SETTINGS.shadows;
  group.add(rock);

  // Мелкие камни рядом
  const smallCount = Math.floor(rand() * 3);
  for (let i = 0; i < smallCount; i++) {
    const s = 0.15 + rand() * 0.3;
    const small = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), rockMat);
    small.position.set(
      x + (rand() - 0.5) * scale * 3,
      groundH + s * 0.4,
      z + (rand() - 0.5) * scale * 3
    );
    small.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    small.castShadow = SETTINGS.shadows;
    group.add(small);
  }

  addObstacle(x, z, scale * 0.6);
}

// ============ ПЕРЕКАТИ-ПОЛЕ ============
export function createTumbleweed(x, z, rand, group, getTerrainHeight) {
  const scale = 0.3 + rand() * 0.3;
  const groundH = getTerrainHeight(x, z);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x8a6a3a,
    roughness: 1,
    transparent: true,
    opacity: 0.85
  });

  const tumble = new THREE.Mesh(
    new THREE.IcosahedronGeometry(scale, 1),
    mat
  );
  tumble.position.set(x, groundH + scale, z);
  tumble.scale.set(1, 0.9, 1);
  tumble.userData = {
    isTumbleweed: true,
    baseY: groundH + scale,
    bob: Math.random() * Math.PI * 2,
    drift: (rand() - 0.5) * 0.5,
    rollSpeed: 1 + rand() * 2
  };
  group.add(tumble);
}

// ============ ПАЛЬМА (оазис) ============
export function createPalm(x, z, rand, group, getTerrainHeight) {
  const scale = 0.9 + rand() * 0.5;
  const trunkH = 4 + rand() * 2;
  const groundH = getTerrainHeight(x, z);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.08, 0.4, 0.35 + rand() * 0.1),
    roughness: 1
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.28, 0.6, 0.3 + rand() * 0.1),
    roughness: 1,
    side: THREE.DoubleSide
  });

  // Ствол — слегка изогнутый
  const segments = 5;
  const trunk = new THREE.Group();
  let curX = x, curY = groundH, curZ = z;
  const leanX = (rand() - 0.5) * 0.15;
  const leanZ = (rand() - 0.5) * 0.15;

  for (let i = 0; i < segments; i++) {
    const segH = trunkH / segments;
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18 * scale, 0.22 * scale, segH, 6),
      trunkMat
    );
    curX += leanX * segH;
    curZ += leanZ * segH;
    curY += segH / 2;
    seg.position.set(curX, curY, curZ);
    seg.rotation.x = leanZ;
    seg.rotation.z = -leanX;
    seg.castShadow = SETTINGS.shadows;
    trunk.add(seg);
    curY += segH / 2;
  }
  group.add(trunk);

  // Листья — 6-8 больших листов
  const leafCount = 6 + Math.floor(rand() * 3);
  const topX = x + leanX * trunkH;
  const topZ = z + leanZ * trunkH;
  const topY = groundH + trunkH;

  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2 + rand() * 0.3;
    const leafLen = 2 + rand() * 0.8;

    const leaf = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6 * scale, leafLen * scale),
      leafMat
    );
    leaf.position.set(
      topX + Math.cos(angle) * leafLen * scale * 0.4,
      topY - 0.2,
      topZ + Math.sin(angle) * leafLen * scale * 0.4
    );
    leaf.rotation.x = -Math.PI / 2.3;
    leaf.rotation.z = angle;
    leaf.castShadow = SETTINGS.shadows;
    group.add(leaf);
  }

  // Кокосы (2-3)
  const cocoCount = Math.floor(rand() * 3) + 1;
  const cocoMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 1 });
  for (let i = 0; i < cocoCount; i++) {
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 6, 6), cocoMat);
    const a = rand() * Math.PI * 2;
    coco.position.set(topX + Math.cos(a) * 0.25, topY - 0.3, topZ + Math.sin(a) * 0.25);
    coco.castShadow = SETTINGS.shadows;
    group.add(coco);
  }

  addObstacle(x, z, 0.4 * scale);
}

// ============ ОБНОВЛЕНИЕ АНИМАЦИИ (перекати-поле) ============
export function updateDesertAnimated(dt, group) {
  group.traverse(child => {
    if (child.userData && child.userData.isTumbleweed) {
      child.userData.bob += dt * child.userData.rollSpeed * 2;
      child.position.y = child.userData.baseY + Math.sin(child.userData.bob) * 0.3;
      child.rotation.x += dt * child.userData.rollSpeed;
      child.rotation.z += dt * child.userData.rollSpeed * 0.7;
      child.position.x += child.userData.drift * dt;
    }
  });
}