import * as THREE from 'three';
import {
  CHUNK_SIZE, worldState,
  getTerrainHeight, addObstacle, checkCollision,
  updateChunks, buildVehicleMesh,
  buildHeliMesh, buildApacheMesh, buildPlaneMesh, buildJetMesh,
  createBird, wildlife, WIND,
  WEATHER, SETTINGS
} from './world.js';

// ============ ПЛАТФОРМА ============
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 ||
                /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

// ============ ПЕРСОНАЖИ ============
const HEROES = {
  artem: { id:'artem', name:'Артём', avatar:'💪', hpBonus:50, speedMult:0.95, damageMult:1.2 },
  yurik: { id:'yurik', name:'Юрик', avatar:'🏃', hpBonus:0,  speedMult:1.3,  damageMult:0.9 }
};
let currentHero = HEROES.artem;

// ============ ОРУЖИЕ ============
const WEAPONS = {
  pistol:      { id:'pistol',      name:'Пистолет',   price:0,     damage:2,  fireRate:0.13, mag:30,  spread:0.01, pellets:1, color:0xffee00, zoom:35, range:150, type:'bullet' },
  smg:         { id:'smg',         name:'ПП',         price:300,   damage:2,  fireRate:0.07, mag:40,  spread:0.03, pellets:1, color:0xffaa00, zoom:38, range:130, type:'bullet' },
  shotgun:     { id:'shotgun',     name:'Дробовик',   price:700,   damage:6,  fireRate:0.8,  mag:8,   spread:0.15, pellets:6, color:0xff6600, zoom:40, range:50,  type:'bullet' },
  rifle:       { id:'rifle',       name:'Автомат',    price:1500,  damage:4,  fireRate:0.1,  mag:60,  spread:0.02, pellets:1, color:0xffdd00, zoom:35, range:180, type:'bullet' },
  sniper:      { id:'sniper',      name:'Снайперка',  price:3000,  damage:25, fireRate:1.5,  mag:5,   spread:0.001,pellets:1, color:0x00ffff, zoom:15, range:500, type:'bullet' },
  minigun:     { id:'minigun',     name:'Пулемёт',    price:6000,  damage:3,  fireRate:0.05, mag:200, spread:0.04, pellets:1, color:0xff00ff, zoom:40, range:160, type:'bullet' },
  flamethrower:{ id:'flamethrower',name:'Огнемёт',    price:4500,  damage:2,  fireRate:0.03, mag:300, spread:0.08, pellets:1, color:0xff4400, zoom:50, range:25,  type:'flame' },
  grenade:     { id:'grenade',     name:'Гранатомёт', price:5500,  damage:0,  fireRate:1.2,  mag:6,   spread:0.02, pellets:1, color:0x00ff00, zoom:40, range:100, type:'grenade', blastRadius:5, blastDamage:60 },
  laser:       { id:'laser',       name:'Лазер',      price:9000,  damage:8,  fireRate:0.12, mag:80,  spread:0.0,  pellets:1, color:0xff00ff, zoom:30, range:400, type:'laser' },
  railgun:     { id:'railgun',     name:'Рельсотрон', price:15000, damage:60, fireRate:2.5,  mag:3,   spread:0.0,  pellets:1, color:0x00ffff, zoom:20, range:800, type:'bullet' },
  rpg:         { id:'rpg',         name:'РПГ',        price:8000,  damage:0,  fireRate:1.5,  mag:1,   spread:0.01, pellets:1, color:0xff4400, zoom:45, range:300, type:'rocket', blastRadius:8, blastDamage:100 }
};

// ============ ТРАНСПОРТ ============
const VEHICLES = {
  foot:  { id:'foot',  name:'Пешеход',            price:0,     speed:1,   hpBonus:0,    size:1,   color:0x3355aa, autoFire:0,    bombResist:0,    camDist:0,  camHeight:1.7 },
  alpha: { id:'alpha', name:'Толик (мото)',       price:500,   speed:2.2, hpBonus:50,   size:1.0, color:0xff4400, autoFire:0,    bombResist:0,    camDist:6,  camHeight:2.2 },
  buggy: { id:'buggy', name:'Багги',              price:1500,  speed:2.5, hpBonus:150,  size:1.1, color:0xffaa00, autoFire:0,    bombResist:0.1,  camDist:7,  camHeight:2.8 },
  jeep:  { id:'jeep',  name:'Джип',               price:2000,  speed:1.9, hpBonus:200,  size:1.1, color:0x44aa44, autoFire:0.4,  bombResist:0.2,  camDist:8,  camHeight:3.5 },
  btr:   { id:'btr',   name:'БТР',                price:5000,  speed:1.6, hpBonus:500,  size:1.3, color:0x666666, autoFire:0.3,  bombResist:0.5,  camDist:9,  camHeight:4 },
  mech:  { id:'mech',  name:'Шагоход',            price:15000, speed:1.1, hpBonus:900,  size:1.6, color:0x5566aa, autoFire:0.15, bombResist:0.6,  camDist:10, camHeight:5.5 },
  tank:  { id:'tank',  name:'Танк',               price:20000, speed:1.3, hpBonus:1400, size:1.6, color:0x556644, autoFire:0.2,  bombResist:0.8,  camDist:11, camHeight:4.5 },
  heli:  { id:'heli',  name:'Вертолёт',           price:9000,  speed:2.8, hpBonus:400,  size:1.4, color:0x888888, autoFire:0.5,  bombResist:0.3,  camDist:10, camHeight:5,   flying:true, flightSpeed:12, maxAltitude:60 },
  apache:{ id:'apache',name:'Апач (боевой)',      price:18000, speed:3.5, hpBonus:600,  size:1.2, color:0x3a4a2a, autoFire:0.15, bombResist:0.4,  camDist:11, camHeight:4.5, flying:true, flightSpeed:15, maxAltitude:70 },
  plane: { id:'plane', name:'Кукурузник',         price:7000,  speed:4.0, hpBonus:200,  size:1.3, color:0x88aa44, autoFire:0,    bombResist:0.1,  camDist:12, camHeight:4,   flying:true, flightSpeed:20, maxAltitude:80, needsSpeed:true },
  jet:   { id:'jet',   name:'Су-57 (истребитель)',price:30000, speed:6.0, hpBonus:800, size:1.5, color:0x445566, autoFire:0.1,  bombResist:0.5,  camDist:14, camHeight:5,   flying:true, flightSpeed:40, maxAltitude:100, needsSpeed:true }
};

// ============ ДРОНЫ-СОЮЗНИКИ ============
const ALLY_DRONES = {
  scout:   { id:'scout',   name:'Разведчик', price:1000, damage:2, fireRate:0.8, range:40, hp:5,  speed:8,  color:0x00ff00, desc:'Быстрый, слабый' },
  assault: { id:'assault', name:'Штурмовик', price:3500, damage:4, fireRate:0.4, range:50, hp:15, speed:5,  color:0xff8800, desc:'Средний' },
  heavy:   { id:'heavy',   name:'Тяжёлый',   price:8000, damage:8, fireRate:0.6, range:60, hp:30, speed:4,  color:0xff0044, desc:'Мощный' },
  kamikaze:{ id:'kamikaze',name:'Камикадзе', price:2000, damage:80,fireRate:0,   range:30, hp:3,  speed:12, color:0xffff00, desc:'Взрывается' },
  guardian:{ id:'guardian',name:'Стражник',  price:6000, damage:3, fireRate:0.5, range:35, hp:40, speed:3,  color:0x00ffff, desc:'Много HP' }
};

// ============ РАКЕТЫ ============
const ROCKETS = {
  homing:  { id:'homing',  name:'Самонаводящаяся', price:500,  damage:30, blastRadius:4,  speed:50, homing:true,  desc:'Летит за целью' },
  cluster: { id:'cluster', name:'Кластерная',      price:800,  damage:20, blastRadius:3,  speed:40, homing:false, cluster:6, desc:'6 суб-ракет' },
  emp:     { id:'emp',     name:'ЭМИ-ракета',      price:1200, damage:0,  blastRadius:15, speed:45, homing:false, emp:true, desc:'Отключает дронов' },
  nuke:    { id:'nuke',    name:'Мини-ядерная',    price:2000, damage:200,blastRadius:20, speed:30, homing:false, desc:'Огромный взрыв' }
};

// ============ ПРОМОКОДЫ ============
const PROMOCODES = {
  'TOLIK':           { money: 5000,   message: '+5000 $' },
  'POBEG_OT_DRONOV': { money: 10000,  message: '+10000 $' },
  'ARTEM_TOP':       { money: 15000,  message: '+15000 $' },
  'YURIK_FAST':      { money: 15000,  message: '+15000 $' },
  'MEGA_BONUS':      { money: 50000,  message: '+50000 $' },
  'CHEAT_MONEY':     { money: 100000, message: '+100000 $' },
  'GOD_MODE':        { money: 999999, message: '+999999 $' },
  'FREE_DRONE':      { money: 25000,  message: '+25000 $' }
};
const USED_PROMOS_KEY = 'drone_used_promos';
const MUSIC_SETTINGS_KEY = 'drone_music_settings';

// ============ ГЛОБАЛЬНЫЕ ============
let scene, camera, renderer, clock;
let player, velocity, onGround;
let bullets = [], rockets = [], grenades = [], bombs = [], pickups = [], flames = [], laserBeams = [], rocketProjectiles = [];
let allyDrones = [], npcs = [], npcBullets = [], militaryBases = [];
let ownedAllyDrones = new Set();
let ownedRockets = new Set();
let selectedRocket = null;
let keys = {};
let health = 100, maxHealth = 100, score = 0;
let money = 0;
let gameActive = false;
let started = false;
let paused = false;

// ⚠️ ВАЖНО: yaw и pitch должны быть ОБЪЯВЛЕНЫ ДО первого вызова rebuildPlayer()
let yaw = 0, pitch = 0;

let currentWeapon = WEAPONS.pistol;
let currentVehicle = VEHICLES.foot;
let ownedWeapons = new Set(['pistol']);
let ownedVehicles = new Set(['foot']);

let ammo = 30, reloading = false, reloadTimer = 0;
let zoomed = false;
let fireCooldown = 0;
let autoFireTimer = 0;
let vehicleWheels = [];
let vehicleBody = null;
let vehicleLean = { x: 0, z: 0 };
let isFirstPerson = true;

// Оружие в руках
let viewModel = null;
let viewModelGroup = null;
let viewBobTimer = 0;
let viewRecoil = 0;

let camAngle = 0, camTargetAngle = 0, lastInputTime = 0, camHeightSmooth = 2.2;

let joyActive = false, joyId = null, joyDX = 0, joyDY = 0;
let lookId = null, lookLastX = 0, lookLastY = 0;
let touchFire = false, touchJump = false, touchRun = false;
let touchFlyUp = false, touchFlyDown = false;

let allDrones = [];
let nearestLoot = null;

let sunLight = null, hemiLight = null, ambientLight = null;

// ============ МУЗЫКА ============
let bgMusic = null;
let musicEnabled = true;
let musicVolume = 0.4;

function loadMusicSettings() {
  try {
    const saved = localStorage.getItem(MUSIC_SETTINGS_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (typeof data.enabled === 'boolean') musicEnabled = data.enabled;
      if (typeof data.volume === 'number') musicVolume = data.volume;
    }
  } catch (e) {}
}

function saveMusicSettings() {
  try {
    localStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify({
      enabled: musicEnabled,
      volume: musicVolume
    }));
  } catch (e) {}
}

function updateMusicUI() {
  const onBtn = document.getElementById('musicOnBtn');
  const offBtn = document.getElementById('musicOffBtn');
  const volEl = document.getElementById('setMusicVolume');
  const volValEl = document.getElementById('setMusicVolumeVal');

  if (onBtn) onBtn.classList.toggle('active', musicEnabled);
  if (offBtn) offBtn.classList.toggle('active', !musicEnabled);
  if (volEl) volEl.value = musicVolume;
  if (volValEl) volValEl.textContent = Math.round(musicVolume * 100) + '%';
}

function playMusic() {
  if (!bgMusic || !musicEnabled) return;
  bgMusic.volume = musicVolume;
  bgMusic.play().catch(e => console.log('Музыка не запустилась:', e.message));
}

function pauseMusic() {
  if (bgMusic) bgMusic.pause();
}

// ============ ЗВУК ============
let audioCtx = null, masterGain = null;
let ambientGain = null;
let footstepsTimer = 0;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

let noiseBuffer = null;
function getNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;
  const len = audioCtx.sampleRate;
  noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function tone(freq, type, duration, vol, sweepTo=null, delay=0) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain); gain.connect(masterGain);
  osc.start(now); osc.stop(now + duration);
}
function noise(duration, vol, filterFreq, sweepTo=null, delay=0) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime + delay;
  const src = audioCtx.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFreq, now);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  src.connect(filter); filter.connect(gain); gain.connect(masterGain);
  src.start(now); src.stop(now + duration);
}

function sndWeaponShoot(id) {
  if (!audioCtx) return;
  const cfg = {
    pistol:      () => { noise(0.1, 0.35, 3000, 400); tone(500, 'square', 0.08, 0.15, 120); },
    smg:         () => { noise(0.06, 0.3, 3500, 500); tone(600, 'square', 0.05, 0.12, 150); },
    shotgun:     () => { noise(0.25, 0.6, 1500, 100); tone(300, 'sawtooth', 0.2, 0.25, 60); },
    rifle:       () => { noise(0.09, 0.4, 4000, 500); tone(700, 'square', 0.07, 0.18, 140); },
    sniper:      () => { noise(0.4, 0.7, 5000, 100); tone(1200, 'sawtooth', 0.35, 0.3, 100); },
    minigun:     () => { noise(0.05, 0.28, 3200, 400); tone(800, 'square', 0.04, 0.15, 200); },
    flamethrower:() => { noise(0.08, 0.25, 800, 400); tone(150, 'sawtooth', 0.06, 0.1, 80); },
    grenade:     () => { noise(0.15, 0.4, 1200, 200); tone(200, 'square', 0.1, 0.2, 80); },
    laser:       () => { tone(2000, 'sine', 0.15, 0.2, 400); tone(1500, 'sine', 0.15, 0.15, 300, 0.02); },
    railgun:     () => { noise(0.5, 0.6, 6000, 100); tone(2000, 'sawtooth', 0.4, 0.35, 100); },
    rpg:         () => { noise(0.5, 0.6, 2000, 80); tone(400, 'sawtooth', 0.4, 0.3, 40); }
  };
  (cfg[id] || cfg.pistol)();
}

