/**
 * Proxy Repository - Quản lý tất cả thao tác database cho Proxy
 * Tương tự như pmlogin-app/src/services/repositories/proxy_repo.py
 */

const { getDatabase } = require('../database');

class ProxyRepository {
    constructor() {
        this.db = getDatabase();
    }

    async ensureConnection() {
        if (!this.db.db) {
            await this.db.connect();
        }
    }

    // ======================================================================
    // TAG MANAGEMENT
    // ======================================================================

    async getOrCreateTag(tagName) {
        if (!tagName || !tagName.trim()) {
            return null;
        }

        await this.ensureConnection();
        
        try {
            // Check if tag exists
            const existing = await this.db.get(
                "SELECT id FROM tags WHERE name = ?", 
                [tagName.trim()]
            );

            if (existing) {
                return existing.id;
            }

            // Create new tag
            const result = await this.db.run(
                "INSERT INTO tags (name) VALUES (?)", 
                [tagName.trim()]
            );

            console.log(`✅ Created new tag '${tagName}' with ID: ${result.id}`);
            return result.id;

        } catch (error) {
            console.error('❌ Error in getOrCreateTag:', error);
            return null;
        }
    }

    async getAllTags() {
        await this.ensureConnection();
        
        try {
            const tags = await this.db.all(
                "SELECT id, name, created_at FROM tags ORDER BY name ASC"
            );
            return tags;
        } catch (error) {
            console.error('❌ Error getting all tags:', error);
            return [];
        }
    }

    // ======================================================================
    // PROXY MANAGEMENT
    // ======================================================================

