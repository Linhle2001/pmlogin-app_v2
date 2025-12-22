// Top Header Component - Chuyển đổi từ PyQt6 TopHeader class trong sidebar.py
import * as theme from './constants.js';

export class TopHeader {
    constructor(container) {
        this.container = container;
        this.onLogout = null;
        this.onChangePassword = null;
        this.userProfilePopup = null;
        this.bannerWidget = null;
        this.titleLabel = null;
        this.userLogo = null;
        this.init();
    }
    
    init() {
        this.createHeader();
        this.bindEvents();
    }
    
    createHeader() {
        this.container.innerHTML = '';
        this.container.className = 'top-header flex items-center justify-between px-5 py-0';
        this.container.style.cssText = `
            background-color: ${theme.COLOR_PRIMARY_LIGHT};
            border-bottom: 1px solid ${theme.COLOR_BG_SIDEBAR};
            color: ${theme.COLOR_TEXT_DARK};
            height: ${theme.SIZE_TOP_BAR_HEIGHT}px;
        `;
        
        // Title (Left side)
        this.titleLabel = document.createElement('h1');
        this.titleLabel.className = 'title-label text-lg font-bold';
        this.titleLabel.textContent = 'Hồ Sơ';
        this.titleLabel.style.color = theme.COLOR_TEXT_DARK;
        
        // Right side container
        const rightContainer = document.createElement('div');
        rightContainer.className = 'flex items-center space-x-3';
        
        // Banner widget
        this.createBannerWidget(rightContainer);
        
        // User info
        this.createUserInfo(rightContainer);
        
        this.container.appendChild(this.titleLabel);
        this.container.appendChild(rightContainer);
    }
    
    createBannerWidget(parent) {
        this.bannerWidget = document.createElement('div');
        this.bannerWidget.className = 'banner-widget';
        this.bannerWidget.style.cssText = `
            width: 480px;
            height: 50px;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            background-color: #f0f0f0;
        `;
        
        // Initialize ImageBannerWidget
        this.initBannerWidget();
        
        parent.appendChild(this.bannerWidget);
    }
    
    initBannerWidget() {
        this.bannerData = [];
        this.currentBannerIndex = -1;
        this.bannerTimer = null;
        this.fadeTimer = null;
        this.currentImage = null;
        this.nextImage = null;
        this.fadeOpacity = 0;
        this.isFading = false;
        
        // Load banner data
        this.loadBannerData();
        
        // Start banner rotation
        this.startBannerRotation();
    }
    
    loadBannerData() {
        // Try to load from JSON file
        fetch('../assets/image.json')
            .then(response => response.json())
            .then(data => {
                this.bannerData = data;
                this.prepareNextBanner();
            })
            .catch(error => {
                console.warn('Could not load image.json, using fallback data');
                this.bannerData = [
                    {"url": "https://via.placeholder.com/480x50/00A3FF/ffffff?text=Welcome+to+PMLogin"},
                    {"url": "https://via.placeholder.com/480x50/38c8c5/ffffff?text=Secure+Browser+Automation"},
                    {"url": "https://via.placeholder.com/480x50/ff5555/ffffff?text=Upgrade+Plan+Now"}
                ];
                this.prepareNextBanner();
            });
    }
    
    prepareNextBanner() {
        if (!this.bannerData.length) return;
        
        const nextIndex = (this.currentBannerIndex + 1) % this.bannerData.length;
        this.loadBannerByIndex(nextIndex);
    }
    
    loadBannerByIndex(index) {
        if (!this.bannerData[index]) return;
        
        const item = this.bannerData[index];
        const url = item.url;
        
        const img = new Image();
        img.onload = () => {
            this.startBannerFadeTransition(img, index);
        };
        img.onerror = () => {
            console.error('Failed to load banner image:', url);
        };
        
        if (url.startsWith('http')) {
            img.src = url;
        } else {
            // Local file
            img.src = `../assets/${url.split('assets/').pop()}`;
        }
    }
    
    startBannerFadeTransition(newImage, newIndex) {
        if (!this.currentImage) {
            this.currentImage = newImage;
            this.currentBannerIndex = newIndex;
            this.updateBannerDisplay();
            return;
        }
        
        this.nextImage = newImage;
        this.nextBannerIndex = newIndex;
        this.fadeOpacity = 0;
        this.isFading = true;
        
        this.startBannerFadeTimer();
    }
    
    startBannerFadeTimer() {
        if (this.fadeTimer) {
            clearInterval(this.fadeTimer);
        }
        
        this.fadeTimer = setInterval(() => {
            this.fadeOpacity += 0.02;
            if (this.fadeOpacity >= 1.0) {
                this.fadeOpacity = 1.0;
                this.isFading = false;
                clearInterval(this.fadeTimer);
                this.currentImage = this.nextImage;
                this.currentBannerIndex = this.nextBannerIndex;
                this.nextImage = null;
            }
            this.updateBannerDisplay();
        }, 25);
    }
    
    startBannerRotation() {
        if (this.bannerTimer) {
            clearInterval(this.bannerTimer);
        }
        
        this.bannerTimer = setInterval(() => {
            this.prepareNextBanner();
        }, 6000); // Change banner every 6 seconds
    }
    
