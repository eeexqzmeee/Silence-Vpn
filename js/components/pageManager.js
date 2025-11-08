class PageManager {
    constructor() {
        this.container = document.getElementById('pages-container');
        this.currentPage = null;
        this.setupGlobalListeners();
    }

    setupGlobalListeners() {
        // Предотвращаем закрытие страниц при клике на кнопки внутри них
        document.addEventListener('click', (e) => {
            if (this.currentPage && e.target.closest('.page-content')) {
                e.stopPropagation();
            }
        });
    }

    openSubscription() {
        const months = 1; // По умолчанию 1 месяц
        const totalPrice = app.subscriptionManager.calculatePrice(months, app.subscriptionManager.currentDevices);
        const basePrice = app.subscriptionManager.basePrice * months;
        const additionalPrice = Math.max(0, app.subscriptionManager.currentDevices - 1) * app.subscriptionManager.additionalDevicePrice * months;
        
        const pageHTML = `
            <div class="page">
                <button class="back-btn" onclick="app.pageManager.closeCurrent()">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="page-content">
                    <div class="page-header">
                        <h1 class="page-title">Продление подписки</h1>
                        <p class="page-subtitle">Выберите период и способ оплаты</p>
                    </div>

                    <div class="period-selector">
                        <h3 style="margin-bottom: var(--space-md); font-size: var(--font-size-lg);">Период подписки:</h3>
                        <div class="period-options">
                            <div class="period-option active" data-months="1" onclick="app.pageManager.selectPeriod(this, 1)">
                                <span class="period">1 месяц</span>
                                <span class="price">${app.subscriptionManager.calculatePrice(1, 1)} ₽</span>
                            </div>
                            <div class="period-option" data-months="2" onclick="app.pageManager.selectPeriod(this, 2)">
                                <span class="period">2 месяца</span>
                                <span class="price">${app.subscriptionManager.calculatePrice(2, 1)} ₽</span>
                            </div>
                            <div class="period-option" data-months="6" onclick="app.pageManager.selectPeriod(this, 6)">
                                <span class="period">6 месяцев</span>
                                <span class="price">${app.subscriptionManager.calculatePrice(6, 1)} ₽</span>
                            </div>
                            <div class="period-option" data-months="12" onclick="app.pageManager.selectPeriod(this, 12)">
                                <span class="period">12 месяцев</span>
                                <span class="price">${app.subscriptionManager.calculatePrice(12, 1)} ₽</span>
                            </div>
                        </div>
                    </div>

                    <div class="payment-methods">
                        <h3 style="margin-bottom: var(--space-md); font-size: var(--font-size-lg);">Способ оплаты:</h3>
                        <div class="payment-options">
                            <div class="payment-option active" onclick="app.pageManager.selectPayment(this)">
                                <i class="fab fa-cc-visa"></i>
                                <span>Банковская карта</span>
                            </div>
                            <div class="payment-option" onclick="app.pageManager.selectPayment(this)">
                                <i class="fas fa-mobile-alt"></i>
                                <span>СберПэй</span>
                            </div>
                        </div>
                    </div>

                    <div class="total-section">
                        <div class="total-row">
                            <span>Подписка (1 устройство):</span>
                            <span id="base-price">${basePrice} ₽</span>
                        </div>
                        <div class="total-row">
                            <span>Доп. устройства (${app.subscriptionManager.currentDevices - 1}):</span>
                            <span id="additional-price">${additionalPrice} ₽</span>
                        </div>
                        <div class="total-row total">
                            <strong>Итого:</strong>
                            <strong id="total-price">${totalPrice} ₽</strong>
                        </div>
                    </div>

                    <button class="btn btn-primary btn-large" onclick="app.subscriptionManager.processPayment()">
                        <i class="fas fa-lock"></i>
                        Оплатить
                    </button>
                </div>
            </div>
        `;
        this.renderPage(pageHTML, 'subscription');
    }

    openInstruction() {
        const pageHTML = `
            <div class="page">
                <button class="back-btn" onclick="app.pageManager.closeCurrent()">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="page-content">
                    <div class="page-header">
                        <h1 class="page-title">Инструкция по установке</h1>
                        <p class="page-subtitle">Подключитесь к Silence Proxy за 3 простых шага</p>
                    </div>
        
                    <div class="instruction-steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Скачайте Happ</h4>
                                <p>Установите приложение Happ из App Store. Это безопасное приложение для настройки VPN подключений.</p>
                                <div style="margin-top: var(--space-md);">
                                    <a href="https://apps.apple.com/app/happ-vpn/id123456789" class="app-store-btn" target="_blank">
                                        <i class="fab fa-apple"></i> Скачать в App Store
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>Получите ключ-ссылку</h4>
                                <p>После оплаты подписки скопируйте ваш уникальный ключ-ссылку для подключения к VPN сервису.</p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>Настройте подключение</h4>
                                <p>Откройте приложение Happ, вставьте ключ-ссылку в соответствующее поле и активируйте VPN подключение. Готово!</p>
                            </div>
                        </div>
                    </div>
        
                    <div class="action-buttons" style="margin-top: var(--space-2xl);">
                        <button class="btn btn-primary btn-large" onclick="app.subscriptionManager.downloadConfig()">
                            <i class="fas fa-key"></i>
                            Скопировать ключ-ссылку
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.renderPage(pageHTML, 'instruction');
    }

    selectPeriod(element, months) {
        document.querySelectorAll('.period-option').forEach(opt => {
            opt.classList.remove('active');
        });
        element.classList.add('active');
        
        // Update price with current devices count
        const basePrice = app.subscriptionManager.basePrice * months;
        const additionalPrice = Math.max(0, app.subscriptionManager.currentDevices - 1) * app.subscriptionManager.additionalDevicePrice * months;
        const totalPrice = basePrice + additionalPrice;

        // Update UI
        const basePriceElement = document.getElementById('base-price');
        const additionalPriceElement = document.getElementById('additional-price');
        const totalPriceElement = document.getElementById('total-price');

        if (basePriceElement) basePriceElement.textContent = `${basePrice} ₽`;
        if (additionalPriceElement) additionalPriceElement.textContent = `${additionalPrice} ₽`;
        if (totalPriceElement) totalPriceElement.textContent = `${totalPrice} ₽`;
    }

    openProfile(userData) {
        const transactions = this.getMockTransactions();
        
        const pageHTML = `
            <div class="page">
                <button class="back-btn" id="profile-back-btn">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="page-content">
                    <div class="page-header">
                        <h1 class="page-title">Профиль</h1>
                        <p class="page-subtitle">Управление вашим аккаунтом</p>
                    </div>

                    <div class="profile-section">
                        <div class="profile-info">
                            <div class="info-row">
                                <span>Имя в Telegram:</span>
                                <strong>${userData.name}</strong>
                            </div>
                            <div class="info-row">
                                <span>ID в Telegram:</span>
                                <strong>${userData.id}</strong>
                            </div>
                            <div class="info-row">
                                <span>Способ оплаты:</span>
                                <strong>${userData.paymentMethod}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3 style="margin-bottom: var(--space-md); font-size: var(--font-size-lg);">История транзакций</h3>
                        <div class="transactions-list">
                            ${transactions.map(transaction => `
                                <div class="transaction-item">
                                    <span>${transaction.description}</span>
                                    <span class="amount">${transaction.amount} ₽</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="referral-section">
                        <h3 style="margin-bottom: var(--space-md); font-size: var(--font-size-lg);">Реферальная программа</h3>
                        <p style="color: rgba(253, 236, 239, 0.7); margin-bottom: var(--space-md);">
                            Приводите друзей и получайте скидку 20% на продление подписки за каждого приглашенного
                        </p>
                        <div class="referral-link">
                            <input type="text" value="https://t.me/silenceproxy?start=ref${userData.id}" readonly 
                                   onclick="this.select(); document.execCommand('copy'); Helpers.showNotification('Ссылка скопирована')">
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button class="btn btn-secondary" id="profile-agreement-btn">
                            Пользовательское соглашение
                        </button>
                        <button class="btn btn-secondary" id="profile-promo-btn">
                            Ввести промокод
                        </button>
                        <a href="https://t.me/silenceproxysupport" class="btn btn-ghost" target="_blank">
                            <i class="fab fa-telegram"></i>
                            Связь с поддержкой
                        </a>
                    </div>
                </div>
            </div>
        `;
        this.renderPage(pageHTML, 'profile', () => {
            this.setupProfileEvents(userData);
        });
    }

    setupProfileEvents(userData) {
        const backBtn = document.getElementById('profile-back-btn');
        const agreementBtn = document.getElementById('profile-agreement-btn');
        const promoBtn = document.getElementById('profile-promo-btn');
        
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeCurrent();
            });
        }
        
        if (agreementBtn) {
            agreementBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openUserAgreement();
            });
        }
        
        if (promoBtn) {
            promoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openPromoCode();
            });
        }
    }

    openSupport() {
        const pageHTML = `
            <div class="page">
                <button class="back-btn" onclick="app.pageManager.closeCurrent()">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="page-content">
                    <div class="page-header">
                        <h1 class="page-title">Поддержка</h1>
                        <p class="page-subtitle">Ответы на частые вопросы</p>
                    </div>

                    <div class="faq-list">
                        <div class="faq-item">
                            <div class="faq-question">Как установить Happ?</div>
                            <div class="faq-answer">
                                Скачайте приложение Happ из официального магазина приложений (App Store или Google Play). 
                                После установки откройте приложение и перейдите к настройке подключения.
                            </div>
                        </div>
                        <div class="faq-item">
                            <div class="faq-question">Как получить конфигурационный файл?</div>
                            <div class="faq-answer">
                                После успешной оплаты подписки конфигурационный файл автоматически генерируется 
                                и становится доступен для скачивания в разделе "Инструкция по установке".
                            </div>
                        </div>
                        <div class="faq-item">
                            <div class="faq-question">Как добавить дополнительное устройство?</div>
                            <div class="faq-answer">
                                Перейдите в раздел "Устройства" и с помощью ползунка выберите нужное количество 
                                устройств. Стоимость изменится автоматически.
                            </div>
                        </div>
                        <div class="faq-item">
                            <div class="faq-question">Подписка не активировалась после оплаты</div>
                            <div class="faq-answer">
                                Обычно активация происходит мгновенно. Если подписка не активировалась в течение 
                                5 минут, пожалуйста, обратитесь в поддержку с чеком об оплате.
                            </div>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: var(--space-2xl);">
                        <a href="https://t.me/silenceproxysupport" class="btn btn-primary btn-large" target="_blank">
                            <i class="fab fa-telegram"></i>
                            Написать в поддержку
                        </a>
                    </div>
                </div>
            </div>
        `;
        this.renderPage(pageHTML, 'support');
    }

    selectPayment(element) {
        document.querySelectorAll('.payment-option').forEach(opt => {
            opt.classList.remove('active');
        });
        element.classList.add('active');
    }

    renderPage(html, pageName, onRender = null) {
        // Закрываем текущую страницу если есть
        if (this.currentPage) {
            this.closeCurrent(() => {
                this.container.innerHTML = html;
                this.currentPage = pageName;
                document.body.style.overflow = 'hidden';
                
                // Настраиваем события для страницы
                if (onRender) {
                    setTimeout(onRender, 10);
                }
            });
        } else {
            this.container.innerHTML = html;
            this.currentPage = pageName;
            document.body.style.overflow = 'hidden';
            
            // Настраиваем события для страницы
            if (onRender) {
                setTimeout(onRender, 10);
            }
        }
    }

    closeCurrent(callback = null) {
        if (this.currentPage && this.container) {
            const page = this.container.querySelector('.page');
            if (page) {
                page.classList.add('closing');
                setTimeout(() => {
                    this.container.innerHTML = '';
                    this.currentPage = null;
                    document.body.style.overflow = '';
                    if (callback) callback();
                }, 300);
            } else {
                this.container.innerHTML = '';
                this.currentPage = null;
                document.body.style.overflow = '';
                if (callback) callback();
            }
        } else if (callback) {
            callback();
        }
    }

    openPromoCode() {
        const pageHTML = `
            <div class="page">
                <button class="back-btn" id="promo-back-btn">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="page-content">
                    <div class="page-header">
                        <h1 class="page-title">Промокод</h1>
                        <p class="page-subtitle">Введите промокод для получения скидки</p>
                    </div>

                    <div style="background: var(--glass-bg); border-radius: var(--radius-xl); padding: var(--space-xl); border: 1px solid var(--glass-border); margin-bottom: var(--space-xl);">
                        <div style="margin-bottom: var(--space-md);">
                            <label style="display: block; margin-bottom: var(--space-sm); color: rgba(253, 236, 239, 0.7);">Промокод</label>
                            <input type="text" id="promo-input" placeholder="Введите промокод" style="width: 100%; padding: var(--space-md); background: rgba(253, 236, 239, 0.05); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); color: var(--secondary); font-size: var(--font-size-base);">
                        </div>
                        <button class="btn btn-primary" id="promo-apply-btn">
                            Применить промокод
                        </button>
                    </div>

                    <div style="background: var(--glass-bg); border-radius: var(--radius-xl); padding: var(--space-xl); border: 1px solid var(--glass-border);">
                        <h3 style="margin-bottom: var(--space-md); font-size: var(--font-size-lg);">Доступные промокоды</h3>
                        <div style="color: rgba(253, 236, 239, 0.7); font-size: var(--font-size-sm);">
                            <div style="margin-bottom: var(--space-sm);">• WELCOME10 - 10% скидка на первую подписку</div>
                            <div style="margin-bottom: var(--space-sm);">• FRIEND20 - 20% скидка по реферальной программе</div>
                            <div>• SUMMER15 - 15% скидка сезонное предложение</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.renderPage(pageHTML, 'promo', () => {
            this.setupPromoEvents();
        });
    }

    applyPromoCode() {
        const input = document.getElementById('promo-input');
        if (!input) return;
        
        const code = input.value.trim().toUpperCase();
        
        const validCodes = {
            'WELCOME10': '10% скидка применена!',
            'FRIEND20': '20% скидка применена!',
            'SUMMER15': '15% скидка применена!'
        };

        if (validCodes[code]) {
            Helpers.showNotification(validCodes[code], 'success');
            input.value = '';
        } else if (code) {
            Helpers.showNotification('Неверный промокод', 'error');
        } else {
            Helpers.showNotification('Введите промокод', 'warning');
        }
    }

    setupPromoEvents() {
        const backBtn = document.getElementById('promo-back-btn');
        const applyBtn = document.getElementById('promo-apply-btn');
        
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeCurrent();
            });
        }
        
        if (applyBtn) {
            applyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyPromoCode();
            });
        }
    }

    openUserAgreement() {
        const pageHTML = `
            <div class="page">
                <button class="back-btn" id="agreement-back-btn">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="page-content">
                    <div class="page-header">
                        <h1 class="page-title">Пользовательское соглашение</h1>
                        <p class="page-subtitle">Условия использования сервиса Silence Proxy</p>
                    </div>

                    <div style="background: var(--glass-bg); border-radius: var(--radius-xl); padding: var(--space-xl); border: 1px solid var(--glass-border); margin-bottom: var(--space-xl);">
                        <div style="color: rgba(253, 236, 239, 0.7); font-size: var(--font-size-sm); line-height: 1.6; max-height: 60vh; overflow-y: auto;">
                            <h4 style="color: var(--secondary); margin-bottom: var(--space-md);">1. Общие положения</h4>
                            <p style="margin-bottom: var(--space-lg);">1.1. Настоящее Пользовательское соглашение регулирует отношения между вами и сервисом Silence Proxy.</p>
                            
                            <h4 style="color: var(--secondary); margin-bottom: var(--space-md);">2. Условия использования</h4>
                            <p style="margin-bottom: var(--space-lg);">2.1. Сервис предоставляет доступ к VPN-соединению для обеспечения безопасности и конфиденциальности.</p>
                            
                            <h4 style="color: var(--secondary); margin-bottom: var(--space-md);">3. Оплата и подписка</h4>
                            <p style="margin-bottom: var(--space-lg);">3.1. Подписка автоматически продлевается, если не отменена за 24 часа до окончания периода.</p>
                            
                            <h4 style="color: var(--secondary); margin-bottom: var(--space-md);">4. Ответственность</h4>
                            <p style="margin-bottom: var(--space-lg);">4.1. Пользователь несет ответственность за использование сервиса в соответствии с законодательством.</p>
                            
                            <h4 style="color: var(--secondary); margin-bottom: var(--space-md);">5. Конфиденциальность</h4>
                            <p>5.1. Мы не храним логи вашей интернет-активности и не передаем данные третьим лицам.</p>
                        </div>
                    </div>

                    <div style="margin-top: var(--space-xl);">
                        <button class="btn btn-primary" id="agreement-close-btn">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.renderPage(pageHTML, 'agreement', () => {
            this.setupAgreementEvents();
        });
    }

    setupAgreementEvents() {
        const backBtn = document.getElementById('agreement-back-btn');
        const closeBtn = document.getElementById('agreement-close-btn');
        
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeCurrent();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeCurrent();
            });
        }
    }

    getMockTransactions() {
        return [
            { id: 1, description: 'Продление подписки', amount: 300, date: '2024-01-15' },
            { id: 2, description: 'Доп. устройство', amount: 50, date: '2024-01-10' },
            { id: 3, description: 'Продление подписки', amount: 100, date: '2023-12-20' }
        ];
    }
}