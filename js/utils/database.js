class Database {
    constructor() {
        this.dbName = 'SilenceProxyDB';
        this.version = 3; // Увеличиваем версию чтобы пересоздать хранилища
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close();
            }

            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                // Добавляем тестовые данные после инициализации
                this.addTestData();
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('Database upgrade needed, old version:', event.oldVersion, 'new version:', event.newVersion);
                const db = event.target.result;
                
                // Удаляем старые хранилища если есть
                if (event.oldVersion < 3) {
                    const stores = ['users', 'subscriptions', 'transactions', 'devices', 'usage', 'promocodes', 'settings', 'errorLogs', 'analytics'];
                    stores.forEach(storeName => {
                        if (db.objectStoreNames.contains(storeName)) {
                            db.deleteObjectStore(storeName);
                        }
                    });
                }
                
                this.createAllStores(db);
            };

            request.onblocked = () => {
                console.warn('Database upgrade blocked');
                reject(new Error('Database upgrade blocked'));
            };
        });
    }

    createStores(db, oldVersion) {
        if (oldVersion < 1) {
            this.createAllStores(db);
        }

        if (oldVersion === 1) {
            console.log('Upgrading from version 1 to 2');
        }
    }

    createAllStores(db) {
        // Пользователи
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('telegramId', 'telegramId', { unique: true });
        userStore.createIndex('createdAt', 'createdAt', { unique: false });

        // Подписки
        const subStore = db.createObjectStore('subscriptions', { keyPath: 'id', autoIncrement: true });
        subStore.createIndex('userId', 'userId', { unique: false });
        subStore.createIndex('status', 'status', { unique: false });
        subStore.createIndex('endDate', 'endDate', { unique: false });

        // Транзакции
        const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        txStore.createIndex('userId', 'userId', { unique: false });
        txStore.createIndex('date', 'date', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });

        // Устройства
        const deviceStore = db.createObjectStore('devices', { keyPath: 'id', autoIncrement: true });
        deviceStore.createIndex('userId', 'userId', { unique: false });
        deviceStore.createIndex('deviceId', 'deviceId', { unique: true });

        // Использование трафика
        const usageStore = db.createObjectStore('usage', { keyPath: 'id', autoIncrement: true });
        usageStore.createIndex('userId', 'userId', { unique: false });
        usageStore.createIndex('date', 'date', { unique: false });

        // Промокоды
        const promoStore = db.createObjectStore('promocodes', { keyPath: 'code' });
        promoStore.createIndex('userId', 'userId', { unique: false });
        promoStore.createIndex('used', 'used', { unique: false });

        // Настройки приложения
        db.createObjectStore('settings', { keyPath: 'key' });

        // Логи ошибок
        const errorStore = db.createObjectStore('errorLogs', { keyPath: 'id', autoIncrement: true });
        errorStore.createIndex('date', 'date', { unique: false });
        errorStore.createIndex('type', 'type', { unique: false });

        // Аналитика
        const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
        analyticsStore.createIndex('event', 'event', { unique: false });
        analyticsStore.createIndex('date', 'date', { unique: false });
        analyticsStore.createIndex('userId', 'userId', { unique: false });
    }

    async addTestData() {
        try {
            // Добавляем тестовые транзакции
            const testTransactions = [
                { userId: 123456789, description: 'Продление подписки', amount: 300, date: new Date().toISOString(), type: 'subscription' },
                { userId: 123456789, description: 'Доп. устройство', amount: 50, date: new Date().toISOString(), type: 'device' },
                { userId: 123456789, description: 'Продление подписки', amount: 100, date: new Date().toISOString(), type: 'subscription' }
            ];
            
            for (const tx of testTransactions) {
                await this.addRecord('transactions', tx);
            }
            
            console.log('Test data added successfully');
        } catch (error) {
            console.warn('Failed to add test data:', error);
        }
    }

    checkDB() {
        if (!this.db) {
            throw new Error('Database not initialized. Call init() first.');
        }
        return true;
    }

    // Пользователи
    async saveUser(userData) {
        this.checkDB();
        return this.addRecord('users', {
            ...userData,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        });
    }

    async getUser(userId) {
        this.checkDB();
        return this.getRecord('users', userId);
    }

    async updateUser(userId, updates) {
        this.checkDB();
        return this.updateRecord('users', userId, {
            ...updates,
            lastActive: new Date().toISOString()
        });
    }

    // Подписки
    async saveSubscription(subscriptionData) {
        this.checkDB();
        return this.addRecord('subscriptions', {
            ...subscriptionData,
            createdAt: new Date().toISOString()
        });
    }

    async getActiveSubscription(userId) {
        this.checkDB();
        return this.getRecordByIndex('subscriptions', 'userId', userId);
    }

    // Транзакции
    async saveTransaction(transactionData) {
        this.checkDB();
        return this.addRecord('transactions', {
            ...transactionData,
            date: new Date().toISOString()
        });
    }

    async getUserTransactions(userId) {
        try {
            this.checkDB();
            const transactions = await this.getAllByIndex('transactions', 'userId', userId);
            return Array.isArray(transactions) ? transactions : this.getMockTransactions();
        } catch (error) {
            console.warn('Failed to get transactions from DB, returning mock data:', error);
            return this.getMockTransactions();
        }
    }

    getMockTransactions() {
        return [
            { id: 1, description: 'Продление подписки', amount: 300, date: '2024-01-15' },
            { id: 2, description: 'Доп. устройство', amount: 50, date: '2024-01-10' },
            { id: 3, description: 'Продление подписки', amount: 100, date: '2023-12-20' }
        ];
    }

    // Устройства
    async saveDevice(deviceData) {
        this.checkDB();
        return this.addRecord('devices', {
            ...deviceData,
            addedAt: new Date().toISOString()
        });
    }

    async getUserDevices(userId) {
        this.checkDB();
        return this.getAllByIndex('devices', 'userId', userId);
    }

    // Использование трафика
    async saveUsage(usageData) {
        this.checkDB();
        return this.addRecord('usage', {
            ...usageData,
            timestamp: new Date().toISOString()
        });
    }

    async getUserUsage(userId, startDate, endDate) {
        this.checkDB();
        return this.getRecordsByIndexRange('usage', 'userId', userId, startDate, endDate);
    }

    // Промокоды
    async usePromocode(code, userId) {
        this.checkDB();
        return this.addRecord('promocodes', {
            code,
            userId,
            used: true,
            usedAt: new Date().toISOString()
        });
    }

    async isPromocodeUsed(code) {
        this.checkDB();
        return this.getRecord('promocodes', code);
    }

    // Настройки
    async saveSetting(key, value) {
        this.checkDB();
        return this.addRecord('settings', { 
            key, 
            value, 
            updatedAt: new Date().toISOString() 
        });
    }

    async getSetting(key) {
        try {
            this.checkDB();
            const record = await this.getRecord('settings', key);
            return record ? record.value : null;
        } catch (error) {
            console.warn('Failed to get setting:', error);
            return null;
        }
    }

    // Логи ошибок
    async logError(errorData) {
        try {
            this.checkDB();
            return await this.addRecord('errorLogs', {
                ...errorData,
                date: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to log error:', error);
        }
    }

    // Аналитика
    async logEvent(event, userId = null, metadata = {}) {
        try {
            this.checkDB();
            return await this.addRecord('analytics', {
                event,
                userId,
                metadata,
                date: new Date().toISOString(),
                userAgent: navigator.userAgent,
                platform: navigator.platform
            });
        } catch (error) {
            console.warn('Failed to log event:', error);
        }
    }

    // Базовые методы работы с IndexedDB
    async addRecord(storeName, data) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getRecord(storeName, key) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async updateRecord(storeName, key, updates) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const getRequest = store.get(key);

                getRequest.onsuccess = () => {
                    const existing = getRequest.result;
                    if (existing) {
                        const updated = { ...existing, ...updates };
                        const putRequest = store.put(updated);
                        putRequest.onsuccess = () => resolve(updated);
                        putRequest.onerror = () => reject(putRequest.error);
                    } else {
                        reject(new Error('Record not found'));
                    }
                };
                getRequest.onerror = () => reject(getRequest.error);
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getRecordByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.get(value);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAllByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.getAll(value);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getRecordsByIndexRange(storeName, indexName, value, start, end) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const range = IDBKeyRange.bound(start, end);
                const request = index.getAll(range);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAllRecords(storeName) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async deleteRecord(storeName, key) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
                
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
                
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async clearDatabase() {
        const stores = [
            'users', 'subscriptions', 'transactions', 'devices', 
            'usage', 'promocodes', 'settings', 'errorLogs', 'analytics'
        ];
        
        for (const storeName of stores) {
            if (this.db.objectStoreNames.contains(storeName)) {
                await this.clearStore(storeName);
            }
        }
    }

    async getDatabaseStats() {
        const stores = [
            'users', 'subscriptions', 'transactions', 'devices', 
            'usage', 'promocodes', 'settings', 'errorLogs', 'analytics'
        ];
        
        const stats = {};
        
        for (const storeName of stores) {
            if (this.db.objectStoreNames.contains(storeName)) {
                try {
                    const records = await this.getAllRecords(storeName);
                    stats[storeName] = records.length;
                } catch (error) {
                    stats[storeName] = 'error';
                }
            } else {
                stats[storeName] = 'not_exists';
            }
        }
        
        return stats;
    }
}