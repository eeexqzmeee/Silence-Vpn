const API_BASE_URL = 'https://your-hosting.com/api'; // Замените на ваш домен

class APIService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async registerUser(telegramUser) {
        return this.request('/users/register', {
            method: 'POST',
            body: JSON.stringify({
                telegramId: telegramUser.id,
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name,
                username: telegramUser.username
            })
        });
    }

    async createConfig(userId, deviceName, serverId = 1) {
        return this.request('/configs/create', {
            method: 'POST',
            body: JSON.stringify({ userId, deviceName, serverId })
        });
    }

    async getUserConfigs(userId) {
        return this.request(`/users/${userId}/configs`);
    }

    async deactivateConfig(configId) {
        return this.request(`/configs/${configId}/deactivate`, {
            method: 'POST'
        });
    }

    async getUserSubscription(userId) {
        return this.request(`/users/${userId}/subscription`);
    }

    async upgradeSubscription(userId, plan, period, devices) {
        return this.request('/subscriptions/upgrade', {
            method: 'POST',
            body: JSON.stringify({ userId, plan, period, devices })
        });
    }

    async getServers() {
        return this.request('/servers');
    }
}

// Обновляем класс SilenceProxyApp:
class SilenceProxyApp {
    constructor() {
        this.api = new APIService();
        this.currentUser = null;
        this.userSubscription = null;
        this.init();
    }

    async init() {
        try {
            // Инициализируем пользователя через API
            await this.initializeUser();
            
            // Остальная инициализация
            this.setupFallbackStyles();
            this.setupLightEffects();
            this.renderMainPage();
            this.bindEvents();
            this.addScrollEffects();
            
        } catch (error) {
            console.error('App initialization failed:', error);
            // Фолбэк режим
            this.setupFallbackStyles();
            this.setupLightEffects();
            this.renderMainPage();
            this.bindEvents();
            this.addScrollEffects();
        }
    }

    async initializeUser() {
        try {
            const telegramUser = telegramApp.getUserData();
            if (telegramUser) {
                const response = await this.api.registerUser(telegramUser);
                if (response.success) {
                    this.currentUser = response.user;
                    this.userSubscription = response.subscription;
                    console.log('User initialized via API:', this.currentUser);
                }
            }
        } catch (error) {
            console.error('API initialization failed:', error);
            // Создаем демо пользователя
            this.currentUser = {
                id: Date.now(),
                firstName: 'Demo',
                lastName: 'User',
                username: 'demo_user'
            };
        }
    }

    // Обновляем методы для работы с API:

    async generateNewConfig(deviceName = 'My Device') {
        try {
            if (!this.currentUser) {
                throw new Error('User not initialized');
            }

            const response = await this.api.createConfig(this.currentUser.id, deviceName);
            
            if (response.success) {
                this.showNotification(`✅ Конфиг для "${deviceName}" создан!`);
                return response.config;
            } else {
                throw new Error(response.error);
            }

        } catch (error) {
            this.showNotification(`❌ Ошибка: ${error.message}`);
            return null;
        }
    }

    async getUserConfigs() {
        if (!this.currentUser) return [];
        try {
            const response = await this.api.getUserConfigs(this.currentUser.id);
            return response.success ? response.configs : [];
        } catch (error) {
            console.error('Error getting user configs:', error);
            return [];
        }
    }

    async deactivateConfig(configId) {
        try {
            const response = await this.api.deactivateConfig(configId);
            if (response.success) {
                this.showNotification('🔴 Конфиг деактивирован');
                return true;
            }
            return false;
        } catch (error) {
            this.showNotification('❌ Ошибка деактивации конфига');
            return false;
        }
    }

