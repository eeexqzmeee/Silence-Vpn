class SubscriptionManager {
    constructor() {
        this.currentDevices = 3;
        this.maxDevices = 5;
        this.basePrice = 100; // 100 рублей за 1 устройство
        this.additionalDevicePrice = 50; // 50 рублей за каждое доп. устройство
        this.serverConfig = {
            ip: "45.90.236.48", // Замени на IP твоего сервера
            port: 443,
            uuid: "b1b5bb49-6d21-4028-a62d-e9608787912f", // Замени на твой UUID
            publicKey: "3eNsbDFU_VHTtwIsGXn2K5HLmUgrCCyJFxfA-af-KAg", // Замени на твой публичный ключ
            shortId: "88",
            serverName: "www.amazon.com"
        };
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
        // В реальном приложении здесь была бы интеграция с платежной системой
        Helpers.showNotification('Платеж успешно обработан! Подписка активирована.', 'success');
        
        // Закрываем страницу оплаты
        if (window.app && window.app.pageManager) {
            window.app.pageManager.closeCurrent();
        }
        
        // Обновляем статус подписки
        this.updateSubscriptionStatus(true);
    }

    async downloadConfig() {
        try {
            // Формируем VLESS-ссылку для быстрого подключения
            const vlessLink = this.generateVlessLink();
            
            // Копируем в буфер обмена
            await Helpers.copyToClipboard(vlessLink);
            Helpers.showNotification('VLESS-ссылка скопирована в буфер обмена', 'success');
            
            // Логируем действие
            if (window.app && window.app.database && window.app.database.db) {
                await window.app.database.logEvent('config_downloaded', window.app.userData.id);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to download config:', error);
            Helpers.showNotification('Ошибка при копировании конфига', 'error');
            return false;
        }
    }

    generateVlessLink() {
        const { ip, port, uuid, publicKey, shortId, serverName } = this.serverConfig;
        
        // Формируем VLESS-ссылку в стандартном формате
        const vlessLink = `vless://${uuid}@${ip}:${port}?encryption=none&flow=xtls-rprx-vision&security=reality&sni=${serverName}&fp=chrome&pbk=${publicKey}&sid=${shortId}&type=tcp&headerType=none#SilenceProxy`;
        
        return vlessLink;
    }

    generateJsonConfig() {
        const { ip, port, uuid, publicKey, shortId, serverName } = this.serverConfig;
        
        // Формируем JSON конфиг для приложений
        const jsonConfig = {
            "server": ip,
            "server_port": port,
            "uuid": uuid,
            "flow": "xtls-rprx-vision",
            "packet_encoding": "xudp",
            "transport": {
                "type": "reality",
                "server_name": serverName,
                "public_key": publicKey,
                "short_id": shortId,
                "fingerprint": "chrome"
            }
        };
        
        return JSON.stringify(jsonConfig, null, 2);
    }

    updateSubscriptionStatus(isActive) {
        // Обновляем статус подписки в UI
        const statusBadge = document.querySelector('.status-badge');
        const renewBtn = document.getElementById('renew-btn');
        
        if (statusBadge && isActive) {
            statusBadge.textContent = 'Активна';
            statusBadge.className = 'status-badge active';
        }
        
        if (renewBtn && isActive) {
            renewBtn.textContent = 'Продлить подписку';
        }
        
        // Обновляем дату окончания
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // +1 месяц
        
        const endDateElement = document.querySelector('.subscription-info .info-item:nth-child(2) .value');
        if (endDateElement) {
            endDateElement.textContent = endDate.toLocaleDateString('ru-RU');
        }
        
        // Сохраняем в базу данных если доступна
        this.saveSubscriptionToDatabase(isActive, endDate);
    }

    async saveSubscriptionToDatabase(isActive, endDate) {
        try {
            if (window.app && window.app.database && window.app.database.db) {
                await window.app.database.saveSubscription({
                    userId: window.app.userData.id,
                    active: isActive,
                    endDate: endDate.toISOString(),
                    devices: this.currentDevices,
                    maxDevices: this.maxDevices,
                    trafficUsed: '0 ГБ'
                });
                
                // Сохраняем транзакцию
                await window.app.database.saveTransaction({
                    userId: window.app.userData.id,
                    description: 'Активация подписки',
                    amount: this.calculatePrice(1, this.currentDevices),
                    type: 'subscription',
                    status: 'completed'
                });
            }
        } catch (error) {
            console.warn('Failed to save subscription to database:', error);
        }
    }

    // Метод для проверки статуса подписки
    checkSubscriptionStatus() {
        const subscription = this.getSubscriptionData();
        const endDate = new Date(subscription.endDate);
        const now = new Date();
        
        if (endDate < now) {
            // Подписка истекла
            this.updateSubscriptionStatus(false);
            return false;
        }
        
        return subscription.active;
    }

    // Метод для получения информации о трафике
    getTrafficInfo() {
        return {
            used: '145.7 ГБ',
            total: 'Неограниченно',
            percentage: 0
        };
    }

    // Метод для сброса статистики трафика
    resetTrafficStats() {
        // В реальном приложении здесь был бы сброс статистики на сервере
        Helpers.showNotification('Статистика трафика сброшена', 'info');
        
        // Обновляем UI
        const trafficElement = document.querySelector('.subscription-info .info-item:nth-child(3) .value');
        if (trafficElement) {
            trafficElement.textContent = '0 ГБ';
        }
    }

    // Метод для применения промокода
    applyPromoCode(promoCode) {
        const validCodes = {
            'WELCOME10': 0.1, // 10% скидка
            'FRIEND20': 0.2,  // 20% скидка
            'SUMMER15': 0.15  // 15% скидка
        };
        
        const discount = validCodes[promoCode.toUpperCase()];
        
        if (discount) {
            const originalPrice = this.calculatePrice(1, this.currentDevices);
            const discountedPrice = Math.round(originalPrice * (1 - discount));
            
            Helpers.showNotification(`Промокод применен! Скидка ${discount * 100}%`, 'success');
            return discountedPrice;
        }
        
        Helpers.showNotification('Неверный промокод', 'error');
        return null;
    }

    // Метод для получения истории платежей
    getPaymentHistory() {
        // В реальном приложении здесь был бы запрос к API
        return [
            {
                id: 1,
                date: '2024-01-15',
                description: 'Продление подписки',
                amount: 300,
                status: 'completed'
            },
            {
                id: 2,
                date: '2024-01-10',
                description: 'Доп. устройство',
                amount: 50,
                status: 'completed'
            },
            {
                id: 3,
                date: '2023-12-20',
                description: 'Продление подписки',
                amount: 100,
                status: 'completed'
            }
        ];
    }

    // Метод для обновления данных сервера (для админки)
    updateServerConfig(newConfig) {
        this.serverConfig = { ...this.serverConfig, ...newConfig };
        
        // Сохраняем в локальное хранилище
        if (typeof Storage !== 'undefined') {
            localStorage.setItem('silenceProxy_serverConfig', JSON.stringify(this.serverConfig));
        }
        
        Helpers.showNotification('Настройки сервера обновлены', 'success');
    }

    // Метод для загрузки конфига из локального хранилища
    loadServerConfig() {
        if (typeof Storage !== 'undefined') {
            const savedConfig = localStorage.getItem('silenceProxy_serverConfig');
            if (savedConfig) {
                this.serverConfig = { ...this.serverConfig, ...JSON.parse(savedConfig) };
            }
        }
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Автоматически загружаем конфиг сервера при инициализации
    if (window.app && window.app.subscriptionManager) {
        window.app.subscriptionManager.loadServerConfig();
    }
});