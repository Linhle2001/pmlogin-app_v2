/**
 * Main Logic Integration for PMLogin Application
 * Tích hợp với main_logic_handler.py để thay thế logic JavaScript trong index.html
 */

class MainLogicIntegration {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
        
        console.log('🔄 MainLogicIntegration initialized');
    }
    
    // ==================== UTILITY METHODS ====================
    
    /**
     * Call Python backend through Electron IPC
     */
    async callPythonBackend(method, ...args) {
        try {
            if (!window.electronAPI || !window.electronAPI.invoke) {
                throw new Error('Electron API not available');
            }
            
            console.log(`🐍 Calling Python backend: ${method}`, args);
            
            const result = await window.electronAPI.invoke('python-backend:main-logic', {
                method: method,
                args: args
            });
            
            console.log(`✅ Python backend response:`, result);
            return result;
            
        } catch (error) {
            console.error(`❌ Python backend error for ${method}:`, error);
            throw error;
        }
    }
    
    /**
     * Get cached data if valid
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            console.log(`📦 Using cached data for: ${key}`);
            return cached.data;
        }
        return null;
    }
    
    /**
     * Set cached data
     */
    setCachedData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }
    
    // ==================== DASHBOARD METHODS ====================
    
    /**
     * Lấy thống kê dashboard từ Python backend
     * Thay thế cho updateDashboardStats() trong index.html
     */
    async getDashboardStats() {
        try {
            const cacheKey = 'dashboard_stats';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;
            
            const result = await this.callPythonBackend('get_dashboard_stats');
            
            if (result.success) {
                this.setCachedData(cacheKey, result.data);
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to get dashboard stats');
            }
        } catch (error) {
            console.error('❌ Error getting dashboard stats:', error);
            throw error;
        }
    }
    
    /**
     * Cập nhật UI dashboard với dữ liệu từ Python backend
     */
    async updateDashboardUI() {
        try {
            console.log('🔄 Updating dashboard UI from Python backend...');
            
            const stats = await this.getDashboardStats();
            
            // Update UI elements
            const totalProxiesEl = document.getElementById('totalProxies');
            const workingProxiesEl = document.getElementById('workingProxies');
            const totalProfilesEl = document.getElementById('totalProfiles');
            const appVersionEl = document.getElementById('appVersionDashboard');
            
            if (totalProxiesEl) totalProxiesEl.textContent = stats.proxies.total;
            if (workingProxiesEl) workingProxiesEl.textContent = stats.proxies.working;
            if (totalProfilesEl) totalProfilesEl.textContent = stats.profiles.total;
            if (appVersionEl) appVersionEl.textContent = stats.system.version;
            
            // Update recent activity
            const recentActivityEl = document.getElementById('recentActivity');
            if (recentActivityEl && stats.profiles.recent_activity) {
                this.updateRecentActivity(recentActivityEl, stats.profiles.recent_activity);
            }
            
            console.log('✅ Dashboard UI updated successfully');
            
        } catch (error) {
            console.error('❌ Failed to update dashboard UI:', error);
            this.showNotification('Không thể cập nhật thống kê dashboard', 'error');
        }
    }
    
    /**
     * Update recent activity section
     */
    updateRecentActivity(container, activities) {
        if (!activities || activities.length === 0) return;
        
        container.innerHTML = '';
        
        activities.forEach(activity => {
            const activityEl = document.createElement('div');
            activityEl.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';
            
            const iconClass = activity.action === 'created' ? 'fas fa-plus-circle text-green-500' : 'fas fa-info-circle text-blue-500';
            const timeStr = activity.timestamp ? new Date(activity.timestamp * 1000).toLocaleString() : 'Unknown time';
            
            activityEl.innerHTML = `
                <i class="${iconClass}"></i>
                <div class="flex-1">
                    <span class="text-gray-700">Profile "${activity.name}" đã được ${activity.action}</span>
                    <div class="text-xs text-gray-500">${timeStr}</div>
                </div>
            `;
            
            container.appendChild(activityEl);
        });
    }
    
    // ==================== PROFILES METHODS ====================
    
    /**
     * Lấy danh sách profiles từ Python backend
     * Thay thế cho initializeProfiles() trong index.html
     */
    async getProfiles() {
        try {
            const cacheKey = 'profiles_list';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;
            
            const result = await this.callPythonBackend('get_profiles_summary');
            
            if (result) {
                this.setCachedData(cacheKey, result);
                return result;
            } else {
                throw new Error('Failed to get profiles');
            }
        } catch (error) {
            console.error('❌ Error getting profiles:', error);
            throw error;
        }
    }
    
    /**
     * Tạo profile mới từ Python backend
     * Thay thế cho handleCreateProfile() trong index.html
     */
    async createProfile(profileData) {
        try {
            console.log('🔄 Creating profile via Python backend:', profileData);
            
            const result = await this.callPythonBackend('create_profile', profileData);
            
            if (result.success) {
                // Clear cache
                this.cache.delete('profiles_list');
                this.cache.delete('dashboard_stats');
                
                console.log('✅ Profile created successfully:', result.data);
                return result;
            } else {
                throw new Error(result.message || 'Failed to create profile');
            }
        } catch (error) {
            console.error('❌ Error creating profile:', error);
            throw error;
        }
    }
    
    // ==================== PROXY METHODS ====================
    
    /**
     * Lấy danh sách proxy từ Python backend
     * Thay thế cho loadProxiesFromBackend() trong index.html
     */
    async getProxies() {
        try {
            const cacheKey = 'proxies_list';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;
            
            const result = await this.callPythonBackend('get_all_proxies');
            
            if (result.success) {
                const data = {
                    proxies: result.data || [],
                    count: result.count || 0
                };
                this.setCachedData(cacheKey, data);
                return data;
            } else {
                throw new Error(result.message || 'Failed to get proxies');
            }
        } catch (error) {
            console.error('❌ Error getting proxies:', error);
            throw error;
        }
    }
    
    /**
     * Lấy thống kê proxy từ Python backend
     * Thay thế cho updateProxyStats() trong index.html
     */
    async getProxyStats() {
        try {
            const cacheKey = 'proxy_stats';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;
            
            const result = await this.callPythonBackend('get_proxy_statistics');
            
            if (result) {
                this.setCachedData(cacheKey, result);
                return result;
            } else {
                throw new Error('Failed to get proxy stats');
            }
        } catch (error) {
            console.error('❌ Error getting proxy stats:', error);
            throw error;
        }
    }
    
    /**
     * Tạo proxy mới từ Python backend
     * Thay thế cho saveNewProxy() trong index.html
     */
    async createProxy(proxyData) {
        try {
            console.log('🔄 Creating proxy via Python backend:', proxyData);
            
            const result = await this.callPythonBackend('create_proxy', proxyData);
            
            if (result.success) {
                // Clear cache
                this.cache.delete('proxies_list');
                this.cache.delete('proxy_stats');
                this.cache.delete('dashboard_stats');
                
                console.log('✅ Proxy created successfully');
                return result;
            } else {
                throw new Error(result.message || 'Failed to create proxy');
            }
        } catch (error) {
            console.error('❌ Error creating proxy:', error);
            throw error;
        }
    }
    
    /**
     * Import nhiều proxy từ Python backend
     * Thay thế cho saveImportProxies() trong index.html
     */
    async bulkImportProxies(proxiesData) {
        try {
            console.log('🔄 Bulk importing proxies via Python backend:', proxiesData.length, 'proxies');
            
            const result = await this.callPythonBackend('bulk_import_proxies', proxiesData);
            
            if (result.success) {
                // Clear cache
                this.cache.delete('proxies_list');
                this.cache.delete('proxy_stats');
                this.cache.delete('dashboard_stats');
                
                console.log('✅ Proxies imported successfully:', result.data);
                return result;
            } else {
                throw new Error(result.message || 'Failed to import proxies');
            }
        } catch (error) {
            console.error('❌ Error importing proxies:', error);
            throw error;
        }
    }
    
    /**
     * Xóa proxy từ Python backend
     * Thay thế cho deleteProxy() trong index.html
     */
    async deleteProxy(proxyIdentifier) {
        try {
            console.log('🔄 Deleting proxy via Python backend:', proxyIdentifier);
            
            const result = await this.callPythonBackend('delete_proxy', proxyIdentifier);
            
            if (result.success) {
                // Clear cache
                this.cache.delete('proxies_list');
                this.cache.delete('proxy_stats');
                this.cache.delete('dashboard_stats');
                
                console.log('✅ Proxy deleted successfully');
                return result;
            } else {
                throw new Error(result.message || 'Failed to delete proxy');
            }
        } catch (error) {
            console.error('❌ Error deleting proxy:', error);
            throw error;
        }
    }
    
    // ==================== UTILITY METHODS ====================
    
    /**
     * Parse danh sách proxy từ Python backend
     * Thay thế cho parseProxyList() trong index.html
     */
    async parseProxyList(proxyText, format = 'host:port') {
        try {
            console.log('🔄 Parsing proxy list via Python backend...');
            
            const result = await this.callPythonBackend('parse_proxy_list', proxyText, format);
            
            if (result && Array.isArray(result)) {
                console.log(`✅ Parsed ${result.length} proxies`);
                return result;
            } else {
                throw new Error('Failed to parse proxy list');
            }
        } catch (error) {
            console.error('❌ Error parsing proxy list:', error);
            throw error;
        }
    }
    
    /**
     * Clear cache từ Python backend
     */
    async clearServerCache() {
        try {
            const result = await this.callPythonBackend('clear_cache');
            
            // Also clear local cache
            this.clearCache();
            
            console.log('✅ Server cache cleared');
            return result;
        } catch (error) {
            console.error('❌ Error clearing server cache:', error);
            throw error;
        }
    }
    
    /**
     * Kiểm tra trạng thái hệ thống
     */
    async getHealthStatus() {
        try {
            const result = await this.callPythonBackend('get_health_status');
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to get health status');
            }
        } catch (error) {
            console.error('❌ Error getting health status:', error);
            return null;
        }
    }
    
    // ==================== UI HELPER METHODS ====================
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    /**
     * Update proxy stats UI
     */
    updateProxyStatsUI(stats) {
        const totalEl = document.getElementById('totalProxiesCount');
        const liveEl = document.getElementById('liveProxiesCount');
        const deadEl = document.getElementById('deadProxiesCount');
        const uncheckedEl = document.getElementById('uncheckedProxiesCount');
        
        if (totalEl) totalEl.textContent = stats.total || 0;
        if (liveEl) liveEl.textContent = stats.live || 0;
        if (deadEl) deadEl.textContent = stats.dead || 0;
        if (uncheckedEl) uncheckedEl.textContent = stats.unchecked || 0;
    }
    
    /**
     * Show loading state for proxies
     */
    showProxyLoadingState() {
        const loadingState = document.getElementById('proxyLoadingState');
        const emptyState = document.getElementById('proxyEmptyState');
        if (loadingState) loadingState.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
    }
    
    /**
     * Hide loading state for proxies
     */
    hideProxyLoadingState() {
        const loadingState = document.getElementById('proxyLoadingState');
        if (loadingState) loadingState.classList.add('hidden');
    }
    
    /**
     * Show empty state for proxies
     */
    showProxyEmptyState() {
        const emptyState = document.getElementById('proxyEmptyState');
        if (emptyState) emptyState.classList.remove('hidden');
    }
}

