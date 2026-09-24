import * as THREE from 'three';

// ============ КОНСТАНТЫ ============
export const CHUNK_SIZE = 20;
export const VIEW_CHUNKS = 3;

// ============ НАСТРОЙКИ ============
export const SETTINGS = {
  viewDist: 3,
  grass: 30,
  trees: 12,
  butterflies: 3,
  weather: true,
  shadows: false,
  resolution: 1.3,
  ambientSound: true,

  load() {
    try {
      const saved = localStorage.getItem('drone_settings');
      if (saved) {
        const data = JSON.parse(saved);
        Object.assign(this, data);
      }
    } catch (e) {
      console.log('Ошибка загрузки настроек:', e);
    }
  },

  save() {
    try {
      const data = {
        viewDist: this.viewDist,
        grass: this.grass,
        trees: this.trees,
        butterflies: this.butterflies,
        weather: this.weather,
        shadows: this.shadows,
        resolution: this.resolution,
        ambientSound: this.ambientSound
      };
      localStorage.setItem('drone_settings', JSON.stringify(data));
    } catch (e) {
      console.log('Ошибка сохранения настроек:', e);
    }
  },

  applyPreset(name) {
    switch (name) {
      case 'low':
        this.viewDist = 2;
        this.grass = 5;
        this.trees = 4;
        this.butterflies = 1;
        this.weather = false;
        this.shadows = false;
        this.resolution = 0.8;
        this.ambientSound = false;
        break;
      case 'medium':
        this.viewDist = 3;
        this.grass = 15;
        this.trees = 8;
        this.butterflies = 2;
        this.weather = true;
        this.shadows = false;
        this.resolution = 1.0;
        this.ambientSound = true;
        break;
      case 'high':
        this.viewDist = 3;
        this.grass = 30;
        this.trees = 12;
        this.butterflies = 3;
        this.weather = true;
        this.shadows = true;
        this.resolution = 1.5;
        this.ambientSound = true;
        break;
      case 'ultra':
        this.viewDist = 5;
        this.grass = 50;
        this.trees = 20;
        this.butterflies = 6;
        this.weather = true;
        this.shadows = true;
        this.resolution = 2.0;
        this.ambientSound = true;
        break;
    }
    this.save();
  }
};

// Загружаем настройки при импорте
SETTINGS.load();

// ============ СОСТОЯНИЕ МИРА ============
export const worldState = {
  chunks: new Map(),
  buildings: [],
  obstacles: [],
  grassTex: null,
  roadTex: null,
  scene: null
};

// ============ ВЕТЕР ============
export const WIND = {
  time: 0,
  strength: 1.0,
  direction: new THREE.Vector2(1, 0.3).normalize(),
  update(dt) {
    this.time += dt;
    this.strength = 0.7 + Math.sin(this.time * 0.5) * 0.3 + Math.sin(this.time * 1.7) * 0.15;
  }
};

// ============ ВОДА (отключена) ============
export const WATER_LEVEL = -999;
export function isWaterAt(x, z) {
  return false;
}

// ============ ПОГОДА ============
export const WEATHER = {
  type: 'clear',
  timeOfDay: 12,
  dayLength: 240,
  weatherTimer: 60,
  currentLight: 1.0,
  rainParticles: null,
  snowParticles: null,
  scene: null,
  sunLight: null,
  hemiLight: null,
  ambientLight: null,

  init(scene, sunLight, hemiLight, ambientLight) {
    this.scene = scene;
    this.sunLight = sunLight;
    this.hemiLight = hemiLight;
    this.ambientLight = ambientLight;
  },

  setWeather(type) {
    this.type = type;
    this.removeEffects();

    if (type === 'rain') {
      this.createRain();
    } else if (type === 'snow') {
      this.createSnow();
    } else if (type === 'fog') {
      if (this.scene) {
        this.scene.fog = new THREE.Fog(0xcccccc, 20, 100);
        this.scene.background = new THREE.Color(0xcccccc);
      }
    } else {
      if (this.scene) {
        this.scene.fog = new THREE.Fog(0x8fb8dd, 180, 550);
        this.scene.background = new THREE.Color(0x8fb8dd);
      }
    }
  },

  removeEffects() {
    if (this.rainParticles && this.scene) {
      this.scene.remove(this.rainParticles);
      this.rainParticles = null;
    }
    if (this.snowParticles && this.scene) {
      this.scene.remove(this.snowParticles);
      this.snowParticles = null;
    }
  },

  createRain() {
    if (!this.scene) return;
    const count = 3000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i*3] = (Math.random() - 0.5) * 100;
      positions[i*3+1] = Math.random() * 60;
      positions[i*3+2] = (Math.random() - 0.5) * 100;
      velocities[i] = 30 + Math.random() * 20;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xaaccff, size: 0.15, transparent: true, opacity: 0.7
    });
    this.rainParticles = new THREE.Points(geo, mat);
    this.rainParticles.userData.velocities = velocities;
    this.scene.add(this.rainParticles);
  },

  createSnow() {
    if (!this.scene) return;
    const count = 2000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i*3] = (Math.random() - 0.5) * 120;
      positions[i*3+1] = Math.random() * 60;
      positions[i*3+2] = (Math.random() - 0.5) * 120;
      velocities[i] = 2 + Math.random() * 3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.3, transparent: true, opacity: 0.9
    });
    this.snowParticles = new THREE.Points(geo, mat);
    this.snowParticles.userData.velocities = velocities;
    this.scene.add(this.snowParticles);
  },

  update(dt, playerPos) {
    this.timeOfDay += (24 / this.dayLength) * dt;
    if (this.timeOfDay >= 24) this.timeOfDay -= 24;

    // Авто-смена погоды
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      const roll = Math.random();
      let newType;
      if (roll < 0.5) newType = 'clear';
      else if (roll < 0.75) newType = 'rain';
      else if (roll < 0.92) newType = 'fog';
      else newType = 'snow';

      if (newType !== this.type) {
        this.setWeather(newType);
      }
      this.weatherTimer = 90 + Math.random() * 150;
    }

    // Освещение
    let timeLight;
    if (this.timeOfDay >= 6 && this.timeOfDay < 8) {
      timeLight = (this.timeOfDay - 6) / 2;
    } else if (this.timeOfDay >= 8 && this.timeOfDay < 18) {
      timeLight = 1.0;
    } else if (this.timeOfDay >= 18 && this.timeOfDay < 20) {
      timeLight = 1.0 - (this.timeOfDay - 18) / 2;
    } else {
      timeLight = 0.15;
    }

    const weatherMult = this.type === 'rain' ? 0.6 : this.type === 'snow' ? 0.85 : 1.0;
    const targetLight = timeLight * weatherMult;
    this.currentLight += (targetLight - this.currentLight) * Math.min(1, dt * 2);

    if (this.sunLight) {
      this.sunLight.intensity = 1.4 * this.currentLight;
      const angle = (this.timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
      this.sunLight.position.set(
        Math.cos(angle) * 150,
        Math.max(10, Math.sin(angle) * 150),
        Math.sin(angle * 0.5) * 50
      );
      if (this.scene && this.type === 'clear') {
        const skyColor = this.getSkyColor();
        this.scene.background = skyColor;
        if (this.scene.fog) this.scene.fog.color.copy(skyColor);
      }
    }
    if (this.hemiLight) this.hemiLight.intensity = 0.85 * this.currentLight + 0.15;
    if (this.ambientLight) this.ambientLight.intensity = 0.15 + (1 - this.currentLight) * 0.1;

    // Дождь
    if (this.rainParticles) {
      const pos = this.rainParticles.geometry.attributes.position;
      const vel = this.rainParticles.userData.velocities;
      const arr = pos.array;
      for (let i = 0; i < vel.length; i++) {
        arr[i*3+1] -= vel[i] * dt;
        arr[i*3] += WIND.direction.x * WIND.strength * 5 * dt;
        arr[i*3+2] += WIND.direction.y * WIND.strength * 5 * dt;
        if (arr[i*3+1] < 0) {
          arr[i*3] = playerPos.x + (Math.random() - 0.5) * 100;
          arr[i*3+1] = 60;
          arr[i*3+2] = playerPos.z + (Math.random() - 0.5) * 100;
        }
      }
      pos.needsUpdate = true;
    }
    // Снег
    if (this.snowParticles) {
      const pos = this.snowParticles.geometry.attributes.position;
      const vel = this.snowParticles.userData.velocities;
      const arr = pos.array;
      for (let i = 0; i < vel.length; i++) {
        arr[i*3+1] -= vel[i] * dt;
        arr[i*3] += Math.sin(this.timeOfDay * 10 + i) * 0.5 * dt;
        arr[i*3+2] += Math.cos(this.timeOfDay * 8 + i) * 0.5 * dt;
        if (arr[i*3+1] < 0) {
          arr[i*3] = playerPos.x + (Math.random() - 0.5) * 120;
          arr[i*3+1] = 60;
          arr[i*3+2] = playerPos.z + (Math.random() - 0.5) * 120;
        }
      }
      pos.needsUpdate = true;
    }
  },

  getSkyColor() {
    const t = this.timeOfDay;
    if (t < 5 || t > 21) return new THREE.Color(0x0a0a2a);
    if (t < 7) {
      const k = (t - 5) / 2;
      return new THREE.Color().lerpColors(new THREE.Color(0x0a0a2a), new THREE.Color(0xff9966), k);
    }
    if (t < 10) {
      const k = (t - 7) / 3;
      return new THREE.Color().lerpColors(new THREE.Color(0xff9966), new THREE.Color(0x8fb8dd), k);
    }
    if (t < 16) return new THREE.Color(0x8fb8dd);
    if (t < 19) {
      const k = (t - 16) / 3;
      return new THREE.Color().lerpColors(new THREE.Color(0x8fb8dd), new THREE.Color(0xff7744), k);
    }
    const k = (t - 19) / 2;
    return new THREE.Color().lerpColors(new THREE.Color(0xff7744), new THREE.Color(0x0a0a2a), k);
  }
};

