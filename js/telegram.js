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
        
        // Отключаем применение темы Telegram для нашего дизайна
        this.ignoreTelegramTheme();
        
        console.log('Telegram Web App initialized:', {
            version: this.tg.version,
            platform: this.tg.platform
        });
    }

    ignoreTelegramTheme() {
        // Добавляем класс чтобы отключить тему Telegram
        document.body.classList.add('ignore-telegram-theme');
        
        // Принудительно устанавливаем наши цвета
        this.forceOurColors();
    }

    forceOurColors() {
        const style = document.documentElement.style;
        
        // Явно задаем наши цвета, переопределяя тему Telegram
        style.setProperty('--background', '#0A0A12', 'important');
        style.setProperty('--card-bg', '#151521', 'important');
        style.setProperty('--text', '#ffffff', 'important');
        style.setProperty('--text-light', '#B0B0C0', 'important');
        style.setProperty('--border', '#2A2A3A', 'important');
        style.setProperty('--primary', '#6A4CDF', 'important');
        style.setProperty('--primary-light', '#7D5FE8', 'important');
        style.setProperty('--primary-dark', '#5A3FC8', 'important');
        
        // Применяем к body
        document.body.style.backgroundColor = '#0A0A12';
        document.body.style.color = '#ffffff';
    }

    // Безопасные методы для работы с Telegram API
    showAlert(message) {
        try {
            this.tg.showAlert(message);
        } catch (e) {
            alert(message);
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

    closeApp() {
        try {
            this.tg.close();
        } catch (e) {
            console.log('Close app requested');
        }
    }

    getUserData() {
        return this.tg.initDataUnsafe?.user || null;
    }

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