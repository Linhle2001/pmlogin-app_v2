// Profiles View - Chuyển đổi từ PyQt6 profiles.py
import * as theme from '../../components/constants.js';
import { showSuccess, showWarning, showError } from '../../components/message-dialog.js';
import { ToastNotification } from '../../components/notification.js';

export class ProfilesView {
    constructor(container) {
        this.container = container;
        this.currentTab = "Cloud";
        this.selectedProfileData = null;
        this.isDetailVisible = false;
        this.searchText = "";
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.totalProfiles = 0;
        this.profilesData = [];
        
        // References đến các widget cần cập nhật
        this.profileNameLabel = null;
        this.proxyHostLabel = null;
        this.proxyPortLabel = null;
        this.usernameLabel = null;
        this.passwordLabel = null;
        
        this.init();
    }
    
    init() {
        this.createProfilesView();
        this.bindEvents();
        this.refreshProfiles();
    }
    
    createProfilesView() {
        this.container.innerHTML = '';
        this.container.className = 'profiles-view h-full flex flex-col';
        this.container.style.cssText = `
            background-color: ${theme.COLOR_BG_WHITE};
            padding: 20px;
        `;
        
        // Tabs ở trên cùng
        this.createTabs();
        
        // Content stack để chứa các view khác nhau
        this.createContentStack();
        
        // Tạo Cloud view (view mặc định)
        this.createCloudView();
    }
    
    createTabs() {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container flex space-x-1 mb-4';
        
        const tabs = [
            { id: 'Cloud', text: '☁️ Cloud', active: true },
            { id: 'Local', text: '💻 Local' },
            { id: 'Group', text: '📁 Group' },
            { id: 'Team', text: '👥 Team' }
        ];
        
        this.tabButtons = {};
        
        tabs.forEach(tab => {
            const tabBtn = document.createElement('button');
            tabBtn.className = 'tab-button px-5 py-2 rounded-md transition-all duration-200';
            tabBtn.textContent = tab.text;
            tabBtn.dataset.tabId = tab.id;
            
            this.updateTabStyle(tabBtn, tab.active);
            
            tabBtn.addEventListener('click', () => {
                this.switchTab(tab.id);
            });
            
            this.tabButtons[tab.id] = tabBtn;
            tabsContainer.appendChild(tabBtn);
        });
        
        this.container.appendChild(tabsContainer);
    }
    
    updateTabStyle(button, isActive) {
        if (isActive) {
            button.style.cssText = `
                background-color: ${theme.COLOR_PRIMARY_LIGHT};
                color: ${theme.COLOR_PRIMARY_DARK};
                font-weight: 600;
                font-size: 14px;
            `;
        } else {
            button.style.cssText = `
                background-color: transparent;
                color: ${theme.COLOR_TEXT_SUBTLE};
                font-weight: 500;
                font-size: 14px;
            `;
            
            button.addEventListener('mouseenter', () => {
                if (!button.classList.contains('active')) {
                    button.style.backgroundColor = theme.COLOR_HOVER_BG;
                    button.style.color = theme.COLOR_TEXT_DARK;
                }
            });
            
            button.addEventListener('mouseleave', () => {
                if (!button.classList.contains('active')) {
                    button.style.backgroundColor = 'transparent';
                    button.style.color = theme.COLOR_TEXT_SUBTLE;
                }
            });
        }
    }
    
