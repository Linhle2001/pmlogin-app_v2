/**
 * Group Repository - Quản lý dữ liệu groups thật từ database
 * Chỉ lưu trên client, không sync lên server
 */

const { getDatabase } = require('../database');

class GroupRepository {
    constructor() {
        this.db = getDatabase();
    }

    // === Basic CRUD Operations ===

    async createGroup(groupName) {
        if (!groupName || typeof groupName !== 'string' || groupName.trim() === '') {
            throw new Error('Group name is required');
        }

        const trimmedName = groupName.trim();
        
        try {
            // Kiểm tra xem group đã tồn tại chưa
            const existing = await this.db.get(
                'SELECT id FROM groups WHERE group_name = ?',
                [trimmedName]
            );

            if (existing) {
                throw new Error(`Group '${trimmedName}' already exists`);
            }

            // Tạo group mới
            const result = await this.db.run(
                'INSERT INTO groups (group_name) VALUES (?)',
                [trimmedName]
            );

            console.log(`✅ Created group '${trimmedName}' with ID: ${result.id}`);
            return result.id;

        } catch (error) {
            console.error('❌ Error creating group:', error);
            throw error;
        }
    }

    async getAllGroups() {
        try {
            const groups = await this.db.all(
                'SELECT id, group_name FROM groups ORDER BY group_name ASC'
            );
            
            return groups.map(row => ({
                id: row.id,
                group_name: row.group_name
            }));
        } catch (error) {
            console.error('Error getting all groups:', error);
            return [];
        }
    }

    async getGroupById(id) {
        try {
            const group = await this.db.get(
                'SELECT * FROM groups WHERE id = ?',
                [id]
            );
            
            return group;
        } catch (error) {
            console.error('❌ Error getting group by ID:', error);
            return null;
        }
    }

    async getGroupByName(groupName) {
        try {
            const group = await this.db.get(
                'SELECT * FROM groups WHERE group_name = ?',
                [groupName]
            );
            
            return group;
        } catch (error) {
            console.error('❌ Error getting group by name:', error);
            return null;
        }
    }

    async updateGroup(id, newGroupName) {
        if (!newGroupName || typeof newGroupName !== 'string' || newGroupName.trim() === '') {
            throw new Error('Group name is required');
        }

        const trimmedName = newGroupName.trim();

        try {
            // Kiểm tra xem tên mới đã tồn tại chưa (trừ group hiện tại)
            const existing = await this.db.get(
                'SELECT id FROM groups WHERE group_name = ? AND id != ?',
                [trimmedName, id]
            );

            if (existing) {
                throw new Error(`Group '${trimmedName}' already exists`);
            }

            const result = await this.db.run(
                'UPDATE groups SET group_name = ? WHERE id = ?',
                [trimmedName, id]
            );

            if (result.changes > 0) {
                console.log(`✅ Updated group ID ${id} to '${trimmedName}'`);
                return true;
            } else {
                throw new Error('Group not found');
            }

        } catch (error) {
            console.error('❌ Error updating group:', error);
            throw error;
        }
    }

    async deleteGroup(groupName) {
        try {
            // Lấy group ID
            const group = await this.getGroupByName(groupName);
            if (!group) {
                throw new Error(`Group '${groupName}' not found`);
            }

            // Xóa tất cả liên kết profile-group trước
            await this.db.run(
                'DELETE FROM profile_group WHERE group_id = ?',
                [group.id]
            );

            // Xóa group
            const result = await this.db.run(
                'DELETE FROM groups WHERE id = ?',
                [group.id]
            );

            if (result.changes > 0) {
                console.log(`✅ Deleted group '${groupName}' and all its profile associations`);
                return true;
            } else {
                throw new Error('Failed to delete group');
            }

        } catch (error) {
            console.error('❌ Error deleting group:', error);
            throw error;
        }
    }

    // === Profile-Group Relations ===

    async addProfileToGroup(profileId, groupName) {
        try {
            // Tạo group nếu chưa tồn tại
            let group = await this.getGroupByName(groupName);
            if (!group) {
                const groupId = await this.createGroup(groupName);
                group = { id: groupId, group_name: groupName };
            }

            // Kiểm tra xem profile đã có trong group chưa
            const existing = await this.db.get(
                'SELECT COUNT(*) as count FROM profile_group WHERE profile_id = ? AND group_id = ?',
                [profileId, group.id]
            );

            if (existing.count > 0) {
                console.log(`ℹ️ Profile ${profileId} already in group '${groupName}'`);
                return true;
            }

            // Thêm profile vào group
            await this.db.run(
                'INSERT INTO profile_group (profile_id, group_id) VALUES (?, ?)',
                [profileId, group.id]
            );

            console.log(`✅ Added profile ${profileId} to group '${groupName}'`);
            return true;

        } catch (error) {
            console.error('❌ Error adding profile to group:', error);
            throw error;
        }
    }

    async removeProfileFromGroup(profileId, groupName) {
        try {
            const group = await this.getGroupByName(groupName);
            if (!group) {
                throw new Error(`Group '${groupName}' not found`);
            }

            const result = await this.db.run(
                'DELETE FROM profile_group WHERE profile_id = ? AND group_id = ?',
                [profileId, group.id]
            );

            if (result.changes > 0) {
                console.log(`✅ Removed profile ${profileId} from group '${groupName}'`);
                return true;
            } else {
                console.log(`ℹ️ Profile ${profileId} was not in group '${groupName}'`);
                return false;
            }

        } catch (error) {
            console.error('❌ Error removing profile from group:', error);
            throw error;
        }
    }

