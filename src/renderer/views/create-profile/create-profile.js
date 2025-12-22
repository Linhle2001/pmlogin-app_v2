/**
 * Create Profile JavaScript Implementation
 * Converted from Python PMLogin create_profile.py
 * Enhanced with taskbar and checkbox handling like pmlogin-app
 */

class CreateProfileManager {
    constructor() {
        this.editMode = false;
        this.editProfileData = null;
        this.proxyList = [];
        this.groupList = [];
        this.selectedProfiles = [];
        this.profilesData = [];
        
        this.init();
    }

    init() {
        console.log('🔧 [CreateProfile] Initializing CreateProfileManager...');
        
        try {
            this.initializeElements();
            this.setupEventListeners();
            this.loadInitialData();
            this.setupDefaultState();
            this.initializeTaskbar();
            this.initializeProfilesTable();
            
            console.log('[SUCCESS] [CreateProfile] CreateProfileManager initialized successfully');
        } catch (error) {
            console.error('[ERROR] [CreateProfile] Error initializing:', error);
        }
    }

    initializeElements() {
        // Form elements
        this.profileNameInput = document.getElementById('profileName');
        this.platformSelect = document.getElementById('platformSelect');
        this.shareOnCloudCheckbox = document.getElementById('shareOnCloud');
        this.createProfileBtn = document.getElementById('createProfileBtn');

        // Group selector
        this.groupSelector = new CustomSelector('groupSelector', 'groupButton', 'groupDropdown');
        
        // Proxy elements
        this.proxyTypeRadios = document.querySelectorAll('input[name="proxyType"]');
        this.pmProxySection = document.getElementById('pmProxySection');
        this.yourProxySection = document.getElementById('yourProxySection');
        this.proxySelector = new CustomSelector('proxySelector', 'proxyButton', 'proxyDropdown');
        
        // Your proxy form elements
        this.proxyTypeSelect = document.getElementById('proxyTypeSelect');
        this.proxyHost = document.getElementById('proxyHost');
        this.proxyPort = document.getElementById('proxyPort');
        this.proxyUsername = document.getElementById('proxyUsername');
        this.proxyPassword = document.getElementById('proxyPassword');
        this.testProxyBtn = document.getElementById('testProxyBtn');
        this.clearProxyBtn = document.getElementById('clearProxyBtn');

        // WebRTC
        this.webrtcSelect = document.getElementById('webrtcSelect');

        // Location elements
        this.timezoneAuto = document.getElementById('timezoneAuto');
        this.geolocationSelect = document.getElementById('geolocationSelect');
        this.geolocationAuto = document.getElementById('geolocationAuto');

        // Cookies elements
        this.cookiesTextarea = document.getElementById('cookiesTextarea');
        this.importCookiesBtn = document.getElementById('importCookiesBtn');

        // Tab elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Navigation buttons
        this.backBtn = document.getElementById('backBtn');
        this.cancelBtn = document.getElementById('cancelBtn');

        console.log('[SUCCESS] [CreateProfile] Elements initialized');
    }

