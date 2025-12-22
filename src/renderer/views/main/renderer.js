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
            // Dynamic import to handle potential module loading issues
            const { MainWindow } = await import('./main-window.js');
            
            const appContainer = document.getElementById('app') || document.body;
            this.mainWindow = new MainWindow(appContainer);
            
            // Wait for initialization to complete
            await this.mainWindow.init();
            
            // Set callbacks
            this.mainWindow.setOnLogout(() => {
                this.handleLogout();
            });
            
            this.mainWindow.setOnPasswordChanged(() => {
                this.showSuccess('Mật khẩu đã được thay đổi thành công!');
            });
            
            console.log('✅ MainWindow initialized');
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
                await window.electronAPI.logout();
                // Navigation will be handled by main process
            } catch (error) {
                console.error('Logout error:', error);
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
        // Handle user data updates from main process
        if (window.electronAPI && window.electronAPI.onUserDataUpdate) {
            window.electronAPI.onUserDataUpdate((event, userData) => {
                console.log('User data updated:', userData);
                this.userData = userData;
                this.updateUserInfo();
            });
        }
        
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 DOM loaded, initializing MainRenderer...');
    window.mainRenderer = new MainRenderer();
});