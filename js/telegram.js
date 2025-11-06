// Интеграция с Telegram Web App
class TelegramIntegration {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.init();
    }

    init() {
        // Базовая инициализация - только поддерживаемые функции
        this.tg.expand();
        this.tg.ready();
        
        // Применяем тему Telegram
        this.applyTelegramTheme();
        
        console.log('Telegram Web App initialized:', {
            version: this.tg.version,
            platform: this.tg.platform,
            themeParams: this.tg.themeParams
        });
    }

    applyTelegramTheme() {
        // Используем тему Telegram из themeParams
        if (this.tg.themeParams) {
            this.applyTheme(this.tg.themeParams);
        }
        
        // Слушаем изменения темы
        this.tg.onEvent('themeChanged', (themeParams) => {
            this.applyTheme(themeParams);
        });
    }

    applyTheme(themeParams) {
        const style = document.documentElement.style;
        
        // Применяем цвета из темы Telegram
        if (themeParams.bg_color) {
            style.setProperty('--background', themeParams.bg_color);
            document.body.style.backgroundColor = themeParams.bg_color;
        }
        
        if (themeParams.text_color) {
            style.setProperty('--text', themeParams.text_color);
        }
        
        if (themeParams.hint_color) {
            style.setProperty('--text-light', themeParams.hint_color);
        }
        
        if (themeParams.button_color) {
            style.setProperty('--primary', themeParams.button_color);
            style.setProperty('--primary-light', this.lightenColor(themeParams.button_color, 20));
            style.setProperty('--primary-dark', this.darkenColor(themeParams.button_color, 20));
        }
        
        if (themeParams.button_text_color) {
            // Обновляем цвет текста кнопок
            document.querySelectorAll('.btn-primary, .subscribe-btn').forEach(btn => {
                btn.style.color = themeParams.button_text_color;
            });
        }
        
        if (themeParams.secondary_bg_color) {
            style.setProperty('--card-bg', themeParams.secondary_bg_color);
        }
    }

    // Вспомогательные функции для работы с цветами
    lightenColor(color, percent) {
        // Упрощенная функция для осветления цвета
        return color; // В реальном приложении можно добавить логику осветления
    }

    darkenColor(color, percent) {
        // Упрощенная функция для затемнения цвета
        return color; // В реальном приложении можно добавить логику затемнения
    }

    // Безопасные методы для работы с Telegram API
    showAlert(message) {
        try {
            this.tg.showAlert(message);
        } catch (e) {
            alert(message); // Fallback
        }
    }

    showConfirm(message, callback) {
        try {
            this.tg.showConfirm(message, callback);
        } catch (e) {
            if (confirm(message)) {
                callback(true);
            }
        }
    }

    // Закрытие приложения
    closeApp() {
        try {
            this.tg.close();
        } catch (e) {
            console.log('Close app requested');
        }
    }

    // Получение данных пользователя
    getUserData() {
        return this.tg.initDataUnsafe?.user || null;
    }

    // Проверка темной темы
    isDarkTheme() {
        return this.tg.colorScheme === 'dark';
    }
}

// Безопасная инициализация
let telegramApp;

try {
    telegramApp = new TelegramIntegration();
} catch (error) {
    console.log('Telegram Web App not available, using fallback mode');
    telegramApp = {
        showAlert: (msg) => alert(msg),
        showConfirm: (msg, cb) => { if (confirm(msg)) cb(true); },
        closeApp: () => console.log('Close app'),
        getUserData: () => null,
        isDarkTheme: () => true
    };
}