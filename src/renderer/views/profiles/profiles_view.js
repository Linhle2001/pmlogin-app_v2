/**
 * ProfilesView - Main profiles management view for Electron app
 * Integrates ProfilesStructure with the main application
 */

class ProfilesView {
    constructor(container) {
        this.container = container;
        this.profilesStructure = null; // Will be initialized later
        this.currentTab = 'local';
        this.profilesData = [];
        this.isInitialized = false;
        
        // Pagination properties
        this.currentPage = 1;
        this.itemsPerPage = 10; // Default items per page
        this.totalItems = 0;
        this.totalPages = 0;
        
        // Group view state
        this.viewingGroup = null; // Track which group is currently being viewed in expanded mode
        
        // Expose to window for onclick handlers
        window.profilesView = this;
        
        this.init();
    }

    // Helper method to safely call electronAPI
    async safeElectronCall(method, ...args) {
        if (!window.electronAPI || !window.electronAPI.invoke) {
            console.warn('⚠️ electronAPI not available');
            return { success: false, error: 'electronAPI not available' };
        }
        
        try {
            return await window.electronAPI.invoke(method, ...args);
        } catch (error) {
            console.error(`❌ Error calling ${method}:`, error);
            return { success: false, error: error.message };
        }
    }

    async init() {
        if (this.isInitialized) return;
        
        // Check if ProfilesStructure is available
        if (typeof ProfilesStructure === 'undefined') {
            throw new Error('ProfilesStructure class not found');
        }
        
        // Initialize ProfilesStructure
        this.profilesStructure = new ProfilesStructure();
        
        await this.createLayout();
        await this.loadProfilesData();
        this.isInitialized = true;
        
        console.log('ProfilesView initialized successfully');
    }