    async saveProxy(proxyData) {
        if (!this.validateProxyData(proxyData)) {
            return null;
        }

        await this.ensureConnection();

        try {
            // Handle tags - first tag is primary tag
            let tagsList = proxyData.tags || [];
            
            // Backward compatibility
            if (proxyData.tag_name && !tagsList.includes(proxyData.tag_name)) {
                tagsList = [proxyData.tag_name, ...tagsList];
            }

            // Default tag if none provided
            if (tagsList.length === 0) {
                tagsList = ['Default'];
            }

            // Get/create primary tag ID
            const primaryTagId = await this.getOrCreateTag(tagsList[0]);
            if (!primaryTagId) {
                console.error('❌ Cannot create primary tag');
                return null;
            }

            // Default name is host:port if not provided
            const name = proxyData.name || `${proxyData.host}:${proxyData.port}`;

            // Insert proxy with primary tag
            const result = await this.db.run(`
                INSERT INTO proxies (name, host, port, username, password, type, status, last_used_at, fail_count, tag_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                name,
                proxyData.host,
                proxyData.port,
                proxyData.username || '',
                proxyData.password || '',
                proxyData.type || 'http',
                proxyData.status || null,
                proxyData.last_used_at || 0,
                proxyData.fail_count || 0,
                primaryTagId
            ]);

            const proxyId = result.id;

            // Add additional tags to proxy_tags table
            for (let i = 1; i < tagsList.length; i++) {
                const tagName = tagsList[i];
                if (tagName && tagName.trim()) {
                    const tagId = await this.getOrCreateTag(tagName.trim());
                    if (tagId) {
                        try {
                            await this.db.run(
                                "INSERT OR IGNORE INTO proxy_tags (proxy_id, tag_id) VALUES (?, ?)",
                                [proxyId, tagId]
                            );
                        } catch (err) {
                            // Ignore duplicates
                        }
                    }
                }
            }

            const tagInfo = tagsList.length > 0 ? ` [tags: ${tagsList.join(', ')}]` : '';
            console.log(`✅ Added proxy ID=${proxyId}: ${proxyData.host}:${proxyData.port}${tagInfo}`);

            return proxyId;

        } catch (error) {
            console.error('❌ Error saving proxy:', error);
            return null;
        }
    }

    async getAllProxies(tagId = null) {
        await this.ensureConnection();

        try {
            let query, params;

            if (tagId !== null) {
                // Filter by primary tag
                query = `
                    SELECT p.*
                    FROM proxies p
                    WHERE p.tag_id = ?
                    ORDER BY p.id ASC
                `;
                params = [tagId];
            } else {
                // Get all proxies
                query = `
                    SELECT p.*
                    FROM proxies p
                    ORDER BY p.id ASC
                `;
                params = [];
            }

            const proxies = await this.db.all(query, params);

            // Add tags to each proxy
            const result = [];
            for (const proxy of proxies) {
                const tags = await this.getProxyTags(proxy.id);
                result.push({
                    ...proxy,
                    tags: tags,
                    tag_name: tags[0] || 'Default' // Backward compatibility
                });
            }

            const filterInfo = tagId !== null ? ` (tag_id=${tagId})` : '';
            console.log(`ℹ️ Retrieved ${result.length} proxies${filterInfo} from database`);
            return result;

        } catch (error) {
            console.error('❌ Error getting all proxies:', error);
            return [];
        }
    }

    async getProxyTags(proxyId) {
        try {
            // Get primary tag from proxies.tag_id
            const primaryTag = await this.db.get(`
                SELECT t.name
                FROM tags t
                INNER JOIN proxies p ON t.id = p.tag_id
                WHERE p.id = ?
            `, [proxyId]);

            const primaryTagName = primaryTag ? primaryTag.name : 'Default';

            // Get additional tags from proxy_tags
            const additionalTags = await this.db.all(`
                SELECT DISTINCT t.name
                FROM tags t
                INNER JOIN proxy_tags pt ON t.id = pt.tag_id
                WHERE pt.proxy_id = ?
                ORDER BY t.name
            `, [proxyId]);

            // Primary tag is always first
            const result = [primaryTagName, ...additionalTags.map(row => row.name)];
            return result;

        } catch (error) {
            console.error(`❌ Error getting tags for proxy ${proxyId}:`, error);
            return ['Default'];
        }
    }

    async getLiveProxies() {
        await this.ensureConnection();

        try {
            const proxies = await this.db.all(
                "SELECT * FROM proxies WHERE status = 'live' ORDER BY id ASC"
            );

            // Add tags to each proxy
            const result = [];
            for (const proxy of proxies) {
                const tags = await this.getProxyTags(proxy.id);
                result.push({
                    ...proxy,
                    tags: tags
                });
            }

            return result;
        } catch (error) {
            console.error('❌ Error getting live proxies:', error);
            return [];
        }
    }

    async getUncheckedProxies() {
        await this.ensureConnection();

        try {
            const proxies = await this.db.all(
                "SELECT * FROM proxies WHERE status IS NULL ORDER BY id ASC"
            );

            // Add tags to each proxy
            const result = [];
            for (const proxy of proxies) {
                const tags = await this.getProxyTags(proxy.id);
                result.push({
                    ...proxy,
                    tags: tags
                });
            }

            return result;
        } catch (error) {
            console.error('❌ Error getting unchecked proxies:', error);
            return [];
        }
    }

    async updateProxyStatus(host, port, status, failCount = 0, proxyType = null) {
        await this.ensureConnection();

        try {
            let query, params;

            if (proxyType && proxyType !== 'unknown') {
                query = `
                    UPDATE proxies 
                    SET status = ?, fail_count = ?, last_used_at = ?, type = ?
                    WHERE host = ? AND port = ?
                `;
                params = [status, failCount, Date.now() / 1000, proxyType, host, port];
                console.log(`✅ Updated proxy ${host}:${port} -> status=${status}, type=${proxyType}`);
            } else {
                query = `
                    UPDATE proxies 
                    SET status = ?, fail_count = ?, last_used_at = ?
                    WHERE host = ? AND port = ?
                `;
                params = [status, failCount, Date.now() / 1000, host, port];
                console.log(`✅ Updated proxy status ${host}:${port} -> ${status}`);
            }

            await this.db.run(query, params);
            return true;

        } catch (error) {
            console.error('❌ Error updating proxy status:', error);
            return false;
        }
    }

    async deleteProxy(host, port) {
        await this.ensureConnection();

        try {
            const result = await this.db.run(
                "DELETE FROM proxies WHERE host = ? AND port = ?",
                [host, port]
            );

            if (result.changes > 0) {
                console.log(`🗑️ Deleted proxy: ${host}:${port}`);
                return true;
            } else {
                console.log(`⚠️ Proxy not found: ${host}:${port}`);
                return false;
            }

        } catch (error) {
            console.error('❌ Error deleting proxy:', error);
            return false;
        }
    }

    async getProxyCount() {
        await this.ensureConnection();

        try {
            const result = await this.db.get("SELECT COUNT(*) as count FROM proxies");
            return result.count || 0;
        } catch (error) {
            console.error('❌ Error counting proxies:', error);
            return 0;
        }
    }

    // ======================================================================
    // UTILITY METHODS
    // ======================================================================

    validateProxyData(proxyData) {
        if (!proxyData || typeof proxyData !== 'object') {
            console.error('❌ Proxy data must be an object');
            return false;
        }

        const host = (proxyData.host || '').trim();
        const port = proxyData.port;

        if (!host) {
            console.error('❌ Proxy host is required');
            return false;
        }

        if (!Number.isInteger(port) || port <= 0 || port > 65535) {
            console.error(`❌ Invalid proxy port: ${port}`);
            return false;
        }

        // Validate proxy type
        let proxyType = (proxyData.type || 'http').toLowerCase();

        // Normalize proxy type - handle 'socks' as 'socks5'
        if (proxyType === 'socks') {
            proxyType = 'socks5';
            proxyData.type = 'socks5';
        }

        const validTypes = ['http', 'https', 'socks4', 'socks5', 'unknown'];
        if (!validTypes.includes(proxyType)) {
            console.warn(`⚠️ Unknown proxy type: ${proxyType}, defaulting to 'http'`);
            proxyData.type = 'http';
        } else {
            proxyData.type = proxyType;
        }

        // Validate status
        const status = proxyData.status;
        if (status !== null && status !== undefined) {
            const validStatuses = ['live', 'dead'];
            if (!validStatuses.includes(status)) {
                console.warn(`⚠️ Invalid proxy status: ${status}, setting to null`);
                proxyData.status = null;
            }
        }

        return true;
    }
}

module.exports = ProxyRepository;