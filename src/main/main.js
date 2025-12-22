const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import services
const apiClient = require('./services/api_client');
const hwidUtils = require('./services/hwid_utils');
const proxyManager = require('./services/proxy_mgr');
const { setupIpcHandlers } = require('./ipc_handlers');

class AppController {
    constructor() {
        this.mainWindow = null;
        this.currentView = 'login';
        this.userData = null;
        this.token = null;
        this.version = '1.0.0';
        this.updateCheckTimer = null;
    }

    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 700,
            minWidth: 1000,
            minHeight: 600,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
                enableRemoteModule: false
            },
            show: false,
            titleBarStyle: 'default',
            icon: path.join(__dirname, '../assets/logo_full.png')
        });

        // Load login page initially
        this.loadLoginPage();

        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            this.centerWindow();
            
            // Check for updates after 2 seconds
            setTimeout(() => {
                this.checkForUpdates();
            }, 2000);
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            if (this.updateCheckTimer) {
                clearInterval(this.updateCheckTimer);
            }
        });

        // Setup IPC handlers
        setupIpcHandlers(this);
    }

    centerWindow() {
        if (this.mainWindow) {
            this.mainWindow.center();
        }
    }

    loadLoginPage() {
        const loginPath = path.join(__dirname, '../renderer/views/login/index.html');
        this.mainWindow.loadFile(loginPath);
        this.currentView = 'login';
    }

    loadMainPage() {
        const mainPath = path.join(__dirname, '../renderer/views/main/index.html');
        this.mainWindow.loadFile(mainPath);
        this.currentView = 'main';
    }

    async handleLogin(credentials) {
        try {
            console.log('🔐 Attempting login for:', credentials.email);
            
            // Get hardware ID
            const hwid = await hwidUtils.getHardwareId();
            console.log('💻 Hardware ID:', hwid);

            // Attempt login
            const result = await apiClient.login(credentials.email, credentials.password, hwid);
            
            if (result.success) {
                console.log('✅ Login successful');
                
                // Store user data and token
                this.userData = result.data.user;
                this.token = result.data.access_token || result.data.token;
                
                // Save session if remember me is checked
                if (credentials.rememberMe) {
                    await this.saveSession();
                }
                
                // Load main page
                this.loadMainPage();
                
                return { success: true, data: result.data };
            } else {
                console.log('❌ Login failed:', result.message);
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('💥 Login error:', error);
            return { success: false, message: 'Lỗi kết nối. Vui lòng thử lại.' };
        }
    }

    async handleLogout() {
        console.log('👋 Logging out...');
        
        // Clear session data
        this.userData = null;
        this.token = null;
        
        // Clear saved session
        await this.clearSession();
        
        // Load login page
        this.loadLoginPage();
        
        return { success: true };
    }

    async checkAutoLogin() {
        try {
            // Load session from API client first
            const apiClient = require('./services/api_client');
            const sessionLoaded = apiClient.loadSessionFromFile();
            
            if (sessionLoaded) {
                const session = apiClient.getSession();
                console.log('📄 Found saved session for:', session.user?.email);
                
                // Handle demo mode
                if (session.user?.isDemo || session.user?.email === 'demo@pmlogin.com') {
                    console.log('🎭 Demo mode auto-login');
                    this.userData = session.user;
                    this.token = session.token;
                    this.loadMainPage();
                    return true;
                }
                
                // Verify token is still valid for real users
                const userResult = await apiClient.getUserFromToken(session.token);
                
                if (userResult.success) {
                    this.userData = userResult.data;
                    this.token = session.token;
                    
                    console.log('✅ Auto-login successful');
                    this.loadMainPage();
                    return true;
                } else {
                    console.log('❌ Auto-login failed: Invalid token');
                    apiClient.clearSession();
                    apiClient.clearSessionFile();
                }
            }
            
            // Fallback: Check legacy session files
            const sessionPath = path.join(app.getPath('userData'), 'session.json');
            const loginResultPath = path.join(__dirname, '../../storage/login_result.json');
            
            let sessionData = null;
            let isDemo = false;
            
            // Try login_result.json first (new format)
            if (fs.existsSync(loginResultPath)) {
                const loginResult = JSON.parse(fs.readFileSync(loginResultPath, 'utf8'));
                if (loginResult.success && loginResult.data) {
                    sessionData = {
                        user: loginResult.data.user,
                        token: loginResult.data.access_token || loginResult.data.token
                    };
                    isDemo = loginResult.isDemo || false;
                    console.log('📄 Found legacy login_result.json session', isDemo ? '(Demo Mode)' : '');
                }
            }
            
            // Fallback to session.json (old format)
            if (!sessionData && fs.existsSync(sessionPath)) {
                sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
                console.log('📄 Found legacy session.json session');
            }
            
            if (sessionData && sessionData.user && sessionData.token) {
                console.log('🔄 Legacy auto-login attempt for:', sessionData.user.email);
                
                // Handle demo mode
                if (isDemo || sessionData.user.email === 'demo@pmlogin.com') {
                    console.log('🎭 Legacy demo mode auto-login');
                    this.userData = sessionData.user;
                    this.token = sessionData.token;
                    
                    // Migrate to new API client session
                    apiClient.setSession(sessionData.user, sessionData.token);
                    apiClient.saveSessionToFile();
                    
                    this.loadMainPage();
                    return true;
                }
                
                // Verify token is still valid for real users
                const userResult = await apiClient.getUserFromToken(sessionData.token);
                
                if (userResult.success) {
                    this.userData = userResult.data;
                    this.token = sessionData.token;
                    
                    // Migrate to new API client session
                    apiClient.setSession(userResult.data, sessionData.token);
                    apiClient.saveSessionToFile();
                    
                    console.log('✅ Legacy auto-login successful');
                    this.loadMainPage();
                    return true;
                } else {
                    console.log('❌ Legacy auto-login failed: Invalid token');
                    await this.clearSession();
                }
            }
        } catch (error) {
            console.error('💥 Auto-login error:', error);
            await this.clearSession();
        }
        
        return false;
    }

    async saveSession() {
        try {
            const sessionPath = path.join(app.getPath('userData'), 'session.json');
            const sessionData = {
                user: this.userData,
                token: this.token,
                timestamp: Date.now()
            };
            
            fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
            console.log('💾 Session saved');
        } catch (error) {
            console.error('💥 Error saving session:', error);
        }
    }

    async clearSession() {
        try {
            // Clear API client session
            const apiClient = require('./services/api_client');
            apiClient.clearSession();
            apiClient.clearSessionFile();
            
            // Clear legacy session files
            const sessionPath = path.join(app.getPath('userData'), 'session.json');
            const loginResultPath = path.join(__dirname, '../../storage/login_result.json');
            
            if (fs.existsSync(sessionPath)) {
                fs.unlinkSync(sessionPath);
                console.log('🗑️ session.json cleared');
            }
            
            if (fs.existsSync(loginResultPath)) {
                fs.unlinkSync(loginResultPath);
                console.log('🗑️ login_result.json cleared');
            }
        } catch (error) {
            console.error('💥 Error clearing session:', error);
        }
    }

    async checkForUpdates() {
        try {
            const updateUrl = process.env.API_SYSTEM_URL;
            if (!updateUrl) return;

            console.log('🔍 Checking for updates...');
            
            // Use axios directly since apiClient might not have this method
            const axios = require('axios');
            const response = await axios.get(updateUrl, { timeout: 10000 });
            
            if (response.data && response.data.app_update) {
                const appUpdate = response.data.app_update;
                const latestVersion = appUpdate.latest_version;
                
                if (this.compareVersions(this.version, latestVersion) < 0) {
                    console.log(`🆕 New version available: ${latestVersion}`);
                    this.showUpdateDialog(latestVersion, appUpdate);
                } else {
                    console.log('✅ App is up to date');
                }
            }
        } catch (error) {
            console.error('💥 Update check error:', error.message);
        }
    }

    compareVersions(current, latest) {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);
        
        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const latestPart = latestParts[i] || 0;
            
            if (currentPart < latestPart) return -1;
            if (currentPart > latestPart) return 1;
        }
        
        return 0;
    }

    async showUpdateDialog(latestVersion, updateInfo) {
        const options = {
            type: 'info',
            title: 'Cập nhật mới',
            message: `Phiên bản ${latestVersion} đã sẵn sàng`,
            detail: updateInfo.changelog || 'Nâng cấp ngay để trải nghiệm tính năng tốt nhất.',
            buttons: updateInfo.force_update ? ['Cập nhật ngay'] : ['Cập nhật ngay', 'Để sau'],
            defaultId: 0,
            cancelId: updateInfo.force_update ? -1 : 1
        };

        const result = await dialog.showMessageBox(this.mainWindow, options);
        
        if (result.response === 0 && updateInfo.update_url) {
            // Open update URL
            shell.openExternal(updateInfo.update_url);
            
            if (updateInfo.force_update) {
                app.quit();
            }
        } else if (updateInfo.force_update) {
            app.quit();
        }
    }

    getUserData() {
        return this.userData;
    }

    getToken() {
        return this.token;
    }

    getCurrentView() {
        return this.currentView;
    }

    setUserData(user, token) {
        this.userData = user;
        this.token = token;
    }

    clearUserData() {
        this.userData = null;
        this.token = null;
    }
}

// Create app controller instance
const appController = new AppController();

// App event handlers
app.whenReady().then(async () => {
    appController.createWindow();
    
    // Check for auto-login
    const autoLoginSuccess = await appController.checkAutoLogin();
    if (!autoLoginSuccess) {
        console.log('🔑 Manual login required');
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        appController.createWindow();
    }
});

// Export for IPC handlers
module.exports = { appController };