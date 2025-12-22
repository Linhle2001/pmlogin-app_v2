const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Authentication
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    loginDemo: (demoUserData) => ipcRenderer.invoke('auth:login-demo', demoUserData),
    logout: () => ipcRenderer.invoke('auth:logout'),
    changePassword: (passwordData) => ipcRenderer.invoke('auth:change-password', passwordData),
    
    // User data
    getUserData: () => ipcRenderer.invoke('user:get-data'),
    
    // Navigation
    navigateToMain: () => ipcRenderer.invoke('nav:to-main'),
    navigateToLogin: () => ipcRenderer.invoke('nav:to-login'),
    
    // System
    getSystemInfo: () => ipcRenderer.invoke('system:info'),
    checkUpdates: () => ipcRenderer.invoke('system:check-updates'),
    
    // Proxy management (legacy)
    getProxies: () => ipcRenderer.invoke('proxy:get-all'),
    addProxy: (proxyData) => ipcRenderer.invoke('proxy:add', proxyData),
    updateProxy: (id, proxyData) => ipcRenderer.invoke('proxy:update', id, proxyData),
    deleteProxy: (id) => ipcRenderer.invoke('proxy:delete', id),
    testProxy: (proxyData) => ipcRenderer.invoke('proxy:test', proxyData),
    
    // Profile management (legacy)
    getProfiles: () => ipcRenderer.invoke('profile:get-all'),
    addProfile: (profileData) => ipcRenderer.invoke('profile:add', profileData),
    updateProfile: (id, profileData) => ipcRenderer.invoke('profile:update', id, profileData),
    deleteProfile: (id) => ipcRenderer.invoke('profile:delete', id),
    exportProfiles: (profileIds) => ipcRenderer.invoke('profile:export', profileIds),
    
    // File operations
    selectFile: (options) => ipcRenderer.invoke('file:select', options),
    saveFile: (options) => ipcRenderer.invoke('file:save', options),
    
    // Notifications
    showNotification: (title, body) => ipcRenderer.invoke('notification:show', title, body),
    
    // Generic IPC invoke for database operations
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    
    // Event listeners
    onNavigate: (callback) => ipcRenderer.on('navigate', callback),
    onUserDataUpdate: (callback) => ipcRenderer.on('user-data-update', callback),
    onLogout: (callback) => ipcRenderer.on('logout', callback),
    
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});