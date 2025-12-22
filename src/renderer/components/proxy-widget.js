// Proxy Widget Component - Chuyển đổi từ PyQt6 proxy_widget.py
import * as theme from './constants.js';

export class ProxyConfigWidget {
    constructor(container) {
        this.container = container;
        this.onProxyTest = null;
        this.onProxyClear = null;
        this.init();
    }
    
    init() {
        this.createWidget();
        this.bindEvents();
    }
    
    createWidget() {
        this.container.innerHTML = '';
        this.container.className = 'proxy-config-widget';
        
        const widget = document.createElement('div');
        widget.className = 'space-y-5';
        
        // Proxy Type
        widget.appendChild(this.createProxyTypeSection());
        
        // Host và Port
        widget.appendChild(this.createHostPortSection());
        
        // Username và Password
        widget.appendChild(this.createCredentialsSection());
        
        // IP Checker Service
        widget.appendChild(this.createIPCheckerSection());
        
        // Enable change IP
        widget.appendChild(this.createChangeIPSection());
        
        // Change proxy URL
        widget.appendChild(this.createProxyURLSection());
        
        // Action buttons
        widget.appendChild(this.createActionButtons());
        
        this.container.appendChild(widget);
    }
    
    createProxyTypeSection() {
        const section = document.createElement('div');
        section.innerHTML = `
            <label class="block text-sm font-medium mb-2" style="color: ${theme.COLOR_TEXT_DARK};">Proxy Type</label>
            <select id="proxyType" class="w-full h-10 px-3 border rounded-md" style="border-color: #D0D0D0;">
                <option value="http">HTTP Proxy</option>
                <option value="https">HTTPS Proxy</option>
                <option value="socks5">SOCKS5 Proxy</option>
                <option value="socks4">SOCKS4 Proxy</option>
            </select>
            <p class="text-xs mt-1" style="color: ${theme.COLOR_TEXT_SUBTLE};">Proxy will stop when closing PMLogin.</p>
        `;
        return section;
    }
    
    createHostPortSection() {
        const section = document.createElement('div');
        section.className = 'grid grid-cols-2 gap-3';
        section.innerHTML = `
            <div>
                <label class="block text-sm font-medium mb-2" style="color: ${theme.COLOR_TEXT_DARK};">Host</label>
                <input type="text" id="proxyHost" placeholder="Host" class="w-full h-10 px-3 border rounded-md" style="border-color: #D0D0D0;">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2" style="color: ${theme.COLOR_TEXT_DARK};">Proxy port</label>
                <input type="number" id="proxyPort" placeholder="Proxy port" class="w-full h-10 px-3 border rounded-md" style="border-color: #D0D0D0;">
            </div>
        `;
        return section;
    }
    
    createCredentialsSection() {
        const section = document.createElement('div');
        section.className = 'grid grid-cols-2 gap-3';
        section.innerHTML = `
            <div>
                <label class="block text-sm font-medium mb-2" style="color: ${theme.COLOR_TEXT_DARK};">Username</label>
                <input type="text" id="proxyUsername" placeholder="Username" class="w-full h-10 px-3 border rounded-md" style="border-color: #D0D0D0;">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2" style="color: ${theme.COLOR_TEXT_DARK};">Password</label>
                <input type="password" id="proxyPassword" placeholder="Password" class="w-full h-10 px-3 border rounded-md" style="border-color: #D0D0D0;">
            </div>
        `;
        return section;
    }
    
    createIPCheckerSection() {
        const section = document.createElement('div');
        section.innerHTML = `
            <label class="block text-sm font-medium mb-2" style="color: ${theme.COLOR_TEXT_DARK};">IP checker service</label>
            <select id="ipChecker" class="w-full h-10 px-3 border rounded-md" style="border-color: #D0D0D0;">
                <option value="tz">TZ (Suitable for IP v6)</option>
                <option value="ipinfo">IPInfo.io</option>
                <option value="whatismyip">WhatIsMyIP.com</option>
                <option value="ipapi">IP-API.com</option>
            </select>
        `;
        return section;
    }
    
    createChangeIPSection() {
        const section = document.createElement('div');
        section.className = 'flex items-center';
        section.innerHTML = `
            <input type="checkbox" id="enableChangeIP" class="w-4 h-4 rounded" style="accent-color: ${theme.COLOR_PRIMARY_GREEN};">
            <label for="enableChangeIP" class="ml-2 text-sm" style="color: ${theme.COLOR_TEXT_DARK};">Enable change IP</label>
        `;
        return section;
    }
    
    createProxyURLSection() {
        const section = document.createElement('div');
        section.innerHTML = `
            <label class="block text-sm font-medium mb-2" style="color: ${theme.COLOR_TEXT_DARK};">Change proxy URL</label>
            <input type="text" id="proxyURL" placeholder="URL" class="w-full h-10 px-3 border rounded-md" style="border-color: #D0D0D0;">
        `;
        return section;
    }
    
