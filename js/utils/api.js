// API service for communication with backend
class ApiService {
    constructor() {
        this.baseURL = 'https://api.silenceproxy.com/v1';
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // User methods
    async getUserProfile() {
        return this.request('/user/profile');
    }

    async updateUserProfile(data) {
        return this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // Subscription methods
    async getSubscription() {
        return this.request('/subscription');
    }

    async createSubscription(planId, devices) {
        return this.request('/subscription', {
            method: 'POST',
            body: JSON.stringify({ planId, devices })
        });
    }

    async updateSubscriptionDevices(devices) {
        return this.request('/subscription/devices', {
            method: 'PUT',
            body: JSON.stringify({ devices })
        });
    }

    // Payment methods
    async getPaymentMethods() {
        return this.request('/payment/methods');
    }

    async createPaymentIntent(amount, currency = 'RUB') {
        return this.request('/payment/intent', {
            method: 'POST',
            body: JSON.stringify({ amount, currency })
        });
    }

    // Device methods
    async getDevices() {
        return this.request('/devices');
    }

    async removeDevice(deviceId) {
        return this.request(`/devices/${deviceId}`, {
            method: 'DELETE'
        });
    }
}