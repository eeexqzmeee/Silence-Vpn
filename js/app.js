class SilenceProxyApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupFallbackStyles();
        this.setupLightEffects(); // Добавляем эффекты света
        this.renderHeader();
        this.renderSubscription();
        this.renderActions();
        this.renderAdvantages();
        this.bindEvents();
        this.addScrollEffects();
    }

    setupLightEffects() {
        // Динамическое создание дополнительных лучей
        this.createDynamicRays();
        
        // Эффект взаимодействия с курсором
        this.setupCursorInteraction();
    }

    createDynamicRays() {
        const lightRays = document.querySelector('.light-rays');
        
        // Создаем дополнительные случайные лучи
        for (let i = 0; i < 3; i++) {
            const ray = document.createElement('div');
            ray.className = 'ray';
            
            const width = 150 + Math.random() * 200;
            const delay = Math.random() * 8;
            const duration = 8 + Math.random() * 8;
            const top = Math.random() * 100;
            
            ray.style.cssText = `
                width: ${width}px;
                height: 1px;
                top: ${top}%;
                left: -${width}px;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
                opacity: ${0.1 + Math.random() * 0.1};
            `;
            
            lightRays.appendChild(ray);
        }
    }

    setupCursorInteraction() {
        // Эффект следования за курсором
        document.addEventListener('mousemove', (e) => {
            if (window.innerWidth > 768) { // Только для десктопа
                this.handleMouseMove(e);
            }
        });
    }

    handleMouseMove(e) {
        const cards = document.querySelectorAll('.card, .action-btn, .advantage-card');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;
            
            const distanceX = Math.abs(e.clientX - cardCenterX);
            const distanceY = Math.abs(e.clientY - cardCenterY);
            
            // Эффект свечения при приближении курсора
            if (distanceX < 200 && distanceY < 200) {
                const intensity = 1 - (distanceX + distanceY) / 400;
                card.style.setProperty('--glow-intensity', intensity);
            }
        });
    }

    setupFallbackStyles() {
        // Убедимся, что переменные CSS установлены даже если Telegram API не работает
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        // Проверяем, установлены ли наши переменные
        if (!computedStyle.getPropertyValue('--primary').trim()) {
            root.style.setProperty('--primary', '#6A4CDF');
            root.style.setProperty('--primary-light', '#7D5FE8');
            root.style.setProperty('--primary-dark', '#5A3FC8');
            root.style.setProperty('--background', '#0A0A12');
            root.style.setProperty('--text', '#ffffff');
            root.style.setProperty('--text-light', '#B0B0C0');
        }
    }

    renderHeader() {
        const header = document.getElementById('header');
        header.innerHTML = `
            <div class="logo">
                <div class="logo-icon">SP</div>
                <div class="logo-text">Silence Proxy</div>
            </div>
            <button class="profile-btn" id="profile-btn" title="Профиль">
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
            <div class="subscription-status">
                <div class="status-icon active">🔒</div>
                <div class="status-info">
                    <div class="status-title">Премиум подписка</div>
                    <div class="status-subtitle">Active</div>
                </div>
                <div class="status-badge active">Active</div>
            </div>
            
            <div class="subscription-stats">
                <div class="stat-item">
                    <div class="stat-label">Истекает</div>
                    <div class="stat-value">${data.expiresAt}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Устройства</div>
                    <div class="stat-value">${data.devicesUsed}/${data.maxDevices}</div>
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
    const subscriptionData = this.getSubscriptionData();
    
    section.innerHTML = `
        <div class="actions-grid">
            <div class="main-actions">
                <button class="action-btn" id="subscribe-btn">
                    <div class="action-icon">💎</div>
                    <div class="action-content">
                        <div class="action-text">${subscriptionData.hasActiveSubscription ? 'Продлить подписку' : 'Подключить подписку'}</div>
                        <div class="action-description">${subscriptionData.hasActiveSubscription ? 'Продлите доступ к премиум функциям' : 'Получите доступ ко всем функциям VPN'}</div>
                    </div>
                </button>
                
                <button class="action-btn" id="devices-btn">
                    <div class="action-icon">📱</div>
                    <div class="action-content">
                        <div class="action-text">Управление устройствами</div>
                        <div class="action-description">Добавление и удаление устройств</div>
                    </div>
                </button>
            </div>
            
            <div class="secondary-actions">
                <button class="action-btn" id="vpn-setup-btn">
                    <div class="action-icon">⚙️</div>
                    <div class="action-content">
                        <div class="action-text">Настройка</div>
                        <div class="action-description">Инструкция по установке</div>
                    </div>
                </button>
                
                <button class="action-btn" id="support-btn">
                    <div class="action-icon">💬</div>
                    <div class="action-content">
                        <div class="action-text">Поддержка</div>
                        <div class="action-description">FAQ и помощь</div>
                    </div>
                </button>
            </div>
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
            
            <div class="advantage-card bottom-spacing"> <!-- Добавляем класс для отступа снизу -->
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
        document.getElementById('profile-btn').addEventListener('click', () => this.showProfile());
        document.getElementById('subscribe-btn').addEventListener('click', () => this.handleSubscription());
        document.getElementById('vpn-setup-btn').addEventListener('click', () => this.showVpnSetup());
        document.getElementById('devices-btn').addEventListener('click', () => this.handleDevices());
        document.getElementById('support-btn').addEventListener('click', () => this.showSupport());
    }

    addScrollEffects() {
        // Плавное появление элементов при скролле
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Наблюдаем за всеми карточками
        document.querySelectorAll('.card, .action-btn, .advantage-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            observer.observe(el);
        });
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
    try {
        new SilenceProxyApp();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Показываем fallback интерфейс
        document.body.innerHTML = `
            <div class="app">
                <div style="padding: 20px; text-align: center;">
                    <h1>Silence Proxy</h1>
                    <p>Приложение временно недоступно</p>
                    <button onclick="location.reload()">Перезагрузить</button>
                </div>
            </div>
        `;
    }
});