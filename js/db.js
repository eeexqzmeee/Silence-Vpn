// js/db.js
class Database {
    constructor() {
        this.dbName = 'SilenceProxyDB';
        this.version = 2;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Таблица пользователей
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id' });
                    userStore.createIndex('telegramId', 'telegramId', { unique: true });
                    userStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Таблица подписок
                if (!db.objectStoreNames.contains('subscriptions')) {
                    const subStore = db.createObjectStore('subscriptions', { keyPath: 'userId' });
                    subStore.createIndex('status', 'status', { unique: false });
                    subStore.createIndex('expiresAt', 'expiresAt', { unique: false });
                }

                // Таблица конфигов
                if (!db.objectStoreNames.contains('configs')) {
                    const configStore = db.createObjectStore('configs', { keyPath: 'id', autoIncrement: true });
                    configStore.createIndex('userId', 'userId', { unique: false });
                    configStore.createIndex('deviceId', 'deviceId', { unique: false });
                    configStore.createIndex('isActive', 'isActive', { unique: false });
                }
            };
        });
    }

    // Пользователи
    async saveUser(userData) {
        return this.executeTransaction('users', 'readwrite', (store) => {
            const user = {
                id: userData.id || Date.now(),
                telegramId: userData.id,
                firstName: userData.first_name,
                lastName: userData.last_name,
                username: userData.username,
                languageCode: userData.language_code,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };
            store.put(user);
            return user;
        });
    }

    async getUser(telegramId) {
        return this.executeTransaction('users', 'readonly', (store) => {
            return store.index('telegramId').get(telegramId);
        });
    }

    // Подписки
    async saveSubscription(subscriptionData) {
        return this.executeTransaction('subscriptions', 'readwrite', (store) => {
            store.put(subscriptionData);
            return subscriptionData;
        });
    }

    async getSubscription(userId) {
        return this.executeTransaction('subscriptions', 'readonly', (store) => {
            return store.get(userId);
        });
    }

    // Конфиги
    async saveConfig(configData) {
        return this.executeTransaction('configs', 'readwrite', (store) => {
            const config = {
                ...configData,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            };
            store.put(config);
            return config;
        });
    }

    async getUserConfigs(userId) {
        return this.executeTransaction('configs', 'readonly', (store) => {
            return store.index('userId').getAll(userId);
        });
    }

    async getActiveConfigs(userId) {
        return this.executeTransaction('configs', 'readonly', (store) => {
            return store.index('userId').getAll(userId).then(configs => {
                return configs.filter(config => config.isActive);
            });
        });
    }

    async deactivateConfig(configId) {
        return this.executeTransaction('configs', 'readwrite', (store) => {
            return store.get(configId).then(config => {
                if (config) {
                    config.isActive = false;
                    config.deactivatedAt = new Date().toISOString();
                    store.put(config);
                }
                return config;
            });
        });
    }

    // Вспомогательные методы
    executeTransaction(storeName, mode, callback) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);
            const request = callback(store);

            transaction.oncomplete = () => resolve(request);
            transaction.onerror = () => reject(transaction.error);
        });
    }
}

// Глобальный экземпляр БД
let db;

// Инициализация БД
async function initDatabase() {
    try {
        db = new Database();
        await db.init();
        console.log('Database initialized successfully');
        return db;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return null;
    }
}