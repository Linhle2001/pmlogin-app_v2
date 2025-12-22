/**
 * ProfilesStructure - Clean version with dialog styling
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
                    <input type="text" class="search-input" placeholder="Search profiles..." />
                </div>
                <div class="primary-buttons">
                    <button class="btn btn-primary" data-action="start"><i class="fas fa-play"></i> Start</button>
                    <button class="btn btn-danger" data-action="stop"><i class="fas fa-stop"></i> Stop</button>
                    <button class="btn btn-primary" data-action="assign-group"><i class="fas fa-folder-plus"></i> Assign to group</button>
                    <button class="btn btn-primary" data-action="check-proxy"><i class="fas fa-check-circle"></i> Check proxy</button>
                    <button class="btn btn-outline" data-action="new-fingerprint"><i class="fas fa-fingerprint"></i> New fingerprint</button>
                </div>
            </div>
            <div class="taskbar-row taskbar-row-2">
                <div class="secondary-buttons">
                    <button class="btn btn-primary" data-action="update-proxy"><i class="fas fa-sync-alt"></i> Update proxy</button>
                    <button class="btn btn-primary" data-action="update-profiles"><i class="fas fa-chart-line"></i> Update profiles</button>
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
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No profiles found</td></tr>';
            return;
        }

        profilesData.forEach((profile, index) => {
            const row = this.createProfileRow(profile, index);
            tbody.appendChild(row);
        });
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
                    <span class="profile-name">${profile.name || 'Unnamed Profile'}</span>
                </div>
            </td>
            <td>${profile.platform || ''}</td>
            <td>${Array.isArray(profile.tags) ? profile.tags.join(', ') : ''}</td>
            <td><input type="text" class="note-input" value="${profile.note || ''}" placeholder="Enter note" /></td>
            <td><span class="proxy-status">${profile.proxy || 'No proxy'}</span></td>
            <td><span class="status">${profile.status || 'Ready'}</span></td>
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
        
        const actionButtons = row.querySelectorAll('button[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleRowAction(action, profile);
            });
        });
    }
    
    handleTaskbarAction(action) {
        console.log(`Taskbar action: ${action}`);
        
        switch(action) {
            case 'assign-group':
                this.showAssignToGroupDialog([{name: 'Sample Profile'}]);
                break;
            default:
                this.showToast(`${action} action clicked`, 'info');
        }
    }
    
    handleRowAction(action, profile) {
        console.log(`Row action: ${action} for profile ${profile.name}`);
        
        switch(action) {
            case 'more':
                this.showCloneDialog(profile);
                break;
            default:
                this.showToast(`${action} action for ${profile.name}`, 'info');
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
    }
    
    toggleAllCheckboxes(checked) {
        const checkboxes = document.querySelectorAll('.profile-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const profileId = checkbox.dataset.profileId;
            this.handleProfileSelection(profileId, checked);
        });
    }
    
    showToast(message, type = 'info') {
        console.log(`Toast: ${message} (${type})`);
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #22c55e;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
    
    showAssignToGroupDialog(selectedProfiles) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const dialog = document.createElement('div');
        dialog.className = 'modern-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 20px;
            box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.25);
            width: 90%;
            max-width: 520px;
            max-height: 90vh;
            overflow: hidden;
        `;
        
        dialog.innerHTML = `
            <div class="dialog-header" style="padding: 28px 32px 24px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <i class="fas fa-folder-plus" style="color: #22c55e; font-size: 22px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; padding: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;"></i>
                    <h3 style="margin: 0; font-size: 22px; font-weight: 700; color: #1e293b;">Assign to group</h3>
                </div>
                <button class="dialog-close" style="background: none; border: none; width: 40px; height: 40px; border-radius: 10px; color: #64748b; cursor: pointer; font-size: 18px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="dialog-body" style="padding: 32px;">
                <div style="margin-bottom: 32px;">
                    <label style="display: block; font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 14px;">Selected profiles:</label>
                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; max-height: 160px; overflow-y: auto;">
                        ${selectedProfiles.map(profile => `
                            <div style="display: flex; align-items: center; gap: 12px; font-size: 15px; color: #475569; padding: 10px 0;">
                                <i class="fas fa-user" style="color: #22c55e; background: rgba(34, 197, 94, 0.1); border-radius: 6px; padding: 2px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;"></i>
                                <span>${profile.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="margin-bottom: 32px;">
                    <label style="display: block; font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 14px;">Select group:</label>
                    <select style="width: 100%; padding: 16px 20px; border: 2px solid #e2e8f0; border-radius: 14px; font-size: 15px; background: white;">
                        <option value="">-- Select a group --</option>
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                        <option value="test">Test</option>
                    </select>
                </div>
            </div>
            <div class="dialog-footer" style="display: flex; justify-content: flex-end; gap: 14px; padding: 24px 32px 32px; border-top: 1px solid #f1f5f9; background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);">
                <button class="dialog-cancel" style="padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; border: none; cursor: pointer; background: white; color: #64748b; border: 2px solid #e2e8f0;">
                    <i class="fas fa-times" style="margin-right: 8px;"></i>Cancel
                </button>
                <button class="dialog-assign" style="padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; border: none; cursor: pointer; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white;">
                    <i class="fas fa-check" style="margin-right: 8px;"></i>Assign
                </button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Events
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
            this.showToast('Assign to group completed!', 'success');
            closeDialog();
        });
    }
    
    showCloneDialog(profile) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const dialog = document.createElement('div');
        dialog.className = 'modern-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 20px;
            box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.25);
            width: 90%;
            max-width: 520px;
            max-height: 90vh;
            overflow: hidden;
        `;
        
        dialog.innerHTML = `
            <div class="dialog-header" style="padding: 28px 32px 24px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <i class="fas fa-clone" style="color: #22c55e; font-size: 22px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; padding: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;"></i>
                    <h3 style="margin: 0; font-size: 22px; font-weight: 700; color: #1e293b;">Clone profile</h3>
                </div>
                <button class="dialog-close" style="background: none; border: none; width: 40px; height: 40px; border-radius: 10px; color: #64748b; cursor: pointer; font-size: 18px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="dialog-body" style="padding: 32px;">
                <div style="margin-bottom: 32px;">
                    <label style="display: block; font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 14px;">Number of copies (max 20 at once)</label>
                    <div style="display: flex; align-items: center; background: white; border: 3px solid #22c55e; border-radius: 16px; overflow: hidden; max-width: 200px; margin: 0 auto; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.2);">
                        <button class="count-minus" style="width: 52px; height: 52px; border: none; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; font-size: 18px; cursor: pointer;">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="clone-count-input" value="1" min="1" max="20" style="flex: 1; border: none; background: transparent; font-size: 20px; font-weight: 700; color: #374151; text-align: center; padding: 14px; min-width: 80px;" />
                        <button class="count-plus" style="width: 52px; height: 52px; border: none; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; font-size: 18px; cursor: pointer;">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 14px; padding: 18px 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 14px;">
                    <i class="fas fa-info-circle" style="color: #d97706; font-size: 18px; background: rgba(217, 119, 6, 0.1); border-radius: 8px; padding: 6px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;"></i>
                    <p style="font-size: 15px; color: #92400e; margin: 0; font-weight: 500;">Cookies and storages won't be copied</p>
                </div>
            </div>
            <div class="dialog-footer" style="display: flex; justify-content: flex-end; gap: 14px; padding: 24px 32px 32px; border-top: 1px solid #f1f5f9; background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);">
                <button class="dialog-cancel" style="padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; border: none; cursor: pointer; background: white; color: #64748b; border: 2px solid #e2e8f0;">
                    <i class="fas fa-times" style="margin-right: 8px;"></i>Cancel
                </button>
                <button class="dialog-confirm" style="padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; border: none; cursor: pointer; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white;">
                    <i class="fas fa-clone" style="margin-right: 8px;"></i>Clone
                </button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Events
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
            this.showToast(`Cloned ${cloneCount} profiles successfully!`, 'success');
            closeDialog();
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfilesStructure;
} else if (typeof window !== 'undefined') {
    window.ProfilesStructure = ProfilesStructure;
}