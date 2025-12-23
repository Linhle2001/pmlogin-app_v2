/**
 * Proxy Manager - Quản lý giao diện proxy
 * Tích hợp với database system
 */

class ProxyManager {
    constructor() {
        this.proxies = [];
        this.filteredProxies = [];
        this.selectedProxies = new Set();
        this.filters = {
            status: '',
            type: '',
            tag: '',
            search: ''
        };
        
        // Initialize ProxyPagination
        if (typeof ProxyPagination !== 'undefined') {
            this.proxyPagination = new ProxyPagination();
            // Override onPageChange to render proxies when page changes
            this.proxyPagination.onPageChange = () => {
                this.renderProxies();
            };
        } else {
            console.error('❌ ProxyPagination class not found in constructor');
            // Will retry in loadProxies() if needed
        }
        
        this.init();
    }

    async init() {
        try {
            this.bindEvents();
            await this.loadProxies();
            await this.loadTags();
            this.updateStats();
        } catch (error) {
            console.error('❌ Error initializing ProxyManager:', error);
        }
    }

    bindEvents() {
        // Main buttons
        document.getElementById('addProxyBtn')?.addEventListener('click', () => this.showAddProxyModal());
        document.getElementById('importProxyBtn')?.addEventListener('click', () => this.showImportProxyModal());
        document.getElementById('testSelectedProxiesBtn')?.addEventListener('click', () => this.testSelectedProxies());
        document.getElementById('deleteSelectedProxiesBtn')?.addEventListener('click', () => this.deleteSelectedProxies());

        // Filters
        document.getElementById('proxyStatusFilter')?.addEventListener('change', (e) => this.applyFilter('status', e.target.value));
        document.getElementById('proxyTypeFilter')?.addEventListener('change', (e) => this.applyFilter('type', e.target.value));
        document.getElementById('proxyTagFilter')?.addEventListener('change', (e) => this.applyFilter('tag', e.target.value));
        document.getElementById('proxySearchInput')?.addEventListener('input', (e) => this.applyFilter('search', e.target.value));
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => this.clearFilters());