// ============ ЖИВНОСТЬ ============
export const wildlife = {
  butterflies: [],
  birds: [],
  update(dt, scene, playerPos) {
    for (let i = this.butterflies.length - 1; i >= 0; i--) {
      const b = this.butterflies[i];
      b.t += dt;
      b.angle += dt * b.orbitSpeed;
      const cx = b.centerX + Math.cos(b.angle) * b.radius;
      const cz = b.centerZ + Math.sin(b.angle) * b.radius;
      const cy = getTerrainHeight(cx, cz) + b.height + Math.sin(b.t * 3) * 0.4;
      b.group.position.set(cx, cy, cz);
      b.group.rotation.y = b.angle + Math.PI / 2;
      b.group.rotation.z = Math.sin(b.t * 20) * 0.5;
      if (b.leftWing) b.leftWing.rotation.z = Math.sin(b.t * 25) * 0.8;
      if (b.rightWing) b.rightWing.rotation.z = -Math.sin(b.t * 25) * 0.8;
    }
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const bird = this.birds[i];
      bird.t += dt;
      const t = bird.t;
      const radius = 60;
      const angle = bird.angle + t * bird.speed;
      const bx = playerPos.x + Math.cos(angle) * radius;
      const bz = playerPos.z + Math.sin(angle) * radius;
      const by = playerPos.y + 40 + Math.sin(t * 0.5 + bird.phase) * 5;
      bird.group.position.set(bx, by, bz);
      bird.group.rotation.y = angle + Math.PI / 2;
      if (bird.leftWing) bird.leftWing.rotation.z = Math.sin(t * 8) * 0.7;
      if (bird.rightWing) bird.rightWing.rotation.z = -Math.sin(t * 8) * 0.7;
    }
  }
};

// ============ ТЕКСТУРЫ ============
export function makeGrassTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 128;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#4a7c3a';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 128, y = Math.random() * 128;
    const g = 90 + Math.random() * 70;
    ctx.fillStyle = `rgb(${30 + Math.random()*40}, ${g}, ${30 + Math.random()*30})`;
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeRoadTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 128;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 128, y = Math.random() * 128;
    const g = 30 + Math.random() * 40;
    ctx.fillStyle = `rgb(${g}, ${g}, ${g})`;
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============ РЕЛЬЕФ ============
export function terrainNoise(x, z) {
  const s1 = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 4;
  const s2 = Math.sin(x * 0.07 + 1.3) * Math.cos(z * 0.05 - 0.7) * 2;
  const s3 = Math.sin(x * 0.15 + z * 0.12) * 0.8;
  const s4 = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.2;
  return s1 + s2 + s3 + s4;
}

export function getTerrainHeight(x, z) {
  const startDist = Math.hypot(x, z);
  const flatStart = Math.max(0, Math.min(1, (startDist - 15) / 15));
  const mountainFactor = Math.max(0, Math.min(1, (startDist - 80) / 60));
  const base = terrainNoise(x, z) * flatStart;
  const mountains = Math.pow(Math.max(0, terrainNoise(x * 0.3 + 100, z * 0.3 + 100)), 2) * 0.8 * mountainFactor;
  const trench = Math.sin(x * 0.1) * Math.cos(z * 0.08);
  const trenchDip = trench < -0.7 ? (trench + 0.7) * 8 * flatStart : 0;
  return base + mountains + trenchDip;
}

// ============ КОЛЛИЗИИ ============
export function addObstacle(x, z, r) {
  worldState.obstacles.push({ x, z, r });
}

export function checkCollision(newX, newZ, playerRadius) {
  for (const ob of worldState.obstacles) {
    const dx = newX - ob.x, dz = newZ - ob.z;
    const minDist = ob.r + playerRadius;
    if (dx*dx + dz*dz < minDist * minDist) return ob;
  }
  return null;
}

// ============ МУЛЬБЕРРИ ============
export function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ============ ДЕРЕВО ============
function createTree(x, z, rand, group) {
  const treeScale = 0.7 + rand() * 0.9;
  const trunkH = 3.5 * treeScale;
  const groundH = getTerrainHeight(x, z);
  const type = rand() < 0.5 ? 0 : 1;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25*treeScale, 0.45*treeScale, trunkH, 7),
    new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 1 })
  );
  trunk.position.set(x, groundH + trunkH/2, z);
  trunk.castShadow = SETTINGS.shadows;
  group.add(trunk);

  if (type === 0) {
    const leafColor = new THREE.Color().setHSL(0.28 + (rand() - 0.5)*0.08, 0.55 + rand()*0.2, 0.22 + rand()*0.1);
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 1, side: THREE.DoubleSide });
    const tiers = 3 + Math.floor(rand() * 2);
    for (let t = 0; t < tiers; t++) {
      const r = (2.4 - t*0.5) * treeScale;
      const hh = (3 - t*0.3) * treeScale;
      for (let k = 0; k < 3; k++) {
        const angle = (k / 3) * Math.PI * 2 + t * 0.5;
        const offsetX = Math.cos(angle) * 0.3 * treeScale;
        const offsetZ = Math.sin(angle) * 0.3 * treeScale;
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 8), leafMat);
        leaves.position.set(x + offsetX, groundH + trunkH + t*1.1*treeScale, z + offsetZ);
        leaves.castShadow = SETTINGS.shadows;
        group.add(leaves);
      }
    }
  } else {
    const leafColor = new THREE.Color().setHSL(0.25 + (rand() - 0.5)*0.1, 0.6 + rand()*0.15, 0.3 + rand()*0.1);
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 1 });
    const canopySize = (1.8 + rand() * 0.7) * treeScale;
    const canopyY = groundH + trunkH + canopySize * 0.5;
    for (let i = 0; i < 6; i++) {
      const s = canopySize * (0.6 + rand() * 0.5);
      const angle = rand() * Math.PI * 2;
      const dist = rand() * canopySize * 0.7;
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), leafMat);
      blob.position.set(x + Math.cos(angle) * dist, canopyY + (rand() - 0.5) * canopySize * 0.6, z + Math.sin(angle) * dist);
      blob.castShadow = SETTINGS.shadows;
      group.add(blob);
    }
  }

  addObstacle(x, z, 0.6 * treeScale);
}

