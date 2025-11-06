class TelegramIntegration {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.init();
    }

    init() {
        // Инициализация Telegram Web App
        this.tg.expand();
        this.tg.enableClosingConfirmation();
        
        // Установка цветовой схемы для темной темы
        this.tg.setHeaderColor('#8243D6');
        this.tg.setBackgroundColor('#0f0f0f');
        
        // Принудительно устанавливаем темную тему
        this.tg.setParams({
            theme: 'dark',
            theme_params: {
                bg_color: '#0f0f0f',
                text_color: '#ffffff',
                hint_color: '#b0b0b0',
                link_color: '#8243D6',
                button_color: '#8243D6',
                button_text_color: '#ffffff'
            }
        });
        
        this.bindTelegramEvents();
    }

    bindTelegramEvents() {
        // Обработка событий Telegram
        this.tg.onEvent('viewportChanged', this.handleViewportChange);
    }

    handleViewportChange(event) {
        console.log('Viewport changed:', event);
    }

    // Методы для работы с Telegram API
    showAlert(message) {
        this.tg.showAlert(message);
    }

    showConfirm(message, callback) {
        this.tg.showConfirm(message, callback);
    }

    // Закрытие приложения
    closeApp() {
        this.tg.close();
    }
}

// Инициализация Telegram интеграции
const telegramApp = new TelegramIntegration();