    switchTab(tabId) {
        console.log(`[INFO] [Profiles] Switching to tab: ${tabId}`);
        this.currentTab = tabId;
        
        // Cập nhật style cho tất cả tabs
        Object.keys(this.tabButtons).forEach(id => {
            const button = this.tabButtons[id];
            button.classList.remove('active');
            this.updateTabStyle(button, id === tabId);
            if (id === tabId) {
                button.classList.add('active');
            }
        });
        
        // Chuyển view tương ứng
        setTimeout(() => {
            if (tabId === 'Cloud') {
                this.contentStack.style.display = 'block';
                this.refreshProfiles();
            } else if (tabId === 'Local') {
                this.contentStack.style.display = 'block';
                this.refreshProfiles(); // Load từ local database
            } else if (tabId === 'Group') {
                // TODO: Implement Group view
                console.log('[WARNING] [Profiles] Group view not implemented yet');
            } else if (tabId === 'Team') {
                // TODO: Implement Team view
                console.log('[WARNING] [Profiles] Team view not implemented yet');
            }
        }, 20);
    }
    
    createContentStack() {
        this.contentStack = document.createElement('div');
        this.contentStack.className = 'content-stack flex-1 flex';
        this.container.appendChild(this.contentStack);
    }
    
    createCloudView() {
        // Main horizontal layout để chứa table và detail panel
        this.mainHorizontalLayout = document.createElement('div');
        this.mainHorizontalLayout.className = 'main-layout flex flex-1 space-x-5';
        
        // Left panel chứa taskbar, table và footer
        this.createLeftPanel();
        
        // Right panel cho profile details (ban đầu ẩn)
        this.createDetailPanel();
        
        this.contentStack.appendChild(this.mainHorizontalLayout);
    }
    
    createLeftPanel() {
        this.leftPanel = document.createElement('div');
        this.leftPanel.className = 'left-panel flex-1 flex flex-col space-y-4';
        
        // Taskbar
        this.createTaskbar();
        
        // Table
        this.createTable();
        
        // Footer
        this.createFooter();
        
        this.mainHorizontalLayout.appendChild(this.leftPanel);
    }
    