// ============ ТРАВА ============
function createGrass(x, z, group, grassMaterial) {
  const groundH = getTerrainHeight(x, z);
  const blades = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blades; i++) {
    const h = 0.2 + Math.random() * 0.3;
    const bladeGroup = new THREE.Group();

    const geo = new THREE.PlaneGeometry(0.05, h);
    const blade1 = new THREE.Mesh(geo, grassMaterial);
    blade1.position.y = h / 2;
    bladeGroup.add(blade1);

    const blade2 = new THREE.Mesh(geo, grassMaterial);
    blade2.position.y = h / 2;
    blade2.rotation.y = Math.PI / 2;
    bladeGroup.add(blade2);

    bladeGroup.rotation.y = Math.random() * Math.PI * 2;
    bladeGroup.position.set(
      x + (Math.random() - 0.5) * 0.6,
      groundH,
      z + (Math.random() - 0.5) * 0.6
    );
    group.add(bladeGroup);
  }
}

// ============ ЦВЕТОК ============
function createFlower(x, z, group) {
  const groundH = getTerrainHeight(x, z);
  const type = Math.random();
  let petalColor;
  if (type < 0.4) petalColor = 0xffffff;
  else if (type < 0.7) petalColor = 0xff2244;
  else if (type < 0.9) petalColor = 0xffdd00;
  else petalColor = 0xaa44ff;

  const stemH = 0.25 + Math.random() * 0.2;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, stemH, 4),
    new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 1 })
  );
  stem.position.set(x, groundH + stemH/2, z);
  group.add(stem);

  const petalCount = 5 + Math.floor(Math.random() * 3);
  const petalGroup = new THREE.Group();
  const petalMat = new THREE.MeshBasicMaterial({ color: petalColor, side: THREE.DoubleSide });

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.06, 5), petalMat);
    petal.position.set(Math.cos(angle) * 0.05, 0, Math.sin(angle) * 0.05);
    petal.rotation.x = -Math.PI / 2;
    petalGroup.add(petal);
  }

  const center = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xffdd00 }));
  petalGroup.add(center);

  petalGroup.position.set(x, groundH + stemH, z);
  petalGroup.rotation.y = Math.random() * Math.PI * 2;
  petalGroup.rotation.z = (Math.random() - 0.5) * 0.3;
  group.add(petalGroup);
}

// ============ БАБОЧКА ============
function createButterfly(x, z) {
  const group = new THREE.Group();
  const colors = [0xff66cc, 0xffff44, 0xff8844, 0x44ffcc, 0xff4488];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const wingMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color), side: THREE.DoubleSide, transparent: true, opacity: 0.9
  });
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.08, 2, 6), bodyMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  const wingGeo = new THREE.CircleGeometry(0.15, 8);
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-0.08, 0, 0);
  leftWing.rotation.y = Math.PI / 2;
  leftWing.scale.set(1, 0.7, 1);
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0.08, 0, 0);
  rightWing.rotation.y = -Math.PI / 2;
  rightWing.scale.set(1, 0.7, 1);
  group.add(rightWing);

  const groundH = getTerrainHeight(x, z);
  group.position.set(x, groundH + 1.5, z);

  return {
    group, leftWing, rightWing,
    centerX: x, centerZ: z,
    angle: Math.random() * Math.PI * 2,
    orbitSpeed: 0.3 + Math.random() * 0.4,
    radius: 2 + Math.random() * 3,
    height: 1 + Math.random() * 1.5,
    t: Math.random() * 10
  };
}

// ============ ПТИЦА ============
export function createBird() {
  const group = new THREE.Group();
  const color = Math.random() < 0.5 ? 0x222222 : 0x555555;
  const birdMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.4, 2, 6), birdMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), birdMat);
  head.position.set(0, 0.05, -0.28);
  group.add(head);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 4), birdMat);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0.02, 0.32);
  group.add(tail);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(0.6, 0.1);
  wingShape.lineTo(0.4, -0.15);
  wingShape.lineTo(0, -0.1);
  wingShape.lineTo(0, 0);
  const wingGeo = new THREE.ShapeGeometry(wingShape);

  const leftWing = new THREE.Mesh(wingGeo, birdMat);
  leftWing.rotation.x = Math.PI / 2;
  leftWing.position.set(-0.1, 0.05, 0);
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, birdMat);
  rightWing.rotation.x = Math.PI / 2;
  rightWing.scale.x = -1;
  rightWing.position.set(0.1, 0.05, 0);
  group.add(rightWing);

  group.scale.setScalar(0.7 + Math.random() * 0.5);

  return {
    group, leftWing, rightWing,
    t: Math.random() * 10,
    angle: Math.random() * Math.PI * 2,
    speed: 0.15 + Math.random() * 0.1,
    phase: Math.random() * Math.PI * 2
  };
}