function soundExplosion(volume = 0.6, duration = 0.8) {
  if (!audioCtx) return;
  noise(duration, volume, 800, 60);
  tone(80, 'sine', duration, volume * 0.8, 20);
  noise(duration * 1.2, volume * 0.3, 400, 40, duration * 0.3);
}

const sndHit = () => { noise(0.08, 0.25, 1200, 400); tone(900, 'square', 0.08, 0.15, 180); };
const sndKill = () => { soundExplosion(0.35, 0.5); tone(1600, 'sine', 0.15, 0.1, 2000, 0.05); };
const sndCoin = () => { tone(1046, 'sine', 0.12, 0.15); tone(1568, 'sine', 0.15, 0.12, null, 0.06); };
const sndPickup = () => { [523, 659, 784].forEach((f, i) => tone(f, 'triangle', 0.2, 0.18, null, i * 0.07)); };
const sndReload = () => { tone(200, 'square', 0.05, 0.2); tone(200, 'square', 0.05, 0.2, null, 0.6); };
const sndAlarm = () => { for (let i = 0; i < 3; i++) tone(600 + i * 200, 'sawtooth', 0.13, 0.15, null, i * 0.15); };
const sndLoot = () => { [392, 523, 659, 784].forEach((f, i) => tone(f, 'sine', 0.25, 0.15, null, i * 0.06)); };
const sndVehicle = () => { tone(120, 'sawtooth', 0.4, 0.1, 180); tone(180, 'sawtooth', 0.4, 0.08, 260, 0.2); };
const sndMenuClick = () => tone(800, 'sine', 0.08, 0.12, 1200);
const sndBuy = () => { [880, 1100, 1320].forEach((f, i) => tone(f, 'sine', 0.15, 0.14, null, i * 0.05)); };
const sndPromoOk = () => { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 'triangle', 0.3, 0.18, null, i * 0.08)); };
const sndPromoErr = () => { tone(200, 'sawtooth', 0.2, 0.2, 100); tone(150, 'sawtooth', 0.25, 0.2, 80, 0.15); };
const sndJump = () => tone(400, 'sine', 0.1, 0.1, 700);
const sndDamage = () => { noise(0.15, 0.3, 800, 200); tone(200, 'sawtooth', 0.15, 0.15, 100); };
const sndDeath = () => { soundExplosion(0.7, 1.2); [400, 300, 200, 100].forEach((f, i) => tone(f, 'sawtooth', 0.4, 0.2, f * 0.5, i * 0.15)); };
const sndBump = () => { noise(0.06, 0.3, 600, 200); tone(100, 'square', 0.05, 0.15, 60); };

function initAmbient() {
  if (!audioCtx) return;
  if (ambientGain) return;
  ambientGain = audioCtx.createGain();
  ambientGain.gain.value = 0.08;
  ambientGain.connect(masterGain);
}

function sndFootstep() {
  if (!audioCtx) return;
  const src = audioCtx.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 500;
  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  src.connect(filter); filter.connect(gain); gain.connect(masterGain);
  src.start(now); src.stop(now + 0.15);
}

function sndVehicleEngine() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 80 + Math.random() * 40;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(gain); gain.connect(masterGain);
  osc.start(now); osc.stop(now + 0.5);
}

function sndVehicleJet() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const src = audioCtx.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 2;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  src.connect(filter); filter.connect(gain); gain.connect(masterGain);
  src.start(now); src.stop(now + 0.8);
}

function sndThunder() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const src = audioCtx.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(60, now + 2);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
  src.connect(filter); filter.connect(gain); gain.connect(masterGain);
  src.start(now); src.stop(now + 2);
}

function sndBird() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500 + Math.random() * 800, now + i * 0.15);
    osc.frequency.exponentialRampToValueAtTime(2000 + Math.random() * 500, now + i * 0.15 + 0.1);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, now + i * 0.15);
    gain.gain.linearRampToValueAtTime(0.04, now + i * 0.15 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.12);
    osc.connect(gain); gain.connect(masterGain);
    osc.start(now + i * 0.15); osc.stop(now + i * 0.15 + 0.15);
  }
}

// ============ КОНСТАНТЫ ============
const PLAYER_SPEED = 8;
const RUN_MULT = 1.8;
const GRAVITY = -25;
const JUMP = 9;
const DRONE_ACTIVATE_DIST = 35;
const DRONES_GLOBAL_MAX = 5;

// ============ ИНИЦИАЛИЗАЦИЯ ============
function init() {
  if (isTouch) document.body.classList.add('is-touch');

  loadMusicSettings();

  bgMusic = document.getElementById('bgMusic');
  if (bgMusic) {
    bgMusic.volume = musicVolume;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fb8dd);
  scene.fog = new THREE.Fog(0x8fb8dd, 180, 550);
  worldState.scene = scene;

  camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, 0.08, 1500);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: !isTouch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, SETTINGS.resolution));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = SETTINGS.shadows && !isTouch;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();
  initAmbient();

  sunLight = new THREE.DirectionalLight(0xfff5e0, 1.4);
  sunLight.position.set(80, 150, 50);
  if (SETTINGS.shadows && !isTouch) {
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.left = -80;
    sunLight.shadow.camera.right = 80;
    sunLight.shadow.camera.top = 80;
    sunLight.shadow.camera.bottom = -80;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
  }
  scene.add(sunLight);

  hemiLight = new THREE.HemisphereLight(0xa8d0ff, 0x3a5a2a, 0.85);
  scene.add(hemiLight);
  ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambientLight);

  const rim = new THREE.DirectionalLight(0xffdd88, 0.4);
  rim.position.set(-50, 60, -80);
  scene.add(rim);

  WEATHER.init(scene, sunLight, hemiLight, ambientLight);

  for (let i = 0; i < 8; i++) {
    const bird = createBird();
    scene.add(bird.group);
    wildlife.birds.push(bird);
  }

  player = new THREE.Group();
  player.position.set(0, 0, 0);
  rebuildPlayer();
  scene.add(player);

  velocity = new THREE.Vector3();
  onGround = true;

  setupInput();
  setupMobileControls();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const best = parseInt(localStorage.getItem('drone_best_money') || '0');
  document.getElementById('best').textContent = best;
  document.getElementById('bestMenu').textContent = best;

  document.getElementById('shopBtn').addEventListener('click', () => { if (gameActive && !paused) openShop(); });
  document.getElementById('inventoryBtn').addEventListener('click', () => { if (gameActive && !paused) openInventory(); });

  setupUIEvents();
  updateMusicUI();
  updateChunks(player, getWorldDeps());
}

function getWorldDeps() {
  return {
    ownedWeapons,
    WEAPONS,
    player,
    onSpawnBase: spawnMilitaryBase
  };
}

// ============ ОРУЖИЕ В РУКАХ ============
function createViewWeapon(weaponId) {
  const group = new THREE.Group();
  const s = 0.15;

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.85, roughness: 0.25 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.85 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.95, roughness: 0.15 });

  if (weaponId === 'pistol') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.3), bodyMat);
    body.position.set(0, 0, -0.1); group.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), bodyMat);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.01, -0.28); group.add(barrel);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.06), bodyMat);
    grip.position.set(0, -0.09, 0.02); grip.rotation.x = 0.2; group.add(grip);
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), metalMat);
    sight.position.set(0, 0.05, -0.2); group.add(sight);
  } else if (weaponId === 'smg') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.4), bodyMat);
    body.position.set(0, 0, -0.15); group.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8), bodyMat);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0, -0.42); group.add(barrel);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.06), bodyMat);
    mag.position.set(0, -0.15, -0.05); group.add(mag);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), bodyMat);
    grip.position.set(0, -0.1, 0.08); group.add(grip);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.15), bodyMat);
    stock.position.set(0, -0.01, 0.18); group.add(stock);
  } else if (weaponId === 'shotgun') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.5), woodMat);
    body.position.set(0, -0.02, -0.15); group.add(body);
    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), metalMat);
    barrel1.rotation.x = Math.PI / 2; barrel1.position.set(0.04, 0.02, -0.4); group.add(barrel1);
    const barrel2 = barrel1.clone(); barrel2.position.x = -0.04; group.add(barrel2);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.12), woodMat);
    pump.position.set(0, -0.04, -0.3); group.add(pump);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.25), woodMat);
    stock.position.set(0, -0.05, 0.2); group.add(stock);
  } else if (weaponId === 'rifle') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.5), bodyMat);
    body.position.set(0, 0, -0.15); group.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), bodyMat);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.01, -0.5); group.add(barrel);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.08), bodyMat);
    mag.position.set(0, -0.16, -0.05); mag.rotation.x = -0.15; group.add(mag);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.06), bodyMat);
    grip.position.set(0, -0.1, 0.08); group.add(grip);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.2), bodyMat);
    stock.position.set(0, 0, 0.22); group.add(stock);
    const scope = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.1), metalMat);
    scope.position.set(0, 0.08, -0.15); group.add(scope);
  } else if (weaponId === 'sniper') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.7), bodyMat);
    body.position.set(0, 0, -0.2); group.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8), bodyMat);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0, -0.75); group.add(barrel);
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 12), bodyMat);
    scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.09, -0.15); group.add(scope);
    const scopeLens = new THREE.Mesh(new THREE.CircleGeometry(0.028, 12),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 }));
    scopeLens.position.set(0, 0.09, -0.02); group.add(scopeLens);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.25), woodMat);
    stock.position.set(0, -0.04, 0.25); group.add(stock);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.06), bodyMat);
    mag.position.set(0, -0.12, 0); group.add(mag);
  } else if (weaponId === 'minigun') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.45), bodyMat);
    body.position.set(0, 0, -0.1); group.add(body);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), metalMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(Math.cos(angle) * 0.04, Math.sin(angle) * 0.04, -0.55);
      group.add(barrel);
    }
    const barrelBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 12), bodyMat);
    barrelBase.rotation.x = Math.PI / 2; barrelBase.position.set(0, 0, -0.3); group.add(barrelBase);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.06), bodyMat);
    grip.position.set(0, -0.12, 0.1); group.add(grip);
    const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), bodyMat);
    ammoBox.position.set(-0.15, -0.05, 0.05); group.add(ammoBox);
  } else if (weaponId === 'flamethrower') {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 12), bodyMat);
    tank.position.set(-0.15, 0, 0.15); group.add(tank);
    const tank2 = tank.clone(); tank2.position.set(0.15, 0, 0.15); group.add(tank2);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.5, 10), metalMat);
    nozzle.rotation.x = Math.PI / 2; nozzle.position.set(0, 0, -0.3); group.add(nozzle);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6 }));
    tip.rotation.x = Math.PI / 2; tip.position.set(0, 0, -0.57); group.add(tip);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.06), bodyMat);
    handle.position.set(0.12, -0.08, -0.2); group.add(handle);
  } else if (weaponId === 'grenade') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12), bodyMat);
    body.rotation.x = Math.PI / 2; body.position.set(0, 0, -0.1); group.add(body);
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12), bodyMat);
    muzzle.rotation.x = Math.PI / 2; muzzle.position.set(0, 0, -0.38); group.add(muzzle);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), bodyMat);
    drum.rotation.z = Math.PI / 2; drum.position.set(0, -0.08, 0); group.add(drum);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.06), bodyMat);
    grip.position.set(0, -0.12, 0.05); group.add(grip);
  } else if (weaponId === 'laser') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.55), bodyMat);
    body.position.set(0, 0, -0.15); group.add(body);
    const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.15, 12),
      new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.9, metalness: 0.5 }));
    emitter.rotation.x = Math.PI / 2; emitter.position.set(0, 0, -0.5); group.add(emitter);
    const emitterBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), metalMat);
    emitterBase.rotation.x = Math.PI / 2; emitterBase.position.set(0, 0, -0.42); group.add(emitterBase);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.06), bodyMat);
    grip.position.set(0, -0.1, 0.05); group.add(grip);
    const battery = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.4 }));
    battery.position.set(0, 0.08, -0.05); group.add(battery);
  } else if (weaponId === 'railgun') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.7), bodyMat);
    body.position.set(0, 0, -0.2); group.add(body);
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.6), metalMat);
    rail1.position.set(-0.05, 0.05, -0.5); group.add(rail1);
    const rail2 = rail1.clone(); rail2.position.set(0.05, 0.05, -0.5); group.add(rail2);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.7 }));
    coil.rotation.y = Math.PI / 2; coil.position.set(0, 0.05, -0.5); group.add(coil);
    const coil2 = coil.clone(); coil2.position.z = -0.3; group.add(coil2);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), bodyMat);
    grip.position.set(0, -0.12, 0.05); group.add(grip);
  } else if (weaponId === 'rpg') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 12), bodyMat);
    tube.rotation.x = Math.PI / 2; tube.position.set(0, 0.05, -0.2); group.add(tube);
    const frontCone = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.15, 12), bodyMat);
    frontCone.rotation.x = Math.PI / 2; frontCone.position.set(0, 0.05, -0.68); group.add(frontCone);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.06), bodyMat);
    grip.position.set(0, -0.05, -0.05); group.add(grip);
    const grip2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.06), bodyMat);
    grip2.position.set(0, -0.05, 0.15); group.add(grip2);
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.03), metalMat);
    sight.position.set(-0.06, 0.15, -0.3); group.add(sight);
    const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0xff4400, metalness: 0.7 }));
    rocket.rotation.x = Math.PI / 2; rocket.position.set(0, 0.05, -0.55); group.add(rocket);
  }

  group.scale.set(s, s, s);
  group.rotation.y = Math.PI / 2;

  return group;
}

function updateViewWeapon() {
  if (viewModelGroup && viewModelGroup.parent) {
    viewModelGroup.parent.remove(viewModelGroup);
  }
  viewModelGroup = null;
  viewModel = null;

  if (!isFirstPerson) return;

  viewModelGroup = new THREE.Group();
  camera.add(viewModelGroup);

  viewModel = createViewWeapon(currentWeapon.id);
  viewModelGroup.add(viewModel);

  viewModelGroup.position.set(0.35, -0.28, -0.6);
  viewModelGroup.rotation.y = -0.15;
  viewModelGroup.rotation.x = 0.05;
}

