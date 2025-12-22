/**
 * Profile Repository - Quản lý database profiles, groups và tags (many-to-many)
 * Tương tự như pmlogin-app/src/services/repositories/profile_repo.py
 */

const { getDatabase } = require('../database');

class ProfileRepository {
    constructor() {
        this.db = getDatabase();
    }

    async ensureConnection() {
        if (!this.db.db) {
            await this.db.connect();
        }
    }

    // ======================================================================
    // TAG SUPPORT
    // ======================================================================

    async getOrCreateTag(name) {
        const trimmedName = name.trim();
        if (!trimmedName) {
            return null;
        }

        await this.ensureConnection();

        try {
            // Check if tag exists
            const existing = await this.db.get(
                "SELECT id FROM tags WHERE name = ?", 
                [trimmedName]
            );

            if (existing) {
                return existing.id;
            }

            // Create new tag
            const result = await this.db.run(
                "INSERT INTO tags (name) VALUES (?)", 
                [trimmedName]
            );

            return result.id;

        } catch (error) {
            console.error('❌ Error in getOrCreateTag:', error);
            return null;
        }
    }

    // ======================================================================
    // GROUP SUPPORT
    // ======================================================================

    async getOrCreateGroup(name) {
        await this.ensureConnection();

        try {
            // Check if group exists
            const existing = await this.db.get(
                "SELECT id FROM groups WHERE group_name = ?", 
                [name]
            );

            if (existing) {
                return existing.id;
            }

            // Create new group
            const result = await this.db.run(
                "INSERT INTO groups (group_name) VALUES (?)", 
                [name]
            );

            return result.id;

        } catch (error) {
            console.error('❌ Error in getOrCreateGroup:', error);
            return null;
        }
    }

    async getAllGroups() {
        await this.ensureConnection();

        try {
            const groups = await this.db.all(
                "SELECT group_name FROM groups ORDER BY group_name"
            );
            return groups.map(row => row.group_name);
        } catch (error) {
            console.error('❌ Error getting all groups:', error);
            return [];
        }
    }

    // ======================================================================
    // PROFILE MANAGEMENT
    // ======================================================================