// ============ ЗДАНИЕ ============
export function createBuilding(x, z, rand, ownedWeapons, WEAPONS) {
  const group = new THREE.Group();
  const bh = getTerrainHeight(x, z);
  group.position.set(x, bh, z);

  const w = 9 + rand()*4;
  const d = 9 + rand()*4;
  const h = 4 + rand()*1.2;

  const hue = 0.07 + rand()*0.03;
  const wallMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue, 0.25, 0.55 + rand()*0.1), roughness: 0.9
  });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.8 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), floorMat);
  floor.position.y = 0.1; floor.receiveShadow = SETTINGS.shadows; group.add(floor);

  const wallThick = 0.35;
  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallThick), wallMat);
  wallBack.position.set(0, h/2, -d/2);
  wallBack.castShadow = SETTINGS.shadows; group.add(wallBack);

  const doorW = 2.6;
  const frontLeftW = (w - doorW) / 2;
  const wallFL = new THREE.Mesh(new THREE.BoxGeometry(frontLeftW, h, wallThick), wallMat);
  wallFL.position.set(-w/2 + frontLeftW/2, h/2, d/2);
  wallFL.castShadow = SETTINGS.shadows; group.add(wallFL);
  const wallFR = new THREE.Mesh(new THREE.BoxGeometry(frontLeftW, h, wallThick), wallMat);
  wallFR.position.set(w/2 - frontLeftW/2, h/2, d/2);
  wallFR.castShadow = SETTINGS.shadows; group.add(wallFR);
  const wallFTop = new THREE.Mesh(new THREE.BoxGeometry(doorW, h - 2.2, wallThick), wallMat);
  wallFTop.position.set(0, 2.2 + (h - 2.2)/2, d/2); group.add(wallFTop);

  const windowMat = new THREE.MeshStandardMaterial({ color: 0x223344, emissive: 0x112233, emissiveIntensity: 0.3 });
  const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });

  const wallL = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), wallMat);
  wallL.position.set(-w/2, h/2, 0);
  wallL.castShadow = SETTINGS.shadows; group.add(wallL);
  const wallR = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), wallMat);
  wallR.position.set(w/2, h/2, 0);
  wallR.castShadow = SETTINGS.shadows; group.add(wallR);

  for (let i = 0; i < 2; i++) {
    const winZ = -d/4 + i * (d/2);
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 1.3), windowMat);
    win1.position.set(-w/2 + 0.02, h*0.65, winZ); group.add(win1);
    const frame1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.3, 1.5), windowFrameMat);
    frame1.position.set(-w/2 + 0.01, h*0.65, winZ); group.add(frame1);
    const win2 = win1.clone(); win2.position.x = w/2 - 0.02; group.add(win2);
    const frame2 = frame1.clone(); frame2.position.x = w/2 - 0.01; group.add(frame2);
  }

  const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.75, 1.6, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, h + 0.8, 0);
  roof.rotation.y = Math.PI/4;
  roof.castShadow = SETTINGS.shadows; group.add(roof);

  const doorFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 0.4), woodMat);
  doorFrameL.position.set(-doorW/2 - 0.1, 1.2, d/2); group.add(doorFrameL);
  const doorFrameR = doorFrameL.clone();
  doorFrameR.position.x = doorW/2 + 0.1; group.add(doorFrameR);

  const lootSpots = [];
  const lootCount = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < lootCount; i++) {
    const lx = (rand() - 0.5) * (w - 3);
    const lz = (rand() - 0.5) * (d - 3);
    const lootType = Math.random() < 0.5 ? 'money' : 'weapon';
    let loot;
    if (lootType === 'money') {
      loot = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.12, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x2a8a2a, emissive: 0x44cc44, emissiveIntensity: 0.5, metalness: 0.4 })
      );
    } else {
      loot = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.45, 0.55),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7, emissive: 0x00cccc, emissiveIntensity: 0.2 })
      );
    }
    loot.position.set(lx, 0.45, lz);
    loot.userData = {
      type: lootType,
      bob: Math.random() * Math.PI * 2,
      value: lootType === 'money' ? 50 + Math.floor(Math.random() * 150) : null,
      weapon: lootType === 'weapon' ? randomWeaponFromLoot(ownedWeapons, WEAPONS) : null,
      taken: false
    };
    group.add(loot);
    lootSpots.push(loot);
  }

  return { group, lootSpots, w, d, h };
}

export function randomWeaponFromLoot(ownedWeapons, WEAPONS) {
  const pool = Object.keys(WEAPONS).filter(id => id !== 'pistol' && !ownedWeapons.has(id));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============ СПЕЦИАЛЬНЫЕ ЗДАНИЯ ============
export function createBunker(x, z, rand, group) {
  const bh = getTerrainHeight(x, z);
  const bunker = new THREE.Group();
  bunker.position.set(x, bh, z);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 10), wallMat);
  base.position.y = 2; base.castShadow = SETTINGS.shadows; base.receiveShadow = SETTINGS.shadows;
  bunker.add(base);

  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1, 8), metalMat);
  vent.position.set(2, 4.5, 2); bunker.add(vent);

  const door = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 }));
  door.position.set(0, 1.25, -5); bunker.add(door);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 6), metalMat);
  antenna.position.set(-3, 7, -3); bunker.add(antenna);

  const light = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  light.position.set(-3, 10, -3); bunker.add(light);

  group.add(bunker);
  addObstacle(x, z, 7);
}

export function createWarehouse(x, z, rand, group) {
  const bh = getTerrainHeight(x, z);
  const wh = new THREE.Group();
  wh.position.set(x, bh, z);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 8), wallMat);
  base.position.y = 2.5; base.castShadow = SETTINGS.shadows; base.receiveShadow = SETTINGS.shadows;
  wh.add(base);

  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 4, 14, 12, 1, false, 0, Math.PI),
    roofMat
  );
  roof.rotation.z = Math.PI/2;
  roof.position.y = 5; roof.castShadow = SETTINGS.shadows;
  wh.add(roof);

  const gate = new THREE.Mesh(new THREE.BoxGeometry(4, 3.5, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 }));
  gate.position.set(0, 1.75, -4); wh.add(gate);

  for (let i = 0; i < 4; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x9a7a4a, roughness: 0.9 }));
    box.position.set((rand() - 0.5) * 10, 0.6, 6 + rand() * 2);
    box.rotation.y = rand() * Math.PI;
    box.castShadow = SETTINGS.shadows;
    wh.add(box);
  }

  group.add(wh);
  addObstacle(x - 7, z, 3);
  addObstacle(x + 7, z, 3);
  addObstacle(x, z - 4, 3);
}

export function createAirstrip(x, z, rand, group) {
  const bh = getTerrainHeight(x, z);
  const strip = new THREE.Group();
  strip.position.set(x, bh, z);

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.95 });

  const runway = new THREE.Mesh(new THREE.BoxGeometry(60, 0.2, 8), concreteMat);
  runway.position.y = 0.1; runway.receiveShadow = SETTINGS.shadows;
  strip.add(runway);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = -25; i <= 25; i += 5) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.4), lineMat);
    line.rotation.x = -Math.PI/2;
    line.position.set(i, 0.25, 0);
    strip.add(line);
  }

  const tower = new THREE.Group();
  const towerBase = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 3),
    new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 }));
  towerBase.position.y = 4; tower.add(towerBase);
  const towerTop = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 4),
    new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.6 }));
  towerTop.position.y = 9; tower.add(towerTop);
  tower.position.set(-8, 0, 6);
  strip.add(tower);

  group.add(strip);
}

export function createCommsTower(x, z, rand, group) {
  const bh = getTerrainHeight(x, z);
  const tower = new THREE.Group();
  tower.position.set(x, bh, z);

  const metalMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.7, roughness: 0.4 });

  for (let i = 0; i < 3; i++) {
    const section = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 5, 6, 1, true), metalMat);
    section.position.y = 2.5 + i * 5;
    tower.add(section);
  }

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  beacon.position.y = 17;
  tower.add(beacon);

  group.add(tower);
  addObstacle(x, z, 1);
}