function updateViewWeaponAnim(dt) {
  if (!viewModelGroup || !isFirstPerson) return;

  const move = joyActive ? Math.abs(joyDX) + Math.abs(joyDY) : 0;
  const keyMove = (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']) ? 1 : 0;
  const isMoving = move > 0.1 || keyMove > 0;

  if (isMoving) {
    viewBobTimer += dt * 8;
  } else {
    viewBobTimer += dt * 1.5;
  }

  const bobX = Math.sin(viewBobTimer) * (isMoving ? 0.025 : 0.005);
  const bobY = Math.abs(Math.cos(viewBobTimer)) * (isMoving ? 0.02 : 0.003);

  viewRecoil = Math.max(0, viewRecoil - dt * 8);

  const baseX = 0.35;
  const baseY = -0.28;
  const baseZ = -0.6;

  viewModelGroup.position.x = baseX + bobX + (zoomed ? -0.15 : 0);
  viewModelGroup.position.y = baseY + bobY - viewRecoil * 0.05;
  viewModelGroup.position.z = baseZ + viewRecoil * 0.08;

  if (zoomed) {
    viewModelGroup.position.x = 0 + bobX * 0.3;
    viewModelGroup.position.y = -0.15 + bobY * 0.3 - viewRecoil * 0.05;
    viewModelGroup.position.z = -0.5 + viewRecoil * 0.08;
  }

  viewModelGroup.rotation.z = bobX * 2 + viewRecoil * 0.1;
}

// ============ ПОСТРОЕНИЕ ТРАНСПОРТА ============
function rebuildPlayer() {
  while (player.children.length) player.remove(player.children[0]);
  vehicleWheels = [];
  vehicleBody = null;

  const v = currentVehicle;

  if (v.id === 'foot') {
    isFirstPerson = true;
  } else {
    isFirstPerson = false;
    let result;
    if (v.id === 'heli') result = buildHeliMesh(v.size, v.color);
    else if (v.id === 'apache') result = buildApacheMesh(v.size, v.color);
    else if (v.id === 'plane') result = buildPlaneMesh(v.size, v.color);
    else if (v.id === 'jet') result = buildJetMesh(v.size, v.color);
    else result = buildVehicleMesh(v.id, v.size, v.color);
    vehicleBody = result.vehicleBody;
    vehicleWheels = result.wheels;
    player.add(vehicleBody);
  }

  camAngle = yaw;
  camTargetAngle = yaw;
  camHeightSmooth = currentVehicle.camHeight || 2.2;
  updateFlyButtons();
  updateViewWeapon();
}

function updateFlyButtons() {
  const btnUp = document.getElementById('btnFlyUp');
  const btnDown = document.getElementById('btnFlyDown');
  const btnJump = document.getElementById('btnJump');
  const btnRun = document.getElementById('btnRun');
  if (!btnUp || !btnDown) return;

  if (currentVehicle.flying) {
    btnUp.classList.add('show');
    btnDown.classList.add('show');
    if (btnJump) btnJump.style.display = 'none';
    if (btnRun) btnRun.style.display = 'none';
  } else {
    btnUp.classList.remove('show');
    btnDown.classList.remove('show');
    if (btnJump) btnJump.style.display = 'flex';
    if (btnRun) btnRun.style.display = 'flex';
  }
}

// ============ NPC ============
function createNPC(x, z, squadId, role = 'soldier') {
  const group = new THREE.Group();
  const groundH = getTerrainHeight(x, z);
  group.position.set(x, groundH, z);

  const roleColors = {
    soldier: { uniform: 0x4a5a2a, helmet: 0x3a4a1a, vest: 0x2a3a1a },
    officer: { uniform: 0x5a4a2a, helmet: 0x4a3a2a, vest: 0x8a2a2a },
    sniper:  { uniform: 0x3a4a2a, helmet: 0x2a3a1a, vest: 0x1a2a1a }
  };
  const colors = roleColors[role] || roleColors.soldier;

  const uniformMat = new THREE.MeshStandardMaterial({ color: colors.uniform, roughness: 0.85 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: colors.helmet, roughness: 0.7, metalness: 0.3 });
  const vestMat = new THREE.MeshStandardMaterial({ color: colors.vest, roughness: 0.9 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.9 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.85, roughness: 0.2 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.32), uniformMat);
  torso.position.y = 1.05; torso.castShadow = SETTINGS.shadows; group.add(torso);
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.38), vestMat);
  vest.position.y = 1.05; vest.castShadow = SETTINGS.shadows; group.add(vest);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), skinMat);
  head.position.y = 1.62; head.castShadow = SETTINGS.shadows; group.add(head);
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.8), helmetMat
  );
  helmet.position.y = 1.72; helmet.castShadow = SETTINGS.shadows; group.add(helmet);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.25), helmetMat);
  brim.position.set(0, 1.68, -0.14); group.add(brim);

  const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.28), uniformMat);
  shoulderL.position.set(-0.37, 1.35, 0); shoulderL.castShadow = SETTINGS.shadows; group.add(shoulderL);
  const shoulderR = shoulderL.clone(); shoulderR.position.x = 0.37; group.add(shoulderR);

  const upperArmL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.18), uniformMat);
  upperArmL.position.set(-0.37, 1.1, 0); upperArmL.castShadow = SETTINGS.shadows; group.add(upperArmL);
  const upperArmR = upperArmL.clone(); upperArmR.position.x = 0.37; group.add(upperArmR);

  const foreArmL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.15), uniformMat);
  foreArmL.position.set(-0.37, 0.78, -0.02); foreArmL.castShadow = SETTINGS.shadows; group.add(foreArmL);
  const foreArmR = foreArmL.clone(); foreArmR.position.set(0.28, 0.78, -0.15);
  foreArmR.rotation.x = -0.5; group.add(foreArmR);

  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), skinMat);
  handL.position.set(-0.37, 0.58, -0.02); group.add(handL);
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), skinMat);
  handR.position.set(0.28, 0.68, -0.28); group.add(handR);

  const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.22), uniformMat);
  thighL.position.set(-0.15, 0.5, 0); thighL.castShadow = SETTINGS.shadows; group.add(thighL);
  const thighR = thighL.clone(); thighR.position.x = 0.15; group.add(thighR);
  const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.18), uniformMat);
  shinL.position.set(-0.15, 0.12, 0); shinL.castShadow = SETTINGS.shadows; group.add(shinL);
  const shinR = shinL.clone(); shinR.position.x = 0.15; group.add(shinR);
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.28), bootMat);
  bootL.position.set(-0.15, -0.1, -0.03); bootL.castShadow = SETTINGS.shadows; group.add(bootL);
  const bootR = bootL.clone(); bootR.position.x = 0.15; group.add(bootR);

  const gun = new THREE.Group();
  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.5), gunMat);
  gunBody.position.z = -0.2; gun.add(gunBody);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8), gunMat);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.02, -0.5); gun.add(barrel);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.1), gunMat);
  mag.position.set(0, -0.13, -0.15); gun.add(mag);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.2), gunMat);
  stock.position.set(0, -0.01, 0.15); gun.add(stock);
  gun.position.set(0.15, 0.95, -0.3); group.add(gun);

  if (role === 'sniper') {
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9 }));
    scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.1, -0.15); gun.add(scope);
    gun.scale.set(1, 1, 1.3);
  }

  let hp = role === 'sniper' ? 30 : role === 'officer' ? 50 : 40;
  let damage = role === 'sniper' ? 25 : role === 'officer' ? 15 : 10;
  let fireRange = role === 'sniper' ? 80 : 40;
  let fireRate = role === 'sniper' ? 2.0 : 0.5;

  const npc = {
    group, role, hp, maxHp: hp, damage, fireRange, fireRate,
    fireTimer: 1 + Math.random() * 2,
    squadId, state: 'patrol',
    patrolTarget: { x: x + (Math.random()-0.5) * 20, z: z + (Math.random()-0.5) * 20 },
    patrolTimer: 3 + Math.random() * 5,
    alertTimer: 0,
    speed: role === 'sniper' ? 1.5 : 2.5,
    lastPos: { x, z },
    walkCycle: 0,
    hitFlash: 0,
    limbRefs: { thighL, thighR, shinL, shinR, upperArmL, upperArmR }
  };

  scene.add(group);
  npcs.push(npc);
  return npc;
}

function spawnMilitaryBase(x, z) {
  const group = new THREE.Group();
  const groundH = getTerrainHeight(x, z);
  group.position.set(x, groundH, z);

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(14, 14, 0.3, 24),
    new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.95 })
  );
  pad.position.y = 0.15; pad.receiveShadow = SETTINGS.shadows; group.add(pad);

  const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x9a8a5a, roughness: 1 });
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    if (Math.abs(angle - Math.PI/2) < 0.25 || Math.abs(angle - 3*Math.PI/2) < 0.25) continue;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.9), sandbagMat);
    bag.position.set(Math.cos(angle) * 13, 0.5, Math.sin(angle) * 13);
    bag.rotation.y = angle; bag.castShadow = SETTINGS.shadows; group.add(bag);
    const bag2 = bag.clone();
    bag2.position.y = 1.0; bag2.scale.set(0.9, 0.6, 0.9);
    bag2.rotation.y = angle + 0.3; group.add(bag2);
  }

  const towerMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
  for (const [tx, tz] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) {
    const tower = new THREE.Group();
    for (const [lx, lz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 0.2), towerMat);
      leg.position.set(lx, 2.5, lz); tower.add(leg);
    }
    const platform = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), towerMat);
    platform.position.y = 5; tower.add(platform);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.8, 4), towerMat);
    roof.position.y = 6.3; roof.rotation.y = Math.PI/4; tower.add(roof);
    tower.position.set(tx, 0, tz); group.add(tower);
  }

  const hqBase = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 6),
    new THREE.MeshStandardMaterial({ color: 0x556a3a, roughness: 0.9 }));
  hqBase.position.y = 1.5; hqBase.castShadow = SETTINGS.shadows; group.add(hqBase);
  const hqRoof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 1.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x3a4a2a }));
  hqRoof.position.y = 3.8; hqRoof.rotation.y = Math.PI/4; group.add(hqRoof);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222 }));
  antenna.position.set(0, 6, 0); group.add(antenna);
  const blinker = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  blinker.position.y = 8; group.add(blinker);

  scene.add(group);

  const base = { group, x, z, groundH, radius: 14, droneTimer: 15, squadTimer: 20 };
  militaryBases.push(base);

  const guardCount = 6 + Math.floor(Math.random() * 3);
  for (let i = 0; i < guardCount; i++) {
    const angle = (i / guardCount) * Math.PI * 2;
    const r = 6 + Math.random() * 4;
    const npc = createNPC(x + Math.cos(angle) * r, z + Math.sin(angle) * r, `base_${militaryBases.length}`);
    npc.state = 'guard';
    npc.guardPost = { x: npc.group.position.x, z: npc.group.position.z };
  }

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    addObstacle(x + Math.cos(angle) * 13, z + Math.sin(angle) * 13, 1.2);
  }
}

