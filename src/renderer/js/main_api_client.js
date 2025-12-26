/**
 * Main API Client for PMLogin Application
 * Thay thế logic JavaScript trong index.html bằng API calls đến Python backend
 */

class MainAPIClient {
    constructor(baseUrl = 'http://127.0.0.1:5000') {
        this.baseUrl = baseUrl;
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
        
        console.log('🔄 MainAPIClient initialized with base URL:', baseUrl);
    }
    
    // ==================== UTILITY METHODS ====================
    
    /**
     * Make HTTP request to API
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        try {
            console.log(`🌐 API Request: ${requestOptions.method || 'GET'} ${url}`);
            
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            console.log(`✅ API Response:`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ API Error for ${url}:`, error);
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
    
    // ==================== DASHBOARD API METHODS ====================
    
    /**
     * Lấy thống kê dashboard
     * Thay thế cho updateDashboardStats() trong JavaScript
     */
    async getDashboardStats() {
        try {
            const cacheKey = 'dashboard_stats';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;
            
            const result = await this.makeRequest('/api/dashboard/stats');
            
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
     * Kiểm tra trạng thái hệ thống
     */
    async getHealthStatus() {
        try {
            const result = await this.makeRequest('/api/dashboard/health');
            return result.success ? result.data : null;
        } catch (error) {
            console.error('❌ Error getting health status:', error);
            return null;
        }
    }
    
    // ==================== PROFILES API METHODS ====================
    
    /**
     * Lấy danh sách profiles
     * Thay thế cho initializeProfiles() trong JavaScript
     */
    async getProfiles() {
        try {
            const cacheKey = 'profiles_list';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;
            
            const result = await this.makeRequest('/api/profiles');
            
            if (result.success) {
                const data = {
                    profiles: result.data || [],
                    summary: result.summary || {}
                };
                this.setCachedData(cacheKey, data);
                return data;
            } else {
                throw new Error(result.message || 'Failed to get profiles');
            }
        } catch (error) {
            console.error('❌ Error getting profiles:', error);
            throw error;
        }
    }
    
    /**
     * Tạo profile mới
     * Thay thế cho handleCreateProfile() trong JavaScript
     */
    async createProfile(profileData) {
        try {
            const result = await this.makeRequest('/api/profiles', {
                method: 'POST',
                body: JSON.stringify(profileData)
            });
            
            if (result.success) {
                // Clear profiles cache
                this.cache.delete('profiles_list');
                this.cache.delete('dashboard_stats');
                return result;
            } else {
                throw new Error(result.message || 'Failed to create profile');
            }
        } catch (error) {
            console.error('❌ Error creating profile:', error);
            throw error;
        }
    }
    
    /**
     * Cập nhật profile
     */
    async updateProfile(profileId, profileData) {
        try {
            const result = await this.makeRequest(`/api/profiles/${profileId}`, {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            if (result.success) {
                // Clear cache
                this.cache.delete('profiles_list');
                return result;
            } else {
                throw new Error(result.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            throw error;
        }
    }
    
    /**
     * Xóa profile
     */
    async deleteProfile(profileId) {
        try {
            const result = await this.makeRequest(`/api/profiles/${profileId}`, {
                method: 'DELETE'
            });
            
            if (result.success) {
                // Clear cache
                this.cache.delete('profiles_list');
                this.cache.delete('dashboard_stats');
                return result;
            } else {
                throw new Error(result.message || 'Failed to delete profile');
            }
        } catch (error) {
            console.error('❌ Error deleting profile:', error);
            throw error;
        }
    }
    
    // ==================== PROXY API METHODS ====================
    
    /**
     * Lấy danh sách proxy
     * Thay thế cho loadProxiesFromBackend() trong JavaScript
     */
    async getProxies() {
        try {
            const cacheKey = 'proxies_list';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;
            
            const result = await this.makeRequest('/api/proxies');
            
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
     * Lấy thống kê proxy
     * Thay thế cho updateProxyStats() trong JavaScript
     */
    async getProxyStats() {
        try {
            const cacheKey = 'proxy_stats';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;
            
            const result = await this.makeRequest('/api/proxies/stats');
            
            if (result.success) {
                this.setCachedData(cacheKey, result.data);
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to get proxy stats');
            }
        } catch (error) {
            console.error('❌ Error getting proxy stats:', error);
            throw error;
        }
    }
    
    /**
     * Tạo proxy mới
     * Thay thế cho saveNewProxy() trong JavaScript
     */
    async createProxy(proxyData) {
        try {
            const result = await this.makeRequest('/api/proxies', {
                method: 'POST',
                body: JSON.stringify(proxyData)
            });
            
            if (result.success) {
                // Clear cache
                this.cache.delete('proxies_list');
                this.cache.delete('proxy_stats');
                this.cache.delete('dashboard_stats');
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
     * Import nhiều proxy
     * Thay thế cho saveImportProxies() trong JavaScript
     */
    async bulkImportProxies(proxiesData) {
        try {
            const result = await this.makeRequest('/api/proxies/bulk', {
                method: 'POST',
                body: JSON.stringify({ proxies: proxiesData })
            });
            
            if (result.success) {
                // Clear cache
                this.cache.delete('proxies_list');
                this.cache.delete('proxy_stats');
                this.cache.delete('dashboard_stats');
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
     * Xóa proxy
     * Thay thế cho deleteProxy() trong JavaScript
     */
    async deleteProxy(proxyIdentifier) {
        try {
            let endpoint;
            if (typeof proxyIdentifier === 'object') {
                // Delete by host:port
                endpoint = `/api/proxies/${proxyIdentifier.host}:${proxyIdentifier.port}`;
            } else {
                // Delete by ID
                endpoint = `/api/proxies/${proxyIdentifier}`;
            }
            
            const result = await this.makeRequest(endpoint, {
                method: 'DELETE'
            });
            
            if (result.success) {
                // Clear cache
                this.cache.delete('proxies_list');
                this.cache.delete('proxy_stats');
                this.cache.delete('dashboard_stats');
                return result;
            } else {
                throw new Error(result.message || 'Failed to delete proxy');
            }
        } catch (error) {
            console.error('❌ Error deleting proxy:', error);
            throw error;
        }
    }
    
    /**
     * Test proxy
     */
    async testProxy(proxyId) {
        try {
            const result = await this.makeRequest(`/api/proxies/test/${proxyId}`, {
                method: 'POST'
            });
            
            return result;
        } catch (error) {
            console.error('❌ Error testing proxy:', error);
            throw error;
        }
    }
    
    // ==================== UTILITY API METHODS ====================
    
    /**
     * Parse danh sách proxy từ text
     * Thay thế cho parseProxyList() trong JavaScript
     */
    async parseProxyList(proxyText, format = 'host:port') {
        try {
            const result = await this.makeRequest('/api/utils/parse-proxies', {
                method: 'POST',
                body: JSON.stringify({
                    text: proxyText,
                    format: format
                })
            });
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to parse proxy list');
            }
        } catch (error) {
            console.error('❌ Error parsing proxy list:', error);
            throw error;
        }
    }
    
    /**
     * Validate dữ liệu proxy
     */
    async validateProxyData(proxyData) {
        try {
            const result = await this.makeRequest('/api/utils/validate-proxy', {
                method: 'POST',
                body: JSON.stringify(proxyData)
            });
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to validate proxy data');
            }
        } catch (error) {
            console.error('❌ Error validating proxy data:', error);
            throw error;
        }
    }
    
    /**
     * Clear server cache
     */
    async clearServerCache() {
        try {
            const result = await this.makeRequest('/api/utils/clear-cache', {
                method: 'POST'
            });
            
            // Also clear local cache
            this.clearCache();
            
            return result;
        } catch (error) {
            console.error('❌ Error clearing server cache:', error);
            throw error;
        }
    }
}

// ==================== INTEGRATION FUNCTIONS ====================

/**
 * Các function để tích hợp với HTML hiện tại
 * Thay thế logic cũ trong index.html
 */

// Global API client instance
let apiClient = null;

/**
 * Initialize API client
 */
function initializeAPIClient() {
    if (!apiClient) {
        apiClient = new MainAPIClient();
        console.log('✅ API Client initialized');
    }
    return apiClient;
}

/**
 * Update dashboard stats - thay thế function cũ
 */
async function updateDashboardStats() {
    try {
        const client = initializeAPIClient();
        const stats = await client.getDashboardStats();
        
        // Update UI elements
        const totalProxiesEl = document.getElementById('totalProxies');
        const workingProxiesEl = document.getElementById('workingProxies');
        const totalProfilesEl = document.getElementById('totalProfiles');
        const appVersionEl = document.getElementById('appVersionDashboard');
        
        if (totalProxiesEl) totalProxiesEl.textContent = stats.proxies.total;
        if (workingProxiesEl) workingProxiesEl.textContent = stats.proxies.working;
        if (totalProfilesEl) totalProfilesEl.textContent = stats.profiles.total;
        if (appVersionEl) appVersionEl.textContent = stats.system.version;
        
        console.log('✅ Dashboard stats updated');
        
    } catch (error) {
        console.error('❌ Failed to update dashboard stats:', error);
        showNotification('Không thể cập nhật thống kê dashboard', 'error');
    }
}

/**
 * Load proxies from backend - thay thế function cũ
 */
async function loadProxiesFromBackend() {
    try {
        showProxyLoadingState();
        
        const client = initializeAPIClient();
        const result = await client.getProxies();
        
        const proxies = result.proxies || [];
        renderProxies(proxies);
        
        // Update proxy stats
        const stats = await client.getProxyStats();
        updateProxyStatsUI(stats);
        
        console.log(`✅ Loaded ${proxies.length} proxies from Python backend`);
        
    } catch (error) {
        console.error('❌ Error loading proxies from backend:', error);
        showNotification('Không thể tải danh sách proxy từ backend', 'error');
        showProxyEmptyState();
    } finally {
        hideProxyLoadingState();
    }
}

/**
 * Update proxy stats UI
 */
function updateProxyStatsUI(stats) {
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
 * Delete proxy - thay thế function cũ
 */
async function deleteProxy(host, port) {
    if (!confirm('Bạn có chắc chắn muốn xóa proxy này?')) {
        return;
    }

    try {
        const client = initializeAPIClient();
        const result = await client.deleteProxy({ host, port });
        
        showNotification(result.message || 'Proxy đã được xóa thành công', 'success');
        await loadProxiesFromBackend();
        
    } catch (error) {
        console.error('❌ Error deleting proxy:', error);
        showNotification('Lỗi khi xóa proxy: ' + error.message, 'error');
    }
}

/**
 * Test proxy - placeholder for future implementation
 */
async function testProxy(proxyId) {
    try {
        const client = initializeAPIClient();
        const result = await client.testProxy(proxyId);
        
        if (result.success) {
            showNotification('Proxy test thành công', 'success');
        } else {
            showNotification('Proxy test thất bại: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('❌ Error testing proxy:', error);
        showNotification('Chức năng test proxy sẽ được implement sau', 'info');
    }
}

/**
 * Edit proxy - placeholder for future implementation
 */
function editProxy(proxyId) {
    showNotification('Chức năng edit proxy sẽ được implement sau', 'info');
}

/**
 * Handle create profile - thay thế function cũ
 */
async function handleCreateProfile() {
    try {
        // Collect form data
        const profileData = collectCreateProfileFormData();
        
        if (!profileData) {
            showNotification('Vui lòng điền đầy đủ thông tin profile', 'error');
            return;
        }
        
        const client = initializeAPIClient();
        const result = await client.createProfile(profileData);
        
        showNotification(result.message || 'Profile đã được tạo thành công!', 'success');
        
        // Clear form and switch to profiles view
        clearCreateProfileForm();
        switchView('profiles');
        
        // Refresh profiles data
        if (typeof initializeProfiles === 'function') {
            await initializeProfiles();
        }
        
    } catch (error) {
        console.error('❌ Error creating profile:', error);
        showNotification('Lỗi khi tạo profile: ' + error.message, 'error');
    }
}

/**
 * Collect create profile form data
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
 * Clear create profile form
 */
function clearCreateProfileForm() {
    const form = document.querySelector('#createProfileView form');
    if (form) {
        form.reset();
    }
    
    // Reset specific elements
    const elements = [
        'createProfileName', 'createProfileTags', 'createProfileNote',
        'createProxyHost', 'createProxyPort', 'createProxyUsername', 'createProxyPassword',
        'createUserAgent', 'createCookiesTextarea'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

/**
 * Parse proxy list - thay thế function cũ
 */
async function parseProxyList(proxyText, format = 'host:port') {
    try {
        const client = initializeAPIClient();
        const result = await client.parseProxyList(proxyText, format);
        
        return result.proxies || [];
        
    } catch (error) {
        console.error('❌ Error parsing proxy list:', error);
        throw error;
    }
}

// Export for global access
window.MainAPIClient = MainAPIClient;
window.initializeAPIClient = initializeAPIClient;
window.updateDashboardStats = updateDashboardStats;
window.loadProxiesFromBackend = loadProxiesFromBackend;
window.deleteProxy = deleteProxy;
window.testProxy = testProxy;
window.editProxy = editProxy;
window.handleCreateProfile = handleCreateProfile;
window.parseProxyList = parseProxyList;

console.log('✅ Main API Client loaded successfully');