// ============ ГЕНЕРАЦИЯ ЧАНКА ============
export function generateChunk(cx, cz, deps) {
  const key = getChunkKey(cx, cz);
  if (worldState.chunks.has(key)) return;

  const scene = worldState.scene;
  const group = new THREE.Group();
  const baseX = cx * CHUNK_SIZE;
  const baseZ = cz * CHUNK_SIZE;
  const seed = (cx * 73856093) ^ (cz * 19349663);
  const rand = mulberry32(seed);

  if (!worldState.grassTex) worldState.grassTex = makeGrassTexture();
  const groundTex = worldState.grassTex.clone();
  groundTex.needsUpdate = true;
  groundTex.repeat.set(8, 8);

  const groundSegs = 24;
  const groundGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, groundSegs, groundSegs);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const lx = posAttr.getX(i);
    const lz = posAttr.getY(i);
    const worldX = baseX + CHUNK_SIZE/2 + lx;
    const worldZ = baseZ + CHUNK_SIZE/2 - lz;
    const h = getTerrainHeight(worldX, worldZ);
    posAttr.setZ(i, h);
  }
  groundGeo.computeVertexNormals();

  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI/2;
  ground.position.set(baseX + CHUNK_SIZE/2, 0, baseZ + CHUNK_SIZE/2);
  ground.receiveShadow = SETTINGS.shadows;
  group.add(ground);

  // Дороги
  const hasRoadH = rand() < 0.35;
  const hasRoadV = rand() < 0.35;
  if (!worldState.roadTex) worldState.roadTex = makeRoadTexture();
  const roadMat = new THREE.MeshStandardMaterial({ map: worldState.roadTex, roughness: 0.85 });

  if (hasRoadH) {
    const roadGeo = new THREE.PlaneGeometry(CHUNK_SIZE, 6, 12, 2);
    const rp = roadGeo.attributes.position;
    for (let j = 0; j < rp.count; j++) {
      const lx = rp.getX(j), lz = rp.getY(j);
      const wx = baseX + CHUNK_SIZE/2 + lx;
      const wz = baseZ + CHUNK_SIZE/2 - lz;
      const h = getTerrainHeight(wx, wz);
      rp.setZ(j, h + 0.05);
    }
    roadGeo.computeVertexNormals();
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI/2;
    road.position.set(baseX + CHUNK_SIZE/2, 0.05, baseZ + CHUNK_SIZE/2);
    group.add(road);
  }
  if (hasRoadV) {
    const roadGeo = new THREE.PlaneGeometry(6, CHUNK_SIZE, 2, 12);
    const rp = roadGeo.attributes.position;
    for (let j = 0; j < rp.count; j++) {
      const lx = rp.getX(j), lz = rp.getY(j);
      const wx = baseX + CHUNK_SIZE/2 + lx;
      const wz = baseZ + CHUNK_SIZE/2 - lz;
      const h = getTerrainHeight(wx, wz);
      rp.setZ(j, h + 0.05);
    }
    roadGeo.computeVertexNormals();
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI/2;
    road.position.set(baseX + CHUNK_SIZE/2, 0.05, baseZ + CHUNK_SIZE/2);
    group.add(road);
  }

  // Обычные здания
  const isStartChunk = (cx === 0 && cz === 0);
  const hasBuilding = !isStartChunk && rand() < 0.32;
  if (hasBuilding) {
    const bx = baseX + 14 + rand() * (CHUNK_SIZE - 32);
    const bz = baseZ + 14 + rand() * (CHUNK_SIZE - 32);
    const onRoadH = hasRoadH && Math.abs(bz - (baseZ + CHUNK_SIZE/2)) < 8;
    const onRoadV = hasRoadV && Math.abs(bx - (baseX + CHUNK_SIZE/2)) < 8;
    if (!onRoadH && !onRoadV) {
      const building = createBuilding(bx, bz, rand, deps.ownedWeapons, deps.WEAPONS);
      building.chunkKey = key;
      group.add(building.group);
      worldState.buildings.push(building);
      const w = building.w, d = building.d;
      addObstacle(bx - w/2, bz - d/2, 1.5);
      addObstacle(bx + w/2, bz - d/2, 1.5);
      addObstacle(bx - w/2, bz + d/2, 1.5);
      addObstacle(bx + w/2, bz + d/2, 1.5);
      addObstacle(bx - w/2, bz, 1.5);
      addObstacle(bx + w/2, bz, 1.5);
      addObstacle(bx, bz - d/2, 1.5);
    }
  }

  // Специальные здания
  const specialRoll = rand();
  if (!isStartChunk) {
    if (specialRoll < 0.04) {
      const bx = baseX + 20 + rand() * (CHUNK_SIZE - 40);
      const bz = baseZ + 20 + rand() * (CHUNK_SIZE - 40);
      createBunker(bx, bz, rand, group);
    } else if (specialRoll < 0.07) {
      const bx = baseX + 20 + rand() * (CHUNK_SIZE - 40);
      const bz = baseZ + 20 + rand() * (CHUNK_SIZE - 40);
      createWarehouse(bx, bz, rand, group);
    } else if (specialRoll < 0.09) {
      const bx = baseX + CHUNK_SIZE/2;
      const bz = baseZ + CHUNK_SIZE/2;
      createAirstrip(bx, bz, rand, group);
    } else if (specialRoll < 0.13) {
      const bx = baseX + 20 + rand() * (CHUNK_SIZE - 40);
      const bz = baseZ + 20 + rand() * (CHUNK_SIZE - 40);
      createCommsTower(bx, bz, rand, group);
    }
  }

  // Деревья
  const treeCount = SETTINGS.trees + Math.floor(rand() * (SETTINGS.trees * 0.5));
  for (let i = 0; i < treeCount; i++) {
    const x = baseX + rand() * CHUNK_SIZE;
    const z = baseZ + rand() * CHUNK_SIZE;
    const onRoadH = hasRoadH && Math.abs(z - (baseZ + CHUNK_SIZE/2)) < 4;
    const onRoadV = hasRoadV && Math.abs(x - (baseX + CHUNK_SIZE/2)) < 4;
    if (onRoadH || onRoadV) continue;
    createTree(x, z, rand, group);
  }

  // Трава
  const grassDensity = SETTINGS.grass;
  if (grassDensity > 0) {
    const grassMaterial = new THREE.MeshBasicMaterial({
      color: 0x5a9a3a, side: THREE.DoubleSide, transparent: true, opacity: 0.9
    });
    for (let i = 0; i < grassDensity; i++) {
      const gx = baseX + rand() * CHUNK_SIZE;
      const gz = baseZ + rand() * CHUNK_SIZE;
      const onRoadH = hasRoadH && Math.abs(gz - (baseZ + CHUNK_SIZE/2)) < 4;
      const onRoadV = hasRoadV && Math.abs(gx - (baseX + CHUNK_SIZE/2)) < 4;
      if (onRoadH || onRoadV) continue;
      createGrass(gx, gz, group, grassMaterial);
    }
  }

  // Цветы
  const flowerCount = 12 + Math.floor(rand() * 12);
  for (let i = 0; i < flowerCount; i++) {
    const fx = baseX + rand() * CHUNK_SIZE;
    const fz = baseZ + rand() * CHUNK_SIZE;
    const onRoadH = hasRoadH && Math.abs(fz - (baseZ + CHUNK_SIZE/2)) < 4;
    const onRoadV = hasRoadV && Math.abs(fx - (baseX + CHUNK_SIZE/2)) < 4;
    if (onRoadH || onRoadV) continue;
    createFlower(fx, fz, group);
  }

  // Бабочки
  const butterflyCount = SETTINGS.butterflies > 0 ? Math.max(1, Math.floor(SETTINGS.butterflies * (0.5 + rand()))) : 0;
  for (let i = 0; i < butterflyCount; i++) {
    const bx = baseX + 10 + rand() * (CHUNK_SIZE - 20);
    const bz = baseZ + 10 + rand() * (CHUNK_SIZE - 20);
    const butterfly = createButterfly(bx, bz);
    scene.add(butterfly.group);
    wildlife.butterflies.push(butterfly);
  }

  scene.add(group);
  worldState.chunks.set(key, { group, cx, cz });

  if (!isStartChunk && rand() < 0.12 && deps.onSpawnBase) {
    const bx = baseX + 20 + rand() * (CHUNK_SIZE - 40);
    const bz = baseZ + 20 + rand() * (CHUNK_SIZE - 40);
    if (Math.hypot(bx - deps.player.position.x, bz - deps.player.position.z) > 50) {
      deps.onSpawnBase(bx, bz);
    }
  }
}

export function getChunkKey(cx, cz) { return cx + ',' + cz; }