function updateNPCs(dt) {
  let nearEnemies = 0;
  for (let i = npcs.length - 1; i >= 0; i--) {
    const npc = npcs[i];
    const g = npc.group;
    if (npc.hp <= 0) { scene.remove(g); npcs.splice(i, 1); continue; }

    if (npc.hitFlash > 0) {
      npc.hitFlash -= dt;
      g.traverse(child => {
        if (child.isMesh && child.material && child.material.emissive) {
          if (!child._origEmissive) child._origEmissive = child.material.emissive.clone();
          child.material.emissive.setHex(0xff0000);
          child.material.emissiveIntensity = 0.6;
        }
      });
    } else {
      g.traverse(child => {
        if (child.isMesh && child._origEmissive && child.material) {
          child.material.emissive.copy(child._origEmissive);
          child.material.emissiveIntensity = 0;
        }
      });
    }

    const distToPlayer = g.position.distanceTo(player.position);
    if (distToPlayer < 40) nearEnemies++;

    npc.fireTimer -= dt;
    npc.patrolTimer -= dt;
    if (npc.alertTimer > 0) npc.alertTimer -= dt;

    const canSeePlayer = distToPlayer < npc.fireRange;
    if (canSeePlayer) {
      npc.state = 'attack';
      npc.alertTimer = 5;
      const dx = player.position.x - g.position.x;
      const dz = player.position.z - g.position.z;
      g.rotation.y += (Math.atan2(dx, dz) - g.rotation.y) * Math.min(1, dt * 5);
      if (npc.fireTimer <= 0) { npc.fireTimer = npc.fireRate; npcShoot(npc); }
      if (distToPlayer > npc.fireRange * 0.6) {
        g.position.x += (dx / distToPlayer) * npc.speed * dt;
        g.position.z += (dz / distToPlayer) * npc.speed * dt;
      } else if (distToPlayer < npc.fireRange * 0.3) {
        g.position.x -= (dx / distToPlayer) * npc.speed * 0.5 * dt;
        g.position.z -= (dz / distToPlayer) * npc.speed * 0.5 * dt;
      }
    } else if (npc.state === 'attack' && npc.alertTimer <= 0) {
      npc.state = 'patrol';
      npc.patrolTimer = 2 + Math.random() * 3;
    } else if (npc.state === 'guard') {
      if (npc.guardPost) {
        const dx = npc.guardPost.x - g.position.x;
        const dz = npc.guardPost.z - g.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 1) {
          g.position.x += (dx / d) * npc.speed * dt;
          g.position.z += (dz / d) * npc.speed * dt;
        }
      }
      g.rotation.y += dt * 0.3;
    } else {
      if (npc.patrolTimer <= 0) {
        npc.patrolTimer = 3 + Math.random() * 5;
        const angle = Math.random() * Math.PI * 2;
        const r = 5 + Math.random() * 15;
        npc.patrolTarget = { x: g.position.x + Math.cos(angle) * r, z: g.position.z + Math.sin(angle) * r };
      }
      const dx = npc.patrolTarget.x - g.position.x;
      const dz = npc.patrolTarget.z - g.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.5) {
        g.position.x += (dx / d) * npc.speed * dt;
        g.position.z += (dz / d) * npc.speed * dt;
        g.rotation.y = Math.atan2(dx, dz);
      }
    }

    const moved = Math.hypot(g.position.x - npc.lastPos.x, g.position.z - npc.lastPos.z);
    npc.lastPos.x = g.position.x;
    npc.lastPos.z = g.position.z;
    const isMoving = moved > 0.01;
    if (isMoving) npc.walkCycle += dt * 8;
    else npc.walkCycle *= 0.9;

    const limbs = npc.limbRefs;
    if (limbs) {
      const swing = Math.sin(npc.walkCycle) * 0.4;
      if (limbs.thighL) limbs.thighL.rotation.x = swing;
      if (limbs.thighR) limbs.thighR.rotation.x = -swing;
      if (limbs.shinL) limbs.shinL.position.z = swing * 0.1;
      if (limbs.shinR) limbs.shinR.position.z = -swing * 0.1;
      if (limbs.upperArmL) limbs.upperArmL.rotation.x = -swing * 0.5;
      if (limbs.upperArmR) limbs.upperArmR.rotation.x = swing * 0.5;
    }

    g.position.y = getTerrainHeight(g.position.x, g.position.z);

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const npcCenter = g.position.clone(); npcCenter.y += 1.0;
      const vel = b.userData.velocity.clone().normalize();
      const bulletPrev = b.position.clone().sub(vel.multiplyScalar(2.5));
      const seg = b.position.clone().sub(bulletPrev);
      const segLenSq = seg.lengthSq();
      let t = 0;
      if (segLenSq > 0.001) {
        t = Math.max(0, Math.min(1, bulletPrev.clone().sub(npcCenter).negate().dot(seg) / segLenSq));
      }
      const closest = bulletPrev.clone().addScaledVector(seg, t);
      if (closest.distanceTo(npcCenter) < 0.9) {
        scene.remove(b);
        bullets.splice(j, 1);
        npc.hp -= b.userData.damage || 1;
        npc.hitFlash = 0.15;
        sndHit();
        if (npc.hp <= 0) {
          scene.remove(g);
          npcs.splice(i, 1);
          money += 200;
          score++;
          document.getElementById('score').textContent = score;
          updateMoneyUI();
          sndKill();
        }
        break;
      }
    }
  }
  const enemyEl = document.getElementById('enemyCount');
  if (enemyEl) enemyEl.textContent = nearEnemies;

  for (const base of militaryBases) {
    base.droneTimer -= dt;
    base.squadTimer -= dt;

    if (base.squadTimer <= 0) {
      base.squadTimer = 30 + Math.random() * 30;
      const squadSize = 3 + Math.floor(Math.random() * 3);
      const angle = Math.random() * Math.PI * 2;
      for (let i = 0; i < squadSize; i++) {
        const a = angle + (i / squadSize) * 0.8;
        const r = 15 + Math.random() * 5;
        const nx = base.x + Math.cos(a) * r;
        const nz = base.z + Math.sin(a) * r;
        createNPC(nx, nz, `squad_${Math.random()}`);
      }
    }

    const distToBase = Math.hypot(base.x - player.position.x, base.z - player.position.z);
    if (distToBase < 60 && base.droneTimer <= 0) {
      base.droneTimer = 20 + Math.random() * 15;
      const droneX = base.x + (Math.random() - 0.5) * 10;
      const droneZ = base.z + (Math.random() - 0.5) * 10;
      const drone = createDrone(droneX, droneZ);
      drone.active = true;
      scene.add(drone.group);
      allDrones.push(drone);
    }
  }
}

function npcShoot(npc) {
  const origin = npc.group.position.clone();
  origin.y += 1.2;
  const target = player.position.clone();
  target.y += 1.0;
  const dir = target.clone().sub(origin).normalize();
  const spread = npc.role === 'sniper' ? 0.005 : 0.05;
  dir.x += (Math.random() - 0.5) * spread;
  dir.y += (Math.random() - 0.5) * spread;
  dir.z += (Math.random() - 0.5) * spread;
  dir.normalize();

  const bullet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.6, 4),
    new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.9 })
  );
  bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  bullet.position.copy(origin).addScaledVector(dir, 0.8);
  bullet.userData = { velocity: dir.multiplyScalar(100), life: 1.5, damage: npc.damage };
  npcBullets.push(bullet);
  scene.add(bullet);
  noise(0.08, 0.25, 2000, 400);
  tone(400, 'square', 0.05, 0.1, 100);
}

function updateNpcBullets(dt) {
  for (let i = npcBullets.length - 1; i >= 0; i--) {
    const b = npcBullets[i];
    b.position.addScaledVector(b.userData.velocity, dt);
    b.userData.life -= dt;
    const playerCenter = player.position.clone().add(new THREE.Vector3(0, 1, 0));
    if (b.position.distanceTo(playerCenter) < 0.7) {
      damagePlayer(b.userData.damage);
      scene.remove(b);
      npcBullets.splice(i, 1);
      continue;
    }
    const groundH = getTerrainHeight(b.position.x, b.position.z);
    if (b.position.y <= groundH || b.userData.life <= 0) {
      scene.remove(b);
      npcBullets.splice(i, 1);
    }
  }
}

// ============ ДРОНЫ ============
function createDrone(x, z) {
  const group = new THREE.Group();
  const groundH = getTerrainHeight(x, z);
  group.position.set(x, groundH + 12 + Math.random() * 3, z);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.35, 1.3),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.5 })
  );
  body.castShadow = SETTINGS.shadows; group.add(body);

  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x555555, transparent: true, opacity: 0.55 });
  const armMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 });

  const rotors = [];
  for (const [rx,ry,rz] of [[-0.7,0.2,-0.7],[0.7,0.2,-0.7],[-0.7,0.2,0.7],[0.7,0.2,0.7]]) {
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 12), rotorMat);
    rotor.position.set(rx, ry + 0.1, rz); group.add(rotor); rotors.push(rotor);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.3), armMat);
    arm.position.set(rx/2, 0.1, rz/2); arm.rotation.y = Math.atan2(rx, rz); group.add(arm);
  }

  const light = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  light.position.y = -0.25; group.add(light);

  return {
    group, rotors, hp: 5,
    homeX: x, homeZ: z,
    bob: Math.random() * Math.PI * 2,
    active: false,
    bombTimer: 3 + Math.random() * 3,
    patrolAngle: Math.random() * Math.PI * 2,
    patrolRadius: 8 + Math.random() * 6,
    stunnedUntil: 0
  };
}

function killDrone(d) {
  const idx = allDrones.indexOf(d);
  if (idx >= 0) {
    if (d.group.parent) d.group.parent.remove(d.group);
    allDrones.splice(idx, 1);
    score++;
    money += 100;
    document.getElementById('score').textContent = score;
    updateMoneyUI();
    sndKill(); sndCoin();
  }
}

// ============ ДРОНЫ-СОЮЗНИКИ ============
function createAllyDrone(droneType) {
  const def = ALLY_DRONES[droneType];
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.9),
    new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.6, emissive: def.color, emissiveIntensity: 0.3 }));
  body.castShadow = SETTINGS.shadows; group.add(body);

  const rotorMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.6 });
  const rotors = [];
  for (const [rx,ry,rz] of [[-0.5,0.15,-0.5],[0.5,0.15,-0.5],[-0.5,0.15,0.5],[0.5,0.15,0.5]]) {
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 10), rotorMat);
    rotor.position.set(rx, ry, rz); group.add(rotor); rotors.push(rotor);
  }
  return { group, rotors, type: droneType, def, hp: def.hp, maxHp: def.hp, fireTimer: 0, bob: Math.random()*Math.PI*2, orbit: Math.random()*Math.PI*2 };
}

function spawnAllyDrone(droneType) {
  const d = createAllyDrone(droneType);
  const angle = Math.random() * Math.PI * 2;
  const r = 5 + Math.random() * 3;
  d.group.position.set(player.position.x + Math.cos(angle) * r, player.position.y + 4, player.position.z + Math.sin(angle) * r);
  scene.add(d.group);
  allyDrones.push(d);
}

function updateAllyDrones(dt) {
  for (let i = allyDrones.length - 1; i >= 0; i--) {
    const d = allyDrones[i];
    d.bob += dt * 3; d.orbit += dt * 0.8;
    d.rotors.forEach(r => r.rotation.y += dt * 50);
    if (d.hp <= 0) { scene.remove(d.group); allyDrones.splice(i, 1); continue; }

    let target = null, minDist = d.def.range;
    for (const enemy of allDrones) {
      if (!enemy.active) continue;
      const dist = enemy.group.position.distanceTo(player.position);
      if (dist < minDist) { minDist = dist; target = enemy; }
    }

    if (d.type === 'kamikaze') {
      if (target) {
        const dir = target.group.position.clone().sub(d.group.position).normalize();
        d.group.position.addScaledVector(dir, d.def.speed * dt);
        if (d.group.position.distanceTo(target.group.position) < 1.5) {
          soundExplosion(0.5, 0.6);
          target.hp -= d.def.damage;
          if (target.hp <= 0) killDrone(target);
          scene.remove(d.group);
          allyDrones.splice(i, 1);
          continue;
        }
      } else {
        const ox = player.position.x + Math.cos(d.orbit) * 5;
        const oz = player.position.z + Math.sin(d.orbit) * 5;
        d.group.position.x += (ox - d.group.position.x) * dt * 2;
        d.group.position.z += (oz - d.group.position.z) * dt * 2;
        d.group.position.y = player.position.y + 4 + Math.sin(d.bob) * 0.3;
      }
    } else {
      const ox = player.position.x + Math.cos(d.orbit) * (d.def.range * 0.4);
      const oz = player.position.z + Math.sin(d.orbit) * (d.def.range * 0.4);
      d.group.position.x += (ox - d.group.position.x) * dt * 2;
      d.group.position.z += (oz - d.group.position.z) * dt * 2;
      d.group.position.y = player.position.y + 5 + Math.sin(d.bob) * 0.5;
      if (target) {
        d.fireTimer -= dt;
        if (d.fireTimer <= 0) {
          d.fireTimer = d.def.fireRate;
          allyDroneShoot(d, target);
        }
      }
    }
  }
}

function allyDroneShoot(allyDrone, target) {
  const origin = allyDrone.group.position.clone();
  const dir = target.group.position.clone().sub(origin).normalize();
  const tracer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.0, 4),
    new THREE.MeshBasicMaterial({ color: allyDrone.def.color, transparent: true, opacity: 0.9 })
  );
  tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  tracer.position.copy(origin).addScaledVector(dir, 0.5);
  tracer.userData = { velocity: dir.multiplyScalar(120), life: 1.2, damage: allyDrone.def.damage };
  bullets.push(tracer); scene.add(tracer);
  noise(0.06, 0.2, 2500, 500);
}

// ============ ВВОД ПК ============
function setupInput() {
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyR') startReload();
    if (e.code === 'KeyB' && gameActive && !paused) openShop();
    if (e.code === 'KeyI' && gameActive && !paused) openInventory();
    if (e.code === 'KeyE') tryPickupLoot();
    if (e.code === 'KeyG' && selectedRocket) fireRocket();
    if (e.code === 'Escape' && gameActive) togglePause();
  });
  document.addEventListener('keyup', e => keys[e.code] = false);

  document.addEventListener('mousemove', e => {
    if (!gameActive || isTouch || paused) return;
    const sens = zoomed ? 0.001 : 0.002;
    yaw -= e.movementX * sens;
    pitch -= e.movementY * sens;
    pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, pitch));
    lastInputTime = performance.now() / 1000;
  });
  document.addEventListener('mousedown', e => {
    if (!gameActive || isTouch || paused) return;
    if (e.button === 0) shoot();
    if (e.button === 2) zoomed = true;
  });
  document.addEventListener('mouseup', e => { if (e.button === 2) zoomed = false; });
  document.addEventListener('contextmenu', e => e.preventDefault());
}

// ============ ВВОД ТАЧ ============
function setupMobileControls() {
  if (!isTouch) return;
  document.getElementById('mobileControls').classList.add('active');

  const joyEl = document.getElementById('joystick');
  const stickEl = document.getElementById('stick');
  const lookEl = document.getElementById('lookZone');
  const btnFire = document.getElementById('btnFire');
  const btnJump = document.getElementById('btnJump');
  const btnRun = document.getElementById('btnRun');
  const btnReload = document.getElementById('btnReload');
  const btnUse = document.getElementById('btnUse');
  const btnRocket = document.getElementById('btnRocket');
  const btnFlyUp = document.getElementById('btnFlyUp');
  const btnFlyDown = document.getElementById('btnFlyDown');

  const JOY_RADIUS = 45;

  joyEl.addEventListener('touchstart', e => {
    if (paused) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    joyId = t.identifier; joyActive = true;
    updateJoy(t);
  }, { passive: false });
  joyEl.addEventListener('touchmove', e => {
    if (paused) return;
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === joyId) updateJoy(t);
  }, { passive: false });
  const endJoy = e => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        joyActive = false; joyId = null; joyDX = joyDY = 0;
        stickEl.style.transform = 'translate(0,0)';
      }
    }
  };
  joyEl.addEventListener('touchend', endJoy);
  joyEl.addEventListener('touchcancel', endJoy);

  function updateJoy(touch) {
    const rect = joyEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = touch.clientX - cx, dy = touch.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > JOY_RADIUS) { dx = dx/dist*JOY_RADIUS; dy = dy/dist*JOY_RADIUS; }
    joyDX = dx / JOY_RADIUS; joyDY = dy / JOY_RADIUS;
    stickEl.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  lookEl.addEventListener('touchstart', e => {
    if (paused) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    lookId = t.identifier;
    lookLastX = t.clientX; lookLastY = t.clientY;
  }, { passive: false });
  lookEl.addEventListener('touchmove', e => {
    if (paused) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === lookId) {
        const dx = t.clientX - lookLastX;
        const dy = t.clientY - lookLastY;
        lookLastX = t.clientX; lookLastY = t.clientY;
        const sens = zoomed ? 0.0025 : 0.005;
        yaw -= dx * sens;
        pitch -= dy * sens;
        pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, pitch));
        lastInputTime = performance.now() / 1000;
      }
    }
  }, { passive: false });
  const endLook = e => {
    for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null;
  };
  lookEl.addEventListener('touchend', endLook);
  lookEl.addEventListener('touchcancel', endLook);

  bindHold(btnFire, () => { if (!paused) touchFire = true; }, () => touchFire = false);
  bindHold(btnJump, () => { if (!paused) { touchJump = true; sndJump(); } }, () => touchJump = false);
  bindHold(btnRun, () => { if (!paused) { touchRun = true; btnRun.classList.add('on'); } },
                   () => { touchRun = false; btnRun.classList.remove('on'); });
  bindHold(btnFlyUp, () => { if (!paused) { touchFlyUp = true; btnFlyUp.classList.add('on'); } },
                     () => { touchFlyUp = false; btnFlyUp.classList.remove('on'); });
  bindHold(btnFlyDown, () => { if (!paused) { touchFlyDown = true; btnFlyDown.classList.add('on'); } },
                       () => { touchFlyDown = false; btnFlyDown.classList.remove('on'); });

  btnReload.addEventListener('touchstart', e => {
    if (paused) return;
    e.preventDefault(); e.stopPropagation(); startReload();
  }, { passive: false });
  btnUse.addEventListener('touchstart', e => {
    if (paused) return;
    e.preventDefault(); e.stopPropagation(); tryPickupLoot();
  }, { passive: false });
  btnRocket.addEventListener('touchstart', e => {
    if (paused) return;
    e.preventDefault(); e.stopPropagation();
    if (selectedRocket) fireRocket();
    else showHint('Купи ракету в магазине!');
  }, { passive: false });
}

