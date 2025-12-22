// Sidebar Component - Chuyển đổi từ PyQt6 sidebar.py
import * as theme from './constants.js';
import { createIconButton } from './button-styles.js';

export class Sidebar {
    constructor(container) {
        this.container = container;
        this.currentActiveItem = null;
        this.menuItems = [];
        this.onPageChange = null;
        this.automationMenu = null;
        this.userProfilePopup = null;
        this.bannerWidget = null;
        this.init();
    }
    
    init() {
        this.createSidebar();
        this.bindEvents();
    }
    
    createSidebar() {
        this.container.innerHTML = '';
        this.container.className = 'sidebar flex flex-col';
        this.container.style.cssText = `
            background-color: ${theme.COLOR_BG_SIDEBAR};
            width: ${theme.SIZE_SIDEBAR_WIDTH}px;
            min-height: 100vh;
        `;
        
        // Header với logo
        this.createHeader();
        
        // Navigation menu
        this.createNavigation();
        
        // License card
        this.createLicenseCard();
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.className = 'logo-header p-4 flex items-center space-x-3';
        header.style.cssText = `
            background-color: ${theme.COLOR_PRIMARY_GREEN};
            border-radius: 0;
            padding: 16px;
        `;
        
        // Logo với hình tròn
        const logoContainer = document.createElement('div');
        logoContainer.className = 'w-18 h-18 rounded-full flex items-center justify-center shadow-lg';
        logoContainer.style.cssText = `
            background-color: ${theme.COLOR_BG_WHITE};
            width: 72px;
            height: 72px;
        `;
        
        const logoImg = document.createElement('img');
        logoImg.src = '../assets/logo_on.png';
        logoImg.alt = 'PMLogin Logo';
        logoImg.className = 'w-16 h-16 rounded-full';
        logoImg.style.cssText = 'width: 60px; height: 60px; border-radius: 50%;';
        
        // Fallback nếu không load được ảnh
        logoImg.onerror = () => {
            logoContainer.innerHTML = `<i class="fas fa-shield-alt text-3xl" style="color: ${theme.COLOR_PRIMARY_GREEN}"></i>`;
        };
        
        logoContainer.appendChild(logoImg);
        
        // Title
        const titleContainer = document.createElement('div');
        titleContainer.innerHTML = `
            <h1 class="text-xl font-bold" style="color: ${theme.COLOR_BG_WHITE}; font-size: 18px; font-weight: 800;">PMLogin</h1>
        `;
        
        header.appendChild(logoContainer);
        header.appendChild(titleContainer);
        this.container.appendChild(header);
    }
    
    createNavigation() {
        const nav = document.createElement('nav');
        nav.className = 'flex-1 p-3 space-y-1';
        nav.style.cssText = `
            background-color: ${theme.COLOR_BG_SIDEBAR};
            border-radius: ${theme.SIZE_BORDER_RADIUS_WIDGET}px;
            margin: 12px;
            padding: 12px;
        `;
        
        const menuItems = [
            { id: 'create-profile', text: 'Tạo Hồ Sơ', icon: '➕' },
            { id: 'profiles', text: 'Hồ Sơ', icon: '🗂️', active: true },
            { id: 'proxies', text: 'Quản lý proxy', icon: '🔗' },
            { id: 'store', text: 'Cửa Hàng', icon: '🛒' },
            { id: 'automation', text: 'Tự Động Hóa', icon: '🤖', hasSubmenu: true },
            { id: 'account', text: 'Quản lý tài khoản', icon: '👤' },
            { id: 'payment', text: 'Thanh Toán', icon: '💳' },
            { id: 'settings', text: 'Cài Đặt', icon: '⚙️' },
            { id: 'help', text: 'Trợ Giúp & Tài Liệu', icon: '❓' }
        ];
        
        menuItems.forEach(item => {
            const menuItem = this.createMenuItem(item);
            nav.appendChild(menuItem);
            this.menuItems.push({ element: menuItem, data: item });
            
            if (item.active) {
                this.setActiveItem(menuItem);
            }
        });
        
        this.container.appendChild(nav);
    }
    
    createMenuItem(item) {
        const menuItem = document.createElement('div');
        menuItem.className = 'sidebar-item cursor-pointer transition-all duration-200 rounded-lg';
        menuItem.dataset.view = item.id;
        menuItem.style.cssText = `
            height: 40px;
            display: flex;
            align-items: center;
            padding: 0 12px;
            margin-bottom: 6px;
            border-radius: ${theme.SIZE_BORDER_RADIUS_BUTTON}px;
        `;
        
        // Indicator (thanh dọc bên trái)
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        indicator.style.cssText = `
            width: 4px;
            height: 100%;
            background-color: transparent;
            margin-right: 8px;
            border-radius: 2px;
        `;
        
        // Icon background
        const iconBg = document.createElement('div');
        iconBg.className = 'icon-bg';
        iconBg.style.cssText = `
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            background: transparent;
            margin-right: 12px;
        `;
        
        // Icon
        const icon = document.createElement('span');
        icon.className = 'menu-icon';
        icon.textContent = item.icon;
        icon.style.cssText = `
            font-size: 16px;
            color: ${theme.COLOR_TEXT_SUBTLE};
        `;
        
        iconBg.appendChild(icon);
        
        // Text
        const text = document.createElement('span');
        text.className = 'menu-text';
        text.textContent = item.text;
        text.style.cssText = `
            font-size: 14px;
            color: ${theme.COLOR_TEXT_DARK};
            flex: 1;
        `;
        
        menuItem.appendChild(indicator);
        menuItem.appendChild(iconBg);
        menuItem.appendChild(text);
        
        // Hover effects
        this.addMenuItemHoverEffects(menuItem, item);
        
        return menuItem;
    }
    