    createTaskbar() {
        this.taskbar = document.createElement('div');
        this.taskbar.className = 'taskbar flex items-center justify-between p-4 rounded-lg';
        this.taskbar.style.cssText = `
            background-color: ${theme.COLOR_BG_WHITE};
            border: 1px solid ${theme.COLOR_BG_SIDEBAR};
        `;
        
        // Left side - Action buttons
        const leftActions = document.createElement('div');
        leftActions.className = 'flex items-center space-x-2';
        
        const actionButtons = [
            { id: 'start', text: '▶️ Start', color: theme.COLOR_PRIMARY_GREEN },
            { id: 'stop', text: '⏹️ Stop', color: '#ff6b6b' },
            { id: 'assign-group', text: '[FOLDER] Assign to Group', color: theme.COLOR_TEXT_SUBTLE },
            { id: 'share', text: '[LINK] Share', color: theme.COLOR_TEXT_SUBTLE }
        ];
        
        actionButtons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'action-btn px-3 py-1.5 rounded text-sm font-medium transition-colors';
            button.textContent = btn.text;
            button.dataset.action = btn.id;
            button.style.cssText = `
                background-color: transparent;
                color: ${btn.color};
                border: 1px solid ${btn.color};
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = btn.color;
                button.style.color = 'white';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = 'transparent';
                button.style.color = btn.color;
            });
            
            leftActions.appendChild(button);
        });
        
        // Right side - Search
        const rightActions = document.createElement('div');
        rightActions.className = 'flex items-center space-x-2';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search profiles...';
        searchInput.className = 'search-input px-3 py-2 border rounded-md';
        searchInput.style.cssText = `
            border-color: ${theme.COLOR_BG_SIDEBAR};
            width: 200px;
        `;
        
        searchInput.addEventListener('input', (e) => {
            this.onSearchChanged(e.target.value);
        });
        
        rightActions.appendChild(searchInput);
        
        this.taskbar.appendChild(leftActions);
        this.taskbar.appendChild(rightActions);
        this.leftPanel.appendChild(this.taskbar);
    }
    
    createTable() {
        this.tableContainer = document.createElement('div');
        this.tableContainer.className = 'table-container flex-1 overflow-auto rounded-lg';
        this.tableContainer.style.cssText = `
            border: 1px solid ${theme.COLOR_BG_SIDEBAR};
        `;
        
        this.table = document.createElement('table');
        this.table.className = 'profiles-table w-full';
        this.table.style.cssText = `
            background-color: ${theme.COLOR_BG_WHITE};
        `;
        
        // Table header
        this.createTableHeader();
        
        // Table body
        this.tableBody = document.createElement('tbody');
        this.table.appendChild(this.tableBody);
        
        this.tableContainer.appendChild(this.table);
        this.leftPanel.appendChild(this.tableContainer);
    }
    
    createTableHeader() {
        const thead = document.createElement('thead');
        thead.style.cssText = `
            background-color: ${theme.COLOR_BG_SIDEBAR};
        `;
        
        const headerRow = document.createElement('tr');
        
        const columns = [
            { text: '', width: '40px' }, // Checkbox
            { text: 'Name', width: 'auto' },
            { text: 'Tags', width: '100px' },
            { text: 'Group', width: '100px' },
            { text: 'Note', width: '150px' },
            { text: 'Proxy', width: '200px' },
            { text: 'Created', width: '120px' },
            { text: 'Last Run', width: '120px' },
            { text: 'Status', width: '80px' },
            { text: 'Actions', width: '80px' }
        ];
        
        columns.forEach(col => {
            const th = document.createElement('th');
            th.className = 'px-4 py-3 text-left text-sm font-medium';
            th.textContent = col.text;
            th.style.cssText = `
                color: ${theme.COLOR_TEXT_DARK};
                width: ${col.width};
            `;
            
            if (col.text === '') {
                // Checkbox header
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'header-checkbox';
                checkbox.addEventListener('change', (e) => {
                    this.selectAllProfiles(e.target.checked);
                });
                th.appendChild(checkbox);
            }
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        this.table.appendChild(thead);
    }
    
    createFooter() {
        this.footer = document.createElement('div');
        this.footer.className = 'footer flex items-center justify-between p-4 rounded-lg';
        this.footer.style.cssText = `
            background-color: ${theme.COLOR_BG_WHITE};
            border: 1px solid ${theme.COLOR_BG_SIDEBAR};
        `;
        
        // Left side - Items info
        this.itemsInfo = document.createElement('div');
        this.itemsInfo.className = 'text-sm';
        this.itemsInfo.style.color = theme.COLOR_TEXT_SUBTLE;
        this.itemsInfo.textContent = 'Showing 0 of 0 profiles';
        
        // Right side - Pagination
        this.paginationContainer = document.createElement('div');
        this.paginationContainer.className = 'flex items-center space-x-2';
        
        this.footer.appendChild(this.itemsInfo);
        this.footer.appendChild(this.paginationContainer);
        this.leftPanel.appendChild(this.footer);
    }
    
    createDetailPanel() {
        this.detailPanel = document.createElement('div');
        this.detailPanel.className = 'detail-panel hidden flex flex-col';
        this.detailPanel.style.cssText = `
            width: 350px;
            background-color: ${theme.COLOR_BG_WHITE};
            border: 1px solid ${theme.COLOR_BG_SIDEBAR};
            border-radius: 8px;
            box-shadow: -2px 0 20px rgba(0, 0, 0, 0.05);
        `;
        
        // Header
        const header = document.createElement('div');
        header.className = 'detail-header flex items-center justify-between p-4 border-b';
        header.style.borderColor = theme.COLOR_BG_SIDEBAR;
        
        const title = document.createElement('h3');
        title.className = 'text-lg font-semibold';
        title.textContent = 'Details';
        title.style.color = theme.COLOR_TEXT_DARK;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100';
        closeBtn.innerHTML = '✕';
        closeBtn.addEventListener('click', () => {
            this.hideProfileDetail();
        });
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Content
        this.detailContent = document.createElement('div');
        this.detailContent.className = 'detail-content flex-1 p-4 overflow-auto';
        
        this.detailPanel.appendChild(header);
        this.detailPanel.appendChild(this.detailContent);
        this.mainHorizontalLayout.appendChild(this.detailPanel);
    }
    
    bindEvents() {
        // Taskbar action buttons
        this.taskbar.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                this.handleTaskbarAction(action);
            }
        });
        
        // Table row clicks
        this.tableContainer.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row && row.dataset.profileId) {
                const profileData = this.getProfileDataFromRow(row);
                if (profileData) {
                    this.showProfileDetail(profileData);
                }
            }
        });
    }
    
    handleTaskbarAction(action) {
        const selectedProfiles = this.getSelectedProfiles();
        
        switch (action) {
            case 'start':
                this.startSelectedProfiles(selectedProfiles);
                break;
            case 'stop':
                this.stopSelectedProfiles(selectedProfiles);
                break;
            case 'assign-group':
                this.showAssignToGroupDialog(selectedProfiles);
                break;
            case 'share':
                this.shareSelectedProfiles(selectedProfiles);
                break;
        }
    }
    
    loadProfiles(profiles) {
        this.profilesData = profiles;
        this.tableBody.innerHTML = '';
        
        profiles.forEach((profile, index) => {
            const row = this.createTableRow(profile, index);
            this.tableBody.appendChild(row);
        });
        
        this.updateFooter();
    }
    
    createTableRow(profile, index) {
        const row = document.createElement('tr');
        row.className = 'table-row hover:bg-gray-50 transition-colors';
        row.dataset.profileId = profile.id || index;
        row.style.borderBottom = `1px solid ${theme.COLOR_BG_SIDEBAR}`;
        
        // Checkbox
        const checkboxCell = document.createElement('td');
        checkboxCell.className = 'px-4 py-3';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'profile-checkbox';
        checkbox.dataset.profileData = JSON.stringify(profile);
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);
        
        // Name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-4 py-3';
        nameCell.innerHTML = `
            <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span class="text-sm font-medium text-blue-600">${profile.name ? profile.name[0].toUpperCase() : 'P'}</span>
                </div>
                <span class="font-medium" style="color: ${theme.COLOR_TEXT_DARK};">${profile.name || 'Unnamed Profile'}</span>
            </div>
        `;
        row.appendChild(nameCell);
        
        // Tags
        const tagsCell = document.createElement('td');
        tagsCell.className = 'px-4 py-3';
        tagsCell.innerHTML = `<span class="text-sm" style="color: ${theme.COLOR_TEXT_SUBTLE};">${profile.tags || '-'}</span>`;
        row.appendChild(tagsCell);
        
        // Group
        const groupCell = document.createElement('td');
        groupCell.className = 'px-4 py-3';
        groupCell.innerHTML = `<span class="text-sm" style="color: ${theme.COLOR_TEXT_SUBTLE};">${profile.group || '-'}</span>`;
        row.appendChild(groupCell);
        
        // Note
        const noteCell = document.createElement('td');
        noteCell.className = 'px-4 py-3';
        const noteInput = document.createElement('input');
        noteInput.type = 'text';
        noteInput.value = profile.note || '';
        noteInput.className = 'w-full px-2 py-1 text-sm border rounded';
        noteInput.style.cssText = `
            border-color: ${theme.COLOR_BG_SIDEBAR};
            background-color: transparent;
        `;
        noteCell.appendChild(noteInput);
        row.appendChild(noteCell);
        
        // Proxy
        const proxyCell = document.createElement('td');
        proxyCell.className = 'px-4 py-3';
        const proxyText = this.formatProxyText(profile.proxy);
        proxyCell.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-sm">${proxyText.icon}</span>
                <span class="text-sm" style="color: ${theme.COLOR_TEXT_DARK};">${proxyText.text}</span>
            </div>
        `;
        row.appendChild(proxyCell);
        
        // Created
        const createdCell = document.createElement('td');
        createdCell.className = 'px-4 py-3';
        createdCell.innerHTML = `<span class="text-sm" style="color: ${theme.COLOR_TEXT_SUBTLE};">${this.formatDateTime(profile.created_at)}</span>`;
        row.appendChild(createdCell);
        
        // Last Run
        const lastRunCell = document.createElement('td');
        lastRunCell.className = 'px-4 py-3';
        lastRunCell.innerHTML = `<span class="text-sm" style="color: ${theme.COLOR_TEXT_SUBTLE};">${this.formatDateTime(profile.last_run)}</span>`;
        row.appendChild(lastRunCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = 'px-4 py-3';
        const statusBadge = this.createStatusBadge(profile.status || 'Ready');
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'px-4 py-3';
        const actionsBtn = document.createElement('button');
        actionsBtn.className = 'actions-btn w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100';
        actionsBtn.innerHTML = '⋯';
        actionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showProfileActionsMenu(actionsBtn, profile);
        });
        actionsCell.appendChild(actionsBtn);
        row.appendChild(actionsCell);
        
