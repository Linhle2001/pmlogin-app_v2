/**
 * Python Local API Client
 * Kết nối với backend Python local để xử lý profiles, proxies, database
 * (Không xử lý authentication - vẫn dùng logic cũ)
 */

const axios = require('axios');

class PythonLocalApiClient {
    constructor() {
        this.baseURL = 'http://127.0.0.1:8000';
        
        // Tạo axios instance
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Kiểm tra kết nối với backend local
     */
    async checkConnection() {
        try {
            const response = await this.client.get('/');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('❌ Local backend connection failed:', error.message);
            return {
                success: false,
                message: 'Không thể kết nối với backend Python local. Vui lòng khởi động backend trước.'
            };
        }
    }

    /**
     * Lấy thống kê tổng quan
     */
    async getStats() {
        try {
            const response = await this.client.get('/stats');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Get stats error:', error);
            return {
                success: false,
                message: 'Lỗi khi lấy thống kê'
            };
        }
    }

    // === PROFILE METHODS ===
    
    /**
     * Lấy danh sách profiles
     */
    async getProfiles() {
        try {
            const response = await this.client.get('/profiles');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Get profiles error:', error);
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách profiles'
            };
        }
    }

    /**
     * Tạo profile mới
     */
    async createProfile(profileData) {
        try {
            const response = await this.client.post('/profiles', profileData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error('💥 Create profile error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi tạo profile'
            };
        }
    }

    /**
     * Cập nhật profile
     */
    async updateProfile(profileId, profileData) {
        try {
            const response = await this.client.put(`/profiles/${profileId}`, profileData);
            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            console.error('💥 Update profile error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi cập nhật profile'
            };
        }
    }

    /**
     * Xóa profile
     */
    async deleteProfile(profileId) {
        try {
            const response = await this.client.delete(`/profiles/${profileId}`);
            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            console.error('💥 Delete profile error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi xóa profile'
            };
        }
    }

    // === PROXY METHODS ===
    
    /**
     * Lấy danh sách proxies
     */
    async getProxies() {
        try {
            const response = await this.client.get('/proxies');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Get proxies error:', error);
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách proxies'
            };
        }
    }

    /**
     * Tạo proxy mới
     */
    async createProxy(proxyData) {
        try {
            const response = await this.client.post('/proxies', proxyData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error('💥 Create proxy error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi tạo proxy'
            };
        }
    }

    /**
     * Cập nhật proxy
     */
    async updateProxy(proxyId, proxyData) {
        try {
            const response = await this.client.put(`/proxies/${proxyId}`, proxyData);
            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            console.error('💥 Update proxy error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi cập nhật proxy'
            };
        }
    }

    /**
     * Xóa proxy
     */
    async deleteProxy(proxyId) {
        try {
            const response = await this.client.delete(`/proxies/${proxyId}`);
            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            console.error('💥 Delete proxy error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi xóa proxy'
            };
        }
    }

    // === TAG METHODS ===
    
    /**
     * Lấy danh sách tags
     */
    async getTags() {
        try {
            const response = await this.client.get('/tags');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Get tags error:', error);
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách tags'
            };
        }
    }

    // === TASKBAR ACTIONS ===
    
    /**
     * Khởi động các profiles đã chọn
     */
    async startProfiles(profileIds) {
        try {
            const response = await this.client.post('/taskbar/start-profiles', profileIds);
            return {
                success: response.data.success,
                message: response.data.message,
                affected_count: response.data.affected_count,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Start profiles error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi khởi động profiles'
            };
        }
    }

    /**
     * Dừng các profiles đã chọn
     */
    async stopProfiles(profileIds) {
        try {
            const response = await this.client.post('/taskbar/stop-profiles', profileIds);
            return {
                success: response.data.success,
                message: response.data.message,
                affected_count: response.data.affected_count,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Stop profiles error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi dừng profiles'
            };
        }
    }

    /**
     * Kiểm tra proxy của các profiles đã chọn
     */
    async checkProxies(profileIds) {
        try {
            const response = await this.client.post('/taskbar/check-proxies', profileIds);
            return {
                success: response.data.success,
                message: response.data.message,
                affected_count: response.data.affected_count,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Check proxies error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi kiểm tra proxies'
            };
        }
    }

    /**
     * Cập nhật proxy cho các profiles đã chọn
     */
    async updateProxies(profileIds, proxyList, options = {}) {
        try {
            const requestData = {
                profile_ids: profileIds,
                proxy_list: proxyList,
                connection_type: options.connectionType || "Common",
                service: options.service || "TZ",
                webrtc: options.webrtc || "Forward",
                enable_change_ip: options.enableChangeIp || false
            };

            const response = await this.client.post('/taskbar/update-proxies', requestData);
            return {
                success: response.data.success,
                message: response.data.message,
                affected_count: response.data.affected_count,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Update proxies error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi cập nhật proxies'
            };
        }
    }

    /**
     * Clone các profiles đã chọn
     */
    async cloneProfiles(profileIds, cloneCount = 1) {
        try {
            const requestData = {
                profile_ids: profileIds,
                clone_count: cloneCount
            };

            const response = await this.client.post('/taskbar/clone-profiles', requestData);
            return {
                success: response.data.success,
                message: response.data.message,
                affected_count: response.data.affected_count,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Clone profiles error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi clone profiles'
            };
        }
    }

    /**
     * Xóa các profiles đã chọn
     */
    async deleteProfiles(profileIds) {
        try {
            const response = await this.client.post('/taskbar/delete-profiles', profileIds);
            return {
                success: response.data.success,
                message: response.data.message,
                affected_count: response.data.affected_count,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Delete profiles error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi xóa profiles'
            };
        }
    }

    /**
     * Export các profiles đã chọn
     */
    async exportProfiles(profileIds, exportFormat = 'json') {
        try {
            const requestData = {
                profile_ids: profileIds,
                export_format: exportFormat
            };

            const response = await this.client.post('/taskbar/export-profiles', requestData);
            return {
                success: response.data.success,
                message: response.data.message,
                affected_count: response.data.affected_count,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Export profiles error:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Lỗi khi export profiles'
            };
        }
    }

    /**
     * Lấy danh sách profiles đang chạy
     */
    async getRunningProfiles() {
        try {
            const response = await this.client.get('/taskbar/running-profiles');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Get running profiles error:', error);
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách profiles đang chạy'
            };
        }
    }

    /**
     * Lấy thống kê profiles
     */
    async getProfilesStats() {
        try {
            const response = await this.client.get('/taskbar/profiles-stats');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('💥 Get profiles stats error:', error);
            return {
                success: false,
                message: 'Lỗi khi lấy thống kê profiles'
            };
        }
    }
}

// Export singleton instance
const pythonLocalApiClient = new PythonLocalApiClient();
module.exports = pythonLocalApiClient;