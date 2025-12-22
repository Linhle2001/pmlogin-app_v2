const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://pm-login.nhatcms.net';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
const RETRY_DELAY = parseFloat(process.env.RETRY_DELAY) || 1.5;
const DEFAULT_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 15;

// Circuit breaker state
const circuitBreaker = {
    failures: {},
    lastFailureTime: {},
    isOpen: function(url) {
        const domain = new URL(url).hostname;
        const failures = this.failures[domain] || 0;
        const lastFailure = this.lastFailureTime[domain] || 0;
        
        if (failures >= 5 && Date.now() - lastFailure < 300000) { // 5 minutes
            return true;
        }
        return false;
    },
    recordFailure: function(url) {
        const domain = new URL(url).hostname;
        this.failures[domain] = (this.failures[domain] || 0) + 1;
        this.lastFailureTime[domain] = Date.now();
    },
    reset: function(url) {
        const domain = new URL(url).hostname;
        this.failures[domain] = 0;
    }
};

// Build URL helper
function buildUrl(endpoint, isAuthRoute = false) {
    endpoint = endpoint.replace(/^\//, '');
    if (isAuthRoute) {
        return `${BASE_URL}/api/auth/${endpoint}`;
    }
    return `${BASE_URL}/api/${endpoint}`;
}

// Validate URL security
function validateUrlSecurity(url) {
    if (!url.startsWith('https://')) {
        return false;
    }
    const dangerous = ['javascript:', 'data:', 'file:'];
    if (dangerous.some(d => url.toLowerCase().includes(d))) {
        return false;
    }
    return true;
}

// Handle response
function handleResponse(response, context = '') {
    const data = response.data;
    
    if (response.status === 200) {
        const isSuccess = data.success !== false;
        if (isSuccess) {
            return {
                success: true,
                message: data.message || 'Thành công',
                data: data.data,
                raw_response: data
            };
        } else {
            return {
                success: false,
                message: data.message || 'Thất bại',
                data: null
            };
        }
    } else if (response.status === 401) {
        console.error(`[${context}] 401 Unauthorized`);
        return {
            success: false,
            message: data.message || 'Phiên đăng nhập hết hạn hoặc HWID không match'
        };
    } else if (response.status === 422) {
        let msg = data.message || 'Dữ liệu không hợp lệ';
        if (data.errors) {
            const firstKey = Object.keys(data.errors)[0];
            if (firstKey && data.errors[firstKey][0]) {
                msg = data.errors[firstKey][0];
            }
        }
        return { success: false, message: msg };
    } else if (response.status === 404) {
        return { success: false, message: `Không tìm thấy API (404): ${response.config.url}` };
    } else if (response.status === 405) {
        return { success: false, message: 'Sai phương thức HTTP (405)' };
    } else {
        return {
            success: false,
            message: data.message || `Lỗi ${response.status}`,
            data: null
        };
    }
}

// Send request with retry and circuit breaker
async function sendRequest(method, url, options = {}) {
    const { headers = {}, data = null, requireAuth = false, context = '' } = options;
    
    // Validate URL
    if (!validateUrlSecurity(url)) {
        return { success: false, message: 'Invalid or insecure URL' };
    }
    
    // Check circuit breaker
    if (circuitBreaker.isOpen(url)) {
        return { success: false, message: 'Service temporarily unavailable' };
    }
    
    // Setup headers
    const requestHeaders = {
        'Accept': 'application/json',
        'User-Agent': 'PMLogin/1.0',
        ...headers
    };
    
    let tokenRefreshed = false;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const config = {
                method,
                url,
                headers: requestHeaders,
                timeout: DEFAULT_TIMEOUT * 1000,
                validateStatus: () => true, // Handle all status codes manually
                maxRedirects: 0
            };
            
            if (data) {
                config.data = data;
            }
            
            const response = await axios(config);
            
            // Handle 401 with token refresh
            if (response.status === 401 && requireAuth && !tokenRefreshed) {
                console.warn(`Received 401 in ${context}, attempting token refresh...`);
                // TODO: Implement token refresh logic
                tokenRefreshed = true;
                continue;
            }
            
            // Reset circuit breaker on success
            circuitBreaker.reset(url);
            return handleResponse(response, context);
            
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                console.warn(`Request timeout in ${context}. Attempt ${attempt + 1}/${MAX_RETRIES}`);
            } else if (error.response) {
                // Server responded with error
                return handleResponse(error.response, context);
            } else {
                console.warn(`Connection error in ${context}: ${error.message}. Attempt ${attempt + 1}/${MAX_RETRIES}`);
            }
            
            circuitBreaker.recordFailure(url);
            
            if (attempt < MAX_RETRIES - 1) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * 1000 * (attempt + 1)));
            }
        }
    }
    
    return { success: false, message: 'Mất kết nối máy chủ. Vui lòng kiểm tra internet.' };
}

// Public API functions
async function login(email, password, hwid) {
    const url = buildUrl('login', true);
    const payload = { email, password, hwid };
    
    console.log(`Login attempt: ${email}`);
    console.log(`HWID: ${hwid}`);
    console.log(`URL: ${url}`);
    
    return await sendRequest('POST', url, {
        data: payload,
        requireAuth: false,
        context: 'LOGIN'
    });
}

async function register(email, password) {
    const url = buildUrl('register', true);
    const payload = { email, password };
    
    console.log(`Registration attempt: ${email}`);
    
    return await sendRequest('POST', url, {
        data: payload,
        requireAuth: false,
        context: 'REGISTER'
    });
}

async function getUserFromToken(token) {
    const url = buildUrl('user', false);
    
    return await sendRequest('GET', url, {
        headers: { 'Authorization': `Bearer ${token}` },
        requireAuth: false,
        context: 'GET_USER'
    });
}

async function changePassword(token, currentPassword, newPassword) {
    console.log('Attempting password change');
    
    const url = buildUrl('change-password', true);
    console.log(`Password change URL: ${url}`);
    
    const payload = {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword
    };
    
    return await sendRequest('POST', url, {
        headers: { 'Authorization': `Bearer ${token}` },
        data: payload,
        requireAuth: true,
        context: 'CHANGE_PASS'
    });
}

async function checkSystemVersion() {
    const url = process.env.API_SYSTEM_URL;
    if (!url) {
        return { success: false, message: 'API_SYSTEM_URL not configured' };
    }
    
    return await sendRequest('GET', url, {
        requireAuth: false,
        context: 'CHECK_VERSION'
    });
}

module.exports = {
    login,
    register,
    getUserFromToken,
    changePassword,
    checkSystemVersion
};