/**
 * Sync Service - Đồng bộ dữ liệu giữa client và server
 * Client lưu tất cả profile, chỉ sync lên server khi shared_on_cloud=1
 */

const { getDatabase } = require('./database');
const axios = require('axios');

class SyncService {
    constructor() {
        this.db = getDatabase();
        this.serverUrl = process.env.SERVER_URL || 'http://localhost:8000';
        this.authToken = null;
    }

    // === Authentication ===
    
    setAuthToken(token) {
        this.authToken = token;
    }

    getAuthHeaders() {
        return this.authToken ? {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }

    // === Profile Count Sync ===
    
    async syncProfileCounts() {
        try {
            // Đếm tổng số profile
            const totalResult = await this.db.get('SELECT COUNT(*) as count FROM profiles');
            const totalProfiles = totalResult.count;

            // Đếm số profile được share
            const sharedResult = await this.db.get('SELECT COUNT(*) as count FROM profiles WHERE shared_on_cloud = 1');
            const sharedProfiles = sharedResult.count;

            // Gửi thống kê lên server
            const response = await axios.post(
                `${this.serverUrl}/api/profiles/sync-stats`,
                {
                    total_profiles: totalProfiles,
                    shared_profiles: sharedProfiles
                },
                { headers: this.getAuthHeaders() }
            );

            console.log('✅ Profile counts synced:', { totalProfiles, sharedProfiles });
            return response.data;

        } catch (error) {
            console.error('❌ Failed to sync profile counts:', error.message);
            throw error;
        }
    }

    // === Shared Profile Sync ===
    
    async syncSharedProfiles() {
        try {
            // Lấy tất cả profile được share
            const sharedProfiles = await this.db.all(`
                SELECT p.*, 
                       GROUP_CONCAT(DISTINCT g.group_name) as groups,
                       GROUP_CONCAT(DISTINCT t.name) as tags
                FROM profiles p
                LEFT JOIN profile_group pg ON p.id = pg.profile_id
                LEFT JOIN groups g ON pg.group_id = g.id
                LEFT JOIN profile_tag pt ON p.id = pt.profile_id
                LEFT JOIN tags t ON pt.tag_id = t.id
                WHERE p.shared_on_cloud = 1
                GROUP BY p.id
            `);

            if (sharedProfiles.length === 0) {
                console.log('📝 No shared profiles to sync');
                return { synced: 0, results: [] };
            }

            // Chuẩn bị dữ liệu để gửi lên server
            const profilesData = sharedProfiles.map(profile => ({
                id: profile.id,
                name: profile.name,
                platform: profile.platform,
                note: profile.note,
                proxy: profile.proxy ? JSON.parse(profile.proxy) : null,
                status: profile.status,
                last_started_at: profile.last_started_at,
                groups: profile.groups ? profile.groups.split(',') : [],
                tags: profile.tags ? profile.tags.split(',') : []
            }));

            // Gửi lên server
            const response = await axios.post(
                `${this.serverUrl}/api/profiles/sync-shared`,
                { profiles: profilesData },
                { headers: this.getAuthHeaders() }
            );

            // Cập nhật thông tin sync trên client
            for (const result of response.data.results) {
                if (result.status === 'success') {
                    await this.db.run(`
                        UPDATE profiles 
                        SET server_sync_id = ?, 
                            last_synced_at = CURRENT_TIMESTAMP,
                            sync_version = sync_version + 1
                        WHERE id = ?
                    `, [result.server_id, result.client_profile_id]);
                }
            }

            console.log(`✅ Synced ${profilesData.length} shared profiles`);
            return response.data;

        } catch (error) {
            console.error('❌ Failed to sync shared profiles:', error.message);
            throw error;
        }
    }

    // === Profile Management ===
    
    async markProfileAsShared(profileId, shared = true) {
        try {
            await this.db.run(
                'UPDATE profiles SET shared_on_cloud = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [shared ? 1 : 0, profileId]
            );

            if (shared) {
                // Sync profile lên server ngay lập tức
                await this.syncSingleProfile(profileId);
            } else {
                // Xóa profile khỏi server
                await this.removeProfileFromServer(profileId);
            }

            // Cập nhật thống kê
            await this.syncProfileCounts();

            console.log(`✅ Profile ${profileId} ${shared ? 'shared to' : 'removed from'} cloud`);

        } catch (error) {
            console.error(`❌ Failed to ${shared ? 'share' : 'unshare'} profile:`, error.message);
            throw error;
        }
    }

    async syncSingleProfile(profileId) {
        try {
            const profile = await this.db.get(`
                SELECT p.*, 
                       GROUP_CONCAT(DISTINCT g.group_name) as groups,
                       GROUP_CONCAT(DISTINCT t.name) as tags
                FROM profiles p
                LEFT JOIN profile_group pg ON p.id = pg.profile_id
                LEFT JOIN groups g ON pg.group_id = g.id
                LEFT JOIN profile_tag pt ON p.id = pt.profile_id
                LEFT JOIN tags t ON pt.tag_id = t.id
                WHERE p.id = ?
                GROUP BY p.id
            `, [profileId]);

            if (!profile) {
                throw new Error('Profile not found');
            }

            const profileData = {
                id: profile.id,
                name: profile.name,
                platform: profile.platform,
                note: profile.note,
                proxy: profile.proxy ? JSON.parse(profile.proxy) : null,
                status: profile.status,
                last_started_at: profile.last_started_at,
                groups: profile.groups ? profile.groups.split(',') : [],
                tags: profile.tags ? profile.tags.split(',') : []
            };

            const response = await axios.post(
                `${this.serverUrl}/api/profiles/sync-single`,
                profileData,
                { headers: this.getAuthHeaders() }
            );

            // Cập nhật thông tin sync
            await this.db.run(`
                UPDATE profiles 
                SET server_sync_id = ?, 
                    last_synced_at = CURRENT_TIMESTAMP,
                    sync_version = sync_version + 1
                WHERE id = ?
            `, [response.data.server_id, profileId]);

            return response.data;

        } catch (error) {
            console.error('❌ Failed to sync single profile:', error.message);
            throw error;
        }
    }

    async removeProfileFromServer(profileId) {
        try {
            const profile = await this.db.get('SELECT server_sync_id FROM profiles WHERE id = ?', [profileId]);
            
            if (profile && profile.server_sync_id) {
                await axios.delete(
                    `${this.serverUrl}/api/profiles/shared/${profileId}`,
                    { headers: this.getAuthHeaders() }
                );

                // Xóa thông tin sync trên client
                await this.db.run(`
                    UPDATE profiles 
                    SET server_sync_id = NULL, 
                        last_synced_at = NULL,
                        sync_version = 1
                    WHERE id = ?
                `, [profileId]);
            }

        } catch (error) {
            console.error('❌ Failed to remove profile from server:', error.message);
            throw error;
        }
    }

    // === Full Sync ===
    
    async performFullSync() {
        try {
            console.log('🔄 Starting full sync...');
            
            // 1. Sync profile counts
            await this.syncProfileCounts();
            
            // 2. Sync shared profiles
            await this.syncSharedProfiles();
            
            // 3. Lấy thông tin tóm tắt từ server
            const response = await axios.get(
                `${this.serverUrl}/api/profiles/sync-summary`,
                { headers: this.getAuthHeaders() }
            );

            console.log('✅ Full sync completed');
            return response.data;

        } catch (error) {
            console.error('❌ Full sync failed:', error.message);
            throw error;
        }
    }

    // === Sync Status ===
    
    async getSyncStatus() {
        try {
            const totalProfiles = await this.db.get('SELECT COUNT(*) as count FROM profiles');
            const sharedProfiles = await this.db.get('SELECT COUNT(*) as count FROM profiles WHERE shared_on_cloud = 1');
            const syncedProfiles = await this.db.get('SELECT COUNT(*) as count FROM profiles WHERE server_sync_id IS NOT NULL');
            const lastSync = await this.db.get('SELECT MAX(last_synced_at) as last_sync FROM profiles WHERE last_synced_at IS NOT NULL');

            return {
                total_profiles: totalProfiles.count,
                shared_profiles: sharedProfiles.count,
                synced_profiles: syncedProfiles.count,
                last_sync_at: lastSync.last_sync,
                sync_pending: sharedProfiles.count - syncedProfiles.count
            };

        } catch (error) {
            console.error('❌ Failed to get sync status:', error.message);
            throw error;
        }
    }
}

// Singleton instance
let syncServiceInstance = null;

function getSyncService() {
    if (!syncServiceInstance) {
        syncServiceInstance = new SyncService();
    }
    return syncServiceInstance;
}

module.exports = {
    SyncService,
    getSyncService
};