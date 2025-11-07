// js/config-generator.js
class ConfigGenerator {
    constructor() {
        this.serverConfig = {
            host: 'vpn.silenceproxy.com',
            port: 443,
            protocol: 'vless',
            transport: 'quic',
            security: 'tls'
        };
    }

    // Генерация UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Генерация ключа для QUIC
    generateQuicKey() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Создание конфига для устройства
    async generateDeviceConfig(userId, deviceName = 'Device') {
        const uuid = this.generateUUID();
        const quicKey = this.generateQuicKey();
        const deviceId = this.generateDeviceId();

        const config = {
            // VLESS конфиг
            vless: `vless://${uuid}@${this.serverConfig.host}:${this.serverConfig.port}?type=quic&encryption=none&security=tls&sni=${this.serverConfig.host}&fp=chrome&flow=xtls-rprx-vision#${encodeURIComponent(deviceName)}`,

            // JSON конфиг для приложений
            json: {
                "outbounds": [
                    {
                        "protocol": "vless",
                        "settings": {
                            "vnext": [
                                {
                                    "address": this.serverConfig.host,
                                    "port": this.serverConfig.port,
                                    "users": [
                                        {
                                            "id": uuid,
                                            "encryption": "none",
                                            "flow": "xtls-rprx-vision"
                                        }
                                    ]
                                }
                            ]
                        },
                        "streamSettings": {
                            "network": "quic",
                            "security": "tls",
                            "tlsSettings": {
                                "serverName": this.serverConfig.host,
                                "fingerprint": "chrome"
                            },
                            "quicSettings": {
                                "security": "none",
                                "key": quicKey,
                                "header": {
                                    "type": "none"
                                }
                            }
                        }
                    }
                ]
            },

            // Данные для сохранения в БД
            metadata: {
                id: Date.now(),
                userId: userId,
                deviceId: deviceId,
                deviceName: deviceName,
                uuid: uuid,
                quicKey: quicKey,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            }
        };

        return config;
    }

    generateDeviceId() {
        return 'device_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    }

    // Проверка лимита устройств
    async canCreateNewConfig(userId, maxDevices) {
        const activeConfigs = await db.getActiveConfigs(userId);
        return activeConfigs.length < maxDevices;
    }

    // Получение всех активных конфигов пользователя
    async getUserConfigs(userId) {
        return await db.getActiveConfigs(userId);
    }

    // Деактивация конфига
    async deactivateConfig(configId) {
        return await db.deactivateConfig(configId);
    }
}

// Глобальный экземпляр генератора
const configGenerator = new ConfigGenerator();