// ============ АВТОПОВОРОТ В ЛАНДШАФТ ============
// Работает на Android Chrome. На iOS показывает оверлей "поверни телефон".

const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 ||
                /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

// ============ ОБНОВЛЕНИЕ ОВЕРЛЕЯ ============
function updateOrientationOverlay() {
  if (!isTouch) return;

  const overlay = document.getElementById('rotateOverlay');
  if (!overlay) return;

  const isPortrait = window.innerHeight > window.innerWidth;

  if (isPortrait) {
    overlay.classList.add('show');
  } else {
    overlay.classList.remove('show');
  }
}

// ============ БЛОКИРОВКА ЛАНДШАФТА ============
async function lockLandscape() {
  if (!isTouch) return;

  try {
    // Сначала fullscreen — без него блокировка не работает
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } else if (document.documentElement.webkitRequestFullscreen) {
      await document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      await document.documentElement.mozRequestFullScreen();
    }

    // Теперь блокируем ориентацию на ландшафт
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
    } else if (screen.lockOrientation) {
      await screen.lockOrientation('landscape');
    } else if (screen.mozLockOrientation) {
      screen.mozLockOrientation('landscape');
    }
  } catch (e) {
    // Браузер может отказать — не критично
    console.log('Ландшафт не удалось заблокировать:', e.message);
  }
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
function initOrientation() {
  if (!isTouch) return;

  // Слушаем изменения размера и ориентации
  window.addEventListener('resize', updateOrientationOverlay);
  window.addEventListener('orientationchange', () => {
    setTimeout(updateOrientationOverlay, 200);
  });

  // Первичная проверка
  updateOrientationOverlay();
}

// ============ АВТОЗАПУСК ============
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onReady);
} else {
  onReady();
}

function onReady() {
  initOrientation();

  // Вешаем блокировку ландшафта на кнопку Play
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', lockLandscape);
  }
}

// Экспорт для использования из game.js
export { lockLandscape as tryLockLandscape, initOrientation };
window.tryLockLandscape = lockLandscape;