    async saveProfile(profileData) {
        await this.ensureConnection();

        try {
            // Insert profile
            const result = await this.db.run(`
                INSERT INTO profiles (name, platform, note, proxy, updated_at, last_started_at, status, shared_on_cloud)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                profileData.name,
                profileData.platform,
                profileData.note,
                profileData.proxy,
                profileData.updated_at,
                profileData.last_started_at,
                profileData.status || 'Ready',
                profileData.shared_on_cloud ? 1 : 0
            ]);

            const profileId = result.id;

            // Assign tags
            const tags = profileData.tags || [];
            for (const tagName of tags) {
                const tagId = await this.getOrCreateTag(tagName);
                if (tagId) {
                    await this.db.run(
                        "INSERT OR IGNORE INTO profile_tag (profile_id, tag_id) VALUES (?, ?)",
                        [profileId, tagId]
                    );
                }
            }

            // Assign groups
            const groups = profileData.groups || [];
            for (const groupName of groups) {
                const groupId = await this.getOrCreateGroup(groupName);
                if (groupId) {
                    await this.db.run(
                        "INSERT OR IGNORE INTO profile_group (profile_id, group_id) VALUES (?, ?)",
                        [profileId, groupId]
                    );
                }
            }

            console.log(`✅ Added profile ID=${profileId} [${profileData.name}] (shared_on_cloud: ${profileData.shared_on_cloud ? 'Yes' : 'No'})`);
            return profileId;

        } catch (error) {
            console.error('❌ Error saving profile:', error);
            return null;
        }
    }

    async getAllProfiles() {
        await this.ensureConnection();

        try {
            const profiles = await this.db.all(
                "SELECT * FROM profiles ORDER BY id DESC"
            );

            const result = [];
            for (const profile of profiles) {
                const tags = await this.getProfileTags(profile.id);
                const groups = await this.getProfileGroups(profile.id);
                
                result.push({
                    ...profile,
                    tags: tags,
                    groups: groups,
                    shared_on_cloud: Boolean(profile.shared_on_cloud)
                });
            }

            return result;

        } catch (error) {
            console.error('❌ Error getting all profiles:', error);
            return [];
        }
    }

    async getLocalProfiles() {
        await this.ensureConnection();

        try {
            // Local profiles include all profiles (both shared and not shared)
            const profiles = await this.db.all(
                "SELECT * FROM profiles ORDER BY id DESC"
            );

            const result = [];
            for (const profile of profiles) {
                const tags = await this.getProfileTags(profile.id);
                const groups = await this.getProfileGroups(profile.id);
                
                result.push({
                    ...profile,
                    tags: tags,
                    groups: groups,
                    shared_on_cloud: Boolean(profile.shared_on_cloud)
                });
            }

            return result;

        } catch (error) {
            console.error('❌ Error getting local profiles:', error);
            return [];
        }
    }

    async getCloudProfiles() {
        await this.ensureConnection();

        try {
            // Cloud profiles include only profiles that are shared on cloud
            const profiles = await this.db.all(
                "SELECT * FROM profiles WHERE shared_on_cloud = 1 ORDER BY id DESC"
            );

            const result = [];
            for (const profile of profiles) {
                const tags = await this.getProfileTags(profile.id);
                const groups = await this.getProfileGroups(profile.id);
                
                result.push({
                    ...profile,
                    tags: tags,
                    groups: groups,
                    shared_on_cloud: Boolean(profile.shared_on_cloud)
                });
            }

            return result;

        } catch (error) {
            console.error('❌ Error getting cloud profiles:', error);
            return [];
        }
    }

    async getProfileTags(profileId) {
        try {
            await this.ensureConnection();
            
            const tags = await this.db.all(`
                SELECT tags.name
                FROM tags
                JOIN profile_tag ON profile_tag.tag_id = tags.id
                WHERE profile_tag.profile_id = ?
                ORDER BY tags.name
            `, [profileId]);

            return tags.map(row => row.name);

        } catch (error) {
            console.error(`❌ Error getting profile tags for ${profileId}:`, error);
            return [];
        }
    }

    async getProfileGroups(profileId) {
        try {
            await this.ensureConnection();
            
            const groups = await this.db.all(`
                SELECT groups.group_name
                FROM groups
                JOIN profile_group ON profile_group.group_id = groups.id
                WHERE profile_group.profile_id = ?
                ORDER BY groups.group_name
            `, [profileId]);

            return groups.map(row => row.group_name);

        } catch (error) {
            console.error(`❌ Error getting profile groups for ${profileId}:`, error);
            return [];
        }
    }

    // ======================================================================
    // PROFILE OPERATIONS
    // ======================================================================

    async createProfile(name, platform = null, note = null, proxy = null, status = 'Ready') {
        await this.ensureConnection();

        try {
            const result = await this.db.run(`
                INSERT INTO profiles (name, platform, note, proxy, status)
                VALUES (?, ?, ?, ?, ?)
            `, [name, platform, note, proxy, status]);

            return result.id;

        } catch (error) {
            console.error('❌ Error creating profile:', error);
            return null;
        }
    }

    async updateProfile(profileId, updates) {
        if (!updates || Object.keys(updates).length === 0) {
            return false;
        }

        await this.ensureConnection();

        // Whitelist allowed fields
        const allowedFields = ['name', 'platform', 'note', 'proxy', 'status', 'last_started_at', 'updated_at'];
        const validUpdates = {};
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                validUpdates[key] = value;
            }
        }

        if (Object.keys(validUpdates).length === 0) {
            console.warn(`⚠️ No valid fields to update for profile ${profileId}`);
            return false;
        }

        try {
            // Always update updated_at if not provided
            if (!validUpdates.updated_at) {
                validUpdates.updated_at = new Date().toISOString();
            }

            const fields = Object.keys(validUpdates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(validUpdates);
            values.push(profileId);

            const query = `UPDATE profiles SET ${fields} WHERE id = ?`;
            
            console.log(`🔧 Updating profile ${profileId} with data:`, validUpdates);
            
            const result = await this.db.run(query, values);
            
            if (result.changes > 0) {
                console.log(`✅ Profile ${profileId} updated successfully`);
                return true;
            } else {
                console.warn(`⚠️ Profile ${profileId} not found`);
                return false;
            }

        } catch (error) {
            console.error(`❌ Error updating profile ${profileId}:`, error);
            return false;
        }
    }

    async deleteProfile(profileId) {
        await this.ensureConnection();

        try {
            const result = await this.db.run(
                "DELETE FROM profiles WHERE id = ?", 
                [profileId]
            );

            return result.changes > 0;

        } catch (error) {
            console.error('❌ Error deleting profile:', error);
            return false;
        }
    }

    async getProfile(profileId) {
        await this.ensureConnection();

        try {
            const profile = await this.db.get(`
                SELECT id, name, platform, note, proxy, updated_at, last_started_at, status
                FROM profiles WHERE id = ?
            `, [profileId]);

            if (!profile) {
                return null;
            }

            const tags = await this.getProfileTags(profileId);
            const groups = await this.getProfileGroups(profileId);

            return {
                ...profile,
                tags: tags,
                groups: groups
            };

        } catch (error) {
            console.error(`❌ Error getting profile ${profileId}:`, error);
            return null;
        }
    }

    // ======================================================================
    // PROFILE-TAG RELATIONS
    // ======================================================================

    async addTagToProfile(profileId, tagName) {
        const tagId = await this.getOrCreateTag(tagName);
        if (!tagId) return false;

        await this.ensureConnection();

        try {
            await this.db.run(
                "INSERT OR IGNORE INTO profile_tag (profile_id, tag_id) VALUES (?, ?)",
                [profileId, tagId]
            );
            return true;

        } catch (error) {
            console.error('❌ Error adding tag to profile:', error);
            return false;
        }
    }

    async removeTagFromProfile(profileId, tagName) {
        await this.ensureConnection();

        try {
            const tag = await this.db.get(
                "SELECT id FROM tags WHERE name = ?", 
                [tagName]
            );

            if (!tag) return false;

            await this.db.run(
                "DELETE FROM profile_tag WHERE profile_id = ? AND tag_id = ?",
                [profileId, tag.id]
            );

            return true;

        } catch (error) {
            console.error('❌ Error removing tag from profile:', error);
            return false;
        }
    }

    async clearProfileTags(profileId) {
        await this.ensureConnection();

        try {
            await this.db.run(
                "DELETE FROM profile_tag WHERE profile_id = ?", 
                [profileId]
            );
            return true;

        } catch (error) {
            console.error('❌ Error clearing profile tags:', error);
            return false;
        }
    }

    // ======================================================================
    // PROFILE-GROUP RELATIONS
    // ======================================================================

    async assignProfilesToGroup(profileIds, groupName) {
        if (!Array.isArray(profileIds) || profileIds.length === 0) {
            return false;
        }

        const groupId = await this.getOrCreateGroup(groupName);
        if (!groupId) return false;

        await this.ensureConnection();

        try {
            let assignedCount = 0;
            let skippedCount = 0;

            for (const profileId of profileIds) {
                // Check if already exists
                const existing = await this.db.get(
                    "SELECT COUNT(*) as count FROM profile_group WHERE profile_id = ? AND group_id = ?",
                    [profileId, groupId]
                );

                if (existing.count > 0) {
                    skippedCount++;
                    console.log(`ℹ️ Profile ID ${profileId} already in group '${groupName}', skipped`);
                } else {
                    await this.db.run(
                        "INSERT INTO profile_group (profile_id, group_id) VALUES (?, ?)",
                        [profileId, groupId]
                    );
                    assignedCount++;
                }
            }

            console.log(`✅ Assigned ${assignedCount} profiles to group '${groupName}' (skipped ${skippedCount} duplicates)`);
            return true;

        } catch (error) {
            console.error('❌ Error assigning profiles to group:', error);
            return false;
        }
    }

    async removeProfileFromGroup(profileId, groupName) {
        await this.ensureConnection();

        try {
            const group = await this.db.get(
                "SELECT id FROM groups WHERE group_name = ?", 
                [groupName]
            );

            if (!group) {
                console.error(`❌ Group '${groupName}' not found`);
                return false;
            }

            await this.db.run(
                "DELETE FROM profile_group WHERE profile_id = ? AND group_id = ?",
                [profileId, group.id]
            );

            console.log(`✅ Removed profile ${profileId} from group '${groupName}'`);
            return true;

        } catch (error) {
            console.error('❌ Error removing profile from group:', error);
            return false;
        }
    }

    async getProfilesByGroup(groupName) {
        await this.ensureConnection();

        try {
            const profiles = await this.db.all(`
                SELECT DISTINCT profiles.id, profiles.name, profiles.platform, profiles.note, profiles.proxy, 
                       profiles.updated_at, profiles.last_started_at, profiles.status
                FROM profiles
                JOIN profile_group ON profiles.id = profile_group.profile_id
                JOIN groups ON profile_group.group_id = groups.id
                WHERE groups.group_name = ?
                ORDER BY profiles.name
            `, [groupName]);

            const result = [];
            for (const profile of profiles) {
                const tags = await this.getProfileTags(profile.id);
                result.push({
                    ...profile,
                    platform: profile.platform || '',
                    note: profile.note || '',
                    proxy: profile.proxy || '',
                    updated_at: profile.updated_at || '',
                    last_started_at: profile.last_started_at || '',
                    status: profile.status || 'Ready',
                    tags: tags
                });
            }

            return result;

        } catch (error) {
            console.error('❌ Error getting profiles by group:', error);
            return [];
        }
    }

    // ======================================================================
    // UTILITY METHODS
    // ======================================================================

    async profileNameExists(profileName) {
        await this.ensureConnection();

        try {
            const result = await this.db.get(
                "SELECT COUNT(*) as count FROM profiles WHERE name = ?", 
                [profileName]
            );
            return result.count > 0;

        } catch (error) {
            console.error('❌ Error checking profile name exists:', error);
            return false;
        }
    }

    async getProfileIdByName(profileName) {
        await this.ensureConnection();

        try {
            const result = await this.db.get(
                "SELECT id FROM profiles WHERE name = ?", 
                [profileName]
            );
            return result ? result.id : null;

        } catch (error) {
            console.error('❌ Error getting profile ID by name:', error);
            return null;
        }
    }
}

module.exports = ProfileRepository;