function bindHold(el, onDown, onUp) {
  el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); onDown(); }, { passive: false });
  el.addEventListener('touchend', e => { e.preventDefault(); e.stopPropagation(); onUp(); }, { passive: false });
  el.addEventListener('touchcancel', () => onUp());
}

// ============ ПАУЗА ============
function togglePause() {
  if (!gameActive) return;
  const pauseModal = document.getElementById('pauseModal');

  if (paused) {
    // Возобновить
    pauseModal.classList.remove('show');
    paused = false;
    if (!isTouch && gameActive) renderer.domElement.requestPointerLock();
  } else {
    // Пауза
    sndMenuClick();
    paused = true;
    pauseModal.classList.add('show');
    document.exitPointerLock?.();
  }
}

// ============ ЛУТ ============
function tryPickupLoot() {
  if (!nearestLoot || nearestLoot.userData.taken) return;
  const loot = nearestLoot;
  loot.userData.taken = true;
  if (loot.userData.type === 'money') {
    money += loot.userData.value;
    updateMoneyUI();
    showHint(`+${loot.userData.value} $`);
    sndCoin();
  } else if (loot.userData.type === 'weapon') {
    const weaponId = loot.userData.weapon;
    if (weaponId && !ownedWeapons.has(weaponId)) {
      ownedWeapons.add(weaponId);
      showHint(`🔫 Найдено: ${WEAPONS[weaponId].name}`);
      sndLoot();
      updateHUDNames();
    } else {
      money += 200; updateMoneyUI();
      showHint(`+200 $ (дубликат)`); sndCoin();
    }
  }
  if (loot.parent) loot.parent.remove(loot);
  nearestLoot = null;
  document.getElementById('btnUse').classList.remove('show');
}

let hintTimeout = null;
function showHint(text) {
  const el = document.getElementById('hint');
  el.textContent = text;
  el.style.display = 'block';
  clearTimeout(hintTimeout);
  hintTimeout = setTimeout(() => { el.style.display = 'none'; }, 2000);
}

function updateNearestLoot() {
  let closest = null, minDist = 3;
  for (const b of worldState.buildings) {
    for (const loot of b.lootSpots) {
      if (loot.userData.taken || !loot.parent) continue;
      const wp = new THREE.Vector3();
      loot.getWorldPosition(wp);
      const d = Math.hypot(wp.x - player.position.x, wp.z - player.position.z);
      if (d < minDist) { minDist = d; closest = loot; }
    }
  }
  nearestLoot = closest;
  const btn = document.getElementById('btnUse');
  if (closest) { btn.classList.add('show'); if (!isTouch) showHint('Нажми E чтобы взять'); }
  else btn.classList.remove('show');
}

// ============ МАГАЗИН ============
let shopTab = 'weapons';
let invTab = 'weapons';

function openShop() { if (paused) return; sndMenuClick(); document.getElementById('shop').classList.add('open'); document.exitPointerLock?.(); renderShop(); }
function closeShop() { sndMenuClick(); document.getElementById('shop').classList.remove('open'); if (!isTouch && gameActive) renderer.domElement.requestPointerLock(); }
function openInventory() { if (paused) return; sndMenuClick(); document.getElementById('inventory').classList.add('open'); document.exitPointerLock?.(); renderInventory(); }
function closeInventory() { sndMenuClick(); document.getElementById('inventory').classList.remove('open'); if (!isTouch && gameActive) renderer.domElement.requestPointerLock(); }

function switchTab(tab, e) {
  sndMenuClick(); shopTab = tab;
  document.querySelectorAll('#shop .tab').forEach(t => t.classList.remove('active'));
  if (e && e.target) e.target.classList.add('active');
  renderShop();
}
function switchInvTab(tab, e) {
  sndMenuClick(); invTab = tab;
  document.querySelectorAll('#inventory .inv-tab').forEach(t => t.classList.remove('active'));
  if (e && e.target) e.target.classList.add('active');
  renderInventory();
}

function renderShop() {
  document.getElementById('shopMoney').textContent = money;
  const el = document.getElementById('shopItems');
  el.innerHTML = '';
  if (shopTab === 'weapons') renderWeaponsShop(el);
  else if (shopTab === 'vehicles') renderVehiclesShop(el);
  else if (shopTab === 'drones') renderDronesShop(el);
  else if (shopTab === 'rockets') renderRocketsShop(el);
}

function renderWeaponsShop(el) {
  for (const id in WEAPONS) {
    const w = WEAPONS[id];
    const owned = ownedWeapons.has(id);
    const equipped = currentWeapon.id === id;
    const canBuy = money >= w.price;
    const div = document.createElement('div');
    div.className = 'item' + (owned ? ' owned' : '');
    let statsHtml;
    if (w.type === 'rocket' || w.type === 'grenade') statsHtml = `Урон: ${w.blastDamage} (взрыв)<br>Радиус: ${w.blastRadius} м<br>`;
    else if (w.type === 'flame') statsHtml = `Урон/сек<br>Дальность: ${w.range} м<br>`;
    else if (w.type === 'laser') statsHtml = `Урон: ${w.damage} (лазер)<br>`;
    else statsHtml = `Урон: ${w.damage}<br>`;
    div.innerHTML = `
      <h3>${w.name} ${equipped ? '✅' : ''}</h3>
      <div class="stats">${statsHtml}Скорострельность: ${w.fireRate > 0 ? (1/w.fireRate).toFixed(1) + '/с' : '—'}<br>Магазин: ${w.mag}</div>
      <div class="price">${w.price === 0 ? 'БЕСПЛАТНО' : w.price + ' $'}</div>
      <button ${(owned && equipped) || (!owned && !canBuy) ? 'disabled' : ''}>
        ${owned ? (equipped ? 'В РУКАХ' : 'ВЗЯТЬ') : (canBuy ? 'КУПИТЬ' : 'НЕ ХВАТАЕТ')}
      </button>`;
    const btn = div.querySelector('button');
    if (owned && !equipped) btn.onclick = () => { equipWeapon(id); renderShop(); };
    if (!owned && canBuy) btn.onclick = () => { buyWeapon(id); renderShop(); };
    el.appendChild(div);
  }
}

function renderVehiclesShop(el) {
  for (const id in VEHICLES) {
    const v = VEHICLES[id];
    const owned = ownedVehicles.has(id);
    const equipped = currentVehicle.id === id;
    const canBuy = money >= v.price;
    const div = document.createElement('div');
    div.className = 'item' + (owned ? ' owned' : '');
    const flyIcon = v.flying ? '✈ ' : '';
    div.innerHTML = `
      <h3>${flyIcon}${v.name} ${equipped ? '✅' : ''}</h3>
      <div class="stats">${v.flying ? '🛩 ЛЕТАЮЩИЙ<br>' : ''}Скорость: ×${v.speed}<br>Доп. HP: +${v.hpBonus}<br>${v.autoFire > 0 ? 'Автопушка<br>' : ''}${v.bombResist > 0 ? `Защита: ${(v.bombResist*100).toFixed(0)}%<br>` : ''}</div>
      <div class="price">${v.price === 0 ? 'БЕСПЛАТНО' : v.price + ' $'}</div>
      <button ${(owned && equipped) || (!owned && !canBuy) ? 'disabled' : ''}>
        ${owned ? (equipped ? 'В РУКАХ' : 'СЕСТЬ') : (canBuy ? 'КУПИТЬ' : 'НЕ ХВАТАЕТ')}
      </button>`;
    const btn = div.querySelector('button');
    if (owned && !equipped) btn.onclick = () => { equipVehicle(id); renderShop(); };
    if (!owned && canBuy) btn.onclick = () => { buyVehicle(id); renderShop(); };
    el.appendChild(div);
  }
}

function renderDronesShop(el) {
  for (const id in ALLY_DRONES) {
    const d = ALLY_DRONES[id];
    const owned = ownedAllyDrones.has(id);
    const canBuy = money >= d.price;
    const div = document.createElement('div');
    div.className = 'item' + (owned ? ' owned' : '');
    div.innerHTML = `
      <h3>${d.name} ${owned ? '✅' : ''}</h3>
      <div class="stats">${d.desc}<br>Урон: ${d.damage}<br>HP: ${d.hp}<br>Дальность: ${d.range} м</div>
      <div class="price">${d.price} $</div>
      <button ${!canBuy ? 'disabled' : ''}>${canBuy ? 'КУПИТЬ' : 'НЕ ХВАТАЕТ'}</button>`;
    const btn = div.querySelector('button');
    if (canBuy) btn.onclick = () => { buyAllyDrone(id); renderShop(); };
    el.appendChild(div);
  }
}

function renderRocketsShop(el) {
  for (const id in ROCKETS) {
    const r = ROCKETS[id];
    const owned = ownedRockets.has(id);
    const canBuy = money >= r.price;
    const div = document.createElement('div');
    div.className = 'item' + (owned ? ' owned' : '');
    div.innerHTML = `
      <h3>${r.name} ${owned ? '✅' : ''}</h3>
      <div class="stats">${r.desc}<br>${r.damage > 0 ? `Урон: ${r.damage}<br>` : ''}Радиус: ${r.blastRadius} м</div>
      <div class="price">${r.price} $</div>
      <button ${owned || !canBuy ? 'disabled' : ''}>${owned ? 'КУПЛЕНА' : (canBuy ? 'КУПИТЬ' : 'НЕ ХВАТАЕТ')}</button>`;
    const btn = div.querySelector('button');
    if (!owned && canBuy) btn.onclick = () => { buyRocket(id); renderShop(); };
    el.appendChild(div);
  }
}

function renderInventory() {
  const el = document.getElementById('inventoryItems');
  el.innerHTML = '';
  if (invTab === 'weapons') {
    const owned = Object.keys(WEAPONS).filter(id => ownedWeapons.has(id));
    if (owned.length === 0) { el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#888">Пусто.</div>'; return; }
    for (const id of owned) {
      const w = WEAPONS[id];
      const equipped = currentWeapon.id === id;
      const div = document.createElement('div');
      div.className = 'item owned' + (equipped ? ' equipped' : '');
      div.innerHTML = `<h3>${w.name} ${equipped ? '⚡' : ''}</h3><div class="stats">Урон: ${w.damage || w.blastDamage}</div><button ${equipped ? 'disabled' : ''}>${equipped ? 'В РУКАХ' : 'ВЗЯТЬ'}</button>`;
      const btn = div.querySelector('button');
      if (!equipped) btn.onclick = () => { equipWeapon(id); renderInventory(); };
      el.appendChild(div);
    }
  } else if (invTab === 'rockets') {
    const owned = Object.keys(ROCKETS).filter(id => ownedRockets.has(id));
    if (owned.length === 0) { el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#888">Нет ракет.</div>'; return; }
    for (const id of owned) {
      const r = ROCKETS[id];
      const equipped = selectedRocket === id;
      const div = document.createElement('div');
      div.className = 'item owned' + (equipped ? ' equipped' : '');
      div.innerHTML = `<h3>${r.name} ${equipped ? '⚡ УСТАНОВЛЕНА' : ''}</h3><div class="stats">${r.desc}</div><button ${equipped ? 'disabled' : ''}>${equipped ? 'ГОТОВА' : 'УСТАНОВИТЬ'}</button>`;
      const btn = div.querySelector('button');
      if (!equipped) btn.onclick = () => { selectRocket(id); renderInventory(); };
      el.appendChild(div);
    }
  }
}

function selectRocket(id) {
  selectedRocket = id;
  sndBuy();
  showHint(`🚀 ${ROCKETS[id].name} установлена`);
  document.getElementById('btnRocket').classList.add('show');
}

function buyWeapon(id) { const w = WEAPONS[id]; if (money < w.price) return; money -= w.price; ownedWeapons.add(id); equipWeapon(id); sndBuy(); updateMoneyUI(); }
function equipWeapon(id) {
  currentWeapon = WEAPONS[id];
  ammo = currentWeapon.mag;
  reloading = false;
  updateAmmoUI();
  updateHUDNames();
  updateViewWeapon();
}
function buyVehicle(id) { const v = VEHICLES[id]; if (money < v.price) return; money -= v.price; ownedVehicles.add(id); equipVehicle(id); sndBuy(); updateMoneyUI(); }
function equipVehicle(id) {
  currentVehicle = VEHICLES[id]; rebuildPlayer();
  const oldMax = maxHealth;
  maxHealth = 100 + currentHero.hpBonus + currentVehicle.hpBonus;
  health = Math.min(maxHealth, health + (maxHealth - oldMax));
  updateHpUI(); updateHUDNames(); sndVehicle();
}
function buyAllyDrone(id) { const d = ALLY_DRONES[id]; if (money < d.price) return; money -= d.price; ownedAllyDrones.add(id); spawnAllyDrone(id); sndBuy(); updateMoneyUI(); }
function buyRocket(id) { const r = ROCKETS[id]; if (money < r.price) return; money -= r.price; ownedRockets.add(id); selectRocket(id); sndBuy(); updateMoneyUI(); }
function updateMoneyUI() { document.getElementById('money').textContent = money; document.getElementById('shopMoney').textContent = money; }
function updateHUDNames() {
  document.getElementById('weaponName').textContent = currentWeapon.name;
  document.getElementById('vehicleName').textContent = currentVehicle.name;
  document.getElementById('heroName').textContent = currentHero.name;
}

// ============ ПЕРЕЗАРЯДКА ============
function startReload() {
  if (reloading || ammo === currentWeapon.mag || !gameActive) return;
  reloading = true;
  reloadTimer = currentWeapon.id === 'minigun' ? 3 : 1.5;
  document.getElementById('reloading').style.display = 'block';
  sndReload();
}
function updateReload(dt) {
  if (!reloading) return;
  reloadTimer -= dt;
  if (reloadTimer <= 0) { reloading = false; ammo = currentWeapon.mag; document.getElementById('reloading').style.display = 'none'; updateAmmoUI(); }
}
function updateAmmoUI() {
  document.getElementById('ammoCur').textContent = ammo;
  document.getElementById('ammoMax').textContent = currentWeapon.mag;
  document.getElementById('ammo').classList.toggle('low', ammo <= Math.ceil(currentWeapon.mag * 0.15));
}

// ============ СТРЕЛЬБА ============
function shoot() {
  if (fireCooldown > 0 || reloading) return;
  if (ammo <= 0) { startReload(); return; }
  fireCooldown = currentWeapon.fireRate;
  viewRecoil = 1.0;
  ammo--;
  updateAmmoUI();
  sndWeaponShoot(currentWeapon.id);

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const dmgMult = currentHero.damageMult;

  if (currentWeapon.type === 'rocket') spawnRocketProjectile(dir, currentWeapon.blastRadius, currentWeapon.blastDamage * dmgMult);
  else if (currentWeapon.type === 'grenade') spawnGrenade(dir, currentWeapon.blastRadius, currentWeapon.blastDamage * dmgMult);
  else if (currentWeapon.type === 'flame') spawnFlame(dir);
  else if (currentWeapon.type === 'laser') spawnLaser(dir, currentWeapon.damage * dmgMult, currentWeapon.range);
  else {
    for (let p = 0; p < currentWeapon.pellets; p++) {
      const d = dir.clone();
      if (currentWeapon.spread > 0) {
        d.x += (Math.random() - 0.5) * currentWeapon.spread;
        d.y += (Math.random() - 0.5) * currentWeapon.spread;
        d.z += (Math.random() - 0.5) * currentWeapon.spread;
        d.normalize();
      }
      const tracer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.30, 0.30, 1.2, 4),
        new THREE.MeshBasicMaterial({ color: currentWeapon.color, transparent: true, opacity: 0.95, depthWrite: false })
      );
      tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
      tracer.position.copy(camera.position).addScaledVector(d, 2.5);
      tracer.userData = { velocity: d.multiplyScalar(100), life: currentWeapon.range / 100, damage: currentWeapon.damage * dmgMult };
      bullets.push(tracer);
      scene.add(tracer);
    }
  }
  if (ammo <= 0) startReload();
}