    async assignProfilesToGroup(profileIds, groupName) {
        if (!Array.isArray(profileIds) || profileIds.length === 0) {
            throw new Error('Profile IDs array is required');
        }

        try {
            // Tạo group nếu chưa tồn tại
            let group = await this.getGroupByName(groupName);
            if (!group) {
                const groupId = await this.createGroup(groupName);
                group = { id: groupId, group_name: groupName };
            }

            let assignedCount = 0;
            let skippedCount = 0;

            for (const profileId of profileIds) {
                try {
                    // Kiểm tra xem profile đã có trong group chưa
                    const existing = await this.db.get(
                        'SELECT COUNT(*) as count FROM profile_group WHERE profile_id = ? AND group_id = ?',
                        [profileId, group.id]
                    );

                    if (existing.count > 0) {
                        skippedCount++;
                        console.log(`ℹ️ Profile ${profileId} already in group '${groupName}', skipped`);
                    } else {
                        await this.db.run(
                            'INSERT INTO profile_group (profile_id, group_id) VALUES (?, ?)',
                            [profileId, group.id]
                        );
                        assignedCount++;
                    }
                } catch (error) {
                    console.error(`❌ Error assigning profile ${profileId} to group:`, error);
                    skippedCount++;
                }
            }

            console.log(`✅ Assigned ${assignedCount} profiles to group '${groupName}' (skipped ${skippedCount} duplicates)`);
            return { assigned: assignedCount, skipped: skippedCount };

        } catch (error) {
            console.error('❌ Error assigning profiles to group:', error);
            throw error;
        }
    }

    async getProfilesByGroup(groupName) {
        try {
            const profiles = await this.db.all(`
                SELECT DISTINCT p.id, p.name, p.platform, p.note, p.proxy, 
                       p.status, p.shared_on_cloud, p.updated_at, p.last_started_at,
                       GROUP_CONCAT(DISTINCT t.name) as tags
                FROM profiles p
                JOIN profile_group pg ON p.id = pg.profile_id
                JOIN groups g ON pg.group_id = g.id
                LEFT JOIN profile_tag pt ON p.id = pt.profile_id
                LEFT JOIN tags t ON pt.tag_id = t.id
                WHERE g.group_name = ?
                GROUP BY p.id
                ORDER BY p.name ASC
            `, [groupName]);

            return profiles.map(profile => ({
                ...profile,
                tags: profile.tags ? profile.tags.split(',') : [],
                shared_on_cloud: Boolean(profile.shared_on_cloud)
            }));

        } catch (error) {
            console.error('❌ Error getting profiles by group:', error);
            return [];
        }
    }

    async getGroupsForProfile(profileId) {
        try {
            const groups = await this.db.all(`
                SELECT g.group_name
                FROM groups g
                JOIN profile_group pg ON g.id = pg.group_id
                WHERE pg.profile_id = ?
                ORDER BY g.group_name ASC
            `, [profileId]);

            return groups.map(row => row.group_name);

        } catch (error) {
            console.error('❌ Error getting groups for profile:', error);
            return [];
        }
    }

    // === Statistics ===

    async getGroupStats() {
        try {
            const stats = await this.db.all(`
                SELECT g.group_name, COUNT(pg.profile_id) as profile_count
                FROM groups g
                LEFT JOIN profile_group pg ON g.id = pg.group_id
                GROUP BY g.id, g.group_name
                ORDER BY g.group_name ASC
            `);

            return stats.map(stat => ({
                group_name: stat.group_name,
                profile_count: stat.profile_count
            }));

        } catch (error) {
            console.error('❌ Error getting group stats:', error);
            return [];
        }
    }

    async getProfileCountForGroup(groupName) {
        try {
            const result = await this.db.get(`
                SELECT COUNT(pg.profile_id) as count
                FROM groups g
                LEFT JOIN profile_group pg ON g.id = pg.group_id
                WHERE g.group_name = ?
            `, [groupName]);

            return result ? result.count : 0;

        } catch (error) {
            console.error('❌ Error getting profile count for group:', error);
            return 0;
        }
    }

    // === Utility Methods ===

    async groupExists(groupName) {
        try {
            const result = await this.db.get(
                'SELECT COUNT(*) as count FROM groups WHERE group_name = ?',
                [groupName]
            );
            
            return result.count > 0;
        } catch (error) {
            console.error('❌ Error checking if group exists:', error);
            return false;
        }
    }

    async getOrCreateGroup(groupName) {
        try {
            const existing = await this.getGroupByName(groupName);
            if (existing) {
                return existing.id;
            }

            return await this.createGroup(groupName);
        } catch (error) {
            console.error('❌ Error getting or creating group:', error);
            throw error;
        }
    }

    // === Cleanup Operations ===

    async removeEmptyGroups() {
        try {
            const result = await this.db.run(`
                DELETE FROM groups 
                WHERE id NOT IN (
                    SELECT DISTINCT group_id 
                    FROM profile_group
                )
            `);

            if (result.changes > 0) {
                console.log(`✅ Removed ${result.changes} empty groups`);
            }

            return result.changes;

        } catch (error) {
            console.error('❌ Error removing empty groups:', error);
            return 0;
        }
    }
}

module.exports = GroupRepository;