        return row;
    }
    
    formatProxyText(proxy) {
        if (!proxy || proxy === 'No proxy') {
            return { icon: '🚫', text: 'No proxy' };
        }
        
        // Parse proxy string (format: protocol://host:port:user:pass)
        try {
            let host = '', port = '';
            if (proxy.includes('://')) {
                const parts = proxy.split('://')[1].split(':');
                host = parts[0] || '';
                port = parts[1] || '';
            } else {
                const parts = proxy.split(':');
                host = parts[0] || '';
                port = parts[1] || '';
            }
            
            return {
                icon: '🌐',
                text: host && port ? `${host}:${port}` : proxy
            };
        } catch (e) {
            return { icon: '🌐', text: proxy };
        }
    }
    
    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    }
    
    createStatusBadge(status) {
        const badge = document.createElement('span');
        badge.className = 'status-badge px-2 py-1 rounded-full text-xs font-medium';
        
        let bgColor, textColor;
        switch (status.toLowerCase()) {
            case 'running':
                bgColor = '#dcfce7';
                textColor = '#166534';
                break;
            case 'stopped':
                bgColor = '#fee2e2';
                textColor = '#991b1b';
                break;
            default:
                bgColor = '#f3f4f6';
                textColor = '#374151';
        }
        
        badge.style.cssText = `
            background-color: ${bgColor};
            color: ${textColor};
        `;
        badge.textContent = status;
        
        return badge;
    }
    
    showProfileDetail(profileData) {
        this.selectedProfileData = profileData;
        this.isDetailVisible = true;
        
        this.populateProfileDetail(profileData);
        this.detailPanel.classList.remove('hidden');
        
        // Điều chỉnh kích thước left panel
        this.leftPanel.style.marginRight = '20px';
    }
    
    hideProfileDetail() {
        this.isDetailVisible = false;
        this.selectedProfileData = null;
        
        this.detailPanel.classList.add('hidden');
        this.leftPanel.style.marginRight = '0';
    }
    
    populateProfileDetail(profileData) {
        this.detailContent.innerHTML = '';
        
        const sections = [
            {
                title: 'Profile Details',
                items: [
                    { label: 'Profile name', value: profileData.name || '' },
                    { label: 'Browser', value: 'Chrome' },
                    { label: 'Browser version', value: '131' },
                    { label: 'OS', value: 'Windows' }
                ]
            },
            {
                title: 'Proxy Settings',
                items: [
                    { label: 'Proxy', value: 'Your Proxy' },
                    { label: 'Type', value: 'HTTP Proxy' },
                    { label: 'Proxy Host', value: profileData.proxy_host || '' },
                    { label: 'Proxy Port', value: profileData.proxy_port || '' },
                    { label: 'Username', value: profileData.username || '' },
                    { label: 'Password', value: profileData.password || '' }
                ]
            }
        ];
        
        sections.forEach(section => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'detail-section mb-6';
            
            const title = document.createElement('h4');
            title.className = 'text-sm font-semibold mb-3';
            title.style.color = theme.COLOR_TEXT_DARK;
            title.textContent = section.title;
            sectionEl.appendChild(title);
            
            section.items.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'detail-item flex justify-between items-center py-2';
                
                const label = document.createElement('span');
                label.className = 'text-sm';
                label.style.color = theme.COLOR_TEXT_SUBTLE;
                label.textContent = item.label;
                
                const value = document.createElement('span');
                value.className = 'text-sm font-medium';
                value.style.color = theme.COLOR_TEXT_DARK;
                value.textContent = item.value || '-';
                
                itemEl.appendChild(label);
                itemEl.appendChild(value);
                sectionEl.appendChild(itemEl);
            });
            
            this.detailContent.appendChild(sectionEl);
        });
    }
    
    getSelectedProfiles() {
        const checkboxes = this.tableContainer.querySelectorAll('.profile-checkbox:checked');
        return Array.from(checkboxes).map(checkbox => {
            try {
                return JSON.parse(checkbox.dataset.profileData);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);
    }
    
    selectAllProfiles(checked) {
        const checkboxes = this.tableContainer.querySelectorAll('.profile-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    }
    
    getProfileDataFromRow(row) {
        const checkbox = row.querySelector('.profile-checkbox');
        if (checkbox && checkbox.dataset.profileData) {
            try {
                return JSON.parse(checkbox.dataset.profileData);
            } catch (e) {
                console.error('Error parsing profile data:', e);
                return null;
            }
        }
        return null;
    }
    
    onSearchChanged(searchText) {
        this.searchText = searchText.toLowerCase().trim();
        this.currentPage = 1;
        this.loadFilteredData();
    }
    
    loadFilteredData() {
        // TODO: Implement filtering logic
        console.log('Loading filtered data with search:', this.searchText);
        this.refreshProfiles();
    }
    
    refreshProfiles() {
        console.log('[INFO] [Profiles] Refreshing profiles from database...');
        
        // Check if we're in demo mode
        const isDemoMode = this.checkDemoMode();
        
        if (isDemoMode) {
            this.loadDemoProfiles();
        } else {
            this.loadRealProfiles();
        }
    }
    
    checkDemoMode() {
        // Check if current user is demo user
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            return userData.email === 'demo@pmlogin.com' || userData.isDemo === true;
        } catch (e) {
            return false;
        }
    }
    
    async loadDemoProfiles() {
        try {
            console.log('[DEMO] Loading demo profiles...');
            
            // Load demo profiles from JSON file
            const response = await fetch('../../../storage/demo_profiles.json');
            const demoProfiles = await response.json();
            
            console.log(`[DATA] Loaded ${demoProfiles.length} demo profiles`);
            
            this.loadProfiles(demoProfiles);
            this.totalProfiles = demoProfiles.length;
            this.updateFooter();
            
            // Show demo indicator in taskbar
            this.showDemoIndicator();
            
        } catch (error) {
            console.error('[ERROR] Error loading demo profiles:', error);
            // Fallback to mock data
            this.loadMockProfiles();
        }
    }
    
    loadRealProfiles() {
        // TODO: Load profiles from real database/API
        console.log('[DATA] Loading real profiles from database...');
        this.loadMockProfiles();
    }
    
    loadMockProfiles() {
        // Fallback mock data
        const mockProfiles = [
            {
                id: 1,
                name: 'Profile 1',
                proxy: 'http://proxy1.com:8080:user:pass',
                proxy_host: 'proxy1.com',
                proxy_port: '8080',
                username: 'user',
                password: 'pass',
                note: 'Test profile',
                status: 'Ready',
                created_at: new Date().toISOString(),
                last_run: null
            },
            {
                id: 2,
                name: 'Profile 2',
                proxy: 'No proxy',
                proxy_host: '',
                proxy_port: '',
                username: '',
                password: '',
                note: '',
                status: 'Running',
                created_at: new Date().toISOString(),
                last_run: new Date().toISOString()
            }
        ];
        
        this.loadProfiles(mockProfiles);
        this.totalProfiles = mockProfiles.length;
        this.updateFooter();
    }
    
    showDemoIndicator() {
        // Add demo indicator to taskbar if not already present
        if (!document.querySelector('.demo-indicator')) {
            const demoIndicator = document.createElement('div');
            demoIndicator.className = 'demo-indicator bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium';
            demoIndicator.innerHTML = '🎭 Demo Mode';
            
            // Insert at the beginning of taskbar
            const taskbar = this.taskbar;
            if (taskbar && taskbar.firstChild) {
                taskbar.insertBefore(demoIndicator, taskbar.firstChild);
            }
        }
    }
    
    updateFooter() {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(start + this.itemsPerPage - 1, this.totalProfiles);
        
        this.itemsInfo.textContent = `Showing ${start}-${end} of ${this.totalProfiles} profiles`;
        
        // Update pagination
        this.updatePagination();
    }
    
    updatePagination() {
        this.paginationContainer.innerHTML = '';
        
        const totalPages = Math.ceil(this.totalProfiles / this.itemsPerPage);
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'px-3 py-1 rounded border';
        prevBtn.textContent = '‹';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadFilteredData();
            }
        });
        this.paginationContainer.appendChild(prevBtn);
        
        // Page numbers
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'px-3 py-1 rounded border';
            pageBtn.textContent = i;
            
            if (i === this.currentPage) {
                pageBtn.style.cssText = `
                    background-color: ${theme.COLOR_PRIMARY_GREEN};
                    color: white;
                    border-color: ${theme.COLOR_PRIMARY_GREEN};
                `;
            }
            
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.loadFilteredData();
            });
            
            this.paginationContainer.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'px-3 py-1 rounded border';
        nextBtn.textContent = '›';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.loadFilteredData();
            }
        });
        this.paginationContainer.appendChild(nextBtn);
    }
    
    // Action handlers
    startSelectedProfiles(profiles) {
        if (!profiles.length) {
            this.showToast('Vui lòng chọn profiles để start!', 'warning');
            return;
        }
        
        console.log(`[START] Starting ${profiles.length} selected profiles...`);
        this.showToast(`Đã start ${profiles.length} profiles!`);
    }
    
    stopSelectedProfiles(profiles) {
        if (!profiles.length) {
            this.showToast('Vui lòng chọn profiles để stop!', 'warning');
            return;
        }
        
        console.log(`⏹️ Stopping ${profiles.length} selected profiles...`);
        this.showToast(`Đã stop ${profiles.length} profiles!`);
    }
    
    showAssignToGroupDialog(profiles) {
        if (!profiles.length) {
            this.showToast('Vui lòng chọn profiles để assign!', 'warning');
            return;
        }
        
        console.log(`[FOLDER] Assigning ${profiles.length} profiles to group...`);
        // TODO: Implement assign to group dialog
        this.showToast('Tính năng assign to group đang được phát triển!');
    }
    
    shareSelectedProfiles(profiles) {
        if (!profiles.length) {
            this.showToast('Vui lòng chọn profiles để share!', 'warning');
            return;
        }
        
        console.log(`[LINK] Sharing ${profiles.length} selected profiles...`);
        this.showToast(`Đã share ${profiles.length} profiles!`);
    }
    
    showProfileActionsMenu(button, profile) {
        // TODO: Implement profile actions menu
        console.log('Showing actions menu for profile:', profile.name);
    }
    
    showToast(message, type = 'success') {
        const toast = new ToastNotification(document.body, message, 2000, type);
        toast.show();
    }
}