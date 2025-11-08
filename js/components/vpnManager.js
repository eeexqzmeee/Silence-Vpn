class VPNManager {
    constructor() {
        this.servers = [
            {
                id: 'nl-ams-01',
                host: '45.95.147.18',
                port: 443,
                location: 'Amsterdam',
                country: 'Netherlands',
                countryCode: 'NL',
                load: 0.15,
                performance: 'excellent',
                uptime: 99.9,
                ping: 28,
                supportedProtocols: ['vless', 'vmess', 'trojan'],
                features: ['reality', 'xtls', 'cdn'],
                isActive: true,
                maxConnections: 1000,
                currentConnections: 234
            }
        ];
        
        this.protocols = {
            'vless': {
                name: 'VLESS',
                security: 'high',
                speed: 'excellent',
                obfuscation: 'reality'
            },
            'vmess': {
                name: 'VMess',
                security: 'high', 
                speed: 'good',
                obfuscation: 'websocket'
            },
            'trojan': {
                name: 'Trojan',
                security: 'high',
                speed: 'excellent',
                obfuscation: 'tls'
            }
        };
        
        this.initializeStorage();
    }

    // Инициализация хранилища
    initializeStorage() {
        if (!localStorage.getItem('vpn_connections')) {
            localStorage.setItem('vpn_connections', JSON.stringify([]));
        }
        if (!localStorage.getItem('vpn_traffic')) {
            localStorage.setItem('vpn_traffic', JSON.stringify({
                total: 0,
                uploaded: 0,
                downloaded: 0,
                lastReset: new Date().toISOString()
            }));
        }
    }

    // Генерация мастер-конфига для пользователя
    async generateMasterConfig(userId, deviceCount, protocol = 'vless') {
        const server = this.getBestServer();
        const userConfig = this.getUserConfig(userId);
        
        // Если у пользователя уже есть активный конфиг, используем его
        if (userConfig && this.isConfigValid(userConfig)) {
            return userConfig;
        }

        const config = {
            userId: userId,
            deviceCount: deviceCount,
            server: server,
            protocol: protocol,
            config: this.generateVlessRealityConfig(userId, server, deviceCount),
            backupConfigs: {
                vmess: this.generateVmessConfig(userId, server, deviceCount),
                trojan: this.generateTrojanConfig(userId, server, deviceCount)
            },
            createdAt: new Date().toISOString(),
            expiresAt: this.calculateExpiryDate(),
            lastUsed: new Date().toISOString(),
            usageCount: 0,
            isActive: true
        };

        this.saveUserConfig(userId, config);
        await this.logConnection('config_generated', userId, { deviceCount, protocol });
        
        return config;
    }

    // Генерация VLESS+Reality конфига (основной)
    generateVlessRealityConfig(userId, server, deviceCount) {
        const uuid = this.generateUUID();
        const publicKey = this.generatePublicKey();
        const shortId = this.generateShortId();
        
        const config = {
            // Основные настройки
            protocol: "vless",
            address: server.host,
            port: server.port,
            id: uuid,
            
            // Flow control
            flow: "xtls-rprx-vision",
            encryption: "none",
            
            // Transport
            transport: "tcp",
            
            // TLS/Reality настройки
            tls: "reality",
            "reality-opts": {
                "public-key": publicKey,
                "short-id": shortId,
                spiderX: "/"
            },
            
            // Fingerprint и SNI
            sni: "www.amazon.com",
            fp: "chrome",
            
            // Метаданные
            name: `Silence Proxy - ${server.location}`,
            userId: userId,
            maxDevices: deviceCount,
            serverId: server.id,
            
            // Оптимизации
            "xver": 1,
            "server-name": "www.amazon.com",
            "allow-insecure": false
        };

        return config;
    }

    // Генерация VMess конфига (резервный)
    generateVmessConfig(userId, server, deviceCount) {
        const uuid = this.generateUUID();
        
        return {
            v: "2",
            ps: `Silence Proxy VMess - ${server.location}`,
            add: server.host,
            port: server.port.toString(),
            id: uuid,
            aid: "0",
            scy: "auto",
            net: "tcp",
            type: "none",
            host: "",
            path: "/",
            tls: "tls",
            sni: "www.amazon.com",
            fp: "chrome"
        };
    }

    // Генерация Trojan конфига (резервный)
    generateTrojanConfig(userId, server, deviceCount) {
        const password = this.generatePassword(32);
        
        return {
            run_type: "client",
            local_addr: "127.0.0.1",
            local_port: 1080,
            remote_addr: server.host,
            remote_port: server.port,
            password: [password],
            log_level: 1,
            ssl: {
                verify: true,
                verify_hostname: true,
                cert: "",
                cipher: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384",
                cipher_tls13: "TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_256_GCM_SHA384",
                sni: "www.amazon.com",
                alpn: ["h2", "http/1.1"],
                reuse_session: true,
                session_ticket: false,
                curves: ""
            },
            tcp: {
                no_delay: true,
                keep_alive: true,
                reuse_port: false,
                fast_open: false,
                fast_open_qlen: 20
            }
        };
    }

    // Генерация vless ссылки для импорта
    generateVlessLink(config, protocol = 'vless') {
        const cfg = config.config;
        
        switch (protocol) {
            case 'vless':
                // Формат: vless://uuid@server:port?params#name
                const params = new URLSearchParams({
                    type: cfg.transport,
                    security: cfg.tls,
                    flow: cfg.flow,
                    encryption: cfg.encryption,
                    fp: cfg.fp,
                    sni: cfg.sni,
                    pbk: cfg['reality-opts']['public-key'],
                    sid: cfg['reality-opts']['short-id'],
                    spx: cfg['reality-opts'].spiderX || "/"
                });
                
                return `vless://${cfg.id}@${cfg.address}:${cfg.port}?${params.toString()}#${encodeURIComponent(cfg.name)}`;
                
            case 'vmess':
                const vmessConfig = config.backupConfigs.vmess;
                const vmessBase64 = btoa(JSON.stringify(vmessConfig));
                return `vmess://${vmessBase64}`;
                
            case 'trojan':
                const trojanConfig = config.backupConfigs.trojan;
                return `trojan://${trojanConfig.password[0]}@${trojanConfig.remote_addr}:${trojanConfig.remote_port}?sni=${trojanConfig.ssl.sni}#${encodeURIComponent('Silence Proxy Trojan')}`;
                
            default:
                return this.generateVlessLink(config, 'vless');
        }
    }

    // Добавьте эти методы в класс VPNManager после существующих методов

    // Получение всех конфигов пользователя (для обратной совместимости)
    getUserConfigs(userId) {
        const userConfig = this.getUserConfig(userId);
        if (!userConfig) return {};
        
        // Преобразуем в старый формат для совместимости
        return {
            [`device_1`]: userConfig
        };
    }
    
    // Получение конфига устройства (для обратной совместимости)
    getDeviceConfig(deviceId) {
        // В новой системе у нас один мастер-конфиг на все устройства
        const userConfigs = JSON.parse(localStorage.getItem('vpn_user_configs') || '{}');
        
        // Ищем конфиг по любому deviceId (все устройства используют один конфиг)
        for (const userId in userConfigs) {
            const config = userConfigs[userId];
            if (config && config.isActive) {
                return config;
            }
        }
        
        return null;
    }
    
    // Отзыв конфига устройства (для обратной совместимости)
    revokeDeviceConfig(deviceId) {
        const userConfigs = JSON.parse(localStorage.getItem('vpn_user_configs') || '{}');
        
        for (const userId in userConfigs) {
            const config = userConfigs[userId];
            if (config && config.isActive) {
                config.isActive = false;
                config.revokedAt = new Date().toISOString();
                localStorage.setItem('vpn_user_configs', JSON.stringify(userConfigs));
                return true;
            }
        }
        
        return false;
    }
    
    // Валидация лимита устройств (для обратной совместимости)
    async validateDeviceLimit(userId, currentDevices, maxDevices) {
        const userConfig = this.getUserConfig(userId);
        if (!userConfig) return true; // Если конфига нет, можно создавать
        
        return currentDevices <= maxDevices;
    }
    
    // Генерация конфига устройства (для обратной совместимости)
    async generateDeviceConfig(deviceId, userId, serverId = null) {
        // В новой системе генерируем мастер-конфиг
        return await this.generateMasterConfig(userId, 1); // По умолчанию 1 устройство
    }

    // Получение лучшего сервера
    getBestServer() {
        return this.servers.find(server => server.isActive) || this.servers[0];
    }

    // Получение сервера по ID
    getServerById(serverId) {
        return this.servers.find(server => server.id === serverId);
    }

    // Получение всех активных серверов
    getAllServers() {
        return this.servers.filter(server => server.isActive);
    }

    // Получение статистики сервера
    getServerStats(serverId) {
        const server = this.getServerById(serverId);
        if (!server) return null;
        
        const connections = this.getConnectionsByServer(serverId);
        const traffic = this.getTrafficStats();
        
        return {
            server: server,
            connections: connections.length,
            uptime: server.uptime,
            load: server.load,
            performance: server.performance,
            traffic: {
                total: this.formatBytes(traffic.total),
                uploaded: this.formatBytes(traffic.uploaded),
                downloaded: this.formatBytes(traffic.downloaded)
            }
        };
    }

    // Получение конфига пользователя
    getUserConfig(userId) {
        const userConfigs = JSON.parse(localStorage.getItem('vpn_user_configs') || '{}');
        return userConfigs[userId];
    }

    // Сохранение конфига пользователя
    saveUserConfig(userId, config) {
        const userConfigs = JSON.parse(localStorage.getItem('vpn_user_configs') || '{}');
        userConfigs[userId] = config;
        localStorage.setItem('vpn_user_configs', JSON.stringify(userConfigs));
    }

    // Проверка валидности конфига
    isConfigValid(config) {
        if (!config || !config.isActive) return false;
        
        const expiryDate = new Date(config.expiresAt);
        const now = new Date();
        
        return expiryDate > now;
    }

    // Обновление использования конфига
    updateConfigUsage(userId) {
        const config = this.getUserConfig(userId);
        if (config) {
            config.lastUsed = new Date().toISOString();
            config.usageCount = (config.usageCount || 0) + 1;
            this.saveUserConfig(userId, config);
        }
    }

    // Отзыв конфига
    revokeUserConfig(userId) {
        const userConfigs = JSON.parse(localStorage.getItem('vpn_user_configs') || '{}');
        if (userConfigs[userId]) {
            userConfigs[userId].isActive = false;
            userConfigs[userId].revokedAt = new Date().toISOString();
            localStorage.setItem('vpn_user_configs', JSON.stringify(userConfigs));
            
            this.logConnection('config_revoked', userId);
            return true;
        }
        return false;
    }

    // Логирование подключений
    async logConnection(type, userId, metadata = {}) {
        const connections = JSON.parse(localStorage.getItem('vpn_connections') || '[]');
        const connection = {
            id: 'conn_' + Math.random().toString(36).substr(2, 9),
            type: type,
            userId: userId,
            timestamp: new Date().toISOString(),
            server: metadata.serverId || 'nl-ams-01',
            metadata: metadata
        };
        
        connections.push(connection);
        // Храним только последние 1000 подключений
        localStorage.setItem('vpn_connections', JSON.stringify(connections.slice(-1000)));
    }

    // Получение подключений по серверу
    getConnectionsByServer(serverId) {
        const connections = JSON.parse(localStorage.getItem('vpn_connections') || '[]');
        return connections.filter(conn => conn.server === serverId);
    }

    // Обновление статистики трафика
    updateTrafficStats(uploaded = 0, downloaded = 0) {
        const traffic = JSON.parse(localStorage.getItem('vpn_traffic') || '{}');
        
        traffic.total = (traffic.total || 0) + uploaded + downloaded;
        traffic.uploaded = (traffic.uploaded || 0) + uploaded;
        traffic.downloaded = (traffic.downloaded || 0) + downloaded;
        traffic.lastUpdate = new Date().toISOString();
        
        localStorage.setItem('vpn_traffic', JSON.stringify(traffic));
        return traffic;
    }

    // Получение статистики трафика
    getTrafficStats() {
        return JSON.parse(localStorage.getItem('vpn_traffic') || '{}');
    }

    // Сброс статистики трафика
    resetTrafficStats() {
        const traffic = {
            total: 0,
            uploaded: 0,
            downloaded: 0,
            lastReset: new Date().toISOString()
        };
        localStorage.setItem('vpn_traffic', JSON.stringify(traffic));
        return traffic;
    }

    // Проверка работоспособности сервера
    async checkServerHealth(serverId) {
        const server = this.getServerById(serverId);
        if (!server) return { status: 'error', message: 'Server not found' };
        
        // Имитация проверки здоровья сервера
        return new Promise((resolve) => {
            setTimeout(() => {
                const isHealthy = Math.random() > 0.1; // 90% вероятность что сервер здоров
                
                resolve({
                    status: isHealthy ? 'healthy' : 'degraded',
                    server: server,
                    timestamp: new Date().toISOString(),
                    responseTime: Math.random() * 100 + 20, // 20-120ms
                    load: server.load,
                    connections: server.currentConnections
                });
            }, 500);
        });
    }

    // Получение информации о протоколах
    getProtocolInfo(protocol) {
        return this.protocols[protocol] || this.protocols['vless'];
    }

    // Получение всех протоколов
    getAllProtocols() {
        return this.protocols;
    }

    // Генерация UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Генерация публичного ключа
    generatePublicKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        for (let i = 0; i < 43; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Генерация short ID
    generateShortId() {
        return Math.random().toString(36).substr(2, 8);
    }

    // Генерация пароля
    generatePassword(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Расчет даты истечения
    calculateExpiryDate(days = 30) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    // Форматирование байтов
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Получение общей статистики
    getOverallStats() {
        const traffic = this.getTrafficStats();
        const connections = JSON.parse(localStorage.getItem('vpn_connections') || '[]');
        const activeConnections = connections.filter(conn => 
            new Date(conn.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        
        return {
            totalTraffic: this.formatBytes(traffic.total),
            uploaded: this.formatBytes(traffic.uploaded),
            downloaded: this.formatBytes(traffic.downloaded),
            totalConnections: connections.length,
            activeConnections: activeConnections.length,
            servers: this.servers.length,
            activeServers: this.servers.filter(s => s.isActive).length
        };
    }

    // Экспорт конфига в файл
    exportConfigToFile(config, filename = 'silence-proxy-config.json') {
        const configString = JSON.stringify(config, null, 2);
        const blob = new Blob([configString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Валидация конфигурации
    validateConfig(config) {
        if (!config) return { valid: false, error: 'Config is null' };
        if (!config.config) return { valid: false, error: 'No config data' };
        
        const cfg = config.config;
        const required = ['protocol', 'address', 'port', 'id'];
        
        for (const field of required) {
            if (!cfg[field]) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }
        
        return { valid: true, error: null };
    }
}

// Создаем глобальный экземпляр
if (typeof window !== 'undefined') {
    window.vpnManager = new VPNManager();
}