class SilenceProxyApp {
    constructor() {
        this.database = new Database();
        this.modalManager = new ModalManager();
        this.pageManager = new PageManager();
        this.subscriptionManager = new SubscriptionManager();
        this.deviceManager = new DeviceManager();
        this.userData = {
            id: 123456789,
            name: '@username',
            paymentMethod: 'Карта •••• 1234'
        };
        
        window.app = this;
    }

    async init() {
        try {
            // Пытаемся инициализировать базу, но не блокируем приложение
            await this.database.init().catch(error => {
                console.warn('Database init failed, continuing without DB:', error);
            });
        } catch (error) {
            console.warn('Database initialization error:', error);
        }

        // Всегда рендерим интерфейс независимо от состояния базы
        this.renderHeader();
        this.renderMain();
        this.setupEventListeners();

        // Пытаемся сохранить данные если база доступна
        this.tryInitializeUserData();
    }

    async tryInitializeUserData() {
        try {
            if (this.database.db) {
                // Проверяем существует ли пользователь перед сохранением
                const existingUser = await this.database.getUser(this.userData.id).catch(() => null);
                if (!existingUser) {
                    await this.database.saveUser(this.userData);
                    const subscription = this.subscriptionManager.getSubscriptionData();
                    await this.database.saveSubscription({
                        userId: this.userData.id,
                        ...subscription
                    });
                    await this.database.logEvent('app_initialized', this.userData.id);
                } else {
                    console.log('User already exists in database');
                }
            }
        } catch (error) {
            console.warn('Failed to save user data:', error);
        }
    }

    renderHeader() {
        const header = document.getElementById('header');
        if (!header) return;
        
        header.innerHTML = `
            <div class="header-content">
                <h1 class="logo">Silence Proxy</h1>
                <button class="profile-btn" id="profile-header-btn">
                    <i class="fas fa-user"></i>
                </button>
            </div>
        `;
    }

    renderMain() {
        const main = document.getElementById('main');
        if (!main) return;
        
        const subscription = this.subscriptionManager.getSubscriptionData();
        
        main.innerHTML = `
            <section class="subscription-card glass">
                <div class="subscription-header">
                    <h2>Ваша подписка</h2>
                    <span class="status-badge active">Активна</span>
                </div>
                
                <div class="subscription-info">
                    <div class="info-item">
                        <span class="label">Устройства</span>
                        <span class="value">${subscription.devices}/${subscription.maxDevices}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Заканчивается</span>
                        <span class="value">${this.formatDate(subscription.endDate)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Трафик</span>
                        <span class="value">${subscription.trafficUsed}</span>
                    </div>
                </div>

                <button class="btn btn-primary btn-large" id="renew-btn">
                    Продлить подписку
                </button>
            </section>

            <div class="actions-grid actions-grid-top">
                <button class="action-btn glass" id="devices-btn">
                    <i class="fas fa-mobile-alt"></i>
                    <span>Устройства</span>
                </button>
                
                <button class="action-btn glass" id="instruction-btn">
                    <i class="fas fa-download"></i>
                    <span>Инструкция</span>
                </button>
            </div>

            <div class="actions-grid actions-grid-bottom">
                <button class="action-btn glass wide-btn" id="support-btn">
                    <i class="fas fa-headset"></i>
                    <span>Поддержка</span>
                </button>
            </div>

            <section class="stats-card glass">
                <h3>Статистика использования</h3>
                <div class="stats-grid">
                    <div class="stat">
                        <div class="stat-value">87%</div>
                        <div class="stat-label">Стабильность соединения</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">24/7</div>
                        <div class="stat-label">Доступность сервиса</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">56 ms</div>
                        <div class="stat-label">Средний пинг</div>
                    </div>
                </div>
            </section>
        `;
    }

    setupEventListeners() {
        // Отложенная инициализация событий
        setTimeout(() => {
            const renewBtn = document.getElementById('renew-btn');
            const instructionBtn = document.getElementById('instruction-btn');
            const profileBtn = document.getElementById('profile-header-btn');
            const supportBtn = document.getElementById('support-btn');
            const devicesBtn = document.getElementById('devices-btn');

            if (renewBtn) renewBtn.addEventListener('click', () => this.pageManager.openSubscription());
            if (instructionBtn) instructionBtn.addEventListener('click', () => this.pageManager.openInstruction());
            if (profileBtn) profileBtn.addEventListener('click', () => this.pageManager.openProfile(this.userData));
            if (supportBtn) supportBtn.addEventListener('click', () => this.pageManager.openSupport());
            if (devicesBtn) devicesBtn.addEventListener('click', () => {
                this.modalManager.openDevices(this.subscriptionManager.currentDevices);
                setTimeout(() => this.deviceManager.setupSlider(), 100);
            });
        }, 100);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    // Скрываем fallback сообщение
    const fallback = document.getElementById('fallback-message');
    if (fallback) {
        setTimeout(() => {
            fallback.style.display = 'none';
        }, 500);
    }

    // Запускаем приложение
    setTimeout(() => {
        new SilenceProxyApp().init();
    }, 100);
});