// server.js - запускается на вашем хостинге
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// База данных (простая JSON файловая)
const DB_FILE = path.join(__dirname, 'database.json');

function readDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading DB:', error);
    }
    return { users: [], subscriptions: [], configs: [], servers: [] };
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing DB:', error);
        return false;
    }
}

// Конфигурация серверов
const SERVERS = [
    {
        id: 1,
        host: 'vpn1.silenceproxy.com',
        ip: '123.123.123.123', // Ваш IP сервера
        port: 443,
        location: 'Москва',
        load: 45,
        active: true
    },
    {
        id: 2, 
        host: 'vpn2.silenceproxy.com',
        ip: '123.123.123.124', // Дополнительный сервер если есть
        port: 443,
        location: 'Санкт-Петербург',
        load: 30,
        active: true
    }
];

// Генерация Xray конфига
function generateXrayConfig(userId, uuid, server) {
    return {
        "inbounds": [],
        "outbounds": [
            {
                "protocol": "vless",
                "settings": {
                    "vnext": [
                        {
                            "address": server.host,
                            "port": server.port,
                            "users": [
                                {
                                    "id": uuid,
                                    "flow": "xtls-rprx-vision",
                                    "encryption": "none"
                                }
                            ]
                        }
                    ]
                },
                "streamSettings": {
                    "network": "quic",
                    "security": "tls",
                    "tlsSettings": {
                        "serverName": server.host,
                        "fingerprint": "chrome"
                    },
                    "quicSettings": {
                        "security": "none",
                        "key": "",
                        "header": {
                            "type": "none"
                        }
                    }
                }
            }
        ]
    };
}

// API Routes

// Получить список серверов
app.get('/api/servers', (req, res) => {
    res.json({ success: true, servers: SERVERS.filter(s => s.active) });
});

// Создать нового пользователя
app.post('/api/users/register', (req, res) => {
    const { telegramId, firstName, lastName, username } = req.body;
    
    const db = readDB();
    const existingUser = db.users.find(u => u.telegramId === telegramId);
    
    if (existingUser) {
        return res.json({ success: true, user: existingUser });
    }
    
    const user = {
        id: Date.now(),
        telegramId,
        firstName,
        lastName, 
        username,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
    };
    
    db.users.push(user);
    
    // Создаем trial подписку
    const subscription = {
        id: Date.now(),
        userId: user.id,
        status: 'trial',
        plan: 'trial',
        maxDevices: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        usedTraffic: 0,
        totalTraffic: 5 * 1024 * 1024 * 1024, // 5GB
        createdAt: new Date().toISOString()
    };
    
    db.subscriptions.push(subscription);
    writeDB(db);
    
    res.json({ success: true, user, subscription });
});

// Создать конфиг для устройства
app.post('/api/configs/create', (req, res) => {
    const { userId, deviceName, serverId = 1 } = req.body;
    
    const db = readDB();
    
    // Проверяем пользователя
    const user = db.users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Проверяем подписку
    const subscription = db.subscriptions.find(s => s.userId === userId);
    if (!subscription || subscription.status !== 'active' && subscription.status !== 'trial') {
        return res.status(403).json({ success: false, error: 'No active subscription' });
    }
    
    // Проверяем лимит устройств
    const userConfigs = db.configs.filter(c => c.userId === userId && c.isActive);
    if (userConfigs.length >= subscription.maxDevices) {
        return res.status(403).json({ 
            success: false, 
            error: `Device limit reached. Maximum ${subscription.maxDevices} devices allowed.` 
        });
    }
    
    // Выбираем сервер
    const server = SERVERS.find(s => s.id === serverId);
    if (!server) {
        return res.status(404).json({ success: false, error: 'Server not found' });
    }
    
    // Генерируем UUID
    const uuid = uuidv4();
    const deviceId = `device_${Date.now()}`;
    
    // Создаем конфиг
    const config = {
        id: Date.now(),
        userId: userId,
        deviceId: deviceId,
        deviceName: deviceName,
        uuid: uuid,
        serverId: serverId,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
    };
    
    // Генерируем ссылку VLESS
    const vlessLink = `vless://${uuid}@${server.host}:${server.port}?type=quic&encryption=none&security=tls&sni=${server.host}&fp=chrome&flow=xtls-rprx-vision#${encodeURIComponent(deviceName)}`;
    
    // Генерируем JSON конфиг
    const jsonConfig = generateXrayConfig(userId, uuid, server);
    
    db.configs.push(config);
    writeDB(db);
    
    res.json({
        success: true,
        config: {
            id: config.id,
            deviceName: config.deviceName,
            uuid: config.uuid,
            vlessLink: vlessLink,
            jsonConfig: jsonConfig,
            server: server
        }
    });
});