// ==================== INTEGRATION FUNCTIONS ====================

// Global instance
let mainLogicIntegration = null;

/**
 * Initialize main logic integration
 */
function initializeMainLogicIntegration() {
    if (!mainLogicIntegration) {
        mainLogicIntegration = new MainLogicIntegration();
        console.log('✅ Main Logic Integration initialized');
    }
    return mainLogicIntegration;
}

/**
 * Update dashboard stats - thay thế function cũ trong index.html
 */
async function updateDashboardStats() {
    try {
        const integration = initializeMainLogicIntegration();
        await integration.updateDashboardUI();
    } catch (error) {
        console.error('❌ Failed to update dashboard stats:', error);
    }
}

/**
 * Load proxies from backend - thay thế function cũ trong index.html
 */
async function loadProxiesFromBackend() {
    try {
        const integration = initializeMainLogicIntegration();
        
        integration.showProxyLoadingState();
        
        const result = await integration.getProxies();
        const proxies = result.proxies || [];
        
        // Render proxies table (sử dụng function có sẵn trong index.html)
        if (typeof renderProxies === 'function') {
            renderProxies(proxies);
        } else if (typeof renderProxiesTable === 'function') {
            renderProxiesTable(proxies);
        }
        
        // Update proxy stats
        const stats = await integration.getProxyStats();
        integration.updateProxyStatsUI(stats);
        
        console.log(`✅ Loaded ${proxies.length} proxies from Python backend`);
        
    } catch (error) {
        console.error('❌ Error loading proxies from backend:', error);
        const integration = initializeMainLogicIntegration();
        integration.showNotification('Không thể tải danh sách proxy từ backend', 'error');
        integration.showProxyEmptyState();
    } finally {
        const integration = initializeMainLogicIntegration();
        integration.hideProxyLoadingState();
    }
}