    async loadUserSubscription() {
        if (!this.currentUser) return null;
        
        try {
            const response = await this.api.getUserSubscription(this.currentUser.id);
            if (response.success) {
                this.userSubscription = response.subscription;
                return response;
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
        }
        
        return null;
    }

    // Обновляем renderProfilePage для использования API данных
    async renderProfilePage() {
        const content = document.getElementById('profile-content');
        
        if (!this.currentUser) {
            content.innerHTML = '<p>Пользователь не найден</p>';
            return;
        }

        // Загружаем актуальные данные
        const subscriptionData = await this.loadUserSubscription();
        const userConfigs = await this.getUserConfigs();

        // ... остальной код renderProfilePage без изменений
        // (используйте subscriptionData и userConfigs)
    }

    // Добавляем метод для обновления подписки через API
    async processPayment() {
        const amount = this.calculatePrice(this.selectedPeriod, this.selectedDevices);
        
        try {
            const response = await this.api.upgradeSubscription(
                this.currentUser.id,
                'premium', // или выбранный план
                this.selectedPeriod,
                this.selectedDevices
            );

            if (response.success) {
                this.showNotification('✅ Подписка успешно активирована!');
                this.userSubscription = response.subscription;
                this.showPage('main-page');
            }
        } catch (error) {
            this.showNotification('❌ Ошибка активации подписки');
        }
    }
}

let db;
let configGenerator;

// Инициализация БД
async function initDatabase() {
    try {
        // Простая заглушка для демо - в реальности используйте db.js
        console.log('Database initialized (demo mode)');
        return {
            saveUser: (user) => Promise.resolve(user),
            getUser: (id) => Promise.resolve(null),
            saveSubscription: (sub) => Promise.resolve(sub),
            getSubscription: (id) => Promise.resolve(null),
            saveConfig: (config) => Promise.resolve(config),
            getUserConfigs: (id) => Promise.resolve([]),
            getActiveConfigs: (id) => Promise.resolve([]),
            deactivateConfig: (id) => Promise.resolve(true)
        };
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return null;
    }
}

// Заглушка ConfigGenerator если файл не подключен
if (typeof ConfigGenerator === 'undefined') {
    class ConfigGenerator {
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        
        async generateDeviceConfig(userId, deviceName) {
            const uuid = this.generateUUID();
            return {
                vless: `vless://${uuid}@vpn.silenceproxy.com:443?type=quic&encryption=none&security=tls&sni=vpn.silenceproxy.com&fp=chrome&flow=xtls-rprx-vision#${encodeURIComponent(deviceName)}`,
                metadata: {
                    id: Date.now(),
                    userId: userId,
                    deviceId: 'device_' + Date.now(),
                    deviceName: deviceName,
                    uuid: uuid,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastUsed: new Date().toISOString()
                }
            };
        }
        
        async getUserConfigs(userId) {
            // Демо данные
            return [
                {
                    id: 1,
                    userId: userId,
                    deviceName: 'Мой телефон',
                    uuid: '12345678-1234-1234-1234-123456789012',
                    createdAt: new Date().toISOString(),
                    isActive: true
                }
            ];
        }
        
        async deactivateConfig(configId) {
            return true;
        }
    }
}

class SilenceProxyApp {
    constructor() {
        this.db = null;
        this.subscriptionManager = null;
        this.currentUser = null;
        this.configGenerator = null;
        this.init();
    }

    async init() {
        try {
            // Инициализируем БД
            this.db = await initDatabase();
            this.subscriptionManager = new SubscriptionManager();
            this.configGenerator = new ConfigGenerator();
            
            // Инициализируем пользователя
            await this.initializeUser();
            
            // Остальная инициализация
            this.setupFallbackStyles();
            this.setupLightEffects();
            this.renderMainPage();
            this.bindEvents();
            this.addScrollEffects();
            
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('App initialization failed:', error);
            // Фолбэк режим
            this.setupFallbackStyles();
            this.setupLightEffects();
            this.renderMainPage();
            this.bindEvents();
            this.addScrollEffects();
        }
    }

    async initializeUser() {
        try {
            const telegramUser = telegramApp.getUserData();
            if (telegramUser && this.subscriptionManager) {
                const { user, subscription } = await this.subscriptionManager.initializeUser(telegramUser);
                this.currentUser = user;
                console.log('User initialized:', user);
            } else {
                // Создаем временного пользователя для демо
                this.currentUser = {
                    id: Date.now(),
                    firstName: 'Demo',
                    lastName: 'User',
                    username: 'demo_user'
                };
                console.log('Demo user created');
            }
        } catch (error) {
            console.error('User initialization failed:', error);
            // Создаем демо пользователя
            this.currentUser = {
                id: Date.now(),
                firstName: 'Demo',
                lastName: 'User', 
                username: 'demo_user'
            };
        }
    }

    // НОВЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С КОНФИГАМИ:

    async generateNewConfig(deviceName = 'My Device') {
        try {
            if (!this.currentUser) {
                throw new Error('User not initialized');
            }

            const config = await this.subscriptionManager.createNewConfig(
                this.currentUser.id, 
                deviceName
            );

            this.showNotification(`✅ Конфиг для "${deviceName}" создан!`);
            return config;

        } catch (error) {
            this.showNotification(`❌ Ошибка: ${error.message}`);
            return null;
        }
    }

    async getUserConfigs() {
        if (!this.currentUser || !this.configGenerator) return [];
        try {
            return await this.configGenerator.getUserConfigs(this.currentUser.id);
        } catch (error) {
            console.error('Error getting user configs:', error);
            return [];
        }
    }

