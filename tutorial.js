// ============ ОБУЧЕНИЕ (ТОЛИК) ============
// Логика: Толик появляется → говорит → исчезает → висит панель задания → выполнил → снова Толик.

const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 ||
                /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

let API = null;
let tolikHideTimer = null;

// ============ ШАГИ ============
const STEPS = [
  {
    id: 'welcome',
    icon: '👋',
    title: 'ШАГ 1 · ДВИЖЕНИЕ',
    tolik: 'Привет, боец! Я Толик, твой напарник. Сейчас научу тебя выживать. Для начала просто подвигайся — WASD или джойстик слева.',
    task: 'Пройди немного в любую сторону',
    progress: (t) => `${Math.min(100, Math.floor(t.movedDistance / 12 * 100))}%`,
    check: (t) => t.movedDistance >= 12
  },
  {
    id: 'look',
    icon: '👀',
    title: 'ШАГ 2 · ОСМОТР',
    tolik: 'Отлично! Теперь осмотрись — поводи мышью или проведи пальцем по правой половине экрана.',
    task: 'Поверни камеру',
    progress: (t) => `${Math.min(100, Math.floor(t.lookedAmount / 40 * 100))}%`,
    check: (t) => t.lookedAmount >= 40
  },
  {
    id: 'jump',
    icon: '⬆️',
    title: 'ШАГ 3 · ПРЫЖОК',
    tolik: 'Прыжок — важный навык, поможет уйти от бомбы. Нажми ПРОБЕЛ или кнопку ↑ на экране.',
    task: 'Соверши прыжок',
    progress: () => '',
    check: (t) => t.jumped
  },
  {
    id: 'shoot',
    icon: '🔫',
    title: 'ШАГ 4 · СТРЕЛЬБА',
    tolik: 'Теперь стрельба. ЛКМ или кнопка «ОГОНЬ» справа. Сделай несколько выстрелов.',
    task: 'Сделай 5 выстрелов',
    progress: (t) => `${Math.min(t.shotsFired, 5)}/5`,
    check: (t) => t.shotsFired >= 5
  },
  {
    id: 'reload',
    icon: '🔄',
    title: 'ШАГ 5 · ПЕРЕЗАРЯДКА',
    tolik: 'Патроны имеют свойство заканчиваться. Перезарядись — клавиша R или кнопка R.',
    task: 'Перезаряди оружие',
    progress: () => '',
    check: (t) => t.reloaded
  },
  {
    id: 'shop',
    icon: '🛒',
    title: 'ШАГ 6 · МАГАЗИН',
    tolik: 'Тебе выдали стартовый капитал! Купи себе что-нибудь — оружие, технику или дрона. Это пригодится.',
    task: 'Купи что-нибудь в магазине',
    progress: () => '',
    check: (t) => t.boughtSomething,
    onEnter: () => {
      API.addMoney(5000);
      setTimeout(() => {
        if (tut.active && STEPS[tut.step].id === 'shop' && typeof window.openShop === 'function') {
          window.openShop();
        }
      }, 5000);   // через 5 сек после реплики Толика
    }
  },
  {
    id: 'drone',
    icon: '🚁',
    title: 'ШАГ 7 · БОЙ',
    tolik: 'Слышишь гул? Вражеский БПЛА приближается! Целься и сбей его, пока он не сбросил бомбу.',
    task: 'Уничтожь вражеский дрон',
    progress: () => '',
    check: (t) => t.killedDrone,
    onEnter: () => {
      if (typeof window.closeShop === 'function') window.closeShop();
      API.spawnDroneClose();
      const drones = API.getDrones();
      const last = drones[drones.length - 1];
      if (last) {
        last.hp = 2;
        last.bombTimer = 999;
        last.active = true;
      }
    }
  },
  {
    id: 'done',
    icon: '🎖️',
    title: 'ОБУЧЕНИЕ ЗАВЕРШЕНО',
    tolik: 'Поздравляю, боец! Ты прошёл обучение и готов к настоящему выживанию. Удачи — я всегда рядом!',
    task: '',
    progress: () => '',
    check: () => false
  }
];

// ============ СОСТОЯНИЕ ============
const tut = {
  active: false,
  step: 0,
  movedDistance: 0,
  lookedAmount: 0,
  jumped: false,
  shotsFired: 0,
  reloaded: false,
  boughtSomething: false,
  killedDrone: false,
  lastPos: { x: 0, z: 0 },
  lastYaw: 0,
  lastPitch: 0,
  prevDroneCount: 0,
  cooldown: 0,
  ready: false
};

