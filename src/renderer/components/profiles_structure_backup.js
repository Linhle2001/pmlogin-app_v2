/**
 * ProfilesStructure - Enhanced version with dialog styling
 */

class ProfilesStructure {
    constructor() {
        console.log('ProfilesStructure initialized');
        this.selectedProfiles = [];
        this.currentContext = 'local';
        this.groupName = null;
    }
    
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
    
    createProfileRow(profile, index) {
        const row = document.createElement('tr');
        row.className = 'profile-row';
        row.dataset.profileId = profile.id;
        
        row.innerHTML = `
            <td><input type="checkbox" class="profile-checkbox" data-profile-id="${profile.id}" /></td>
            <td>
                <div class="name-cell">
                    <div class="profile-icon">🔵</div>
                    <span class="profile-name" data-profile-id="${profile.id}">${profile.name || 'Unnamed Profile'}</span>
                </div>
            </td>
            <td>${profile.platform || ''}</td>
            <td>${Array.isArray(profile.tags) ? profile.tags.join(', ') : ''}</td>
            <td><input type="text" class="note-input" value="${profile.note || ''}" placeholder="Enter note" /></td>
            <td><span class="proxy-status ${this.getProxyStatusClass(profile)}">${this.getProxyDisplayText(profile)}</span></td>
            <td>${this.formatDateTime(profile.updated_at)}</td>
            <td>${this.formatDateTime(profile.last_started_at)}</td>
            <td><span class="status ${this.getStatusClass(profile.status)}">${profile.status || 'Ready'}</span></td>
            <td>
                <div class="actions-container">
                    <button class="btn btn-small btn-primary" data-action="start" data-profile-id="${profile.id}">Start</button>
                    <button class="btn btn-more-actions" data-action="more" data-profile-id="${profile.id}"><i class="fas fa-ellipsis-v"></i></button>
                </div>
            </td>
        `;
        
        this.attachRowEvents(row, profile);
        return row;
    }
    