// Получить конфиги пользователя
app.get('/api/users/:userId/configs', (req, res) => {
    const { userId } = req.params;
    
    const db = readDB();
    const userConfigs = db.configs.filter(c => c.userId == userId && c.isActive);
    
    const configsWithServers = userConfigs.map(config => {
        const server = SERVERS.find(s => s.id === config.serverId);
        return {
            ...config,
            server: server
        };
    });
    
    res.json({ success: true, configs: configsWithServers });
});

// Деактивировать конфиг
app.post('/api/configs/:configId/deactivate', (req, res) => {
    const { configId } = req.params;
    
    const db = readDB();
    const config = db.configs.find(c => c.id == configId);
    
    if (config) {
        config.isActive = false;
        config.deactivatedAt = new Date().toISOString();
        writeDB(db);
    }
    
    res.json({ success: true });
});

// Получить информацию о подписке
app.get('/api/users/:userId/subscription', (req, res) => {
    const { userId } = req.params;
    
    const db = readDB();
    const user = db.users.find(u => u.id == userId);
    const subscription = db.subscriptions.find(s => s.userId == userId);
    const configs = db.configs.filter(c => c.userId == userId && c.isActive);
    
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const response = {
        user: user,
        subscription: subscription || null,
        devicesUsed: configs.length,
        maxDevices: subscription ? subscription.maxDevices : 0,
        hasActiveSubscription: subscription && (subscription.status === 'active' || subscription.status === 'trial')
    };
    
    res.json({ success: true, ...response });
});

// Обновить подписку (после оплаты)
app.post('/api/subscriptions/upgrade', (req, res) => {
    const { userId, plan, period, devices } = req.body;
    
    const db = readDB();
    let subscription = db.subscriptions.find(s => s.userId == userId);
    
    const plans = {
        'basic': { price: 100, baseDevices: 1 },
        'premium': { price: 200, baseDevices: 3 },
        'ultimate': { price: 300, baseDevices: 5 }
    };
    
    const selectedPlan = plans[plan] || plans.basic;
    const expiresAt = new Date(Date.now() + period * 30 * 24 * 60 * 60 * 1000);
    
    if (subscription) {
        subscription.status = 'active';
        subscription.plan = plan;
        subscription.period = period;
        subscription.maxDevices = devices;
        subscription.expiresAt = expiresAt.toISOString();
        subscription.totalTraffic = Infinity;
        subscription.activatedAt = new Date().toISOString();
    } else {
        subscription = {
            id: Date.now(),
            userId: userId,
            status: 'active',
            plan: plan,
            period: period,
            maxDevices: devices,
            expiresAt: expiresAt.toISOString(),
            usedTraffic: 0,
            totalTraffic: Infinity,
            createdAt: new Date().toISOString(),
            activatedAt: new Date().toISOString()
        };
        db.subscriptions.push(subscription);
    }
    
    writeDB(db);
    
    res.json({ success: true, subscription });
});

// Статистика использования
app.post('/api/stats/traffic', (req, res) => {
    const { userId, bytesUsed } = req.body;
    
    const db = readDB();
    const subscription = db.subscriptions.find(s => s.userId == userId);
    
    if (subscription) {
        subscription.usedTraffic = (subscription.usedTraffic || 0) + bytesUsed;
        writeDB(db);
    }
    
    res.json({ success: true });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Silence Proxy API server running on port ${PORT}`);
    console.log(`Servers configured: ${SERVERS.length}`);
});