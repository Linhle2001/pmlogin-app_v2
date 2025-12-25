/**
 * Profile Repository - Quản lý dữ liệu profile thật trên client
 * Client lưu tất cả profile, có thể chọn sync lên server
 */

const { getDatabase } = require('../database');
const { getSyncService } = require('../sync_service');

class ProfileRepository {
    constructor() {
        this.db = getDatabase();
        this.syncService = getSyncService();
    }

    // Helper function to safely parse proxy JSON
    _parseProxyData(proxyString) {
        if (!proxyString) return null;
        
        try {
            return JSON.parse(proxyString);
        } catch (error) {
            console.warn(`⚠️ Invalid JSON in proxy field:`, proxyString);
            // Nếu không parse được, coi như proxy string cũ
            return { type: 'custom', value: proxyString };
        }
    }

    // === Basic CRUD Operations ===

    async createProfile(profileData) {
        const { name, platform, note, proxy, owner_id } = profileData;
        
        const result = await this.db.run(
            `INSERT INTO profiles (name, platform, note, proxy, owner_id, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [name, platform, note, JSON.stringify(proxy), owner_id]
        );

        const profile = await this.getProfileById(result.id);
        
        // Sync profile counts sau khi tạo
        try {
            await this.syncService.syncProfileCounts();
        } catch (error) {
            console.warn('⚠️ Failed to sync profile counts after create:', error.message);
        }

        return profile;
    }

    async getProfileById(id) {
        const profile = await this.db.get(
            `SELECT p.*, 
                    GROUP_CONCAT(DISTINCT g.group_name) as groups,
                    GROUP_CONCAT(DISTINCT t.name) as tags
             FROM profiles p
             LEFT JOIN profile_group pg ON p.id = pg.profile_id
             LEFT JOIN groups g ON pg.group_id = g.id
             LEFT JOIN profile_tag pt ON p.id = pt.profile_id
             LEFT JOIN tags t ON pt.tag_id = t.id
             WHERE p.id = ?
             GROUP BY p.id`,
            [id]
        );

        if (profile) {
            profile.proxy = this._parseProxyData(profile.proxy);
            profile.groups = profile.groups ? profile.groups.split(',') : [];
            profile.tags = profile.tags ? profile.tags.split(',') : [];
        }

        return profile;
    }

    async getAllProfiles(owner_id = null) {
        let query = `
            SELECT p.*, 
                   GROUP_CONCAT(DISTINCT g.group_name) as groups,
                   GROUP_CONCAT(DISTINCT t.name) as tags
            FROM profiles p
            LEFT JOIN profile_group pg ON p.id = pg.profile_id
            LEFT JOIN groups g ON pg.group_id = g.id
            LEFT JOIN profile_tag pt ON p.id = pt.profile_id
            LEFT JOIN tags t ON pt.tag_id = t.id
        `;
        
        let params = [];
        if (owner_id) {
            query += ' WHERE p.owner_id = ?';
            params.push(owner_id);
        }
        
        query += ' GROUP BY p.id ORDER BY p.updated_at DESC';

        const profiles = await this.db.all(query, params);
        
        return profiles.map(profile => ({
            ...profile,
            proxy: this._parseProxyData(profile.proxy),
            groups: profile.groups ? profile.groups.split(',') : [],
            tags: profile.tags ? profile.tags.split(',') : []
        }));
    }

    async updateProfile(id, updateData) {
        const { name, platform, note, proxy, status } = updateData;
        
        await this.db.run(
            `UPDATE profiles 
             SET name = ?, platform = ?, note = ?, proxy = ?, status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name, platform, note, JSON.stringify(proxy), status, id]
        );

        const profile = await this.getProfileById(id);
        
        // Nếu profile được share, sync lên server
        if (profile && profile.shared_on_cloud) {
            try {
                await this.syncService.syncSingleProfile(id);
            } catch (error) {
                console.warn('⚠️ Failed to sync profile after update:', error.message);
            }
        }