    async createLayout() {
        this.container.innerHTML = `
            <div class="profiles-view">
                <!-- Header with title and refresh button -->
                <div class="profiles-view-header">
                    <div class="header-left">
                        <h1 class="view-title">Quản lý Profiles</h1>
                        <p class="view-subtitle">Quản lý tất cả profiles browser của bạn</p>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-secondary refresh-btn" id="refreshBtn">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="profiles-header">
                    <div class="tabs-container">
                        <button class="tab-button active" data-tab="local">
                            <span class="tab-icon">💻</span>
                            <span class="tab-text">Local</span>
                            <span class="tab-count" id="localCount">0</span>
                        </button>
                        <button class="tab-button" data-tab="cloud">
                            <span class="tab-icon">☁️</span>
                            <span class="tab-text">Cloud</span>
                            <span class="tab-count" id="cloudCount">0</span>
                        </button>
                        <button class="tab-button" data-tab="group">
                            <span class="tab-icon">📁</span>
                            <span class="tab-text">Group</span>
                            <span class="tab-count" id="groupCount">0</span>
                        </button>
                        <button class="tab-button" data-tab="team">
                            <span class="tab-icon">👥</span>
                            <span class="tab-text">Team</span>
                            <span class="tab-count" id="teamCount">0</span>
                        </button>
                    </div>
                </div>
                
                <!-- Tab Content -->
                <div class="profiles-content">
                    <!-- Local Tab Content -->
                    <div id="local-tab-content" class="tab-content active">
                        <div id="local-taskbar-container" class="taskbar-container">
                            <!-- Local taskbar will be inserted here -->
                        </div>
                        <div id="local-table-container" class="table-container">
                            <!-- Local table will be inserted here -->
                        </div>
                        <div id="local-pagination-container" class="pagination-container">
                            <!-- Local pagination will be inserted here -->
                        </div>
                    </div>

                    <!-- Cloud Tab Content -->
                    <div id="cloud-tab-content" class="tab-content">
                        <div id="cloud-taskbar-container" class="taskbar-container">
                            <!-- Cloud taskbar will be inserted here -->
                        </div>
                        <div id="cloud-table-container" class="table-container">
                            <!-- Cloud table will be inserted here -->
                        </div>
                        <div id="cloud-pagination-container" class="pagination-container">
                            <!-- Cloud pagination will be inserted here -->
                        </div>
                    </div>

                    <!-- Group Tab Content -->
                    <div id="group-tab-content" class="tab-content">
                        <!-- Group List View -->
                        <div id="group-list-view" class="group-list-view">
                            <div class="group-management-container">
                                <div class="group-header">
                                    <div class="group-search">
                                        <input type="text" class="search-input" placeholder="Search groups..." id="groupSearchInput" />
                                    </div>
                                    <button class="btn btn-primary" id="newGroupBtn">
                                        <i class="fas fa-plus"></i> New group
                                    </button>
                                </div>
                                <div id="group-list-container" class="group-list-container">
                                    <!-- Group list will be inserted here -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Group Expanded View (full-width with table) -->
                        <div id="group-expanded-view" class="group-expanded-view" style="display: none;">
                            <div class="group-expanded-header">
                                <button class="btn btn-secondary" id="backToGroupsBtn">
                                    <i class="fas fa-arrow-left"></i> Back to Groups
                                </button>
                                <h2 id="expanded-group-title" class="expanded-group-title"></h2>
                            </div>
                            <div id="group-taskbar-container" class="taskbar-container">
                                <!-- Group taskbar will be inserted here -->
                            </div>
                            <div id="group-table-container" class="table-container">
                                <!-- Group table will be inserted here -->
                            </div>
                            <div id="group-pagination-container" class="pagination-container">
                                <!-- Group pagination will be inserted here -->
                            </div>
                        </div>
                    </div>

                    <!-- Team Tab Content -->
                    <div id="team-tab-content" class="tab-content">
                        <div class="team-placeholder">
                            <div class="placeholder-icon">👥</div>
                            <h3>Team Management</h3>
                            <p>Team management feature is coming soon...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents();
        
        // Force render after DOM is ready
        setTimeout(async () => {
            await this.renderCurrentTab();
            await this.updateTabCounts();
        }, 100);
    }

    attachEvents() {
        // Tab switching
        const tabButtons = this.container.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const tab = e.currentTarget.dataset.tab;
                await this.switchTab(tab);
            });
        });

        // Refresh button
        const refreshBtn = this.container.querySelector('#refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.refresh();
            });
        }

        // Group management events
        const newGroupBtn = this.container.querySelector('#newGroupBtn');
        if (newGroupBtn) {
            newGroupBtn.addEventListener('click', () => {
                this.showNewGroupDialog();
            });
        }

        const groupSearchInput = this.container.querySelector('#groupSearchInput');
        if (groupSearchInput) {
            groupSearchInput.addEventListener('input', (e) => {
                this.filterGroups(e.target.value);
            });
        }

        // Back to groups button
        const backToGroupsBtn = this.container.querySelector('#backToGroupsBtn');
        if (backToGroupsBtn) {
            backToGroupsBtn.addEventListener('click', () => {
                this.backToGroupList();
            });
        }
    }

    async switchTab(tab) {
        if (this.currentTab === tab) return;
        
        // Reset pagination when switching tabs
        this.currentPage = 1;
        
        // Reset viewing group when switching away from group tab
        if (tab !== 'group') {
            this.viewingGroup = null;
        }
        
        // Update active tab button
        const tabButtons = this.container.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update active tab content
        const tabContents = this.container.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab-content`);
        });
        
        this.currentTab = tab;
        await this.renderCurrentTab();
        
        console.log(`Switched to tab: ${tab}`);
    }

    async renderCurrentTab() {
        console.log(`🔄 Rendering tab: ${this.currentTab}`);

        if (this.currentTab === 'group') {
            await this.renderGroupTab();
            return;
        }

        if (this.currentTab === 'team') {
            // Team tab is just a placeholder for now
            return;
        }

        // For local and cloud tabs, render taskbar, table, and pagination
        const taskbarContainer = this.container.querySelector(`#${this.currentTab}-taskbar-container`);
        const tableContainer = this.container.querySelector(`#${this.currentTab}-table-container`);
        const paginationContainer = this.container.querySelector(`#${this.currentTab}-pagination-container`);
        
        if (!taskbarContainer || !tableContainer || !paginationContainer) {
            console.error(`❌ Containers not found for tab: ${this.currentTab}`);
            return;
        }
        
        // Clear containers
        taskbarContainer.innerHTML = '';
        tableContainer.innerHTML = '';
        paginationContainer.innerHTML = '';
        
        // Determine context based on current tab
        let context = 'local';
        let groupName = null;
        
        switch (this.currentTab) {
            case 'local':
                context = 'local';
                break;
            case 'cloud':
                context = 'cloud';
                break;
            case 'group':
                context = 'group';
                groupName = 'Sample Group'; // TODO: Get actual group name
                break;
            case 'team':
                context = 'team';
                break;
        }
        
        // Create taskbar
        const taskbar = this.profilesStructure.createTaskbar(context, groupName);
        taskbarContainer.appendChild(taskbar);
        
        // Create table
        const table = this.profilesStructure.createProfilesTable(context);
        tableContainer.appendChild(table);
        
        // Load data for current tab
        await this.loadDataForTab(this.currentTab, table);
        
        // Create pagination
        this.createPagination(paginationContainer);
        
        console.log(`✅ Rendered tab: ${this.currentTab} with context: ${context}`);
    }

    async loadProfilesData() {
        try {
            console.log('🔄 Loading profiles from database...');
            
            // Load profiles from database via IPC
            const response = await this.safeElectronCall('db:profile:get-all');
            
            if (response.success) {
                this.profilesData = response.data.map(profile => {
                    // Parse proxy data if it's stored as JSON string
                    let proxyInfo = 'No proxy';
                    let proxyStatus = 'No proxy';
                    
                    if (profile.proxy) {
                        try {
                            const proxyData = JSON.parse(profile.proxy);
                            if (proxyData.type === 'your_proxy' && proxyData.host && proxyData.port) {
                                proxyInfo = `${proxyData.protocol || 'http'}://${proxyData.host}:${proxyData.port}`;
                                proxyStatus = 'Ready';
                            } else if (proxyData.type === 'pm_proxy' && proxyData.id) {
                                proxyInfo = `PM Proxy ID: ${proxyData.id}`;
                                proxyStatus = 'Ready';
                            }
                        } catch (e) {
                            // If not JSON, treat as plain text
                            proxyInfo = profile.proxy;
                            proxyStatus = 'Ready';
                        }
                    }
                    
                    return {
                        id: profile.id.toString(),
                        name: profile.name || 'Unnamed Profile',
                        platform: profile.platform || 'Chrome',
                        tags: profile.tags || [],
                        note: profile.note || '',
                        proxy: proxyInfo,
                        proxy_status: proxyStatus,
                        updated_at: profile.updated_at || new Date().toISOString(),
                        last_started_at: profile.last_started_at || '',
                        status: profile.status || 'Ready',
                        shared_on_cloud: profile.shared_on_cloud || false
                    };
                });
                
                console.log(`✅ Loaded ${this.profilesData.length} profiles from database`);
            } else {
                console.error('❌ Failed to load profiles:', response.message);
                this.profilesData = [];
            }
        } catch (error) {
            console.error('❌ Error loading profiles data:', error);
            this.profilesData = [];
        }
    }

    async loadProfilesForTab(tab) {
        try {
            console.log(`🔄 Loading profiles for tab: ${tab}`);
            
            let apiEndpoint = 'db:profile:get-all';
            
            switch (tab) {
                case 'local':
                case 'local-storage':
                    apiEndpoint = 'db:profile:get-local';
                    break;
                case 'cloud':
                    apiEndpoint = 'db:profile:get-cloud';
                    break;
                default:
                    apiEndpoint = 'db:profile:get-all';
            }
            
            const response = await this.safeElectronCall(apiEndpoint);
            
            if (response.success) {
                return response.data.map(profile => {
                    // Parse proxy data if it's stored as JSON string
                    let proxyInfo = 'No proxy';
                    let proxyStatus = 'No proxy';
                    
                    if (profile.proxy) {
                        try {
                            const proxyData = JSON.parse(profile.proxy);
                            if (proxyData.type === 'your_proxy' && proxyData.host && proxyData.port) {
                                proxyInfo = `${proxyData.protocol || 'http'}://${proxyData.host}:${proxyData.port}`;
                                proxyStatus = 'Ready';
                            } else if (proxyData.type === 'pm_proxy' && proxyData.id) {
                                proxyInfo = `PM Proxy ID: ${proxyData.id}`;
                                proxyStatus = 'Ready';
                            }
                        } catch (e) {
                            // If not JSON, treat as plain text
                            proxyInfo = profile.proxy;
                            proxyStatus = 'Ready';
                        }
                    }
                    
                    return {
                        id: profile.id.toString(),
                        name: profile.name || 'Unnamed Profile',
                        platform: profile.platform || 'Chrome',
                        tags: profile.tags || [],
                        note: profile.note || '',
                        proxy: proxyInfo,
                        proxy_status: proxyStatus,
                        updated_at: profile.updated_at || new Date().toISOString(),
                        last_started_at: profile.last_started_at || '',
                        status: profile.status || 'Ready',
                        shared_on_cloud: profile.shared_on_cloud || false
                    };
                });
            } else {
                console.error(`❌ Failed to load profiles for tab ${tab}:`, response.message);
                return [];
            }
        } catch (error) {
            console.error(`❌ Error loading profiles for tab ${tab}:`, error);
            return [];
        }
    }

    async loadDataForTab(tab, tableContainer) {
        try {
            console.log(`🔄 Loading data for tab: ${tab}`);
            
            // Load profiles for specific tab
            const allDataForTab = await this.loadProfilesForTab(tab);
            
            // Update total items for pagination
            this.totalItems = allDataForTab.length;
            this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
            
            // Get paginated data
            const paginatedData = this.getPaginatedData(allDataForTab);
            
            // Update local profilesData for other operations
            this.profilesData = paginatedData;
            
            // Populate table with paginated data
            this.profilesStructure.populateTable(paginatedData, tableContainer);
            
            console.log(`✅ Loaded ${paginatedData.length} of ${this.totalItems} profiles for tab: ${tab} (Page ${this.currentPage}/${this.totalPages})`);
        } catch (error) {
            console.error(`❌ Error loading data for tab ${tab}:`, error);
            
            // Fallback to empty data
            this.profilesStructure.populateTable([], tableContainer);
        }
    }

    getPaginatedData(allData) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return allData.slice(startIndex, endIndex);
    }

    createPagination(container) {
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
                    <span>profiles/trang</span>
                </div>
                
                <div class="pagination-stats">
                    <span>Hiển thị ${this.getStartIndex()} - ${this.getEndIndex()} của ${this.totalItems} profiles</span>
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

    getStartIndex() {
        if (this.totalItems === 0) return 0;
        return (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    getEndIndex() {
        const endIndex = this.currentPage * this.itemsPerPage;
        return Math.min(endIndex, this.totalItems);
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
                this.renderCurrentTab();
            });
        }
        
        // Previous button
        const prevBtn = pagination.querySelector('.pagination-btn-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderCurrentTab();
                }
            });
        }
        
        // Next button
        const nextBtn = pagination.querySelector('.pagination-btn-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.renderCurrentTab();
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
                    this.renderCurrentTab();
                }
            });
        });
    }

    // Public methods for external integration
    
    async refresh() {
        console.log('🔄 Refreshing profiles view...');
        
        // Ensure ProfilesStructure is available
        if (!this.profilesStructure) {
            console.error('❌ ProfilesStructure not available, reinitializing...');
            this.profilesStructure = new ProfilesStructure();
        }
        
        // Clear any existing selection to avoid stale state
        this.clearSelection();
        
        // Reset pagination to first page
        this.currentPage = 1;
        
        try {
            await this.renderCurrentTab();
            await this.updateTabCounts();
            console.log('✅ Profiles view refreshed successfully');
        } catch (error) {
            console.error('❌ Error refreshing profiles view:', error);
        }
    }

    async updateTabCounts() {
        try {
            // Get counts for each tab
            const localProfiles = await this.loadProfilesForTab('local');
            const cloudProfiles = await this.loadProfilesForTab('cloud');
            const groups = await this.loadGroups();
            
            // Update tab count badges
            const localCountEl = this.container.querySelector('#localCount');
            const cloudCountEl = this.container.querySelector('#cloudCount');
            const groupCountEl = this.container.querySelector('#groupCount');
            const teamCountEl = this.container.querySelector('#teamCount');
            
            if (localCountEl) localCountEl.textContent = localProfiles.length;
            if (cloudCountEl) cloudCountEl.textContent = cloudProfiles.length;
            if (groupCountEl) groupCountEl.textContent = groups.length;
            if (teamCountEl) teamCountEl.textContent = '0'; // Team feature not implemented yet
            
            console.log(`✅ Updated tab counts: Local(${localProfiles.length}), Cloud(${cloudProfiles.length}), Groups(${groups.length})`);
        } catch (error) {
            console.error('❌ Error updating tab counts:', error);
        }
    }

    async renderGroupTab() {
        console.log('🔄 Rendering Group tab...');
        
        // If viewing a group, show expanded view
        if (this.viewingGroup) {
            await this.showGroupExpandedView(this.viewingGroup);
            return;
        }
        
        // Otherwise show group list
        await this.showGroupListView();
    }

    async showGroupListView() {
        const groupListContainer = this.container.querySelector('#group-list-container');
        const groupListView = this.container.querySelector('#group-list-view');
        const groupExpandedView = this.container.querySelector('#group-expanded-view');
        
        if (!groupListContainer || !groupListView || !groupExpandedView) {
            console.error('❌ Group containers not found');
            return;
        }
        
        // Show list view, hide expanded view
        groupListView.style.display = 'block';
        groupExpandedView.style.display = 'none';
        
        // Clear container first to prevent duplicates
        groupListContainer.innerHTML = '';
        
        try {
            const groups = await this.loadGroups();
            
            // Remove duplicates if any (shouldn't happen, but safety check)
            const uniqueGroups = [...new Set(groups)];
            
            if (uniqueGroups.length === 0) {
                groupListContainer.innerHTML = `
                    <div class="no-groups-placeholder">
                        <div class="placeholder-icon">📁</div>
                        <h3>No Groups Found</h3>
                        <p>Create your first group to organize profiles</p>
                        <button class="btn btn-primary" onclick="document.querySelector('#newGroupBtn').click()">
                            <i class="fas fa-plus"></i> Create Group
                        </button>
                    </div>
                `;
                return;
            }
            
            // Render groups list
            let groupsHTML = '<div class="groups-grid">';
            
            for (const group of uniqueGroups) {
                // Skip if group name is empty or invalid
                if (!group || typeof group !== 'string' || group.trim() === '') {
                    console.warn('⚠️ Skipping invalid group:', group);
                    continue;
                }
                
                const profileCount = await this.getProfileCountForGroup(group);
                
                // Escape group name for HTML to prevent XSS
                const escapedGroupName = group.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                
                groupsHTML += `
                    <div class="group-card" data-group-name="${escapedGroupName}">
                        <div class="group-card-header">
                            <div class="group-icon">📁</div>
                            <div class="group-info">
                                <h4 class="group-name">${escapedGroupName}</h4>
                                <p class="group-count">${profileCount} profiles</p>
                            </div>
                        </div>
                        <div class="group-actions">
                            <button class="btn btn-small btn-primary" onclick="window.profilesView.expandGroup('${escapedGroupName}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-small btn-secondary" onclick="window.profilesView.editGroup('${escapedGroupName}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-small btn-danger" onclick="window.profilesView.deleteGroup('${escapedGroupName}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }
            
            groupsHTML += '</div>';
            groupListContainer.innerHTML = groupsHTML;
            
            console.log(`✅ Rendered ${uniqueGroups.length} groups`);
        } catch (error) {
            console.error('❌ Error rendering group tab:', error);
            groupListContainer.innerHTML = `
                <div class="error-placeholder">
                    <div class="placeholder-icon">❌</div>
                    <h3>Error Loading Groups</h3>
                    <p>Failed to load groups. Please try again.</p>
                    <button class="btn btn-secondary" onclick="window.profilesView.refresh()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    async showGroupExpandedView(groupName) {
        const groupListView = this.container.querySelector('#group-list-view');
        const groupExpandedView = this.container.querySelector('#group-expanded-view');
        const taskbarContainer = this.container.querySelector('#group-taskbar-container');
        const tableContainer = this.container.querySelector('#group-table-container');
        const paginationContainer = this.container.querySelector('#group-pagination-container');
        const expandedGroupTitle = this.container.querySelector('#expanded-group-title');
        
        if (!groupListView || !groupExpandedView || !taskbarContainer || !tableContainer || !paginationContainer || !expandedGroupTitle) {
            console.error('❌ Group expanded view containers not found');
            return;
        }
        
        // Hide list view, show expanded view
        groupListView.style.display = 'none';
        groupExpandedView.style.display = 'block';
        
        // Set group title
        expandedGroupTitle.textContent = groupName;
        
        // Clear containers
        taskbarContainer.innerHTML = '';
        tableContainer.innerHTML = '';
        paginationContainer.innerHTML = '';
        
        // Create taskbar for group
        const taskbar = this.profilesStructure.createTaskbar('group', groupName);
        taskbarContainer.appendChild(taskbar);
        
        // Create table
        const table = this.profilesStructure.createProfilesTable('group');
        tableContainer.appendChild(table);
        
        // Load and display profiles for this group
        await this.loadDataForGroup(groupName, table);
        
        // Create pagination
        this.createPagination(paginationContainer);
        
        console.log(`✅ Showing expanded view for group: ${groupName}`);
    }

    async loadDataForGroup(groupName, tableContainer) {
        try {
            console.log(`🔄 Loading data for group: ${groupName}`);
            
            // Load profiles for this group
            const response = await this.safeElectronCall('db:group:get-profiles', groupName);
            
            if (!response.success) {
                console.error(`❌ Failed to load profiles for group ${groupName}:`, response.message);
                this.profilesStructure.populateTable([], tableContainer);
                return;
            }
            
            // Transform profile data to match expected format
            const allDataForGroup = response.data.map(profile => {
                // Parse proxy data if it's stored as JSON string
                let proxyInfo = 'No proxy';
                let proxyStatus = 'No proxy';
                
                if (profile.proxy) {
                    try {
                        const proxyData = JSON.parse(profile.proxy);
                        if (proxyData.type === 'your_proxy' && proxyData.host && proxyData.port) {
                            proxyInfo = `${proxyData.protocol || 'http'}://${proxyData.host}:${proxyData.port}`;
                            proxyStatus = 'Ready';
                        } else if (proxyData.type === 'pm_proxy' && proxyData.id) {
                            proxyInfo = `PM Proxy ID: ${proxyData.id}`;
                            proxyStatus = 'Ready';
                        }
                    } catch (e) {
                        // If not JSON, treat as plain text
                        proxyInfo = profile.proxy;
                        proxyStatus = 'Ready';
                    }
                }
                
                return {
                    id: profile.id.toString(),
                    name: profile.name || 'Unnamed Profile',
                    platform: profile.platform || 'Chrome',
                    tags: profile.tags || [],
                    note: profile.note || '',
                    proxy: proxyInfo,
                    proxy_status: proxyStatus,
                    updated_at: profile.updated_at || new Date().toISOString(),
                    last_started_at: profile.last_started_at || '',
                    status: profile.status || 'Ready',
                    shared_on_cloud: profile.shared_on_cloud || false
                };
            });
            
            // Update total items for pagination
            this.totalItems = allDataForGroup.length;
            this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
            
            // Get paginated data
            const paginatedData = this.getPaginatedData(allDataForGroup);
            
            // Update local profilesData for other operations
            this.profilesData = paginatedData;
            
            // Populate table with paginated data
            this.profilesStructure.populateTable(paginatedData, tableContainer);
            
            console.log(`✅ Loaded ${paginatedData.length} of ${this.totalItems} profiles for group: ${groupName} (Page ${this.currentPage}/${this.totalPages})`);
        } catch (error) {
            console.error(`❌ Error loading data for group ${groupName}:`, error);
            
            // Fallback to empty data
            this.profilesStructure.populateTable([], tableContainer);
        }
    }

    backToGroupList() {
        this.viewingGroup = null;
        this.currentPage = 1; // Reset pagination
        this.renderGroupTab();
    }

    async loadGroups() {
        try {
            const response = await this.safeElectronCall('db:group:get-all');
            if (response.success) {
                return response.data;
            } else {
                console.error('❌ Failed to load groups:', response.message);
                return [];
            }
        } catch (error) {
            console.error('❌ Error loading groups:', error);
            return [];
        }
    }

    async getProfileCountForGroup(groupName) {
        try {
            const response = await this.safeElectronCall('db:group:get-profile-count', groupName);
            if (response.success) {
                return response.data.count;
            } else {
                console.error(`❌ Failed to get profile count for group ${groupName}:`, response.message);
                return 0;
            }
        } catch (error) {
            console.error(`❌ Error getting profile count for group ${groupName}:`, error);
            return 0;
        }
    }

    // Group management methods
    showNewGroupDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>Create New Group</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Group Name</label>
                        <input type="text" id="groupNameInput" class="form-control" placeholder="Enter group name" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window.profilesView.createGroup()">Create</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Focus on input
        const input = dialog.querySelector('#groupNameInput');
        input.focus();
        
        // Handle Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createGroup();
            }
        });
    }

    async createGroup() {
        const input = document.querySelector('#groupNameInput');
        const groupName = input?.value?.trim();
        
        if (!groupName) {
            alert('Please enter a group name');
            return;
        }
        
        try {
            const response = await this.safeElectronCall('db:group:create', groupName);
            if (response.success) {
                console.log(`✅ Group '${groupName}' created successfully`);
                
                // Close dialog
                document.querySelector('.modal-overlay')?.remove();
                
                // Refresh group tab
                if (this.currentTab === 'group') {
                    await this.renderGroupTab();
                }
                await this.updateTabCounts();
                
                // Show success message
                this.showToast(`Group '${groupName}' created successfully!`, 'success');
            } else {
                console.error('❌ Failed to create group:', response.message);
                alert(`Failed to create group: ${response.message}`);
            }
        } catch (error) {
            console.error('❌ Error creating group:', error);
            alert(`Error creating group: ${error.message}`);
        }
    }

    async expandGroup(groupName) {
        console.log(`🔄 Expanding group: ${groupName}`);
        
        // Set viewing group and show expanded view
        this.viewingGroup = groupName;
        this.currentPage = 1; // Reset pagination when viewing a group
        
        // Render the expanded view
        await this.renderGroupTab();
    }

    async changeGroupPage(groupName, newPage) {
        // This method is no longer needed as pagination is handled by the main pagination system
        // But keeping it for backward compatibility if called from elsewhere
        if (this.viewingGroup === groupName) {
            this.currentPage = newPage;
            await this.renderGroupTab();
        }
    }

    async editGroup(groupName) {
        console.log(`🔄 Editing group: ${groupName}`);
        
        // Lấy thông tin group hiện tại
        const response = await this.safeElectronCall('db:group:get-stats');
        if (!response.success) {
            this.showToast('Failed to load group information', 'error');
            return;
        }
        
        const groupInfo = response.data.find(g => g.group_name === groupName);
        if (!groupInfo) {
            this.showToast('Group not found', 'error');
            return;
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>Edit Group</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Group Name</label>
                        <input type="text" id="editGroupNameInput" class="form-control" value="${groupName}" />
                    </div>
                    <div class="form-group">
                        <label>Current Profiles</label>
                        <p class="text-muted">${groupInfo.profile_count} profiles in this group</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window.profilesView.updateGroup('${groupName}')">Update</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Focus on input and select text
        const input = dialog.querySelector('#editGroupNameInput');
        input.focus();
        input.select();
        
        // Handle Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.updateGroup(groupName);
            }
        });
    }

    async updateGroup(oldGroupName) {
        const input = document.querySelector('#editGroupNameInput');
        const newGroupName = input?.value?.trim();
        
        if (!newGroupName) {
            alert('Please enter a group name');
            return;
        }
        
        if (newGroupName === oldGroupName) {
            // No change
            document.querySelector('.modal-overlay')?.remove();
            return;
        }
        
        try {
            // Get group ID first
            const statsResponse = await this.safeElectronCall('db:group:get-stats');
            if (!statsResponse.success) {
                throw new Error('Failed to get group information');
            }
            
            // For now, we'll create a new group and move profiles (since we don't have direct update by name)
            // This is a workaround - ideally we should have update by name API
            
            // 1. Get all profiles in the old group
            const profilesResponse = await this.safeElectronCall('db:group:get-profiles', oldGroupName);
            if (!profilesResponse.success) {
                throw new Error('Failed to get profiles in group');
            }
            
            const profiles = profilesResponse.data;
            
            // 2. Create new group
            const createResponse = await this.safeElectronCall('db:group:create', newGroupName);
            if (!createResponse.success) {
                throw new Error(createResponse.message);
            }
            
            // 3. Move all profiles to new group
            if (profiles.length > 0) {
                const profileIds = profiles.map(p => p.id);
                const assignResponse = await this.safeElectronCall('db:group:assign-profiles', profileIds, newGroupName);
                if (!assignResponse.success) {
                    throw new Error('Failed to move profiles to new group');
                }
            }
            
            // 4. Delete old group
            const deleteResponse = await this.safeElectronCall('db:group:delete', oldGroupName);
            if (!deleteResponse.success) {
                console.warn('Failed to delete old group:', deleteResponse.message);
            }
            
            console.log(`✅ Group '${oldGroupName}' renamed to '${newGroupName}'`);
            
            // Close dialog
            document.querySelector('.modal-overlay')?.remove();
            
            // Refresh group tab
            if (this.currentTab === 'group') {
                // If we were viewing the old group, switch to the new one
                if (this.viewingGroup === oldGroupName) {
                    this.viewingGroup = newGroupName;
                }
                await this.renderGroupTab();
            }
            await this.updateTabCounts();
            
            // Show success message
            this.showToast(`Group renamed to '${newGroupName}' successfully!`, 'success');
            
        } catch (error) {
            console.error('❌ Error updating group:', error);
            alert(`Failed to update group: ${error.message}`);
        }
    }

    async deleteGroup(groupName) {
        // Get group info first
        const statsResponse = await this.safeElectronCall('db:group:get-stats');
        if (!statsResponse.success) {
            this.showToast('Failed to load group information', 'error');
            return;
        }
        
        const groupInfo = statsResponse.data.find(g => g.group_name === groupName);
        const profileCount = groupInfo ? groupInfo.profile_count : 0;
        
        const confirmMessage = profileCount > 0 
            ? `Are you sure you want to delete the group '${groupName}'?\n\nThis will remove ${profileCount} profiles from the group, but the profiles themselves will not be deleted.`
            : `Are you sure you want to delete the group '${groupName}'?`;
            
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            console.log(`🔄 Deleting group: ${groupName}`);
            
            const response = await this.safeElectronCall('db:group:delete', groupName);
            if (response.success) {
                console.log(`✅ Group '${groupName}' deleted successfully`);
                
                // If we were viewing this group, go back to group list
                if (this.viewingGroup === groupName) {
                    this.backToGroupList();
                } else if (this.currentTab === 'group') {
                    // Refresh group tab
                    await this.renderGroupTab();
                }
                
                await this.updateTabCounts();
                
                // Show success message
                this.showToast(`Group '${groupName}' deleted successfully!`, 'success');
            } else {
                console.error('❌ Failed to delete group:', response.message);
                this.showToast(`Failed to delete group: ${response.message}`, 'error');
            }
        } catch (error) {
            console.error('❌ Error deleting group:', error);
            this.showToast(`Error deleting group: ${error.message}`, 'error');
        }
    }

    filterGroups(searchText) {
        const groupCards = this.container.querySelectorAll('.group-card');
        const searchLower = searchText.toLowerCase();
        
        groupCards.forEach(card => {
            const groupName = card.dataset.groupName.toLowerCase();
            const shouldShow = groupName.includes(searchLower);
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 6px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Profile action methods
    async startProfile(profileId) {
        console.log(`🔄 Starting profile: ${profileId}`);
        // TODO: Implement profile start logic
        this.showToast(`Starting profile ${profileId}...`, 'info');
    }

    async removeFromGroup(profileId, groupName) {
        if (!confirm(`Remove this profile from group '${groupName}'?`)) {
            return;
        }
        
        try {
            const response = await this.safeElectronCall('db:group:remove-profile', profileId, groupName);
            if (response.success) {
                this.showToast(`Profile removed from group '${groupName}'`, 'success');
                
                // Refresh the group display
                if (this.currentTab === 'group') {
                    if (this.viewingGroup === groupName) {
                        // If viewing this group, refresh the expanded view
                        await this.renderGroupTab();
                    } else {
                        // Otherwise refresh the list view
                        await this.renderGroupTab();
                    }
                }
                await this.updateTabCounts();
            } else {
                this.showToast(`Failed to remove profile: ${response.message}`, 'error');
            }
        } catch (error) {
            console.error('❌ Error removing profile from group:', error);
            this.showToast(`Error removing profile: ${error.message}`, 'error');
        }
    }

    getSelectedProfiles() {
        return this.profilesStructure ? this.profilesStructure.selectedProfiles : [];
    }

    clearSelection() {
        if (this.profilesStructure) {
            console.log('🔄 Clearing profile selection...');
            this.profilesStructure.selectedProfiles = [];
            this.profilesStructure.updateSelectionUI();
            console.log('✅ Profile selection cleared');
        }
    }

    // Method to get selection count for external use
    getSelectionCount() {
        return this.getSelectedProfiles().length;
    }

    // Method to select all profiles programmatically
    selectAll() {
        if (this.profilesStructure) {
            console.log('🔄 Selecting all profiles programmatically...');
            const selectAllCheckbox = document.querySelector('.select-all-checkbox');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.dispatchEvent(new Event('change'));
                console.log('✅ All profiles selected');
            }
        }
    }

    // Method to unselect all profiles programmatically
    unselectAll() {
        if (this.profilesStructure) {
            console.log('🔄 Unselecting all profiles programmatically...');
            const selectAllCheckbox = document.querySelector('.select-all-checkbox');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.dispatchEvent(new Event('change'));
                console.log('✅ All profiles unselected');
            }
        }
    }

    // Event handlers that can be overridden
    
    onProfileStart(profileId) {
        console.log(`Starting profile: ${profileId}`);
        // TODO: Implement profile start logic
    }

    onProfileStop(profileId) {
        console.log(`Stopping profile: ${profileId}`);
        // TODO: Implement profile stop logic
    }

    onProfileEdit(profile) {
        console.log(`Editing profile:`, profile);
        // TODO: Navigate to edit profile page
    }

    onProfileDelete(profileId) {
        console.log(`Deleting profile: ${profileId}`);
        // TODO: Implement profile deletion
    }

    onProxyCheck(profileIds) {
        console.log(`Checking proxy for profiles:`, profileIds);
        // TODO: Implement proxy checking
    }

    onProxyUpdate(profileIds, proxyData) {
        console.log(`Updating proxy for profiles:`, profileIds, proxyData);
        // TODO: Implement proxy update
    }

    // Cleanup
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.profilesStructure = null;
        this.profilesData = [];
        this.isInitialized = false;
        
        console.log('ProfilesView destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfilesView;
} else if (typeof window !== 'undefined') {
    window.ProfilesView = ProfilesView;
}