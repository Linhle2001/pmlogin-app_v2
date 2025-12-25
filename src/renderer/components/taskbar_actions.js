/**
 * Taskbar Actions - File chứa các chức năng xử lý taskbar
 * 
 * Mô tả:
 * - Xử lý tất cả các action từ taskbar (Start, Stop, Assign to group, Share profiles, etc.)
 * - Kết nối với IPC để giao tiếp với backend
 * - Hiển thị toast notifications và dialogs
 * - Tách riêng khỏi file chính để dễ bảo trì
 */

class TaskbarActions {
    constructor() {
        this.selectedProfiles = [];
        this.currentContext = 'local';
        this.groupName = null;
    }

    /**
     * Set selected profiles data
     */
    setSelectedProfiles(profiles) {
        this.selectedProfiles = profiles;
    }

    /**
     * Set current context (local/group)
     */
    setContext(context, groupName = null) {
        this.currentContext = context;
        this.groupName = groupName;
    }

    /**
     * Get selected profiles data
     */
    getSelectedProfiles() {
        return this.selectedProfiles;
    }

    // ==================== TASKBAR ACTIONS ====================

    /**
     * Start selected profiles
     */
    async startProfiles() {
        console.log('🚀 Starting selected profiles...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to start!', 'warning');
            return;
        }