/**
 * Delete proxy - thay thế function cũ trong index.html
 */
async function deleteProxy(host, port) {
    if (!confirm('Bạn có chắc chắn muốn xóa proxy này?')) {
        return;
    }

    try {
        const integration = initializeMainLogicIntegration();
        const result = await integration.deleteProxy({ host, port });
        
        integration.showNotification(result.message || 'Proxy đã được xóa thành công', 'success');
        await loadProxiesFromBackend();
        
    } catch (error) {
        console.error('❌ Error deleting proxy:', error);
        const integration = initializeMainLogicIntegration();
        integration.showNotification('Lỗi khi xóa proxy: ' + error.message, 'error');
    }
}

/**
 * Test proxy - placeholder for future implementation
 */
async function testProxy(proxyId) {
    const integration = initializeMainLogicIntegration();
    integration.showNotification('Chức năng test proxy sẽ được implement sau', 'info');
}

/**
 * Edit proxy - placeholder for future implementation
 */
function editProxy(proxyId) {
    const integration = initializeMainLogicIntegration();
    integration.showNotification('Chức năng edit proxy sẽ được implement sau', 'info');
}

/**
 * Handle create profile - thay thế function cũ trong index.html
 */
async function handleCreateProfile() {
    try {
        // Collect form data (sử dụng function có sẵn hoặc tạo mới)
        const profileData = collectCreateProfileFormData();
        
        if (!profileData) {
            const integration = initializeMainLogicIntegration();
            integration.showNotification('Vui lòng điền đầy đủ thông tin profile', 'error');
            return;
        }
        
        const integration = initializeMainLogicIntegration();
        const result = await integration.createProfile(profileData);
        
        integration.showNotification(result.message || 'Profile đã được tạo thành công!', 'success');
        
        // Clear form and switch to profiles view
        if (typeof clearCreateProfileForm === 'function') {
            clearCreateProfileForm();
        }
        
        if (typeof switchView === 'function') {
            switchView('profiles');
        }
        
        // Refresh profiles data
        if (typeof initializeProfiles === 'function') {
            await initializeProfiles();
        }
        
    } catch (error) {
        console.error('❌ Error creating profile:', error);
        const integration = initializeMainLogicIntegration();
        integration.showNotification('Lỗi khi tạo profile: ' + error.message, 'error');
    }
}