        // Select all checkbox
        document.getElementById('selectAllProxies')?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));

        // Add Proxy Modal
        document.getElementById('closeAddProxyModal')?.addEventListener('click', () => this.hideAddProxyModal());
        document.getElementById('cancelAddProxy')?.addEventListener('click', () => this.hideAddProxyModal());
        document.getElementById('saveAddProxy')?.addEventListener('click', () => this.saveNewProxy());
        document.getElementById('testAddProxy')?.addEventListener('click', () => this.testNewProxy());

        // Import Proxy Modal
        document.getElementById('closeImportProxyModal')?.addEventListener('click', () => this.hideImportProxyModal());
        document.getElementById('cancelImportProxy')?.addEventListener('click', () => this.hideImportProxyModal());
        document.getElementById('previewImportProxy')?.addEventListener('click', () => this.previewImportProxies());
        document.getElementById('saveImportProxy')?.addEventListener('click', () => this.saveImportProxies());
        document.getElementById('importProxyText')?.addEventListener('input', () => this.updateImportPreview());

        // Edit Proxy Modal
        document.getElementById('closeEditProxyModal')?.addEventListener('click', () => this.hideEditProxyModal());
        document.getElementById('cancelEditProxy')?.addEventListener('click', () => this.hideEditProxyModal());
        document.getElementById('saveEditProxy')?.addEventListener('click', () => this.saveEditProxy());
        document.getElementById('testEditProxy')?.addEventListener('click', () => this.testEditProxy());

        // Pagination is handled by ProxyPagination class
    }

    // ======================================================================
    // DATA LOADING
    // ======================================================================

    async loadProxies() {
        try {
            this.showLoadingState();
            
            // Check if electronAPI is available
            if (!window.electronAPI || !window.electronAPI.invoke) {
                console.error('❌ window.electronAPI is not available');
                this.showError('Electron API is not available. Please check preload script.');
                this.hideLoadingState();
                return;
            }
            
            const result = await window.electronAPI.invoke('db:proxy:get-all');
            
            if (result && result.success) {
                this.proxies = result.data || [];
                
                // Đảm bảo proxyPagination đã được khởi tạo
                if (!this.proxyPagination) {
                    console.error('❌ proxyPagination is not initialized, retrying...');
                    if (typeof ProxyPagination !== 'undefined') {
                        this.proxyPagination = new ProxyPagination();
                        this.proxyPagination.onPageChange = () => {
                            this.renderProxies();
                        };
                    } else {
                        console.error('❌ ProxyPagination class still not available');
                        this.hideLoadingState();
                        return;
                    }
                }
                
                this.applyFilters();
                this.updateStats();
            } else {
                const errorMsg = result?.message || 'Unknown error';
                console.error('❌ Failed to load proxies:', errorMsg);
                this.showError('Failed to load proxies: ' + errorMsg);
            }
        } catch (error) {
            console.error('❌ Error loading proxies:', error);
            this.showError('Error loading proxies: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    async loadTags() {
        try {
            // Check if electronAPI is available
            if (!window.electronAPI || !window.electronAPI.invoke) {
                return;
            }
            
            const result = await window.electronAPI.invoke('db:tag:get-all');
            
            if (result && result.success) {
                const tagFilter = document.getElementById('proxyTagFilter');
                if (tagFilter) {
                    // Clear existing options except "All Tags"
                    tagFilter.innerHTML = '<option value="">All Tags</option>';
                    
                    // Add tag options
                    if (result.data && Array.isArray(result.data)) {
                        result.data.forEach(tag => {
                            const option = document.createElement('option');
                            option.value = tag.name;
                            option.textContent = tag.name;
                            tagFilter.appendChild(option);
                        });
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error loading tags:', error);
        }
    }

    // ======================================================================
    // RENDERING
    // ======================================================================

    renderProxies() {
        const tbody = document.getElementById('proxyTableBody');
        const emptyState = document.getElementById('proxyEmptyState');
        if (!tbody) return;
    
        tbody.innerHTML = '';
    
        // Kiểm tra proxyPagination đã được khởi tạo chưa
        if (!this.proxyPagination) {
            console.error('❌ proxyPagination is not initialized');
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
    
        // Lấy dữ liệu đã được Pagination chia trang sẵn
        const pageProxies = this.proxyPagination.getCurrentPageData();
    
        if (pageProxies.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
    
        if (emptyState) emptyState.classList.add('hidden');
    
        pageProxies.forEach(proxy => {
            const row = this.createProxyRow(proxy);
            tbody.appendChild(row);
        });
    }
    
    // applyFilter(type, value) {
    //     this.filters[type] = value;
    //     this.applyFilters();
    //     // Reset to first page via ProxyPagination
    //     if (this.proxyPagination) {
    //         this.proxyPagination.goToPage(1);
    //     }
    //     this.renderProxies();
    // }
    applyFilter(type, value) {
        this.filters[type] = value;
        this.applyFilters();
    }
    
    // Hàm xử lý logic lọc chính
    applyFilters() {
        // 1. Tính toán mảng filteredProxies dựa trên các điều kiện lọc
        this.filteredProxies = this.proxies.filter(proxy => {
            // Lọc theo Status
            if (this.filters.status) {
                if (this.filters.status === 'unchecked') {
                    if (proxy.status) return false;
                } else if (proxy.status !== this.filters.status) {
                    return false;
                }
            }
    
            // Lọc theo Loại (HTTP/SOCKS5...)
            if (this.filters.type && proxy.type !== this.filters.type) {
                return false;
            }
    
            // Lọc theo Tag
            if (this.filters.tag && (!proxy.tags || !proxy.tags.includes(this.filters.tag))) {
                return false;
            }
    
            // Lọc theo từ khóa tìm kiếm (Tên, Host, Port)
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                const searchText = `${proxy.name || ''} ${proxy.host} ${proxy.port}`.toLowerCase();
                if (!searchText.includes(search)) return false;
            }
    
            return true;
        });
    
        // 2. Cập nhật dữ liệu vào Pagination
        if (!this.proxyPagination) {
            console.error('❌ proxyPagination is not initialized in applyFilters');
            return;
        }
        
        // Tham số thứ 3 là 'true' để reset về trang 1 mỗi khi thay đổi bộ lọc
        this.proxyPagination.setData(this.proxies, this.filteredProxies, true);
    
        // 3. Gọi hàm render để vẽ lại bảng proxy
        this.renderProxies();
    }

    createProxyRow(proxy) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.dataset.proxyId = proxy.id;

        const statusClass = this.getStatusClass(proxy.status);
        const statusText = proxy.status || 'unchecked';
        const authText = proxy.username ? '✓' : '✗';
        const tagsText = proxy.tags ? proxy.tags.join(', ') : '';
        const lastUsed = proxy.last_used_at ? new Date(proxy.last_used_at * 1000).toLocaleString() : 'Never';

        row.innerHTML = `
            <td class="px-4 py-3">
                <input type="checkbox" class="proxy-checkbox rounded" data-proxy-id="${proxy.id}">
            </td>
            <td class="px-4 py-3">
                <div class="font-medium text-gray-900">${proxy.name || `${proxy.host}:${proxy.port}`}</div>
            </td>
            <td class="px-4 py-3">
                <div class="text-gray-900">${proxy.host}:${proxy.port}</div>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    ${proxy.type.toUpperCase()}
                </span>
            </td>
            <td class="px-4 py-3 text-center">
                <span class="${authText === '✓' ? 'text-green-600' : 'text-gray-400'}">${authText}</span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
                    ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="text-sm text-gray-600">${tagsText}</div>
            </td>
            <td class="px-4 py-3">
                <div class="text-sm text-gray-600">${lastUsed}</div>
            </td>
            <td class="px-4 py-3">
                <div class="flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-800" onclick="proxyManager.editProxy(${proxy.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-purple-600 hover:text-purple-800" onclick="proxyManager.testProxy(${proxy.id})" title="Test">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800" onclick="proxyManager.deleteProxy(${proxy.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        // Add checkbox event listener
        const checkbox = row.querySelector('.proxy-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectedProxies.add(proxy.id);
            } else {
                this.selectedProxies.delete(proxy.id);
            }
            this.updateSelectionButtons();
        });

        return row;
    }

    getStatusClass(status) {
        switch (status) {
            case 'live':
                return 'bg-green-100 text-green-800';
            case 'dead':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    updateStats() {
        const total = this.proxies.length;
        const live = this.proxies.filter(p => p.status === 'live').length;
        const dead = this.proxies.filter(p => p.status === 'dead').length;
        const unchecked = this.proxies.filter(p => !p.status).length;

        document.getElementById('totalProxiesCount').textContent = total;
        document.getElementById('liveProxiesCount').textContent = live;
        document.getElementById('deadProxiesCount').textContent = dead;
        document.getElementById('uncheckedProxiesCount').textContent = unchecked;
    }

    // ======================================================================
    // FILTERING
    // ======================================================================



    clearFilters() {
        this.filters = { status: '', type: '', tag: '', search: '' };
        
        document.getElementById('proxyStatusFilter').value = '';
        document.getElementById('proxyTypeFilter').value = '';
        document.getElementById('proxyTagFilter').value = '';
        document.getElementById('proxySearchInput').value = '';
        
        this.applyFilters();
        // Reset to first page via ProxyPagination
        if (this.proxyPagination) {
            this.proxyPagination.goToPage(1);
        }
        this.renderProxies();
    }

    // ======================================================================
    // SELECTION
    // ======================================================================

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.proxy-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const proxyId = parseInt(checkbox.dataset.proxyId);
            if (checked) {
                this.selectedProxies.add(proxyId);
            } else {
                this.selectedProxies.delete(proxyId);
            }
        });
        this.updateSelectionButtons();
    }

    updateSelectionButtons() {
        const hasSelection = this.selectedProxies.size > 0;
        document.getElementById('testSelectedProxiesBtn').disabled = !hasSelection;
        document.getElementById('deleteSelectedProxiesBtn').disabled = !hasSelection;
    }

    // ======================================================================
    // PAGINATION
    // ======================================================================
    // Pagination is now handled by ProxyPagination class

    // ======================================================================
    // MODAL MANAGEMENT
    // ======================================================================

    showAddProxyModal() {
        document.getElementById('addProxyModal').classList.remove('hidden');
        document.getElementById('proxyName').focus();
    }

    hideAddProxyModal() {
        document.getElementById('addProxyModal').classList.add('hidden');
        document.getElementById('addProxyForm').reset();
    }

    showImportProxyModal() {
        document.getElementById('importProxyModal').classList.remove('hidden');
        document.getElementById('importProxyText').focus();
    }

    hideImportProxyModal() {
        document.getElementById('importProxyModal').classList.add('hidden');
        document.getElementById('importProxyText').value = '';
        document.getElementById('importTags').value = '';
        document.getElementById('importPreviewCount').textContent = '0';
        document.getElementById('saveImportProxy').disabled = true;
    }

    showEditProxyModal(proxy) {
        document.getElementById('editProxyId').value = proxy.id;
        document.getElementById('editProxyName').value = proxy.name || '';
        document.getElementById('editProxyHost').value = proxy.host;
        document.getElementById('editProxyPort').value = proxy.port;
        document.getElementById('editProxyType').value = proxy.type;
        document.getElementById('editProxyUsername').value = proxy.username || '';
        document.getElementById('editProxyPassword').value = proxy.password || '';
        document.getElementById('editProxyTags').value = proxy.tags ? proxy.tags.join(', ') : '';
        
        document.getElementById('editProxyModal').classList.remove('hidden');
    }

    hideEditProxyModal() {
        document.getElementById('editProxyModal').classList.add('hidden');
        document.getElementById('editProxyForm').reset();
    }

    // ======================================================================
    // PROXY OPERATIONS
    // ======================================================================

    async saveNewProxy() {
        try {
            const proxyData = this.getProxyFormData('add');
            
            if (!this.validateProxyData(proxyData)) {
                return;
            }

            const result = await window.electronAPI.invoke('db:proxy:add', proxyData);
            
            if (result.success) {
                this.showSuccess('Proxy added successfully');
                this.hideAddProxyModal();
                await this.loadProxies();
            } else {
                this.showError('Failed to add proxy: ' + result.message);
            }
        } catch (error) {
            console.error('❌ Error adding proxy:', error);
            this.showError('Error adding proxy: ' + error.message);
        }
    }

    async testNewProxy() {
        try {
            const proxyData = this.getProxyFormData('add');
            
            if (!this.validateProxyData(proxyData)) {
                return;
            }

            // Test proxy and then add if successful
            this.showInfo('Testing proxy...');
            
            // For now, just add the proxy - testing can be implemented later
            await this.saveNewProxy();
        } catch (error) {
            console.error('❌ Error testing proxy:', error);
            this.showError('Error testing proxy: ' + error.message);
        }
    }

    async editProxy(proxyId) {
        const proxy = this.proxies.find(p => p.id === proxyId);
        if (proxy) {
            this.showEditProxyModal(proxy);
        }
    }

    async saveEditProxy() {
        try {
            const proxyId = parseInt(document.getElementById('editProxyId').value);
            const proxyData = this.getProxyFormData('edit');
            
            if (!this.validateProxyData(proxyData)) {
                return;
            }

            // For now, we'll need to implement proxy update in the backend
            this.showInfo('Proxy update functionality will be implemented soon');
            this.hideEditProxyModal();
        } catch (error) {
            console.error('❌ Error updating proxy:', error);
            this.showError('Error updating proxy: ' + error.message);
        }
    }

    async testEditProxy() {
        const proxyData = this.getProxyFormData('edit');
        
        if (!this.validateProxyData(proxyData)) {
            return;
        }

        this.showInfo('Testing proxy...');
        // Testing functionality to be implemented
    }

    async testProxy(proxyId) {
        const proxy = this.proxies.find(p => p.id === proxyId);
        if (proxy) {
            this.showInfo(`Testing proxy ${proxy.host}:${proxy.port}...`);
            // Testing functionality to be implemented
        }
    }

    async deleteProxy(proxyId) {
        if (!confirm('Are you sure you want to delete this proxy?')) {
            return;
        }

        try {
            const proxy = this.proxies.find(p => p.id === proxyId);
            if (!proxy) return;

            const result = await window.electronAPI.invoke('db:proxy:delete', proxy.host, proxy.port);
            
            if (result.success) {
                this.showSuccess('Proxy deleted successfully');
                await this.loadProxies();
            } else {
                this.showError('Failed to delete proxy: ' + result.message);
            }
        } catch (error) {
            console.error('❌ Error deleting proxy:', error);
            this.showError('Error deleting proxy: ' + error.message);
        }
    }

    async testSelectedProxies() {
        if (this.selectedProxies.size === 0) return;

        this.showInfo(`Testing ${this.selectedProxies.size} selected proxies...`);
        // Testing functionality to be implemented
    }

    async deleteSelectedProxies() {
        if (this.selectedProxies.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${this.selectedProxies.size} selected proxies?`)) {
            return;
        }

        try {
            let deletedCount = 0;
            
            for (const proxyId of this.selectedProxies) {
                const proxy = this.proxies.find(p => p.id === proxyId);
                if (proxy) {
                    const result = await window.electronAPI.invoke('db:proxy:delete', proxy.host, proxy.port);
                    if (result.success) {
                        deletedCount++;
                    }
                }
            }

            this.showSuccess(`Deleted ${deletedCount} proxies successfully`);
            this.selectedProxies.clear();
            await this.loadProxies();
        } catch (error) {
            console.error('❌ Error deleting proxies:', error);
            this.showError('Error deleting proxies: ' + error.message);
        }
    }

    // ======================================================================
    // IMPORT FUNCTIONALITY
    // ======================================================================

    updateImportPreview() {
        const text = document.getElementById('importProxyText').value;
        const lines = text.split('\n').filter(line => line.trim());
        
        document.getElementById('importPreviewCount').textContent = lines.length;
        document.getElementById('saveImportProxy').disabled = lines.length === 0;
    }

    previewImportProxies() {
        const text = document.getElementById('importProxyText').value;
        const format = document.getElementById('importFormat').value;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            this.showError('Please enter proxy list');
            return;
        }

        // Parse and validate proxies
        const parsedProxies = this.parseProxyList(lines, format);
        const validProxies = parsedProxies.filter(p => p.valid);
        
        this.showInfo(`Preview: ${validProxies.length} valid proxies out of ${lines.length} lines`);
        document.getElementById('saveImportProxy').disabled = validProxies.length === 0;
    }

    async saveImportProxies() {
        try {
            const text = document.getElementById('importProxyText').value;
            const format = document.getElementById('importFormat').value;
            const defaultTags = document.getElementById('importTags').value;
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
                this.showError('Please enter proxy list');
                return;
            }

            // Parse proxies
            const parsedProxies = this.parseProxyList(lines, format);
            const validProxies = parsedProxies.filter(p => p.valid);
            
            if (validProxies.length === 0) {
                this.showError('No valid proxies found');
                return;
            }

            // Add default tags
            const tags = defaultTags ? defaultTags.split(',').map(t => t.trim()).filter(t => t) : [];
            
            const proxiesToAdd = validProxies.map(p => ({
                ...p.data,
                tags: tags.length > 0 ? tags : ['Imported']
            }));

            // Bulk add proxies
            const result = await window.electronAPI.invoke('db:proxy:bulk-add', proxiesToAdd);
            
            if (result.success) {
                const { successCount, totalCount } = result.data;
                this.showSuccess(`Successfully imported ${successCount}/${totalCount} proxies`);
                this.hideImportProxyModal();
                await this.loadProxies();
            } else {
                this.showError('Failed to import proxies: ' + result.message);
            }
        } catch (error) {
            console.error('❌ Error importing proxies:', error);
            this.showError('Error importing proxies: ' + error.message);
        }
    }

    parseProxyList(lines, format) {
        return lines.map(line => {
            try {
                const trimmed = line.trim();
                if (!trimmed) return { valid: false };

                let host, port, username = '', password = '', type = 'http';

                switch (format) {
                    case 'host:port':
                        [host, port] = trimmed.split(':');
                        break;
                    
                    case 'host:port:username:password':
                        [host, port, username, password] = trimmed.split(':');
                        break;
                    
                    case 'type://host:port':
                        const match1 = trimmed.match(/^(\w+):\/\/([^:]+):(\d+)$/);
                        if (match1) {
                            [, type, host, port] = match1;
                        }
                        break;
                    
                    case 'type://host:port:username:password':
                        const match2 = trimmed.match(/^(\w+):\/\/([^:]+):(\d+):([^:]*):(.*)$/);
                        if (match2) {
                            [, type, host, port, username, password] = match2;
                        }
                        break;
                    
                    case 'type://username:password@host:port':
                        const match3 = trimmed.match(/^(\w+):\/\/([^:]*):([^@]*)@([^:]+):(\d+)$/);
                        if (match3) {
                            [, type, username, password, host, port] = match3;
                        }
                        break;
                }

                if (!host || !port || isNaN(port)) {
                    return { valid: false };
                }

                return {
                    valid: true,
                    data: {
                        host: host.trim(),
                        port: parseInt(port),
                        username: username || '',
                        password: password || '',
                        type: type.toLowerCase()
                    }
                };
            } catch (error) {
                return { valid: false };
            }
        });
    }

    // ======================================================================
    // UTILITY METHODS
    // ======================================================================

    getProxyFormData(type) {
        const prefix = type === 'edit' ? 'edit' : '';
        const nameField = document.getElementById(`${prefix}ProxyName`);
        const hostField = document.getElementById(`${prefix}ProxyHost`);
        const portField = document.getElementById(`${prefix}ProxyPort`);
        const typeField = document.getElementById(`${prefix}ProxyType`);
        const usernameField = document.getElementById(`${prefix}ProxyUsername`);
        const passwordField = document.getElementById(`${prefix}ProxyPassword`);
        const tagsField = document.getElementById(`${prefix}ProxyTags`);

        const tags = tagsField.value ? tagsField.value.split(',').map(t => t.trim()).filter(t => t) : [];

        return {
            name: nameField.value.trim() || null,
            host: hostField.value.trim(),
            port: parseInt(portField.value),
            type: typeField.value,
            username: usernameField.value.trim(),
            password: passwordField.value.trim(),
            tags: tags.length > 0 ? tags : ['Default']
        };
    }

    validateProxyData(data) {
        if (!data.host) {
            this.showError('Host is required');
            return false;
        }

        if (!data.port || data.port < 1 || data.port > 65535) {
            this.showError('Valid port (1-65535) is required');
            return false;
        }

        return true;
    }

    showLoadingState() {
        document.getElementById('proxyLoadingState')?.classList.remove('hidden');
        document.getElementById('proxyEmptyState')?.classList.add('hidden');
    }

    hideLoadingState() {
        document.getElementById('proxyLoadingState')?.classList.add('hidden');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Simple notification - can be enhanced later
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
}

// Global instance
let proxyManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the proxy view
    if (document.getElementById('proxiesView')) {
        // Đảm bảo ProxyPagination đã được load
        if (typeof ProxyPagination === 'undefined') {
            console.error('❌ ProxyPagination class not found. Waiting...');
            // Retry after a short delay
            setTimeout(() => {
                if (typeof ProxyPagination !== 'undefined') {
                    proxyManager = new ProxyManager();
                    window.proxyManager = proxyManager;
                } else {
                    console.error('❌ ProxyPagination class still not found after delay');
                }
            }, 100);
        } else {
            proxyManager = new ProxyManager();
            window.proxyManager = proxyManager;
        }
    }
});