        try {
            this.showToast(`Starting ${this.selectedProfiles.length} profiles...`, 'info');
            
            // Call IPC to start profiles
            const profileIds = this.selectedProfiles.map(p => p.id);
            const response = await window.electronAPI.invoke('profile:start-multiple', profileIds);
            
            if (response.success) {
                this.showToast(`Successfully started ${this.selectedProfiles.length} profiles!`, 'success');
                
                // Update profile status in UI
                this.updateProfilesStatus(profileIds, 'Running');
            } else {
                throw new Error(response.message || 'Failed to start profiles');
            }
            
        } catch (error) {
            console.error('Error starting profiles:', error);
            this.showToast('Failed to start profiles!', 'error');
        }
    }

    /**
     * Stop selected profiles
     */
    async stopProfiles() {
        console.log('⏹️ Stopping selected profiles...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to stop!', 'warning');
            return;
        }

        try {
            this.showToast(`Stopping ${this.selectedProfiles.length} profiles...`, 'info');
            
            // Call IPC to stop profiles
            const profileIds = this.selectedProfiles.map(p => p.id);
            const response = await window.electronAPI.invoke('profile:stop-multiple', profileIds);
            
            if (response.success) {
                this.showToast(`Successfully stopped ${this.selectedProfiles.length} profiles!`, 'success');
                
                // Update profile status in UI
                this.updateProfilesStatus(profileIds, 'Ready');
            } else {
                throw new Error(response.message || 'Failed to stop profiles');
            }
            
        } catch (error) {
            console.error('Error stopping profiles:', error);
            this.showToast('Failed to stop profiles!', 'error');
        }
    }

    /**
     * Assign profiles to group
     */
    async assignToGroup() {
        console.log('📁 Assigning profiles to group...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to assign to group!', 'warning');
            return;
        }

        try {
            // Get available groups
            const groupsResponse = await window.electronAPI.invoke('db:group:get-all');
            
            if (!groupsResponse.success || !groupsResponse.data || groupsResponse.data.length === 0) {
                this.showToast('Please create a group first!', 'warning');
                return;
            }

            const groups = groupsResponse.data.map(g => g.group_name);
            
            // Show assign to group dialog
            const selectedGroup = await this.showAssignToGroupDialog(groups);
            
            if (selectedGroup) {
                this.showToast(`Assigning ${this.selectedProfiles.length} profiles to group "${selectedGroup}"...`, 'info');
                
                // Call IPC to assign profiles to group
                const profileIds = this.selectedProfiles.map(p => p.id);
                const response = await window.electronAPI.invoke('db:group:assign-profiles', profileIds, selectedGroup);
                
                if (response.success) {
                    const result = response.data;
                    let message = `Successfully assigned ${result.assigned} profiles to group "${selectedGroup}"!`;
                    
                    if (result.skipped > 0) {
                        message += ` (${result.skipped} profiles were already in this group)`;
                    }
                    
                    this.showToast(message, 'success');
                    
                    // Clear selection after successful assignment
                    this.clearSelection();
                    
                    // Refresh profiles view
                    this.refreshProfilesView();
                } else {
                    throw new Error(response.message || 'Failed to assign profiles to group');
                }
            }
            
        } catch (error) {
            console.error('Error assigning to group:', error);
            this.showToast(`Failed to assign profiles to group: ${error.message}`, 'error');
        }
    }

    /**
     * Share selected profiles
     */
    async shareProfiles() {
        console.log('🔗 Sharing selected profiles...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to share!', 'warning');
            return;
        }

        try {
            this.showToast(`Sharing ${this.selectedProfiles.length} profiles...`, 'info');
            
            // Call IPC to share profiles
            const profileIds = this.selectedProfiles.map(p => p.id);
            const response = await window.electronAPI.invoke('profile:share-multiple', profileIds);
            
            if (response.success) {
                this.showToast(`Successfully shared ${this.selectedProfiles.length} profiles!`, 'success');
            } else {
                throw new Error(response.message || 'Failed to share profiles');
            }
            
        } catch (error) {
            console.error('Error sharing profiles:', error);
            this.showToast('Failed to share profiles!', 'error');
        }
    }

    /**
     * Check proxy for selected profiles
     */
    async checkProxy() {
        console.log('🔍 Checking proxy for selected profiles...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to check proxy!', 'warning');
            return;
        }

        try {
            this.showToast(`Checking proxy for ${this.selectedProfiles.length} profiles...`, 'info');
            
            // Call IPC to check proxy
            const profileIds = this.selectedProfiles.map(p => p.id);
            const response = await window.electronAPI.invoke('proxy:check-multiple', profileIds);
            
            if (response.success) {
                const result = response.data;
                const liveCount = result.live || 0;
                const deadCount = result.dead || 0;
                
                this.showToast(`Proxy check completed: ${liveCount} live, ${deadCount} dead`, 'success');
                
                // Refresh proxy status in UI
                this.refreshProxyStatus();
            } else {
                throw new Error(response.message || 'Failed to check proxy');
            }
            
        } catch (error) {
            console.error('Error checking proxy:', error);
            this.showToast('Failed to check proxy!', 'error');
        }
    }

    /**
     * Generate new fingerprint for selected profiles
     */
    async newFingerprint() {
        console.log('🆕 Generating new fingerprint...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to generate new fingerprint!', 'warning');
            return;
        }

        try {
            this.showToast(`Generating new fingerprint for ${this.selectedProfiles.length} profiles...`, 'info');
            
            // Call IPC to generate new fingerprint
            const profileIds = this.selectedProfiles.map(p => p.id);
            const response = await window.electronAPI.invoke('profile:generate-fingerprint', profileIds);
            
            if (response.success) {
                this.showToast(`Successfully generated new fingerprint for ${this.selectedProfiles.length} profiles!`, 'success');
            } else {
                throw new Error(response.message || 'Failed to generate fingerprint');
            }
            
        } catch (error) {
            console.error('Error generating fingerprint:', error);
            this.showToast('Failed to generate fingerprint!', 'error');
        }
    }

    /**
     * Set profiles to start with app
     */
    async startWithApp() {
        console.log('🚀 Setting profiles to start with app...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to start with app!', 'warning');
            return;
        }

        try {
            this.showToast(`Setting ${this.selectedProfiles.length} profiles to start with app...`, 'info');
            
            // Call IPC to set start with app
            const profileIds = this.selectedProfiles.map(p => p.id);
            const response = await window.electronAPI.invoke('profile:set-start-with-app', profileIds, true);
            
            if (response.success) {
                this.showToast(`Successfully set ${this.selectedProfiles.length} profiles to start with app!`, 'success');
            } else {
                throw new Error(response.message || 'Failed to set start with app');
            }
            
        } catch (error) {
            console.error('Error setting start with app:', error);
            this.showToast('Failed to set start with app!', 'error');
        }
    }

    /**
     * Update proxy for selected profiles
     */
    async updateProxy() {
        console.log('🔄 Updating proxy for selected profiles...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to update proxy!', 'warning');
            return;
        }

        // Show update proxy dialog
        this.showUpdateProxyDialog();
    }

    /**
     * Update selected profiles
     */
    async updateProfiles() {
        console.log('📝 Updating selected profiles...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to update!', 'warning');
            return;
        }

        try {
            this.showToast(`Updating ${this.selectedProfiles.length} profiles...`, 'info');
            
            // Call IPC to update profiles
            const profileIds = this.selectedProfiles.map(p => p.id);
            const response = await window.electronAPI.invoke('profile:update-multiple', profileIds);
            
            if (response.success) {
                this.showToast(`Successfully updated ${this.selectedProfiles.length} profiles!`, 'success');
                
                // Refresh profiles view
                this.refreshProfilesView();
            } else {
                throw new Error(response.message || 'Failed to update profiles');
            }
            
        } catch (error) {
            console.error('Error updating profiles:', error);
            this.showToast('Failed to update profiles!', 'error');
        }
    }

    /**
     * Share profiles on cloud
     */
    async shareOnCloud() {
        console.log('☁️ Sharing profiles on cloud...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to share on cloud!', 'warning');
            return;
        }

        try {
            this.showToast(`Sharing ${this.selectedProfiles.length} profiles on cloud...`, 'info');
            
            // Call IPC to share on cloud
            const profileIds = this.selectedProfiles.map(p => p.id);
            const response = await window.electronAPI.invoke('profile:share-on-cloud', profileIds);
            
            if (response.success) {
                this.showToast(`Successfully shared ${this.selectedProfiles.length} profiles on cloud!`, 'success');
                
                // Update shared status in UI
                this.updateProfilesSharedStatus(profileIds, true);
            } else {
                throw new Error(response.message || 'Failed to share on cloud');
            }
            
        } catch (error) {
            console.error('Error sharing on cloud:', error);
            this.showToast('Failed to share on cloud!', 'error');
        }
    }

    /**
     * Stop sharing profiles on cloud
     */
    async stopShareOnCloud() {
        console.log('🗑️ Stopping share on cloud...');
        
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to stop sharing on cloud!', 'warning');
            return;
        }

        try {
            this.showToast(`Stopping cloud sharing for ${this.selectedProfiles.length} profiles...`, 'info');
            
            // Call IPC to stop share on cloud
            const profileIds = this.selectedProfiles.map(p => p.id);
            const response = await window.electronAPI.invoke('profile:stop-share-on-cloud', profileIds);
            
            if (response.success) {
                this.showToast(`Successfully stopped cloud sharing for ${this.selectedProfiles.length} profiles!`, 'success');
                
                // Update shared status in UI
                this.updateProfilesSharedStatus(profileIds, false);
            } else {
                throw new Error(response.message || 'Failed to stop cloud sharing');
            }
            
        } catch (error) {
            console.error('Error stopping cloud sharing:', error);
            this.showToast('Failed to stop cloud sharing!', 'error');
        }
    }

    // ==================== CONTEXT MENU ACTIONS ====================

    /**
     * Copy selected proxies
     */
    async copySelectedProxies() {
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to copy proxy!', 'warning');
            return;
        }

        const proxies = this.selectedProfiles
            .map(profile => profile.proxy)
            .filter(proxy => proxy && proxy !== 'No proxy' && proxy !== 'None' && proxy !== '');

        if (proxies.length === 0) {
            this.showToast('No valid proxies found in selected profiles!', 'warning');
            return;
        }

        try {
            const proxyText = proxies.join('\n');
            await navigator.clipboard.writeText(proxyText);
            this.showToast(`Copied ${proxies.length} proxies to clipboard!`, 'success');
        } catch (error) {
            console.error('Failed to copy proxies:', error);
            this.showToast('Failed to copy proxies!', 'error');
        }
    }

    /**
     * Copy selected profile IDs
     */
    async copySelectedIds() {
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to copy IDs!', 'warning');
            return;
        }

        try {
            const ids = this.selectedProfiles.map(profile => profile.id || profile.name);
            const idsText = ids.join('\n');
            
            await navigator.clipboard.writeText(idsText);
            this.showToast(`Copied ${ids.length} IDs to clipboard!`, 'success');
        } catch (error) {
            console.error('Failed to copy IDs:', error);
            this.showToast('Failed to copy IDs!', 'error');
        }
    }

    /**
     * Copy selected profile names
     */
    async copySelectedNames() {
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to copy names!', 'warning');
            return;
        }

        try {
            const names = this.selectedProfiles.map(profile => profile.name);
            const namesText = names.join('\n');
            
            await navigator.clipboard.writeText(namesText);
            this.showToast(`Copied ${names.length} names to clipboard!`, 'success');
        } catch (error) {
            console.error('Failed to copy names:', error);
            this.showToast('Failed to copy names!', 'error');
        }
    }

    /**
     * Copy selected profile ID and names
     */
    async copySelectedIdAndNames() {
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to copy ID and names!', 'warning');
            return;
        }

        try {
            const idNames = this.selectedProfiles.map(profile => `${profile.id || profile.name} - ${profile.name}`);
            const idNamesText = idNames.join('\n');
            
            await navigator.clipboard.writeText(idNamesText);
            this.showToast(`Copied ${idNames.length} ID and names to clipboard!`, 'success');
        } catch (error) {
            console.error('Failed to copy ID and names:', error);
            this.showToast('Failed to copy ID and names!', 'error');
        }
    }

    /**
     * Export selected profiles
     */
    async exportSelectedProfiles() {
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select at least 1 profile to export!', 'warning');
            return;
        }

        try {
            console.log('📤 Exporting selected profiles:', this.selectedProfiles);
            
            // Call IPC to export profiles
            const profileIds = this.selectedProfiles.map(p => p.id);
            const response = await window.electronAPI.invoke('profile:export-multiple', profileIds);
            
            if (response.success) {
                this.showToast(`Successfully exported ${this.selectedProfiles.length} profiles!`, 'success');
            } else {
                throw new Error(response.message || 'Failed to export profiles');
            }
            
        } catch (error) {
            console.error('Error exporting profiles:', error);
            this.showToast('Failed to export profiles!', 'error');
        }
    }

    /**
     * Delete selected profiles
     */
    async deleteSelectedProfiles() {
        if (this.selectedProfiles.length === 0) {
            this.showToast('Please select profiles to delete!', 'warning');
            return;
        }

        const confirmMessage = this.currentContext === 'group' && this.groupName
            ? `Are you sure you want to remove ${this.selectedProfiles.length} profiles from group '${this.groupName}'?\n\nNote: Profiles will only be removed from this group, not deleted permanently.`
            : `Are you sure you want to permanently delete ${this.selectedProfiles.length} selected profiles?\n\nNote: Profiles will be permanently deleted from database.`;

        if (confirm(confirmMessage)) {
            try {
                console.log('🗑️ Deleting selected profiles:', this.selectedProfiles);
                
                // Call appropriate IPC based on context
                const profileIds = this.selectedProfiles.map(p => p.id);
                let response;
                
                if (this.currentContext === 'group' && this.groupName) {
                    // Remove from group only
                    response = await window.electronAPI.invoke('db:group:remove-profiles', profileIds, this.groupName);
                } else {
                    // Delete permanently
                    response = await window.electronAPI.invoke('profile:delete-multiple', profileIds);
                }
                
                if (response.success) {
                    const action = this.currentContext === 'group' ? 'removed from group' : 'deleted';
                    this.showToast(`Successfully ${action} ${this.selectedProfiles.length} profiles!`, 'success');
                    
                    // Clear selection and refresh view
                    this.clearSelection();
                    this.refreshProfilesView();
                } else {
                    throw new Error(response.message || 'Failed to delete profiles');
                }
                
            } catch (error) {
                console.error('Error deleting profiles:', error);
                this.showToast('Failed to delete profiles!', 'error');
            }
        }
    }

    // ==================== DIALOG METHODS ====================

    /**
     * Show assign to group dialog
     */
    async showAssignToGroupDialog(groups) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            const dialog = document.createElement('div');
            dialog.className = 'assign-group-dialog';
            dialog.style.cssText = `
                background: white;
                border-radius: 12px;
                padding: 24px;
                min-width: 400px;
                max-width: 500px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            `;

            dialog.innerHTML = `
                <div class="dialog-header" style="display: flex; align-items: center; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="background: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">📁</div>
                        <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">Assign to Group</h3>
                    </div>
                    <button class="dialog-close" style="margin-left: auto; background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280;">✕</button>
                </div>
                
                <div class="dialog-body">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">Selected Profiles</label>
                        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; max-height: 120px; overflow-y: auto;">
                            ${this.selectedProfiles.map(profile => `<div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">${profile.name}</div>`).join('')}
                            <div style="font-size: 12px; color: #9ca3af; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">Total: ${this.selectedProfiles.length} profile${this.selectedProfiles.length > 1 ? 's' : ''}</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">Select Group</label>
                        <select class="group-select" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white;">
                            <option value="">-- Select a group --</option>
                            ${groups.map(group => `<option value="${group}">${group}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="dialog-footer" style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="dialog-cancel" style="padding: 10px 20px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">Cancel</button>
                    <button class="dialog-assign" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;" disabled>Assign</button>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const closeBtn = dialog.querySelector('.dialog-close');
            const cancelBtn = dialog.querySelector('.dialog-cancel');
            const assignBtn = dialog.querySelector('.dialog-assign');
            const groupSelect = dialog.querySelector('.group-select');

            const closeDialog = () => {
                overlay.remove();
                resolve(null);
            };

            closeBtn.addEventListener('click', closeDialog);
            cancelBtn.addEventListener('click', closeDialog);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeDialog();
            });

            groupSelect.addEventListener('change', () => {
                assignBtn.disabled = !groupSelect.value;
            });

            assignBtn.addEventListener('click', () => {
                const selectedGroup = groupSelect.value;
                if (selectedGroup) {
                    overlay.remove();
                    resolve(selectedGroup);
                }
            });
        });
    }

    /**
     * Show update proxy dialog
     */
    showUpdateProxyDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const dialog = document.createElement('div');
        dialog.className = 'update-proxy-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            width: 600px;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        `;

        dialog.innerHTML = `
            <div class="dialog-header" style="display: flex; align-items: center; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">ℹ️</div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">Update proxy</h3>
                </div>
                <button class="dialog-close" style="margin-left: auto; background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280;">✕</button>
            </div>
            
            <div class="dialog-body">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">Selected profiles:</label>
                    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; max-height: 100px; overflow-y: auto;">
                        ${this.selectedProfiles.map(profile => `<div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">${profile.name}</div>`).join('')}
                    </div>
                    <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">Total: ${this.selectedProfiles.length}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: #374151;">Connection type</label>
                        <select class="connection-type" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
                            <option>Common</option>
                            <option>Residential</option>
                            <option>Datacenter</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: #374151;">Service</label>
                        <select class="service-type" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
                            <option>TZ (Suitable for IP v6)</option>
                            <option>Luminati</option>
                            <option>Smartproxy</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: #374151;">WebRTC</label>
                        <select class="webrtc-type" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
                            <option>Forward</option>
                            <option>Block</option>
                            <option>Real IP</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">Proxy list (host:port:username:password)</label>
                    <textarea class="proxy-list" placeholder="host:port:username:password" rows="5" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; font-family: monospace; resize: vertical;"></textarea>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; cursor: pointer;">
                        <input type="checkbox" class="enable-change-ip" style="margin: 0;">
                        Enable change Ip
                    </label>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">Example:</label>
                    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; color: #6b7280; line-height: 1.5;">
http://192.168.11:3000:user:password

http://192.168.11:3000:user:password

socks4://192.168.11:3000

socks5://192.168.11:3000
                    </div>
                </div>
            </div>
            
            <div class="dialog-footer" style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="dialog-cancel" style="padding: 10px 20px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">Cancel</button>
                <button class="dialog-update" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">Update</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const closeBtn = dialog.querySelector('.dialog-close');
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        const updateBtn = dialog.querySelector('.dialog-update');
        const proxyListTextarea = dialog.querySelector('.proxy-list');

        const closeDialog = () => {
            overlay.remove();
        };

        closeBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeDialog();
        });

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
                const profileIds = this.selectedProfiles.map(p => p.id);

                this.showToast(`Updating proxy for ${this.selectedProfiles.length} profiles...`, 'info');

                // Call IPC to update proxy
                const response = await window.electronAPI.invoke('profile:update-proxy', {
                    profileIds: profileIds,
                    proxies: proxies,
                    config: proxyData
                });

                if (response.success) {
                    this.showToast(`Successfully updated proxy for ${this.selectedProfiles.length} profiles!`, 'success');
                    closeDialog();

                    // Refresh proxy status in table
                    this.refreshProxyStatus();
                } else {
                    throw new Error(response.message || 'Failed to update proxy');
                }

            } catch (error) {
                console.error('Error updating proxy:', error);
                this.showToast('Failed to update proxy!', 'error');
                updateBtn.textContent = 'Update';
                updateBtn.disabled = false;
            }
        });
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Update profiles status in UI
     */
    updateProfilesStatus(profileIds, status) {
        // Find and update status in the profiles table
        const rows = document.querySelectorAll('.profile-row');
        rows.forEach(row => {
            const profileId = row.dataset.profileId;
            if (profileIds.includes(profileId)) {
                const statusCell = row.querySelector('.status');
                if (statusCell) {
                    statusCell.textContent = status;
                    statusCell.className = `status ${this.getStatusClass(status)}`;
                }
            }
        });
    }

    /**
     * Update profiles shared status in UI
     */
    updateProfilesSharedStatus(profileIds, isShared) {
        // Update shared status indicators in UI if they exist
        console.log(`Updated shared status for ${profileIds.length} profiles: ${isShared}`);
    }

    /**
     * Get CSS class for status
     */
    getStatusClass(status) {
        if (!status) return '';
        
        const statusLower = status.toLowerCase();
        if (statusLower === 'dead') return 'status-dead';
        if (statusLower === 'live' || statusLower === 'ready' || statusLower === 'running') return 'status-live';
        return '';
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedProfiles = [];
        
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll('.profile-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Uncheck select all checkbox
        const selectAllCheckbox = document.querySelector('.select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }

    /**
     * Refresh profiles view
     */
    refreshProfilesView() {
        // Trigger refresh of the profiles view
        const event = new CustomEvent('refreshProfiles');
        document.dispatchEvent(event);
    }

    /**
     * Refresh proxy status
     */
    refreshProxyStatus() {
        // Trigger refresh of proxy status in the table
        const event = new CustomEvent('refreshProxyStatus');
        document.dispatchEvent(event);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 4000) {
        // Create toast container if it doesn't exist
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                display: flex;
                flex-direction: column;
                gap: 8px;
            `;
            document.body.appendChild(container);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Get icon and color based on type
        const config = {
            success: { icon: '✅', bg: '#10b981', color: 'white' },
            error: { icon: '❌', bg: '#ef4444', color: 'white' },
            warning: { icon: '⚠️', bg: '#f59e0b', color: 'white' },
            info: { icon: 'ℹ️', bg: '#3b82f6', color: 'white' }
        };

        const { icon, bg, color } = config[type] || config.info;

        toast.style.cssText = `
            background: ${bg};
            color: ${color};
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 300px;
            max-width: 500px;
            animation: slideIn 0.3s ease-out;
        `;

        toast.innerHTML = `
            <span>${icon}</span>
            <span>${message}</span>
            <button style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; font-size: 16px; opacity: 0.8;">×</button>
        `;

        // Add CSS animation
        if (!document.querySelector('#toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // Add to container
        container.appendChild(toast);

        // Close button functionality
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => {
            this.hideToast(toast);
        });

        // Auto hide after duration
        if (duration > 0) {
            setTimeout(() => {
                this.hideToast(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Hide toast notification
     */
    hideToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskbarActions;
} else if (typeof window !== 'undefined') {
    window.TaskbarActions = TaskbarActions;
}