export function removeChunk(cx, cz, player) {
  const key = getChunkKey(cx, cz);
  const chunk = worldState.chunks.get(key);
  if (!chunk) return;
  worldState.scene.remove(chunk.group);
  worldState.chunks.delete(key);

  const ccx = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
  const ccz = cz * CHUNK_SIZE + CHUNK_SIZE / 2;
  for (let i = wildlife.butterflies.length - 1; i >= 0; i--) {
    const b = wildlife.butterflies[i];
    if (Math.hypot(b.group.position.x - ccx, b.group.position.z - ccz) < CHUNK_SIZE) {
      worldState.scene.remove(b.group);
      wildlife.butterflies.splice(i, 1);
    }
  }

  for (let i = worldState.buildings.length - 1; i >= 0; i--) {
    if (worldState.buildings[i].chunkKey === key) worldState.buildings.splice(i, 1);
  }

  const px = player.position.x, pz = player.position.z;
  const maxDist = (SETTINGS.viewDist + 1) * CHUNK_SIZE;
  worldState.obstacles = worldState.obstacles.filter(o => Math.hypot(o.x - px, o.z - pz) < maxDist);
}

export function updateChunks(player, deps) {
  const px = Math.floor(player.position.x / CHUNK_SIZE);
  const pz = Math.floor(player.position.z / CHUNK_SIZE);
  const needed = new Set();
  const view = SETTINGS.viewDist;
  for (let dx = -view; dx <= view; dx++) {
    for (let dz = -view; dz <= view; dz++) {
      const cx = px + dx, cz = pz + dz;
      needed.add(getChunkKey(cx, cz));
      generateChunk(cx, cz, deps);
    }
  }
  for (const key of worldState.chunks.keys()) {
    if (!needed.has(key)) {
      const [cx, cz] = key.split(',').map(Number);
      removeChunk(cx, cz, player);
    }
  }
}

// ============ ТРАНСПОРТ ============
export function buildVehicleMesh(vehicleId, size, color) {
  const vehicleBody = new THREE.Group();
  const s = size;
  const wheels = [];

  if (vehicleId === 'alpha') {
    const frameMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.35 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.35*s, 0.25*s, 1.6*s), frameMat);
    frame.position.y = 0.65*s; frame.castShadow = SETTINGS.shadows; vehicleBody.add(frame);
    const tank = new THREE.Mesh(new THREE.SphereGeometry(0.4*s, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xcc3300, metalness: 0.6, roughness: 0.3 }));
    tank.scale.set(0.9, 0.8, 1.4); tank.position.set(0, 0.85*s, -0.1*s); vehicleBody.add(tank);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5*s, 0.18*s, 0.7*s),
      new THREE.MeshStandardMaterial({ color: 0x111111 }));
    seat.position.set(0, 0.9*s, 0.55*s); vehicleBody.add(seat);
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.03*s, 0.03*s, 0.7*s, 8),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 }));
    handlebar.rotation.z = Math.PI/2; handlebar.position.set(0, 1.15*s, -0.75*s);
    vehicleBody.add(handlebar);
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.15*s, 0.15*s, 0.12*s, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.8 }));
    hl.rotation.x = Math.PI/2; hl.position.set(0, 1.0*s, -1.05*s); vehicleBody.add(hl);
    const positions = [
      { x: 0, y: 0.4*s, z: 0.85*s, r: 0.4*s, w: 0.22*s },
      { x: 0, y: 0.4*s, z: -0.95*s, r: 0.4*s, w: 0.18*s }
    ];
    for (const p of positions) {
      const wg = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, p.w, 20),
        new THREE.MeshStandardMaterial({ color: 0x0f0f0f }));
      tire.rotation.z = Math.PI/2; wg.add(tire);
      wg.position.set(p.x, p.y, p.z);
      vehicleBody.add(wg);
      wheels.push(wg);
    }
    return { vehicleBody, wheels };
  }

  if (vehicleId === 'buggy') {
    const frameMat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4*s, 0.3*s, 2.2*s), frameMat);
    body.position.y = 0.8*s; body.castShadow = SETTINGS.shadows; vehicleBody.add(body);
    const cageMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    for (const dx of [-0.6*s, 0.6*s]) for (const dz of [-0.7*s, 0.7*s]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05*s, 0.05*s, 1.2*s, 6), cageMat);
      pole.position.set(dx, 1.6*s, dz); vehicleBody.add(pole);
    }
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9*s, 0.3*s, 0.7*s),
      new THREE.MeshStandardMaterial({ color: 0x111111 }));
    seat.position.set(0, 1.05*s, 0.2*s); vehicleBody.add(seat);
    makeWheels(vehicleBody, wheels, s, 0.5*s, 0.45*s, [[-0.7,0.5,-0.9],[0.7,0.5,-0.9],[-0.7,0.5,0.9],[0.7,0.5,0.9]]);
    return { vehicleBody, wheels };
  }

  if (vehicleId === 'jeep') {
    const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.45 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.75 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.7*s, 0.6*s, 3.2*s), bodyMat);
    body.position.y = 0.75*s; body.castShadow = SETTINGS.shadows; vehicleBody.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55*s, 0.7*s, 1.5*s), bodyMat);
    cabin.position.set(0, 1.4*s, 0.2*s); vehicleBody.add(cabin);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.4*s, 0.55*s, 0.05*s), glassMat);
    windshield.position.set(0, 1.4*s, -0.55*s); vehicleBody.add(windshield);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.65*s, 0.15*s, 1.2*s), bodyMat);
    hood.position.set(0, 1.1*s, -1.15*s); vehicleBody.add(hood);
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.7 });
    const hl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16*s, 0.16*s, 0.1*s, 12), hlMat);
    hl1.rotation.x = Math.PI/2; hl1.position.set(-0.6*s, 0.85*s, -1.62*s); vehicleBody.add(hl1);
    const hl2 = hl1.clone(); hl2.position.x = 0.6*s; vehicleBody.add(hl2);
    const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2*s, 0.25*s, 0.25*s, 10),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 }));
    turretBase.position.set(0, 1.85*s, 0.2*s); vehicleBody.add(turretBase);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05*s, 0.05*s, 1.2*s, 8),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 1.95*s, -0.5*s); vehicleBody.add(barrel);
    makeWheels(vehicleBody, wheels, s, 0.45*s, 0.4*s, [[-0.95,0.45,-1.05],[0.95,0.45,-1.05],[-0.95,0.45,1.05],[0.95,0.45,1.05]]);
    return { vehicleBody, wheels };
  }

  if (vehicleId === 'btr') {
    const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.65, roughness: 0.55 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9*s, 1.0*s, 3.8*s), bodyMat);
    body.position.y = 1.0*s; body.castShadow = SETTINGS.shadows; vehicleBody.add(body);
    const slopeF = new THREE.Mesh(new THREE.BoxGeometry(1.9*s, 0.7*s, 0.9*s), bodyMat);
    slopeF.position.set(0, 1.55*s, -1.6*s); slopeF.rotation.x = -0.35; vehicleBody.add(slopeF);
    const slopeB = slopeF.clone(); slopeB.position.z = 1.6*s; slopeB.rotation.x = 0.35; vehicleBody.add(slopeB);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.85*s, 0.1*s, 3.7*s), darkMat);
    top.position.y = 1.55*s; vehicleBody.add(top);
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.7*s, 0.85*s, 0.6*s, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a }));
    turret.position.set(0, 1.9*s, 0); vehicleBody.add(turret);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09*s, 0.11*s, 1.8*s, 12),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.95 }));
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 2.0*s, -1.5*s); vehicleBody.add(barrel);
    makeWheels(vehicleBody, wheels, s, 0.5*s, 0.5*s, [
      [-1.05,0.5,-1.3],[1.05,0.5,-1.3],[-1.05,0.5,0],[1.05,0.5,0],[-1.05,0.5,1.3],[1.05,0.5,1.3]
    ]);
    return { vehicleBody, wheels };
  }

  if (vehicleId === 'mech') {
    const metalMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.4 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4*s, 1.6*s, 1.4*s), metalMat);
    body.position.y = 2.0*s; vehicleBody.add(body);
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.0*s, 0.7*s, 0.9*s),
      new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.7 }));
    cockpit.position.set(0, 2.7*s, -0.4*s); vehicleBody.add(cockpit);
    for (const dx of [-0.6*s, 0.6*s]) {
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.3*s, 1.2*s, 0.3*s), metalMat);
      upper.position.set(dx, 1.2*s, 0); vehicleBody.add(upper);
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.4*s, 1.0*s, 0.5*s), darkMat);
      lower.position.set(dx, 0.5*s, 0); vehicleBody.add(lower);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.6*s, 0.2*s, 0.8*s), darkMat);
      foot.position.set(dx, 0.1*s, -0.1*s); vehicleBody.add(foot);
    }
    for (const dx of [-0.9*s, 0.9*s]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3*s, 0.9*s, 0.3*s), metalMat);
      arm.position.set(dx, 1.9*s, 0); vehicleBody.add(arm);
      const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.1*s, 0.1*s, 0.9*s, 8), darkMat);
      gun.rotation.x = Math.PI/2; gun.position.set(dx, 1.5*s, -0.5*s); vehicleBody.add(gun);
    }
    return { vehicleBody, wheels };
  }

  if (vehicleId === 'tank') {
    const hullMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.65 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a3a2a, metalness: 0.5 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.95 });
    const trackL = new THREE.Group();
    trackL.position.set(-1.05*s, 0.4*s, 0);
    const trackMainL = new THREE.Mesh(new THREE.BoxGeometry(0.55*s, 0.75*s, 4.0*s), darkMat);
    trackMainL.castShadow = SETTINGS.shadows; trackL.add(trackMainL);
    for (let i = 0; i < 12; i++) {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.6*s, 0.08*s, 0.25*s),
        new THREE.MeshStandardMaterial({ color: 0x111111 }));
      tread.position.set(0, 0.4*s, -1.8*s + i*0.32*s); trackL.add(tread);
      const treadB = tread.clone(); treadB.position.y = -0.4*s; trackL.add(treadB);
    }
    vehicleBody.add(trackL);
    const trackR = trackL.clone(); trackR.position.x = 1.05*s; vehicleBody.add(trackR);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.1*s, 0.85*s, 3.7*s), hullMat);
    hull.position.y = 1.05*s; hull.castShadow = SETTINGS.shadows; vehicleBody.add(hull);
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.1*s, 0.7*s, 0.9*s), hullMat);
    front.position.set(0, 1.55*s, -1.75*s); front.rotation.x = -0.55; vehicleBody.add(front);
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.0*s, 1.2*s, 0.85*s, 14),
      new THREE.MeshStandardMaterial({ color, metalness: 0.6 }));
    turret.position.set(0, 2.1*s, 0.2*s); vehicleBody.add(turret);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13*s, 0.16*s, 2.6*s, 14), metalMat);
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 2.15*s, -2.5*s); vehicleBody.add(barrel);
    return { vehicleBody, wheels };
  }

  return { vehicleBody, wheels };
}