        return profile;
    }

    async deleteProfile(id) {
        // Kiểm tra nếu profile được share, xóa khỏi server trước
        const profile = await this.getProfileById(id);
        if (profile && profile.shared_on_cloud) {
            try {
                await this.syncService.removeProfileFromServer(id);
            } catch (error) {
                console.warn('⚠️ Failed to remove profile from server:', error.message);
            }
        }

        const result = await this.db.run('DELETE FROM profiles WHERE id = ?', [id]);
        
        // Sync profile counts sau khi xóa
        try {
            await this.syncService.syncProfileCounts();
        } catch (error) {
            console.warn('⚠️ Failed to sync profile counts after delete:', error.message);
        }

        return result.changes > 0;
    }

    // === Cloud Sync Operations ===

    async shareProfileToCloud(id) {
        await this.db.run(
            'UPDATE profiles SET shared_on_cloud = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        try {
            await this.syncService.markProfileAsShared(id, true);
        } catch (error) {
            // Rollback nếu sync thất bại
            await this.db.run('UPDATE profiles SET shared_on_cloud = 0 WHERE id = ?', [id]);
            throw error;
        }

        return await this.getProfileById(id);
    }

    async unshareProfileFromCloud(id) {
        await this.db.run(
            'UPDATE profiles SET shared_on_cloud = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        try {
            await this.syncService.markProfileAsShared(id, false);
        } catch (error) {
            console.warn('⚠️ Failed to remove from server, but unshared locally:', error.message);
        }

        return await this.getProfileById(id);
    }

    async getSharedProfiles(owner_id = null) {
        let query = `
            SELECT p.*, 
                   GROUP_CONCAT(DISTINCT g.group_name) as groups,
                   GROUP_CONCAT(DISTINCT t.name) as tags
            FROM profiles p
            LEFT JOIN profile_group pg ON p.id = pg.profile_id
            LEFT JOIN groups g ON pg.group_id = g.id
            LEFT JOIN profile_tag pt ON p.id = pt.profile_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            WHERE p.shared_on_cloud = 1
        `;
        
        let params = [];
        if (owner_id) {
            query += ' AND p.owner_id = ?';
            params.push(owner_id);
        }
        
        query += ' GROUP BY p.id ORDER BY p.updated_at DESC';

        const profiles = await this.db.all(query, params);
        
        return profiles.map(profile => ({
            ...profile,
            proxy: this._parseProxyData(profile.proxy),
            groups: profile.groups ? profile.groups.split(',') : [],
            tags: profile.tags ? profile.tags.split(',') : []
        }));
    }

    // === Profile Status Management ===

    async updateProfileStatus(id, status) {
        await this.db.run(
            'UPDATE profiles SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        const profile = await this.getProfileById(id);
        
        // Sync nếu được share
        if (profile && profile.shared_on_cloud) {
            try {
                await this.syncService.syncSingleProfile(id);
            } catch (error) {
                console.warn('⚠️ Failed to sync status update:', error.message);
            }
        }

        return profile;
    }

    async markProfileAsStarted(id) {
        await this.db.run(
            `UPDATE profiles 
             SET status = 'Running', last_started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [id]
        );

        return await this.updateProfileStatus(id, 'Running');
    }

    async markProfileAsStopped(id) {
        return await this.updateProfileStatus(id, 'Ready');
    }

    // === Statistics ===

    async getProfileStats(owner_id = null) {
        let whereClause = owner_id ? 'WHERE owner_id = ?' : '';
        let params = owner_id ? [owner_id] : [];

        const [total, shared, running] = await Promise.all([
            this.db.get(`SELECT COUNT(*) as count FROM profiles ${whereClause}`, params),
            this.db.get(`SELECT COUNT(*) as count FROM profiles ${whereClause} ${whereClause ? 'AND' : 'WHERE'} shared_on_cloud = 1`, params),
            this.db.get(`SELECT COUNT(*) as count FROM profiles ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'Running'`, params)
        ]);

        return {
            total: total.count,
            shared: shared.count,
            running: running.count,
            local_only: total.count - shared.count
        };
    }

    // === Group and Tag Management ===

    async addProfileToGroup(profileId, groupName) {
        // Tạo group nếu chưa tồn tại
        let group = await this.db.get('SELECT id FROM groups WHERE group_name = ?', [groupName]);
        if (!group) {
            const result = await this.db.run(
                'INSERT INTO groups (group_name) VALUES (?)',
                [groupName]
            );
            group = { id: result.id };
        }

        // Thêm profile vào group
        await this.db.run(
            'INSERT OR IGNORE INTO profile_group (profile_id, group_id) VALUES (?, ?)',
            [profileId, group.id]
        );

        await this.db.run(
            'UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [profileId]
        );

        return await this.getProfileById(profileId);
    }

    async removeProfileFromGroup(profileId, groupName) {
        const group = await this.db.get('SELECT id FROM groups WHERE group_name = ?', [groupName]);
        if (group) {
            await this.db.run(
                'DELETE FROM profile_group WHERE profile_id = ? AND group_id = ?',
                [profileId, group.id]
            );

            await this.db.run(
                'UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [profileId]
            );
        }

        return await this.getProfileById(profileId);
    }

    async addTagToProfile(profileId, tagName) {
        // Tạo tag nếu chưa tồn tại
        let tag = await this.db.get('SELECT id FROM tags WHERE name = ?', [tagName]);
        if (!tag) {
            const result = await this.db.run(
                'INSERT INTO tags (name, created_at) VALUES (?, CURRENT_TIMESTAMP)',
                [tagName]
            );
            tag = { id: result.id };
        }

        // Thêm tag vào profile
        await this.db.run(
            'INSERT OR IGNORE INTO profile_tag (profile_id, tag_id) VALUES (?, ?)',
            [profileId, tag.id]
        );

        await this.db.run(
            'UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [profileId]
        );

        return await this.getProfileById(profileId);
    }

    async removeTagFromProfile(profileId, tagName) {
        const tag = await this.db.get('SELECT id FROM tags WHERE name = ?', [tagName]);
        if (tag) {
            await this.db.run(
                'DELETE FROM profile_tag WHERE profile_id = ? AND tag_id = ?',
                [profileId, tag.id]
            );

            await this.db.run(
                'UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [profileId]
            );
        }

        return await this.getProfileById(profileId);
    }

    // === Compatibility methods với code cũ ===

    async saveProfile(profileData) {
        return await this.createProfile(profileData);
    }

    async getLocalProfiles() {
        return await this.getAllProfiles();
    }

    async getCloudProfiles() {
        return await this.getSharedProfiles();
    }

    async getProfile(profileId) {
        return await this.getProfileById(profileId);
    }

    async profileNameExists(profileName) {
        const result = await this.db.get(
            'SELECT COUNT(*) as count FROM profiles WHERE name = ?',
            [profileName]
        );
        return result.count > 0;
    }

    async getProfileIdByName(profileName) {
        const result = await this.db.get(
            'SELECT id FROM profiles WHERE name = ?',
            [profileName]
        );
        return result ? result.id : null;
    }

    async getProfileTags(profileId) {
        const tags = await this.db.all(`
            SELECT tags.name
            FROM tags
            JOIN profile_tag ON profile_tag.tag_id = tags.id
            WHERE profile_tag.profile_id = ?
            ORDER BY tags.name
        `, [profileId]);

        return tags.map(row => row.name);
    }

    async getProfileGroups(profileId) {
        const groups = await this.db.all(`
            SELECT groups.group_name
            FROM groups
            JOIN profile_group ON profile_group.group_id = groups.id
            WHERE profile_group.profile_id = ?
            ORDER BY groups.group_name
        `, [profileId]);

        return groups.map(row => row.group_name);
    }

    async getAllGroups() {
        const groups = await this.db.all(
            'SELECT group_name FROM groups ORDER BY group_name'
        );
        return groups.map(row => row.group_name);
    }

    async getProfilesByGroup(groupName) {
        const profiles = await this.db.all(`
            SELECT DISTINCT p.*
            FROM profiles p
            JOIN profile_group pg ON p.id = pg.profile_id
            JOIN groups g ON pg.group_id = g.id
            WHERE g.group_name = ?
            ORDER BY p.name
        `, [groupName]);

        const result = [];
        for (const profile of profiles) {
            const tags = await this.getProfileTags(profile.id);
            const groups = await this.getProfileGroups(profile.id);
            
            result.push({
                ...profile,
                proxy: this._parseProxyData(profile.proxy),
                tags: tags,
                groups: groups,
                shared_on_cloud: Boolean(profile.shared_on_cloud)
            });
        }

        return result;
    }

    async assignProfilesToGroup(profileIds, groupName) {
        if (!Array.isArray(profileIds) || profileIds.length === 0) {
            return false;
        }

        // Tạo group nếu chưa tồn tại
        let group = await this.db.get('SELECT id FROM groups WHERE group_name = ?', [groupName]);
        if (!group) {
            const result = await this.db.run(
                'INSERT INTO groups (group_name) VALUES (?)',
                [groupName]
            );
            group = { id: result.id };
        }

        let assignedCount = 0;
        for (const profileId of profileIds) {
            try {
                await this.db.run(
                    'INSERT OR IGNORE INTO profile_group (profile_id, group_id) VALUES (?, ?)',
                    [profileId, group.id]
                );
                assignedCount++;
            } catch (error) {
                console.warn(`⚠️ Failed to assign profile ${profileId} to group:`, error.message);
            }
        }

        console.log(`✅ Assigned ${assignedCount} profiles to group '${groupName}'`);
        return assignedCount > 0;
    }
}

module.exports = ProfileRepository;