    addMenuItemHoverEffects(menuItem, item) {
        let isHovered = false;
        let hoverOpacity = 0;
        let animationFrame = null;
        
        const updateHoverEffect = () => {
            if (!menuItem.classList.contains('active')) {
                const bgColor = `rgba(${parseInt(theme.COLOR_HOVER_BG.slice(1, 3), 16)}, ${parseInt(theme.COLOR_HOVER_BG.slice(3, 5), 16)}, ${parseInt(theme.COLOR_HOVER_BG.slice(5, 7), 16)}, ${hoverOpacity * 0.6})`;
                menuItem.style.backgroundColor = bgColor;
                
                const icon = menuItem.querySelector('.menu-icon');
                const text = menuItem.querySelector('.menu-text');
                
                if (isHovered) {
                    icon.style.color = theme.COLOR_PRIMARY_DARK;
                    text.style.color = theme.COLOR_PRIMARY_DARK;
                    text.style.fontWeight = '600';
                } else {
                    icon.style.color = theme.COLOR_TEXT_SUBTLE;
                    text.style.color = theme.COLOR_TEXT_DARK;
                    text.style.fontWeight = 'normal';
                }
            }
        };
        
        const animateHover = (targetOpacity) => {
            const animate = () => {
                const step = 0.05;
                if (targetOpacity > hoverOpacity) {
                    hoverOpacity = Math.min(hoverOpacity + step, targetOpacity);
                } else {
                    hoverOpacity = Math.max(hoverOpacity - step, targetOpacity);
                }
                
                updateHoverEffect();
                
                if (Math.abs(hoverOpacity - targetOpacity) > 0.01) {
                    animationFrame = requestAnimationFrame(animate);
                }
            };
            
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
            animate();
        };
        
        menuItem.addEventListener('mouseenter', () => {
            isHovered = true;
            animateHover(1.0);
        });
        
        menuItem.addEventListener('mouseleave', () => {
            isHovered = false;
            animateHover(0.0);
        });
    }
    