/**
 * Collect create profile form data - helper function
 */
function collectCreateProfileFormData() {
    const name = document.getElementById('createProfileName')?.value?.trim();
    if (!name) return null;
    
    return {
        name: name,
        platform: document.getElementById('createPlatformSelect')?.value || 'windows',
        browser: document.getElementById('createBrowserSelect')?.value || 'chrome',
        tags: document.getElementById('createProfileTags')?.value || '',
        group: document.getElementById('createGroupSelect')?.value || '',
        note: document.getElementById('createProfileNote')?.value || '',
        shareOnCloud: document.getElementById('createShareOnCloud')?.checked || false,
        autoStart: document.getElementById('createAutoStart')?.checked || false,
        
        // Proxy config
        proxyType: document.querySelector('input[name="createProxyType"]:checked')?.value || 'none',
        pmProxyId: document.getElementById('createPmProxySelect')?.value || '',
        proxyProtocol: document.getElementById('createProxyProtocol')?.value || 'http',
        proxyHost: document.getElementById('createProxyHost')?.value || '',
        proxyPort: parseInt(document.getElementById('createProxyPort')?.value) || 0,
        proxyUsername: document.getElementById('createProxyUsername')?.value || '',
        proxyPassword: document.getElementById('createProxyPassword')?.value || '',
        
        // Browser config
        userAgent: document.getElementById('createUserAgent')?.value || '',
        screenWidth: parseInt(document.getElementById('createScreenWidth')?.value) || 1920,
        screenHeight: parseInt(document.getElementById('createScreenHeight')?.value) || 1080,
        randomResolution: document.getElementById('createRandomResolution')?.checked || false,
        webrtc: document.getElementById('createWebrtcSelect')?.value || 'disabled',
        timezone: document.getElementById('createTimezoneSelect')?.value || 'auto',
        geolocation: document.getElementById('createGeolocationSelect')?.value || 'auto',
        cookies: document.getElementById('createCookiesTextarea')?.value || ''
    };
}