// ============ СБРОС ============
function resetStepProgress(stepId) {
  switch (stepId) {
    case 'welcome': {
      tut.movedDistance = 0;
      const p = API.getPlayer();
      tut.lastPos = { x: p.position.x, z: p.position.z };
      break;
    }
    case 'look':
      tut.lookedAmount = 0;
      tut.lastYaw = API.getYaw();
      tut.lastPitch = API.getPitch();
      break;
    case 'jump':
      tut.jumped = false;
      break;
    case 'shoot':
      tut.shotsFired = 0;
      break;
    case 'reload':
      tut.reloaded = false;
      break;
    case 'shop':
      tut.boughtSomething = false;
      break;
    case 'drone':
      tut.killedDrone = false;
      tut.prevDroneCount = API.getDrones().length;
      break;
  }
}

// ============ СТАРТ ============
function startTutorial() {
  API = window.gameAPI;
  if (!API) { console.warn('gameAPI не найден'); return; }

  const player = API.getPlayer();
  tut.active = true;
  tut.step = 0;
  tut.movedDistance = 0;
  tut.lookedAmount = 0;
  tut.jumped = false;
  tut.shotsFired = 0;
  tut.reloaded = false;
  tut.boughtSomething = false;
  tut.killedDrone = false;
  tut.lastPos = { x: player.position.x, z: player.position.z };
  tut.lastYaw = API.getYaw();
  tut.lastPitch = API.getPitch();
  tut.prevDroneCount = API.getDrones().length;
  tut.cooldown = 0;
  tut.ready = false;

  document.getElementById('mainMenu').style.display = 'none';
  API.setGameActive(true);
  API.setStarted(true);
  API.setPlayingClass();
  document.body.classList.add('tutorial-mode');

  const canvas = document.querySelector('canvas');
  if (!isTouch && canvas && canvas.requestPointerLock) {
    canvas.requestPointerLock().catch(() => {});
  }

  API.addMoney(2000);
  API.addWeaponFree('smg');
  API.equipWeapon('smg');

  showStep();
  console.log('🎓 Обучение началось');
}

// ============ ПОКАЗ ШАГА ============
function showStep() {
  const step = STEPS[tut.step];
  if (!step) return;

  resetStepProgress(step.id);

  const panel = document.getElementById('tutorialPanel');
  const tolikBox = document.getElementById('tolikBox');
  const taskBox = document.getElementById('taskBox');
  const textEl = document.getElementById('tutorialText');
  const taskIcon = document.getElementById('taskIcon');
  const taskTitle = document.getElementById('taskTitle');
  const taskDesc = document.getElementById('taskDesc');
  const taskProgress = document.getElementById('taskProgress');

  if (panel) panel.classList.add('show');

  // Сбрасываем состояние
  clearTimeout(tolikHideTimer);

  // Скрываем панель задания пока Толик говорит
  if (taskBox) taskBox.classList.remove('show');

  // Показываем Толика
  if (textEl) textEl.textContent = step.tolik;
  if (tolikBox) {
    tolikBox.classList.remove('hidden');
    tolikBox.classList.add('show');
  }

  // Через 5 секунд Толик прячется, появляется панель задания
  const isDone = step.id === 'done';
  tolikHideTimer = setTimeout(() => {
    if (!tut.active || STEPS[tut.step].id !== step.id) return;

    if (tolikBox) {
      tolikBox.classList.remove('show');
      tolikBox.classList.add('hidden');
    }

    if (isDone) {
      // На финале — просто скрываем всю панель через 3 секунды
      setTimeout(() => {
        if (panel) panel.classList.remove('show');
      }, 3000);
      return;
    }

    // Показываем панель задания
    if (taskIcon) taskIcon.textContent = step.icon || '🎯';
    if (taskTitle) taskTitle.textContent = step.title || 'ЗАДАНИЕ';
    if (taskDesc) taskDesc.textContent = step.task || '';
    if (taskProgress) taskProgress.textContent = '';
    if (taskBox) taskBox.classList.add('show');

    // Разрешаем проверку условия
    tut.ready = false;
    setTimeout(() => {
      if (tut.active && STEPS[tut.step].id === step.id) {
        tut.ready = true;
      }
    }, 300);
  }, 5000);   // Толик виден 5 секунд

  if (step.onEnter) step.onEnter();
}