    attachTaskbarEvents(taskbar) {
        const buttons = taskbar.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleTaskbarAction(action);
            });
        });
    }
    
    attachTableEvents(table) {
        const selectAllCheckbox = table.querySelector('.select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleAllCheckboxes(e.target.checked);
            });
        }
    }
    
    attachRowEvents(row, profile) {
        const checkbox = row.querySelector('.profile-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                this.handleProfileSelection(profile.id, e.target.checked);
            });
        }
        
        // Action buttons
        const actionButtons = row.querySelectorAll('button[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const profileId = e.target.dataset.profileId;
                this.handleRowAction(action, profileId, profile);
            });
        });
    }
    
    handleRowAction(action, profileId, profile) {
        console.log(`Row action: ${action} for profile ${profileId}`);
        
        switch(action) {
            case 'start':
                this.showToast(`Starting profile ${profile.name}...`, 'info');
                break;
            case 'more':
                this.showRowContextMenu(profileId, profile);
                break;
            default:
                this.showToast(`${action} action for ${profile.name}`, 'info');
        }
    }
    
    showRowContextMenu(profileId, profile) {
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.innerHTML = `
            <div class="menu-item" data-action="edit">
                <span class="menu-icon"><i class="fas fa-edit"></i></span>
                <span class="menu-text">Edit</span>
            </div>
            <div class="menu-item" data-action="clone">
                <span class="menu-icon"><i class="fas fa-clone"></i></span>
                <span class="menu-text">Clone</span>
            </div>
            <div class="menu-item" data-action="share">
                <span class="menu-icon"><i class="fas fa-share-alt"></i></span>
                <span class="menu-text">Share</span>
            </div>
            <div class="menu-separator"></div>
            <div class="menu-item danger" data-action="delete">
                <span class="menu-icon"><i class="fas fa-trash-alt"></i></span>
                <span class="menu-text">Delete</span>
            </div>
        `;
        
        // Position menu
        const button = document.querySelector(`button[data-action="more"][data-profile-id="${profileId}"]`);
        if (button) {
            const rect = button.getBoundingClientRect();
            contextMenu.style.position = 'fixed';
            contextMenu.style.left = `${rect.left}px`;
            contextMenu.style.top = `${rect.bottom + 5}px`;
            contextMenu.style.zIndex = '10000';
        }
        
        document.body.appendChild(contextMenu);
        
        // Attach menu events
        const menuItems = contextMenu.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleContextMenuAction(action, profile);
                contextMenu.remove();
            });
        });
        
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
    
    handleContextMenuAction(action, profile) {
        console.log(`Context menu action: ${action}`, profile);
        
        switch(action) {
            case 'clone':
                this.showCloneDialog(profile);
                break;
            case 'edit':
                this.showToast(`Edit ${profile.name} functionality coming soon!`, 'info');
                break;
            case 'share':
                this.showToast(`Share ${profile.name} functionality coming soon!`, 'info');
                break;
            case 'delete':
                if (confirm(`Are you sure you want to delete ${profile.name}?`)) {
                    this.showToast(`Delete ${profile.name} functionality coming soon!`, 'info');
                }
                break;
            default:
                this.showToast(`${action} action for ${profile.name}`, 'info');
        }
    }
    
    handleTaskbarAction(action) {
        console.log(`Taskbar action: ${action}`);
        
        switch(action) {
            case 'assign-group':
                // Get selected profiles (mock data for demo)
                const selectedProfiles = [
                    { name: 'Profile 1' },
                    { name: 'Profile 2' }
                ];
                this.showAssignToGroupDialog(selectedProfiles);
                break;
            case 'start':
                this.showToast('Start profiles functionality coming soon!', 'info');
                break;
            case 'stop':
                this.showToast('Stop profiles functionality coming soon!', 'info');
                break;
            case 'check-proxy':
                this.showToast('Check proxy functionality coming soon!', 'info');
                break;
            default:
                this.showToast(`${action} action clicked`, 'info');
        }
    }
    
    handleProfileSelection(profileId, selected) {
        if (selected) {
            if (!this.selectedProfiles.includes(profileId)) {
                this.selectedProfiles.push(profileId);
            }
        } else {
            this.selectedProfiles = this.selectedProfiles.filter(id => id !== profileId);
        }
        console.log('Selected profiles:', this.selectedProfiles);
    }
    
    toggleAllCheckboxes(checked) {
        const checkboxes = document.querySelectorAll('.profile-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const profileId = checkbox.dataset.profileId;
            this.handleProfileSelection(profileId, checked);
        });
    }
    
    getProxyStatusClass(profile) {
        const proxyStatus = profile.proxy_status;
        if (!profile.proxy || profile.proxy === 'No proxy') return 'no-proxy';
        if (proxyStatus === 'Ready') return 'ready';
        if (proxyStatus === 'Proxy Error') return 'error';
        if (proxyStatus === 'Checking') return 'checking';
        return 'proxy-text';
    }
    
    getProxyDisplayText(profile) {
        if (!profile.proxy || profile.proxy === 'No proxy') return 'No proxy';
        if (profile.proxy_status === 'Ready') return 'Ready';
        if (profile.proxy_status === 'Proxy Error') return 'Proxy Error';
        if (profile.proxy_status === 'Checking') return 'Checking';
        return profile.proxy;
    }
    
    getStatusClass(status) {
        if (!status) return '';
        const statusLower = status.toLowerCase();
        if (statusLower === 'dead') return 'status-dead';
        if (statusLower === 'live' || statusLower === 'ready') return 'status-live';
        return '';
    }
    
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
    
    adjustTableHeight(tableContainer) {
        tableContainer.style.height = '300px';
        tableContainer.style.overflowY = 'auto';
    }
    
    showToast(message, type = 'info') {
        console.log(`Toast: ${message} (${type})`);
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Position toast
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '10001';
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
    
    getToastIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            case 'info': 
            default: return 'info-circle';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfilesStructure;
} else if (typeof window !== 'undefined') {
    window.ProfilesStructure = ProfilesStructure;
}
    
    // ==================== DIALOG METHODS ====================
    
    showAssignToGroupDialog(selectedProfiles) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'assign-group-dialog modern-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <div class="dialog-title">
                    <i class="fas fa-folder-plus dialog-icon"></i>
                    <h3>Assign to group</h3>
                </div>
                <button class="dialog-close" type="button">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="dialog-body">
                <div class="dialog-section">
                    <label class="section-label">Selected profiles:</label>
                    <div class="selected-profiles-container modern-container">
                        ${selectedProfiles.map(profile => `
                            <div class="profile-item">
                                <i class="fas fa-user profile-item-icon"></i>
                                <span>${profile.name}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="total-count">Total: ${selectedProfiles.length} profile${selectedProfiles.length > 1 ? 's' : ''}</div>
                </div>
                
                <div class="dialog-section">
                    <label class="section-label">Select group:</label>
                    <div class="select-wrapper">
                        <select class="group-select modern-select">
                            <option value="">-- Select a group --</option>
                            <option value="work">Work</option>
                            <option value="personal">Personal</option>
                            <option value="social">Social Media</option>
                            <option value="test">Test</option>
                            <option value="marketing">Marketing</option>
                            <option value="development">Development</option>
                        </select>
                        <i class="fas fa-chevron-down select-arrow"></i>
                    </div>
                </div>
                
                <div class="dialog-section">
                    <label class="section-label">Or create new group:</label>
                    <div class="input-wrapper">
                        <input type="text" class="new-group-input modern-input" placeholder="Enter new group name" />
                        <i class="fas fa-plus input-icon"></i>
                    </div>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary modern-btn dialog-cancel" type="button">
                    <i class="fas fa-times btn-icon"></i>
                    Cancel
                </button>
                <button class="btn btn-primary modern-btn dialog-assign" type="button">
                    <i class="fas fa-check btn-icon"></i>
                    Assign
                </button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Add entrance animation
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            dialog.classList.add('show');
        });
        
        // Attach events
        this.attachAssignGroupDialogEvents(overlay, dialog, selectedProfiles);
    }
    
    attachAssignGroupDialogEvents(overlay, dialog, selectedProfiles) {
        const closeBtn = dialog.querySelector('.dialog-close');
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        const assignBtn = dialog.querySelector('.dialog-assign');
        
        const closeDialog = () => overlay.remove();
        
        closeBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeDialog();
        });
        
        assignBtn.addEventListener('click', () => {
            this.showToast('Assign to group functionality coming soon!', 'info');
            closeDialog();
        });
    }
    
    showCloneDialog(profile) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'clone-dialog modern-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <div class="dialog-title">
                    <i class="fas fa-clone dialog-icon"></i>
                    <h3>Clone profile</h3>
                </div>
                <button class="dialog-close" type="button">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="dialog-body">
                <div class="dialog-section">
                    <label class="section-label">Number of copies (max 20 at once)</label>
                    <div class="clone-count-container modern-count-container">
                        <button class="count-btn count-minus modern-count-btn" type="button">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="clone-count-input modern-count-input" value="1" min="1" max="20" />
                        <button class="count-btn count-plus modern-count-btn" type="button">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="dialog-info modern-info">
                    <i class="fas fa-info-circle info-icon"></i>
                    <p>Cookies and storages won't be copied</p>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary modern-btn dialog-cancel" type="button">
                    <i class="fas fa-times btn-icon"></i>
                    Cancel
                </button>
                <button class="btn btn-primary modern-btn dialog-confirm" type="button">
                    <i class="fas fa-clone btn-icon"></i>
                    Clone
                </button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Add entrance animation
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            dialog.classList.add('show');
        });
        
        // Attach events
        this.attachCloneDialogEvents(overlay, dialog, profile);
    }
    
    attachCloneDialogEvents(overlay, dialog, profile) {
        const closeBtn = dialog.querySelector('.dialog-close');
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        const confirmBtn = dialog.querySelector('.dialog-confirm');
        const countInput = dialog.querySelector('.clone-count-input');
        const minusBtn = dialog.querySelector('.count-minus');
        const plusBtn = dialog.querySelector('.count-plus');
        
        const closeDialog = () => overlay.remove();
        
        closeBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeDialog();
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
        
        confirmBtn.addEventListener('click', () => {
            const cloneCount = parseInt(countInput.value) || 1;
            this.showToast(`Clone ${cloneCount} profiles functionality coming soon!`, 'info');
            closeDialog();
        });
    }
}