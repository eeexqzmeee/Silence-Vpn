class SubscriptionManager {
    constructor() {
        this.currentDevices = 3;
        this.maxDevices = 5;
        this.basePrice = 100;
        this.additionalDevicePrice = 50;
    }

    calculatePrice(months, devices) {
        const basePrice = this.basePrice * months;
        const additionalPrice = Math.max(0, devices - 1) * this.additionalDevicePrice * months;
        return basePrice + additionalPrice;
    }

    updateDevices(devices) {
        this.currentDevices = devices;
        
        // Обновляем UI на главной странице
        const subscriptionInfo = document.querySelector('.subscription-info');
        if (subscriptionInfo) {
            const devicesElement = subscriptionInfo.querySelector('.info-item:first-child .value');
            if (devicesElement) {
                devicesElement.textContent = `${devices}/${this.maxDevices}`;
            }
        }
        
        return this.currentDevices;
    }

    getSubscriptionData() {
        return {
            active: true,
            endDate: '2024-12-31',
            devices: this.currentDevices,
            maxDevices: this.maxDevices,
            trafficUsed: '145.7 ГБ'
        };
    }

    processPayment() {
        Helpers.showNotification('Платеж успешно обработан!', 'success');
        if (window.app && window.app.pageManager) {
            window.app.pageManager.closeCurrent();
        }
    }

    async downloadConfig() {
        const vpnKey = `sp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await Helpers.copyToClipboard(vpnKey);
    }
}