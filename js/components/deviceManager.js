class DeviceManager {
    constructor() {
        this.sliderActive = false;
    }

    setupSlider() {
        const container = document.querySelector('.slider-container');
        const thumb = document.querySelector('.slider-thumb');
        const fill = document.querySelector('.slider-fill');
        const value = document.querySelector('.slider-value');
        const marks = document.querySelectorAll('.slider-mark');

        if (!container) return;

        const updateSlider = (clientX) => {
            const rect = container.getBoundingClientRect();
            let percentage = (clientX - rect.left) / rect.width;
            percentage = Math.max(0, Math.min(1, percentage));
            
            const devices = Math.round(percentage * 4) + 1;
            this.updateDevices(devices);
        };

        // Mouse events
        thumb.addEventListener('mousedown', () => {
            this.sliderActive = true;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.sliderActive) {
                updateSlider(e.clientX);
            }
        });

        document.addEventListener('mouseup', () => {
            this.sliderActive = false;
        });

        // Touch events
        thumb.addEventListener('touchstart', (e) => {
            this.sliderActive = true;
            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (this.sliderActive && e.touches[0]) {
                updateSlider(e.touches[0].clientX);
            }
        });

        document.addEventListener('touchend', () => {
            this.sliderActive = false;
        });

        // Click on marks
        marks.forEach(mark => {
            mark.addEventListener('click', () => {
                const devices = parseInt(mark.dataset.devices);
                this.updateDevices(devices);
            });
        });
    }

    updateDevices(devices) {
        const percentage = ((devices - 1) / 4) * 100;
        
        document.querySelector('.slider-fill').style.width = `${percentage}%`;
        document.querySelector('.slider-thumb').style.left = `${percentage}%`;
        document.querySelector('.slider-value').textContent = devices;
        
        document.querySelectorAll('.slider-mark').forEach((mark, index) => {
            if (index < devices) {
                mark.classList.add('active');
            } else {
                mark.classList.remove('active');
            }
        });

        const additionalPrice = Math.max(0, devices - 1) * 50;
        document.querySelector('.price-change').textContent = `+${additionalPrice} ₽ к подписке`;

        return devices;
    }
}