    createActionButtons() {
        const section = document.createElement('div');
        section.className = 'flex space-x-3';
        section.innerHTML = `
            <button id="checkProxyBtn" class="flex-1 h-10 px-5 rounded-md text-sm font-medium text-white transition-colors" style="background-color: ${theme.COLOR_PRIMARY_GREEN};">
                Check proxy
            </button>
            <button id="clearProxyBtn" class="flex-1 h-10 px-5 rounded-md text-sm font-medium border transition-colors" style="color: ${theme.COLOR_TEXT_DARK}; border-color: #D0D0D0;">
                Clear proxy
            </button>
        `;
        return section;
    }
    
    bindEvents() {
        // Check proxy button
        const checkBtn = this.container.querySelector('#checkProxyBtn');
        if (checkBtn) {
            checkBtn.addEventListener('mouseenter', () => {
                checkBtn.style.backgroundColor = theme.COLOR_PRIMARY_DARK;
            });
            checkBtn.addEventListener('mouseleave', () => {
                checkBtn.style.backgroundColor = theme.COLOR_PRIMARY_GREEN;
            });
            checkBtn.addEventListener('click', () => {
                if (this.onProxyTest) {
                    this.onProxyTest(this.getProxyData());
                }
            });
        }
        
        // Clear proxy button
        const clearBtn = this.container.querySelector('#clearProxyBtn');
        if (clearBtn) {
            clearBtn.addEventListener('mouseenter', () => {
                clearBtn.style.backgroundColor = theme.COLOR_HOVER_BG;
                clearBtn.style.borderColor = theme.COLOR_PRIMARY_GREEN;
            });
            clearBtn.addEventListener('mouseleave', () => {
                clearBtn.style.backgroundColor = 'transparent';
                clearBtn.style.borderColor = '#D0D0D0';
            });
            clearBtn.addEventListener('click', () => {
                if (this.onProxyClear) {
                    this.onProxyClear();
                }
                this.clearForm();
            });
        }
        
        // Add focus styles to inputs
        const inputs = this.container.querySelectorAll('input[type="text"], input[type="number"], input[type="password"], select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.borderColor = theme.COLOR_PRIMARY_GREEN;
                input.style.borderWidth = '2px';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = '#D0D0D0';
                input.style.borderWidth = '1px';
            });
        });
    }
    
    getProxyData() {
        return {
            type: this.container.querySelector('#proxyType')?.value || 'http',
            host: this.container.querySelector('#proxyHost')?.value || '',
            port: this.container.querySelector('#proxyPort')?.value || '',
            username: this.container.querySelector('#proxyUsername')?.value || '',
            password: this.container.querySelector('#proxyPassword')?.value || '',
            ipChecker: this.container.querySelector('#ipChecker')?.value || 'tz',
            enableChangeIP: this.container.querySelector('#enableChangeIP')?.checked || false,
            proxyURL: this.container.querySelector('#proxyURL')?.value || ''
        };
    }
    
    setProxyData(data) {
        if (!data) return;
        
        const typeSelect = this.container.querySelector('#proxyType');
        const hostInput = this.container.querySelector('#proxyHost');
        const portInput = this.container.querySelector('#proxyPort');
        const usernameInput = this.container.querySelector('#proxyUsername');
        const passwordInput = this.container.querySelector('#proxyPassword');
        const ipCheckerSelect = this.container.querySelector('#ipChecker');
        const enableChangeIPCheckbox = this.container.querySelector('#enableChangeIP');
        const proxyURLInput = this.container.querySelector('#proxyURL');
        
        if (typeSelect) typeSelect.value = data.type || 'http';
        if (hostInput) hostInput.value = data.host || '';
        if (portInput) portInput.value = data.port || '';
        if (usernameInput) usernameInput.value = data.username || '';
        if (passwordInput) passwordInput.value = data.password || '';
        if (ipCheckerSelect) ipCheckerSelect.value = data.ipChecker || 'tz';
        if (enableChangeIPCheckbox) enableChangeIPCheckbox.checked = data.enableChangeIP || false;
        if (proxyURLInput) proxyURLInput.value = data.proxyURL || '';
    }
    
    clearForm() {
        const hostInput = this.container.querySelector('#proxyHost');
        const portInput = this.container.querySelector('#proxyPort');
        const usernameInput = this.container.querySelector('#proxyUsername');
        const passwordInput = this.container.querySelector('#proxyPassword');
        const proxyURLInput = this.container.querySelector('#proxyURL');
        const enableChangeIPCheckbox = this.container.querySelector('#enableChangeIP');
        const typeSelect = this.container.querySelector('#proxyType');
        const ipCheckerSelect = this.container.querySelector('#ipChecker');
        
        if (hostInput) hostInput.value = '';
        if (portInput) portInput.value = '';
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (proxyURLInput) proxyURLInput.value = '';
        if (enableChangeIPCheckbox) enableChangeIPCheckbox.checked = false;
        if (typeSelect) typeSelect.selectedIndex = 0;
        if (ipCheckerSelect) ipCheckerSelect.selectedIndex = 0;
    }
    
    setOnProxyTest(callback) {
        this.onProxyTest = callback;
    }
    
    setOnProxyClear(callback) {
        this.onProxyClear = callback;
    }
}