function spawnGrenade(dir, radius, damage) {
  const g = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x00aa00, metalness: 0.7, emissive: 0x00ff00, emissiveIntensity: 0.4 }));
  g.position.copy(camera.position).addScaledVector(dir, 1.5);
  g.userData = { velocity: dir.clone().multiplyScalar(25).add(new THREE.Vector3(0, 5, 0)), life: 3, radius, damage };
  grenades.push(g); scene.add(g);
}
function updateGrenades(dt) {
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i]; const ud = g.userData;
    ud.velocity.y += GRAVITY * dt;
    g.position.addScaledVector(ud.velocity, dt);
    ud.life -= dt;
    const groundH = getTerrainHeight(g.position.x, g.position.z);
    if (g.position.y <= groundH + 0.3 || ud.life <= 0) {
      explodeGrenade(g.position.clone(), ud.radius, ud.damage);
      scene.remove(g); grenades.splice(i, 1);
    }
  }
}
function explodeGrenade(pos, radius, damage) {
  soundExplosion(0.6, 0.8);
  const flash = new THREE.PointLight(0x88ff00, 12, radius * 2);
  flash.position.copy(pos); scene.add(flash);
  setTimeout(() => scene.remove(flash), 150);
  for (let i = allDrones.length - 1; i >= 0; i--) {
    const d = allDrones[i];
    if (d.group.position.distanceTo(pos) < radius) { d.hp -= damage * (1 - d.group.position.distanceTo(pos)/radius); if (d.hp <= 0) killDrone(d); }
  }
  for (let i = npcs.length - 1; i >= 0; i--) {
    const n = npcs[i];
    if (n.group.position.distanceTo(pos) < radius) { n.hp -= damage; if (n.hp <= 0) { scene.remove(n.group); npcs.splice(i, 1); money += 200; score++; updateMoneyUI(); } }
  }
  const pd = pos.distanceTo(player.position);
  if (pd < radius) damagePlayer(damage * 0.4 * (1 - pd/radius));
}

function spawnFlame(dir) {
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random()*0.2, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.85 }));
  flame.position.copy(camera.position).addScaledVector(dir, 1.5);
  flame.userData = { velocity: dir.clone().multiplyScalar(15 + Math.random()*5), life: 0.8, damage: currentWeapon.damage * currentHero.damageMult };
  flames.push(flame); scene.add(flame);
}
function updateFlames(dt) {
  for (let i = flames.length - 1; i >= 0; i--) {
    const f = flames[i]; const ud = f.userData;
    f.position.addScaledVector(ud.velocity, dt);
    ud.velocity.y += 2 * dt;
    ud.life -= dt;
    f.material.opacity = 0.85 * (ud.life / 0.8);
    f.scale.setScalar(1 + (0.8 - ud.life) * 0.5);
    for (let j = allDrones.length - 1; j >= 0; j--) {
      const d = allDrones[j];
      if (f.position.distanceTo(d.group.position) < 1.2) { d.hp -= ud.damage; if (d.hp <= 0) killDrone(d); }
    }
    for (let j = npcs.length - 1; j >= 0; j--) {
      const n = npcs[j];
      const nc = n.group.position.clone(); nc.y += 1;
      if (f.position.distanceTo(nc) < 1.0) { n.hp -= ud.damage; n.hitFlash = 0.15; if (n.hp <= 0) { scene.remove(n.group); npcs.splice(j, 1); money += 200; score++; updateMoneyUI(); } }
    }
    if (ud.life <= 0) { scene.remove(f); flames.splice(i, 1); }
  }
}

function spawnLaser(dir, damage, range) {
  const origin = camera.position.clone();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, range, 6),
    new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.9, depthWrite: false }));
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  beam.position.copy(origin).addScaledVector(dir, range / 2);
  scene.add(beam);
  laserBeams.push({ mesh: beam, life: 0.15 });
  for (let i = allDrones.length - 1; i >= 0; i--) {
    const d = allDrones[i];
    const toD = d.group.position.clone().sub(origin);
    const t = toD.dot(dir);
    if (t < 0 || t > range) continue;
    const closest = origin.clone().addScaledVector(dir, t);
    if (closest.distanceTo(d.group.position) < 1.5) { d.hp -= damage; if (d.hp <= 0) killDrone(d); }
  }
  for (let i = npcs.length - 1; i >= 0; i--) {
    const n = npcs[i];
    const nc = n.group.position.clone(); nc.y += 1;
    const toN = nc.clone().sub(origin);
    const t = toN.dot(dir);
    if (t < 0 || t > range) continue;
    const closest = origin.clone().addScaledVector(dir, t);
    if (closest.distanceTo(nc) < 1.2) { n.hp -= damage; n.hitFlash = 0.15; if (n.hp <= 0) { scene.remove(n.group); npcs.splice(i, 1); money += 200; score++; updateMoneyUI(); } }
  }
}
function updateLaserBeams(dt) {
  for (let i = laserBeams.length - 1; i >= 0; i--) {
    const b = laserBeams[i];
    b.life -= dt;
    b.mesh.material.opacity = 0.9 * (b.life / 0.15);
    if (b.life <= 0) { scene.remove(b.mesh); laserBeams.splice(i, 1); }
  }
}

function spawnRocketProjectile(dir, radius, damage) {
  const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8),
    new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 }));
  rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  rocket.position.copy(camera.position).addScaledVector(dir, 1.5);
  rocket.add(new THREE.PointLight(0xff8800, 3, 8));
  rocket.userData = { velocity: dir.clone().multiplyScalar(45), life: 6, blastRadius: radius, blastDamage: damage };
  rockets.push(rocket); scene.add(rocket);
}

function fireRocket() {
  if (!selectedRocket || !gameActive) return;
  const def = ROCKETS[selectedRocket];
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.0, 10),
    new THREE.MeshStandardMaterial({
      color: def.emp ? 0x00ffff : def.damage > 50 ? 0xff0000 : 0xffaa00,
      emissive: def.emp ? 0x00ffff : 0xff4400, emissiveIntensity: 0.5, metalness: 0.8
    }));
  rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  rocket.position.copy(camera.position).addScaledVector(dir, 1.5);
  rocket.add(new THREE.PointLight(0xff8800, 4, 10));
  rocket.userData = {
    velocity: dir.clone().multiplyScalar(def.speed), life: 8,
    blastRadius: def.blastRadius, blastDamage: def.damage,
    def, cluster: def.cluster || 0, emp: def.emp || false
  };
  rocketProjectiles.push(rocket); scene.add(rocket);
  showHint(`🚀 ${def.name} запущена!`);
  sndWeaponShoot('rpg');
}

function updateRocketProjectiles(dt) {
  for (let i = rocketProjectiles.length - 1; i >= 0; i--) {
    const r = rocketProjectiles[i]; const ud = r.userData;
    r.position.addScaledVector(ud.velocity, dt);
    ud.life -= dt;
    if (ud.def && ud.def.homing) {
      let target = null, minDist = 100;
      for (const d of allDrones) {
        if (!d.active) continue;
        const dist = r.position.distanceTo(d.group.position);
        if (dist < minDist) { minDist = dist; target = d; }
      }
      if (target) {
        const toT = target.group.position.clone().sub(r.position).normalize();
        ud.velocity.lerp(toT.multiplyScalar(ud.def.speed), dt * 2);
      }
    }
    let hit = false;
    for (const d of allDrones) if (r.position.distanceTo(d.group.position) < 1.8) { hit = true; break; }
    const groundH = getTerrainHeight(r.position.x, r.position.z);
    if (hit || r.position.y <= groundH + 0.5 || ud.life <= 0) {
      explodeRocketProjectile(r.position.clone(), ud);
      scene.remove(r); rocketProjectiles.splice(i, 1);
    }
  }
}

function explodeRocketProjectile(pos, ud) {
  soundExplosion(0.9, 1.1);
  const flash = new THREE.PointLight(ud.emp ? 0x00ffff : 0xff8800, 20, ud.blastRadius * 3);
  flash.position.copy(pos); scene.add(flash);
  setTimeout(() => scene.remove(flash), 200);
  for (let i = allDrones.length - 1; i >= 0; i--) {
    const d = allDrones[i];
    const dist = d.group.position.distanceTo(pos);
    if (dist < ud.blastRadius) {
      if (ud.emp) d.stunnedUntil = performance.now() + 5000;
      else { d.hp -= ud.blastDamage * (1 - dist/ud.blastRadius); if (d.hp <= 0) killDrone(d); }
    }
  }
  for (let i = npcs.length - 1; i >= 0; i--) {
    const n = npcs[i];
    const dist = n.group.position.distanceTo(pos);
    if (dist < ud.blastRadius) { n.hp -= ud.blastDamage * (1 - dist/ud.blastRadius); if (n.hp <= 0) { scene.remove(n.group); npcs.splice(i, 1); money += 200; score++; updateMoneyUI(); } }
  }
  if (ud.cluster > 0) {
    for (let i = 0; i < ud.cluster; i++) {
      const angle = (i / ud.cluster) * Math.PI * 2;
      const subDir = new THREE.Vector3(Math.cos(angle), 0.5, Math.sin(angle)).normalize();
      const sub = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 3.5, 4), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      sub.position.copy(pos);
      sub.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), subDir);
      sub.userData = { velocity: subDir.multiplyScalar(20), life: 1.5, blastRadius: 2, blastDamage: ud.blastDamage * 0.5, def: null, cluster: 0, emp: false };
      rocketProjectiles.push(sub); scene.add(sub);
    }
  }
  const pd = pos.distanceTo(player.position);
  if (pd < ud.blastRadius && !ud.emp) damagePlayer(ud.blastDamage * 0.3 * (1 - pd/ud.blastRadius));
}

function updateRockets(dt) {
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i]; const ud = r.userData;
    r.position.addScaledVector(ud.velocity, dt);
    ud.life -= dt;
    let hit = false;
    for (const d of allDrones) if (r.position.distanceTo(d.group.position) < 1.5) { hit = true; break; }
    const groundH = getTerrainHeight(r.position.x, r.position.z);
    if (hit || r.position.y <= groundH + 0.5 || ud.life <= 0) {
      soundExplosion(0.7, 0.9);
      for (let j = allDrones.length - 1; j >= 0; j--) {
        const d = allDrones[j];
        if (d.group.position.distanceTo(r.position) < ud.blastRadius) { d.hp -= ud.blastDamage; if (d.hp <= 0) killDrone(d); }
      }
      for (let j = npcs.length - 1; j >= 0; j--) {
        const n = npcs[j];
        if (n.group.position.distanceTo(r.position) < ud.blastRadius) { n.hp -= ud.blastDamage; if (n.hp <= 0) { scene.remove(n.group); npcs.splice(j, 1); money += 200; score++; updateMoneyUI(); } }
      }
      const pd = r.position.distanceTo(player.position);
      if (pd < ud.blastRadius) damagePlayer(ud.blastDamage * 0.6 * (1 - pd/ud.blastRadius));
      scene.remove(r); rockets.splice(i, 1);
    }
  }
}

