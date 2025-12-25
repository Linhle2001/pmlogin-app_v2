/**
 * Database Manager - Quản lý tất cả database operations
 * Tương tự như pmlogin-app nhưng cho Electron app
 */

const { getDatabase } = require('./database');
const { ProxyRepository } = require('./repositories');
const ProfileRepository = require('./repositories/profile_repository_new');
const GroupRepository = require('./repositories/group_repository');

class DatabaseManager {
    constructor() {
        this.db = getDatabase();
        this.proxyRepo = new ProxyRepository();
        this.profileRepo = new ProfileRepository();
        this.groupRepo = new GroupRepository();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) {
            return true;
        }

        try {
            await this.db.connect();
            this.isInitialized = true;
            console.log('✅ Database Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Database Manager:', error);
            return false;
        }
    }

    // ======================================================================
    // PROXY OPERATIONS
    // ======================================================================

    async addProxy(proxyData) {
        await this.ensureInitialized();
        return await this.proxyRepo.saveProxy(proxyData);
    }

    async getAllProxies(tagId = null) {
        await this.ensureInitialized();
        return await this.proxyRepo.getAllProxies(tagId);
    }

    async getLiveProxies() {
        await this.ensureInitialized();
        return await this.proxyRepo.getLiveProxies();
    }

    async getUncheckedProxies() {
        await this.ensureInitialized();
        return await this.proxyRepo.getUncheckedProxies();
    }

    async updateProxyStatus(host, port, status, failCount = 0, proxyType = null) {
        await this.ensureInitialized();
        return await this.proxyRepo.updateProxyStatus(host, port, status, failCount, proxyType);
    }

    async deleteProxy(host, port) {
        await this.ensureInitialized();
        return await this.proxyRepo.deleteProxy(host, port);
    }

    async getProxyCount() {
        await this.ensureInitialized();
        return await this.proxyRepo.getProxyCount();
    }

    // ======================================================================
    // PROFILE OPERATIONS
    // ======================================================================

    async addProfile(profileData) {
        await this.ensureInitialized();
        return await this.profileRepo.saveProfile(profileData);
    }

    async getAllProfiles() {
        await this.ensureInitialized();
        return await this.profileRepo.getAllProfiles();
    }

    async getLocalProfiles() {
        await this.ensureInitialized();
        return await this.profileRepo.getLocalProfiles();
    }

    async getCloudProfiles() {
        await this.ensureInitialized();
        return await this.profileRepo.getCloudProfiles();
    }

    async getProfile(profileId) {
        await this.ensureInitialized();
        return await this.profileRepo.getProfile(profileId);
    }

    async updateProfile(profileId, updates) {
        await this.ensureInitialized();
        return await this.profileRepo.updateProfile(profileId, updates);
    }

    async deleteProfile(profileId) {
        await this.ensureInitialized();
        return await this.profileRepo.deleteProfile(profileId);
    }

    async createProfile(name, platform = null, note = null, proxy = null, status = 'Ready') {
        await this.ensureInitialized();
        return await this.profileRepo.createProfile(name, platform, note, proxy, status);
    }

    // ======================================================================
    // TAG OPERATIONS
    // ======================================================================

    async getAllTags() {
        await this.ensureInitialized();
        return await this.proxyRepo.getAllTags();
    }

    async createTag(tagName) {
        await this.ensureInitialized();
        return await this.proxyRepo.getOrCreateTag(tagName);
    }

    // ======================================================================
    // GROUP OPERATIONS
    // ======================================================================

    async getAllGroups() {
        await this.ensureInitialized();
        return await this.groupRepo.getAllGroups();
    }

    async createGroup(groupName) {
        await this.ensureInitialized();
        return await this.groupRepo.createGroup(groupName);
    }

    async assignProfilesToGroup(profileIds, groupName) {
        await this.ensureInitialized();
        return await this.groupRepo.assignProfilesToGroup(profileIds, groupName);
    }

    async getProfilesByGroup(groupName) {
        await this.ensureInitialized();
        return await this.groupRepo.getProfilesByGroup(groupName);
    }

    async removeProfileFromGroup(profileId, groupName) {
        await this.ensureInitialized();
        return await this.groupRepo.removeProfileFromGroup(profileId, groupName);
    }

    async getGroupStats() {
        await this.ensureInitialized();
        return await this.groupRepo.getGroupStats();
    }

    async getProfileCountForGroup(groupName) {
        await this.ensureInitialized();
        return await this.groupRepo.getProfileCountForGroup(groupName);
    }

    async deleteGroup(groupName) {
        await this.ensureInitialized();
        return await this.groupRepo.deleteGroup(groupName);
    }

    async updateGroup(id, newGroupName) {
        await this.ensureInitialized();
        return await this.groupRepo.updateGroup(id, newGroupName);
    }

    // ======================================================================
    // PROFILE-TAG RELATIONS
    // ======================================================================

    async addTagToProfile(profileId, tagName) {
        await this.ensureInitialized();
        return await this.profileRepo.addTagToProfile(profileId, tagName);
    }

    async removeTagFromProfile(profileId, tagName) {
        await this.ensureInitialized();
        return await this.profileRepo.removeTagFromProfile(profileId, tagName);
    }

    // ======================================================================
    // UTILITY METHODS
    // ======================================================================

    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    async close() {
        if (this.db) {
            this.db.disconnect();
            this.isInitialized = false;
            console.log('🔌 Database Manager closed');
        }
    }

    // ======================================================================
    // BULK OPERATIONS
    // ======================================================================

    async bulkAddProxies(proxiesList) {
        await this.ensureInitialized();
        
        const results = [];
        let successCount = 0;

        for (const proxyData of proxiesList) {
            try {
                const proxyId = await this.proxyRepo.saveProxy(proxyData);
                if (proxyId) {
                    results.push(proxyId);
                    successCount++;
                } else {
                    results.push(null);
                }
            } catch (error) {
                console.error(`❌ Error adding proxy ${proxyData.host}:${proxyData.port}:`, error);
                results.push(null);
            }
        }

        console.log(`✅ Bulk add completed: ${successCount}/${proxiesList.length} proxies added`);
        return results;
    }

    // ======================================================================
    // DATABASE STATS
    // ======================================================================

    async getStats() {
        await this.ensureInitialized();

        try {
            const [proxyCount, profileCount, tagCount, groupCount] = await Promise.all([
                this.proxyRepo.getProxyCount(),
                this.db.get("SELECT COUNT(*) as count FROM profiles").then(r => r.count),
                this.db.get("SELECT COUNT(*) as count FROM tags").then(r => r.count),
                this.db.get("SELECT COUNT(*) as count FROM groups").then(r => r.count)
            ]);

            return {
                proxies: proxyCount,
                profiles: profileCount,
                tags: tagCount,
                groups: groupCount
            };

        } catch (error) {
            console.error('❌ Error getting database stats:', error);
            return {
                proxies: 0,
                profiles: 0,
                tags: 0,
                groups: 0
            };
        }
    }
}

// Singleton instance
let dbManagerInstance = null;

function getDatabaseManager() {
    if (!dbManagerInstance) {
        dbManagerInstance = new DatabaseManager();
    }
    return dbManagerInstance;
}

module.exports = {
    DatabaseManager,
    getDatabaseManager
};