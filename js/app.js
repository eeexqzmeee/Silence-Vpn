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
        header.innerHTML = `
            <div class="logo">
                <div class="logo-icon">SP</div>
                <div class="logo-text">Silence Proxy</div>
            </div>
            <button class="profile-btn" id="profile-btn">
                👤
            </button>
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
            <div class="subscription-header">
                <h2 class="subscription-title">Премиум подписка</h2>
                <div class="status-badge status-active">Активна</div>
            </div>
            
            <div class="subscription-info">
                <div class="info-item">
                    <div class="info-label">Истекает</div>
                    <div class="info-value">${data.expiresAt}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Устройства</div>
                    <div class="info-value">${data.devicesUsed}/${data.maxDevices}</div>
                </div>
            </div>
            
            <div class="traffic-section">
                <div class="traffic-header">
                    <div class="traffic-label">Использовано трафика</div>
                    <div class="traffic-value">${data.usedTraffic} из ${data.totalTraffic}</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.trafficPercentage}%"></div>
                </div>
            </div>
            
            <div class="subscription-action">
                <button class="btn-primary" id="renew-btn">Продлить подписку</button>
            </div>
        `;
    }

    renderNoSubscription() {
        return `
            <div class="no-subscription">
                <div class="icon">🔒</div>
                <h3>Нет активной подписки</h3>
                <p>Подключите подписку для доступа ко всем функциям</p>
                <button class="btn-primary" id="subscribe-btn">Подключить подписку</button>
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
                        <div class="advantage-description">Быстрое подключение без ограничений скорости для комфортного серфинга</div>
                    </div>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">🛡️</div>
                    <div class="advantage-content">
                        <div class="advantage-title">Конфиденциальность</div>
                        <div class="advantage-description">Ваши данные под надежной защитой без логирования</div>
                    </div>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">🚫</div>
                    <div class="advantage-content">
                        <div class="advantage-title">Блокировщик рекламы</div>
                        <div class="advantage-description">Встроенная защита от рекламы и трекеров</div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        document.getElementById('profile-btn').addEventListener('click', () => this.showProfile());
        document.addEventListener('click', (e) => {
            if (e.target.id === 'subscribe-btn' || e.target.id === 'renew-btn') {
                this.handleSubscription();
            }
        });
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