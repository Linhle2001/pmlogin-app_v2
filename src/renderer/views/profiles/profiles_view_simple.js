/**
 * ProfilesView - Simple version to avoid infinite loops
 */

class ProfilesView {
    constructor(container) {
        console.log('ProfilesView constructor called');
        this.container = container;
        this.profilesStructure = null;
        this.isInitialized = false;
        
        // Expose to window for onclick handlers
        window.profilesView = this;
        
        this.init();
    }

    async init() {
        console.log('ProfilesView init called, isInitialized:', this.isInitialized);
        
        if (this.isInitialized) {
            console.log('Already initialized, returning');
            return;
        }
        
        // Check if ProfilesStructure is available
        if (typeof ProfilesStructure === 'undefined') {
            console.error('ProfilesStructure class not found in ProfilesView init');
            throw new Error('ProfilesStructure class not found');
        }
        
        console.log('Initializing ProfilesStructure...');
        this.profilesStructure = new ProfilesStructure();
        
        console.log('Creating layout...');
        await this.createLayout();
        
        this.isInitialized = true;
        console.log('ProfilesView initialized successfully');
    }

    async createLayout() {
        console.log('Creating ProfilesView layout...');
        
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
                <div class="profiles-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="local">
                            <i class="fas fa-desktop"></i>
                            <span>Local</span>
                            <span class="tab-count" id="localCount">0</span>
                        </button>
                        <button class="tab-btn" data-tab="cloud">
                            <i class="fas fa-cloud"></i>
                            <span>Cloud</span>
                            <span class="tab-count" id="cloudCount">0</span>
                        </button>
                        <button class="tab-btn" data-tab="group">
                            <i class="fas fa-users"></i>
                            <span>Group</span>
                            <span class="tab-count" id="groupCount">0</span>
                        </button>
                        <button class="tab-btn" data-tab="team">
                            <i class="fas fa-user-friends"></i>
                            <span>Team</span>
                            <span class="tab-count" id="teamCount">0</span>
                        </button>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="profiles-main-content">
                    <!-- Taskbar will be inserted here -->
                    <div class="taskbar-container" id="taskbarContainer"></div>
                    
                    <!-- Profiles Table will be inserted here -->
                    <div class="table-container" id="tableContainer"></div>
                    
                    <!-- Pagination will be inserted here -->
                    <div class="pagination-container" id="paginationContainer"></div>
                </div>
            </div>
        `;
        
        // Create taskbar and table using ProfilesStructure
        this.createTaskbarAndTable();
        
        // Attach events
        this.attachEvents();
        
        console.log('Layout created successfully');
    }
    
    createTaskbarAndTable() {
        console.log('Creating taskbar and table...');
        
        // Create taskbar
        const taskbarContainer = this.container.querySelector('#taskbarContainer');
        if (taskbarContainer && this.profilesStructure) {
            const taskbar = this.profilesStructure.createTaskbar('local');
            taskbarContainer.appendChild(taskbar);
        }
        
        // Create table
        const tableContainer = this.container.querySelector('#tableContainer');
        if (tableContainer && this.profilesStructure) {
            const table = this.profilesStructure.createProfilesTable('local');
            tableContainer.appendChild(table);
            
            // Add sample data
            this.loadSampleData();
        }
    }
    
    loadSampleData() {
        console.log('Loading sample data...');
        
        const sampleProfiles = [
            {
                id: '1',
                name: 'Profile 1',
                platform: 'Windows',
                tags: ['work', 'test'],
                note: 'Sample profile 1',
                proxy: 'http://proxy1.com:8080',
                proxy_status: 'Ready',
                updated_at: new Date().toISOString(),
                last_started_at: new Date().toISOString(),
                status: 'Ready'
            },
            {
                id: '2',
                name: 'Profile 2',
                platform: 'macOS',
                tags: ['personal'],
                note: 'Sample profile 2',
                proxy: 'No proxy',
                proxy_status: 'No proxy',
                updated_at: new Date().toISOString(),
                last_started_at: null,
                status: 'Ready'
            },
            {
                id: '3',
                name: 'Profile 3',
                platform: 'Linux',
                tags: ['development'],
                note: 'Sample profile 3',
                proxy: 'socks5://proxy3.com:1080',
                proxy_status: 'Checking',
                updated_at: new Date().toISOString(),
                last_started_at: new Date().toISOString(),
                status: 'Live'
            }
        ];
        
        // Populate table with sample data
        const tableContainer = this.container.querySelector('.profiles-table-container');
        if (tableContainer && this.profilesStructure) {
            this.profilesStructure.populateTable(sampleProfiles, tableContainer);
        }
        
        // Update tab counts
        this.updateTabCounts(sampleProfiles.length, 0, 0, 0);
    }
    
    updateTabCounts(local, cloud, group, team) {
        const localCount = this.container.querySelector('#localCount');
        const cloudCount = this.container.querySelector('#cloudCount');
        const groupCount = this.container.querySelector('#groupCount');
        const teamCount = this.container.querySelector('#teamCount');
        
        if (localCount) localCount.textContent = local;
        if (cloudCount) cloudCount.textContent = cloud;
        if (groupCount) groupCount.textContent = group;
        if (teamCount) teamCount.textContent = team;
    }
    
    attachEvents() {
        console.log('Attaching events...');
        
        // Tab switching
        const tabButtons = this.container.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Refresh button
        const refreshBtn = this.container.querySelector('#refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Refresh clicked');
                this.loadSampleData();
            });
        }
    }
    
    switchTab(tab) {
        console.log('Switching to tab:', tab);
        
        // Update active tab
        const tabButtons = this.container.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Update content based on tab
        // For now, just log the tab switch
        this.profilesStructure?.showToast(`Switched to ${tab} tab`, 'info');
    }
    
    // Cleanup
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.profilesStructure = null;
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