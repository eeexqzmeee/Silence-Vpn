class SubscriptionManager {
    constructor() {
        this.currentDevices = 1;
        this.maxDevices = 5;
        this.basePrice = 100;
        this.additionalDevicePrice = 50;
        this.userConfig = null;
        this.paymentProcessor = new PaymentProcessor();
        
        // Безопасная инициализация VPN Manager
        this.vpnManager = null;
        
        this.loadUserConfig();
        this.initializeVpnManager();
    }

    initializeVpnManager() {
        try {
            if (window.app && window.app.vpnManager) {
                this.vpnManager = window.app.vpnManager;
            } else if (typeof VPNManager !== 'undefined') {
                this.vpnManager = new VPNManager();
            }
        } catch (error) {
            console.warn('VPN Manager initialization failed:', error);
            this.vpnManager = this.createMockVpnManager();
        }
    }
    
    // Мок VPN Manager на случай ошибок
    createMockVpnManager() {
        return {
            generateMasterConfig: () => Promise.resolve({ config: {} }),
            getUserConfig: () => null,
            saveUserConfig: () => {},
            isConfigValid: () => true,
            updateConfigUsage: () => {},
            generateVlessLink: () => 'vless://mock-config'
        };
    }

    // Загрузка конфига пользователя
    loadUserConfig() {
        const saved = localStorage.getItem('silenceProxy_userConfig');
        if (saved) {
            try {
                this.userConfig = JSON.parse(saved);
                this.currentDevices = this.userConfig.devices || 1;
                
                // Проверяем активность подписки
                this.checkSubscriptionStatus();
            } catch (error) {
                console.error('Error loading user config:', error);
                this.createDefaultUserConfig();
            }
        } else {
            this.createDefaultUserConfig();
        }
    }

    createDefaultUserConfig() {
        // Для демо создаем активную подписку на 30 дней
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        
        this.userConfig = {
            userId: 'user_' + Math.random().toString(36).substr(2, 9),
            name: '@username',
            devices: 1,
            subscriptionEnd: endDate.toISOString().split('T')[0],
            active: true,
            referralCode: this.generateReferralCode(),
            usedPromocodes: [],
            created: new Date().toISOString(),
            subscriptionStart: new Date().toISOString()
        };
        this.saveUserConfig();
    }

    // Инициализация пользователя
    async initializeUser(telegramId, name) {
        this.userConfig.userId = telegramId;
        this.userConfig.name = name;
        this.saveUserConfig();
        return this.userConfig;
    }

    // Генерация конфигов для устройств (обновленная версия)
    async generateDeviceConfigs() {
        if (!window.app.vpnManager) return;

        try {
            // В новой системе создаем один мастер-конфиг для всех устройств
            await this.generateMasterConfig();

            Helpers.showNotification(`✅ Конфиг обновлен для ${this.currentDevices} устройств`, 'success');
        } catch (error) {
            console.error('Failed to generate device configs:', error);
            Helpers.showNotification('❌ Ошибка обновления конфига', 'error');
        }
    }

    // Скачивание конфига (обновленная версия)
    async downloadConfig(deviceNumber = 1) {
        if (!this.userConfig.active) {
            Helpers.showNotification('❌ Подписка не активна', 'error');
            return false;
        }

        if (deviceNumber > this.currentDevices) {
            Helpers.showNotification(`❌ Превышен лимит устройств. Доступно: ${this.currentDevices}`, 'error');
            return false;
        }

        try {
            // Используем новый метод копирования ссылки
            return await this.copyConfigLink();
        } catch (error) {
            console.error('Failed to download config:', error);
            Helpers.showNotification('❌ Ошибка при копировании конфига', 'error');
            return false;
        }
    }

    // Создание подписки
    async createSubscription(months, devices, paymentMethod = 'card') {
        const price = this.calculatePrice(months, devices);
        
        // Показываем процесс оплаты
        Helpers.showNotification('Инициализация платежа...', 'info');
        
        try {
            const paymentResult = await this.paymentProcessor.processPayment({
                amount: price,
                currency: 'RUB',
                description: `Подписка Silence Proxy на ${months} месяцев`,
                paymentMethod: paymentMethod
            });

            if (paymentResult.success) {
                await this.processSuccessfulPayment(months, devices, paymentResult);
                return true;
            } else {
                Helpers.showNotification('Ошибка оплаты: ' + paymentResult.error, 'error');
                return false;
            }
        } catch (error) {
            console.error('Payment error:', error);
            Helpers.showNotification('Ошибка при обработке платежа', 'error');
            return false;
        }
    }

    async processSuccessfulPayment(months, devices, paymentResult) {
    // Обновляем конфиг пользователя
        this.currentDevices = devices;
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);
        
        this.userConfig.devices = devices;
        this.userConfig.subscriptionEnd = endDate.toISOString().split('T')[0];
        this.userConfig.subscriptionStart = startDate.toISOString().split('T')[0];
        this.userConfig.active = true;
        this.userConfig.lastPayment = {
            amount: paymentResult.amount,
            date: new Date().toISOString(),
            method: paymentResult.method,
            months: months
        };

        this.saveUserConfig();

        // Генерируем новый мастер-конфиг с новым количеством устройств
        await this.generateMasterConfig();

        // Сохраняем транзакцию
        await this.saveTransaction({
            type: 'subscription',
            amount: paymentResult.amount,
            months: months,
            devices: devices,
            description: `Подписка на ${months} месяцев, ${devices} устройств`,
            status: 'completed'
        });

        // Обновляем UI
        this.updateSubscriptionUI();

        Helpers.showNotification(`✅ Подписка активирована на ${months} месяцев! Доступно устройств: ${devices}`, 'success');

        // Закрываем страницу оплаты
        if (window.app && window.app.pageManager) {
            window.app.pageManager.closeCurrent();
        }
    }   

    // Генерация мастер-конфига для всех устройств
    async generateMasterConfig() {
        if (!window.app.vpnManager) {
            console.error('VPN Manager not available');
            return null;
        }

        try {
            const masterConfig = await window.app.vpnManager.generateMasterConfig(
                this.userConfig.userId,
                this.currentDevices,
                'vless'
            );

            // Сохраняем мастер-конфиг
            localStorage.setItem('silenceProxy_masterConfig', JSON.stringify(masterConfig));

            // Логируем генерацию конфига
            this.logEvent('config_generated', { 
                devices: this.currentDevices,
                protocol: 'vless'
            });

            return masterConfig;
        } catch (error) {
            console.error('Failed to generate master config:', error);
            this.logEvent('config_generation_failed', { error: error.message });
            return null;
        }
    }

    // Получение ключа-ссылки для импорта
    async getConfigLink(protocol = 'vless') {
        if (!this.userConfig.active) {
            Helpers.showNotification('❌ Подписка не активна', 'error');
            return null;
        }

        // Проверяем срок подписки
        if (!this.checkSubscriptionStatus()) {
            Helpers.showNotification('❌ Срок подписки истек', 'error');
            return null;
        }

        try {
            // Получаем или генерируем мастер-конфиг
            let masterConfig = JSON.parse(localStorage.getItem('silenceProxy_masterConfig') || 'null');

            if (!masterConfig || !window.app.vpnManager.isConfigValid(masterConfig)) {
                masterConfig = await this.generateMasterConfig();
            }

            if (!masterConfig) {
                Helpers.showNotification('❌ Ошибка генерации конфига', 'error');
                return null;
            }

            // Обновляем использование конфига
            window.app.vpnManager.updateConfigUsage(this.userConfig.userId);

            // Генерируем правильную ссылку для выбранного протокола
            const configLink = window.app.vpnManager.generateVlessLink(masterConfig, protocol);

            return configLink;
        } catch (error) {
            console.error('Failed to generate config link:', error);
            Helpers.showNotification('❌ Ошибка генерации ключа', 'error');
            return null;
        }
    }

    // Генерация правильной vless ссылки
    generateVlessLink(config) {
        // Формируем vless ссылку в правильном формате для Happ
        const uuid = config.id;
        const server = config.address;
        const port = config.port;
        const flow = config.flow;
        const encryption = config.encryption;
        const type = config.transport;
        const security = config.tls;
        const sni = config.sni;
        const fp = config.fp;
        const publicKey = config['reality-opts']['public-key'];
        const shortId = config['reality-opts']['short-id'];
        
        // Формат vless ссылки для Happ
        const vlessLink = `vless://${uuid}@${server}:${port}?flow=${flow}&encryption=${encryption}&type=${type}&security=${security}&sni=${sni}&fp=${fp}&pbk=${publicKey}&sid=${shortId}#Silence+Proxy`;
        
        return vlessLink;
    }

    // Копирование ключа-ссылки
    async copyConfigLink(protocol = 'vless') {
        const configLink = await this.getConfigLink(protocol);
        
        if (configLink) {
            const success = await Helpers.copyToClipboard(configLink);
            if (success) {
                Helpers.showNotification('✅ Ключ-ссылка скопирована! Откройте Happ и вставьте ссылку.', 'success', 5000);

                // Логируем действие
                this.logEvent('config_copied', { 
                    devices: this.currentDevices,
                    daysRemaining: this.getDaysRemaining(),
                    protocol: protocol
                });
            }
            return success;
        }
        return false;
    }

    getServerInfo() {
        if (!window.app.vpnManager) return null;
        
        const server = window.app.vpnManager.getBestServer();
        const stats = window.app.vpnManager.getServerStats(server.id);
        
        return {
            server: server,
            stats: stats,
            overall: window.app.vpnManager.getOverallStats()
        };
    }

    // Процесс оплаты
    async processPayment() {
        const selectedPeriod = document.querySelector('.period-option.active');
        if (!selectedPeriod) {
            Helpers.showNotification('❌ Выберите период подписки', 'warning');
            return;
        }

        const months = parseInt(selectedPeriod.dataset.months);
        const devices = this.currentDevices;
        const totalPrice = this.calculatePrice(months, devices);

        try {
            const success = await this.createSubscription(months, devices, 'card');
            
            if (success) {
                // Уже обработано в processSuccessfulPayment
            }
        } catch (error) {
            console.error('Payment processing error:', error);
            Helpers.showNotification('❌ Ошибка при обработке платежа', 'error');
        }
    }

    // Проверка статуса подписки
    checkSubscriptionStatus() {
        if (!this.userConfig.active) return false;
        
        const endDate = new Date(this.userConfig.subscriptionEnd);
        const today = new Date();
        
        if (endDate < today) {
            this.userConfig.active = false;
            this.saveUserConfig();
            this.updateSubscriptionUI();
            return false;
        }
        
        return true;
    }

    // Получение оставшихся дней
    getDaysRemaining() {
        if (!this.userConfig.active) return 0;
        
        const endDate = new Date(this.userConfig.subscriptionEnd);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
    }

    // Получение данных подписки
    getSubscriptionData() {
        const trafficUsed = this.getTrafficUsage();
        const referralInfo = this.getReferralInfo();
        const daysRemaining = this.getDaysRemaining();
        const isActive = this.checkSubscriptionStatus();

        return {
            active: isActive,
            endDate: this.userConfig.subscriptionEnd,
            startDate: this.userConfig.subscriptionStart,
            daysRemaining: daysRemaining,
            devices: this.currentDevices,
            maxDevices: this.maxDevices,
            trafficUsed: trafficUsed,
            userId: this.userConfig.userId,
            referral: referralInfo
        };
    }

    // Расчет цены
    calculatePrice(months, devices, discount = 0) {
        const basePrice = this.basePrice * months;
        const additionalPrice = Math.max(0, devices - 1) * this.additionalDevicePrice * months;
        const total = basePrice + additionalPrice;
        return Math.round(total * (1 - discount));
    }

    // Обновление количества устройств
    updateDevices(devices) {
        this.currentDevices = Math.min(devices, this.maxDevices);
        this.userConfig.devices = this.currentDevices;
        this.saveUserConfig();
        
        // Перегенерируем конфиг с новым количеством устройств
        this.generateMasterConfig();
        
        this.updateSubscriptionUI();
        return this.currentDevices;
    }

    updateSubscriptionUI() {
        if (window.app && window.app.renderMain) {
            window.app.renderMain();
        }
    }

    // Вспомогательные методы
    calculateEndDate(months) {
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        return date.toISOString().split('T')[0];
    }

    generateReferralCode() {
        return 'ref_' + Math.random().toString(36).substr(2, 8);
    }

    saveUserConfig() {
        localStorage.setItem('silenceProxy_userConfig', JSON.stringify(this.userConfig));
    }

    async saveTransaction(transactionData) {
        const transactions = JSON.parse(localStorage.getItem('silenceProxy_transactions') || '[]');
        transactions.push({
            id: 'tx_' + Math.random().toString(36).substr(2, 9),
            ...transactionData,
            date: new Date().toISOString(),
            userId: this.userConfig.userId
        });
        localStorage.setItem('silenceProxy_transactions', JSON.stringify(transactions));
    }

    getTrafficUsage() {
        const usage = localStorage.getItem('silenceProxy_trafficUsage') || '0';
        return `${(parseInt(usage) / 1024).toFixed(1)} ГБ`;
    }

    logEvent(event, metadata = {}) {
        const log = {
            event,
            userId: this.userConfig.userId,
            timestamp: new Date().toISOString(),
            metadata
        };
        
        const events = JSON.parse(localStorage.getItem('silenceProxy_events') || '[]');
        events.push(log);
        localStorage.setItem('silenceProxy_events', JSON.stringify(events.slice(-100)));
    }

    // Реферальная программа
    getReferralInfo() {
        const referrals = JSON.parse(localStorage.getItem('silenceProxy_referrals') || '[]');
        const userReferrals = referrals.filter(ref => ref.referrerId === this.userConfig.userId);
        
        return {
            code: this.userConfig.referralCode,
            link: `https://t.me/silenceproxy?start=ref_${this.userConfig.userId}`,
            totalReferrals: userReferrals.length,
            earned: userReferrals.length * 50,
            pending: userReferrals.filter(ref => !ref.used).length
        };
    }
}