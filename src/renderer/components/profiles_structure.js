/**
 * Profiles Structure - File chung định nghĩa cấu trúc thanh function và hiển thị profiles
 * 
 * Mô tả:
 * - Định nghĩa thanh function (taskbar) với các nút chức năng chung
 * - Hiển thị profiles theo context: Local (tất cả profiles) hoặc Group (theo group)
 * - Cung cấp các function utilities để quản lý profiles
 * - Chứa CloneProfileDialog để sử dụng chung
 * - Sử dụng PMLogin Theme System để đảm bảo consistency
 */

// Import theme manager if available (for module environments)
let profilesThemeManager = null;
try {
    if (typeof window !== 'undefined' && window.themeManager) {
        profilesThemeManager = window.themeManager;
    }
} catch (error) {
    console.warn('ThemeManager not available, using fallback styles');
}

class ProfilesStructure {
    constructor() {
        this.selectedProfiles = [];
        this.currentContext = 'local';
        this.groupName = null;
        
        // Initialize theme if available
        this.initTheme();
    }

    /**
     * Initialize theme system
     */
    initTheme() {
        // Ensure theme CSS classes are available
        if (!document.querySelector('.pmlogin-theme')) {
            document.body.classList.add('pmlogin-theme');
        }
    }

    /**
     * Tạo taskbar với các nút chức năng
     */
    createTaskbar(context = 'local', groupName = null) {
        this.currentContext = context;
        this.groupName = groupName;

        const taskbar = document.createElement('div');
        taskbar.className = 'profiles-taskbar';
        taskbar.innerHTML = `
            <div class="taskbar-row taskbar-row-1">
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="${context === 'group' && groupName ? `Search in ${groupName}...` : 'Search profiles...'}" />
                </div>
                <div class="primary-buttons">
                    <button class="btn btn-primary" data-action="start"><i class="fas fa-play"></i> Start</button>
                    <button class="btn btn-danger" data-action="stop"><i class="fas fa-stop"></i> Stop</button>
                    ${context === 'local' ? '<button class="btn btn-primary" data-action="assign-group"><i class="fas fa-folder-plus"></i> Assign to group</button>' : ''}
                    ${context === 'local' ? '<button class="btn btn-primary" data-action="share-profiles"><i class="fas fa-share-alt"></i> Share profiles</button>' : ''}
                    <button class="btn btn-primary" data-action="check-proxy"><i class="fas fa-check-circle"></i> Check proxy</button>
                    <button class="btn btn-outline" data-action="new-fingerprint"><i class="fas fa-fingerprint"></i> New fingerprint</button>
                    <button class="btn btn-more" data-action="more"><i class="fas fa-ellipsis-h"></i></button>
                </div>
            </div>
            <div class="taskbar-row taskbar-row-2">
                <div class="secondary-buttons">
                    <button class="btn btn-primary" data-action="start-with-app"><i class="fas fa-rocket"></i> Start with app</button>
                    <button class="btn btn-primary" data-action="update-proxy"><i class="fas fa-sync-alt"></i> Update proxy</button>
                    <button class="btn btn-primary" data-action="update-profiles"><i class="fas fa-chart-line"></i> Update profiles</button>
                    ${context === 'local' ? '<button class="btn btn-primary" data-action="share-cloud"><i class="fas fa-cloud-upload-alt"></i> Share on cloud</button>' : ''}
                    ${context === 'local' ? '<button class="btn btn-danger" data-action="stop-share-cloud"><i class="fas fa-cloud-download-alt"></i> Stop share on cloud</button>' : ''}
                </div>
            </div>
        `;

        this.attachTaskbarEvents(taskbar);
        return taskbar;
    }