    async deactivateConfig(configId) {
        try {
            await this.configGenerator.deactivateConfig(configId);
            this.showNotification('🔴 Конфиг деактивирован');
            return true;
        } catch (error) {
            this.showNotification('❌ Ошибка деактивации конфига');
            return false;
        }
    }

    // ОБНОВЛЯЕМ метод renderProfilePage:

    async renderProfilePage() {
        const content = document.getElementById('profile-content');
        
        if (!this.currentUser) {
            content.innerHTML = '<p>Пользователь не найден</p>';
            return;
        }

        // Получаем данные подписки
        let subscriptionData;
        try {
            subscriptionData = await this.subscriptionManager.getSubscriptionData(this.currentUser.id);
        } catch (error) {
            subscriptionData = this.subscriptionManager.getDefaultSubscription();
        }

        // Получаем конфиги устройств
        const userConfigs = await this.getUserConfigs();

        content.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    ${this.currentUser.firstName?.charAt(0) || 'U'}
                </div>
                <div class="user-details">
                    <h2>${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}</h2>
                    <p>${this.currentUser.username ? `@${this.currentUser.username}` : 'Telegram User'}</p>
                </div>
            </div>

            <div class="profile-section">
                <h3 class="section-title">Статус подписки</h3>
                <div class="traffic-stats">
                    <div class="traffic-item">
                        <div class="traffic-label">Статус</div>
                        <div class="traffic-value" style="color: ${subscriptionData.hasActiveSubscription ? '#4CAF50' : '#f44336'}">
                            ${subscriptionData.hasActiveSubscription ? 'Активна' : 'Неактивна'}
                        </div>
                    </div>
                    <div class="traffic-item">
                        <div class="traffic-label">Тариф</div>
                        <div class="traffic-value">${subscriptionData.plan}</div>
                    </div>
                    <div class="traffic-item">
                        <div class="traffic-label">Действует до</div>
                        <div class="traffic-value">${subscriptionData.expiresAt}</div>
                    </div>
                </div>
            </div>

            <div class="profile-section">
                <h3 class="section-title">Использование</h3>
                <div class="traffic-stats">
                    <div class="traffic-item">
                        <div class="traffic-label">Трафик</div>
                        <div class="traffic-value">${subscriptionData.usedTraffic} / ${subscriptionData.totalTraffic}</div>
                        ${subscriptionData.totalTraffic !== '∞' ? `
                            <div class="traffic-progress">
                                <div class="traffic-progress-bar" style="width: ${subscriptionData.trafficPercentage}%"></div>
                            </div>
                        ` : '<div class="traffic-progress"><div class="traffic-progress-bar" style="width: 0%"></div></div>'}
                    </div>
                    <div class="traffic-item">
                        <div class="traffic-label">Устройства</div>
                        <div class="traffic-value">${subscriptionData.devicesUsed} / ${subscriptionData.maxDevices}</div>
                        <div class="traffic-progress">
                            <div class="traffic-progress-bar" style="width: ${Math.round((subscriptionData.devicesUsed / subscriptionData.maxDevices) * 100)}%"></div>
                        </div>
                    </div>
                    ${subscriptionData.daysLeft > 0 ? `
                        <div class="traffic-item">
                            <div class="traffic-label">Дней осталось</div>
                            <div class="traffic-value">${subscriptionData.daysLeft}</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="profile-section">
                <h3 class="section-title">Мои устройства (${userConfigs.length}/${subscriptionData.maxDevices})</h3>
                <div class="config-section">
                    ${userConfigs.length > 0 ? this.renderDevicesList(userConfigs) : '<p style="text-align: center; color: var(--text-light); padding: 20px;">Нет активных устройств</p>'}
                    
                    ${subscriptionData.hasActiveSubscription && subscriptionData.devicesUsed < subscriptionData.maxDevices ? `
                        <div style="margin-top: 16px;">
                            <button class="btn-primary" onclick="app.addNewDevice()" style="width: 100%;">
                                ➕ Добавить устройство
                            </button>
                        </div>
                    ` : ''}
                    
                    ${!subscriptionData.hasActiveSubscription ? `
                        <div style="margin-top: 16px; text-align: center;">
                            <p style="color: var(--text-light); margin-bottom: 12px;">Для добавления устройств нужна активная подписка</p>
                            <button class="btn-primary" onclick="app.showPage('subscription-page')" style="width: 100%;">
                                💎 Оформить подписку
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="profile-section">
                <h3 class="section-title">Информация о сервере</h3>
                <div class="config-section">
                    <div class="config-item">
                        <div class="config-label">Сервер</div>
                        <div class="config-value">vpn.silenceproxy.com</div>
                    </div>
                    <div class="config-item">
                        <div class="config-label">Порт</div>
                        <div class="config-value">443</div>
                    </div>
                    <div class="config-item">
                        <div class="config-label">Протокол</div>
                        <div class="config-value">VLESS + QUIC + TLS</div>
                    </div>
                    <div class="config-item">
                        <div class="config-label">Шифрование</div>
                        <div class="config-value">XTLS Vision</div>
                    </div>
                </div>
            </div>

            <div class="profile-actions">
                <button class="btn-primary" onclick="app.showPage('support-page')">💬 Поддержка</button>
            </div>
        `;
    }

    // ДОБАВЛЯЕМ новый метод renderDevicesList:

    renderDevicesList(configs) {
        return `
            <div class="devices-list">
                ${configs.map(config => `
                    <div class="device-item">
                        <div class="device-info">
                            <div class="device-name">${config.deviceName}</div>
                            <div class="device-last-active">
                                Создан: ${new Date(config.createdAt).toLocaleDateString('ru-RU')}
                            </div>
                            <div class="device-uuid" style="font-size: 10px; color: var(--text-light); margin-top: 4px;">
                                ${config.uuid.substring(0, 8)}...
                            </div>
                        </div>
                        <div class="device-actions">
                            <button class="copy-btn small" onclick="app.copyConfig('${config.uuid}')" title="Скопировать конфиг">
                                📋
                            </button>
                            <button class="btn-secondary small" onclick="app.deactivateDevice('${config.id}')" title="Удалить устройство">
                                🗑️
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ДОБАВЛЯЕМ новые методы для работы с устройствами:

    async addNewDevice() {
        const deviceName = prompt('Введите название устройства:', `Устройство ${new Date().toLocaleDateString('ru-RU')}`);
        if (deviceName && deviceName.trim()) {
            const config = await this.generateNewConfig(deviceName.trim());
            if (config) {
                // Обновляем страницу профиля
                await this.renderProfilePage();
            }
        }
    }

    async copyConfig(uuid) {
        try {
            const configs = await this.getUserConfigs();
            const config = configs.find(c => c.uuid === uuid);
            
            if (config) {
                const vlessLink = `vless://${config.uuid}@vpn.silenceproxy.com:443?type=quic&encryption=none&security=tls&sni=vpn.silenceproxy.com&fp=chrome&flow=xtls-rprx-vision#${encodeURIComponent(config.deviceName)}`;
                
                await navigator.clipboard.writeText(vlessLink);
                this.showNotification('✅ Конфиг скопирован в буфер обмена');
            }
        } catch (error) {
            this.showNotification('❌ Ошибка копирования конфига');
        }
    }

    async deactivateDevice(configId) {
        const confirmed = confirm('Вы уверены, что хотите удалить это устройство?\nЭто действие нельзя отменить.');
        if (confirmed) {
            const success = await this.deactivateConfig(configId);
            if (success) {
                // Обновляем страницу профиля
                await this.renderProfilePage();
            }
        }
    }

    createDynamicRays() {
        const lightRays = document.querySelector('.light-rays');
        
        for (let i = 0; i < 3; i++) {
            const ray = document.createElement('div');
            ray.className = 'ray';
            
            const width = 150 + Math.random() * 200;
            const delay = Math.random() * 8;
            const duration = 8 + Math.random() * 8;
            const top = Math.random() * 100;
            
            ray.style.cssText = `
                width: ${width}px;
                height: 1px;
                top: ${top}%;
                left: -${width}px;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
                opacity: ${0.1 + Math.random() * 0.1};
            `;
            
            lightRays.appendChild(ray);
        }
    }

    setupFallbackStyles() {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        if (!computedStyle.getPropertyValue('--primary').trim()) {
            root.style.setProperty('--primary', '#6A4CDF');
            root.style.setProperty('--primary-light', '#7D5FE8');
            root.style.setProperty('--primary-dark', '#5A3FC8');
            root.style.setProperty('--background', '#0A0A12');
            root.style.setProperty('--text', '#ffffff');
            root.style.setProperty('--text-light', '#B0B0C0');
        }
    }

    // Навигация по страницам
    showPage(pageId) {
        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Показываем нужную страницу
        document.getElementById(pageId).classList.add('active');
        
        // Рендерим контент если нужно
        if (pageId === 'profile-page') {
            this.renderProfilePage();
        } else if (pageId === 'subscription-page') {
            this.renderSubscriptionPage();
        } else if (pageId === 'devices-page') {
            this.renderDevicesPage();
        } else if (pageId === 'vpn-setup-page') {
            this.renderVpnSetupPage();
        } else if (pageId === 'support-page') {
            this.renderSupportPage();
        } else if (pageId === 'sbp-page') {
            this.renderSbpPage();
        }
    }

    // Главная страница
    renderMainPage() {
        this.renderSubscription();
        this.renderActions();
        this.renderAdvantages();
    }

    renderSubscription() {
        const section = document.getElementById('subscription-section');
        const subscriptionData = this.subscriptionManager.getSubscriptionData();
        
        section.innerHTML = `
            <div class="subscription-card card">
                ${subscriptionData.hasActiveSubscription ? this.renderActiveSubscription(subscriptionData) : this.renderNoSubscription()}
            </div>
        `;
    }

    renderActiveSubscription(data) {
        return `
            <div class="subscription-status">
                <div class="status-icon active">🔒</div>
                <div class="status-info">
                    <div class="status-title">Премиум подписка</div>
                    <div class="status-subtitle">Активна до ${data.expiresAt}</div>
                </div>
                <div class="status-badge active">Active</div>
            </div>
            
            <div class="subscription-stats">
                <div class="stat-item">
                    <div class="stat-label">Трафик</div>
                    <div class="stat-value">${data.usedTraffic}/${data.totalTraffic}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Устройства</div>
                    <div class="stat-value">${data.devicesUsed}/${data.maxDevices}</div>
                </div>
            </div>
        `;
    }

    renderNoSubscription() {
        return `
            <div class="no-subscription">
                <div class="icon">🔒</div>
                <h3>Нет активной подписки</h3>
                <p>Подключите подписку для доступа ко всем функциям VPN</p>
            </div>
        `;
    }

    renderActions() {
        const section = document.getElementById('actions-section');
        const subscriptionData = this.subscriptionManager.getSubscriptionData();
        
        section.innerHTML = `
            <div class="actions-grid">
                <div class="main-actions">
                    <button class="action-btn" onclick="app.showPage('subscription-page')">
                        <div class="action-icon">💎</div>
                        <div class="action-content">
                            <div class="action-text">${subscriptionData.hasActiveSubscription ? 'Продлить подписку' : 'Подключить подписку'}</div>
                            <div class="action-description">${subscriptionData.hasActiveSubscription ? 'Продлите доступ к премиум функциям' : 'Получите доступ ко всем функциям VPN'}</div>
                        </div>
                    </button>
                    
                    <button class="action-btn" onclick="app.showPage('devices-page')">
                        <div class="action-icon">📱</div>
                        <div class="action-content">
                            <div class="action-text">Управление устройствами</div>
                            <div class="action-description">Настройка количества устройств</div>
                        </div>
                    </button>
                </div>
                
                <div class="secondary-actions">
                    <button class="action-btn" onclick="app.showPage('vpn-setup-page')">
                        <div class="action-icon">⚙️</div>
                        <div class="action-content">
                            <div class="action-text">Настройка VPN</div>
                            <div class="action-description">Инструкция по установке</div>
                        </div>
                    </button>
                    
                    <button class="action-btn" onclick="app.showPage('support-page')">
                        <div class="action-icon">💬</div>
                        <div class="action-content">
                            <div class="action-text">Поддержка</div>
                            <div class="action-description">FAQ и помощь</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }

    renderAdvantages() {
        const section = document.getElementById('advantages-section');
        section.innerHTML = `
            <h3 class="section-title">Наши преимущества</h3>
            <div class="advantages-grid">
                <div class="advantage-card">
                    <div class="advantage-icon">🚀</div>
                    <div class="advantage-content">
                        <div class="advantage-title">Высокая скорость</div>
                        <div class="advantage-description">Без ограничений для комфортного серфинга</div>
                    </div>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">🛡️</div>
                    <div class="advantage-content">
                        <div class="advantage-title">Конфиденциальность</div>
                        <div class="advantage-description">Ваши данные под надежной защитой</div>
                    </div>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">🚫</div>
                    <div class="advantage-content">
                        <div class="advantage-title">Блокировщик рекламы</div>
                        <div class="advantage-description">Встроенная защита от рекламы</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Страница профиля
    renderProfilePage() {
        const content = document.getElementById('profile-content');
        const userData = telegramApp.getUserData();
        const subscriptionData = this.subscriptionManager.getSubscriptionData();
        
        content.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    ${userData ? userData.first_name?.charAt(0) || 'U' : 'U'}
                </div>
                <div class="user-details">
                    <h2>${userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Пользователь' : 'Пользователь'}</h2>
                    <p>${userData?.username ? `@${userData.username}` : 'Telegram User'}</p>
                </div>
            </div>

            <div class="profile-section">
                <h3 class="section-title">Статистика использования</h3>
                <div class="traffic-stats">
                    <div class="traffic-item">
                        <div class="traffic-label">Использовано трафика</div>
                        <div class="traffic-value">${subscriptionData.usedTraffic}</div>
                        <div class="traffic-progress">
                            <div class="traffic-progress-bar" style="width: ${subscriptionData.trafficPercentage}%"></div>
                        </div>
                    </div>
                    <div class="traffic-item">
                        <div class="traffic-label">Всего доступно</div>
                        <div class="traffic-value">${subscriptionData.totalTraffic}</div>
                    </div>
                </div>
            </div>

            <div class="profile-section">
                <h3 class="section-title">Конфигурация</h3>
                <div class="config-section">
                    <div class="config-item">
                        <div class="config-label">Конфигурационная ссылка</div>
                        <div class="config-value" id="config-link">https://proxy.silencevpn.com/config/${userData?.id || 'default'}</div>
                        <button class="copy-btn" onclick="app.copyConfigLink()">📋 Копировать</button>
                    </div>
                </div>
            </div>

            <div class="profile-actions">
                <button class="btn-primary" onclick="app.showPage('support-page')">📞 Поддержка</button>
            </div>
        `;
    }

    // Страница устройств
    renderDevicesPage() {
        const content = document.getElementById('devices-content');
        const subscriptionData = this.subscriptionManager.getSubscriptionData();
        
        content.innerHTML = `
            <div class="devices-selector">
                <h3>Выберите количество устройств</h3>
                <div class="devices-grid">
                    ${[1, 2, 3, 4, 5].map(devices => `
                        <div class="device-option ${devices === this.selectedDevices ? 'selected' : ''}" 
                             onclick="app.selectDevicesCount(${devices})">
                            <div class="device-count">${devices}</div>
                            <div class="device-price">${devices === 1 ? '100₽/мес' : `+${this.calculateAdditionalPrice(1, devices)}₽/мес`}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="price-explanation">
                    <p>💡 Первое устройство - 100₽/мес, каждое дополнительное - +50₽/мес</p>
                </div>
            </div>

            <div class="devices-info">
                <div class="devices-stats">
                    <span>Текущий лимит: ${subscriptionData.maxDevices} устройств</span>
                </div>
            </div>

            <div class="page-actions">
                <button class="btn-primary" onclick="app.saveDevicesSettings()">Сохранить</button>
            </div>
        `;
    }

    // Страница подписки
    renderSubscriptionPage() {
        const content = document.getElementById('subscription-content');
        const currentPrice = this.calculatePrice(this.selectedPeriod, this.selectedDevices);
        const basePrice = 100;
        const additionalPrice = this.selectedDevices > 1 ? (this.selectedDevices - 1) * 50 * this.selectedPeriod : 0;
        
        content.innerHTML = `
            <div class="devices-info">
                <div class="devices-stats">
                    <span>Выбрано устройств: ${this.selectedDevices}</span>
                </div>
            </div>

            ${this.selectedDevices > 1 ? `
                <div class="price-explanation">
                    <p>💰 Стоимость: ${basePrice * this.selectedPeriod}₽ (1 устройство) + ${additionalPrice}₽ (${this.selectedDevices - 1} доп. устройств) = ${currentPrice}₽</p>
                </div>
            ` : ''}

            <div class="period-selector">
                <h3>Период подписки</h3>
                <div class="period-grid">
                    ${[
                        {months: 1, discount: 0},
                        {months: 3, discount: 10},
                        {months: 6, discount: 20},
                        {months: 12, discount: 30}
                    ].map(period => `
                        <div class="period-option ${period.months === this.selectedPeriod ? 'selected' : ''}" onclick="app.selectPeriod(${period.months})">
                            <div class="period-months">${period.months} мес</div>
                            <div class="period-price">${this.calculatePrice(period.months, this.selectedDevices)}₽</div>
                            ${period.discount > 0 ? `<div class="period-discount">-${period.discount}%</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="payment-methods">
                <h3>Способ оплаты</h3>
                <div class="payment-options">
                    <div class="payment-option ${this.selectedPaymentMethod === 'yoomoney' ? 'selected' : ''}" onclick="app.selectPaymentMethod('yoomoney')">
                        <div class="payment-icon">💳</div>
                        <div class="payment-name">ЮMoney</div>
                    </div>
                    <div class="payment-option ${this.selectedPaymentMethod === 'sbp' ? 'selected' : ''}" onclick="app.selectPaymentMethod('sbp')">
                        <div class="payment-icon">🏦</div>
                        <div class="payment-name">СБП</div>
                    </div>
                </div>
            </div>

            <div class="subscription-summary">
                <div class="summary-item">
                    <span>Устройства:</span>
                    <span>${this.selectedDevices} шт</span>
                </div>
                <div class="summary-item">
                    <span>Период:</span>
                    <span>${this.selectedPeriod} ${this.getPeriodText(this.selectedPeriod)}</span>
                </div>
                <div class="summary-item">
                    <span>Способ оплаты:</span>
                    <span>${this.selectedPaymentMethod === 'yoomoney' ? 'ЮMoney' : 'СБП'}</span>
                </div>
                <div class="summary-total">
                    <span>Итого:</span>
                    <span>${currentPrice}₽</span>
                </div>
            </div>

            <div class="page-actions">
                <button class="btn-primary" onclick="app.processPayment()">💳 Оплатить ${currentPrice}₽</button>
            </div>
        `;
    }

    // Остальные страницы и методы...
    renderVpnSetupPage() {
        const content = document.getElementById('vpn-setup-content');
        content.innerHTML = `
            <div class="setup-steps">
                <div class="setup-step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h3>Установите HAPP</h3>
                        <p>Скачайте приложение HTTP Proxy Parser (HAPP) по ссылке ниже</p>
                        <div class="store-links">
                            <button class="store-btn" onclick="app.downloadHapp()">📱 Скачать HAPP</button>
                        </div>
                    </div>
                </div>

                <div class="setup-step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h3>Настройте подключение</h3>
                        <p>Откройте HAPP и добавьте новую конфигурацию:</p>
                        <div class="config-instruction">
                            <p><strong>URL конфигурации:</strong></p>
                            <div class="config-link-box">
                                <code id="setup-config-link">https://proxy.silencevpn.com/config/user</code>
                                <button class="copy-btn small" onclick="app.copySetupConfig()">📋</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="setup-step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h3>Активируйте подключение</h3>
                        <p>Включите VPN соединение в приложении HAPP и наслаждайтесь безопасным серфингом!</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderSupportPage() {
        const content = document.getElementById('support-content');
        content.innerHTML = `
            <div class="support-sections">
                <div class="support-section">
                    <h3>📞 Свяжитесь с нами</h3>
                    <div class="contact-methods">
                        <button class="contact-btn" onclick="app.openTelegramSupport()">
                            <span class="contact-icon">💬</span>
                            <span class="contact-text">Telegram поддержка</span>
                        </button>
                        <button class="contact-btn" onclick="app.openEmailSupport()">
                            <span class="contact-icon">📧</span>
                            <span class="contact-text">Email поддержка</span>
                        </button>
                    </div>
                </div>

                <div class="support-section">
                    <h3>❓ Частые вопросы</h3>
                    <div class="faq-list">
                        <div class="faq-item" onclick="app.toggleFaq(1)">
                            <div class="faq-question">Как настроить VPN на iOS?</div>
                            <div class="faq-answer">Следуйте инструкции в разделе "Настройка VPN"</div>
                        </div>
                        <div class="faq-item" onclick="app.toggleFaq(2)">
                            <div class="faq-question">Почему низкая скорость?</div>
                            <div class="faq-answer">Попробуйте переключиться на другой сервер</div>
                        </div>
                        <div class="faq-item" onclick="app.toggleFaq(3)">
                            <div class="faq-question">Как добавить устройство?</div>
                            <div class="faq-answer">Используйте конфигурационную ссылку из профиля</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSbpPage() {
        const amount = this.calculatePrice(this.selectedPeriod, this.selectedDevices);
        const periodText = this.getPeriodText(this.selectedPeriod);
        
        const content = document.getElementById('sbp-content');
        content.innerHTML = `
            <div class="sbp-payment">
                <div class="qr-container">
                    <div class="qr-placeholder">QR-код СБП</div>
                </div>
                
                <div class="payment-amount">
                    <div class="amount">${amount} ₽</div>
                    <div class="description">${this.selectedPeriod} ${periodText} для ${this.selectedDevices} устройств</div>
                </div>

                <div class="sbp-details">
                    <div class="detail-item">
                        <div class="detail-label">Номер телефона/СБП</div>
                        <div class="detail-value">+7 123 456-78-90</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Банк</div>
                        <div class="detail-value">Тинькофф</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Получатель</div>
                        <div class="detail-value">Silence Proxy</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Назначение платежа</div>
                        <div class="detail-value">Оплата подписки VPN</div>
                    </div>
                </div>

                <div class="page-actions">
                    <button class="btn-primary" onclick="app.copySbpDetails()">📋 Копировать реквизиты</button>
                </div>
            </div>
        `;
    }

    // Вспомогательные методы
    selectDevicesCount(count) {
        this.selectedDevices = count;
        this.renderDevicesPage();
    }

    selectPeriod(months) {
        this.selectedPeriod = months;
        this.renderSubscriptionPage();
    }

    selectPaymentMethod(method) {
        this.selectedPaymentMethod = method;
        this.renderSubscriptionPage();
    }

    getPeriodText(months) {
        if (months === 1) return 'месяц';
        if (months >= 2 && months <= 4) return 'месяца';
        return 'месяцев';
    }

    calculatePrice(months, devices) {
        const basePrice = 100;
        const additionalDevicePrice = 50;
        const baseDevices = 1;
        
        let monthlyPrice = basePrice;
        if (devices > baseDevices) {
            monthlyPrice += (devices - baseDevices) * additionalDevicePrice;
        }
        
        const discounts = {1: 0, 3: 0.1, 6: 0.2, 12: 0.3};
        const discount = discounts[months] || 0;
        
        return Math.round(monthlyPrice * months * (1 - discount));
    }

    calculateAdditionalPrice(months, devices) {
        const additionalDevicePrice = 50;
        const baseDevices = 1;
        
        let additionalPrice = 0;
        if (devices > baseDevices) {
            additionalPrice = (devices - baseDevices) * additionalDevicePrice;
        }
        
        const discounts = {1: 0, 3: 0.1, 6: 0.2, 12: 0.3};
        const discount = discounts[months] || 0;
        
        return Math.round(additionalPrice * months * (1 - discount));
    }

    // Остальные методы (обработка платежей, уведомления и т.д.)
    processPayment() {
        const amount = this.calculatePrice(this.selectedPeriod, this.selectedDevices);
        
        if (this.selectedPaymentMethod === 'yoomoney') {
            this.processYooMoneyPayment(amount);
        } else if (this.selectedPaymentMethod === 'sbp') {
            this.showPage('sbp-page');
        }
    }

    processYooMoneyPayment(amount) {
        const yoomoneyUrl = `https://yoomoney.ru/quickpay/confirm.xml?receiver=410011000000000&quickpay-form=button&paymentType=AC&label=subscription_${Date.now()}&sum=${amount}&targets=Silence+Proxy+${this.selectedPeriod}months+${this.selectedDevices}dev`;
        
        this.showNotification(`Перенаправление в ЮMoney для оплаты ${amount}₽`);
        
        setTimeout(() => {
            window.open(yoomoneyUrl, '_blank');
            this.showNotification('После оплаты подписка активируется автоматически');
        }, 1000);
    }

    saveDevicesSettings() {
        this.showNotification(`Настройки устройств сохранены: ${this.selectedDevices} устройств`);
        this.showPage('main-page');
    }

    copyConfigLink() {
        const configLink = document.getElementById('config-link').textContent;
        navigator.clipboard.writeText(configLink).then(() => {
            this.showNotification('Ссылка скопирована в буфер обмена');
        });
    }

    copySetupConfig() {
        const configLink = document.getElementById('setup-config-link').textContent;
        navigator.clipboard.writeText(configLink).then(() => {
            this.showNotification('Конфигурационная ссылка скопирована');
        });
    }

    copySbpDetails() {
        const sbpDetails = `Номер телефона/СБП: +7 123 456-78-90\nБанк: Тинькофф\nПолучатель: Silence Proxy\nНазначение: Оплата подписки VPN`;
        navigator.clipboard.writeText(sbpDetails).then(() => {
            this.showNotification('Реквизиты СБП скопированы');
        });
    }

    downloadHapp() {
        const happUrl = 'https://apps.apple.com/app/happ-http-proxy-parser/id6478701838';
        window.open(happUrl, '_blank');
        this.showNotification('Открыта страница загрузки HAPP');
    }

    toggleFaq(index) {
        const faqItem = event.target.closest('.faq-item');
        faqItem.classList.toggle('active');
    }

    openTelegramSupport() {
        window.open('https://t.me/silencevpn_support', '_blank');
    }

    openEmailSupport() {
        window.location.href = 'mailto:support@silencevpn.com';
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    bindEvents() {
        // Основные события уже привязаны через onclick
    }

    addScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.card:not(.advantage-card), .action-btn').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            observer.observe(el);
        });
    }
}

// Глобальный экземпляр
let app;

document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new SilenceProxyApp();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        document.body.innerHTML = `
            <div class="app">
                <div style="padding: 20px; text-align: center;">
                    <h1>Silence Proxy</h1>
                    <p>Приложение временно недоступно</p>
                    <button onclick="location.reload()">Перезагрузить</button>
                </div>
            </div>
        `;
    }
});