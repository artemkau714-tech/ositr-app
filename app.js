// ============================================
// ОСНОВНАЯ ЛОГИКА MINI APP
// ============================================

// Безопасное получение Telegram API
const tg = window.Telegram?.WebApp || null;

// Если мы в браузере без Telegram — используем эмуляцию
if (!tg) {
    console.warn('⚠️ Telegram WebApp не найден, используем эмуляцию');
    // Эмулятор уже загружен в emulator.js
}

// Расширяем приложение (если есть Telegram)
try {
    if (tg && tg.expand) tg.expand();
} catch (e) {}

// Получаем данные пользователя
const user = tg?.initDataUnsafe?.user || { 
    id: 123456789, 
    first_name: 'Игрок',
    username: 'player'
};

// Отображаем приветствие
const greetingEl = document.getElementById('user-greeting');
if (greetingEl) {
    greetingEl.textContent = `Привет, ${user.first_name || 'Игрок'}!`;
}

// Адрес бэкенда (для браузера используем localhost)
const API_BASE = window.location.origin + '/api';

// ============================================
// 1. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        const tabId = this.dataset.tab;
        const target = document.getElementById(`tab-${tabId}`);
        if (target) target.classList.add('active');
    });
});

// ============================================
// 2. ЗАПРОСЫ К БЭКЕНДУ
// ============================================
async function callAPI(endpoint, data = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                tg_user_id: user.id,
                tg_username: user.username || 'unknown'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        
        // Показываем уведомление (через Telegram или alert)
        if (tg?.showAlert) {
            tg.showAlert('⚠️ Ошибка связи с сервером. Проверьте, запущен ли бэкенд.');
        } else {
            alert('⚠️ Ошибка связи с сервером\nУбедитесь, что бэкенд запущен: python server.py');
        }
        return null;
    }
}

// ============================================
// 3. ЗАГРУЗКА АДМИНИСТРАТОРОВ
// ============================================
let adminsCache = null;

async function loadAdmins() {
    const listEl = document.getElementById('admins-list');
    const selectEl = document.getElementById('admin-select');
    
    if (!listEl || !selectEl) return;
    
    // Показываем загрузку
    listEl.innerHTML = '<p class="loading">⏳ Загрузка...</p>';
    selectEl.innerHTML = '<option value="">Загрузка...</option>';
    
    const data = await callAPI('/admins');
    
    if (data && data.admins && data.admins.length > 0) {
        adminsCache = data.admins;
        
        // Заполняем список
        listEl.innerHTML = data.admins.map(admin => 
            `<div style="padding:10px;background:var(--tg-theme-secondary-bg-color,#2d2d44);border-radius:8px;margin-bottom:6px;">
                👑 <strong>${admin.name}</strong> — ${admin.role || 'Администратор'}
            </div>`
        ).join('');
        
        // Заполняем select
        selectEl.innerHTML = '<option value="">Выберите администратора...</option>' +
            data.admins.map(admin => 
                `<option value="${admin.id}">${admin.name}</option>`
            ).join('');
    } else {
        listEl.innerHTML = '<p style="color:#f87171;">❌ Не удалось загрузить список администраторов</p>';
        selectEl.innerHTML = '<option value="">❌ Ошибка загрузки</option>';
    }
}

// Загружаем при переходе на вкладки
document.querySelector('[data-tab="admins"]')?.addEventListener('click', loadAdmins);
document.querySelector('[data-tab="rating"]')?.addEventListener('click', loadAdmins);

// ============================================
// 4. СИСТЕМА ОЦЕНКИ (ЗВЁЗДЫ)
// ============================================
let selectedRating = 0;

document.querySelectorAll('.stars span').forEach(star => {
    star.addEventListener('click', function() {
        selectedRating = parseInt(this.dataset.value);
        document.querySelectorAll('.stars span').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating);
        });
    });
});

// ============================================
// 5. ОТПРАВКА ОЦЕНКИ
// ============================================
document.getElementById('submit-rating')?.addEventListener('click', async function() {
    const adminId = document.getElementById('admin-select')?.value;
    const comment = document.getElementById('rating-comment')?.value?.trim() || '';
    const statusEl = document.getElementById('rating-status');
    
    // Валидация
    if (!adminId) {
        const msg = '⚠️ Выберите администратора';
        tg?.showAlert ? tg.showAlert(msg) : alert(msg);
        return;
    }
    
    if (selectedRating === 0) {
        const msg = '⚠️ Поставьте оценку (звёзды)';
        tg?.showAlert ? tg.showAlert(msg) : alert(msg);
        return;
    }
    
    // Блокируем кнопку
    this.disabled = true;
    this.textContent = '⏳ Отправка...';
    if (statusEl) statusEl.textContent = '';
    
    const result = await callAPI('/rating', {
        admin_id: adminId,
        rating: selectedRating,
        comment: comment,
    });
    
    // Разблокируем
    this.disabled = false;
    this.textContent = '📨 Отправить оценку';
    
    if (result?.success) {
        if (statusEl) {
            statusEl.style.color = '#4ade80';
            statusEl.textContent = '✅ Спасибо за вашу оценку!';
        }
        
        // Очищаем форму
        const select = document.getElementById('admin-select');
        if (select) select.value = '';
        document.querySelectorAll('.stars span').forEach(s => s.classList.remove('active'));
        const textarea = document.getElementById('rating-comment');
        if (textarea) textarea.value = '';
        selectedRating = 0;
        
        // Уведомление
        tg?.showAlert ? tg.showAlert('✅ Оценка отправлена!') : alert('✅ Оценка отправлена!');
    } else {
        if (statusEl) {
            statusEl.style.color = '#f87171';
            statusEl.textContent = '❌ Ошибка при отправке. Попробуйте позже.';
        }
    }
});

// ============================================
// 6. ОТКРЫТИЕ ССЫЛОК
// ============================================
function openLink(url) {
    if (tg?.openLink) {
        tg.openLink(url);
    } else {
        window.open(url, '_blank');
    }
}

// ============================================
// 7. ПРИНЯТИЕ ПРАВИЛ
// ============================================
document.getElementById('rules-accept')?.addEventListener('click', function() {
    const msg = '✅ Правила приняты!';
    tg?.showAlert ? tg.showAlert(msg) : alert(msg);
    
    callAPI('/accept_rules', {
        accepted: true,
        timestamp: Date.now()
    });
});

// ============================================
// 8. УВЕДОМЛЕНИЕ О ГОТОВНОСТИ
// ============================================
try {
    if (tg?.ready) tg.ready();
} catch (e) {}

console.log('✅ Mini App загружен (режим:', tg ? 'Telegram' : 'Браузер', ')');
console.log('👤 Пользователь:', user);