function makeWheels(parent, wheelList, size, radius, width, positions) {
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 1 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.85, roughness: 0.25 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
  for (const [x, y, z] of positions) {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 18), wheelMat);
    tire.rotation.z = Math.PI/2; tire.castShadow = SETTINGS.shadows; wg.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius*0.55, radius*0.55, width*1.02, 10), rimMat);
    rim.rotation.z = Math.PI/2; wg.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius*0.15, radius*0.15, width*1.1, 8), hubMat);
    hub.rotation.z = Math.PI/2; wg.add(hub);
    wg.position.set(x*size, y*size, z*size);
    parent.add(wg);
    wheelList.push(wg);
  }
}

// ============ ВЕРТОЛЁТ ============
export function buildHeliMesh(size, color) {
  const vehicleBody = new THREE.Group();
  const s = size;
  const wheels = [];

  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.7 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.85, roughness: 0.3 });

  const cabin = new THREE.Mesh(new THREE.SphereGeometry(1.0*s, 12, 10), glassMat);
  cabin.scale.set(1, 0.8, 1.3); cabin.castShadow = SETTINGS.shadows; vehicleBody.add(cabin);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6*s, 0.7*s, 2.0*s), bodyMat);
  hull.position.set(0, -0.3*s, 0); hull.castShadow = SETTINGS.shadows; vehicleBody.add(hull);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4*s, 0.4*s, 2.5*s), bodyMat);
  tail.position.set(0, 0, 2.0*s); tail.castShadow = SETTINGS.shadows; vehicleBody.add(tail);

  const mainRotorGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15*s, 0.03*s, 4.5*s),
      new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true, opacity: 0.7 }));
    blade.rotation.y = (i / 4) * Math.PI * 2;
    blade.position.y = 0.9*s;
    mainRotorGroup.add(blade);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08*s, 0.08*s, 0.5*s, 8), darkMat);
  mast.position.y = 0.7*s;
  mainRotorGroup.add(mast);
  vehicleBody.add(mainRotorGroup);
  wheels.push({ rotation: mainRotorGroup.rotation, _isRotor: true });

  const tailRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.5*s, 0.5*s, 0.05*s, 8),
    new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.7 }));
  tailRotor.rotation.z = Math.PI/2;
  tailRotor.position.set(0.3*s, 0, 3.2*s);
  vehicleBody.add(tailRotor);
  wheels.push({ rotation: tailRotor.rotation, _isRotor: true, _axis: 'y' });

  const skiMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
  for (const dx of [-0.7*s, 0.7*s]) {
    const ski = new THREE.Mesh(new THREE.BoxGeometry(0.15*s, 0.1*s, 2.2*s), skiMat);
    ski.position.set(dx, -0.7*s, 0); vehicleBody.add(ski);
  }
  return { vehicleBody, wheels };
}

