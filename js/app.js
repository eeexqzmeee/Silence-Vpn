class SilenceProxyApp {
    constructor() {
        this.init();
    }

    init() {
        this.renderHeader();
        this.renderSubscription();
        this.renderActions();
        this.renderAdvantages();
        this.bindEvents();
    }

    renderHeader() {
        const header = document.getElementById('header');
        const subscriptionData = this.getSubscriptionData();
        
        header.innerHTML = `
            <div class="logo">
                <div class="logo-icon">SP</div>
                <div class="logo-text">Silence Proxy</div>
            </div>
            <div class="profile-section">
                ${subscriptionData.hasActiveSubscription ? 
                    '<button class="subscribe-btn" id="renew-header-btn">Продлить</button>' : 
                    '<button class="subscribe-btn" id="subscribe-header-btn">Подключить</button>'
                }
                <button class="profile-btn" id="profile-btn" title="Профиль">
                    👤
                </button>
            </div>
        `;
    }

    renderSubscription() {
        const section = document.getElementById('subscription-section');
        const subscriptionData = this.getSubscriptionData();
        
        section.innerHTML = `
            <div class="subscription-card card">
                ${subscriptionData.hasActiveSubscription ? this.renderActiveSubscription(subscriptionData) : this.renderNoSubscription()}
            </div>
        `;
    }

    renderActiveSubscription(data) {
        return `
            <div class="subscription-status">
                <div class="status-icon active">🔒</div>
                <div class="status-info">
                    <div class="status-title">Премиум подписка</div>
                    <div class="status-subtitle">Активна до ${data.expiresAt}</div>
                </div>
                <div class="status-badge active">Active</div>
            </div>
            
            <div class="subscription-stats">
                <div class="stat-item">
                    <div class="stat-label">Устройства</div>
                    <div class="stat-value">${data.devicesUsed}/${data.maxDevices}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Трафик</div>
                    <div class="stat-value">${data.usedTraffic}</div>
                </div>
            </div>
            
            <div class="traffic-progress">
                <div class="traffic-info">
                    <div class="traffic-label">Использовано</div>
                    <div class="traffic-value">${data.trafficPercentage}%</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.trafficPercentage}%"></div>
                </div>
            </div>
        `;
    }

    renderNoSubscription() {
        return `
            <div class="no-subscription">
                <div class="icon">🔒</div>
                <h3>Нет активной подписки</h3>
                <p>Подключите подписку для доступа ко всем функциям VPN</p>
            </div>
        `;
    }

    renderActions() {
        const section = document.getElementById('actions-section');
        section.innerHTML = `
            <div class="actions-grid">
                <button class="action-btn" id="vpn-setup-btn">
                    <div class="action-icon">⚙️</div>
                    <div class="action-content">
                        <div class="action-text">Настройка VPN</div>
                        <div class="action-description">Инструкция по подключению в приложении Happ</div>
                    </div>
                </button>
                
                <button class="action-btn" id="devices-btn">
                    <div class="action-icon">📱</div>
                    <div class="action-content">
                        <div class="action-text">Управление устройствами</div>
                        <div class="action-description">Добавление и удаление устройств</div>
                    </div>
                </button>
                
                <button class="action-btn" id="support-btn">
                    <div class="action-icon">💬</div>
                    <div class="action-content">
                        <div class="action-text">Поддержка</div>
                        <div class="action-description">FAQ и обращение в службу поддержки</div>
                    </div>
                </button>
            </div>
        `;
    }

    renderAdvantages() {
        const section = document.getElementById('advantages-section');
        section.innerHTML = `
            <h3 class="section-title">Наши преимущества</h3>
            <div class="advantages-grid">
                <div class="advantage-card">
                    <div class="advantage-icon">🚀</div>
                    <div class="advantage-content">
                        <div class="advantage-title">Высокая скорость</div>
                        <div class="advantage-description">Без ограничений для комфортного серфинга</div>
                    </div>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">🛡️</div>
                    <div class="advantage-content">
                        <div class="advantage-title">Конфиденциальность</div>
                        <div class="advantage-description">Ваши данные под надежной защитой</div>
                    </div>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">🚫</div>
                    <div class="advantage-content">
                        <div class="advantage-title">Блокировщик рекламы</div>
                        <div class="advantage-description">Встроенная защита от рекламы</div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Кнопки в хедере
        document.getElementById('profile-btn').addEventListener('click', () => this.showProfile());
        document.getElementById('renew-header-btn')?.addEventListener('click', () => this.handleSubscription());
        document.getElementById('subscribe-header-btn')?.addEventListener('click', () => this.handleSubscription());
        
        // Основные действия
        document.getElementById('vpn-setup-btn').addEventListener('click', () => this.showVpnSetup());
        document.getElementById('devices-btn').addEventListener('click', () => this.handleDevices());
        document.getElementById('support-btn').addEventListener('click', () => this.showSupport());
    }

    getSubscriptionData() {
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

    showProfile() {
        console.log('Show profile modal');
    }

    handleSubscription() {
        console.log('Handle subscription');
    }

    showVpnSetup() {
        console.log('Show VPN setup instructions');
    }

    handleDevices() {
        console.log('Handle devices');
    }

    showSupport() {
        console.log('Show support');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SilenceProxyApp();
});