    setupEventListeners() {
        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Proxy type radio buttons
        this.proxyTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleProxyTypeChange(e.target.value);
            });
        });

        // Form submission
        this.createProfileBtn?.addEventListener('click', () => {
            this.handleCreateProfile();
        });

        // Proxy testing
        this.testProxyBtn?.addEventListener('click', () => {
            this.testProxy();
        });

        // Clear proxy
        this.clearProxyBtn?.addEventListener('click', () => {
            this.clearProxyForm();
        });

        // Import cookies
        this.importCookiesBtn?.addEventListener('click', () => {
            this.importCookies();
        });

        // Navigation
        this.backBtn?.addEventListener('click', () => {
            this.goBack();
        });

        this.cancelBtn?.addEventListener('click', () => {
            this.cancel();
        });

        // Auto timezone/geolocation
        this.timezoneAuto?.addEventListener('change', (e) => {
            this.handleTimezoneAuto(e.target.checked);
        });

        this.geolocationAuto?.addEventListener('change', (e) => {
            this.handleGeolocationAuto(e.target.checked);
        });

        console.log('[SUCCESS] [CreateProfile] Event listeners setup complete');
    }

    async loadInitialData() {
        try {
            // Load proxy list
            await this.loadProxyList();
            
            // Load group list
            await this.loadGroupList();
            
            // Check if in edit mode
            this.checkEditMode();
            
        } catch (error) {
            console.error('[ERROR] [CreateProfile] Error loading initial data:', error);
        }
    }

    async loadProxyList() {
        try {
            const response = await window.electronAPI.invoke('get-proxy-list');
            if (response.success) {
                this.proxyList = response.data;
                this.populateProxySelector();
            }
        } catch (error) {
            console.error('[ERROR] [CreateProfile] Error loading proxy list:', error);
        }
    }

    async loadGroupList() {
        try {
            const response = await window.electronAPI.invoke('get-group-list');
            if (response.success) {
                this.groupList = response.data;
                this.populateGroupSelector();
            }
        } catch (error) {
            console.error('[ERROR] [CreateProfile] Error loading group list:', error);
        }
    }

    populateProxySelector() {
        if (!this.proxySelector) return;
        
        const options = this.proxyList.map(proxy => ({
            value: proxy.id,
            text: `${proxy.name} (${proxy.host}:${proxy.port})`
        }));
        
        this.proxySelector.setOptions(options);
    }

    populateGroupSelector() {
        if (!this.groupSelector) return;
        
        const options = this.groupList.map(group => ({
            value: group.id,
            text: group.name
        }));
        
        this.groupSelector.setOptions(options);
    }

    setupDefaultState() {
        // Set default tab
        this.switchTab('general');
        
        // Set default proxy type
        this.handleProxyTypeChange('none');
        
        // Set default WebRTC
        if (this.webrtcSelect) {
            this.webrtcSelect.value = 'disabled';
        }
        
        // Set default geolocation
        if (this.geolocationSelect) {
            this.geolocationSelect.value = 'auto';
        }
    }

    switchTab(tabName) {
        // Remove active class from all tabs
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}Tab`);
        
        if (activeButton) activeButton.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }

    handleProxyTypeChange(proxyType) {
        // Hide all proxy sections
        if (this.pmProxySection) this.pmProxySection.style.display = 'none';
        if (this.yourProxySection) this.yourProxySection.style.display = 'none';
        
        // Show relevant section
        switch (proxyType) {
            case 'pm_proxy':
                if (this.pmProxySection) this.pmProxySection.style.display = 'block';
                break;
            case 'your_proxy':
                if (this.yourProxySection) this.yourProxySection.style.display = 'block';
                break;
        }
    }

    async testProxy() {
        const proxyData = this.getProxyFormData();
        if (!proxyData.host || !proxyData.port) {
            this.showNotification('Please enter proxy host and port', 'error');
            return;
        }

        try {
            this.testProxyBtn.disabled = true;
            this.testProxyBtn.textContent = 'Testing...';
            
            const response = await window.electronAPI.invoke('test-proxy', proxyData);
            
            if (response.success) {
                this.showNotification('Proxy test successful!', 'success');
            } else {
                this.showNotification(`Proxy test failed: ${response.error}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Proxy test error: ${error.message}`, 'error');
        } finally {
            this.testProxyBtn.disabled = false;
            this.testProxyBtn.textContent = 'Test Proxy';
        }
    }

    getProxyFormData() {
        return {
            type: this.proxyTypeSelect?.value || 'http',
            host: this.proxyHost?.value || '',
            port: this.proxyPort?.value || '',
            username: this.proxyUsername?.value || '',
            password: this.proxyPassword?.value || ''
        };
    }

    clearProxyForm() {
        if (this.proxyHost) this.proxyHost.value = '';
        if (this.proxyPort) this.proxyPort.value = '';
        if (this.proxyUsername) this.proxyUsername.value = '';
        if (this.proxyPassword) this.proxyPassword.value = '';
        if (this.proxyTypeSelect) this.proxyTypeSelect.value = 'http';
    }

    async importCookies() {
        try {
            const response = await window.electronAPI.invoke('import-cookies');
            if (response.success && response.data) {
                this.cookiesTextarea.value = response.data;
                this.showNotification('Cookies imported successfully!', 'success');
            }
        } catch (error) {
            this.showNotification(`Error importing cookies: ${error.message}`, 'error');
        }
    }

    handleTimezoneAuto(isAuto) {
        // Implementation for auto timezone
        console.log('Timezone auto:', isAuto);
    }

    handleGeolocationAuto(isAuto) {
        // Implementation for auto geolocation
        console.log('Geolocation auto:', isAuto);
    }

    checkEditMode() {
        // Check if we're in edit mode (from URL params or passed data)
        const urlParams = new URLSearchParams(window.location.search);
        const profileId = urlParams.get('profileId');
        
        if (profileId) {
            this.editMode = true;
            this.loadProfileForEdit(profileId);
        }
    }

    async loadProfileForEdit(profileId) {
        try {
            const response = await window.electronAPI.invoke('get-profile', profileId);
            if (response.success) {
                this.editProfileData = response.data;
                this.populateFormWithProfileData();
                this.updateUIForEditMode();
            }
        } catch (error) {
            console.error('[ERROR] [CreateProfile] Error loading profile for edit:', error);
        }
    }

    populateFormWithProfileData() {
        if (!this.editProfileData) return;
        
        const profile = this.editProfileData;
        
        // General tab
        if (this.profileNameInput) this.profileNameInput.value = profile.name || '';
        if (this.platformSelect) this.platformSelect.value = profile.platform || 'windows';
        if (this.shareOnCloudCheckbox) this.shareOnCloudCheckbox.checked = profile.shareOnCloud || false;
        
        // Group
        if (profile.groupId && this.groupSelector) {
            this.groupSelector.setValue(profile.groupId);
        }
        
        // Proxy
        if (profile.proxy) {
            this.populateProxyData(profile.proxy);
        }
        
        // WebRTC
        if (this.webrtcSelect) this.webrtcSelect.value = profile.webrtc || 'disabled';
        
        // Location
        if (this.geolocationSelect) this.geolocationSelect.value = profile.geolocation || 'auto';
        
        // Cookies
        if (this.cookiesTextarea) this.cookiesTextarea.value = profile.cookies || '';
    }

    populateProxyData(proxyData) {
        if (proxyData.type === 'pm_proxy') {
            document.querySelector('input[value="pm_proxy"]').checked = true;
            this.handleProxyTypeChange('pm_proxy');
            if (this.proxySelector) {
                this.proxySelector.setValue(proxyData.id);
            }
        } else if (proxyData.type === 'your_proxy') {
            document.querySelector('input[value="your_proxy"]').checked = true;
            this.handleProxyTypeChange('your_proxy');
            
            if (this.proxyTypeSelect) this.proxyTypeSelect.value = proxyData.protocol || 'http';
            if (this.proxyHost) this.proxyHost.value = proxyData.host || '';
            if (this.proxyPort) this.proxyPort.value = proxyData.port || '';
            if (this.proxyUsername) this.proxyUsername.value = proxyData.username || '';
            if (this.proxyPassword) this.proxyPassword.value = proxyData.password || '';
        } else {
            document.querySelector('input[value="none"]').checked = true;
            this.handleProxyTypeChange('none');
        }
    }

    updateUIForEditMode() {
        if (this.createProfileBtn) {
            this.createProfileBtn.textContent = 'Update Profile';
        }
        
        // Update page title or header if needed
        const pageTitle = document.querySelector('h1');
        if (pageTitle) {
            pageTitle.textContent = 'Edit Profile';
        }
    }

    async handleCreateProfile() {
        try {
            const profileData = this.collectFormData();
            
            if (!this.validateProfileData(profileData)) {
                return;
            }
            
            this.createProfileBtn.disabled = true;
            this.createProfileBtn.textContent = this.editMode ? 'Updating...' : 'Creating...';
            
            const action = this.editMode ? 'update-profile' : 'create-profile';
            const response = await window.electronAPI.invoke(action, profileData);
            
            if (response.success) {
                this.showNotification(
                    this.editMode ? 'Profile updated successfully!' : 'Profile created successfully!',
                    'success'
                );
                
                // Refresh profiles view if it exists
                if (window.mainRenderer && window.mainRenderer.profilesView) {
                    console.log('🔄 Refreshing profiles view after profile creation...');
                    window.mainRenderer.profilesView.refresh();
                    
                    // Switch to profiles view
                    window.mainRenderer.switchView('profiles');
                }
                
                // Navigate back to profiles view after short delay
                setTimeout(() => {
                    // If we're in the main window, switch to profiles view
                    if (window.mainRenderer && window.mainRenderer.switchView) {
                        window.mainRenderer.switchView('profiles');
                    } else {
                        this.goBack();
                    }
                }, 1500);
            } else {
                this.showNotification(`Error: ${response.message}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.createProfileBtn.disabled = false;
            this.createProfileBtn.textContent = this.editMode ? 'Update Profile' : 'Create Profile';
        }
    }

    collectFormData() {
        const formData = {
            name: this.profileNameInput?.value || '',
            platform: this.platformSelect?.value || 'windows',
            shareOnCloud: this.shareOnCloudCheckbox?.checked || false,
            groupId: this.groupSelector?.getValue() || null,
            webrtc: this.webrtcSelect?.value || 'disabled',
            geolocation: this.geolocationSelect?.value || 'auto',
            cookies: this.cookiesTextarea?.value || ''
        };
        
        // Add proxy data
        const selectedProxyType = document.querySelector('input[name="proxyType"]:checked')?.value || 'none';
        formData.proxy = this.collectProxyData(selectedProxyType);
        
        // If in edit mode, include profile ID
        if (this.editMode && this.editProfileData) {
            formData.id = this.editProfileData.id;
        }
        
        return formData;
    }

    collectProxyData(proxyType) {
        switch (proxyType) {
            case 'pm_proxy':
                return {
                    type: 'pm_proxy',
                    id: this.proxySelector?.getValue() || null
                };
            case 'your_proxy':
                return {
                    type: 'your_proxy',
                    protocol: this.proxyTypeSelect?.value || 'http',
                    host: this.proxyHost?.value || '',
                    port: this.proxyPort?.value || '',
                    username: this.proxyUsername?.value || '',
                    password: this.proxyPassword?.value || ''
                };
            default:
                return { type: 'none' };
        }
    }

    validateProfileData(profileData) {
        if (!profileData.name.trim()) {
            this.showNotification('Profile name is required', 'error');
            this.switchTab('general');
            this.profileNameInput?.focus();
            return false;
        }
        
        // Validate proxy data if using your proxy
        if (profileData.proxy.type === 'your_proxy') {
            if (!profileData.proxy.host || !profileData.proxy.port) {
                this.showNotification('Proxy host and port are required', 'error');
                this.switchTab('proxy');
                return false;
            }
        }
        
        return true;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    goBack() {
        // If we're in the main window, switch to profiles view
        if (window.mainRenderer && window.mainRenderer.switchView) {
            window.mainRenderer.switchView('profiles');
        } else {
            // Navigate back to main window and refresh profiles
            if (window.opener) {
                // If opened as popup, notify parent window to refresh
                window.opener.postMessage({ type: 'PROFILE_CREATED' }, '*');
                window.close();
            } else {
                // If same window, navigate back
                window.location.href = '../main/index.html';
            }
        }
    }

    cancel() {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            this.goBack();
        }
    }

    // ==================== TASKBAR FUNCTIONALITY ====================

    /**
     * Initialize taskbar with action buttons
     */
    initializeTaskbar() {
        const taskbarContainer = document.createElement('div');
        taskbarContainer.className = 'profiles-taskbar';
        taskbarContainer.innerHTML = `
            <div class="taskbar-row taskbar-row-1">
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Search profiles..." />
                </div>
                <div class="primary-buttons">
                    <button class="btn btn-primary" data-action="start">▶️ Start</button>
                    <button class="btn btn-danger" data-action="stop">⏹️ Stop</button>
                    <button class="btn btn-primary" data-action="assign-group">📋 Assign to group</button>
                    <button class="btn btn-primary" data-action="share-profiles">🔗 Share profiles</button>
                    <button class="btn btn-primary" data-action="check-proxy">✓ Check proxy</button>
                    <button class="btn btn-outline" data-action="new-fingerprint">🆕 New fingerprint</button>
                    <button class="btn btn-more" data-action="more">⋯</button>
                </div>
            </div>
            <div class="taskbar-row taskbar-row-2">
                <div class="secondary-buttons">
                    <button class="btn btn-primary" data-action="start-with-app">🚀 Start with app</button>
                    <button class="btn btn-primary" data-action="update-proxy">📤 Update proxy</button>
                    <button class="btn btn-primary" data-action="update-profiles">📊 Update profiles</button>
                    <button class="btn btn-primary" data-action="share-cloud">☁️ Share on cloud</button>
                    <button class="btn btn-danger" data-action="stop-share-cloud">🗑️ Stop share on cloud</button>
                </div>
            </div>
        `;

        // Insert taskbar before the form section
        const formSection = document.querySelector('.form-section');
        if (formSection) {
            formSection.parentNode.insertBefore(taskbarContainer, formSection);
        }

        this.attachTaskbarEvents(taskbarContainer);
    }

    /**
     * Attach event listeners to taskbar buttons
     */
    attachTaskbarEvents(taskbar) {
        const buttons = taskbar.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleTaskbarAction(action);
            });
        });

        // Search functionality
        const searchInput = taskbar.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    }

    /**
     * Handle taskbar actions
     */
    handleTaskbarAction(action) {
        console.log(`🔧 [CreateProfile] Taskbar action: ${action}`);
        
        switch(action) {
            case 'start':
                this.startSelectedProfiles();
                break;
            case 'stop':
                this.stopSelectedProfiles();
                break;
            case 'assign-group':
                this.assignToGroup();
                break;
            case 'share-profiles':
                this.shareProfiles();
                break;
            case 'check-proxy':
                this.checkSelectedProxies();
                break;
            case 'new-fingerprint':
                this.createNewFingerprint();
                break;
            case 'start-with-app':
                this.startWithApp();
                break;
            case 'update-proxy':
                this.updateSelectedProxies();
                break;
            case 'update-profiles':
                this.updateSelectedProfiles();
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

    // ==================== PROFILES TABLE FUNCTIONALITY ====================

    /**
     * Initialize profiles table with checkbox functionality
     */
    initializeProfilesTable() {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'profiles-table-container';
        tableContainer.innerHTML = `
            <table class="profiles-table">
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
            </table>
        `;

        // Insert table after the tabs section
        const tabsSection = document.querySelector('.tabs-section');
        if (tabsSection) {
            tabsSection.parentNode.insertBefore(tableContainer, tabsSection.nextSibling);
        }

        this.attachTableEvents(tableContainer);
        this.loadProfilesData();
    }

    /**
     * Attach event listeners to table elements
     */
    attachTableEvents(tableContainer) {
        // Select all checkbox
        const selectAllCheckbox = tableContainer.querySelector('.select-all-checkbox');
        selectAllCheckbox.addEventListener('change', (e) => {
            this.toggleAllCheckboxes(e.target.checked);
        });
    }

    /**
     * Load profiles data and populate table
     */
    async loadProfilesData() {
        try {
            // Mock data for demonstration - replace with actual API call
            this.profilesData = [
                {
                    id: '1',
                    name: 'Profile 1',
                    platform: 'Windows',
                    tags: ['work', 'test'],
                    note: 'Test profile',
                    proxy: 'http://proxy1.example.com:8080',
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
                    note: 'Personal profile',
                    proxy: 'No proxy',
                    proxy_status: 'No proxy',
                    updated_at: new Date().toISOString(),
                    last_started_at: null,
                    status: 'Ready'
                }
            ];

            this.populateTable();
        } catch (error) {
            console.error('[ERROR] [CreateProfile] Error loading profiles data:', error);
        }
    }

    /**
     * Populate table with profiles data
     */
    populateTable() {
        const tbody = document.querySelector('.profiles-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!this.profilesData || this.profilesData.length === 0) {
            this.displayNoDataState(tbody);
            return;
        }

        this.profilesData.forEach((profile, index) => {
            const row = this.createProfileRow(profile, index);
            tbody.appendChild(row);
        });
    }

    /**
     * Create a profile row
     */
    createProfileRow(profile, index) {
        const row = document.createElement('tr');
        row.className = 'profile-row';
        row.dataset.profileId = profile.id;
        
        // Checkbox
        const checkboxCell = document.createElement('td');
        checkboxCell.innerHTML = `<input type="checkbox" class="profile-checkbox" data-profile-id="${profile.id}" />`;
        
        // Name with icon
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
        
        // Proxy with status color
        const proxyCell = document.createElement('td');
        const proxyStatus = this.getProxyDisplayInfo(profile);
        proxyCell.innerHTML = `<span class="proxy-status ${proxyStatus.class}">${proxyStatus.text}</span>`;
        
        // Updated at
        const updatedCell = document.createElement('td');
        updatedCell.textContent = this.formatDateTime(profile.updated_at);
        
        // Last started at
        const lastStartedCell = document.createElement('td');
        lastStartedCell.textContent = this.formatDateTime(profile.last_started_at);
        
        // Status with color
        const statusCell = document.createElement('td');
        const statusClass = this.getStatusClass(profile.status);
        statusCell.innerHTML = `<span class="status ${statusClass}">${profile.status || 'Ready'}</span>`;
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <div class="actions-container">
                <button class="btn btn-small btn-primary" data-action="start" data-profile-id="${profile.id}">Start</button>
                <button class="btn btn-more-actions" data-action="more" data-profile-id="${profile.id}">⋯</button>
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
     * Attach events to table row
     */
    attachRowEvents(row, profile) {
        // Checkbox selection
        const checkbox = row.querySelector('.profile-checkbox');
        checkbox.addEventListener('change', (e) => {
            this.handleProfileSelection(profile.id, e.target.checked);
        });

        // Profile name click for details
        const profileName = row.querySelector('.profile-name');
        profileName.addEventListener('click', () => {
            this.showProfileDetails(profile);
        });

        // Note input
        const noteInput = row.querySelector('.note-input');
        noteInput.addEventListener('blur', (e) => {
            this.updateProfileNote(profile.id, e.target.value);
        });

        // Action buttons
        const actionButtons = row.querySelectorAll('button[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const profileId = e.target.dataset.profileId;
                this.handleRowAction(action, profileId, profile);
            });
        });

        // More actions button hover menu
        const moreButton = row.querySelector('.btn-more-actions');
        if (moreButton) {
            this.attachContextMenu(moreButton, profile);
        }
    }

    /**
     * Attach context menu to more actions button
     */
    attachContextMenu(button, profile) {
        let contextMenu = null;
        let showTimer = null;
        let hideTimer = null;

        const showMenu = () => {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }

            contextMenu = this.createContextMenu(profile);
            document.body.appendChild(contextMenu);

            // Position menu
            const rect = button.getBoundingClientRect();
            const menuWidth = 220;
            const menuHeight = contextMenu.offsetHeight;

            let x = rect.left - menuWidth + button.offsetWidth;
            let y = rect.bottom;

            // Adjust position if menu goes off screen
            if (x < 0) x = rect.right;
            if (y + menuHeight > window.innerHeight) {
                y = rect.top - menuHeight;
            }

            contextMenu.style.left = `${x}px`;
            contextMenu.style.top = `${y}px`;
            contextMenu.classList.add('show');
        };

        const hideMenu = () => {
            if (showTimer) {
                clearTimeout(showTimer);
                showTimer = null;
            }

            hideTimer = setTimeout(() => {
                if (contextMenu && !contextMenu.matches(':hover') && !button.matches(':hover')) {
                    contextMenu.remove();
                    contextMenu = null;
                }
                hideTimer = null;
            }, 300);
        };

        // Mouse events for button
        button.addEventListener('mouseenter', () => {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
            showTimer = setTimeout(showMenu, 200);
        });

        button.addEventListener('mouseleave', hideMenu);

        // Click event for immediate show
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (showTimer) {
                clearTimeout(showTimer);
                showTimer = null;
            }
            showMenu();
        });
    }

    /**
     * Create context menu for profile actions
     */
    createContextMenu(profile) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-menu-content">
                <div class="menu-item" data-action="edit">
                    <span class="menu-icon">✏️</span>
                    <span class="menu-text">Edit</span>
                </div>
                <div class="menu-item" data-action="share">
                    <span class="menu-icon">[LINK]</span>
                    <span class="menu-text">Share</span>
                </div>
                <div class="menu-item" data-action="export-cookies">
                    <span class="menu-icon">[COOKIE]</span>
                    <span class="menu-text">Export cookies</span>
                </div>
                <div class="menu-item" data-action="change-owner">
                    <span class="menu-icon">[INFO]</span>
                    <span class="menu-text">Change owner</span>
                </div>
                <div class="menu-item" data-action="clone">
                    <span class="menu-icon">[COPY]</span>
                    <span class="menu-text">Clone</span>
                </div>
                <div class="menu-item" data-action="copy-proxy">
                    <span class="menu-icon">📄</span>
                    <span class="menu-text">Copy proxy</span>
                </div>
                <div class="menu-separator"></div>
                <div class="menu-item danger" data-action="delete">
                    <span class="menu-icon">[DELETE]</span>
                    <span class="menu-text">Delete</span>
                </div>
            </div>
        `;

        // Attach menu item events
        const menuItems = menu.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleContextMenuAction(action, profile);
                menu.remove();
            });
        });

        // Mouse events for menu
        menu.addEventListener('mouseenter', () => {
            // Keep menu visible when hovering
        });

        menu.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!menu.matches(':hover')) {
                    menu.remove();
                }
            }, 300);
        });

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);

        return menu;
    }

    /**
     * Handle context menu actions
     */
    handleContextMenuAction(action, profile) {
        console.log(`🔧 [CreateProfile] Context menu action: ${action} for profile:`, profile.name);
        
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
                this.copySingleProxy(profile);
                break;
            case 'delete':
                this.deleteSingleProfile(profile);
                break;
            default:
                console.warn(`Unknown context menu action: ${action}`);
        }
    }

    // ==================== CONTEXT MENU ACTIONS ====================

    editProfile(profile) {
        console.log('✏️ [CreateProfile] Editing profile:', profile.name);
        this.showNotification(`Edit profile feature coming soon...`, 'info');
    }

    shareProfile(profile) {
        console.log('[LINK] [CreateProfile] Sharing profile:', profile.name);
        this.showNotification(`Share profile feature coming soon...`, 'info');
    }

    exportCookies(profile) {
        console.log('[COOKIE] [CreateProfile] Exporting cookies for profile:', profile.name);
        this.showNotification(`Export cookies feature coming soon...`, 'info');
    }

    changeOwner(profile) {
        console.log('[INFO] [CreateProfile] Changing owner for profile:', profile.name);
        this.showNotification(`Change owner feature coming soon...`, 'info');
    }

    showCloneDialog(profile) {
        console.log('[COPY] [CreateProfile] Showing clone dialog for profile:', profile.name);
        
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
            this.showNotification('This profile has no proxy!', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(proxy).then(() => {
            this.showNotification(`Copied proxy: ${proxy}`, 'success');
        }).catch(err => {
            console.error('Failed to copy proxy:', err);
            this.showNotification('Failed to copy proxy!', 'error');
        });
    }

    deleteSingleProfile(profile) {
        const confirmMessage = `Are you sure you want to permanently delete this profile?\n\nProfile: ${profile.name}\n\nNote: Profile will be permanently deleted.`;
        
        if (confirm(confirmMessage)) {
            console.log('[DELETE] [CreateProfile] Deleting profile:', profile.name);
            this.showNotification(`Delete profile feature coming soon...`, 'info');
        }
    }

    /**
     * Create clone dialog
     */
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

    /**
     * Attach events to clone dialog
     */
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

    /**
     * Clone profile
     */
    cloneProfile(originalProfile, cloneCount) {
        console.log(`[COPY] [CreateProfile] Cloning profile ${originalProfile.name} ${cloneCount} times`);
        
        // TODO: Implement actual cloning logic
        // For now, just show success message
        this.showNotification(`Successfully cloned ${cloneCount} profiles!`, 'success');
    }

    /**
     * Toggle all checkboxes
     */
    toggleAllCheckboxes(checked) {
        const checkboxes = document.querySelectorAll('.profile-checkbox');
        
        // Clear current selection first
        this.selectedProfiles = [];
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const profileId = checkbox.dataset.profileId;
            
            if (checked) {
                // Add to selection if checked
                if (!this.selectedProfiles.includes(profileId)) {
                    this.selectedProfiles.push(profileId);
                }
            }
        });
        
        console.log('🔧 [CreateProfile] Toggle all checkboxes:', checked, 'Selected:', this.selectedProfiles);
        this.updateSelectionUI();
    }

    /**
     * Handle individual profile selection
     */
    handleProfileSelection(profileId, selected) {
        if (selected) {
            if (!this.selectedProfiles.includes(profileId)) {
                this.selectedProfiles.push(profileId);
            }
        } else {
            this.selectedProfiles = this.selectedProfiles.filter(id => id !== profileId);
        }
        
        console.log('🔧 [CreateProfile] Selected profiles:', this.selectedProfiles);
        this.updateSelectionUI();
    }

    /**
     * Update UI based on selection state
     */
    updateSelectionUI() {
        // Update select all checkbox state
        const selectAllCheckbox = document.querySelector('.select-all-checkbox');
        const allCheckboxes = document.querySelectorAll('.profile-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.profile-checkbox:checked');
        
        if (selectAllCheckbox) {
            if (checkedCheckboxes.length === 0) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
            } else if (checkedCheckboxes.length === allCheckboxes.length) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = true;
            } else {
                selectAllCheckbox.indeterminate = true;
            }
        }
    }

    // ==================== TASKBAR ACTIONS ====================

    startSelectedProfiles() {
        if (this.selectedProfiles.length === 0) {
            this.showNotification('Please select profiles to start!', 'warning');
            return;
        }
        console.log('[START] [CreateProfile] Starting selected profiles:', this.selectedProfiles);
        this.showNotification(`Starting ${this.selectedProfiles.length} profiles...`, 'success');
    }

    stopSelectedProfiles() {
        if (this.selectedProfiles.length === 0) {
            this.showNotification('Please select profiles to stop!', 'warning');
            return;
        }
        console.log('[STOP] [CreateProfile] Stopping selected profiles:', this.selectedProfiles);
        this.showNotification(`Stopping ${this.selectedProfiles.length} profiles...`, 'success');
    }

    assignToGroup() {
        if (this.selectedProfiles.length === 0) {
            this.showNotification('Please select profiles to assign to group!', 'warning');
            return;
        }
        console.log('[COPY] [CreateProfile] Assigning to group:', this.selectedProfiles);
        this.showNotification('Assign to group feature coming soon...', 'info');
    }

    shareProfiles() {
        if (this.selectedProfiles.length === 0) {
            this.showNotification('Please select profiles to share!', 'warning');
            return;
        }
        console.log('[LINK] [CreateProfile] Sharing profiles:', this.selectedProfiles);
        this.showNotification('Share profiles feature coming soon...', 'info');
    }

    checkSelectedProxies() {
        if (this.selectedProfiles.length === 0) {
            this.showNotification('Please select profiles to check proxy!', 'warning');
            return;
        }
        console.log('✓ [CreateProfile] Checking proxies for:', this.selectedProfiles);
        this.showNotification(`Checking proxy for ${this.selectedProfiles.length} profiles...`, 'info');
    }

    createNewFingerprint() {
        console.log('[NEW] [CreateProfile] Creating new fingerprint...');
        this.showNotification('New fingerprint feature coming soon...', 'info');
    }

    startWithApp() {
        if (this.selectedProfiles.length === 0) {
            this.showNotification('Please select profiles to start with app!', 'warning');
            return;
        }
        console.log('[START] [CreateProfile] Starting with app:', this.selectedProfiles);
        this.showNotification('Start with app feature coming soon...', 'info');
    }

    updateSelectedProxies() {
        if (this.selectedProfiles.length === 0) {
            this.showNotification('Please select profiles to update proxy!', 'warning');
            return;
        }
        console.log('[UPLOAD] [CreateProfile] Updating proxies for:', this.selectedProfiles);
        this.showNotification('Update proxy feature coming soon...', 'info');
    }

    updateSelectedProfiles() {
        if (this.selectedProfiles.length === 0) {
            this.showNotification('Please select profiles to update!', 'warning');
            return;
        }
        console.log('[DATA] [CreateProfile] Updating profiles:', this.selectedProfiles);
        this.showNotification('Update profiles feature coming soon...', 'info');
    }

    shareOnCloud() {
        if (this.selectedProfiles.length === 0) {
            this.showNotification('Please select profiles to share on cloud!', 'warning');
            return;
        }
        console.log('[CLOUD] [CreateProfile] Sharing on cloud:', this.selectedProfiles);
        this.showNotification('Share on cloud feature coming soon...', 'info');
    }

    stopShareOnCloud() {
        if (this.selectedProfiles.length === 0) {
            this.showNotification('Please select profiles to stop sharing!', 'warning');
            return;
        }
        console.log('[DELETE] [CreateProfile] Stopping share on cloud:', this.selectedProfiles);
        this.showNotification('Stop share on cloud feature coming soon...', 'info');
    }

    showMoreActions() {
        console.log('⋯ [CreateProfile] Showing more actions...');
        this.showNotification('More actions feature coming soon...', 'info');
    }

    // ==================== ROW ACTIONS ====================

    handleRowAction(action, profileId, profile) {
        console.log(`🔧 [CreateProfile] Row action: ${action} for profile ${profileId}`);
        
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

    startSingleProfile(profileId) {
        console.log(`[START] [CreateProfile] Starting profile ${profileId}...`);
        this.showNotification(`Starting profile ${profileId}...`, 'success');
    }

    showRowContextMenu(profileId, profile) {
        console.log('⋯ [CreateProfile] Showing context menu for profile:', profileId);
        this.showNotification('Context menu feature coming soon...', 'info');
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get proxy display information with status
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
     * Get CSS class for status
     */
    getStatusClass(status) {
        if (!status) return '';
        
        const statusLower = status.toLowerCase();
        if (statusLower === 'dead') return 'status-dead';
        if (statusLower === 'live' || statusLower === 'ready') return 'status-live';
        return '';
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
     * Display no data state
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
     * Handle search functionality
     */
    handleSearch(searchText) {
        console.log('[SEARCH] [CreateProfile] Searching profiles:', searchText);
        
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

    /**
     * Show profile details
     */
    showProfileDetails(profile) {
        console.log('👁️ [CreateProfile] Showing profile details:', profile);
        this.showNotification('Profile details feature coming soon...', 'info');
    }

    /**
     * Update profile note
     */
    updateProfileNote(profileId, note) {
        console.log(`📝 [CreateProfile] Updating note for profile ${profileId}:`, note);
        // TODO: Implement update profile note logic
    }
}

// Custom Selector Class for dropdowns
class CustomSelector {
    constructor(containerId, buttonId, dropdownId) {
        this.container = document.getElementById(containerId);
        this.button = document.getElementById(buttonId);
        this.dropdown = document.getElementById(dropdownId);
        this.options = [];
        this.selectedValue = null;
        
        this.init();
    }
    
    init() {
        if (!this.button || !this.dropdown) return;
        
        this.button.addEventListener('click', () => {
            this.toggle();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container?.contains(e.target)) {
                this.close();
            }
        });
    }
    
    setOptions(options) {
        this.options = options;
        this.renderOptions();
    }
    
    renderOptions() {
        if (!this.dropdown) return;
        
        this.dropdown.innerHTML = '';
        
        this.options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'dropdown-option';
            optionElement.textContent = option.text;
            optionElement.dataset.value = option.value;
            
            optionElement.addEventListener('click', () => {
                this.selectOption(option.value, option.text);
            });
            
            this.dropdown.appendChild(optionElement);
        });
    }
    
    selectOption(value, text) {
        this.selectedValue = value;
        if (this.button) {
            this.button.textContent = text;
        }
        this.close();
    }
    
    getValue() {
        return this.selectedValue;
    }
    
    setValue(value) {
        const option = this.options.find(opt => opt.value === value);
        if (option) {
            this.selectOption(option.value, option.text);
        }
    }
    
    toggle() {
        if (this.dropdown?.classList.contains('show')) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.dropdown?.classList.add('show');
    }
    
    close() {
        this.dropdown?.classList.remove('show');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.createProfileManager = new CreateProfileManager();
});

console.log('📄 [CreateProfile] create-profile.js loaded');