// Main Window - Clean implementation for Electron.js

// Define theme colors inline to avoid import issues
const theme = {
    PRIMARY: '#22c55e',
    PRIMARY_DARK: '#16a34a',
    PRIMARY_800: '#166534',
    WHITE: '#ffffff',
    TEXT_WHITE: '#ffffff',
    GRAY_100: '#f3f4f6',
    
    SIDEBAR: {
        BG: '#1f2937',
        HEADER_BG: '#22c55e',
        ITEM_HOVER: '#374151',
        ITEM_ACTIVE: '#22c55e',
        TEXT: '#d1d5db',
        TEXT_ACTIVE: '#ffffff',
        LICENSE_BG: '#15803d'
    },
    
    HEADER: {
        BG: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        TEXT: '#ffffff',
        DEMO_BG: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        USER_MENU_BG: '#15803d',
        USER_MENU_HOVER: '#166534'
    }
};

export class MainWindow {
    constructor(container) {
        this.container = container;
        this.currentUser = null;
        this.currentActiveView = null;
        this.sidebar = null;
        this.header = null;
        this.contentStack = null;
        this.views = new Map();
        
        // Callbacks
        this.onLogout = null;
        this.onPasswordChanged = null;
        
        // Don't call init() here, it will be called from renderer.js
    }
    
    async init() {
        try {
            console.log('🏗️ Creating MainWindow...');
            this.createMainWindow();
            this.bindEvents();
            await this.navigateToPage('profiles'); // Default page
            console.log('✅ MainWindow created successfully');
        } catch (error) {
            console.error('❌ Error creating MainWindow:', error);
            this.createFallbackUI();
        }
    }
    
    createMainWindow() {
        this.container.innerHTML = '';
        this.container.className = 'main-window h-screen flex';
        this.container.style.cssText = `
            background-color: #ffffff;
        `;
        
        // Create simplified layout
        this.createSimplifiedLayout();
    }
    
    createSimplifiedLayout() {
        // Create main layout
        const layout = document.createElement('div');
        layout.className = 'flex h-full w-full';
        
        // Sidebar
        this.createSimplifiedSidebar(layout);
        
        // Main content area
        this.createSimplifiedContent(layout);
        
        this.container.appendChild(layout);
    }
    