// ============ АПАЧ ============
export function buildApacheMesh(size, color) {
  const vehicleBody = new THREE.Group();
  const s = size;
  const wheels = [];

  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.7 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.85, roughness: 0.3 });

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.7*s, 0.6*s, 1.6*s), bodyMat);
  cabin.position.set(0, 0, -0.8*s); cabin.castShadow = SETTINGS.shadows; vehicleBody.add(cabin);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.65*s, 0.5*s, 0.1*s), glassMat);
  glass.position.set(0, 0.05*s, -1.55*s); glass.rotation.x = -0.3; vehicleBody.add(glass);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.8*s, 0.5*s, 2.0*s), bodyMat);
  hull.position.set(0, -0.05*s, 0.6*s); hull.castShadow = SETTINGS.shadows; vehicleBody.add(hull);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.25*s, 0.25*s, 2.5*s), bodyMat);
  tail.position.set(0, 0.15*s, 2.5*s); tail.castShadow = SETTINGS.shadows; vehicleBody.add(tail);
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.06*s, 0.7*s, 0.6*s), bodyMat);
  tailFin.position.set(0, 0.5*s, 3.5*s); vehicleBody.add(tailFin);

  const tailRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.6*s, 0.6*s, 0.04*s, 8),
    new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.5 }));
  tailRotor.rotation.z = Math.PI / 2;
  tailRotor.position.set(0.15*s, 0.5*s, 3.8*s);
  vehicleBody.add(tailRotor);
  wheels.push({ rotation: tailRotor.rotation, _isRotor: true, _axis: 'y' });

  const mainRotorGroup = new THREE.Group();
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06*s, 0.06*s, 0.4*s, 8), darkMat);
  mast.position.y = 0.4*s; mainRotorGroup.add(mast);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15*s, 0.03*s, 4.5*s),
      new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true, opacity: 0.7 }));
    blade.rotation.y = (i / 4) * Math.PI * 2;
    blade.position.y = 0.6*s;
    mainRotorGroup.add(blade);
  }
  mainRotorGroup.position.set(0, 0.1*s, 0);
  vehicleBody.add(mainRotorGroup);
  wheels.push({ rotation: mainRotorGroup.rotation, _isRotor: true, _axis: 'y' });

  for (const dx of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2*s, 0.1*s, 0.6*s), bodyMat);
    wing.position.set(dx * 0.9*s, 0.1*s, 0.3*s); vehicleBody.add(wing);
    for (let i = 0; i < 3; i++) {
      const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.05*s, 0.05*s, 0.6*s, 6),
        new THREE.MeshStandardMaterial({ color: 0xaa2222, metalness: 0.7 }));
      rocket.rotation.x = Math.PI / 2;
      rocket.position.set(dx * 0.9*s, -0.05*s, 0.2*s + i * 0.2*s - 0.2*s);
      vehicleBody.add(rocket);
    }
  }

  const noseGun = new THREE.Mesh(new THREE.CylinderGeometry(0.06*s, 0.06*s, 0.7*s, 8), darkMat);
  noseGun.rotation.x = Math.PI / 2;
  noseGun.position.set(0, -0.2*s, -1.8*s); vehicleBody.add(noseGun);

  const skiMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
  for (const dx of [-0.5*s, 0.5*s]) {
    const ski = new THREE.Mesh(new THREE.BoxGeometry(0.1*s, 0.08*s, 1.5*s), skiMat);
    ski.position.set(dx, -0.5*s, 0.5*s); vehicleBody.add(ski);
  }
  return { vehicleBody, wheels };
}

// ============ САМОЛЁТ ============
export function buildPlaneMesh(size, color) {
  const vehicleBody = new THREE.Group();
  const s = size;
  const wheels = [];

  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.7, metalness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9 });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.35*s, 0.35*s, 3.5*s, 12), bodyMat);
  fuselage.rotation.x = Math.PI / 2; fuselage.castShadow = SETTINGS.shadows; vehicleBody.add(fuselage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.35*s, 0.8*s, 12), bodyMat);
  nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0, -2.15*s); vehicleBody.add(nose);
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.5*s, 0.35*s, 0.9*s), glassMat);
  cockpit.position.set(0, 0.15*s, -1.0*s); vehicleBody.add(cockpit);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(3.5*s, 0.12*s, 1.0*s), bodyMat);
  wingL.position.set(0, 0, 0.2*s); wingL.castShadow = SETTINGS.shadows; vehicleBody.add(wingL);
  for (const dx of [-1, 1]) {
    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.1*s, 0.6*s, 0.7*s), bodyMat);
    winglet.position.set(dx * 1.75*s, 0.3*s, 0.2*s); vehicleBody.add(winglet);
  }
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.1*s, 1.0*s, 0.9*s), bodyMat);
  tailFin.position.set(0, 0.6*s, 1.7*s); tailFin.castShadow = SETTINGS.shadows; vehicleBody.add(tailFin);
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(1.5*s, 0.08*s, 0.4*s), bodyMat);
  tailWing.position.set(0, 0.2*s, 1.9*s); vehicleBody.add(tailWing);

  const propGroup = new THREE.Group();
  const propHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12*s, 0.12*s, 0.15*s, 8), darkMat);
  propHub.rotation.x = Math.PI / 2; propGroup.add(propHub);
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12*s, 1.4*s, 0.04*s),
      new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true, opacity: 0.8 }));
    blade.rotation.z = (i / 3) * Math.PI * 2;
    propGroup.add(blade);
  }
  propGroup.position.set(0, 0, -2.6*s);
  vehicleBody.add(propGroup);
  wheels.push({ rotation: propGroup.rotation, _isRotor: true, _axis: 'z' });

  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f0f0f });
  for (const [dx, dz] of [[-0.6, -0.8], [0.6, -0.8], [0, 1.5]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04*s, 0.04*s, 0.4*s, 6), darkMat);
    leg.position.set(dx*s, -0.35*s, dz*s); vehicleBody.add(leg);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.15*s, 0.15*s, 0.1*s, 10), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(dx*s, -0.6*s, dz*s);
    vehicleBody.add(tire);
  }
  return { vehicleBody, wheels };
}

// ============ ИСТРЕБИТЕЛЬ ============
export function buildJetMesh(size, color) {
  const vehicleBody = new THREE.Group();
  const s = size;
  const wheels = [];

  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.25 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x224466, transparent: true, opacity: 0.75, metalness: 0.5 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.95 });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.4*s, 0.4*s, 4.5*s, 14), bodyMat);
  fuselage.rotation.x = Math.PI / 2; fuselage.castShadow = SETTINGS.shadows; vehicleBody.add(fuselage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.4*s, 1.5*s, 14), bodyMat);
  nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0, -3.0*s); vehicleBody.add(nose);
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.6*s, 0.35*s, 1.4*s), glassMat);
  cockpit.position.set(0, 0.3*s, -1.8*s); vehicleBody.add(cockpit);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(4.0*s, 1.5*s);
  wingShape.lineTo(4.0*s, 2.0*s);
  wingShape.lineTo(0.5*s, 2.0*s);
  wingShape.lineTo(0, 0);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.1*s, bevelEnabled: false });
  const wingL = new THREE.Mesh(wingGeo, bodyMat);
  wingL.rotation.x = -Math.PI / 2; wingL.position.set(-0.05*s, 0, 0);
  wingL.castShadow = SETTINGS.shadows; vehicleBody.add(wingL);
  const wingR = wingL.clone();
  wingR.scale.x = -1; wingR.position.x = 0.05*s; vehicleBody.add(wingR);

  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.1*s, 1.4*s, 1.5*s), bodyMat);
  tailFin.position.set(0, 0.7*s, 2.0*s);
  tailFin.geometry.rotateX(-0.3); vehicleBody.add(tailFin);
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(2.0*s, 0.08*s, 0.7*s), bodyMat);
  tailWing.position.set(0, 0, 2.2*s); vehicleBody.add(tailWing);

  for (const dx of [-0.35, 0.35]) {
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.25*s, 0.28*s, 1.5*s, 12), darkMat);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(dx*s, -0.15*s, 1.5*s); vehicleBody.add(engine);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.28*s, 0.32*s, 0.4*s, 12),
      new THREE.MeshStandardMaterial({ color: 0x442200, metalness: 0.9, emissive: 0xff4400, emissiveIntensity: 0.4 }));
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(dx*s, -0.15*s, 2.4*s); vehicleBody.add(nozzle);
  }

  for (const dx of [-1.5, 1.5]) {
    for (let i = 0; i < 2; i++) {
      const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.06*s, 0.06*s, 0.9*s, 6),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 }));
      rocket.rotation.x = Math.PI / 2;
      rocket.position.set(dx*s, -0.15*s, -0.3*s + i * 0.5*s);
      vehicleBody.add(rocket);
    }
  }

  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f0f0f });
  for (const [dx, dz] of [[-0.7, -1.5], [0.7, -1.5], [0, 1.8]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04*s, 0.04*s, 0.5*s, 6), darkMat);
    leg.position.set(dx*s, -0.45*s, dz*s); vehicleBody.add(leg);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.18*s, 0.18*s, 0.1*s, 10), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(dx*s, -0.7*s, dz*s);
    vehicleBody.add(tire);
  }
  return { vehicleBody, wheels };
}