function vehicleAutoFire(dt) {
  if (currentVehicle.autoFire <= 0) return;
  autoFireTimer -= dt;
  if (autoFireTimer > 0) return;
  let target = null, minDist = 80;
  for (const d of allDrones) {
    if (!d.active) continue;
    const dist = d.group.position.distanceTo(player.position);
    if (dist < minDist) { minDist = dist; target = d; }
  }
  if (!target) return;
  autoFireTimer = currentVehicle.autoFire;
  const origin = player.position.clone(); origin.y += 2;
  const dir = target.group.position.clone().sub(origin).normalize();
  const tracer = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 4),
    new THREE.MeshBasicMaterial({ color: 0xff6600, depthWrite: false }));
  tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  tracer.position.copy(origin).addScaledVector(dir, 2);
  tracer.userData = { velocity: dir.multiplyScalar(120), life: 1.5, damage: currentVehicle.id === 'tank' ? 5 : 2 };
  bullets.push(tracer); scene.add(tracer);
}

function dropBomb(drone) {
  const bomb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x111111 }));
  bomb.position.copy(drone.group.position);
  bomb.userData = { velocity: new THREE.Vector3(0, -2, 0), life: 6, radius: 3, damage: 20 };
  const ring = new THREE.Mesh(new THREE.RingGeometry(2, 2.5, 24),
    new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
  ring.rotation.x = -Math.PI/2;
  ring.position.set(bomb.position.x, 0.05, bomb.position.z);
  scene.add(ring);
  bomb.userData.ring = ring;
  bombs.push(bomb); scene.add(bomb);
}

function spawnPickup() {
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xff3366, emissive: 0xff3366, emissiveIntensity: 0.5 }));
  const angle = Math.random() * Math.PI * 2;
  const dist = 20 + Math.random() * 30;
  const x = player.position.x + Math.cos(angle) * dist;
  const z = player.position.z + Math.sin(angle) * dist;
  p.position.set(x, getTerrainHeight(x, z) + 1, z);
  p.userData = { bob: 0 };
  pickups.push(p); scene.add(p);
}

// ============ КАМЕРА ============
function updateCamera(dt) {
  const targetFov = zoomed ? currentWeapon.zoom : 72;
  camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 10);
  camera.updateProjectionMatrix();

  if (isFirstPerson) {
    camera.position.set(player.position.x, player.position.y + 1.75, player.position.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    camAngle = yaw; camTargetAngle = yaw;
    updateViewWeaponAnim(dt);
    return;
  }

  camTargetAngle = yaw;
  let diff = camTargetAngle - camAngle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  camAngle += diff * Math.min(1, dt * 10);

  const targetH = currentVehicle.camHeight || 3;
  camHeightSmooth += (targetH - camHeightSmooth) * Math.min(1, dt * 4);

  const camD = currentVehicle.camDist || 8;
  const pitchOff = pitch * 0.6;
  const backDir = new THREE.Vector3(Math.sin(camAngle), 0, Math.cos(camAngle));
  const offset = new THREE.Vector3(backDir.x * camD, camD * Math.sin(pitchOff) + camHeightSmooth, backDir.z * camD);
  const targetCamPos = player.position.clone().add(offset);

  const camRayDir = targetCamPos.clone().sub(player.position).normalize();
  const camDistActual = targetCamPos.distanceTo(player.position);
  let finalDist = camDistActual;

  for (const b of worldState.buildings) {
    const bp = new THREE.Vector3();
    b.group.getWorldPosition(bp);
    const bH = b.h + 2;
    if (targetCamPos.x > bp.x - b.w/2 - 0.5 && targetCamPos.x < bp.x + b.w/2 + 0.5 &&
        targetCamPos.z > bp.z - b.d/2 - 0.5 && targetCamPos.z < bp.z + b.d/2 + 0.5 &&
        targetCamPos.y > 0 && targetCamPos.y < bH) {
      finalDist = Math.min(finalDist, camDistActual * 0.5);
      break;
    }
  }

  const smoothCam = player.position.clone().add(camRayDir.multiplyScalar(finalDist));
  camera.position.lerp(smoothCam, Math.min(1, dt * 12));

  const lookAt = player.position.clone();
  lookAt.y += camHeightSmooth * 0.7;
  lookAt.addScaledVector(new THREE.Vector3(-Math.sin(camAngle), 0, -Math.cos(camAngle)), 5);
  lookAt.y += Math.sin(pitchOff) * 5;
  camera.lookAt(lookAt);
}

// ============ ИГРОК ============
function updatePlayer(dt) {
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const move = new THREE.Vector3();

  if (keys['KeyW']) move.add(forward);
  if (keys['KeyS']) move.sub(forward);
  if (keys['KeyD']) move.add(right);
  if (keys['KeyA']) move.sub(right);
  if (joyActive) { move.addScaledVector(forward, -joyDY); move.addScaledVector(right, joyDX); }

  const running = keys['ShiftLeft'] || keys['ShiftRight'] || touchRun;
  const speedMul = (zoomed ? 0.5 : 1) * currentVehicle.speed * currentHero.speedMult;
  const playerRadius = currentVehicle.id === 'foot' ? 0.5 : 1.2 * currentVehicle.size;

  if (move.lengthSq() > 0) {
    if (move.length() > 1) move.normalize();
    const speed = PLAYER_SPEED * (running ? RUN_MULT : 1) * speedMul;
    const dx = move.x * speed * dt, dz = move.z * speed * dt;
    const newX = player.position.x + dx;
    const newZ = player.position.z + dz;

    if (currentVehicle.flying) {
      player.position.x = newX;
      player.position.z = newZ;
    } else {
      const collision = checkCollision(newX, newZ, playerRadius);
      if (!collision) {
        player.position.x = newX;
        player.position.z = newZ;
      } else {
        if (!checkCollision(newX, player.position.z, playerRadius)) player.position.x = newX;
        if (!checkCollision(player.position.x, newZ, playerRadius)) player.position.z = newZ;
        if (Math.random() < 0.1) sndBump();
      }
    }

    if (SETTINGS.ambientSound) {
      footstepsTimer -= dt;
      if (footstepsTimer <= 0) {
        if (currentVehicle.id === 'foot') {
          footstepsTimer = running ? 0.25 : 0.4;
          sndFootstep();
        } else if (currentVehicle.flying) {
          footstepsTimer = 0.8;
          sndVehicleJet();
        } else {
          footstepsTimer = 0.5;
          sndVehicleEngine();
        }
      }
    }

    if (vehicleWheels.length > 0 && !currentVehicle.flying) {
      const wheelSpeed = speed * dt / 0.4;
      for (const w of vehicleWheels) { if (w._isRotor) continue; w.rotation.x += wheelSpeed; }
    }
  }

  for (const w of vehicleWheels) {
    if (w._isRotor) {
      if (w._axis === 'y' || !w._axis) w.rotation.y += dt * 50;
      else if (w._axis === 'z') w.rotation.z += dt * 80;
    }
  }

  if (vehicleBody && !isFirstPerson) {
    const targetLeanZ = joyActive ? joyDX * 0.15 : 0;
    vehicleLean.z += (targetLeanZ - vehicleLean.z) * Math.min(1, dt * 5);
    vehicleBody.rotation.z = vehicleLean.z;
  }

  const groundH = getTerrainHeight(player.position.x, player.position.z);

  if (currentVehicle.flying) {
    const maxAlt = currentVehicle.maxAltitude || 60;
    const flySpeed = currentVehicle.flightSpeed || 15;

    let lift = 0;
    if (keys['Space'] || touchJump || touchFlyUp) lift += 25 * dt;
    if (keys['ShiftLeft'] || keys['ShiftRight'] || touchRun || touchFlyDown) lift -= 25 * dt;

    if (currentVehicle.needsSpeed) {
      const speedSq = (move.x * move.x + move.z * move.z);
      if (speedSq < 0.1) lift -= 15 * dt;
    } else {
      lift -= velocity.y * 1.5 * dt;
    }

    velocity.y += lift;
    velocity.y = Math.max(-flySpeed, Math.min(flySpeed, velocity.y));
    player.position.y += velocity.y * dt;

    if (player.position.y > groundH + maxAlt) {
      player.position.y = groundH + maxAlt;
      velocity.y = Math.min(0, velocity.y);
    }
    if (player.position.y <= groundH + 0.5) {
      player.position.y = groundH + 0.5;
      velocity.y = Math.max(0, velocity.y);
    }
    onGround = player.position.y <= groundH + 0.6;
  } else {
    velocity.y += GRAVITY * dt;
    player.position.y += velocity.y * dt;
    if (player.position.y <= groundH) { player.position.y = groundH; velocity.y = 0; onGround = true; }
    else onGround = false;

    if ((keys['Space'] || touchJump) && onGround) {
      velocity.y = JUMP; onGround = false; touchJump = false;
    }
  }

  player.rotation.y = yaw;
  updateCamera(dt);
  if (touchFire) shoot();

  updateDroneActivation();
  updateChunks(player, getWorldDeps());
  updateNearestLoot();
  vehicleAutoFire(dt);
}

function updateDroneActivation() {
  let anyActive = false;
  for (const d of allDrones) {
    const dist = d.group.position.distanceTo(player.position);
    if (dist < DRONE_ACTIVATE_DIST) {
      if (!d.active) { d.active = true; sndAlarm(); }
      anyActive = true;
    }
  }
  document.getElementById('alert').style.display = anyActive ? 'block' : 'none';
}

function updateDrones(dt) {
  const now = performance.now();
  for (let i = allDrones.length - 1; i >= 0; i--) {
    const d = allDrones[i];
    const g = d.group;
    if (d.stunnedUntil && now < d.stunnedUntil) continue;
    d.bob += dt * 3;
    d.rotors.forEach(r => r.rotation.y += dt * 40);
    const groundH = getTerrainHeight(g.position.x, g.position.z);

    if (!d.active) {
      d.patrolAngle += dt * 0.3;
      const tx = d.homeX + Math.cos(d.patrolAngle) * d.patrolRadius;
      const tz = d.homeZ + Math.sin(d.patrolAngle) * d.patrolRadius;
      g.position.x += (tx - g.position.x) * dt * 0.8;
      g.position.z += (tz - g.position.z) * dt * 0.8;
      g.position.y = groundH + 12 + Math.sin(d.bob) * 1.5;
    } else {
      const toP = new THREE.Vector3(player.position.x - g.position.x, 0, player.position.z - g.position.z);
      const distH = toP.length();
      toP.normalize();
      if (distH > 10) g.position.addScaledVector(toP, 6 * dt);
      else { const tang = new THREE.Vector3(-toP.z, 0, toP.x); g.position.addScaledVector(tang, 4 * dt); }
      g.position.y = groundH + 12 + Math.sin(d.bob) * 1.5;
      d.bombTimer -= dt;
      if (d.bombTimer <= 0 && distH < 20) { dropBomb(d); d.bombTimer = 3 + Math.random() * 3; }
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (b.position.distanceTo(g.position) < 1.2) {
        scene.remove(b); bullets.splice(j, 1);
        d.hp -= b.userData.damage || 1;
        sndHit();
        if (d.hp <= 0) killDrone(d);
        break;
      }
    }
  }

  if (allDrones.length < DRONES_GLOBAL_MAX && Math.random() < 0.005) {
    for (const [, chunk] of worldState.chunks.entries()) {
      const dist = Math.hypot(chunk.cx * CHUNK_SIZE - player.position.x, chunk.cz * CHUNK_SIZE - player.position.z);
      if (dist > 60 && dist < 200) {
        const dx = chunk.cx * CHUNK_SIZE + 15 + Math.random() * (CHUNK_SIZE - 30);
        const dz = chunk.cz * CHUNK_SIZE + 15 + Math.random() * (CHUNK_SIZE - 30);
        const drone = createDrone(dx, dz);
        scene.add(drone.group);
        allDrones.push(drone);
        break;
      }
    }
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.addScaledVector(b.userData.velocity, dt);
    b.userData.life -= dt;
    if (b.userData.life <= 0 || b.position.y < -5) {
      scene.remove(b);
      if (b.geometry) b.geometry.dispose();
      if (b.material) b.material.dispose();
      bullets.splice(i, 1);
    }
  }
}

function updateBombs(dt) {
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i]; const ud = b.userData;
    ud.velocity.y += GRAVITY * dt;
    b.position.addScaledVector(ud.velocity, dt);
    ud.life -= dt;
    if (ud.ring) { const s = 1 + Math.sin(performance.now() * 0.01) * 0.1; ud.ring.scale.set(s, s, 1); }
    const groundH = getTerrainHeight(b.position.x, b.position.z);
    if (b.position.y <= groundH + 0.5) {
      const dist = Math.hypot(b.position.x - player.position.x, b.position.z - player.position.z);
      if (dist < ud.radius) damagePlayer(ud.damage * (1 - dist/ud.radius) * (1 - currentVehicle.bombResist));
      soundExplosion(0.6, 0.7);
      const flash = new THREE.PointLight(0xff5500, 8, 20);
      flash.position.copy(b.position); scene.add(flash);
      setTimeout(() => scene.remove(flash), 120);
      if (ud.ring) scene.remove(ud.ring);
      scene.remove(b); bombs.splice(i, 1);
    } else if (ud.life <= 0) {
      if (ud.ring) scene.remove(ud.ring);
      scene.remove(b); bombs.splice(i, 1);
    }
  }
}

function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.userData.bob += dt * 3;
    const groundH = getTerrainHeight(p.position.x, p.position.z);
    p.position.y = groundH + 1 + Math.sin(p.userData.bob) * 0.3;
    p.rotation.y += dt * 2;
    const dist = Math.hypot(p.position.x - player.position.x, p.position.z - player.position.z);
    if (dist < 2) {
      health = Math.min(maxHealth, health + 30);
      updateHpUI();
      scene.remove(p); pickups.splice(i, 1);
      sndPickup();
    }
  }
}

function damagePlayer(amount) {
  if (!gameActive) return;
  health -= amount;
  health = Math.max(0, health);
  updateHpUI();
  sndDamage();
  const flash = document.getElementById('damageFlash');
  flash.style.opacity = '1';
  setTimeout(() => flash.style.opacity = '0', 150);
  if (health <= 0) gameOver();
}

function updateHpUI() {
  const pct = (health / maxHealth) * 100;
  document.getElementById('hpfill').style.width = pct + '%';
  document.getElementById('hpfill').style.background = pct > 60 ? '#0f0' : pct > 30 ? '#ff0' : '#f00';
}