/**
 * Save new proxy - thay thế function cũ trong index.html
 */
async function saveNewProxy() {
    try {
        const proxyData = getProxyFormData();
        
        if (!validateProxyData(proxyData)) {
            return;
        }

        const integration = initializeMainLogicIntegration();
        const result = await integration.createProxy(proxyData);
        
        integration.showNotification(result.message || 'Proxy đã được thêm thành công!', 'success');
        
        if (typeof hideAddProxyModal === 'function') {
            hideAddProxyModal();
        }
        
        await loadProxiesFromBackend();
        
    } catch (error) {
        console.error('❌ Error adding proxy:', error);
        const integration = initializeMainLogicIntegration();
        integration.showNotification('Lỗi khi thêm proxy: ' + error.message, 'error');
    }
}

/**
 * Save import proxies - thay thế function cũ trong index.html
 */
async function saveImportProxies() {
    try {
        const text = document.getElementById('importProxyText')?.value;
        const format = document.getElementById('importFormat')?.value || 'host:port';
        const defaultTags = document.getElementById('importTags')?.value;
        
        if (!text || !text.trim()) {
            const integration = initializeMainLogicIntegration();
            integration.showNotification('Vui lòng nhập danh sách proxy', 'error');
            return;
        }

        const integration = initializeMainLogicIntegration();
        
        // Parse proxies using Python backend
        const parsedProxies = await integration.parseProxyList(text, format);
        
        if (!parsedProxies || parsedProxies.length === 0) {
            integration.showNotification('Không tìm thấy proxy hợp lệ', 'error');
            return;
        }

        // Add default tags
        const tags = defaultTags ? defaultTags.split(',').map(t => t.trim()).filter(t => t) : ['Imported'];
        
        const proxiesToAdd = parsedProxies.map(proxy => ({
            ...proxy,
            tags: tags
        }));

        // Bulk import
        const result = await integration.bulkImportProxies(proxiesToAdd);
        
        integration.showNotification(result.message || `Đã import thành công ${result.data.successCount}/${result.data.totalCount} proxy`, 'success');
        
        if (typeof hideImportProxyModal === 'function') {
            hideImportProxyModal();
        }
        
        await loadProxiesFromBackend();
        
    } catch (error) {
        console.error('❌ Error importing proxies:', error);
        const integration = initializeMainLogicIntegration();
        integration.showNotification('Lỗi khi import proxy: ' + error.message, 'error');
    }
}

/**
 * Parse proxy list - thay thế function cũ trong index.html
 */
async function parseProxyList(proxyText, format = 'host:port') {
    try {
        const integration = initializeMainLogicIntegration();
        return await integration.parseProxyList(proxyText, format);
    } catch (error) {
        console.error('❌ Error parsing proxy list:', error);
        throw error;
    }
}

// Export for global access
window.MainLogicIntegration = MainLogicIntegration;
window.initializeMainLogicIntegration = initializeMainLogicIntegration;

// Override existing functions
window.updateDashboardStats = updateDashboardStats;
window.loadProxiesFromBackend = loadProxiesFromBackend;
window.deleteProxy = deleteProxy;
window.testProxy = testProxy;
window.editProxy = editProxy;
window.handleCreateProfile = handleCreateProfile;
window.saveNewProxy = saveNewProxy;
window.saveImportProxies = saveImportProxies;
window.parseProxyList = parseProxyList;

console.log('✅ Main Logic Integration loaded successfully - JavaScript logic replaced with Python backend calls');