// ============ СЛЕДУЮЩИЙ ШАГ ============
function nextStep() {
  const complete = document.getElementById('taskComplete');
  if (complete) {
    complete.classList.add('show');
    complete.classList.remove('hide');
    setTimeout(() => {
      complete.classList.remove('show');
      complete.classList.add('hide');
    }, 1200);
  }

  tut.ready = false;
  tut.step++;
  if (tut.step >= STEPS.length) {
    endTutorial();
    return;
  }
  tut.cooldown = 1.5;
  setTimeout(showStep, 900);
}

function endTutorial() {
  tut.active = false;
  clearTimeout(tolikHideTimer);
  document.body.classList.remove('tutorial-mode');

  const panel = document.getElementById('tutorialPanel');
  if (panel) panel.classList.remove('show');
}

// ============ ОБНОВЛЕНИЕ ============
function updateTutorial(dt) {
  if (!tut.active || !API) return;

  const player = API.getPlayer();
  const yaw = API.getYaw();
  const pitch = API.getPitch();

  // Движение
  if (STEPS[tut.step] && STEPS[tut.step].id === 'welcome') {
    const dx = player.position.x - tut.lastPos.x;
    const dz = player.position.z - tut.lastPos.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.001 && dist < 5) tut.movedDistance += dist;
    tut.lastPos.x = player.position.x;
    tut.lastPos.z = player.position.z;
  }

  // Осмотр
  if (STEPS[tut.step] && STEPS[tut.step].id === 'look') {
    const dYaw = Math.abs(yaw - tut.lastYaw);
    const dPitch = Math.abs(pitch - tut.lastPitch);
    if (dYaw < 1 && dPitch < 1) tut.lookedAmount += (dYaw + dPitch) * 30;
    tut.lastYaw = yaw;
    tut.lastPitch = pitch;
  } else {
    tut.lastYaw = yaw;
    tut.lastPitch = pitch;
  }

  // Прыжок
  if (STEPS[tut.step] && STEPS[tut.step].id === 'jump') {
    if (player.position.y > 1.2) tut.jumped = true;
  }

  // Дрон
  if (STEPS[tut.step] && STEPS[tut.step].id === 'drone') {
    const currentDrones = API.getDrones().length;
    if (currentDrones < tut.prevDroneCount) tut.killedDrone = true;
    tut.prevDroneCount = currentDrones;
  }

  // Прогресс
  const step = STEPS[tut.step];
  if (step && step.progress) {
    const progressEl = document.getElementById('taskProgress');
    if (progressEl) progressEl.textContent = step.progress(tut);
  }

  if (tut.cooldown > 0) {
    tut.cooldown -= dt;
    return;
  }
  if (!tut.ready) return;
  if (step && step.check && step.check(tut)) nextStep();
}

// ============ СОБЫТИЯ ============
window.addEventListener('game:shoot', () => {
  if (tut.active && tut.ready && STEPS[tut.step] && STEPS[tut.step].id === 'shoot') {
    tut.shotsFired++;
  }
});
window.addEventListener('game:reload', () => {
  if (tut.active && tut.ready && STEPS[tut.step] && STEPS[tut.step].id === 'reload') {
    tut.reloaded = true;
  }
});
window.addEventListener('game:buy', () => {
  if (tut.active && tut.ready && STEPS[tut.step] && STEPS[tut.step].id === 'shop') {
    tut.boughtSomething = true;
  }
});

// ============ ПРОПУСТИТЬ ============
function setupSkipButton() {
  const skip = document.getElementById('taskSkip');
  if (skip) {
    skip.addEventListener('click', () => {
      if (!tut.active) return;
      const step = STEPS[tut.step];
      if (step && step.id !== 'done') {
        tut.cooldown = 0;
        tut.ready = false;
        nextStep();
      }
    });
  }
}

// ============ INIT ============
function initTutorial() {
  const btn = document.getElementById('tutorialBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const api = window.gameAPI;
      if (api) api.sndMenuClick();
      startTutorial();
    });
  }
  setupSkipButton();
  console.log('🎓 tutorial.js загружен');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTutorial);
} else {
  initTutorial();
}

// ============ RAF-хук ============
const _origRAF = window.requestAnimationFrame.bind(window);
let _lastT = performance.now();
window.requestAnimationFrame = function(cb) {
  return _origRAF(function(t) {
    const dt = Math.min((t - _lastT) / 1000, 0.05);
    _lastT = t;
    try { updateTutorial(dt); } catch(e) {}
    cb(t);
  });
};

window.tutorialAPI = { start: startTutorial, state: tut, steps: STEPS };