// ============ БИОМ: СНЕЖНЫЙ МЕГАПОЛИС ============
// Генерация городских кварталов, небоскрёбов, дорог, сугробов.

import * as THREE from 'three';
import { addObstacle, SETTINGS } from './world.js';

// ============ ТЕКСТУРА СНЕГА ============
export function makeSnowTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 256;
  const ctx = cvs.getContext('2d');

  ctx.fillStyle = '#e8f0f8';
  ctx.fillRect(0, 0, 256, 256);

  for (let layer = 0; layer < 5; layer++) {
    const alpha = 0.1 + layer * 0.04;
    for (let i = 0; i < 2500; i++) {
      const x = Math.random() * 256, y = Math.random() * 256;
      const v = 220 + Math.random() * 35;
      ctx.fillStyle = `rgba(${v}, ${v}, ${Math.min(255, v+10)}, ${alpha})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
  }

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 3 + Math.random() * 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${180 + Math.random()*30}, ${200 + Math.random()*30}, ${230 + Math.random()*20}, 0.3)`;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============ РЕЛЬЕФ ГОРОДА ============
export function getSnowCityHeight(x, z, mountainFactor, flatStart) {
  const bumps1 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.4;
  const bumps2 = Math.sin(x * 0.25 + z * 0.2) * 0.15;
  const bumps = (bumps1 + bumps2) * flatStart;
  const bigHills = Math.pow(Math.max(0, Math.sin(x * 0.015 + z * 0.015)), 3) * 4 * mountainFactor;
  return bumps + bigHills;
}

// ============ ЗДАНИЕ-БЛОК ============
export function createBuilding(x, z, rand, group, getTerrainHeight) {
  const groundH = getTerrainHeight(x, z);
  const w = 6 + rand() * 6;
  const d = 6 + rand() * 6;
  const h = 8 + rand() * 20;

  const hue = 0.55 + rand() * 0.08;
  const wallMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue, 0.15, 0.35 + rand() * 0.2),
    roughness: 0.7,
    metalness: 0.2
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffdd88,
    emissive: 0xffaa44,
    emissiveIntensity: 0.7
  });
  const darkWindowMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2a,
    emissive: 0x223344,
    emissiveIntensity: 0.2
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.set(x, groundH + h/2, z);
  body.castShadow = SETTINGS.shadows;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.4, 0.4, d + 0.4),
    new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.9 })
  );
  roof.position.set(x, groundH + h + 0.2, z);
  group.add(roof);

  if (rand() < 0.4) {
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3 + rand() * 3, 6),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    antenna.position.set(x + (rand()-0.5)*2, groundH + h + 2, z + (rand()-0.5)*2);
    group.add(antenna);
    const blinker = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    blinker.position.set(x, groundH + h + 4, z);
    group.add(blinker);
  }

  const floors = Math.floor(h / 2.2);
  const colsW = Math.max(2, Math.floor(w / 1.8));
  const colsD = Math.max(2, Math.floor(d / 1.8));

  for (let f = 1; f < floors; f++) {
    const fy = groundH + f * 2.2;
    for (let c = 0; c < colsW; c++) {
      const cx = x - w/2 + (c + 0.5) * (w / colsW);
      const wm = rand() < 0.6 ? windowMat : darkWindowMat;
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.1), wm);
      win.position.set(cx, fy, z + d/2 + 0.05);
      group.add(win);
      const win2 = win.clone();
      win2.position.z = z - d/2 - 0.05;
      group.add(win2);
    }
    for (let c = 0; c < colsD; c++) {
      const cz = z - d/2 + (c + 0.5) * (d / colsD);
      const wm = rand() < 0.6 ? windowMat : darkWindowMat;
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.9), wm);
      win.position.set(x + w/2 + 0.05, fy, cz);
      group.add(win);
      const win2 = win.clone();
      win2.position.x = x - w/2 - 0.05;
      group.add(win2);
    }
  }

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.2, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 })
  );
  door.position.set(x, groundH + 1.1, z + d/2 + 0.06);
  group.add(door);

  const snowdrift = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
  );
  snowdrift.scale.set(1.5, 0.4, 1);
  snowdrift.position.set(x, groundH + 0.2, z + d/2 + 0.8);
  group.add(snowdrift);

  addObstacle(x, z, Math.max(w, d) * 0.5);
}

// ============ ЗАСНЕЖЕННАЯ ЕЛЬ ============
export function createSnowTree(x, z, rand, group, getTerrainHeight) {
  const groundH = getTerrainHeight(x, z);
  const scale = 0.7 + rand() * 0.6;
  const trunkH = 1.5 * scale;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, trunkH, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 })
  );
  trunk.position.set(x, groundH + trunkH/2, z);
  trunk.castShadow = SETTINGS.shadows;
  group.add(trunk);

  const greenMat = new THREE.MeshStandardMaterial({ color: 0x1a4a2a, roughness: 1 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });

  const tiers = 3 + Math.floor(rand() * 2);
  for (let t = 0; t < tiers; t++) {
    const r = (1.4 - t * 0.3) * scale;
    const hh = (1.8 - t * 0.2) * scale;
    const y = groundH + trunkH + t * 1.1 * scale;

    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 7), greenMat);
    cone.position.set(x, y + hh/2, z);
    cone.castShadow = SETTINGS.shadows;
    group.add(cone);

    const snowCone = new THREE.Mesh(new THREE.ConeGeometry(r * 0.9, hh * 0.4, 7), snowMat);
    snowCone.position.set(x, y + hh * 0.85, z);
    group.add(snowCone);
  }

  addObstacle(x, z, 0.5 * scale);
}

// ============ ФОНАРЬ ============
export function createStreetLamp(x, z, rand, group, getTerrainHeight) {
  const groundH = getTerrainHeight(x, z);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 5, 6),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.4 })
  );
  pole.position.set(x, groundH + 2.5, z);
  pole.castShadow = SETTINGS.shadows;
  group.add(pole);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 })
  );
  arm.position.set(x, groundH + 5, z + 0.6);
  group.add(arm);

  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffee88,
    emissive: 0xffdd44,
    emissiveIntensity: 1.0
  });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.4), lampMat);
  lamp.position.set(x, groundH + 4.95, z + 1.1);
  group.add(lamp);
}

// ============ СУГРОБ ============
export function createSnowdrift(x, z, rand, group, getTerrainHeight) {
  const groundH = getTerrainHeight(x, z);
  const s = 0.5 + rand() * 1.2;

  const drift = new THREE.Mesh(
    new THREE.SphereGeometry(s, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
  );
  drift.scale.set(1.3, 0.5, 1.3);
  drift.position.set(x, groundH + s * 0.15, z);
  drift.rotation.y = rand() * Math.PI * 2;
  group.add(drift);
}

// ============ СКАМЕЙКА ============
export function createBench(x, z, rand, group, getTerrainHeight) {
  const groundH = getTerrainHeight(x, z);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const rotY = rand() * Math.PI * 2;

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.5), woodMat);
  seat.position.set(x, groundH + 0.45, z);
  seat.rotation.y = rotY;
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.08), woodMat);
  back.position.set(x, groundH + 0.75, z - 0.21);
  back.rotation.y = rotY;
  group.add(back);

  for (const dx of [-0.7, 0.7]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.4), woodMat);
    leg.position.set(x + dx, groundH + 0.22, z);
    leg.rotation.y = rotY;
    group.add(leg);
  }
}

// ============ АНИМАЦИЯ ============
export function updateSnowCityAnimated(dt, group) {
  // Снег идёт глобально через WEATHER
}