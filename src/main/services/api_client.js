const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration from environment
const BASE_URL = process.env.BASE_URL || 'https://pmbackend.site';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
const RETRY_DELAY = parseFloat(process.env.RETRY_DELAY) * 1000 || 1000; // Convert to milliseconds
const DEFAULT_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) * 1000 || 10000; // Convert to milliseconds

// Session storage
let currentToken = null;
let currentUser = null;

class ApiClient {
    constructor() {
        this.baseURL = BASE_URL;
        this.timeout = DEFAULT_TIMEOUT;
        this.retries = MAX_RETRIES;
        this.retryDelay = RETRY_DELAY;
        
        // Create axios instance
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'PMLogin-Electron/1.0.0'
            }
        });
        
        // Setup interceptors
        this.setupInterceptors();
    }
    
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                // Add auth token if available
                if (currentToken) {
                    config.headers.Authorization = `Bearer ${currentToken}`;
                }
                
                console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ Request interceptor error:', error);
                return Promise.reject(error);
            }
        );
        
        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                console.log(`✅ API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            async (error) => {
                const originalRequest = error.config;
                
                // Handle 401 - Token expired
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    
                    console.log('🔄 Token expired, attempting refresh...');
                    const refreshResult = await this.refreshToken();
                    
                    if (refreshResult.success) {
                        // Retry original request with new token
                        originalRequest.headers.Authorization = `Bearer ${currentToken}`;
                        return this.client(originalRequest);
                    } else {
                        // Refresh failed, clear session
                        this.clearSession();
                        return Promise.reject(error);
                    }
                }
                
                console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url}`);
                return Promise.reject(error);
            }
        );
    }
    
    // Build URL helper
    buildUrl(endpoint, isAuthRoute = false) {
        const cleanEndpoint = endpoint.replace(/^\/+/, '');
        if (isAuthRoute) {
            return `/api/auth/${cleanEndpoint}`;
        }
        return `/api/${cleanEndpoint}`;
    }
    
    // Handle API response
    handleResponse(response) {
        const data = response.data;
        
        if (response.status === 200) {
            const isSuccess = data.success !== false;
            return {
                success: isSuccess,
                message: data.message || (isSuccess ? 'Thành công' : 'Thất bại'),
                data: data.data || data,
                raw_response: data
            };
        }
        
        return {
            success: false,
            message: data.message || `Lỗi ${response.status}`,
            data: null
        };
    }
    
    // Handle API error
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const data = error.response.data;
            
            let message = data?.message || `Lỗi ${status}`;
            
            switch (status) {
                case 401:
                    message = data?.message || 'Phiên đăng nhập hết hạn hoặc HWID không match';
                    break;
                case 404:
                    message = 'Không tìm thấy API endpoint';
                    break;
                case 422:
                    if (data?.errors) {
                        const firstError = Object.values(data.errors)[0];
                        message = Array.isArray(firstError) ? firstError[0] : firstError;
                    } else {
                        message = data?.message || 'Dữ liệu không hợp lệ';
                    }
                    break;
                case 500:
                    message = 'Lỗi server nội bộ';
                    break;
            }
            
            return {
                success: false,
                message: message,
                data: null,
                status: status
            };
        } else if (error.request) {
            // Network error
            return {
                success: false,
                message: 'Mất kết nối máy chủ. Vui lòng kiểm tra internet.',
                data: null
            };
        } else {
            // Other error
            return {
                success: false,
                message: `Lỗi: ${error.message}`,
                data: null
            };
        }
    }
    
    // Make request with retry logic
    async makeRequest(method, url, data = null, options = {}) {
        const config = {
            method,
            url,
            ...options
        };
        
        if (data) {
            if (method.toLowerCase() === 'get') {
                config.params = data;
            } else {
                config.data = data;
            }
        }
        
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                const response = await this.client(config);
                return this.handleResponse(response);
            } catch (error) {
                console.error(`❌ Request attempt ${attempt}/${this.retries} failed:`, error.message);
                
                if (attempt === this.retries) {
                    // Check if this is a server connectivity issue
                    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || 
                        (error.response && error.response.status === 404)) {
                        console.log('🔄 Server appears to be offline, enabling offline mode');
                        return {
                            success: false,
                            message: 'Server không khả dụng. Vui lòng sử dụng demo mode hoặc thử lại sau.',
                            data: null,
                            offline: true
                        };
                    }
                    return this.handleError(error);
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }
    
    // Authentication methods
    async login(email, password, hwid) {
        console.log('🔐 Attempting login for:', email);
        console.log('🔧 Hardware ID:', hwid);
        
        const url = this.buildUrl('login', true);
        const payload = { email, password, hwid };
        
        const result = await this.makeRequest('POST', url, payload);
        
        if (result.success && result.data) {
            // Store session data
            currentToken = result.data.access_token || result.data.token;
            currentUser = result.data.user;
            
            console.log('✅ Login successful for:', currentUser?.email);
            console.log('🎫 Token received:', currentToken ? 'Yes' : 'No');
        }
        
        return result;
    }
    
    async register(email, password) {
        console.log('📝 Attempting registration for:', email);
        
        const url = this.buildUrl('register', true);
        const payload = { email, password };
        
        return await this.makeRequest('POST', url, payload);
    }
    
    async refreshToken() {
        if (!currentToken) {
            return { success: false, message: 'No token to refresh' };
        }
        
        console.log('🔄 Refreshing access token...');
        
        const url = this.buildUrl('refresh', true);
        const result = await this.makeRequest('POST', url);
        
        if (result.success && result.data) {
            currentToken = result.data.access_token || result.data.token;
            console.log('✅ Token refresh successful');
        } else {
            console.log('❌ Token refresh failed');
        }
        
        return result;
    }
    
    async getUserFromToken(token = null) {
        const useToken = token || currentToken;
        if (!useToken) {
            return { success: false, message: 'No token available' };
        }
        
        const url = this.buildUrl('user');
        const result = await this.makeRequest('GET', url, null, {
            headers: { Authorization: `Bearer ${useToken}` }
        });
        
        if (result.success && result.data) {
            currentUser = result.data;
        }
        
        return result;
    }
    
    async changePassword(currentPassword, newPassword) {
        if (!currentToken) {
            return { success: false, message: 'Không tìm thấy phiên đăng nhập' };
        }
        
        console.log('🔑 Attempting password change...');
        
        const url = this.buildUrl('change-password', true);
        const payload = {
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: newPassword
        };
        
        const result = await this.makeRequest('POST', url, payload);
        
        if (result.success) {
            console.log('✅ Password change successful');
        } else {
            console.log('❌ Password change failed:', result.message);
        }
        
        return result;
    }
    
    // Session management
    setSession(user, token) {
        currentUser = user;
        currentToken = token;
        console.log('💾 Session data set for:', user?.email);
    }
    
    getSession() {
        return {
            user: currentUser,
            token: currentToken
        };
    }
    
    clearSession() {
        currentUser = null;
        currentToken = null;
        console.log('🗑️ Session data cleared');
    }
    
    isAuthenticated() {
        return !!(currentToken && currentUser);
    }
    
    // Save session to file
    saveSessionToFile() {
        if (!this.isAuthenticated()) {
            return false;
        }
        
        try {
            const sessionData = {
                success: true,
                data: {
                    user: currentUser,
                    access_token: currentToken
                },
                timestamp: new Date().toISOString()
            };
            
            const storageDir = path.join(__dirname, '../../../storage');
            if (!fs.existsSync(storageDir)) {
                fs.mkdirSync(storageDir, { recursive: true });
            }
            
            const sessionFile = path.join(storageDir, 'login_result.json');
            fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2), 'utf8');
            
            console.log('💾 Session saved to file:', sessionFile);
            return true;
        } catch (error) {
            console.error('❌ Failed to save session to file:', error);
            return false;
        }
    }
    
    // Load session from file
    loadSessionFromFile() {
        try {
            const sessionFile = path.join(__dirname, '../../../storage/login_result.json');
            
            if (!fs.existsSync(sessionFile)) {
                console.log('📂 No session file found');
                return false;
            }
            
            const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
            
            if (sessionData.success && sessionData.data) {
                currentUser = sessionData.data.user;
                currentToken = sessionData.data.access_token || sessionData.data.token;
                
                console.log('📂 Session loaded from file for:', currentUser?.email);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Failed to load session from file:', error);
            return false;
        }
    }
    
    // Clear session file
    clearSessionFile() {
        try {
            const sessionFile = path.join(__dirname, '../../../storage/login_result.json');
            
            if (fs.existsSync(sessionFile)) {
                fs.unlinkSync(sessionFile);
                console.log('🗑️ Session file deleted');
            }
        } catch (error) {
            console.error('❌ Failed to delete session file:', error);
        }
    }
}

// Create singleton instance
const apiClient = new ApiClient();

module.exports = apiClient;