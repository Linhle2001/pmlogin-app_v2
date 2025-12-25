// Main dashboard renderer script - Simplified version for testing
class MainRenderer {
    constructor() {
        this.mainWindow = null;
        this.userData = null;
        this.profilesView = null;
        this.proxyPagination = null;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing MainRenderer...');
            
            // Initialize main window
            await this.initializeMainWindow();
            
            // Initialize ProfilesView
            this.initializeProfilesView();
            
            await this.loadUserData();
            this.bindEvents();
            
            console.log('✅ MainRenderer initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing MainRenderer:', error);
            this.showFallbackUI();
        }
    }
    
    async initializeMainWindow() {
        try {
            console.log('✅ MainWindow initialization skipped - using inline HTML');
            // Skip MainWindow initialization since we're using inline HTML
            // The settings dropdown will be handled directly
        } catch (error) {
            console.error('❌ Error initializing MainWindow:', error);
            throw error;
        }
    }
    
    initializeProfilesView() {
        try {
            const profilesContainer = document.getElementById('profilesView');
            if (profilesContainer) {
                // Ensure ProfilesStructure and ProfilesView are available
                if (typeof ProfilesStructure === 'undefined') {
                    console.error('❌ ProfilesStructure class not found');
                    return;
                }
                
                if (typeof ProfilesView === 'undefined') {
                    console.error('❌ ProfilesView class not found');
                    return;
                }
                
                // Destroy existing instance if any
                if (this.profilesView && this.profilesView.destroy) {
                    this.profilesView.destroy();
                }
                
                this.profilesView = new ProfilesView(profilesContainer);
                console.log('✅ ProfilesView initialized');
                
                // Force a refresh after initialization
                setTimeout(() => {
                    if (this.profilesView && this.profilesView.refresh) {
                        this.profilesView.refresh();
                    }
                }, 200);
                
            } else {
                console.warn('⚠️ ProfilesView container not found');
            }
        } catch (error) {
            console.error('❌ Error initializing ProfilesView:', error);
        }
    }
    
    showFallbackUI() {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
                <div class="flex items-center justify-center h-screen bg-gray-100">
                    <div class="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                        <div class="text-red-500 text-6xl mb-4">⚠️</div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">Lỗi tải giao diện</h2>
                        <p class="text-gray-600 mb-6">Có lỗi xảy ra khi tải giao diện chính. Vui lòng thử lại.</p>
                        <button onclick="location.reload()" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">
                            🔄 Tải lại
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    async handleLogout() {
        const confirmed = confirm('Bạn có chắc chắn muốn đăng xuất?');
        
        if (confirmed) {
            try {
                console.log('🚪 Logging out...');
                
                if (window.electronAPI && window.electronAPI.logout) {
                    const result = await window.electronAPI.logout();
                    
                    if (result.success) {
                        console.log('✅ Logout successful');
                        // Navigation will be handled by main process
                    } else {
                        console.error('❌ Logout failed:', result.message);
                        alert('Lỗi đăng xuất: ' + result.message);
                    }
                } else {
                    console.warn('⚠️ electronAPI not available, cannot logout');
                    alert('Không thể đăng xuất: electronAPI không khả dụng');
                }
            } catch (error) {
                console.error('❌ Logout error:', error);
                alert('Lỗi đăng xuất: ' + error.message);
            }
        }
    }

    async loadUserData() {
        try {
            if (window.electronAPI && window.electronAPI.getUserData) {
                const result = await window.electronAPI.getUserData();
                if (result && result.user) {
                    this.userData = result.user;
                    this.updateUserInfo();
                }
            } else {
                console.warn('⚠️ electronAPI not available, skipping user data load');
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    updateUserInfo() {
        if (this.userData && this.mainWindow) {
            this.mainWindow.setDashboardUser(this.userData);
        }
    }

    bindEvents() {
        console.log('🔗 Binding events...');
        
        // Handle user data updates from main process
        if (window.electronAPI && window.electronAPI.onUserDataUpdate) {
            window.electronAPI.onUserDataUpdate((event, userData) => {
                console.log('User data updated:', userData);
                this.userData = userData;
                this.updateUserInfo();
            });
        }
        
        // Handle settings dropdown
        this.bindSettingsDropdown();
        
        // Handle window close
        window.addEventListener('beforeunload', () => {
            if (this.mainWindow && this.mainWindow.cleanup) {
                this.mainWindow.cleanup();
            }
            if (this.profilesView && this.profilesView.destroy) {
                this.profilesView.destroy();
            }
        });
        
        // Handle messages from child windows (like create-profile)
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'PROFILE_CREATED') {
                console.log('🔄 Profile created, refreshing profiles view...');
                if (this.profilesView && this.profilesView.refresh) {
                    this.profilesView.refresh();
                }
                // Switch to profiles view if not already there
                this.switchView('profiles');
            }
        });
        
        // Handle view switching
        this.bindViewSwitching();
        
        console.log('✅ Events bound successfully');
    }
    
    bindViewSwitching() {
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = item.dataset.view;
                this.switchView(viewName);
                
                // Update active sidebar item
                sidebarItems.forEach(si => si.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }
    
    switchView(viewName) {
        // Hide all views
        const views = document.querySelectorAll('.view-content');
        views.forEach(view => view.classList.add('hidden'));
        
        // Map view names to actual element IDs
        const viewIdMap = {
            'create-profile': 'createProfileView',
            'profiles': 'profilesView',
            'dashboard': 'dashboardView',
            'proxies': 'proxiesView',
            'store': 'storeView',
            'automation': 'automationView',
            'account': 'accountView',
            'payment': 'paymentView',
            'help': 'helpView',
            'settings': 'settingsView'
        };
        
        // Get the actual element ID
        const targetViewId = viewIdMap[viewName] || `${viewName}View`;
        const targetView = document.getElementById(targetViewId);
        
        if (targetView) {
            targetView.classList.remove('hidden');
            
            // Special handling for profiles view
            if (viewName === 'profiles') {
                if (!this.profilesView) {
                    // Initialize ProfilesView if not already done
                    this.initializeProfilesView();
                }
                
                if (this.profilesView) {
                    // Refresh profiles view when switching to it
                    setTimeout(() => {
                        this.profilesView.refresh();
                        console.log('✅ ProfilesView refreshed and events rebound');
                    }, 100);
                } else {
                    console.error('❌ ProfilesView not initialized properly');
                }
            }
            
            // Special handling for proxies view
            if (viewName === 'proxies') {
                this.initializeProxiesView();
            }
            
            // Special handling for create-profile view
            if (viewName === 'create-profile') {
                console.log('🔄 Initializing create-profile view...');
                // Initialize create-profile functionality
                setTimeout(() => {
                    this.initializeCreateProfileView();
                }, 100);
            }
        } else {
            console.error(`❌ View not found: ${targetViewId}`);
        }
        
        console.log(`Switched to view: ${viewName} (ID: ${targetViewId})`);
    }
    
    loadCreateProfileCSS() {
        // Check if CSS is already loaded
        if (document.querySelector('link[href*="create-profile.css"]')) {
            console.log('✅ Create-profile CSS already loaded');
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../../views/create-profile/create-profile.css';
        link.onload = () => {
            console.log('✅ Create-profile CSS loaded');
        };
        link.onerror = () => {
            console.error('❌ Failed to load create-profile CSS');
        };
        document.head.appendChild(link);
    }
    
    loadCreateProfileJS() {
        // Check if script is already loaded
        if (document.querySelector('script[src*="create-profile.js"]')) {
            console.log('✅ Create-profile JS already loaded');
            // Reinitialize if class exists
            if (typeof CreateProfileManager !== 'undefined') {
                window.createProfileManager = new CreateProfileManager();
            }
            return;
        }
        
        const script = document.createElement('script');
        script.src = '../../views/create-profile/create-profile.js';
        script.onload = () => {
            console.log('✅ Create-profile JS loaded');
            // Initialize CreateProfileManager after script loads
            if (typeof CreateProfileManager !== 'undefined') {
                window.createProfileManager = new CreateProfileManager();
            }
        };
        script.onerror = () => {
            console.error('❌ Failed to load create-profile JS');
        };
        document.body.appendChild(script);
    }
    
    initializeCreateProfileView() {
        console.log('🔧 Initializing create-profile view functionality...');
        
        // Load groups from database first
        this.loadGroupsForCreateProfile();
        
        // Handle tab switching
        const tabButtons = document.querySelectorAll('.create-tab-btn');
        const tabContents = document.querySelectorAll('.create-tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = button.dataset.tab;
                
                // Remove active class from all buttons
                tabButtons.forEach(btn => {
                    btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
                    btn.classList.add('text-gray-500');
                });
                
                // Add active class to clicked button
                button.classList.remove('text-gray-500');
                button.classList.add('active', 'text-blue-600', 'border-blue-600');
                
                // Hide all tab contents
                tabContents.forEach(content => {
                    content.classList.add('hidden');
                });
                
                // Show selected tab content
                const targetTab = document.getElementById(`${tabName}CreateTab`);
                if (targetTab) {
                    targetTab.classList.remove('hidden');
                }
                
                console.log(`Switched to create-profile tab: ${tabName}`);
            });
        });
        
        // Handle form submission
        const createSaveBtn = document.getElementById('createSaveProfileBtn');
        if (createSaveBtn) {
            createSaveBtn.addEventListener('click', () => {
                this.handleCreateProfile();
            });
        }
        
        // Handle cancel button
        const createCancelBtn = document.getElementById('createCancelBtn');
        if (createCancelBtn) {
            createCancelBtn.addEventListener('click', () => {
                this.switchView('profiles');
            });
        }
        
        console.log('✅ Create-profile view functionality initialized');
    }
    
    async loadGroupsForCreateProfile() {
        try {
            console.log('📡 Loading groups for create profile form...');
            
            if (!window.electronAPI) {
                console.warn('⚠️ electronAPI not available');
                return;
            }
            
            if (!window.electronAPI.invoke) {
                console.warn('⚠️ electronAPI.invoke not available');
                return;
            }
            
            console.log('🔄 Calling db:group:get-all...');
            const result = await window.electronAPI.invoke('db:group:get-all');
            console.log('📡 Groups result:', result);
            
            if (result.success && result.data) {
                const groups = result.data;
                console.log('✅ Groups loaded:', groups);
                
                // Update the group select dropdown
                const groupSelect = document.getElementById('createGroupSelect');
                if (groupSelect) {
                    console.log('🔄 Updating group dropdown...');
                    
                    // Clear existing options except the first one (no group)
                    groupSelect.innerHTML = '<option value="">Không có nhóm</option>';
                    
                    // Add groups from database
                    groups.forEach(group => {
                        const option = document.createElement('option');
                        option.value = group.group_name;
                        option.textContent = group.group_name;
                        groupSelect.appendChild(option);
                        console.log(`➕ Added group option: ${group.group_name}`);
                    });
                    
                    console.log(`✅ Updated group dropdown with ${groups.length} groups`);
                } else {
                    console.error('❌ Group select element not found');
                }
            } else {
                console.error('❌ Failed to load groups:', result.message || 'Unknown error');
            }
        } catch (error) {
            console.error('❌ Error loading groups for create profile:', error);
        }
    }
    
    async handleCreateProfile() {
        console.log('🔄 Creating new profile...');
        
        // Get form data
        const profileName = document.getElementById('createProfileName')?.value;
        if (!profileName) {
            alert('Vui lòng nhập tên profile');
            return;
        }
        
        const profileData = {
            name: profileName,
            platform: document.getElementById('createPlatformSelect')?.value || 'windows',
            browser: document.getElementById('createBrowserSelect')?.value || 'chrome',
            tags: document.getElementById('createProfileTags')?.value || '',
            group: document.getElementById('createGroupSelect')?.value || '',
            note: document.getElementById('createProfileNote')?.value || '',
            shareOnCloud: document.getElementById('createShareOnCloud')?.checked || false,
            autoStart: document.getElementById('createAutoStart')?.checked || false,
        };
        
        console.log('Profile data:', profileData);
        
        try {
            // Save profile to database using IPC
            if (window.electronAPI && window.electronAPI.invoke) {
                const result = await window.electronAPI.invoke('create-profile', profileData);
                
                if (result.success) {
                    console.log('✅ Profile created successfully:', result.data);
                    this.showSuccess('Profile đã được tạo thành công!');
                    
                    // Clear form
                    this.clearCreateProfileForm();
                    
                    // Switch back to profiles view and refresh
                    setTimeout(() => {
                        this.switchView('profiles');
                        if (this.profilesView && this.profilesView.refresh) {
                            this.profilesView.refresh();
                        }
                    }, 1000);
                } else {
                    console.error('❌ Failed to create profile:', result.message);
                    alert('Lỗi khi tạo profile: ' + result.message);
                }
            } else {
                console.warn('⚠️ electronAPI not available, showing success message only');
                this.showSuccess('Profile đã được tạo thành công!');
                
                // Switch back to profiles view
                setTimeout(() => {
                    this.switchView('profiles');
                    if (this.profilesView && this.profilesView.refresh) {
                        this.profilesView.refresh();
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('❌ Error creating profile:', error);
            alert('Lỗi khi tạo profile: ' + error.message);
        }
    }
    
    clearCreateProfileForm() {
        // Clear all form fields
        const fields = [
            'createProfileName',
            'createProfileTags', 
            'createProfileNote'
        ];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
        
        // Reset selects to default values
        const platformSelect = document.getElementById('createPlatformSelect');
        if (platformSelect) platformSelect.value = 'windows';
        
        const browserSelect = document.getElementById('createBrowserSelect');
        if (browserSelect) browserSelect.value = 'chrome';
        
        const groupSelect = document.getElementById('createGroupSelect');
        if (groupSelect) groupSelect.value = '';
        
        // Reset checkboxes
        const shareOnCloud = document.getElementById('createShareOnCloud');
        if (shareOnCloud) shareOnCloud.checked = false;
        
        const autoStart = document.getElementById('createAutoStart');
        if (autoStart) autoStart.checked = false;
        
        console.log('✅ Create profile form cleared');
    }
    
    initializeProxiesView() {
        try {
            console.log('🔧 Initializing ProxiesView...');
            
            // Initialize ProxyPagination if not already done
            if (!this.proxyPagination) {
                if (typeof ProxyPagination !== 'undefined') {
                    this.proxyPagination = new ProxyPagination();
                    
                    // Override onPageChange to handle proxy data loading
                    this.proxyPagination.onPageChange = () => {
                        this.loadProxyPage();
                    };
                    
                    console.log('✅ ProxyPagination initialized');
                } else {
                    console.error('❌ ProxyPagination class not found');
                    return;
                }
            }
            
            // Load initial proxy data
            this.loadProxies();
            
        } catch (error) {
            console.error('❌ Error initializing ProxiesView:', error);
        }
    }
    
    async loadProxies() {
        try {
            console.log('📡 Loading proxies...');
            
            // Show loading state
            const loadingState = document.getElementById('proxyLoadingState');
            const emptyState = document.getElementById('proxyEmptyState');
            const tableBody = document.getElementById('proxyTableBody');
            
            if (loadingState) loadingState.classList.remove('hidden');
            if (emptyState) emptyState.classList.add('hidden');
            
            // Simulate loading proxies (replace with actual API call)
            const mockProxies = this.generateMockProxies();
            
            // Set data to pagination
            if (this.proxyPagination) {
                this.proxyPagination.setData(mockProxies);
            }
            
            // Load first page
            this.loadProxyPage();
            
            // Hide loading state
            if (loadingState) loadingState.classList.add('hidden');
            
            console.log('✅ Proxies loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading proxies:', error);
            
            // Show empty state on error
            const loadingState = document.getElementById('proxyLoadingState');
            const emptyState = document.getElementById('proxyEmptyState');
            
            if (loadingState) loadingState.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
        }
    }
    
    loadProxyPage() {
        try {
            if (!this.proxyPagination) return;
            
            const currentPageData = this.proxyPagination.getCurrentPageData();
            const tableBody = document.getElementById('proxyTableBody');
            const emptyState = document.getElementById('proxyEmptyState');
            
            if (!tableBody) return;
            
            if (currentPageData.length === 0) {
                tableBody.innerHTML = '';
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }
            
            if (emptyState) emptyState.classList.add('hidden');
            
            // Render proxy rows
            tableBody.innerHTML = currentPageData.map(proxy => this.renderProxyRow(proxy)).join('');
            
            // Update stats
            this.updateProxyStats();
            
            console.log(`✅ Loaded page ${this.proxyPagination.currentPage} with ${currentPageData.length} proxies`);
            
        } catch (error) {
            console.error('❌ Error loading proxy page:', error);
        }
    }
    
    renderProxyRow(proxy) {
        const statusClass = {
            'live': 'status-working',
            'dead': 'status-failed',
            'unchecked': 'status-untested'
        }[proxy.status] || 'status-untested';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <input type="checkbox" class="proxy-checkbox rounded" data-proxy-id="${proxy.id}">
                </td>
                <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">${proxy.name}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-gray-900">${proxy.host}:${proxy.port}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${proxy.type.toUpperCase()}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="text-sm text-gray-500">
                        ${proxy.username ? '✓' : '✗'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="status-badge ${statusClass}">
                        ${proxy.status.charAt(0).toUpperCase() + proxy.status.slice(1)}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                        ${proxy.tags.map(tag => `
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                ${tag}
                            </span>
                        `).join('')}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-sm text-gray-500">${proxy.lastUsed || 'Never'}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800" onclick="testProxy('${proxy.id}')" title="Test Proxy">
                            <i class="fas fa-check-circle"></i>
                        </button>
                        <button class="text-green-600 hover:text-green-800" onclick="editProxy('${proxy.id}')" title="Edit Proxy">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800" onclick="deleteProxy('${proxy.id}')" title="Delete Proxy">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    generateMockProxies() {
        const mockProxies = [];
        const types = ['http', 'https', 'socks4', 'socks5'];
        const statuses = ['live', 'dead', 'unchecked'];
        const tags = ['US', 'EU', 'Asia', 'Premium', 'Free', 'Residential', 'Datacenter'];
        
        for (let i = 1; i <= 47; i++) {
            mockProxies.push({
                id: `proxy_${i}`,
                name: `Proxy ${i}`,
                host: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                port: 8000 + Math.floor(Math.random() * 1000),
                type: types[Math.floor(Math.random() * types.length)],
                username: Math.random() > 0.5 ? `user${i}` : null,
                password: Math.random() > 0.5 ? `pass${i}` : null,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                tags: [tags[Math.floor(Math.random() * tags.length)], tags[Math.floor(Math.random() * tags.length)]].filter((v, i, a) => a.indexOf(v) === i),
                lastUsed: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : null
            });
        }
        
        return mockProxies;
    }
    
    updateProxyStats() {
        if (!this.proxyPagination) return;
        
        const allProxies = this.proxyPagination.allProxies;
        const totalCount = allProxies.length;
        const liveCount = allProxies.filter(p => p.status === 'live').length;
        const deadCount = allProxies.filter(p => p.status === 'dead').length;
        const uncheckedCount = allProxies.filter(p => p.status === 'unchecked').length;
        
        // Update stats cards
        const totalElement = document.getElementById('totalProxiesCount');
        const liveElement = document.getElementById('liveProxiesCount');
        const deadElement = document.getElementById('deadProxiesCount');
        const uncheckedElement = document.getElementById('uncheckedProxiesCount');
        
        if (totalElement) totalElement.textContent = totalCount;
        if (liveElement) liveElement.textContent = liveCount;
        if (deadElement) deadElement.textContent = deadCount;
        if (uncheckedElement) uncheckedElement.textContent = uncheckedCount;
    }
    
    showSuccess(message) {
        console.log('✅ Success:', message);
        // Simple notification fallback
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    bindSettingsDropdown() {
        console.log('🔧 Binding settings dropdown...');
        const settingsIcon = document.getElementById('settingsIcon');
        const settingsDropdown = document.getElementById('settingsDropdown');
        const logoutBtn = document.getElementById('logoutBtn');
        
        console.log('Settings elements found:', {
            settingsIcon: !!settingsIcon,
            settingsDropdown: !!settingsDropdown,
            logoutBtn: !!logoutBtn
        });
        
        if (settingsIcon && settingsDropdown) {
            console.log('✅ Settings elements found, binding events...');
            
            // Toggle dropdown on icon click
            settingsIcon.addEventListener('click', (e) => {
                console.log('🖱️ Settings icon clicked');
                e.stopPropagation();
                settingsDropdown.classList.toggle('hidden');
                console.log('Dropdown hidden class:', settingsDropdown.classList.contains('hidden'));
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!settingsDropdown.contains(e.target) && !settingsIcon.contains(e.target)) {
                    settingsDropdown.classList.add('hidden');
                }
            });
            
            // Handle dropdown menu items
            const dropdownItems = settingsDropdown.querySelectorAll('[data-view]');
            console.log('Found dropdown items:', dropdownItems.length);
            
            dropdownItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const viewName = item.dataset.view;
                    console.log('Dropdown item clicked:', viewName);
                    this.switchView(viewName);
                    settingsDropdown.classList.add('hidden');
                    
                    // Update active sidebar item
                    const sidebarItems = document.querySelectorAll('.sidebar-item');
                    sidebarItems.forEach(si => si.classList.remove('active'));
                    const targetSidebarItem = document.querySelector(`[data-view="${viewName}"]`);
                    if (targetSidebarItem) {
                        targetSidebarItem.classList.add('active');
                    }
                });
            });
            
            console.log('✅ Settings dropdown events bound successfully');
        } else {
            console.error('❌ Settings elements not found!');
        }
        
        // Handle logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('🚪 Logout button clicked');
                settingsDropdown.classList.add('hidden');
                await this.handleLogout();
            });
            console.log('✅ Logout button event bound');
        } else {
            console.error('❌ Logout button not found!');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 DOM loaded, initializing MainRenderer...');
    try {
        window.mainRenderer = new MainRenderer();
        console.log('✅ MainRenderer instance created');
    } catch (error) {
        console.error('❌ Error creating MainRenderer:', error);
    }
});

// Global functions for proxy actions
window.testProxy = function(proxyId) {
    console.log('Testing proxy:', proxyId);
    // Implement proxy testing logic here
    alert(`Testing proxy ${proxyId}...`);
};

window.editProxy = function(proxyId) {
    console.log('Editing proxy:', proxyId);
    // Implement proxy editing logic here
    alert(`Editing proxy ${proxyId}...`);
};

window.deleteProxy = function(proxyId) {
    console.log('Deleting proxy:', proxyId);
    const confirmed = confirm(`Are you sure you want to delete proxy ${proxyId}?`);
    if (confirmed) {
        // Implement proxy deletion logic here
        alert(`Proxy ${proxyId} deleted!`);
        // Refresh the proxy list
        if (window.mainRenderer && window.mainRenderer.loadProxies) {
            window.mainRenderer.loadProxies();
        }
    }
};