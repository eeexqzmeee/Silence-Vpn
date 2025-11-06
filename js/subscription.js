// Логика работы с подписками
class SubscriptionManager {
    constructor() {
        this.currentSubscription = null;
    }

    async loadSubscriptionData() {
        try {
            // Загрузка данных о подписке с сервера
            const response = await this.apiCall('GET', '/subscription');
            this.currentSubscription = response.data;
            return this.currentSubscription;
        } catch (error) {
            console.error('Error loading subscription:', error);
            return this.getDefaultSubscription();
        }
    }

    async purchaseSubscription(planId) {
        try {
            // Покупка подписки через Telegram Payments
            const result = await this.tg.showInvoice(planId);
            if (result.status === 'paid') {
                await this.activateSubscription(result);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Purchase error:', error);
            return false;
        }
    }

    getDefaultSubscription() {
        return {
            hasActiveSubscription: false,
            expiresAt: null,
            devicesUsed: 0,
            maxDevices: 0,
            usedTraffic: '0 ГБ',
            totalTraffic: '0 ГБ',
            trafficPercentage: 0
        };
    }

    async apiCall(method, endpoint, data = null) {
        // Заглушка для API вызовов
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ data: this.getMockData() });
            }, 500);
        });
    }

    getMockData() {
        return {
            hasActiveSubscription: true,
            expiresAt: '25.12.2024',
            devicesUsed: 2,
            maxDevices: 3,
            usedTraffic: '15.2 ГБ',
            totalTraffic: '50 ГБ',
            trafficPercentage: 30.4
        };
    }
}