    updateBannerDisplay() {
        if (!this.bannerWidget) return;
        
        this.bannerWidget.innerHTML = '';
        
        if (this.isFading && this.nextImage) {
            // Show fading transition
            const currentImg = document.createElement('img');
            currentImg.src = this.currentImage.src;
            currentImg.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                object-fit: cover;
                opacity: ${1 - this.fadeOpacity};
            `;
            
            const nextImg = document.createElement('img');
            nextImg.src = this.nextImage.src;
            nextImg.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                object-fit: cover;
                opacity: ${this.fadeOpacity};
            `;
            
            this.bannerWidget.appendChild(currentImg);
            this.bannerWidget.appendChild(nextImg);
        } else if (this.currentImage) {
            // Show current image
            const img = document.createElement('img');
            img.src = this.currentImage.src;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;
            this.bannerWidget.appendChild(img);
        }
    }
    
    createUserInfo(parent) {
        // User avatar/logo
        this.userLogo = document.createElement('div');
        this.userLogo.className = 'user-logo cursor-pointer transition-colors hover:opacity-80';
        this.userLogo.style.cssText = `
            width: ${theme.SIZE_AVATAR}px;
            height: ${theme.SIZE_AVATAR}px;
            background-color: ${theme.COLOR_PRIMARY_GREEN};
            color: ${theme.COLOR_AVATAR_FG};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        `;
        
        // Load user info and set initials
        this.loadUserInfo();
        
        parent.appendChild(this.userLogo);
    }
    
    loadUserInfo() {
        // TODO: Load from storage/API
        const fullName = this.loadFullNameFromJson();
        const initials = this.getInitials(fullName);
        this.userLogo.textContent = initials;
    }
    
    loadFullNameFromJson() {
        // TODO: Implement load user data from storage
        // For now, return default
        return "Admin User";
    }
    
    getInitials(fullName) {
        return fullName.split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'AD';
    }
    
    createUserProfilePopup() {
        if (this.userProfilePopup) {
            return this.userProfilePopup;
        }
        
        const popup = document.createElement('div');
        popup.className = 'user-profile-popup absolute z-50 hidden';
        popup.style.cssText = `
            background-color: ${theme.COLOR_BG_SIDEBAR};
            border-radius: ${theme.SIZE_BORDER_RADIUS_WIDGET}px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: ${theme.SIZE_POPUP_WIDTH}px;
            padding: 0;
            top: 100%;
            right: 0;
            margin-top: 5px;
        `;
        
        // Menu items
        const menuItems = [
            { id: 'change-password', text: 'Đổi mật khẩu', icon: '🔑' },
            { id: 'logout', text: 'Đăng xuất', icon: '↪️' }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'popup-menu-item cursor-pointer px-4 py-3 hover:bg-gray-100 transition-colors';
            menuItem.dataset.action = item.id;
            menuItem.style.cssText = `
                display: flex;
                align-items: center;
                font-size: 14px;
                color: ${theme.COLOR_TEXT_DARK};
            `;
            
            if (item.id === 'logout') {
                menuItem.style.borderTop = `1px solid ${theme.COLOR_BG_SIDEBAR}`;
            }
            
            menuItem.innerHTML = `
                <span style="margin-right: 10px; font-size: 16px;">${item.icon}</span>
                <span>${item.text}</span>
            `;
            
            menuItem.addEventListener('click', () => {
                this.hideUserProfilePopup();
                this.handleUserMenuAction(item.id);
            });
            
            popup.appendChild(menuItem);
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!popup.contains(e.target) && !this.userLogo.contains(e.target)) {
                this.hideUserProfilePopup();
            }
        });
        
        document.body.appendChild(popup);
        this.userProfilePopup = popup;
        return popup;
    }
    
    showUserProfilePopup() {
        const popup = this.createUserProfilePopup();
        const rect = this.userLogo.getBoundingClientRect();
        
        popup.style.left = `${rect.right - theme.SIZE_POPUP_WIDTH}px`;
        popup.style.top = `${rect.bottom + 5}px`;
        popup.classList.remove('hidden');
    }
    
    hideUserProfilePopup() {
        if (this.userProfilePopup) {
            this.userProfilePopup.classList.add('hidden');
        }
    }
    
    handleUserMenuAction(action) {
        switch (action) {
            case 'change-password':
                if (this.onChangePassword) {
                    this.onChangePassword();
                }
                break;
            case 'logout':
                if (this.onLogout) {
                    this.onLogout();
                }
                break;
        }
    }
    
    bindEvents() {
        // User logo click
        this.userLogo.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.userProfilePopup && !this.userProfilePopup.classList.contains('hidden')) {
                this.hideUserProfilePopup();
            } else {
                this.showUserProfilePopup();
            }
        });
    }
    
    setTitle(title) {
        if (this.titleLabel) {
            this.titleLabel.textContent = title;
        }
    }
    
    updateUserInfo(fullName, role) {
        const initials = this.getInitials(fullName);
        if (this.userLogo) {
            this.userLogo.textContent = initials;
        }
    }
    
    setOnLogout(callback) {
        this.onLogout = callback;
    }
    
    setOnChangePassword(callback) {
        this.onChangePassword = callback;
    }
    
    cleanup() {
        // Clean up timers
        if (this.bannerTimer) {
            clearInterval(this.bannerTimer);
            this.bannerTimer = null;
        }
        
        if (this.fadeTimer) {
            clearInterval(this.fadeTimer);
            this.fadeTimer = null;
        }
        
        console.log('TopHeader cleanup completed');
    }
}