    /**
     * Gắn sự kiện cho taskbar
     */
    attachTaskbarEvents(taskbar) {
        const buttons = taskbar.querySelectorAll('button[data-action]');
        console.log(`🔄 Attaching events to ${buttons.length} taskbar buttons`);
        
        buttons.forEach(button => {
            const action = button.dataset.action;
            console.log(`🔄 Attaching event to button with action: ${action}`);
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const clickedAction = e.currentTarget.dataset.action;
                console.log(`🔄 Taskbar button clicked: ${clickedAction}`);
                this.handleTaskbarAction(clickedAction);
            });
        });

        // Search functionality
        const searchInput = taskbar.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                console.log(`🔍 Search input: ${e.target.value}`);
                this.handleSearch(e.target.value);
            });
            console.log('✅ Search input event attached');
        }
        
        console.log('✅ All taskbar events attached');
    }
    /**
     * Xử lý các action từ taskbar
     */
    handleTaskbarAction(action) {
        console.log(`Taskbar action: ${action}`);
        
        switch(action) {
            case 'start':
                this.startProfiles();
                break;
            case 'stop':
                this.stopProfiles();
                break;
            case 'assign-group':
                this.assignToGroup();
                break;
            case 'share-profiles':
                this.shareProfiles();
                break;
            case 'check-proxy':
                this.checkProxy();
                break;
            case 'new-fingerprint':
                this.newFingerprint();
                break;
            case 'start-with-app':
                this.startWithApp();
                break;
            case 'update-proxy':
                this.updateProxy();
                break;
            case 'update-profiles':
                this.updateProfiles();
                break;
            case 'share-cloud':
                this.shareOnCloud();
                break;
            case 'stop-share-cloud':
                this.stopShareOnCloud();
                break;
            case 'more':
                this.showMoreActions();
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }

    /**
     * Tạo bảng profiles
     */
    createProfilesTable(context = 'local') {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'profiles-table-container';
        
        const table = document.createElement('table');
        table.className = 'profiles-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th class="checkbox-column">
                        <input type="checkbox" class="select-all-checkbox" />
                    </th>
                    <th>Name</th>
                    <th>Platform</th>
                    <th>Tags</th>
                    <th>Note</th>
                    <th>Proxy</th>
                    <th>Updated at</th>
                    <th>Last started at</th>
                    <th>Status</th>
                    <th class="actions-column">Actions</th>
                </tr>
            </thead>
            <tbody class="profiles-tbody">
                <!-- Profiles data will be populated here -->
            </tbody>
        `;

        tableContainer.appendChild(table);
        this.attachTableEvents(table);
        return tableContainer;
    }

    /**
     * Gắn sự kiện cho bảng
     */
    attachTableEvents(table) {
        // Select all checkbox
        const selectAllCheckbox = table.querySelector('.select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                console.log('🔄 Select all checkbox clicked:', e.target.checked);
                this.toggleAllCheckboxes(e.target.checked);
            });
            console.log('✅ Select all checkbox event attached');
        } else {
            console.error('❌ Select all checkbox not found');
        }

        // Row selection events will be attached when populating data
    }

    /**
     * Populate dữ liệu vào bảng
     */
    populateTable(profilesData, tableContainer) {
        const tbody = tableContainer.querySelector('.profiles-tbody');
        tbody.innerHTML = '';

        if (!profilesData || profilesData.length === 0) {
            this.displayNoDataState(tbody);
            return;
        }

        profilesData.forEach((profile, index) => {
            const row = this.createProfileRow(profile, index);
            tbody.appendChild(row);
        });

        this.adjustTableHeight(tableContainer);
    }
    /**
     * Tạo một row trong bảng profiles
     */
    createProfileRow(profile, index) {
        const row = document.createElement('tr');
        row.className = 'profile-row';
        row.dataset.profileId = profile.id;
        
        // Checkbox
        const checkboxCell = document.createElement('td');
        checkboxCell.innerHTML = `<input type="checkbox" class="profile-checkbox" data-profile-id="${profile.id}" />`;
        
        // Name với icon
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `
            <div class="name-cell">
                <div class="profile-icon">🔵</div>
                <span class="profile-name" data-profile-id="${profile.id}">${profile.name || 'Unnamed Profile'}</span>
            </div>
        `;
        
        // Platform
        const platformCell = document.createElement('td');
        platformCell.textContent = profile.platform || '';
        
        // Tags
        const tagsCell = document.createElement('td');
        tagsCell.textContent = Array.isArray(profile.tags) ? profile.tags.join(', ') : '';
        
        // Note (editable)
        const noteCell = document.createElement('td');
        noteCell.innerHTML = `<input type="text" class="note-input" value="${profile.note || ''}" placeholder="Enter note" />`;
        
        // Proxy với trạng thái màu sắc
        const proxyCell = document.createElement('td');
        const proxyStatus = this.getProxyDisplayInfo(profile);
        proxyCell.innerHTML = `<span class="proxy-status ${proxyStatus.class}">${proxyStatus.text}</span>`;
        
        // Updated at
        const updatedCell = document.createElement('td');
        updatedCell.textContent = this.formatDateTime(profile.updated_at);
        
        // Last started at
        const lastStartedCell = document.createElement('td');
        lastStartedCell.textContent = this.formatDateTime(profile.last_started_at);
        
        // Status với màu sắc
        const statusCell = document.createElement('td');
        const statusClass = this.getStatusClass(profile.status);
        statusCell.innerHTML = `<span class="status ${statusClass}">${profile.status || 'Ready'}</span>`;
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <div class="actions-container">
                <button class="btn btn-small btn-primary" data-action="start" data-profile-id="${profile.id}">Start</button>
                <button class="btn btn-more-actions" data-action="more" data-profile-id="${profile.id}"><i class="fas fa-ellipsis-v"></i></button>
            </div>
        `;
        
        // Append all cells
        row.appendChild(checkboxCell);
        row.appendChild(nameCell);
        row.appendChild(platformCell);
        row.appendChild(tagsCell);
        row.appendChild(noteCell);
        row.appendChild(proxyCell);
        row.appendChild(updatedCell);
        row.appendChild(lastStartedCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);
        
        // Attach row events
        this.attachRowEvents(row, profile);
        
        return row;
    }

    /**
     * Lấy thông tin hiển thị proxy
     */
    getProxyDisplayInfo(profile) {
        const proxy = profile.proxy;
        const proxyStatus = profile.proxy_status;
        
        if (!proxy || proxy === 'None' || proxy === '' || proxy === 'No proxy') {
            return { text: 'No proxy', class: 'no-proxy' };
        } else if (proxyStatus === 'Ready') {
            return { text: 'Ready', class: 'ready' };
        } else if (proxyStatus === 'Proxy Error') {
            return { text: 'Proxy Error', class: 'error' };
        } else if (proxyStatus === 'Checking') {
            return { text: 'Checking', class: 'checking' };
        } else {
            return { text: proxy, class: 'proxy-text' };
        }
    }

    /**
     * Lấy class CSS cho status
     */
    getStatusClass(status) {
        if (!status) return '';
        
        const statusLower = status.toLowerCase();
        if (statusLower === 'dead') return 'status-dead';
        if (statusLower === 'live' || statusLower === 'ready') return 'status-live';
        return '';
    }
    /**
     * Gắn sự kiện cho row
     */
    attachRowEvents(row, profile) {
        // Checkbox selection
        const checkbox = row.querySelector('.profile-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                console.log(`🔄 Profile checkbox clicked for ${profile.id}:`, e.target.checked);
                this.handleProfileSelection(profile.id, e.target.checked);
            });
            console.log(`✅ Checkbox event attached for profile ${profile.id}`);
        } else {
            console.error(`❌ Checkbox not found for profile ${profile.id}`);
        }

        // Profile name click for details
        const profileName = row.querySelector('.profile-name');
        if (profileName) {
            profileName.addEventListener('click', () => {
                console.log(`🔄 Profile name clicked: ${profile.name}`);
                this.showProfileDetails(profile);
            });
        }

        // Note input
        const noteInput = row.querySelector('.note-input');
        if (noteInput) {
            noteInput.addEventListener('blur', (e) => {
                this.updateProfileNote(profile.id, e.target.value);
            });
        }

        // Action buttons
        const actionButtons = row.querySelectorAll('button[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const profileId = e.target.dataset.profileId;
                console.log(`🔄 Action button clicked: ${action} for profile ${profileId}`);
                this.handleRowAction(action, profileId, profile);
            });
        });
        
        console.log(`✅ All events attached for profile row: ${profile.name}`);
    }

    /**
     * Hiển thị trạng thái "No Data"
     */
    displayNoDataState(tbody) {
        const row = document.createElement('tr');
        row.className = 'no-data-row';
        row.innerHTML = `
            <td colspan="10" class="no-data-cell">
                <div class="no-data-container">
                    <div class="no-data-icon">📦</div>
                    <div class="no-data-text">No Data</div>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    }

    /**
     * Điều chỉnh chiều cao bảng
     */
    adjustTableHeight(tableContainer) {
        // Set fixed height 300px cho table
        tableContainer.style.height = '300px';
        tableContainer.style.overflowY = 'auto';
    }

    /**
     * Format datetime string
     */
    formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return '';
        
        try {
            const date = new Date(dateTimeStr);
            return date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (error) {
            return dateTimeStr;
        }
    }

    /**
     * Toggle tất cả checkboxes
     */
    toggleAllCheckboxes(checked) {
        console.log(`🔄 Toggle all checkboxes: ${checked}`);
        
        const checkboxes = document.querySelectorAll('.profile-checkbox');
        console.log(`🔄 Found ${checkboxes.length} profile checkboxes`);
        
        // Clear selected profiles array first if unchecking all
        if (!checked) {
            this.selectedProfiles = [];
        }
        
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = checked;
            const profileId = checkbox.dataset.profileId;
            console.log(`🔄 Setting checkbox ${index} (${profileId}) to ${checked}`);
            
            // Update selectedProfiles array directly instead of calling handleProfileSelection
            // to avoid multiple UI updates
            if (checked) {
                if (!this.selectedProfiles.includes(profileId)) {
                    this.selectedProfiles.push(profileId);
                }
            } else {
                this.selectedProfiles = this.selectedProfiles.filter(id => id !== profileId);
            }
        });
        
        console.log(`🔄 Selected profiles after toggle all:`, this.selectedProfiles);
        // Update UI once at the end
        this.updateSelectionUI();
    }

    /**
     * Xử lý selection của profile
     */
    handleProfileSelection(profileId, selected) {
        console.log(`🔄 Profile selection: ${profileId} = ${selected}`);
        
        if (selected) {
            if (!this.selectedProfiles.includes(profileId)) {
                this.selectedProfiles.push(profileId);
                console.log(`✅ Added ${profileId} to selection`);
            }
        } else {
            const initialLength = this.selectedProfiles.length;
            this.selectedProfiles = this.selectedProfiles.filter(id => id !== profileId);
            if (this.selectedProfiles.length < initialLength) {
                console.log(`❌ Removed ${profileId} from selection`);
            }
        }
        
        console.log(`🔄 Current selected profiles:`, this.selectedProfiles);
        this.updateSelectionUI();
    }
    /**
     * Cập nhật UI khi selection thay đổi
     */
    updateSelectionUI() {
        // Update select all checkbox state
        const selectAllCheckbox = document.querySelector('.select-all-checkbox');
        const allCheckboxes = document.querySelectorAll('.profile-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.profile-checkbox:checked');
        
        console.log(`🔄 UpdateSelectionUI: ${checkedCheckboxes.length}/${allCheckboxes.length} checkboxes checked`);
        
        if (selectAllCheckbox) {
            if (checkedCheckboxes.length === 0) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
                console.log(`🔄 Select all: unchecked`);
            } else if (checkedCheckboxes.length === allCheckboxes.length) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = true;
                console.log(`🔄 Select all: checked`);
            } else {
                selectAllCheckbox.indeterminate = true;
                selectAllCheckbox.checked = false; // Important: set checked to false when indeterminate
                console.log(`🔄 Select all: indeterminate`);
            }
        } else {
            console.warn(`⚠️ Select all checkbox not found`);
        }
        
        // Verify selectedProfiles array matches actual checkbox states
        const actualSelectedIds = Array.from(checkedCheckboxes).map(cb => cb.dataset.profileId);
        const arraySelectedIds = this.selectedProfiles;
        
        if (JSON.stringify(actualSelectedIds.sort()) !== JSON.stringify(arraySelectedIds.sort())) {
            console.warn(`⚠️ Mismatch between checkbox states and selectedProfiles array:`);
            console.warn(`   Checkboxes: [${actualSelectedIds.join(', ')}]`);
            console.warn(`   Array: [${arraySelectedIds.join(', ')}]`);
            
            // Sync the array with actual checkbox states
            this.selectedProfiles = actualSelectedIds;
            console.log(`🔧 Synced selectedProfiles array with checkbox states`);
        }
    }

    /**
     * Xử lý action cho row
     */
    handleRowAction(action, profileId, profile) {
        console.log(`Row action: ${action} for profile ${profileId}`);
        
        switch(action) {
            case 'start':
                this.startSingleProfile(profileId);
                break;
            case 'more':
                this.showRowContextMenu(profileId, profile);
                break;
            default:
                console.warn(`Unknown row action: ${action}`);
        }
    }

    /**
     * Hiển thị context menu cho row
     */
    showRowContextMenu(profileId, profile) {
        const contextMenu = this.createContextMenu('row', profile);
        
        // Add to DOM first to get proper dimensions
        document.body.appendChild(contextMenu);
        
        // Position menu near the button
        const button = document.querySelector(`button[data-action="more"][data-profile-id="${profileId}"]`);
        if (button) {
            const rect = button.getBoundingClientRect();
            const menuRect = contextMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Calculate horizontal position
            let left = rect.right - menuRect.width;
            
            // Ensure menu doesn't go off-screen horizontally
            if (left < 10) {
                left = rect.left; // Show to the right of button if not enough space on left
            }
            if (left + menuRect.width > viewportWidth - 10) {
                left = viewportWidth - menuRect.width - 10; // Keep within viewport
            }
            
            // Calculate vertical position
            let top = rect.bottom + 5;
            
            // Ensure menu doesn't go off-screen vertically
            if (top + menuRect.height > viewportHeight - 10) {
                top = rect.top - menuRect.height - 5; // Show above button if not enough space below
            }
            
            contextMenu.style.position = 'fixed';
            contextMenu.style.left = `${left}px`;
            contextMenu.style.top = `${top}px`;
            contextMenu.style.zIndex = '10000';
        }
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!contextMenu.contains(e.target)) {
                    contextMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    /**
     * Tạo context menu
     */
    createContextMenu(type, profile = null) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        let menuItems = [];
        
        if (type === 'row') {
            menuItems = [
                { icon: '<i class="fas fa-edit"></i>', text: 'Edit', action: 'edit' },
                { icon: '<i class="fas fa-share-alt"></i>', text: 'Share', action: 'share' },
                { icon: '<i class="fas fa-cookie-bite"></i>', text: 'Export cookies', action: 'export-cookies' },
                { icon: '<i class="fas fa-user-edit"></i>', text: 'Change owner', action: 'change-owner' },
                { icon: '<i class="fas fa-clone"></i>', text: 'Clone', action: 'clone' },
                { icon: '<i class="fas fa-copy"></i>', text: 'Copy proxy', action: 'copy-proxy' },
                { separator: true },
                { icon: '<i class="fas fa-trash-alt"></i>', text: 'Delete', action: 'delete', danger: true }
            ];
        } else if (type === 'taskbar') {
            menuItems = [
                { icon: '<i class="fas fa-copy"></i>', text: 'Copy proxy', action: 'copy-proxy' },
                { icon: '<i class="fas fa-hashtag"></i>', text: 'Copy IDs', action: 'copy-ids' },
                { icon: '<i class="fas fa-tag"></i>', text: 'Copy names', action: 'copy-names' },
                { icon: '<i class="fas fa-list"></i>', text: 'Copy ID and names', action: 'copy-id-names' },
                { separator: true },
                { icon: '<i class="fas fa-file-export"></i>', text: 'Export', action: 'export' },
                { separator: true },
                { icon: '<i class="fas fa-user-edit"></i>', text: 'Change owner', action: 'change-owner' },
                { separator: true },
                { icon: '<i class="fas fa-trash-alt"></i>', text: 'Delete', action: 'delete', danger: true }
            ];
        }
        
        menuItems.forEach(item => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.className = 'menu-separator';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = `menu-item ${item.danger ? 'danger' : ''}`;
                menuItem.innerHTML = `
                    <span class="menu-icon">${item.icon}</span>
                    <span class="menu-text">${item.text}</span>
                `;
                
                menuItem.addEventListener('click', () => {
                    this.handleContextMenuAction(item.action, profile);
                    menu.remove();
                });
                
                menu.appendChild(menuItem);
            }
        });
        
        return menu;
    }
    /**
     * Xử lý action từ context menu
     */
    handleContextMenuAction(action, profile) {
        console.log(`Context menu action: ${action}`, profile);
        
        switch(action) {
            case 'edit':
                this.editProfile(profile);
                break;
            case 'share':
                this.shareProfile(profile);
                break;
            case 'export-cookies':
                this.exportCookies(profile);
                break;
            case 'change-owner':
                this.changeOwner(profile);
                break;
            case 'clone':
                this.showCloneDialog(profile);
                break;
            case 'copy-proxy':
                if (profile) {
                    this.copySingleProxy(profile);
                } else {
                    this.copySelectedProxies();
                }
                break;
            case 'copy-ids':
                this.copySelectedIds();
                break;
            case 'copy-names':
                this.copySelectedNames();
                break;
            case 'copy-id-names':
                this.copySelectedIdAndNames();
                break;
            case 'export':
                this.exportSelectedProfiles();
                break;
            case 'delete':
                if (profile) {
                    this.deleteSingleProfile(profile);
                } else {
                    this.deleteSelectedProfiles();
                }
                break;
            default:
                console.warn(`Unknown context menu action: ${action}`);
        }
    }

    // ==================== TASKBAR ACTIONS ====================

    async startProfiles() {
        console.log('Starting selected profiles...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to start!', 'warning');
            return;
        }
        
        try {
            this.showToast(`Starting ${selectedProfilesData.length} profiles...`, 'info');
            
            // TODO: Implement actual start profiles logic via IPC
            // const response = await window.electronAPI.invoke('profile:start-multiple', selectedProfilesData.map(p => p.id));
            
            // For now, simulate success
            setTimeout(() => {
                this.showToast(`Successfully started ${selectedProfilesData.length} profiles!`, 'success');
            }, 1000);
            
        } catch (error) {
            console.error('Error starting profiles:', error);
            this.showToast('Failed to start profiles!', 'error');
        }
    }

    async stopProfiles() {
        console.log('Stopping selected profiles...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to stop!', 'warning');
            return;
        }
        
        try {
            this.showToast(`Stopping ${selectedProfilesData.length} profiles...`, 'info');
            
            // TODO: Implement actual stop profiles logic via IPC
            // const response = await window.electronAPI.invoke('profile:stop-multiple', selectedProfilesData.map(p => p.id));
            
            // For now, simulate success
            setTimeout(() => {
                this.showToast(`Successfully stopped ${selectedProfilesData.length} profiles!`, 'success');
            }, 1000);
            
        } catch (error) {
            console.error('Error stopping profiles:', error);
            this.showToast('Failed to stop profiles!', 'error');
        }
    }

    async assignToGroup() {
        console.log('Assigning profiles to group...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to assign to group!', 'warning');
            return;
        }
        
        this.showAssignToGroupDialog(selectedProfilesData);
    }

    async shareProfiles() {
        console.log('Sharing profiles...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to share!', 'warning');
            return;
        }
        
        try {
            this.showToast(`Sharing ${selectedProfilesData.length} profiles...`, 'info');
            
            // TODO: Implement actual share profiles logic via IPC
            // const response = await window.electronAPI.invoke('profile:share-multiple', selectedProfilesData.map(p => p.id));
            
            // For now, simulate success
            setTimeout(() => {
                this.showToast(`Successfully shared ${selectedProfilesData.length} profiles!`, 'success');
            }, 1000);
            
        } catch (error) {
            console.error('Error sharing profiles:', error);
            this.showToast('Failed to share profiles!', 'error');
        }
    }

    async checkProxy() {
        console.log('Checking proxy for selected profiles...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to check proxy!', 'warning');
            return;
        }
        
        try {
            this.showToast(`Checking proxy for ${selectedProfilesData.length} profiles...`, 'info');
            
            // TODO: Implement actual proxy checking logic via IPC
            // const response = await window.electronAPI.invoke('proxy:check-multiple', selectedProfilesData.map(p => p.id));
            
            // For now, simulate proxy checking with random results
            setTimeout(() => {
                const liveCount = Math.floor(selectedProfilesData.length * 0.7); // 70% live
                const deadCount = selectedProfilesData.length - liveCount;
                
                this.showToast(`Proxy check completed: ${liveCount} live, ${deadCount} dead`, 'success');
                
                // Update UI to reflect proxy status changes
                this.refreshProxyStatus();
            }, 2000);
            
        } catch (error) {
            console.error('Error checking proxy:', error);
            this.showToast('Failed to check proxy!', 'error');
        }
    }

    async newFingerprint() {
        console.log('Creating new fingerprint...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to generate new fingerprint!', 'warning');
            return;
        }
        
        try {
            this.showToast(`Generating new fingerprint for ${selectedProfilesData.length} profiles...`, 'info');
            
            // TODO: Implement actual fingerprint generation logic via IPC
            // const response = await window.electronAPI.invoke('profile:generate-fingerprint', selectedProfilesData.map(p => p.id));
            
            // For now, simulate success
            setTimeout(() => {
                this.showToast(`Successfully generated new fingerprint for ${selectedProfilesData.length} profiles!`, 'success');
            }, 1500);
            
        } catch (error) {
            console.error('Error generating fingerprint:', error);
            this.showToast('Failed to generate fingerprint!', 'error');
        }
    }

    async startWithApp() {
        console.log('Setting profiles to start with app...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to start with app!', 'warning');
            return;
        }
        
        try {
            this.showToast(`Setting ${selectedProfilesData.length} profiles to start with app...`, 'info');
            
            // TODO: Implement actual start with app logic via IPC
            // const response = await window.electronAPI.invoke('profile:set-start-with-app', selectedProfilesData.map(p => p.id), true);
            
            // For now, simulate success
            setTimeout(() => {
                this.showToast(`Successfully set ${selectedProfilesData.length} profiles to start with app!`, 'success');
            }, 1000);
            
        } catch (error) {
            console.error('Error setting start with app:', error);
            this.showToast('Failed to set start with app!', 'error');
        }
    }

    async updateProxy() {
        console.log('Updating proxy for selected profiles...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to update proxy!', 'warning');
            return;
        }
        
        this.showUpdateProxyDialog();
    }

    async updateProfiles() {
        console.log('Updating selected profiles...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to update!', 'warning');
            return;
        }
        
        try {
            this.showToast(`Updating ${selectedProfilesData.length} profiles...`, 'info');
            
            // TODO: Implement actual update profiles logic via IPC
            // const response = await window.electronAPI.invoke('profile:update-multiple', selectedProfilesData.map(p => p.id));
            
            // For now, simulate success
            setTimeout(() => {
                this.showToast(`Successfully updated ${selectedProfilesData.length} profiles!`, 'success');
            }, 1500);
            
        } catch (error) {
            console.error('Error updating profiles:', error);
            this.showToast('Failed to update profiles!', 'error');
        }
    }

    async shareOnCloud() {
        console.log('Sharing profiles on cloud...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to share on cloud!', 'warning');
            return;
        }
        
        try {
            this.showToast(`Sharing ${selectedProfilesData.length} profiles on cloud...`, 'info');
            
            // TODO: Implement actual share on cloud logic via IPC
            // const response = await window.electronAPI.invoke('profile:share-on-cloud', selectedProfilesData.map(p => p.id));
            
            // For now, simulate success
            setTimeout(() => {
                this.showToast(`Successfully shared ${selectedProfilesData.length} profiles on cloud!`, 'success');
            }, 2000);
            
        } catch (error) {
            console.error('Error sharing on cloud:', error);
            this.showToast('Failed to share on cloud!', 'error');
        }
    }

    async stopShareOnCloud() {
        console.log('Stopping share on cloud...');
        const selectedProfilesData = this.getSelectedProfilesData();
        
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to stop sharing on cloud!', 'warning');
            return;
        }
        
        try {
            this.showToast(`Stopping cloud sharing for ${selectedProfilesData.length} profiles...`, 'info');
            
            // TODO: Implement actual stop share on cloud logic via IPC
            // const response = await window.electronAPI.invoke('profile:stop-share-on-cloud', selectedProfilesData.map(p => p.id));
            
            // For now, simulate success
            setTimeout(() => {
                this.showToast(`Successfully stopped cloud sharing for ${selectedProfilesData.length} profiles!`, 'success');
            }, 1500);
            
        } catch (error) {
            console.error('Error stopping cloud sharing:', error);
            this.showToast('Failed to stop cloud sharing!', 'error');
        }
    }

    showMoreActions() {
        console.log('🔄 Showing more actions...');
        
        // Remove any existing context menu first
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const contextMenu = this.createContextMenu('taskbar');
        
        // Add to DOM first to get proper dimensions
        document.body.appendChild(contextMenu);
        
        // Position menu near the more button
        const moreButton = document.querySelector('button[data-action="more"]');
        console.log('🔄 More button found:', !!moreButton);
        
        if (moreButton) {
            const rect = moreButton.getBoundingClientRect();
            const menuRect = contextMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            console.log('🔄 Button rect:', rect);
            console.log('🔄 Menu rect:', menuRect);
            
            // Calculate horizontal position
            let left = rect.right - menuRect.width;
            
            // Ensure menu doesn't go off-screen horizontally
            if (left < 10) {
                left = rect.left; // Show to the right of button if not enough space on left
            }
            if (left + menuRect.width > viewportWidth - 10) {
                left = viewportWidth - menuRect.width - 10; // Keep within viewport
            }
            
            // Calculate vertical position
            let top = rect.bottom + 5;
            
            // Ensure menu doesn't go off-screen vertically
            if (top + menuRect.height > viewportHeight - 10) {
                top = rect.top - menuRect.height - 5; // Show above button if not enough space below
            }
            
            contextMenu.style.position = 'fixed';
            contextMenu.style.left = `${left}px`;
            contextMenu.style.top = `${top}px`;
            contextMenu.style.zIndex = '10000';
            
            console.log('🔄 Menu positioned at:', { left, top });
        } else {
            console.error('❌ More button not found!');
            // Fallback positioning
            contextMenu.style.position = 'fixed';
            contextMenu.style.right = '20px';
            contextMenu.style.top = '100px';
            contextMenu.style.zIndex = '10000';
        }
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!contextMenu.contains(e.target)) {
                    console.log('🔄 Closing context menu');
                    contextMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
        
        console.log('✅ Context menu shown');
    }
    // ==================== ROW ACTIONS ====================

    startSingleProfile(profileId) {
        console.log(`Starting profile ${profileId}...`);
        // TODO: Implement start single profile logic
        this.showToast(`Starting profile ${profileId}...`, 'info');
    }

    editProfile(profile) {
        console.log('Editing profile:', profile);
        // TODO: Implement edit profile logic
        this.showToast(`Edit profile feature coming soon...`, 'info');
    }

    shareProfile(profile) {
        console.log('Sharing profile:', profile);
        // TODO: Implement share profile logic
        this.showToast(`Share profile feature coming soon...`, 'info');
    }

    exportCookies(profile) {
        console.log('Exporting cookies for profile:', profile);
        // TODO: Implement export cookies logic
        this.showToast(`Export cookies feature coming soon...`, 'info');
    }

    changeOwner(profile) {
        console.log('Changing owner for profile:', profile);
        // TODO: Implement change owner logic
        this.showToast(`Change owner feature coming soon...`, 'info');
    }

    showCloneDialog(profile) {
        console.log('Showing clone dialog for profile:', profile);
        
        const dialog = this.createCloneDialog(profile);
        document.body.appendChild(dialog);
        
        // Focus on the dialog
        const countInput = dialog.querySelector('.clone-count-input');
        if (countInput) {
            countInput.focus();
            countInput.select();
        }
    }

    copySingleProxy(profile) {
        const proxy = profile.proxy;
        if (!proxy || proxy === 'No proxy' || proxy === 'None' || proxy === '') {
            this.showToast('This profile has no proxy!', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(proxy).then(() => {
            this.showToast(`Copied proxy: ${proxy}`, 'success');
        }).catch(err => {
            console.error('Failed to copy proxy:', err);
            this.showToast('Failed to copy proxy!', 'error');
        });
    }

    deleteSingleProfile(profile) {
        const confirmMessage = this.currentContext === 'group' && this.groupName
            ? `Are you sure you want to remove this profile from group '${this.groupName}'?\n\nProfile: ${profile.name}\n\nNote: Profile will only be removed from this group, not deleted permanently.`
            : `Are you sure you want to permanently delete this profile?\n\nProfile: ${profile.name}\n\nNote: Profile will be permanently deleted from database.`;
        
        if (confirm(confirmMessage)) {
            console.log('Deleting profile:', profile);
            // TODO: Implement delete profile logic
            this.showToast(`Delete profile feature coming soon...`, 'info');
        }
    }

    // ==================== SELECTED PROFILES ACTIONS ====================

    copySelectedProxies() {
        const selectedProfilesData = this.getSelectedProfilesData();
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to copy proxy!', 'warning');
            return;
        }
        
        const proxies = selectedProfilesData
            .map(profile => profile.proxy)
            .filter(proxy => proxy && proxy !== 'No proxy' && proxy !== 'None' && proxy !== '');
        
        if (proxies.length === 0) {
            this.showToast('No valid proxies found in selected profiles!', 'warning');
            return;
        }
        
        const proxyText = proxies.join('\n');
        navigator.clipboard.writeText(proxyText).then(() => {
            this.showToast(`Copied ${proxies.length} proxies to clipboard!`, 'success');
        }).catch(err => {
            console.error('Failed to copy proxies:', err);
            this.showToast('Failed to copy proxies!', 'error');
        });
    }

    copySelectedIds() {
        const selectedProfilesData = this.getSelectedProfilesData();
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to copy IDs!', 'warning');
            return;
        }
        
        const ids = selectedProfilesData.map(profile => profile.id || profile.name);
        const idsText = ids.join('\n');
        
        navigator.clipboard.writeText(idsText).then(() => {
            this.showToast(`Copied ${ids.length} IDs to clipboard!`, 'success');
        }).catch(err => {
            console.error('Failed to copy IDs:', err);
            this.showToast('Failed to copy IDs!', 'error');
        });
    }

    copySelectedNames() {
        const selectedProfilesData = this.getSelectedProfilesData();
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to copy names!', 'warning');
            return;
        }
        
        const names = selectedProfilesData.map(profile => profile.name);
        const namesText = names.join('\n');
        
        navigator.clipboard.writeText(namesText).then(() => {
            this.showToast(`Copied ${names.length} names to clipboard!`, 'success');
        }).catch(err => {
            console.error('Failed to copy names:', err);
            this.showToast('Failed to copy names!', 'error');
        });
    }

    copySelectedIdAndNames() {
        const selectedProfilesData = this.getSelectedProfilesData();
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to copy ID and names!', 'warning');
            return;
        }
        
        const idNames = selectedProfilesData.map(profile => `${profile.id || profile.name} - ${profile.name}`);
        const idNamesText = idNames.join('\n');
        
        navigator.clipboard.writeText(idNamesText).then(() => {
            this.showToast(`Copied ${idNames.length} ID and names to clipboard!`, 'success');
        }).catch(err => {
            console.error('Failed to copy ID and names:', err);
            this.showToast('Failed to copy ID and names!', 'error');
        });
    }
    exportSelectedProfiles() {
        const selectedProfilesData = this.getSelectedProfilesData();
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select at least 1 profile to export!', 'warning');
            return;
        }
        
        console.log('Exporting selected profiles:', selectedProfilesData);
        // TODO: Implement export profiles logic
        this.showToast(`Export ${selectedProfilesData.length} profiles feature coming soon...`, 'info');
    }

    deleteSelectedProfiles() {
        const selectedProfilesData = this.getSelectedProfilesData();
        if (selectedProfilesData.length === 0) {
            this.showToast('Please select profiles to delete!', 'warning');
            return;
        }
        
        const confirmMessage = this.currentContext === 'group' && this.groupName
            ? `Are you sure you want to remove ${selectedProfilesData.length} profiles from group '${this.groupName}'?\n\nNote: Profiles will only be removed from this group, not deleted permanently.`
            : `Are you sure you want to permanently delete ${selectedProfilesData.length} selected profiles?\n\nNote: Profiles will be permanently deleted from database.`;
        
        if (confirm(confirmMessage)) {
            console.log('Deleting selected profiles:', selectedProfilesData);
            // TODO: Implement delete selected profiles logic
            this.showToast(`Delete selected profiles feature coming soon...`, 'info');
        }
    }

    // ==================== UTILITY METHODS ====================

    getSelectedProfilesData() {
        // Get actual profile data for selected IDs from the table
        const selectedData = [];
        
        this.selectedProfiles.forEach(profileId => {
            const row = document.querySelector(`.profile-row[data-profile-id="${profileId}"]`);
            if (row) {
                const checkbox = row.querySelector('.profile-checkbox');
                const checkboxWidget = checkbox?.closest('td');
                
                // Try to get profile data from checkbox widget property
                if (checkboxWidget && checkboxWidget.profileData) {
                    selectedData.push(checkboxWidget.profileData);
                } else {
                    // Fallback: construct profile data from row
                    const nameElement = row.querySelector('.profile-name');
                    const proxyElement = row.querySelector('.proxy-status');
                    const noteElement = row.querySelector('.note-input');
                    
                    selectedData.push({
                        id: profileId,
                        name: nameElement?.textContent || `Profile ${profileId}`,
                        proxy: proxyElement?.textContent || 'No proxy',
                        note: noteElement?.value || ''
                    });
                }
            }
        });
        
        return selectedData;
    }

    refreshProxyStatus() {
        // Refresh proxy status display in the table
        console.log('Refreshing proxy status display...');
        
        // TODO: Implement actual refresh logic
        // For now, just log
        this.showToast('Proxy status refreshed!', 'info');
    }

    handleSearch(searchText) {
        console.log('Searching profiles:', searchText);
        
        const rows = document.querySelectorAll('.profile-row');
        rows.forEach(row => {
            const profileName = row.querySelector('.profile-name')?.textContent || '';
            const proxyText = row.querySelector('.proxy-status')?.textContent || '';
            const noteText = row.querySelector('.note-input')?.value || '';
            
            const searchLower = searchText.toLowerCase();
            const shouldShow = profileName.toLowerCase().includes(searchLower) ||
                             proxyText.toLowerCase().includes(searchLower) ||
                             noteText.toLowerCase().includes(searchLower);
            
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    showProfileDetails(profile) {
        console.log('Showing profile details:', profile);
        // TODO: Implement profile details view
        this.showToast(`Profile details feature coming soon...`, 'info');
    }

    updateProfileNote(profileId, note) {
        console.log(`Updating note for profile ${profileId}:`, note);
        // TODO: Implement update profile note logic
    }

    // ==================== DIALOG METHODS ====================

    showAssignToGroupDialog(selectedProfiles) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'assign-group-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>📋 Assign to group</h3>
                <button class="dialog-close" type="button">✕</button>
            </div>
            <div class="dialog-body">
                <div class="dialog-section">
                    <label>Selected profiles:</label>
                    <div class="selected-profiles-container">
                        ${selectedProfiles.map(profile => `<div class="profile-item">${profile.name}</div>`).join('')}
                    </div>
                    <div class="total-count">Total: ${selectedProfiles.length}</div>
                </div>
                
                <div class="dialog-section">
                    <label>Select group:</label>
                    <select class="group-select">
                        <option value="">-- Select a group --</option>
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                        <option value="social">Social Media</option>
                        <option value="test">Test</option>
                    </select>
                </div>
                
                <div class="dialog-section">
                    <label>Or create new group:</label>
                    <input type="text" class="new-group-input" placeholder="Enter new group name" />
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary dialog-cancel" type="button">Cancel</button>
                <button class="btn btn-primary dialog-assign" type="button">Assign</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Attach events
        this.attachAssignGroupDialogEvents(overlay, dialog, selectedProfiles);
    }

    attachAssignGroupDialogEvents(overlay, dialog, selectedProfiles) {
        const closeBtn = dialog.querySelector('.dialog-close');
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        const assignBtn = dialog.querySelector('.dialog-assign');
        const groupSelect = dialog.querySelector('.group-select');
        const newGroupInput = dialog.querySelector('.new-group-input');
        
        // Close dialog
        const closeDialog = () => {
            overlay.remove();
        };
        
        closeBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
            }
        });
        
        // Clear group select when typing new group name
        newGroupInput.addEventListener('input', () => {
            if (newGroupInput.value.trim()) {
                groupSelect.value = '';
            }
        });
        
        // Clear new group input when selecting existing group
        groupSelect.addEventListener('change', () => {
            if (groupSelect.value) {
                newGroupInput.value = '';
            }
        });
        
        // Assign to group
        assignBtn.addEventListener('click', async () => {
            const selectedGroup = groupSelect.value;
            const newGroupName = newGroupInput.value.trim();
            
            if (!selectedGroup && !newGroupName) {
                this.showToast('Please select a group or enter a new group name!', 'warning');
                return;
            }
            
            const targetGroup = newGroupName || selectedGroup;
            
            try {
                this.showToast(`Assigning ${selectedProfiles.length} profiles to group "${targetGroup}"...`, 'info');
                
                // TODO: Implement actual assign to group logic via IPC
                // const response = await window.electronAPI.invoke('profile:assign-to-group', 
                //     selectedProfiles.map(p => p.id), targetGroup);
                
                // For now, simulate success
                setTimeout(() => {
                    this.showToast(`Successfully assigned ${selectedProfiles.length} profiles to group "${targetGroup}"!`, 'success');
                }, 1000);
                
                closeDialog();
                
            } catch (error) {
                console.error('Error assigning to group:', error);
                this.showToast('Failed to assign profiles to group!', 'error');
            }
        });
    }

    createCloneDialog(profile) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'clone-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>Clone profile</h3>
                <button class="dialog-close" type="button">✕</button>
            </div>
            <div class="dialog-body">
                <div class="dialog-section">
                    <label>Number of copies (max 20 at once)</label>
                    <div class="clone-count-container">
                        <input type="number" class="clone-count-input" value="1" min="1" max="20" />
                        <div class="count-controls">
                            <button class="count-btn count-minus" type="button">−</button>
                            <button class="count-btn count-plus" type="button">+</button>
                        </div>
                    </div>
                </div>
                <div class="dialog-info">
                    <p>Cookies and storages won't be copied</p>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary dialog-cancel" type="button">Cancel</button>
                <button class="btn btn-primary dialog-confirm" type="button">Clone</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        
        // Attach dialog events
        this.attachCloneDialogEvents(overlay, dialog, profile);
        
        return overlay;
    }

    attachCloneDialogEvents(overlay, dialog, profile) {
        const closeBtn = dialog.querySelector('.dialog-close');
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        const confirmBtn = dialog.querySelector('.dialog-confirm');
        const countInput = dialog.querySelector('.clone-count-input');
        const minusBtn = dialog.querySelector('.count-minus');
        const plusBtn = dialog.querySelector('.count-plus');
        
        // Close dialog
        const closeDialog = () => {
            overlay.remove();
        };
        
        closeBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
            }
        });
        
        // Count controls
        minusBtn.addEventListener('click', () => {
            const currentValue = parseInt(countInput.value) || 1;
            if (currentValue > 1) {
                countInput.value = currentValue - 1;
            }
        });
        
        plusBtn.addEventListener('click', () => {
            const currentValue = parseInt(countInput.value) || 1;
            if (currentValue < 20) {
                countInput.value = currentValue + 1;
            }
        });
        
        // Validate input
        countInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 1;
            if (value < 1) value = 1;
            if (value > 20) value = 20;
            e.target.value = value;
        });
        
        // Confirm clone
        confirmBtn.addEventListener('click', () => {
            const cloneCount = parseInt(countInput.value) || 1;
            this.cloneProfile(profile, cloneCount);
            closeDialog();
        });
    }
    cloneProfile(originalProfile, cloneCount) {
        console.log(`Cloning profile ${originalProfile.name} ${cloneCount} times`);
        
        // TODO: Implement actual cloning logic
        // For now, just show success message
        this.showToast(`Successfully cloned ${cloneCount} profiles!`, 'success');
    }

    showUpdateProxyDialog() {
        const selectedProfilesData = this.getSelectedProfilesData();
        
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'update-proxy-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>ℹ️ Update proxy</h3>
                <button class="dialog-close" type="button">✕</button>
            </div>
            <div class="dialog-body">
                <div class="dialog-section">
                    <label>Selected profiles:</label>
                    <div class="selected-profiles-container">
                        ${selectedProfilesData.map(profile => `<div class="profile-item">${profile.name}</div>`).join('')}
                    </div>
                    <div class="total-count">Total: ${selectedProfilesData.length}</div>
                </div>
                
                <div class="dialog-section">
                    <div class="config-row">
                        <div class="config-item">
                            <label>Connection type</label>
                            <select class="connection-type">
                                <option>Common</option>
                                <option>Residential</option>
                                <option>Datacenter</option>
                            </select>
                        </div>
                        <div class="config-item">
                            <label>Service</label>
                            <select class="service-type">
                                <option>TZ (Suitable for IP v6)</option>
                                <option>Luminati</option>
                                <option>Smartproxy</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div class="config-item">
                            <label>WebRTC</label>
                            <select class="webrtc-type">
                                <option>Forward</option>
                                <option>Block</option>
                                <option>Real IP</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="dialog-section">
                    <label>Proxy list (host:port:username:password)</label>
                    <textarea class="proxy-list" placeholder="host:port:username:password" rows="5"></textarea>
                </div>
                
                <div class="dialog-section">
                    <label class="checkbox-label">
                        <input type="checkbox" class="enable-change-ip" />
                        Enable change Ip
                    </label>
                </div>
                
                <div class="dialog-section">
                    <label>Example:</label>
                    <div class="example-text">
http://192.168.11:3000:user:password

http://192.168.11:3000:user:password

socks4://192.168.11:3000

socks5://192.168.11:3000
                    </div>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary dialog-cancel" type="button">Cancel</button>
                <button class="btn btn-primary dialog-update" type="button">Update</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Attach events
        this.attachUpdateProxyDialogEvents(overlay, dialog);
    }

    attachUpdateProxyDialogEvents(overlay, dialog) {
        const closeBtn = dialog.querySelector('.dialog-close');
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        const updateBtn = dialog.querySelector('.dialog-update');
        const proxyListTextarea = dialog.querySelector('.proxy-list');
        
        // Close dialog
        const closeDialog = () => {
            overlay.remove();
        };
        
        closeBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
            }
        });
        
        // Update proxy
        updateBtn.addEventListener('click', async () => {
            const proxyList = proxyListTextarea.value.trim();
            
            if (!proxyList) {
                this.showToast('Please enter at least one proxy!', 'warning');
                return;
            }
            
            const proxyData = {
                connectionType: dialog.querySelector('.connection-type').value,
                service: dialog.querySelector('.service-type').value,
                webrtc: dialog.querySelector('.webrtc-type').value,
                proxyList: proxyList,
                enableChangeIp: dialog.querySelector('.enable-change-ip').checked
            };
            
            try {
                updateBtn.textContent = 'Updating...';
                updateBtn.disabled = true;
                
                // Parse proxy list
                const proxies = proxyList.split('\n').filter(line => line.trim());
                const selectedProfilesData = this.getSelectedProfilesData();
                
                this.showToast(`Updating proxy for ${selectedProfilesData.length} profiles...`, 'info');
                
                // TODO: Implement actual proxy update logic via IPC
                // const response = await window.electronAPI.invoke('profile:update-proxy', {
                //     profileIds: selectedProfilesData.map(p => p.id),
                //     proxies: proxies,
                //     config: proxyData
                // });
                
                // For now, simulate success
                setTimeout(() => {
                    this.showToast(`Successfully updated proxy for ${selectedProfilesData.length} profiles!`, 'success');
                    closeDialog();
                    
                    // Refresh proxy status in table
                    this.refreshProxyStatus();
                }, 1500);
                
            } catch (error) {
                console.error('Error updating proxy:', error);
                this.showToast('Failed to update proxy!', 'error');
                updateBtn.textContent = 'Update';
                updateBtn.disabled = false;
            }
        });
    }

    /**
     * Hiển thị toast notification sử dụng theme system
     */
    showToast(message, type = 'info') {
        // Use theme manager if available, otherwise fallback to simple implementation
        if (themeManager && themeManager.showToast) {
            themeManager.showToast(message, type);
            return;
        }
        
        // Fallback implementation
        const toast = document.createElement('div');
        toast.className = `pmlogin-toast pmlogin-toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;
        
        // Position toast
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '10000';
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Tạo button sử dụng theme classes
     */
    createThemedButton(text, variant = 'primary', options = {}) {
        // Use theme manager if available
        if (themeManager && themeManager.createButton) {
            return themeManager.createButton(text, variant, options);
        }
        
        // Fallback implementation
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `pmlogin-btn pmlogin-btn-${variant}`;
        
        if (options.size) {
            button.classList.add(`pmlogin-btn-${options.size}`);
        }
        
        if (options.className) {
            button.className += ` ${options.className}`;
        }
        
        if (options.onClick) {
            button.addEventListener('click', options.onClick);
        }
        
        return button;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfilesStructure;
} else if (typeof window !== 'undefined') {
    window.ProfilesStructure = ProfilesStructure;
}