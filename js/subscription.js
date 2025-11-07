// js/subscription.js
class SubscriptionManager {
    constructor() {
        this.db = db;
        this.configGenerator = configGenerator;
    }

    async initializeUser(telegramUser) {
        // Сохраняем пользователя
        const user = await this.db.saveUser(telegramUser);
        
        // Создаем начальную подписку (бесплатный trial)
        const subscription = await this.createTrialSubscription(user.id);
        
        return { user, subscription };
    }

    async createTrialSubscription(userId) {
        const trialData = {
            userId: userId,
            status: 'trial',
            plan: 'trial',
            maxDevices: 1,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 дней
            usedTraffic: 0,
            totalTraffic: 5 * 1024 * 1024 * 1024, // 5GB
            createdAt: new Date().toISOString()
        };

        return await this.db.saveSubscription(trialData);
    }

    async upgradeSubscription(userId, plan, period, devices) {
        const plans = {
            'basic': { price: 100, baseDevices: 1 },
            'premium': { price: 200, baseDevices: 3 },
            'ultimate': { price: 300, baseDevices: 5 }
        };

        const selectedPlan = plans[plan] || plans.basic;
        const additionalDevices = Math.max(0, devices - selectedPlan.baseDevices);
        const monthlyPrice = selectedPlan.price + (additionalDevices * 50);
        
        const totalPrice = monthlyPrice * period;
        const expiresAt = new Date(Date.now() + period * 30 * 24 * 60 * 60 * 1000);

        const subscriptionData = {
            userId: userId,
            status: 'active',
            plan: plan,
            period: period,
            maxDevices: devices,
            totalPrice: totalPrice,
            expiresAt: expiresAt.toISOString(),
            usedTraffic: 0,
            totalTraffic: Infinity, // Безлимитный трафик
            activatedAt: new Date().toISOString()
        };

        return await this.db.saveSubscription(subscriptionData);
    }

    async getSubscriptionData(userId) {
        const subscription = await this.db.getSubscription(userId);
        
        if (!subscription) {
            return this.getDefaultSubscription();
        }

        const isActive = this.isSubscriptionActive(subscription);
        const activeConfigs = await this.configGenerator.getUserConfigs(userId);

        return {
            hasActiveSubscription: isActive,
            status: subscription.status,
            plan: subscription.plan,
            expiresAt: this.formatDate(subscription.expiresAt),
            devicesUsed: activeConfigs.length,
            maxDevices: subscription.maxDevices,
            usedTraffic: this.formatTraffic(subscription.usedTraffic),
            totalTraffic: subscription.totalTraffic === Infinity ? '∞' : this.formatTraffic(subscription.totalTraffic),
            trafficPercentage: this.calculateTrafficPercentage(subscription.usedTraffic, subscription.totalTraffic),
            isTrial: subscription.status === 'trial',
            daysLeft: this.calculateDaysLeft(subscription.expiresAt)
        };
    }

    isSubscriptionActive(subscription) {
        if (!subscription) return false;
        
        const now = new Date();
        const expiresAt = new Date(subscription.expiresAt);
        
        return subscription.status === 'active' || 
               subscription.status === 'trial' && expiresAt > now;
    }

    async canAddDevice(userId) {
        const subscription = await this.db.getSubscription(userId);
        if (!this.isSubscriptionActive(subscription)) {
            return { canAdd: false, reason: 'No active subscription' };
        }

        const activeConfigs = await this.configGenerator.getUserConfigs(userId);
        const canAdd = activeConfigs.length < subscription.maxDevices;
        
        return {
            canAdd: canAdd,
            reason: canAdd ? '' : `Device limit reached (${subscription.maxDevices})`,
            currentDevices: activeConfigs.length,
            maxDevices: subscription.maxDevices
        };
    }

    async createNewConfig(userId, deviceName = 'New Device') {
        const subscription = await this.db.getSubscription(userId);
        
        if (!this.isSubscriptionActive(subscription)) {
            throw new Error('No active subscription');
        }

        const canAdd = await this.configGenerator.canCreateNewConfig(userId, subscription.maxDevices);
        if (!canAdd) {
            throw new Error(`Device limit reached. Maximum ${subscription.maxDevices} devices allowed.`);
        }

        const config = await this.configGenerator.generateDeviceConfig(userId, deviceName);
        await this.db.saveConfig(config.metadata);

        return config;
    }

    // Вспомогательные методы
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU');
    }

    formatTraffic(bytes) {
        if (bytes === Infinity) return '∞';
        
        const gb = bytes / (1024 * 1024 * 1024);
        return gb < 1 ? `${Math.round(bytes / (1024 * 1024))} МБ` : `${gb.toFixed(1)} ГБ`;
    }

    calculateTrafficPercentage(used, total) {
        if (total === Infinity) return 0;
        return Math.min(100, Math.round((used / total) * 100));
    }

    calculateDaysLeft(expiresAt) {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffTime = expiry - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getDefaultSubscription() {
        return {
            hasActiveSubscription: false,
            status: 'inactive',
            plan: 'none',
            expiresAt: '-',
            devicesUsed: 0,
            maxDevices: 0,
            usedTraffic: '0 МБ',
            totalTraffic: '0 МБ',
            trafficPercentage: 0,
            isTrial: false,
            daysLeft: 0
        };
    }
}