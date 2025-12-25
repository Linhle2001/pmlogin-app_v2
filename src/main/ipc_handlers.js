const { ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

function setupIpcHandlers(appController) {
    // Database handlers
    const { getDatabaseManager } = require('./services/database_manager');
    const dbManager = getDatabaseManager();

    // Initialize database on startup
    dbManager.initialize().catch(console.error);

    // Database stats
    ipcMain.handle('db:stats', async (event) => {
        try {
            const stats = await dbManager.getStats();
            return { success: true, data: stats };
        } catch (error) {
            console.error('Database stats error:', error);
            return { success: false, message: 'Lỗi khi lấy thống kê database' };
        }
    });

    // Database test
    ipcMain.handle('db:test', async (event) => {
        try {
            const { testDatabase } = require('./services/database_test');
            await testDatabase();
            return { success: true, message: 'Database test completed' };
        } catch (error) {
            console.error('Database test error:', error);
            return { success: false, message: 'Database test failed' };
        }
    });

    // Proxy database handlers
    ipcMain.handle('db:proxy:add', async (event, proxyData) => {
        try {
            const proxyId = await dbManager.addProxy(proxyData);
            return { success: true, data: { id: proxyId } };
        } catch (error) {
            console.error('Database add proxy error:', error);
            return { success: false, message: 'Lỗi khi thêm proxy vào database' };
        }
    });

    ipcMain.handle('db:proxy:get-all', async (event, tagId = null) => {
        try {
            const proxies = await dbManager.getAllProxies(tagId);
            return { success: true, data: proxies };
        } catch (error) {
            console.error('Database get proxies error:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách proxy từ database' };
        }
    });

    ipcMain.handle('db:proxy:get-live', async (event) => {
        try {
            const proxies = await dbManager.getLiveProxies();
            return { success: true, data: proxies };
        } catch (error) {
            console.error('Database get live proxies error:', error);
            return { success: false, message: 'Lỗi khi lấy proxy live từ database' };
        }
    });

    ipcMain.handle('db:proxy:update-status', async (event, host, port, status, failCount = 0, proxyType = null) => {
        try {
            const result = await dbManager.updateProxyStatus(host, port, status, failCount, proxyType);
            return { success: result };
        } catch (error) {
            console.error('Database update proxy status error:', error);
            return { success: false, message: 'Lỗi khi cập nhật trạng thái proxy' };
        }
    });

    ipcMain.handle('db:proxy:delete', async (event, host, port) => {
        try {
            const result = await dbManager.deleteProxy(host, port);
            return { success: result };
        } catch (error) {
            console.error('Database delete proxy error:', error);
            return { success: false, message: 'Lỗi khi xóa proxy từ database' };
        }
    });

    ipcMain.handle('db:proxy:bulk-add', async (event, proxiesList) => {
        try {
            const results = await dbManager.bulkAddProxies(proxiesList);
            const successCount = results.filter(r => r !== null).length;
            return { 
                success: true, 
                data: { 
                    results, 
                    successCount, 
                    totalCount: proxiesList.length 
                } 
            };
        } catch (error) {
            console.error('Database bulk add proxies error:', error);
            return { success: false, message: 'Lỗi khi thêm nhiều proxy vào database' };
        }
    });

    // Authentication handlers
    ipcMain.handle('auth:login', async (event, credentials) => {
        try {
            console.log('🔐 Attempting real server login for:', credentials.email);
            
            // Generate HWID
            const hwidUtils = require('./services/hwid_utils');
            const hwid = await hwidUtils.getHardwareId();
            console.log('🔧 Hardware ID:', hwid.substring(0, 16) + '...');
            
            // Call real API
            const apiClient = require('./services/api_client');
            const result = await apiClient.login(credentials.email, credentials.password, hwid);
            
            if (result.success) {
                // Save user data to app controller
                appController.setUserData(result.data.user, result.data.access_token || result.data.token);
                
                // Save session to API client and file
                apiClient.saveSessionToFile();
                
                console.log('[SUCCESS] Login successful for:', result.data.user.email);
                
                // Navigate to main page after successful login
                setTimeout(() => {
                    appController.loadMainPage();
                }, 1000);
            } else {
                console.log('[ERROR] Login failed:', result.message);
                
                // If server is offline, suggest demo mode
                if (result.offline) {
                    return {
                        success: false,
                        message: 'Server không khả dụng. Vui lòng sử dụng demo@pmlogin.com để test giao diện.',
                        offline: true
                    };
                }
            }
            
            return result;
        } catch (error) {
            console.error('[ERROR] Login error:', error);
            return {
                success: false,
                message: `Lỗi kết nối: ${error.message}`,
                offline: true
            };
        }
    });

    // Demo login handler
    ipcMain.handle('auth:login-demo', async (event, demoUserData) => {
        try {
            console.log('[DEMO] Processing demo login...');
            
            // Save demo user data to app controller
            appController.setUserData(demoUserData.user, 'demo-token-123');
            
            // Save demo session to file
            const sessionData = {
                success: true,
                data: {
                    user: demoUserData.user,
                    access_token: 'demo-token-123'
                },
                timestamp: new Date().toISOString(),
                isDemo: true
            };
            
            const storageDir = path.join(__dirname, '../../storage');
            if (!fs.existsSync(storageDir)) {
                fs.mkdirSync(storageDir, { recursive: true });
            }
            
            const sessionFile = path.join(storageDir, 'login_result.json');
            fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2), 'utf8');
            
            console.log('[SUCCESS] Demo login successful');
            console.log('💾 Demo session saved to:', sessionFile);
            
            // Navigate to main page
            setTimeout(() => {
                appController.loadMainPage();
            }, 1000);
            
            return { success: true, data: sessionData.data };
        } catch (error) {
            console.error('[ERROR] Demo login error:', error);
            return {
                success: false,
                message: `Lỗi demo login: ${error.message}`
            };
        }
    });

    ipcMain.handle('auth:logout', async (event) => {
        try {
            console.log('🚪 Logging out user');
            
            // Clear API client session
            const apiClient = require('./services/api_client');
            apiClient.clearSession();
            apiClient.clearSessionFile();
            
            // Clear app controller data
            appController.clearUserData();
            
            // Navigate to login page
            appController.loadLoginPage();
            
            return { success: true };
        } catch (error) {
            console.error('[ERROR] Logout error:', error);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('auth:change-password', async (event, passwordData) => {
        try {
            const apiClient = require('./services/api_client');
            
            if (!apiClient.isAuthenticated()) {
                return { success: false, message: 'Không tìm thấy phiên đăng nhập' };
            }

            const result = await apiClient.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            );

            if (result.success) {
                // Logout after password change
                setTimeout(() => {
                    appController.loadLoginPage();
                }, 2000);
            }

            return result;
        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, message: 'Lỗi khi đổi mật khẩu' };
        }
    });

    // User data handlers
    ipcMain.handle('user:get-data', async (event) => {
        return {
            user: appController.getUserData(),
            token: appController.getToken()
        };
    });

    // Navigation handlers
    ipcMain.handle('nav:to-main', async (event) => {
        appController.loadMainPage();
        return { success: true };
    });

    ipcMain.handle('nav:to-login', async (event) => {
        appController.loadLoginPage();
        return { success: true };
    });

    // System handlers
    ipcMain.handle('system:info', async (event) => {
        const hwidUtils = require('./services/hwid_utils');
        const hwid = await hwidUtils.getHardwareId();
        
        return {
            version: appController.version,
            hwid: hwid,
            platform: process.platform,
            arch: process.arch,
            systemInfo: hwidUtils.getSystemInfo()
        };
    });

    ipcMain.handle('system:check-updates', async (event) => {
        return await appController.checkForUpdates();
    });

    // Proxy management handlers
    ipcMain.handle('proxy:get-all', async (event, options = {}) => {
        try {
            const proxyManager = require('./services/proxy_mgr');
            return await proxyManager.getAllProxies(options);
        } catch (error) {
            console.error('Get proxies error:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách proxy' };
        }
    });

    ipcMain.handle('proxy:add', async (event, proxyData) => {
        try {
            const proxyManager = require('./services/proxy_mgr');
            return await proxyManager.addProxy(proxyData);
        } catch (error) {
            console.error('Add proxy error:', error);
            return { success: false, message: 'Lỗi khi thêm proxy' };
        }
    });

    ipcMain.handle('proxy:update', async (event, id, proxyData) => {
        try {
            const proxyManager = require('./services/proxy_mgr');
            return await proxyManager.updateProxy(id, proxyData);
        } catch (error) {
            console.error('Update proxy error:', error);
            return { success: false, message: 'Lỗi khi cập nhật proxy' };
        }
    });

    ipcMain.handle('proxy:delete-multiple', async (event, ids) => {
        try {
            const proxyManager = require('./services/proxy_mgr');
            return await proxyManager.deleteProxies(ids);
        } catch (error) {
            console.error('Delete proxies error:', error);
            return { success: false, message: 'Lỗi khi xóa proxy' };
        }
    });

    ipcMain.handle('proxy:test', async (event, proxyData) => {
        try {
            const proxyManager = require('./services/proxy_mgr');
            return await proxyManager.testProxy(proxyData);
        } catch (error) {
            console.error('Test proxy error:', error);
            return { success: false, message: 'Lỗi khi test proxy' };
        }
    });

    ipcMain.handle('proxy:test-multiple', async (event, proxyIds, progressCallback) => {
        try {
            const proxyManager = require('./services/proxy_mgr');
            
            // Wrapper để gửi progress về renderer
            const wrappedCallback = (current, total, result) => {
                event.sender.send('proxy:test-progress', { current, total, result });
                if (progressCallback) progressCallback(current, total, result);
            };
            
            return await proxyManager.testProxies(proxyIds, wrappedCallback);
        } catch (error) {
            console.error('Test proxies error:', error);
            return { success: false, message: 'Lỗi khi test proxy' };
        }
    });

    ipcMain.handle('proxy:import', async (event, proxyText, tags) => {
        try {
            const proxyManager = require('./services/proxy_mgr');
            return await proxyManager.importProxies(proxyText, tags);
        } catch (error) {
            console.error('Import proxies error:', error);
            return { success: false, message: 'Lỗi khi import proxy' };
        }
    });

    ipcMain.handle('proxy:export', async (event, format = 'json') => {
        try {
            const proxyManager = require('./services/proxy_mgr');
            return await proxyManager.exportProxies(format);
        } catch (error) {
            console.error('Export proxies error:', error);
            return { success: false, message: 'Lỗi khi export proxy' };
        }
    });

    ipcMain.handle('proxy:copy-selected', async (event, proxyIds) => {
        try {
            const proxyManager = require('./services/proxy_mgr');
            const proxies = proxyManager.proxies.filter(p => proxyIds.includes(p.id));
            
            const proxyLines = proxies.map(proxy => {
                const auth = proxy.username && proxy.password ? 
                    `${proxy.username}:${proxy.password}@` : '';
                return `${proxy.type}://${auth}${proxy.host}:${proxy.port}`;
            });
            
            return {
                success: true,
                data: proxyLines.join('\n')
            };
        } catch (error) {
            console.error('Copy proxies error:', error);
            return { success: false, message: 'Lỗi khi copy proxy' };
        }
    });

    // Tag handlers
    ipcMain.handle('db:tag:get-all', async (event) => {
        try {
            const tags = await dbManager.getAllTags();
            return { success: true, data: tags };
        } catch (error) {
            console.error('Database get tags error:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách tag' };
        }
    });

    ipcMain.handle('db:tag:create', async (event, tagName) => {
        try {
            const tagId = await dbManager.createTag(tagName);
            return { success: true, data: { id: tagId } };
        } catch (error) {
            console.error('Database create tag error:', error);
            return { success: false, message: 'Lỗi khi tạo tag' };
        }
    });

    // Group handlers
    ipcMain.handle('db:group:get-all', async (event) => {
        try {
            const groups = await dbManager.getAllGroups();
            return { success: true, data: groups };
        } catch (error) {
            console.error('Database get groups error:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách group', error: error.message };
        }
    });

    ipcMain.handle('db:group:create', async (event, groupName) => {
        try {
            const groupId = await dbManager.createGroup(groupName);
            return { success: true, data: { id: groupId } };
        } catch (error) {
            console.error('Database create group error:', error);
            return { success: false, message: error.message || 'Lỗi khi tạo group' };
        }
    });

    ipcMain.handle('db:group:get-profiles', async (event, groupName) => {
        try {
            const profiles = await dbManager.getProfilesByGroup(groupName);
            return { success: true, data: profiles };
        } catch (error) {
            console.error('Database get profiles by group error:', error);
            return { success: false, message: 'Lỗi khi lấy profiles theo group' };
        }
    });

    ipcMain.handle('db:group:assign-profiles', async (event, profileIds, groupName) => {
        try {
            const result = await dbManager.assignProfilesToGroup(profileIds, groupName);
            return { success: true, data: result };
        } catch (error) {
            console.error('Database assign profiles to group error:', error);
            return { success: false, message: 'Lỗi khi assign profiles vào group' };
        }
    });

    ipcMain.handle('db:group:remove-profile', async (event, profileId, groupName) => {
        try {
            const result = await dbManager.removeProfileFromGroup(profileId, groupName);
            return { success: result };
        } catch (error) {
            console.error('Database remove profile from group error:', error);
            return { success: false, message: 'Lỗi khi remove profile khỏi group' };
        }
    });

    ipcMain.handle('db:group:get-stats', async (event) => {
        try {
            const stats = await dbManager.getGroupStats();
            return { success: true, data: stats };
        } catch (error) {
            console.error('Database get group stats error:', error);
            return { success: false, message: 'Lỗi khi lấy thống kê group' };
        }
    });

    ipcMain.handle('db:group:get-profile-count', async (event, groupName) => {
        try {
            const count = await dbManager.getProfileCountForGroup(groupName);
            return { success: true, data: { count } };
        } catch (error) {
            console.error('Database get profile count for group error:', error);
            return { success: false, message: 'Lỗi khi lấy số lượng profile trong group' };
        }
    });

    ipcMain.handle('db:group:delete', async (event, groupName) => {
        try {
            const result = await dbManager.deleteGroup(groupName);
            return { success: result };
        } catch (error) {
            console.error('Database delete group error:', error);
            return { success: false, message: error.message || 'Lỗi khi xóa group' };
        }
    });

    ipcMain.handle('db:group:update', async (event, groupId, newGroupName) => {
        try {
            const result = await dbManager.updateGroup(groupId, newGroupName);
            return { success: result };
        } catch (error) {
            console.error('Database update group error:', error);
            return { success: false, message: error.message || 'Lỗi khi cập nhật group' };
        }
    });

    // Profile database handlers
    ipcMain.handle('db:profile:add', async (event, profileData) => {
        try {
            const profileId = await dbManager.addProfile(profileData);
            return { success: true, data: { id: profileId } };
        } catch (error) {
            console.error('Database add profile error:', error);
            return { success: false, message: 'Lỗi khi thêm profile vào database' };
        }
    });

    ipcMain.handle('db:profile:get-all', async (event) => {
        try {
            const profiles = await dbManager.getAllProfiles();
            return { success: true, data: profiles };
        } catch (error) {
            console.error('Database get profiles error:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách profile từ database' };
        }
    });

    ipcMain.handle('db:profile:get-local', async (event) => {
        try {
            const profiles = await dbManager.getLocalProfiles();
            return { success: true, data: profiles };
        } catch (error) {
            console.error('Database get local profiles error:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách profile local từ database' };
        }
    });

    ipcMain.handle('db:profile:get-cloud', async (event) => {
        try {
            const profiles = await dbManager.getCloudProfiles();
            return { success: true, data: profiles };
        } catch (error) {
            console.error('Database get cloud profiles error:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách profile cloud từ database' };
        }
    });

    // Legacy profile management handlers (for backward compatibility)
    ipcMain.handle('profile:get-all', async (event) => {
        try {
            const profiles = await dbManager.getAllProfiles();
            return { success: true, data: profiles };
        } catch (error) {
            console.error('Get profiles error:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách profile' };
        }
    });

    ipcMain.handle('profile:add', async (event, profileData) => {
        try {
            const profileId = await dbManager.addProfile(profileData);
            return { success: true, data: { id: profileId, ...profileData } };
        } catch (error) {
            console.error('Add profile error:', error);
            return { success: false, message: 'Lỗi khi thêm profile' };
        }
    });

    // Create profile handler for create-profile.js
    ipcMain.handle('create-profile', async (event, profileData) => {
        try {
            console.log('🔧 Creating new profile:', profileData);
            
            // Prepare profile data for database
            const dbProfileData = {
                name: profileData.name,
                platform: profileData.platform || 'windows',
                note: profileData.note || '',
                proxy: JSON.stringify(profileData.proxy || { type: 'none' }),
                status: 'Ready',
                updated_at: new Date().toISOString(),
                last_started_at: null,
                shared_on_cloud: profileData.shareOnCloud || false,
                tags: profileData.tags || [],
                groups: profileData.groups || []
            };
            
            const profileId = await dbManager.addProfile(dbProfileData);
            
            if (profileId) {
                console.log('✅ Profile created successfully with ID:', profileId);
                
                // Assign to group if specified
                if (profileData.group && profileData.group.trim()) {
                    try {
                        await dbManager.assignProfilesToGroup([profileId], profileData.group.trim());
                        console.log(`✅ Profile assigned to group: ${profileData.group}`);
                    } catch (error) {
                        console.warn('⚠️ Failed to assign profile to group:', error.message);
                    }
                }
                
                // Add tags if specified
                if (profileData.tags && profileData.tags.trim()) {
                    const tagNames = profileData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                    for (const tagName of tagNames) {
                        try {
                            await dbManager.addTagToProfile(profileId, tagName);
                            console.log(`✅ Tag '${tagName}' added to profile`);
                        } catch (error) {
                            console.warn(`⚠️ Failed to add tag '${tagName}':`, error.message);
                        }
                    }
                }
                
                return { 
                    success: true, 
                    data: { 
                        id: profileId, 
                        ...dbProfileData 
                    } 
                };
            } else {
                return { success: false, message: 'Lỗi khi tạo profile' };
            }
        } catch (error) {
            console.error('Create profile error:', error);
            return { success: false, message: `Lỗi khi tạo profile: ${error.message}` };
        }
    });

    // Get single profile handler
    ipcMain.handle('get-profile', async (event, profileId) => {
        try {
            const profile = await dbManager.getProfile(profileId);
            if (profile) {
                return { success: true, data: profile };
            } else {
                return { success: false, message: 'Profile không tồn tại' };
            }
        } catch (error) {
            console.error('Get profile error:', error);
            return { success: false, message: 'Lỗi khi lấy thông tin profile' };
        }
    });

    // Update profile handler
    ipcMain.handle('update-profile', async (event, profileData) => {
        try {
            console.log('🔧 Updating profile:', profileData);
            
            const updates = {
                name: profileData.name,
                platform: profileData.platform || 'windows',
                note: profileData.note || '',
                proxy: JSON.stringify(profileData.proxy || { type: 'none' }),
                updated_at: new Date().toISOString()
            };
            
            const success = await dbManager.updateProfile(profileData.id, updates);
            
            if (success) {
                console.log('✅ Profile updated successfully');
                return { success: true, data: { id: profileData.id, ...updates } };
            } else {
                return { success: false, message: 'Lỗi khi cập nhật profile' };
            }
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, message: `Lỗi khi cập nhật profile: ${error.message}` };
        }
    });

    // File operation handlers
    ipcMain.handle('file:select', async (event, options) => {
        try {
            const result = await dialog.showOpenDialog(appController.mainWindow, options);
            return result;
        } catch (error) {
            console.error('File select error:', error);
            return { canceled: true };
        }
    });

    ipcMain.handle('file:save', async (event, options) => {
        try {
            const result = await dialog.showSaveDialog(appController.mainWindow, options);
            return result;
        } catch (error) {
            console.error('File save error:', error);
            return { canceled: true };
        }
    });

    // Notification handler
    ipcMain.handle('notification:show', async (event, title, body) => {
        try {
            if (Notification.isSupported()) {
                new Notification({ title, body }).show();
            }
            return { success: true };
        } catch (error) {
            console.error('Notification error:', error);
            return { success: false };
        }
    });
}

module.exports = { setupIpcHandlers };