function gameOver() {
  gameActive = false;
  paused = false;
  document.body.classList.remove('playing');
  document.exitPointerLock?.();
  pauseMusic();
  sndDeath();
  const best = parseInt(localStorage.getItem('drone_best_money') || '0');
  if (money > best) localStorage.setItem('drone_best_money', money);
  const menu = document.getElementById('mainMenu');
  menu.style.display = 'flex';
  menu.innerHTML = `
    <h1>💥 ТЫ СБИТ</h1>
    <div class="subtitle">ИГРА ОКОНЧЕНА</div>
    <p style="color:#0f0;font-size:16px;margin:8px 0">Герой: ${currentHero.name}</p>
    <p style="color:#0f0;font-size:16px;margin:8px 0">Сбито: ${score}</p>
    <p style="color:#ffd700;font-size:18px;margin:6px 0">💰 ${money} $</p>
    <p style="color:#ffd700;font-size:14px;margin:6px 0">🏆 Рекорд: ${Math.max(money, best)} $</p>
    <button class="menu-btn" onclick="location.reload()">▶ ЗАНОВО</button>
  `;
}

// ============ ЦИКЛ ============
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (fireCooldown > 0) fireCooldown -= dt;

  WIND.update(dt);

  if (started && !paused && SETTINGS.weather) {
    WEATHER.update(dt, player.position);
  } else if (started && !paused) {
    WEATHER.timeOfDay += (24 / WEATHER.dayLength) * dt;
    if (WEATHER.timeOfDay >= 24) WEATHER.timeOfDay -= 24;
  }

  if (gameActive && started && !paused &&
      !document.getElementById('shop').classList.contains('open') &&
      !document.getElementById('inventory').classList.contains('open')) {
    updatePlayer(dt);
    updateDrones(dt);
    updateAllyDrones(dt);
    updateNPCs(dt);
    updateNpcBullets(dt);
    updateBullets(dt);
    updateRockets(dt);
    updateRocketProjectiles(dt);
    updateGrenades(dt);
    updateFlames(dt);
    updateLaserBeams(dt);
    updateBombs(dt);
    updatePickups(dt);
    updateReload(dt);

    wildlife.update(dt, scene, player.position);

    if (SETTINGS.ambientSound) {
      if (Math.random() < 0.0005) sndBird();
      if (WEATHER.type === 'rain' && Math.random() < 0.0003) sndThunder();
    }
  }
  renderer.render(scene, camera);
}

// ============ ПРОМОКОДЫ ============
function getUsedPromos() { try { return JSON.parse(localStorage.getItem(USED_PROMOS_KEY) || '[]'); } catch { return []; } }
function markPromoUsed(code) {
  const used = getUsedPromos();
  if (!used.includes(code)) { used.push(code); localStorage.setItem(USED_PROMOS_KEY, JSON.stringify(used)); }
}
function applyPromo() {
  const input = document.getElementById('promoInput');
  const status = document.getElementById('promoStatus');
  const code = (input.value || '').trim().toUpperCase();
  if (!code) { status.textContent = 'Введи код!'; status.className = 'promo-status err'; sndPromoErr(); return; }
  const promo = PROMOCODES[code];
  if (!promo) { status.textContent = '❌ Неверный код'; status.className = 'promo-status err'; sndPromoErr(); return; }
  if (getUsedPromos().includes(code)) { status.textContent = '⚠ Уже использован'; status.className = 'promo-status err'; sndPromoErr(); return; }
  money += promo.money; markPromoUsed(code); updateMoneyUI();
  status.textContent = `✅ ${promo.message}`; status.className = 'promo-status ok'; sndPromoOk();
  setTimeout(() => {
    document.getElementById('promoModal').classList.remove('show');
    input.value = ''; status.textContent = ''; status.className = 'promo-status';
  }, 2000);
}

// ============ НАСТРОЙКИ UI ============
function syncSettingsUI() {
  const setVal = (id, val) => {
    const input = document.getElementById(id);
    const valEl = document.getElementById(id + 'Val');
    if (input) input.value = val;
    if (valEl) valEl.textContent = val;
  };

  setVal('setViewDist', SETTINGS.viewDist);
  setVal('setGrass', SETTINGS.grass);
  setVal('setTrees', SETTINGS.trees);
  setVal('setButterflies', SETTINGS.butterflies);

  const setResVal = document.getElementById('setResolutionVal');
  if (setResVal) setResVal.textContent = SETTINGS.resolution.toFixed(1) + 'x';

  const setResInput = document.getElementById('setResolution');
  if (setResInput) setResInput.value = SETTINGS.resolution;

  const setWeatherEl = document.getElementById('setWeather');
  const setWeatherVal = document.getElementById('setWeatherVal');
  if (setWeatherEl) setWeatherEl.checked = SETTINGS.weather;
  if (setWeatherVal) setWeatherVal.textContent = SETTINGS.weather ? 'ВКЛ' : 'ВЫКЛ';

  const setShadowsEl = document.getElementById('setShadows');
  const setShadowsVal = document.getElementById('setShadowsVal');
  if (setShadowsEl) setShadowsEl.checked = SETTINGS.shadows;
  if (setShadowsVal) setShadowsVal.textContent = SETTINGS.shadows ? 'ВКЛ' : 'ВЫКЛ';

  const setAmbientEl = document.getElementById('setAmbientSound');
  const setAmbientVal = document.getElementById('setAmbientSoundVal');
  if (setAmbientEl) setAmbientEl.checked = SETTINGS.ambientSound;
  if (setAmbientVal) setAmbientVal.textContent = SETTINGS.ambientSound ? 'ВКЛ' : 'ВЫКЛ';

  updateMusicUI();
}

function applySettings() {
  if (!renderer) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio, SETTINGS.resolution));
  renderer.shadowMap.enabled = SETTINGS.shadows && !isTouch;

  if (sunLight) {
    sunLight.castShadow = SETTINGS.shadows && !isTouch;
    if (sunLight.shadow) sunLight.shadow.mapSize.set(1024, 1024);
  }
}

function clearAllChunks() {
  for (const [key] of worldState.chunks) {
    const chunk = worldState.chunks.get(key);
    if (chunk) scene.remove(chunk.group);
    for (let i = worldState.buildings.length - 1; i >= 0; i--) {
      if (worldState.buildings[i].chunkKey === key) worldState.buildings.splice(i, 1);
    }
  }
  worldState.chunks.clear();
  worldState.obstacles.length = 0;
}

// ============ UI EVENTS ============
function setupUIEvents() {
  document.querySelectorAll('.hero-card').forEach(card => {
    card.addEventListener('click', () => {
      initAudio(); sndMenuClick();
      document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentHero = HEROES[card.dataset.hero];
    });
  });

  // ═══ ПАУЗА ═══
  const pauseModal = document.getElementById('pauseModal');
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseResume = document.getElementById('pauseResume');
  const pauseSettings = document.getElementById('pauseSettings');
  const pauseExit = document.getElementById('pauseExit');

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (!gameActive || paused) return;
      sndMenuClick();
      paused = true;
      pauseModal.classList.add('show');
      document.exitPointerLock?.();
    });
  }

  if (pauseResume) {
    pauseResume.addEventListener('click', () => {
      sndMenuClick();
      pauseModal.classList.remove('show');
      paused = false;
      if (!isTouch && gameActive) renderer.domElement.requestPointerLock();
    });
  }

  if (pauseSettings) {
    pauseSettings.addEventListener('click', () => {
      sndMenuClick();
      pauseModal.classList.remove('show');
      document.getElementById('settingsModal').classList.add('show');
      syncSettingsUI();
      window._returnToPause = true;
    });
  }

  if (pauseExit) {
    pauseExit.addEventListener('click', () => {
      sndMenuClick();
      paused = false;
      gameActive = false;
      started = false;
      pauseModal.classList.remove('show');
      document.body.classList.remove('playing');
      document.exitPointerLock?.();
      pauseMusic();
      location.reload();
    });
  }

  document.getElementById('playBtn').addEventListener('click', () => {
    initAudio(); sndMenuClick();
    document.getElementById('mainMenu').style.display = 'none';
    gameActive = true; started = true;
    document.body.classList.add('playing');
    if (!isTouch) renderer.domElement.requestPointerLock();
    maxHealth = 100 + currentHero.hpBonus;
    health = maxHealth;

    playMusic();

    if (money < 5000) {
      money = 5000;
      setTimeout(() => showHint('💰 Стартовый капитал: 5000 $'), 500);
    }

    updateHpUI(); updateAmmoUI(); updateMoneyUI(); updateHUDNames();
    updateFlyButtons();
    updateViewWeapon();
    updateChunks(player, getWorldDeps());
    setInterval(() => { if (gameActive && pickups.length < 3) spawnPickup(); }, 20000);
  });

  document.getElementById('aboutBtn').addEventListener('click', () => {
    initAudio(); sndMenuClick(); document.getElementById('aboutModal').classList.add('show');
  });
  document.getElementById('closeAbout').addEventListener('click', () => {
    sndMenuClick(); document.getElementById('aboutModal').classList.remove('show');
  });
  document.getElementById('promoBtn').addEventListener('click', () => {
    initAudio(); sndMenuClick(); document.getElementById('promoModal').classList.add('show');
    document.getElementById('promoInput').focus();
  });
  document.getElementById('closePromo').addEventListener('click', () => {
    sndMenuClick();
    document.getElementById('promoModal').classList.remove('show');
    document.getElementById('promoInput').value = '';
    document.getElementById('promoStatus').textContent = '';
  });
  document.getElementById('applyPromo').addEventListener('click', applyPromo);
  document.getElementById('promoInput').addEventListener('keydown', e => { if (e.key === 'Enter') applyPromo(); });

  // ═══ НАСТРОЙКИ ═══
  const settingsModal = document.getElementById('settingsModal');
  const settingsBtn = document.getElementById('settingsBtn');
  const closeSettings = document.getElementById('closeSettings');
  const resetSettings = document.getElementById('resetSettings');

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      initAudio(); sndMenuClick();
      settingsModal.classList.add('show');
      syncSettingsUI();
      window._returnToPause = false;
    });
  }

  if (closeSettings) {
    closeSettings.addEventListener('click', () => {
      sndMenuClick();
      settingsModal.classList.remove('show');
      if (window._returnToPause) {
        window._returnToPause = false;
        if (gameActive && paused) {
          document.getElementById('pauseModal').classList.add('show');
        }
      }
    });
  }

  if (resetSettings) {
    resetSettings.addEventListener('click', () => {
      sndMenuClick();
      SETTINGS.applyPreset('medium');
      syncSettingsUI();
      applySettings();
      clearAllChunks();
      updateChunks(player, getWorldDeps());
      showHint('Настройки сброшены');
    });
  }

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sndMenuClick();
      SETTINGS.applyPreset(btn.dataset.preset);
      syncSettingsUI();
      applySettings();
      clearAllChunks();
      updateChunks(player, getWorldDeps());
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const bindSlider = (id, settingKey, formatter, onChange) => {
    const input = document.getElementById(id);
    const valEl = document.getElementById(id + 'Val');
    if (!input) return;

    input.value = SETTINGS[settingKey];
    if (valEl) valEl.textContent = formatter(SETTINGS[settingKey]);

    input.addEventListener('input', () => {
      SETTINGS[settingKey] = parseFloat(input.value);
      if (valEl) valEl.textContent = formatter(SETTINGS[settingKey]);
      SETTINGS.save();
      if (onChange) onChange();
    });
  };

  const bindCheckbox = (id, settingKey, onChange) => {
    const input = document.getElementById(id);
    const valEl = document.getElementById(id + 'Val');
    if (!input) return;

    input.checked = SETTINGS[settingKey];
    if (valEl) valEl.textContent = SETTINGS[settingKey] ? 'ВКЛ' : 'ВЫКЛ';

    input.addEventListener('change', () => {
      SETTINGS[settingKey] = input.checked;
      if (valEl) valEl.textContent = input.checked ? 'ВКЛ' : 'ВЫКЛ';
      SETTINGS.save();
      if (onChange) onChange();
    });
  };

  bindSlider('setViewDist', 'viewDist', v => v, () => {
    clearAllChunks();
    updateChunks(player, getWorldDeps());
  });
  bindSlider('setGrass', 'grass', v => v, () => {
    clearAllChunks();
    updateChunks(player, getWorldDeps());
  });
  bindSlider('setTrees', 'trees', v => v, () => {
    clearAllChunks();
    updateChunks(player, getWorldDeps());
  });
  bindSlider('setButterflies', 'butterflies', v => v, () => {
    for (const b of wildlife.butterflies) scene.remove(b.group);
    wildlife.butterflies.length = 0;
    clearAllChunks();
    updateChunks(player, getWorldDeps());
  });
  bindCheckbox('setWeather', 'weather', () => {
    if (!SETTINGS.weather) WEATHER.setWeather('clear');
  });
  bindCheckbox('setShadows', 'shadows', () => applySettings());
  bindSlider('setResolution', 'resolution', v => v.toFixed(1) + 'x', () => {
    renderer.setPixelRatio(Math.min(devicePixelRatio, SETTINGS.resolution));
  });
  bindCheckbox('setAmbientSound', 'ambientSound');

  // ═══ МУЗЫКА ═══
  const musicOnBtn = document.getElementById('musicOnBtn');
  const musicOffBtn = document.getElementById('musicOffBtn');
  const musicVolSlider = document.getElementById('setMusicVolume');

  if (musicOnBtn) {
    musicOnBtn.addEventListener('click', () => {
      sndMenuClick();
      musicEnabled = true;
      saveMusicSettings();
      updateMusicUI();
      if (gameActive && bgMusic) playMusic();
    });
  }
  if (musicOffBtn) {
    musicOffBtn.addEventListener('click', () => {
      sndMenuClick();
      musicEnabled = false;
      saveMusicSettings();
      updateMusicUI();
      pauseMusic();
    });
  }
  if (musicVolSlider) {
    musicVolSlider.addEventListener('input', () => {
      musicVolume = parseFloat(musicVolSlider.value);
      const volValEl = document.getElementById('setMusicVolumeVal');
      if (volValEl) volValEl.textContent = Math.round(musicVolume * 100) + '%';
      if (bgMusic) bgMusic.volume = musicVolume;
      saveMusicSettings();
    });
  }

  window.closeShop = closeShop;
  window.closeInventory = closeInventory;
  window.switchTab = switchTab;
  window.switchInvTab = switchInvTab;
}

// ============ СТАРТ ============
init();
animate();