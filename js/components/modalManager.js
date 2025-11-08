class ModalManager {
    constructor() {
        this.container = document.getElementById('modals-container');
    }

    openProfile(userData) {
        const modalHTML = `
            <div class="modal-overlay fade-in">
                <div class="modal-content glass slide-up">
                    <div class="modal-header">
                        <h2 class="modal-title">Профиль</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
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
                        <div class="modal-actions">
                            <button class="btn btn-secondary" data-action="payment-history">История платежей</button>
                            <button class="btn btn-secondary" data-action="referral">Реферальная программа</button>
                            <button class="btn btn-ghost" data-action="support">Связь с поддержкой</button>
                            <button class="btn btn-ghost" data-action="promo">Ввести промокод</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.renderModal(modalHTML);
    }

    openSupport() {
        const modalHTML = `
            <div class="modal-overlay fade-in">
                <div class="modal-content glass slide-up">
                    <div class="modal-header">
                        <h2 class="modal-title">Поддержка</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="faq-section">
                            <h3>Частые вопросы</h3>
                            <div class="faq-list">
                                <div class="faq-item">
                                    <div class="faq-question">Как установить Happ?</div>
                                    <div class="faq-answer">Скачайте приложение из официального магазина...</div>
                                </div>
                                <div class="faq-item">
                                    <div class="faq-question">Как получить конфиг?</div>
                                    <div class="faq-answer">Конфиг автоматически генерируется после оплаты...</div>
                                </div>
                            </div>
                        </div>
                        <div class="support-contact">
                            <a href="https://t.me/silenceproxysupport" class="btn btn-primary" target="_blank">
                                <i class="fab fa-telegram"></i>
                                Написать в поддержку
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.renderModal(modalHTML);
    }

    openSubscription() {
        const modalHTML = `
            <div class="modal-overlay fade-in">
                <div class="modal-content glass slide-up">
                    <div class="modal-header">
                        <h2 class="modal-title">Продление подписки</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="period-selector">
                            <h3>Выберите период:</h3>
                            <div class="period-options">
                                <div class="period-option active" data-months="1">
                                    <span class="period">1 месяц</span>
                                    <span class="price">100 ₽</span>
                                </div>
                                <div class="period-option" data-months="2">
                                    <span class="period">2 месяца</span>
                                    <span class="price">180 ₽</span>
                                </div>
                                <div class="period-option" data-months="6">
                                    <span class="period">6 месяцев</span>
                                    <span class="price">500 ₽</span>
                                </div>
                                <div class="period-option" data-months="12">
                                    <span class="period">12 месяцев</span>
                                    <span class="price">900 ₽</span>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-large">Оплатить</button>
                    </div>
                </div>
            </div>
        `;
        this.renderModal(modalHTML);
    }

    openDevices(currentDevices) {
        const additionalPrice = Math.max(0, currentDevices - 1) * 50;
        
        const modalHTML = `
            <div class="modal-overlay fade-in">
                <div class="modal-content glass slide-up">
                    <div class="modal-header">
                        <h2 class="modal-title">Устройства</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="devices-slider">
                            <div class="slider-header">
                                <span>Количество устройств</span>
                                <span class="slider-value">${currentDevices}</span>
                            </div>
                            <div class="slider-container">
                                <div class="slider-track"></div>
                                <div class="slider-fill" style="width: ${((currentDevices - 1) / 4) * 100}%"></div>
                                <div class="slider-thumb" style="left: ${((currentDevices - 1) / 4) * 100}%"></div>
                            </div>
                            <div class="slider-marks">
                                ${[1,2,3,4,5].map(i => `
                                    <span class="slider-mark ${i <= currentDevices ? 'active' : ''}" data-devices="${i}">${i}</span>
                                `).join('')}
                            </div>
                        </div>

                        <div class="price-info">
                            <p>+50₽ за каждое дополнительное устройство в месяц</p>
                            <div class="price-change">+${additionalPrice} ₽/месяц</div>
                        </div>

                        <button class="btn btn-primary btn-large" onclick="app.modalManager.updateDevices()">
                            Обновить
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.renderModal(modalHTML);
        this.setupDeviceSlider();
    }

    setupDeviceSlider() {
        const container = document.querySelector('.slider-container');
        const thumb = document.querySelector('.slider-thumb');
        const fill = document.querySelector('.slider-fill');
        const value = document.querySelector('.slider-value');
        const marks = document.querySelectorAll('.slider-mark');
        const priceChange = document.querySelector('.price-change');

        if (!container) return;

        let currentDevices = app.subscriptionManager.currentDevices;

        const updateDevicesDisplay = (devices) => {
            currentDevices = devices;
            const percentage = ((devices - 1) / 4) * 100;
            
            if (fill) fill.style.width = `${percentage}%`;
            if (thumb) thumb.style.left = `${percentage}%`;
            if (value) value.textContent = devices;
            
            // Update marks
            marks.forEach((mark, index) => {
                if (index < devices) {
                    mark.classList.add('active');
                } else {
                    mark.classList.remove('active');
                }
            });

            // Update price
            const additionalPrice = Math.max(0, devices - 1) * 50;
            if (priceChange) priceChange.textContent = `+${additionalPrice} ₽/месяц`;
        };

        const updateSlider = (clientX) => {
            const rect = container.getBoundingClientRect();
            let percentage = (clientX - rect.left) / rect.width;
            percentage = Math.max(0, Math.min(1, percentage));
            
            const devices = Math.round(percentage * 4) + 1;
            updateDevicesDisplay(devices);
        };

        // Mouse events
        if (thumb) {
            thumb.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const mouseMoveHandler = (e) => updateSlider(e.clientX);
                const mouseUpHandler = () => {
                    document.removeEventListener('mousemove', mouseMoveHandler);
                    document.removeEventListener('mouseup', mouseUpHandler);
                };
                
                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);
            });
        }

        // Click on track
        if (container) {
            container.addEventListener('click', (e) => {
                updateSlider(e.clientX);
            });
        }

        // Click on marks
        marks.forEach(mark => {
            mark.addEventListener('click', () => {
                const devices = parseInt(mark.dataset.devices);
                updateDevicesDisplay(devices);
            });
        });
    }

    updateDevices() {
        const currentValue = parseInt(document.querySelector('.slider-value').textContent);
        app.subscriptionManager.updateDevices(currentValue);
        this.closeAll();
        Helpers.showNotification(`Количество устройств обновлено: ${currentValue}`, 'success');
    }

    openInstruction() {
        const modalHTML = `
            <div class="modal-overlay fade-in">
                <div class="modal-content glass slide-up">
                    <div class="modal-header">
                        <h2 class="modal-title">Инструкция по установке</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="instruction-steps">
                            <div class="step">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <h4>Скачайте Happ</h4>
                                    <p>Установите приложение Happ из официального магазина</p>
                                </div>
                            </div>
                            <div class="step">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <h4>Получите конфиг</h4>
                                    <p>После оплаты подписки вам будет доступен файл конфигурации</p>
                                </div>
                            </div>
                            <div class="step">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <h4>Настройте подключение</h4>
                                    <p>Импортируйте конфиг в приложение Happ и активируйте VPN</p>
                                </div>
                            </div>
                        </div>
                        <div class="instruction-actions">
                            <button class="btn btn-secondary">
                                <i class="fas fa-download"></i>
                                Скачать конфиг
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.renderModal(modalHTML);
    }

    renderModal(html) {
        this.closeAll();
        this.container.innerHTML = html;
        this.setupModalEvents();
    }

    setupModalEvents() {
        const overlay = this.container.querySelector('.modal-overlay');
        const closeBtn = this.container.querySelector('.modal-close');
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeAll();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeAll());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAll();
        });
    }

    closeAll() {
        this.container.innerHTML = '';
    }
}