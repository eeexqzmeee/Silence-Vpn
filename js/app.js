class SilenceProxyApp {
    constructor() {
        this.database = new Database();
        this.modalManager = new ModalManager();
        this.pageManager = new PageManager();
        this.subscriptionManager = new SubscriptionManager();
        this.deviceManager = new DeviceManager();
        this.vpnManager = new VPNManager();
        
        this.userData = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            name: '@username',
            paymentMethod: 'Карта •••• 1234'
        };
        
        window.app = this;
    }

    async init() {
        try {
            await this.database.init().catch(error => {
                console.warn('Database init failed, continuing without DB:', error);
            });
        } catch (error) {
            console.warn('Database initialization error:', error);
        }

        // Проверяем статус подписки
        this.subscriptionManager.checkSubscriptionStatus();

        this.renderHeader();
        this.renderMain();
        this.setupEventListeners();

        // Инициализируем пользователя
        await this.subscriptionManager.initializeUser(this.userData.id, this.userData.name);
        
        // Генерируем начальные конфиги если их нет и подписка активна
        await this.initializeDefaultConfigs();
    }

    async initializeDefaultConfigs() {
        if (this.subscriptionManager.userConfig.active) {
            const masterConfig = JSON.parse(localStorage.getItem('silenceProxy_masterConfig') || 'null');
            
            if (!masterConfig || !this.vpnManager.isConfigValid(masterConfig)) {
                await this.subscriptionManager.generateMasterConfig();
            }
        }
    }

    showFallbackUI() {
        const main = document.getElementById('main');
        if (main) {
            main.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h2>Silence Proxy</h2>
                    <p>Приложение загружено в упрощенном режиме</p>
                    <button class="btn btn-primary" onclick="location.reload()">Перезагрузить</button>
                </div>
            `;
        }
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
        const serverInfo = this.subscriptionManager.getServerInfo();
        
        main.innerHTML = `
            <section class="subscription-card glass">
                <div class="subscription-header">
                    <h2>Ваша подписка</h2>
                    <span class="status-badge ${subscription.active ? 'active' : 'inactive'}">
                        ${subscription.active ? 'Активна' : 'Не активна'}
                    </span>
                </div>

                <div class="subscription-info">
                    <div class="info-item">
                        <span class="label">Статус</span>
                        <span class="value ${subscription.active ? 'active' : 'inactive'}">
                            ${subscription.active ? `✅ Активна (${subscription.daysRemaining} дн.)` : '❌ Не активна'}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="label">Устройства</span>
                        <span class="value">${subscription.devices}/${subscription.maxDevices}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Заканчивается</span>
                        <span class="value">${Helpers.formatDate(subscription.endDate)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Сервер</span>
                        <span class="value">🇳🇱 ${serverInfo ? serverInfo.server.location : 'Netherlands'}</span>
                    </div>
                </div>

                <button class="btn btn-primary btn-large" id="renew-btn">
                    ${subscription.active ? 'Продлить подписку' : 'Активировать подписку'}
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
                        <div class="stat-value">${subscription.active ? '87%' : '0%'}</div>
                        <div class="stat-label">Стабильность</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${subscription.active ? '24/7' : '---'}</div>
                        <div class="stat-label">Доступность</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${subscription.active ? '56 ms' : '---'}</div>
                        <div class="stat-label">Пинг</div>
                    </div>
                </div>
            </section>
        `;

        // Переинициализируем обработчики событий после рендера
        this.setupEventListeners();
    }
    setupEventListeners() {
        // Используем делегирование событий для динамически созданных элементов
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Обработка кнопки продления
            if (target.id === 'renew-btn' || target.closest('#renew-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.pageManager.openSubscription();
                return;
            }
            
            // Обработка кнопки устройств
            if (target.id === 'devices-btn' || target.closest('#devices-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.modalManager.openDevices(this.subscriptionManager.currentDevices);
                setTimeout(() => this.deviceManager.setupSlider(), 100);
                return;
            }
            
            // Обработка кнопки инструкции
            if (target.id === 'instruction-btn' || target.closest('#instruction-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.pageManager.openInstruction();
                return;
            }
            
            // Обработка кнопки поддержки
            if (target.id === 'support-btn' || target.closest('#support-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.pageManager.openSupport();
                return;
            }
        });
    
        // Также оставляем прямые обработчики для надежности
        setTimeout(() => {
            const renewBtn = document.getElementById('renew-btn');
            const instructionBtn = document.getElementById('instruction-btn');
            const profileBtn = document.getElementById('profile-header-btn');
            const supportBtn = document.getElementById('support-btn');
            const devicesBtn = document.getElementById('devices-btn');
        
            if (renewBtn) {
                renewBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.pageManager.openSubscription();
                });
            }
            if (instructionBtn) {
                instructionBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.pageManager.openInstruction();
                });
            }
            if (profileBtn) {
                profileBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.pageManager.openProfile(this.userData);
                });
            }
            if (supportBtn) {
                supportBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.pageManager.openSupport();
                });
            }
            if (devicesBtn) {
                devicesBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.modalManager.openDevices(this.subscriptionManager.currentDevices);
                    setTimeout(() => this.deviceManager.setupSlider(), 100);
                });
            }
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