    createSimplifiedSidebar(parent) {
        const sidebar = document.createElement('div');
        sidebar.className = 'w-64 text-white flex flex-col';
        sidebar.style.backgroundColor = theme.SIDEBAR.BG;
        
        // Header with logo
        const header = document.createElement('div');
        header.className = 'p-4';
        header.style.backgroundColor = theme.SIDEBAR.HEADER_BG;
        header.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <img src="../../../src/assets/logo_full.png" alt="PMLogin" class="w-8 h-8 object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <span style="color: ${theme.PRIMARY};" class="font-bold text-xl" style="display: none;">P</span>
                </div>
                <h1 class="text-xl font-bold" style="color: ${theme.TEXT_WHITE};">PMLogin</h1>
            </div>
        `;
        
        // Navigation
        const nav = document.createElement('nav');
        nav.className = 'flex-1 p-4 space-y-2';
        
        const menuItems = [
            { id: 'create-profile', text: '➕ Tạo Hồ Sơ' },
            { id: 'profiles', text: '📁 Hồ Sơ', active: true },
            { id: 'proxies', text: '🔗 Quản lý Proxy' },
            { id: 'store', text: '🛒 Cửa Hàng' },
            { id: 'automation', text: '🤖 Tự Động Hóa' },
            { id: 'account', text: '👤 Quản lý Tài Khoản' },
            { id: 'payment', text: '💳 Thanh Toán' },
            { id: 'settings', text: '⚙️ Cài Đặt' },
            { id: 'help', text: '❓ Trợ Giúp & Tài Liệu' }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('button');
            menuItem.className = 'w-full text-left p-3 rounded-lg transition-colors';
            
            if (item.active) {
                menuItem.style.backgroundColor = theme.SIDEBAR.ITEM_ACTIVE;
                menuItem.style.color = theme.SIDEBAR.TEXT_ACTIVE;
            } else {
                menuItem.style.color = theme.SIDEBAR.TEXT;
                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.backgroundColor = theme.SIDEBAR.ITEM_HOVER;
                    menuItem.style.color = theme.SIDEBAR.TEXT_ACTIVE;
                });
                menuItem.addEventListener('mouseleave', () => {
                    if (!menuItem.classList.contains('active')) {
                        menuItem.style.backgroundColor = 'transparent';
                        menuItem.style.color = theme.SIDEBAR.TEXT;
                    }
                });
            }
            
            menuItem.textContent = item.text;
            menuItem.dataset.pageId = item.id;
            
            menuItem.addEventListener('click', async () => {
                await this.navigateToPage(item.id);
                this.updateSidebarActive(menuItem);
            });
            
            nav.appendChild(menuItem);
        });
        
        // License card
        const licenseCard = document.createElement('div');
        licenseCard.className = 'm-4 p-4 rounded-lg';
        licenseCard.style.backgroundColor = theme.SIDEBAR.LICENSE_BG;
        licenseCard.innerHTML = `
            <div class="flex items-center mb-2">
                <span class="px-2 py-1 rounded text-xs font-bold mr-2" style="background-color: ${theme.WHITE}; color: ${theme.SIDEBAR.LICENSE_BG};">DEMO</span>
                <span class="text-sm" style="color: ${theme.TEXT_WHITE};">Demo Mode</span>
            </div>
            <button class="w-full py-2 rounded font-bold text-sm transition-colors" 
                    style="background-color: ${theme.WHITE}; color: ${theme.SIDEBAR.LICENSE_BG};"
                    onmouseover="this.style.backgroundColor='${theme.GRAY_100}'"
                    onmouseout="this.style.backgroundColor='${theme.WHITE}'">
                ⬆️ Upgrade Now
            </button>
        `;
        
        sidebar.appendChild(header);
        sidebar.appendChild(nav);
        sidebar.appendChild(licenseCard);
        parent.appendChild(sidebar);
        
        this.sidebar = { container: sidebar };
    }
    
    createSimplifiedContent(parent) {
        const content = document.createElement('div');
        content.className = 'flex-1 flex flex-col';
        
        // Header
        const header = document.createElement('header');
        header.className = 'h-16 border-b flex items-center justify-between px-6 shadow-lg';
        header.style.background = theme.HEADER.BG;
        header.style.borderColor = theme.PRIMARY_800;
        header.innerHTML = `
            <div class="flex items-center">
                <h2 id="page-title" class="text-lg font-bold" style="color: ${theme.HEADER.TEXT};">Hồ Sơ</h2>
            </div>
            <div class="flex items-center space-x-4">
                <div class="w-80 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium shadow-md" 
                     style="background: ${theme.HEADER.DEMO_BG};">
                    🎭 Demo Mode - Test Interface
                </div>
                <button id="user-menu" class="w-10 h-10 text-white rounded-full font-bold flex items-center justify-center transition-colors shadow-md"
                        style="background-color: ${theme.HEADER.USER_MENU_BG};"
                        onmouseover="this.style.backgroundColor='${theme.HEADER.USER_MENU_HOVER}'"
                        onmouseout="this.style.backgroundColor='${theme.HEADER.USER_MENU_BG}'">
                    DU
                </button>
            </div>
        `;
        
        // Content stack
        this.contentStack = document.createElement('div');
        this.contentStack.className = 'flex-1 overflow-auto bg-white';
        this.contentStack.id = 'content-stack';
        
        content.appendChild(header);
        content.appendChild(this.contentStack);
        parent.appendChild(content);
        
        // Bind header events
        const userMenu = header.querySelector('#user-menu');
        userMenu.addEventListener('click', () => {
            if (this.onLogout) {
                this.onLogout();
            }
        });
        
        this.header = { container: header };
    }
    
    updateSidebarActive(activeItem) {
        // Remove active from all items
        const menuItems = this.sidebar.container.querySelectorAll('button[data-page-id]');
        menuItems.forEach(item => {
            item.classList.remove('active');
            item.style.backgroundColor = 'transparent';
            item.style.color = theme.SIDEBAR.TEXT;
        });
        
        // Set active
        activeItem.classList.add('active');
        activeItem.style.backgroundColor = theme.SIDEBAR.ITEM_ACTIVE;
        activeItem.style.color = theme.SIDEBAR.TEXT_ACTIVE;
    }
    
    async navigateToPage(pageId) {
        console.log(`🔄 Navigating to: ${pageId}`);
        
        // Update title
        const titleMap = {
            'create-profile': 'Tạo Hồ Sơ',
            'profiles': 'Hồ Sơ',
            'proxies': 'Quản lý Proxy',
            'store': 'Cửa Hàng',
            'automation': 'Tự Động Hóa',
            'account': 'Quản lý Tài Khoản',
            'payment': 'Thanh Toán',
            'settings': 'Cài Đặt',
            'help': 'Trợ Giúp & Tài Liệu'
        };
        
        const title = titleMap[pageId] || pageId;
        const titleEl = document.getElementById('page-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
        
        // Create page content
        await this.createPageContent(pageId);
    }
    
    async createPageContent(pageId) {
        if (!this.contentStack) return;
        
        let content = '';
        
        switch (pageId) {
            case 'profiles':
                content = this.createProfilesContent();
                break;
            case 'create-profile':
                content = await this.createCreateProfileContent();
                break;
            case 'proxies':
                content = this.createProxiesContent();
                break;
            case 'store':
                content = this.createStoreContent();
                break;
            case 'automation':
                content = this.createAutomationContent();
                break;
            case 'account':
                content = this.createAccountContent();
                break;
            case 'payment':
                content = this.createPaymentContent();
                break;
            case 'settings':
                content = this.createSettingsContent();
                break;
            case 'help':
                content = this.createHelpContent();
                break;
            default:
                content = this.createDefaultContent(pageId);
        }
        
        this.contentStack.innerHTML = content;
    }
    
    createProfilesContent() {
        return `
            <div id="profilesView" class="profiles-view-container">
                <!-- ProfilesView component will be rendered here -->
                <div class="loading-placeholder">
                    <div class="flex items-center justify-center h-64">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p class="text-gray-600">Loading profiles...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async createCreateProfileContent() {
        try {
            console.log('🔄 [MainWindow] Loading create-profile content...');
            
            // Load CSS first
            this.loadCreateProfileCSS();
            
            // Inline HTML content instead of fetching from file
            const htmlContent = `
                <div class="create-profile-container">
                    <!-- Header -->
                    <div class="create-profile-header">
                        <h1 class="page-title">Tạo Hồ Sơ</h1>
                        <p class="page-subtitle">Tạo hồ sơ trình duyệt mới với cài đặt tùy chỉnh</p>
                    </div>

                    <!-- Scrollable Content -->
                    <div class="create-profile-content">
                        <!-- Taskbar will be inserted here by JavaScript -->
                        
                        <!-- Form Section -->
                        <div class="form-section">
                            <!-- Name and Group Row -->
                            <div class="form-row">
                                <div class="form-field">
                                    <label class="field-label">Tên</label>
                                    <input type="text" id="profileName" class="pmlogin-input pmlogin-input-md" placeholder="Tên hồ sơ" />
                                </div>
                                <div class="form-field">
                                    <label class="field-label">Nhóm</label>
                                    <div class="custom-selector" id="groupSelector">
                                        <button type="button" class="selector-button" id="groupButton">
                                            <span class="selector-text">Nhóm</span>
                                            <span class="selector-arrow">▼</span>
                                        </button>
                                        <div class="selector-dropdown" id="groupDropdown">
                                            <div class="dropdown-item" data-value="">Nhóm</div>
                                            <div class="dropdown-item" data-value="Work">Công việc</div>
                                            <div class="dropdown-item" data-value="Personal">Cá nhân</div>
                                            <div class="dropdown-item" data-value="Testing">Thử nghiệm</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Platform -->
                            <div class="form-field">
                                <label class="field-label">Nền tảng</label>
                                <select id="platformSelect" class="pmlogin-input pmlogin-input-md">
                                    <option value="Default">Mặc định</option>
                                    <option value="Windows">Windows</option>
                                    <option value="macOS">macOS</option>
                                    <option value="Linux">Linux</option>
                                </select>
                            </div>

                            <!-- Share on Cloud -->
                            <div class="checkbox-field">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="shareOnCloud" checked />
                                    <span class="checkbox-text">Chia sẻ trên Cloud ☁️</span>
                                </label>
                            </div>

                            <!-- Create Button -->
                            <button type="button" id="createProfileBtn" class="pmlogin-btn pmlogin-btn-primary pmlogin-btn-lg create-btn">
                                ➕ Tạo hồ sơ
                            </button>
                        </div>

                        <!-- Profiles Table will be inserted here by JavaScript -->

                        <!-- Tabs Section -->
                        <div class="tabs-section">
                            <div class="tab-header">
                                <button class="tab-button" data-tab="overview">Tổng quan</button>
                                <button class="tab-button active" data-tab="network">Mạng</button>
                                <button class="tab-button" data-tab="location">Vị trí</button>
                                <button class="tab-button" data-tab="hardware">Phần cứng</button>
                                <button class="tab-button" data-tab="cookies">Cookies</button>
                            </div>

                            <div class="tab-content">
                                <!-- Overview Tab -->
                                <div class="tab-pane" id="overviewTab">
                                    <div class="tab-placeholder">
                                        <p>Cài đặt tổng quan sẽ ở đây</p>
                                    </div>
                                </div>

                                <!-- Network Tab -->
                                <div class="tab-pane active" id="networkTab">
                                    <!-- Proxy Type Section -->
                                    <div class="section">
                                        <h3 class="section-title">Loại proxy</h3>
                                        <p class="section-description">Chỉ sử dụng proxy được gắn trực tiếp vào tài khoản của bạn</p>
                                        
                                        <div class="proxy-type-buttons">
                                            <label class="proxy-type-option">
                                                <input type="radio" name="proxyType" value="pm-proxy" />
                                                <div class="proxy-type-card">
                                                    <span class="proxy-type-icon">📋</span>
                                                    <span class="proxy-type-text">PM-Proxy</span>
                                                </div>
                                            </label>
                                            <label class="proxy-type-option">
                                                <input type="radio" name="proxyType" value="your-proxy" />
                                                <div class="proxy-type-card">
                                                    <span class="proxy-type-icon">🌐</span>
                                                    <span class="proxy-type-text">Proxy của bạn</span>
                                                </div>
                                            </label>
                                            <label class="proxy-type-option">
                                                <input type="radio" name="proxyType" value="without-proxy" checked />
                                                <div class="proxy-type-card">
                                                    <span class="proxy-type-icon">🌐</span>
                                                    <span class="proxy-type-text">Không proxy</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <!-- WebRTC Section -->
                                    <div class="section">
                                        <div class="section-header">
                                            <h3 class="section-title">WebRTC</h3>
                                            <span class="help-icon">ⓘ</span>
                                        </div>
                                        <select id="webrtcSelect" class="pmlogin-input pmlogin-input-md">
                                            <option value="Forward">Chuyển tiếp</option>
                                            <option value="Real">Thực</option>
                                            <option value="Altered">Thay đổi</option>
                                            <option value="Disabled">Vô hiệu hóa</option>
                                        </select>
                                    </div>

                                    <!-- PM-Proxy Section -->
                                    <div class="section proxy-section" id="pmProxySection" style="display: none;">
                                        <h3 class="section-title">Quản lý proxy</h3>
                                        <div class="proxy-manager-row">
                                            <div class="custom-selector proxy-selector" id="proxySelector">
                                                <button type="button" class="selector-button" id="proxyButton">
                                                    <span class="selector-text">Chọn proxy</span>
                                                    <span class="selector-arrow">▼</span>
                                                </button>
                                                <div class="selector-dropdown proxy-dropdown" id="proxyDropdown">
                                                    <div class="dropdown-item" data-value="">Chọn proxy</div>
                                                    <!-- Proxy items will be populated here -->
                                                </div>
                                            </div>
                                            <button type="button" class="pmlogin-btn pmlogin-btn-primary buy-proxy-btn">
                                                Mua proxy
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Your Proxy Section -->
                                    <div class="section proxy-section" id="yourProxySection" style="display: none;">
                                        <h3 class="section-title">Cấu hình proxy của bạn</h3>
                                        <div class="proxy-config-form">
                                            <div class="form-row">
                                                <div class="form-field">
                                                    <label class="field-label">Loại Proxy</label>
                                                    <select id="proxyTypeSelect" class="pmlogin-input pmlogin-input-md">
                                                        <option value="HTTP Proxy">HTTP Proxy</option>
                                                        <option value="SOCKS4 Proxy">SOCKS4 Proxy</option>
                                                        <option value="SOCKS5 Proxy">SOCKS5 Proxy</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-field">
                                                    <label class="field-label">Host</label>
                                                    <input type="text" id="proxyHost" class="pmlogin-input pmlogin-input-md" placeholder="127.0.0.1" />
                                                </div>
                                                <div class="form-field">
                                                    <label class="field-label">Port</label>
                                                    <input type="number" id="proxyPort" class="pmlogin-input pmlogin-input-md" placeholder="8080" />
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-field">
                                                    <label class="field-label">Username</label>
                                                    <input type="text" id="proxyUsername" class="pmlogin-input pmlogin-input-md" placeholder="Tùy chọn" />
                                                </div>
                                                <div class="form-field">
                                                    <label class="field-label">Password</label>
                                                    <input type="password" id="proxyPassword" class="pmlogin-input pmlogin-input-md" placeholder="Tùy chọn" />
                                                </div>
                                            </div>
                                            <div class="proxy-actions">
                                                <button type="button" class="pmlogin-btn pmlogin-btn-secondary pmlogin-btn-sm" id="testProxyBtn">
                                                    Kiểm tra Proxy
                                                </button>
                                                <button type="button" class="pmlogin-btn pmlogin-btn-ghost pmlogin-btn-sm" id="clearProxyBtn">
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Location Tab -->
                                <div class="tab-pane" id="locationTab">
                                    <!-- Timezone Section -->
                                    <div class="section">
                                        <h3 class="section-title">Múi giờ</h3>
                                        <div class="checkbox-field">
                                            <label class="checkbox-label">
                                                <input type="checkbox" id="timezoneAuto" checked />
                                                <span class="checkbox-text">Tự động điền múi giờ dựa trên IP bên ngoài</span>
                                            </label>
                                        </div>
                                    </div>

                                    <!-- Geolocation Section -->
                                    <div class="section">
                                        <h3 class="section-title">Vị trí địa lý</h3>
                                        <select id="geolocationSelect" class="pmlogin-input pmlogin-input-md">
                                            <option value="Prompt">Hỏi</option>
                                            <option value="Allow">Cho phép</option>
                                            <option value="Block">Chặn</option>
                                        </select>
                                        <div class="checkbox-field">
                                            <label class="checkbox-label">
                                                <input type="checkbox" id="geolocationAuto" checked />
                                                <span class="checkbox-text">Tự động điền vị trí dựa trên IP bên ngoài</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Hardware Tab -->
                                <div class="tab-pane" id="hardwareTab">
                                    <div class="tab-placeholder">
                                        <p>Cài đặt phần cứng sẽ ở đây</p>
                                    </div>
                                </div>

                                <!-- Cookies Tab -->
                                <div class="tab-pane" id="cookiesTab">
                                    <div class="section">
                                        <h3 class="section-title">Nhập cookies</h3>
                                        <textarea id="cookiesTextarea" class="cookies-textarea" placeholder="Kéo thả hoặc dán cookies"></textarea>
                                        <button type="button" class="pmlogin-btn pmlogin-btn-primary pmlogin-btn-md import-cookies-btn" id="importCookiesBtn">
                                            Nhập
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Load JavaScript after a short delay to ensure DOM is ready
            setTimeout(() => {
                this.loadCreateProfileJS();
            }, 100);
            
            console.log('✅ [MainWindow] Create-profile content loaded successfully');
            return htmlContent;
            
        } catch (error) {
            console.error('❌ [MainWindow] Error loading create-profile content:', error);
            
            // Fallback to simple content if anything fails
            return this.createCreateProfileFallback();
        }
    }
    
    createCreateProfileFallback() {
        return `
            <div class="p-6">
                <div class="max-w-2xl mx-auto">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Tạo Hồ Sơ Mới</h2>
                    <div class="bg-yellow-100 p-8 rounded-lg text-center">
                        <div class="text-yellow-600 text-6xl mb-4">⚠️</div>
                        <p class="text-yellow-800 mb-4">Không thể tải giao diện tạo hồ sơ đầy đủ</p>
                        <p class="text-yellow-700 text-sm">Đang sử dụng giao diện đơn giản</p>
                        
                        <div class="mt-6 max-w-md mx-auto">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Tên hồ sơ</label>
                                    <input type="text" id="profileName" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Nhập tên hồ sơ">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nền tảng</label>
                                    <select id="platformSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                        <option value="windows">Windows</option>
                                        <option value="macos">macOS</option>
                                        <option value="linux">Linux</option>
                                    </select>
                                </div>
                                <button type="button" id="createProfileBtn" class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                                    ➕ Tạo hồ sơ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    loadCreateProfileCSS() {
        // Check if CSS is already loaded
        if (document.querySelector('link[href*="create-profile.css"]')) {
            return;
        }
        
        // Load required CSS files in order
        const cssFiles = [
            './src/renderer/assets/components.css',
            './src/renderer/assets/theme.css', 
            './src/renderer/assets/profiles_structure.css',
            './src/renderer/assets/profiles_view.css',
            './src/renderer/views/create-profile/create-profile.css'
        ];
        
        cssFiles.forEach((href, index) => {
            // Check if already loaded
            if (document.querySelector(`link[href="${href}"]`)) {
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            
            // Add load event listener to check if CSS loaded successfully
            link.onload = () => {
                console.log(`✅ [MainWindow] CSS loaded: ${href}`);
            };
            link.onerror = (error) => {
                console.error(`❌ [MainWindow] Failed to load CSS: ${href}`, error);
            };
            
            // Add small delay between loads to ensure proper order
            setTimeout(() => {
                document.head.appendChild(link);
            }, index * 50);
        });
        
        console.log('✅ [MainWindow] All required CSS files queued for loading');
    }
    
    loadCreateProfileJS() {
        // Remove existing script if any
        const existingScript = document.querySelector('script[src*="create-profile.js"]');
        if (existingScript) {
            existingScript.remove();
        }
        
        const script = document.createElement('script');
        // Use absolute path from project root
        script.src = './src/renderer/views/create-profile/create-profile.js';
        script.onload = () => {
            console.log('✅ [MainWindow] Create-profile JS loaded successfully');
            
            // Initialize CreateProfileManager after script loads
            setTimeout(() => {
                try {
                    if (typeof CreateProfileManager !== 'undefined') {
                        window.createProfileManager = new CreateProfileManager();
                        console.log('✅ [MainWindow] CreateProfileManager initialized');
                    } else {
                        console.warn('⚠️ [MainWindow] CreateProfileManager class not found');
                    }
                } catch (error) {
                    console.error('❌ [MainWindow] Error initializing CreateProfileManager:', error);
                }
            }, 100);
        };
        script.onerror = (error) => {
            console.error('❌ [MainWindow] Error loading create-profile JS:', error);
        };
        document.body.appendChild(script);
    }
    
    createProxiesContent() {
        return `
            <div class="p-6">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Quản Lý Proxy</h2>
                    <div class="bg-gray-100 p-8 rounded-lg text-center">
                        <div class="text-gray-400 text-6xl mb-4">🔗</div>
                        <p class="text-gray-600">Tính năng Quản Lý Proxy đang được phát triển...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    createStoreContent() {
        return `
            <div class="p-6">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Cửa Hàng</h2>
                    <div class="bg-gray-100 p-8 rounded-lg text-center">
                        <div class="text-gray-400 text-6xl mb-4">🛒</div>
                        <p class="text-gray-600">Tính năng Cửa Hàng đang được phát triển...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    createAutomationContent() {
        return `
            <div class="p-6">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Tự Động Hóa</h2>
                    <div class="bg-gray-100 p-8 rounded-lg text-center">
                        <div class="text-gray-400 text-6xl mb-4">🤖</div>
                        <p class="text-gray-600">Tính năng Tự Động Hóa đang được phát triển...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    createAccountContent() {
        return `
            <div class="p-6">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Quản Lý Tài Khoản</h2>
                    <div class="bg-gray-100 p-8 rounded-lg text-center">
                        <div class="text-gray-400 text-6xl mb-4">👤</div>
                        <p class="text-gray-600">Tính năng Quản Lý Tài Khoản đang được phát triển...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    createPaymentContent() {
        return `
            <div class="p-6">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Thanh Toán</h2>
                    <div class="bg-gray-100 p-8 rounded-lg text-center">
                        <div class="text-gray-400 text-6xl mb-4">💳</div>
                        <p class="text-gray-600">Tính năng Thanh Toán đang được phát triển...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    createSettingsContent() {
        return `
            <div class="p-6">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Cài Đặt</h2>
                    <div class="bg-gray-100 p-8 rounded-lg text-center">
                        <div class="text-gray-400 text-6xl mb-4">⚙️</div>
                        <p class="text-gray-600">Tính năng Cài Đặt đang được phát triển...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    createHelpContent() {
        return `
            <div class="p-6">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Trợ Giúp & Tài Liệu</h2>
                    <div class="bg-gray-100 p-8 rounded-lg text-center">
                        <div class="text-gray-400 text-6xl mb-4">❓</div>
                        <p class="text-gray-600">Tính năng Trợ Giúp & Tài Liệu đang được phát triển...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    createDefaultContent(pageId) {
        return `
            <div class="p-6">
                <div class="max-w-2xl mx-auto">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${pageId}</h2>
                    <div class="bg-gray-100 p-8 rounded-lg text-center">
                        <div class="text-gray-400 text-6xl mb-4">⚙️</div>
                        <p class="text-gray-600">Tính năng ${pageId} đang được phát triển...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    createFallbackUI() {
        this.container.innerHTML = `
            <div class="flex items-center justify-center h-screen bg-gray-100">
                <div class="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <div class="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Lỗi tải giao diện</h2>
                    <p class="text-gray-600 mb-6">Có lỗi xảy ra khi tải MainWindow. Đang sử dụng giao diện dự phòng.</p>
                    <button onclick="location.reload()" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">
                        🔄 Tải lại
                    </button>
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }
    
    handleWindowResize() {
        console.log('Window resized');
    }
    
    setDashboardUser(userData) {
        try {
            if (!userData) {
                this.currentUser = null;
                localStorage.removeItem('userData');
                return;
            }
            
            this.currentUser = userData;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            console.log(`[INFO] [MainWindow] User set: ${userData.full_name || userData.email}`);
            
            // Update user avatar
            const userMenu = document.getElementById('user-menu');
            if (userMenu && userData.full_name) {
                const initials = userData.full_name
                    .split(' ')
                    .map(name => name[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                userMenu.textContent = initials;
            }
            
        } catch (error) {
            console.error('[ERROR] [MainWindow] Error setting dashboard user:', error);
        }
    }
    
    setOnLogout(callback) {
        this.onLogout = callback;
    }
    
    setOnPasswordChanged(callback) {
        this.onPasswordChanged = callback;
    }
    
    cleanup() {
        console.log('MainWindow cleanup completed');
    }
}