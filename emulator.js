// ============================================
// ЭМУЛЯТОР TELEGRAM WEBAPP ДЛЯ БРАУЗЕРА
// ============================================

if (typeof window.Telegram === 'undefined') {
    console.log('🔧 Эмулятор Telegram WebApp активирован (режим разработки)');
    
    window.Telegram = {
        WebApp: {
            // Основные методы
            initData: '',
            initDataUnsafe: {
                user: {
                    id: 123456789,
                    first_name: 'Тестер',
                    last_name: '',
                    username: 'tester',
                    language_code: 'ru'
                }
            },
            version: '7.0',
            platform: 'web',
            colorScheme: 'dark',
            themeParams: {
                bg_color: '#1a1a2e',
                text_color: '#e0e0e0',
                hint_color: '#888888',
                link_color: '#6c5ce7',
                button_color: '#6c5ce7',
                button_text_color: '#ffffff',
                secondary_bg_color: '#2d2d44'
            },
            
            // Методы
            expand: function() {
                console.log('📱 WebApp expanded');
                document.body.style.height = '100vh';
            },
            
            ready: function() {
                console.log('✅ WebApp ready');
            },
            
            showAlert: function(message, callback) {
                alert(message);
                if (callback) callback();
            },
            
            showConfirm: function(message, callback) {
                const result = confirm(message);
                if (callback) callback(result);
            },
            
            openLink: function(url) {
                window.open(url, '_blank');
            },
            
            close: function() {
                console.log('❌ WebApp закрыт');
                window.close();
            },
            
            sendData: function(data) {
                console.log('📤 Данные отправлены:', data);
            },
            
            // События
            onEvent: function(event, callback) {
                console.log(`📡 Событие ${event} зарегистрировано`);
            },
            
            offEvent: function(event, callback) {
                console.log(`📡 Событие ${event} отключено`);
            }
        }
    };
    
    // Добавляем CSS-переменные для эмуляции темы Telegram
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --tg-theme-bg-color: #1a1a2e;
            --tg-theme-text-color: #e0e0e0;
            --tg-theme-hint-color: #888888;
            --tg-theme-link-color: #6c5ce7;
            --tg-theme-button-color: #6c5ce7;
            --tg-theme-button-text-color: #ffffff;
            --tg-theme-secondary-bg-color: #2d2d44;
            --tg-theme-accent-text-color: #6c5ce7;
        }
    `;
    document.head.appendChild(style);
    
    // Добавляем кнопку-подсказку внизу экрана (режим разработки)
    const devBanner = document.createElement('div');
    devBanner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #6c5ce7;
        color: white;
        text-align: center;
        padding: 8px;
        font-size: 12px;
        font-family: monospace;
        z-index: 9999;
        opacity: 0.8;
    `;
    devBanner.textContent = '🔧 Режим разработки (эмуляция Telegram)';
    document.body.appendChild(devBanner);
}