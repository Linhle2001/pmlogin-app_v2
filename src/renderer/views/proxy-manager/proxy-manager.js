// Proxy Manager JavaScript với tính năng phân trang
class ProxyManager {
    constructor() {
        this.proxies = [];
        this.filteredProxies = [];
        this.selectedProxies = new Set();
        
        // Pagination properties
        this.currentPage = 1;
        this.itemsPerPage = 20; // Default items per page
        this.totalItems = 0;
        this.totalPages = 0;
        
        // Filters
        this.filters = {
            status: '',
            type: '',
            tag: '',
            search: ''
        };
        
        // Expose to window for onclick handlers
        window.proxyManager = this;
        
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
        document.getElementById('btn-add-proxy')?.addEventListener('click', () => this.showAddProxyModal());
        document.getElementById('btn-check-proxy')?.addEventListener('click', () => this.checkSelectedProxies());
        document.getElementById('btn-refresh')?.addEventListener('click', () => this.refresh());

        // Logout button
        document.getElementById('btn-logout')?.addEventListener('click', () => this.handleLogout());

        // Search and filters
        document.getElementById('search-input')?.addEventListener('input', (e) => this.applyFilter('search', e.target.value));
        document.getElementById('tag-filter')?.addEventListener('change', (e) => this.applyFilter('tag', e.target.value));

        // Select all checkbox
        document.getElementById('select-all-checkbox')?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));

        // Action bar buttons
        document.getElementById('btn-close-action')?.addEventListener('click', () => this.hideActionBar());
        document.getElementById('btn-check-selected')?.addEventListener('click', () => this.checkSelectedProxies());
        document.getElementById('btn-copy-selected')?.addEventListener('click', () => this.copySelectedProxies());
        document.getElementById('btn-delete-selected')?.addEventListener('click', () => this.deleteSelectedProxies());

        // Modal events
        this.bindModalEvents();
        
        // Note: Pagination events are now handled in attachPaginationEvents()
    }

    bindModalEvents() {
        // Add Proxy Modal
        document.getElementById('modal-close')?.addEventListener('click', () => this.hideAddProxyModal());
        document.getElementById('btn-cancel-modal')?.addEventListener('click', () => this.hideAddProxyModal());
        document.getElementById('btn-save-proxy')?.addEventListener('click', () => this.saveNewProxy());

        // Import Modal
        document.getElementById('import-modal-close')?.addEventListener('click', () => this.hideImportModal());
        document.getElementById('btn-cancel-import')?.addEventListener('click', () => this.hideImportModal());
        document.getElementById('btn-import-proxies')?.addEventListener('click', () => this.saveImportProxies());

        // Port adjustment buttons
        document.getElementById('btn-port-minus')?.addEventListener('click', () => this.adjustPort(-1));
        document.getElementById('btn-port-plus')?.addEventListener('click', () => this.adjustPort(1));

        // Password toggle
        document.getElementById('btn-toggle-password')?.addEventListener('click', () => this.togglePasswordVisibility());
    }

    // ======================================================================
    // DATA LOADING
    // ======================================================================

    async loadProxies() {
        try {
            console.log('🔄 Loading proxies from database...');
            this.showLoadingState();
            
            const result = await window.electronAPI.invoke('db:proxy:get-all');
            console.log('📡 IPC result:', result);
            
            if (result.success) {
                this.proxies = result.data || [];
                this.applyFilters();
                this.renderProxies();
                this.updateStats();
                
                console.log(`✅ Loaded ${this.proxies.length} proxies`);
            } else {
                console.error('❌ Failed to load proxies:', result.message);
                this.showError('Failed to load proxies: ' + result.message);
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
            const result = await window.electronAPI.invoke('db:tag:get-all');
            
            if (result.success) {
                const tagFilter = document.getElementById('tag-filter');
                if (tagFilter) {
                    // Clear existing options except "All Tags"
                    tagFilter.innerHTML = '<option value="">All Tags</option>';
                    
                    // Add tag options
                    result.data.forEach(tag => {
                        const option = document.createElement('option');
                        option.value = tag.name;
                        option.textContent = tag.name;
                        tagFilter.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error loading tags:', error);
        }
    }

    // ======================================================================
    // RENDERING với PAGINATION
    // ======================================================================

    renderProxies() {
        const tbody = document.getElementById('proxy-table-body');
        const noDataPlaceholder = document.getElementById('no-data-placeholder');
        const paginationContainer = document.getElementById('pagination-container');
        
        if (!tbody) return;

        // Clear existing rows
        tbody.innerHTML = '';

        // Show empty state if no proxies
        if (this.filteredProxies.length === 0) {
            if (noDataPlaceholder) noDataPlaceholder.style.display = 'block';
            if (paginationContainer) paginationContainer.style.display = 'none';
            return;
        }

        // Hide empty state and show pagination
        if (noDataPlaceholder) noDataPlaceholder.style.display = 'none';
        if (paginationContainer) paginationContainer.style.display = 'block';

        // Update total items for pagination
        this.totalItems = this.filteredProxies.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

        // Get paginated data
        const paginatedData = this.getPaginatedData(this.filteredProxies);

        // Render proxy rows
        paginatedData.forEach((proxy, index) => {
            const row = this.createProxyRow(proxy, index);
            tbody.appendChild(row);
        });

        // Create pagination - giống ProfilesView
        this.createPagination(paginationContainer);
        
        console.log(`✅ Rendered ${paginatedData.length} of ${this.totalItems} proxies (Page ${this.currentPage}/${this.totalPages})`);
    }

    getPaginatedData(allData) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return allData.slice(startIndex, endIndex);
    }

    createProxyRow(proxy, index) {
        const row = document.createElement('tr');
        row.className = 'proxy-row';
        row.dataset.proxyId = proxy.id;

        const globalIndex = (this.currentPage - 1) * this.itemsPerPage + index + 1;
        const statusClass = this.getStatusClass(proxy.status);
        const statusText = proxy.status || 'unchecked';
        const tagsText = proxy.tags ? (Array.isArray(proxy.tags) ? proxy.tags.join(', ') : proxy.tags) : '';
        const maskedPassword = proxy.password ? '•'.repeat(proxy.password.length) : '';

        row.innerHTML = `
            <td>
                <input type="checkbox" class="proxy-checkbox" data-proxy-id="${proxy.id}">
            </td>
            <td>${globalIndex}</td>
            <td class="text-truncate">${proxy.name || `${proxy.host}:${proxy.port}`}</td>
            <td>${proxy.host}</td>
            <td>${proxy.port}</td>
            <td class="text-truncate">${proxy.username || ''}</td>
            <td class="password-masked">${maskedPassword}</td>
            <td>
                <span class="tag-item">${proxy.type.toUpperCase()}</span>
            </td>
            <td>
                <div class="tag-list">
                    ${tagsText.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => 
                        `<span class="tag-item">${tag}</span>`
                    ).join('')}
                </div>
            </td>
            <td>
                <span class="status-badge status-${proxy.status || 'pending'}">${statusText}</span>
            </td>
            <td>
                <div class="row-actions">
                    <button class="btn-row-menu" onclick="window.proxyManager.toggleRowMenu(${proxy.id})">⋮</button>
                    <div class="row-menu" id="row-menu-${proxy.id}" style="display: none;">
                        <button class="row-menu-item edit" onclick="window.proxyManager.editProxy(${proxy.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="row-menu-item copy" onclick="window.proxyManager.copyProxy(${proxy.id})">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <button class="row-menu-item delete" onclick="window.proxyManager.deleteProxy(${proxy.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
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
            this.updateSelectionUI();
        });

        return row;
    }

    getStatusClass(status) {
        switch (status) {
            case 'live':
                return 'status-live';
            case 'dead':
                return 'status-dead';
            case 'testing':
                return 'status-testing';
            default:
                return 'status-pending';
        }
    }

    // ======================================================================
    // PAGINATION - Giống hệt ProfilesView
    // ======================================================================

    createPagination(container) {
        // Clear existing pagination
        container.innerHTML = '';
        
        const pagination = document.createElement('div');
        pagination.className = 'pagination-wrapper';
        
        pagination.innerHTML = `
            <div class="pagination-info">
                <div class="items-per-page-selector">
                    <label for="itemsPerPage">Hiển thị:</label>
                    <select id="itemsPerPage" class="items-per-page-select">
                        <option value="5" ${this.itemsPerPage === 5 ? 'selected' : ''}>5</option>
                        <option value="10" ${this.itemsPerPage === 10 ? 'selected' : ''}>10</option>
                        <option value="25" ${this.itemsPerPage === 25 ? 'selected' : ''}>25</option>
                        <option value="50" ${this.itemsPerPage === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${this.itemsPerPage === 100 ? 'selected' : ''}>100</option>
                    </select>
                    <span>proxies/trang</span>
                </div>
                
                <div class="pagination-stats">
                    <span>Hiển thị ${this.getStartIndex()} - ${this.getEndIndex()} của ${this.totalItems} proxies</span>
                </div>
            </div>
            
            <div class="pagination-controls">
                <button class="pagination-btn pagination-btn-prev" ${this.currentPage <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                    <span>Trước</span>
                </button>
                
                <div class="pagination-pages">
                    ${this.generatePageNumbers()}
                </div>
                
                <button class="pagination-btn pagination-btn-next" ${this.currentPage >= this.totalPages ? 'disabled' : ''}>
                    <span>Sau</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        container.appendChild(pagination);
        this.attachPaginationEvents(pagination);
    }

    generatePageNumbers() {
        let pages = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page and ellipsis
        if (startPage > 1) {
            pages += `<button class="pagination-page" data-page="1">1</button>`;
            if (startPage > 2) {
                pages += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages += `<button class="pagination-page ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        // Last page and ellipsis
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                pages += `<span class="pagination-ellipsis">...</span>`;
            }
            pages += `<button class="pagination-page" data-page="${this.totalPages}">${this.totalPages}</button>`;
        }
        
        return pages;
    }

    attachPaginationEvents(pagination) {
        // Items per page selector
        const itemsPerPageSelect = pagination.querySelector('#itemsPerPage');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1; // Reset to first page
                this.renderProxies();
            });
        }
        
        // Previous button
        const prevBtn = pagination.querySelector('.pagination-btn-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderProxies();
                }
            });
        }
        
        // Next button
        const nextBtn = pagination.querySelector('.pagination-btn-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.renderProxies();
                }
            });
        }
        
        // Page number buttons
        const pageButtons = pagination.querySelectorAll('.pagination-page');
        pageButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.renderProxies();
                }
            });
        });
    }

    getStartIndex() {
        if (this.totalItems === 0) return 0;
        return (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    getEndIndex() {
        const endIndex = this.currentPage * this.itemsPerPage;
        return Math.min(endIndex, this.totalItems);
    }

    // ======================================================================
    // FILTERING
    // ======================================================================

    applyFilter(type, value) {
        this.filters[type] = value;
        this.applyFilters();
        this.currentPage = 1; // Reset to first page when filtering
        this.renderProxies();
    }

    applyFilters() {
        this.filteredProxies = this.proxies.filter(proxy => {
            // Status filter
            if (this.filters.status) {
                if (this.filters.status === 'unchecked' && proxy.status) return false;
                if (this.filters.status !== 'unchecked' && proxy.status !== this.filters.status) return false;
            }

            // Type filter
            if (this.filters.type && proxy.type !== this.filters.type) return false;

            // Tag filter
            if (this.filters.tag) {
                const proxyTags = Array.isArray(proxy.tags) ? proxy.tags : 
                                 (proxy.tags ? proxy.tags.split(',').map(t => t.trim()) : []);
                if (!proxyTags.includes(this.filters.tag)) return false;
            }

            // Search filter
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                const searchText = `${proxy.name || ''} ${proxy.host} ${proxy.port} ${proxy.username || ''}`.toLowerCase();
                if (!searchText.includes(search)) return false;
            }

            return true;
        });
    }

    clearFilters() {
        this.filters = { status: '', type: '', tag: '', search: '' };
        
        const searchInput = document.getElementById('search-input');
        const tagFilter = document.getElementById('tag-filter');
        
        if (searchInput) searchInput.value = '';
        if (tagFilter) tagFilter.value = '';
        
        this.applyFilters();
        this.currentPage = 1;
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
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        const hasSelection = this.selectedProxies.size > 0;
        const actionBar = document.getElementById('action-bar');
        const controlsBar = document.getElementById('controls-bar');
        
        if (hasSelection) {
            if (actionBar) actionBar.style.display = 'flex';
            if (controlsBar) controlsBar.style.display = 'none';
        } else {
            if (actionBar) actionBar.style.display = 'none';
            if (controlsBar) controlsBar.style.display = 'flex';
        }

        // Update select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            const visibleProxies = this.getPaginatedData(this.filteredProxies);
            const visibleSelected = visibleProxies.filter(p => this.selectedProxies.has(p.id)).length;
            
            selectAllCheckbox.checked = visibleProxies.length > 0 && visibleSelected === visibleProxies.length;
            selectAllCheckbox.indeterminate = visibleSelected > 0 && visibleSelected < visibleProxies.length;
        }
    }

    hideActionBar() {
        this.selectedProxies.clear();
        
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll('.proxy-checkbox');
        checkboxes.forEach(checkbox => checkbox.checked = false);
        
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
        
        this.updateSelectionUI();
    }

    // ======================================================================
    // PROXY OPERATIONS
    // ======================================================================

    async refresh() {
        console.log('🔄 Refreshing proxy manager...');
        
        // Reset pagination to first page
        this.currentPage = 1;
        
        // Clear selection
        this.selectedProxies.clear();
        this.updateSelectionUI();
        
        try {
            await this.loadProxies();
            await this.loadTags();
            console.log('✅ Proxy manager refreshed successfully');
        } catch (error) {
            console.error('❌ Error refreshing proxy manager:', error);
        }
    }

    showAddProxyModal() {
        const modal = document.getElementById('proxy-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Focus on first input
            const nameInput = document.getElementById('input-name');
            if (nameInput) nameInput.focus();
        }
    }

    hideAddProxyModal() {
        const modal = document.getElementById('proxy-modal');
        if (modal) {
            modal.style.display = 'none';
            
            // Reset form
            const form = modal.querySelector('form') || modal;
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
    }

    showImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Focus on textarea
            const textarea = document.getElementById('import-textarea');
            if (textarea) textarea.focus();
        }
    }

    hideImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.style.display = 'none';
            
            // Reset form
            const textarea = document.getElementById('import-textarea');
            const tagsInput = document.getElementById('import-tags');
            
            if (textarea) textarea.value = '';
            if (tagsInput) tagsInput.value = 'Default';
        }
    }

    async saveImportProxies() {
        try {
            const textarea = document.getElementById('import-textarea');
            const tagsInput = document.getElementById('import-tags');
            
            if (!textarea || !textarea.value.trim()) {
                this.showError('Please enter proxy list');
                return;
            }

            const proxyLines = textarea.value.trim().split('\n');
            const tags = tagsInput?.value || 'Default';
            
            this.showLoadingState();
            
            let successCount = 0;
            let failCount = 0;
            
            for (const line of proxyLines) {
                const proxyData = this.parseProxyLine(line.trim());
                if (proxyData) {
                    proxyData.tags = tags;
                    proxyData.status = 'unchecked';
                    
                    const result = await window.electronAPI.invoke('db:proxy:add', proxyData);
                    if (result.success) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } else {
                    failCount++;
                }
            }

            this.showSuccess(`Imported ${successCount} proxies successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
            this.hideImportModal();
            await this.loadProxies();
        } catch (error) {
            console.error('❌ Error importing proxies:', error);
            this.showError('Error importing proxies: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    parseProxyLine(line) {
        if (!line) return null;

        // Format: type://host:port:username:password:name
        // or host:port:username:password
        // or username:password@host:port
        
        try {
            let type = 'http';
            let host, port, username, password, name;

            // Check for type://
            if (line.includes('://')) {
                const parts = line.split('://');
                type = parts[0].toLowerCase();
                line = parts[1];
            }

            // Check for username:password@host:port format
            if (line.includes('@')) {
                const parts = line.split('@');
                const authParts = parts[0].split(':');
                username = authParts[0];
                password = authParts[1];
                
                const hostParts = parts[1].split(':');
                host = hostParts[0];
                port = parseInt(hostParts[1]);
            } else {
                // Format: host:port:username:password:name
                const parts = line.split(':');
                host = parts[0];
                port = parseInt(parts[1]);
                username = parts[2] || '';
                password = parts[3] || '';
                name = parts[4] || '';
            }

            if (!host || !port || isNaN(port)) {
                return null;
            }

            return {
                name: name || `${host}:${port}`,
                host,
                port,
                type,
                username: username || '',
                password: password || ''
            };
        } catch (error) {
            console.error('Error parsing proxy line:', line, error);
            return null;
        }
    }

    async saveNewProxy() {
        try {
            const proxyData = this.getProxyFormData();
            
            if (!this.validateProxyData(proxyData)) {
                return;
            }

            this.showLoadingState();
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
        } finally {
            this.hideLoadingState();
        }
    }

    async editProxy(proxyId) {
        const proxy = this.proxies.find(p => p.id === proxyId);
        if (proxy) {
            this.showInfo('Edit proxy functionality will be implemented soon');
        }
    }

    async copyProxy(proxyId) {
        const proxy = this.proxies.find(p => p.id === proxyId);
        if (proxy) {
            const proxyString = `${proxy.host}:${proxy.port}${proxy.username ? ':' + proxy.username : ''}${proxy.password ? ':' + proxy.password : ''}`;
            
            try {
                await navigator.clipboard.writeText(proxyString);
                this.showSuccess('Proxy copied to clipboard');
            } catch (error) {
                console.error('Failed to copy to clipboard:', error);
                this.showError('Failed to copy to clipboard');
            }
        }
    }

    async deleteProxy(proxyId) {
        if (!confirm('Are you sure you want to delete this proxy?')) {
            return;
        }

        try {
            const proxy = this.proxies.find(p => p.id === proxyId);
            if (!proxy) return;

            this.showLoadingState();
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
        } finally {
            this.hideLoadingState();
        }
    }

    async checkSelectedProxies() {
        if (this.selectedProxies.size === 0) {
            this.showError('Please select proxies to check');
            return;
        }

        this.showInfo(`Checking ${this.selectedProxies.size} selected proxies...`);
        // Check functionality to be implemented
    }

    async copySelectedProxies() {
        if (this.selectedProxies.size === 0) {
            this.showError('Please select proxies to copy');
            return;
        }

        const selectedProxyData = [];
        for (const proxyId of this.selectedProxies) {
            const proxy = this.proxies.find(p => p.id === proxyId);
            if (proxy) {
                const proxyString = `${proxy.host}:${proxy.port}${proxy.username ? ':' + proxy.username : ''}${proxy.password ? ':' + proxy.password : ''}`;
                selectedProxyData.push(proxyString);
            }
        }

        try {
            await navigator.clipboard.writeText(selectedProxyData.join('\n'));
            this.showSuccess(`Copied ${selectedProxyData.length} proxies to clipboard`);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showError('Failed to copy to clipboard');
        }
    }

    async deleteSelectedProxies() {
        if (this.selectedProxies.size === 0) {
            this.showError('Please select proxies to delete');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${this.selectedProxies.size} selected proxies?`)) {
            return;
        }

        try {
            this.showLoadingState();
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
            this.updateSelectionUI();
            await this.loadProxies();
        } catch (error) {
            console.error('❌ Error deleting proxies:', error);
            this.showError('Error deleting proxies: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    // ======================================================================
    // UI HELPERS
    // ======================================================================

    toggleRowMenu(proxyId) {
        // Close all other menus first
        document.querySelectorAll('.row-menu').forEach(menu => {
            if (menu.id !== `row-menu-${proxyId}`) {
                menu.style.display = 'none';
            }
        });

        // Toggle current menu
        const menu = document.getElementById(`row-menu-${proxyId}`);
        if (menu) {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    }

    adjustPort(delta) {
        const portInput = document.getElementById('input-port');
        if (portInput) {
            const currentValue = parseInt(portInput.value) || 8080;
            const newValue = Math.max(1, Math.min(65535, currentValue + delta));
            portInput.value = newValue;
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('input-password');
        const toggleBtn = document.getElementById('btn-toggle-password');
        
        if (passwordInput && toggleBtn) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleBtn.textContent = '👁';
            }
        }
    }

    updateStats() {
        const total = this.proxies.length;
        const live = this.proxies.filter(p => p.status === 'live').length;
        const dead = this.proxies.filter(p => p.status === 'dead').length;
        const unchecked = this.proxies.filter(p => !p.status || p.status === 'unchecked').length;

        // Update stats if elements exist
        const totalEl = document.getElementById('total-proxies-count');
        const liveEl = document.getElementById('live-proxies-count');
        const deadEl = document.getElementById('dead-proxies-count');
        const uncheckEl = document.getElementById('unchecked-proxies-count');

        if (totalEl) totalEl.textContent = total;
        if (liveEl) liveEl.textContent = live;
        if (deadEl) deadEl.textContent = dead;
        if (uncheckEl) uncheckEl.textContent = unchecked;
    }

    // ======================================================================
    // UTILITY METHODS
    // ======================================================================

    getProxyFormData() {
        const nameField = document.getElementById('input-name');
        const hostField = document.getElementById('input-host');
        const portField = document.getElementById('input-port');
        const typeField = document.getElementById('input-type');
        const usernameField = document.getElementById('input-username');
        const passwordField = document.getElementById('input-password');
        const tagsField = document.getElementById('input-tags');

        const tags = tagsField && tagsField.value ? 
                    tagsField.value.split(',').map(t => t.trim()).filter(t => t) : 
                    ['Default'];

        return {
            name: nameField ? nameField.value.trim() : '',
            host: hostField ? hostField.value.trim() : '',
            port: portField ? parseInt(portField.value) : 0,
            type: typeField ? typeField.value : 'http',
            username: usernameField ? usernameField.value.trim() : '',
            password: passwordField ? passwordField.value.trim() : '',
            tags: tags
        };
    }

    validateProxyData(data, showError = true) {
        if (!data.host) {
            if (showError) this.showError('Host is required');
            return false;
        }

        if (!data.port || data.port < 1 || data.port > 65535) {
            if (showError) this.showError('Valid port (1-65535) is required');
            return false;
        }

        return true;
    }

    showLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    hideLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
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
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // ======================================================================
    // LOGOUT HANDLER
    // ======================================================================

    async handleLogout() {
        const confirmed = confirm('Bạn có chắc chắn muốn đăng xuất?');
        
        if (confirmed) {
            try {
                console.log('🚪 Logging out from proxy manager...');
                const result = await window.electronAPI.logout();
                
                if (result.success) {
                    console.log('✅ Logout successful');
                    // Navigation will be handled by main process
                } else {
                    console.error('❌ Logout failed:', result.message);
                    this.showError('Lỗi đăng xuất: ' + result.message);
                }
            } catch (error) {
                console.error('❌ Logout error:', error);
                this.showError('Lỗi đăng xuất: ' + error.message);
            }
        }
    }

    // ======================================================================
    // FORM HELPERS
    // ======================================================================

    getProxyFormData() {
        return {
            name: document.getElementById('input-name')?.value || '',
            host: document.getElementById('input-host')?.value || '',
            port: parseInt(document.getElementById('input-port')?.value) || 8080,
            type: document.getElementById('input-type')?.value || 'http',
            username: document.getElementById('input-username')?.value || '',
            password: document.getElementById('input-password')?.value || '',
            tags: document.getElementById('input-tags')?.value || 'Default',
            status: 'unchecked'
        };
    }

    validateProxyData(proxyData) {
        if (!proxyData.host) {
            this.showError('Host is required');
            return false;
        }

        if (!proxyData.port || proxyData.port < 1 || proxyData.port > 65535) {
            this.showError('Port must be between 1 and 65535');
            return false;
        }

        return true;
    }

    // ======================================================================
    // UI STATE HELPERS
    // ======================================================================

    showLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    hideLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showInfo(message) {
        this.showToast(message, 'info');
    }

    showToast(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                toast.style.backgroundColor = '#10b981';
                break;
            case 'error':
                toast.style.backgroundColor = '#ef4444';
                break;
            case 'info':
            default:
                toast.style.backgroundColor = '#3b82f6';
                break;
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // ======================================================================
    // CLEANUP
    // ======================================================================

    destroy() {
        // Clean up event listeners and reset state
        this.proxies = [];
        this.filteredProxies = [];
        this.selectedProxies.clear();
        this.currentPage = 1;
        this.totalItems = 0;
        this.totalPages = 0;
        
        console.log('ProxyManager destroyed');
    }
}

// Global instance
let proxyManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    proxyManager = new ProxyManager();
});

// Export for global access
window.ProxyManager = ProxyManager;