    createAutomationMenu() {
        if (this.automationMenu) {
            return this.automationMenu;
        }
        
        const menu = document.createElement('div');
        menu.className = 'automation-menu absolute z-50 hidden';
        menu.style.cssText = `
            background-color: ${theme.COLOR_BG_WHITE};
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 200px;
            padding: 8px 0;
        `;
        
        const menuItems = [
            { text: 'Ứng Dụng', icon: '📱' },
            { text: 'Lần Chạy', icon: '⏱️' },
            { text: 'Nhiệm Vụ', icon: '✓' }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'automation-menu-item cursor-pointer px-3 py-2 hover:bg-gray-100 transition-colors';
            menuItem.style.cssText = `
                display: flex;
                align-items: center;
                font-size: 13px;
                color: ${theme.COLOR_TEXT_DARK};
            `;
            
            menuItem.innerHTML = `
                <span style="margin-right: 8px;">${item.icon}</span>
                <span>${item.text}</span>
            `;
            
            menuItem.addEventListener('click', () => {
                this.hideAutomationMenu();
                if (this.onPageChange) {
                    this.onPageChange(item.text);
                }
            });
            
            menu.appendChild(menuItem);
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !e.target.closest('[data-view="automation"]')) {
                this.hideAutomationMenu();
            }
        });
        
        document.body.appendChild(menu);
        this.automationMenu = menu;
        return menu;
    }
    
    showAutomationMenu(buttonElement) {
        const menu = this.createAutomationMenu();
        const rect = buttonElement.getBoundingClientRect();
        
        menu.style.left = `${rect.right + 10}px`;
        menu.style.top = `${rect.top}px`;
        menu.classList.remove('hidden');
    }
    
    hideAutomationMenu() {
        if (this.automationMenu) {
            this.automationMenu.classList.add('hidden');
        }
    }
    
    createLicenseCard() {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'p-2';
        cardWrapper.style.cssText = `
            background-color: transparent;
            margin: 8px;
        `;
        
        const card = document.createElement('div');
        card.className = 'license-card rounded-lg p-4 shadow-lg';
        card.style.cssText = `
            background-color: ${theme.COLOR_PRIMARY_GREEN};
            color: white;
            border-radius: ${theme.SIZE_BORDER_RADIUS_WIDGET}px;
            padding: 15px;
        `;
        
        // Header
        const header = document.createElement('div');
        header.className = 'flex items-center space-x-2 mb-2';
        
        const iconLabel = document.createElement('div');
        iconLabel.style.cssText = `
            font-size: 18px;
            background-color: ${theme.COLOR_BG_WHITE};
            color: ${theme.COLOR_PRIMARY_DARK};
            border-radius: 8px;
            padding: 4px 8px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        iconLabel.textContent = '⬆️';
        
        const titleLabel = document.createElement('div');
        titleLabel.style.cssText = `
            font-size: 15px;
            font-weight: bold;
            color: white;
        `;
        titleLabel.textContent = 'SOLO';
        
        header.appendChild(iconLabel);
        header.appendChild(titleLabel);
        
        // Expiry info
        const expiry = document.createElement('div');
        expiry.className = 'flex items-center space-x-1 mb-3';
        expiry.innerHTML = `
            <span style="font-size: 14px; color: #f0f0f0;">Expired</span>
            <span style="font-size: 12px; color: white;">in 3 months</span>
        `;
        
        // Upgrade button
        const upgradeBtn = document.createElement('button');
        upgradeBtn.id = 'upgradeBtn';
        upgradeBtn.className = 'w-full py-2 px-4 rounded-md text-sm font-medium transition-colors hover:opacity-90';
        upgradeBtn.style.cssText = `
            background-color: ${theme.COLOR_BG_WHITE};
            color: ${theme.COLOR_PRIMARY_DARK};
            border: none;
            border-radius: 6px;
            height: 35px;
            cursor: pointer;
        `;
        upgradeBtn.innerHTML = '⬆️ Upgrade now';
        
        card.appendChild(header);
        card.appendChild(expiry);
        card.appendChild(upgradeBtn);
        cardWrapper.appendChild(card);
        this.container.appendChild(cardWrapper);
    }
    
    bindEvents() {
        // Menu item clicks
        this.container.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.sidebar-item');
            if (menuItem) {
                e.preventDefault();
                const viewId = menuItem.dataset.view;
                
                // Xử lý automation menu riêng
                if (viewId === 'automation') {
                    this.showAutomationMenu(menuItem);
                    return;
                }
                
                this.setActiveItem(menuItem);
                
                if (this.onPageChange) {
                    this.onPageChange(viewId);
                }
            }
        });
        
        // Upgrade button
        const upgradeBtn = this.container.querySelector('#upgradeBtn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                if (this.onPageChange) {
                    this.onPageChange('Plan');
                }
            });
        }
    }
    
    setActiveItem(activeItem) {
        // Remove active state from all items
        this.menuItems.forEach(({ element }) => {
            element.classList.remove('active');
            element.style.backgroundColor = 'transparent';
            
            // Reset indicator
            const indicator = element.querySelector('.indicator');
            if (indicator) {
                indicator.style.backgroundColor = 'transparent';
            }
            
            // Reset icon and text colors
            const icon = element.querySelector('.menu-icon');
            const text = element.querySelector('.menu-text');
            const iconBg = element.querySelector('.icon-bg');
            
            if (icon) icon.style.color = theme.COLOR_TEXT_SUBTLE;
            if (text) {
                text.style.color = theme.COLOR_TEXT_DARK;
                text.style.fontWeight = 'normal';
            }
            if (iconBg) iconBg.style.backgroundColor = 'transparent';
        });
        
        // Set active state
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.style.backgroundColor = theme.COLOR_PRIMARY_LIGHT;
            activeItem.style.borderTopRightRadius = `${theme.SIZE_BORDER_RADIUS_BUTTON}px`;
            activeItem.style.borderBottomRightRadius = `${theme.SIZE_BORDER_RADIUS_BUTTON}px`;
            
            // Set active indicator
            const indicator = activeItem.querySelector('.indicator');
            if (indicator) {
                indicator.style.backgroundColor = theme.COLOR_PRIMARY_GREEN;
            }
            
            // Set active icon and text colors
            const icon = activeItem.querySelector('.menu-icon');
            const text = activeItem.querySelector('.menu-text');
            const iconBg = activeItem.querySelector('.icon-bg');
            
            if (icon) icon.style.color = theme.COLOR_PRIMARY_DARK;
            if (text) {
                text.style.color = theme.COLOR_PRIMARY_DARK;
                text.style.fontWeight = 'bold';
            }
            if (iconBg) iconBg.style.backgroundColor = theme.COLOR_PRIMARY_LIGHT;
        }
        
        this.currentActiveItem = activeItem;
    }
    
    updateUserInfo(userData) {
        // Cập nhật thông tin user nếu cần
        console.log('Updating user info:', userData);
    }
    
    setOnPageChange(callback) {
        this.onPageChange = callback;
    }
    
    // Helper methods từ Python version
    loadFullNameFromJson() {
        // TODO: Implement load user data from storage
        return "User";
    }
    
    getInitials(fullName) {
        return fullName.split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'AD';
    }
}