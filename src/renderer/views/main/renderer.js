// Main dashboard renderer script - Simplified version for testing
class MainRenderer {
    constructor() {
        this.mainWindow = null;
        this.userData = null;
        this.profilesView = null;
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
                const result = await window.electronAPI.logout();
                
                if (result.success) {
                    console.log('✅ Logout successful');
                    // Navigation will be handled by main process
                } else {
                    console.error('❌ Logout failed:', result.message);
                    alert('Lỗi đăng xuất: ' + result.message);
                }
            } catch (error) {
                console.error('❌ Logout error:', error);
                alert('Lỗi đăng xuất: ' + error.message);
            }
        }
    }

    async loadUserData() {
        try {
            const result = await window.electronAPI.getUserData();
            if (result && result.user) {
                this.userData = result.user;
                this.updateUserInfo();
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
        
        // Show selected view
        const targetView = document.getElementById(`${viewName}View`);
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
        }
        
        console.log(`Switched to view: ${viewName}`);
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