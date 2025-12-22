// Login page renderer script
class LoginRenderer {
    constructor() {
        this.isLoading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSystemInfo();
        this.setupFormValidation();
        this.prefillTestData();
    }

    prefillTestData() {
        // Demo mode - prefill demo credentials for testing
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput && passwordInput) {
            emailInput.value = 'demo@pmlogin.com';
            passwordInput.value = 'demo123';
            
            // Add demo mode indicator
            this.showDemoModeIndicator();
        }
    }
    
    showDemoModeIndicator() {
        // Create demo mode banner if it doesn't exist
        let demoBanner = document.getElementById('demoBanner');
        if (!demoBanner) {
            demoBanner = document.createElement('div');
            demoBanner.id = 'demoBanner';
            demoBanner.className = 'demo-banner bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg mb-6 text-center';
            demoBanner.innerHTML = `
                <div class="flex items-center justify-center space-x-2">
                    <i class="fas fa-info-circle"></i>
                    <span><strong>Demo Mode:</strong> Sử dụng email demo@pmlogin.com để test giao diện</span>
                </div>
            `;
            
            // Insert before the form
            const form = document.getElementById('loginForm');
            form.parentNode.insertBefore(demoBanner, form);
        }
    }

    bindEvents() {
        // Form submission
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Password toggle
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });

        // Enter key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isLoading) {
                this.handleLogin();
            }
        });

        // Register link (placeholder)
        const registerLink = document.getElementById('registerLink');
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showNotification('Tính năng đăng ký sẽ được cập nhật sớm!', 'info');
        });

        // Forgot password link
        document.querySelector('a[href="#"]').addEventListener('click', (e) => {
            e.preventDefault();
            this.showNotification('Tính năng quên mật khẩu sẽ được cập nhật sớm!', 'info');
        });
    }

    setupFormValidation() {
        const inputs = document.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateInput(input);
                }
            });
        });
    }

    validateInput(input) {
        const isValid = input.value.trim() !== '';
        
        if (isValid) {
            input.classList.remove('error');
            input.classList.add('valid');
            input.style.borderColor = '#22c55e';
        } else {
            input.classList.remove('valid');
            input.classList.add('error');
            input.style.borderColor = '#ef4444';
        }
        
        return isValid;
    }

    async loadSystemInfo() {
        try {
            const systemInfo = await window.electronAPI.getSystemInfo();
            
            if (systemInfo) {
                document.getElementById('appVersion').textContent = systemInfo.version || '1.0.0';
                document.getElementById('hardwareId').textContent = 
                    systemInfo.hwid ? systemInfo.hwid.substring(0, 8) + '...' : 'Unknown';
            }
        } catch (error) {
            console.error('Failed to load system info:', error);
            document.getElementById('hardwareId').textContent = 'Error';
        }
    }

    async handleLogin() {
        if (this.isLoading) return;

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate inputs
        if (!email || !password) {
            this.showNotification('Vui lòng nhập đầy đủ email và mật khẩu!', 'error');
            return;
        }

        // Check for demo user first
        if (email === 'demo@pmlogin.com' && password === 'demo123') {
            console.log('[DEMO] Demo user login detected');
            this.handleDemoLogin();
            return;
        }

        // Email validation
        if (!this.isValidEmail(email) && !this.isValidUsername(email)) {
            this.showNotification('Email hoặc tên đăng nhập không hợp lệ!', 'error');
            return;
        }

        // Password validation
        if (password.length < 6) {
            this.showNotification('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
            return;
        }

        this.setLoading(true);

        try {
            console.log('🔐 Attempting real server login...');
            
            const credentials = {
                email: email,
                password: password,
                rememberMe: rememberMe
            };

            const result = await window.electronAPI.login(credentials);
            
            if (result.success) {
                console.log('[SUCCESS] Login successful');
                this.showNotification('Đăng nhập thành công! Đang chuyển hướng...', 'success');
                
                // Navigation will be handled by main process automatically
            } else {
                console.log('[ERROR] Login failed:', result.message);
                
                // Handle specific error messages
                let errorMessage = result.message || 'Đăng nhập thất bại!';
                
                // Check if server is offline
                if (result.offline) {
                    errorMessage = 'Server không khả dụng. Vui lòng sử dụng demo@pmlogin.com để test giao diện hoặc thử lại sau.';
                    this.showNotification(errorMessage, 'warning');
                    return;
                }
                
                // Customize error messages based on status or content
                if (errorMessage.includes('404') || errorMessage.includes('không tìm thấy')) {
                    errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
                } else if (errorMessage.includes('HWID') || errorMessage.includes('hardware')) {
                    errorMessage = 'Thiết bị chưa được đăng ký. Vui lòng liên hệ admin để kích hoạt tài khoản.';
                } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                    errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.';
                } else if (errorMessage.includes('422') || errorMessage.includes('validation')) {
                    errorMessage = 'Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.';
                } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
                    errorMessage = 'Lỗi server. Vui lòng thử lại sau ít phút.';
                } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
                    errorMessage = 'Kết nối bị gián đoạn. Vui lòng kiểm tra internet và thử lại.';
                }
                
                this.showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('💥 Login error:', error);
            this.showNotification('Lỗi kết nối. Vui lòng kiểm tra internet và thử lại!', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    async handleDemoLogin() {
        this.setLoading(true);
        
        try {
            console.log('[DEMO] Processing demo login...');
            this.showNotification('Đang đăng nhập demo...', 'info');
            
            // Simulate demo login success
            const demoUserData = {
                success: true,
                user: {
                    email: 'demo@pmlogin.com',
                    full_name: 'Demo User',
                    plan: 'Demo Plan',
                    role: 'Demo',
                    isDemo: true
                }
            };
            
            // Call the demo login API
            const result = await window.electronAPI.loginDemo(demoUserData);
            
            if (result && result.success) {
                console.log('[SUCCESS] Demo login successful');
                this.showNotification('Đăng nhập demo thành công! Đang chuyển hướng...', 'success');
                
                // Small delay for user feedback
                setTimeout(() => {
                    // Navigation will be handled by main process
                }, 1000);
            } else {
                throw new Error('Demo login failed');
            }
            
        } catch (error) {
            console.error('💥 Demo login error:', error);
            this.showNotification('Lỗi khi đăng nhập demo!', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        const loginSpinner = document.getElementById('loginSpinner');
        
        if (loading) {
            loginBtn.disabled = true;
            loginBtnText.style.display = 'none';
            loginSpinner.classList.remove('hidden');
            loginBtn.classList.add('cursor-not-allowed');
        } else {
            loginBtn.disabled = false;
            loginBtnText.style.display = 'inline';
            loginSpinner.classList.add('hidden');
            loginBtn.classList.remove('cursor-not-allowed');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const content = document.getElementById('notificationContent');
        
        // Set message
        content.textContent = message;
        
        // Set style based on type
        notification.className = 'notification fixed top-0 left-0 w-full z-50 p-4 text-white text-center font-medium';
        
        switch (type) {
            case 'success':
                notification.classList.add('bg-green-500');
                break;
            case 'error':
                notification.classList.add('bg-red-500');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-500');
                break;
            default:
                notification.classList.add('bg-blue-500');
        }
        
        // Show notification
        notification.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUsername(username) {
        // Username should be 3-30 characters, alphanumeric and underscore
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        return usernameRegex.test(username);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginRenderer();
});

// Handle navigation events from main process
if (window.electronAPI && window.electronAPI.onNavigate) {
    window.electronAPI.onNavigate((event, data) => {
        console.log('Navigation event received:', data);
    });
}

// Handle logout events
if (window.electronAPI && window.electronAPI.onLogout) {
    window.electronAPI.onLogout((event) => {
        console.log('Logout event received');
        // Clear form
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('rememberMe').checked = false;
    });
}