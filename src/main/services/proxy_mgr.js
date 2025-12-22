const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ProxyManager {
    constructor() {
        this.proxies = [];
        this.dbPath = path.join(app.getPath('userData'), 'proxies.json');
        this.tags = new Set(['Default']); // Quản lý tags
        this.loadProxies();
    }

    // Load proxies from file
    loadProxies() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const data = fs.readFileSync(this.dbPath, 'utf8');
                this.proxies = JSON.parse(data);
                
                // Load tags từ proxies
                this.proxies.forEach(proxy => {
                    if (proxy.tags && Array.isArray(proxy.tags)) {
                        proxy.tags.forEach(tag => this.tags.add(tag));
                    }
                });
                
                console.log(`📂 Loaded ${this.proxies.length} proxies from storage`);
            } else {
                this.proxies = [];
                console.log('📂 No proxy storage found, starting fresh');
            }
        } catch (error) {
            console.error('[ERROR] Error loading proxies:', error);
            this.proxies = [];
        }
    }

    // Save proxies to file
    saveProxies() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.proxies, null, 2));
            console.log(`💾 Saved ${this.proxies.length} proxies to storage`);
        } catch (error) {
            console.error('[ERROR] Error saving proxies:', error);
        }
    }

    // Get all proxies with pagination and filtering
    async getAllProxies(options = {}) {
        try {
            let filteredProxies = [...this.proxies];
            
            // Filter by tag
            if (options.tag && options.tag !== 'All Tags') {
                filteredProxies = filteredProxies.filter(proxy => 
                    proxy.tags && proxy.tags.includes(options.tag)
                );
            }
            
            // Filter by search
            if (options.search) {
                const searchLower = options.search.toLowerCase();
                filteredProxies = filteredProxies.filter(proxy => 
                    proxy.name.toLowerCase().includes(searchLower) ||
                    proxy.host.toLowerCase().includes(searchLower) ||
                    (proxy.username && proxy.username.toLowerCase().includes(searchLower))
                );
            }
            
            // Filter by status
            if (options.status && options.status !== 'all') {
                filteredProxies = filteredProxies.filter(proxy => proxy.status === options.status);
            }
            
            // Pagination
            const page = options.page || 1;
            const limit = options.limit || 25;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            
            const paginatedProxies = filteredProxies.slice(startIndex, endIndex);
            
            return {
                success: true,
                data: {
                    proxies: paginatedProxies,
                    total: filteredProxies.length,
                    page,
                    limit,
                    totalPages: Math.ceil(filteredProxies.length / limit),
                    tags: Array.from(this.tags)
                }
            };
        } catch (error) {
            console.error('[ERROR] Error getting proxies:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách proxy' };
        }
    }

    // Add new proxy
    async addProxy(proxyData) {
        try {
            // Validate proxy data
            const validation = this.validateProxyData(proxyData);
            if (!validation.valid) {
                return { success: false, message: validation.message };
            }

            // Generate unique ID
            const id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
            
            // Xử lý tags
            let tags = proxyData.tags || ['Default'];
            if (typeof tags === 'string') {
                tags = tags.split(',').map(t => t.trim()).filter(t => t);
            }
            if (!Array.isArray(tags) || tags.length === 0) {
                tags = ['Default'];
            }
            
            // Thêm tags vào set
            tags.forEach(tag => this.tags.add(tag));
            
            const newProxy = {
                id,
                host: proxyData.host.trim(),
                port: parseInt(proxyData.port),
                username: proxyData.username?.trim() || '',
                password: proxyData.password?.trim() || '',
                type: proxyData.type || 'http',
                name: proxyData.name?.trim() || `${proxyData.host}:${proxyData.port}`,
                tags: tags,
                status: proxyData.status || 'pending',
                lastTested: null,
                responseTime: null,
                location: null,
                failCount: 0,
                lastUsedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.proxies.push(newProxy);
            this.saveProxies();

            console.log(`[SUCCESS] Added proxy: ${newProxy.name}`);
            return { success: true, data: newProxy };
        } catch (error) {
            console.error('[ERROR] Error adding proxy:', error);
            return { success: false, message: 'Lỗi khi thêm proxy' };
        }
    }

    // Update proxy
    async updateProxy(id, proxyData) {
        try {
            const index = this.proxies.findIndex(p => p.id === id);
            if (index === -1) {
                return { success: false, message: 'Không tìm thấy proxy' };
            }

            // Validate proxy data
            const validation = this.validateProxyData(proxyData);
            if (!validation.valid) {
                return { success: false, message: validation.message };
            }

            // Xử lý tags
            let tags = proxyData.tags || ['Default'];
            if (typeof tags === 'string') {
                tags = tags.split(',').map(t => t.trim()).filter(t => t);
            }
            if (!Array.isArray(tags) || tags.length === 0) {
                tags = ['Default'];
            }
            
            // Thêm tags vào set
            tags.forEach(tag => this.tags.add(tag));

            // Update proxy
            const updatedProxy = {
                ...this.proxies[index],
                host: proxyData.host.trim(),
                port: parseInt(proxyData.port),
                username: proxyData.username?.trim() || '',
                password: proxyData.password?.trim() || '',
                type: proxyData.type || 'http',
                name: proxyData.name?.trim() || `${proxyData.host}:${proxyData.port}`,
                tags: tags,
                updatedAt: new Date().toISOString()
            };

            this.proxies[index] = updatedProxy;
            this.saveProxies();

            console.log(`[SUCCESS] Updated proxy: ${updatedProxy.name}`);
            return { success: true, data: updatedProxy };
        } catch (error) {
            console.error('[ERROR] Error updating proxy:', error);
            return { success: false, message: 'Lỗi khi cập nhật proxy' };
        }
    }

    // Delete multiple proxies
    async deleteProxies(ids) {
        try {
            if (!Array.isArray(ids) || ids.length === 0) {
                return { success: false, message: 'Danh sách ID không hợp lệ' };
            }

            const deletedProxies = [];
            
            // Xóa từng proxy
            for (const id of ids) {
                const index = this.proxies.findIndex(p => p.id === id);
                if (index !== -1) {
                    deletedProxies.push(this.proxies[index]);
                    this.proxies.splice(index, 1);
                }
            }

            this.saveProxies();

            console.log(`[DELETE] Deleted ${deletedProxies.length} proxies`);
            return { 
                success: true, 
                data: { 
                    deleted: deletedProxies.length,
                    proxies: deletedProxies 
                } 
            };
        } catch (error) {
            console.error('[ERROR] Error deleting proxies:', error);
            return { success: false, message: 'Lỗi khi xóa proxy' };
        }
    }

    // Test proxy with enhanced checking
    async testProxy(proxyData) {
        try {
            console.log(`[TEST] Testing proxy: ${proxyData.host}:${proxyData.port}`);
            
            const startTime = Date.now();
            const proxyUrl = this.buildProxyUrl(proxyData);
            
            // Create appropriate proxy agent based on type
            let agent;
            const proxyType = proxyData.type?.toLowerCase() || 'http';
            
            if (proxyType.includes('socks')) {
                agent = new SocksProxyAgent(proxyUrl);
            } else {
                agent = new HttpsProxyAgent(proxyUrl);
            }
            
            // Test with multiple endpoints for better reliability
            const testUrls = [
                'https://httpbin.org/ip',
                'https://api.ipify.org?format=json',
                'https://ifconfig.me/ip'
            ];
            
            let lastError;
            
            for (const testUrl of testUrls) {
                try {
                    const response = await axios.get(testUrl, {
                        httpsAgent: agent,
                        timeout: 15000,
                        validateStatus: () => true
                    });

                    const responseTime = Date.now() - startTime;

                    if (response.status === 200) {
                        let publicIp = '';
                        
                        // Parse IP from different response formats
                        if (typeof response.data === 'object' && response.data.origin) {
                            publicIp = response.data.origin;
                        } else if (typeof response.data === 'object' && response.data.ip) {
                            publicIp = response.data.ip;
                        } else if (typeof response.data === 'string') {
                            publicIp = response.data.trim();
                        }

                        const result = {
                            success: true,
                            status: 'live',
                            responseTime,
                            publicIp,
                            testUrl,
                            message: `Proxy hoạt động tốt (${responseTime}ms)`
                        };

                        // Update proxy status if it exists in our list
                        const existingProxy = this.proxies.find(p => 
                            p.host === proxyData.host && p.port === parseInt(proxyData.port)
                        );
                        
                        if (existingProxy) {
                            existingProxy.status = 'live';
                            existingProxy.responseTime = responseTime;
                            existingProxy.lastTested = new Date().toISOString();
                            existingProxy.publicIp = publicIp;
                            existingProxy.failCount = 0;
                            this.saveProxies();
                        }

                        console.log(`[SUCCESS] Proxy test successful: ${proxyData.host}:${proxyData.port} (${responseTime}ms) IP: ${publicIp}`);
                        return result;
                    }
                } catch (error) {
                    lastError = error;
                    continue; // Try next URL
                }
            }
            
            throw lastError || new Error('All test URLs failed');
            
        } catch (error) {
            console.error(`[ERROR] Proxy test failed: ${proxyData.host}:${proxyData.port}`, error.message);
            
            // Update proxy status if it exists in our list
            const existingProxy = this.proxies.find(p => 
                p.host === proxyData.host && p.port === parseInt(proxyData.port)
            );
            
            if (existingProxy) {
                existingProxy.status = 'dead';
                existingProxy.lastTested = new Date().toISOString();
                existingProxy.failCount = (existingProxy.failCount || 0) + 1;
                this.saveProxies();
            }

            return {
                success: false,
                status: 'dead',
                message: `Proxy không hoạt động: ${error.message}`
            };
        }
    }

    // Test multiple proxies concurrently
    async testProxies(proxyIds, progressCallback) {
        try {
            const proxiesToTest = this.proxies.filter(p => proxyIds.includes(p.id));
            if (proxiesToTest.length === 0) {
                return { success: false, message: 'Không tìm thấy proxy để test' };
            }

            console.log(`[TEST-BATCH] Testing ${proxiesToTest.length} proxies...`);
            
            const results = [];
            const concurrency = 5; // Test 5 proxies at a time
            
            for (let i = 0; i < proxiesToTest.length; i += concurrency) {
                const batch = proxiesToTest.slice(i, i + concurrency);
                
                const batchPromises = batch.map(async (proxy) => {
                    const result = await this.testProxy(proxy);
                    
                    // Call progress callback if provided
                    if (progressCallback) {
                        progressCallback(i + batch.indexOf(proxy) + 1, proxiesToTest.length, result);
                    }
                    
                    return {
                        id: proxy.id,
                        host: proxy.host,
                        port: proxy.port,
                        ...result
                    };
                });
                
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
                
                // Small delay between batches to avoid overwhelming
                if (i + concurrency < proxiesToTest.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            const liveCount = results.filter(r => r.success).length;
            const deadCount = results.length - liveCount;
            
            console.log(`[TEST-BATCH] Completed! Live: ${liveCount}, Dead: ${deadCount}`);
            
            return {
                success: true,
                data: {
                    results,
                    summary: {
                        total: results.length,
                        live: liveCount,
                        dead: deadCount
                    }
                }
            };
            
        } catch (error) {
            console.error('[ERROR] Error testing proxies:', error);
            return { success: false, message: 'Lỗi khi test proxy' };
        }
    }

    // Validate proxy data
    validateProxyData(proxyData) {
        if (!proxyData.host || !proxyData.port) {
            return { valid: false, message: 'Host và Port là bắt buộc' };
        }

        if (!/^[\w\.-]+$/.test(proxyData.host)) {
            return { valid: false, message: 'Host không hợp lệ' };
        }

        const port = parseInt(proxyData.port);
        if (isNaN(port) || port < 1 || port > 65535) {
            return { valid: false, message: 'Port phải từ 1-65535' };
        }

        const validTypes = ['http', 'https', 'socks4', 'socks5'];
        if (proxyData.type && !validTypes.includes(proxyData.type)) {
            return { valid: false, message: 'Loại proxy không hợp lệ' };
        }

        // Validate tags
        if (proxyData.tags) {
            let tags = proxyData.tags;
            if (typeof tags === 'string') {
                tags = tags.split(',').map(t => t.trim());
            }
            
            if (Array.isArray(tags)) {
                for (const tag of tags) {
                    if (tag.toLowerCase() === 'none') {
                        return { valid: false, message: 'Tag không hợp lệ!' };
                    }
                }
            }
        }

        return { valid: true };
    }

    // Build proxy URL
    buildProxyUrl(proxyData) {
        const { host, port, username, password, type = 'http' } = proxyData;
        
        let auth = '';
        if (username && password) {
            auth = `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
        }

        return `${type}://${auth}${host}:${port}`;
    }

    // Import proxies from text with enhanced parsing
    async importProxies(proxyText, tags = ['Default']) {
        try {
            const lines = proxyText.split('\n').filter(line => line.trim());
            const imported = [];
            const errors = [];

            for (const line of lines) {
                try {
                    const proxy = this.parseProxyLine(line.trim());
                    if (proxy) {
                        // Add tags to proxy
                        proxy.tags = tags;
                        
                        const result = await this.addProxy(proxy);
                        if (result.success) {
                            imported.push(result.data);
                        } else {
                            errors.push(`${line}: ${result.message}`);
                        }
                    } else {
                        errors.push(`${line}: Format không hợp lệ`);
                    }
                } catch (error) {
                    errors.push(`${line}: ${error.message}`);
                }
            }

            return {
                success: true,
                data: {
                    imported: imported.length,
                    errors: errors.length,
                    errorDetails: errors,
                    proxies: imported
                }
            };
        } catch (error) {
            console.error('[ERROR] Error importing proxies:', error);
            return { success: false, message: 'Lỗi khi import proxy' };
        }
    }

    // Parse proxy line with enhanced format support
    parseProxyLine(line) {
        // Remove protocol prefix if exists
        let cleanLine = line;
        const protocolMatch = line.match(/^(https?|socks[45]?):\/\//i);
        let detectedType = 'http';
        
        if (protocolMatch) {
            detectedType = protocolMatch[1].toLowerCase();
            if (detectedType === 'socks') detectedType = 'socks5';
            cleanLine = line.replace(protocolMatch[0], '');
        }
        
        // Format: host:port:username:password:name
        // Format: host:port:username:password
        // Format: host:port
        // Format: username:password@host:port
        
        if (cleanLine.includes('@')) {
            // Format: username:password@host:port
            const [auth, hostPort] = cleanLine.split('@');
            const [username, password] = auth.split(':');
            const [host, port, ...nameParts] = hostPort.split(':');
            const name = nameParts.join(':') || `${host}:${port}`;
            
            return { 
                host, 
                port: parseInt(port), 
                username, 
                password, 
                type: detectedType,
                name 
            };
        } else {
            // Format: host:port:username:password:name or host:port
            const parts = cleanLine.split(':');
            
            if (parts.length >= 2) {
                const [host, port, username, password, ...nameParts] = parts;
                const name = nameParts.join(':') || `${host}:${port}`;
                
                return { 
                    host, 
                    port: parseInt(port), 
                    username: username || '', 
                    password: password || '',
                    type: detectedType,
                    name
                };
            }
        }
        
        return null;
    }

    // Export proxies
    async exportProxies(format = 'json') {
        try {
            if (format === 'json') {
                return {
                    success: true,
                    data: JSON.stringify(this.proxies, null, 2),
                    filename: `proxies_${Date.now()}.json`
                };
            } else if (format === 'txt') {
                const lines = this.proxies.map(proxy => {
                    if (proxy.username && proxy.password) {
                        return `${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
                    } else {
                        return `${proxy.host}:${proxy.port}`;
                    }
                });
                
                return {
                    success: true,
                    data: lines.join('\n'),
                    filename: `proxies_${Date.now()}.txt`
                };
            }
            
            return { success: false, message: 'Format không hỗ trợ' };
        } catch (error) {
            console.error('[ERROR] Error exporting proxies:', error);
            return { success: false, message: 'Lỗi khi export proxy' };
        }
    }

    // Get proxy statistics
    async getProxyStats() {
        try {
            const stats = {
                total: this.proxies.length,
                live: this.proxies.filter(p => p.status === 'live').length,
                dead: this.proxies.filter(p => p.status === 'dead').length,
                pending: this.proxies.filter(p => p.status === 'pending').length,
                byType: {},
                byTag: {},
                avgResponseTime: 0,
                lastTested: null
            };

            // Count by type
            this.proxies.forEach(proxy => {
                const type = proxy.type || 'http';
                stats.byType[type] = (stats.byType[type] || 0) + 1;
            });

            // Count by tag
            this.proxies.forEach(proxy => {
                if (proxy.tags && Array.isArray(proxy.tags)) {
                    proxy.tags.forEach(tag => {
                        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
                    });
                }
            });

            // Calculate average response time
            const liveProxies = this.proxies.filter(p => p.status === 'live' && p.responseTime);
            if (liveProxies.length > 0) {
                stats.avgResponseTime = Math.round(
                    liveProxies.reduce((sum, p) => sum + p.responseTime, 0) / liveProxies.length
                );
            }

            // Find last tested time
            const testedProxies = this.proxies.filter(p => p.lastTested);
            if (testedProxies.length > 0) {
                stats.lastTested = testedProxies
                    .sort((a, b) => new Date(b.lastTested) - new Date(a.lastTested))[0]
                    .lastTested;
            }

            return { success: true, data: stats };
        } catch (error) {
            console.error('[ERROR] Error getting proxy stats:', error);
            return { success: false, message: 'Lỗi khi lấy thống kê proxy' };
        }
    }

    // Get random working proxy
    async getRandomWorkingProxy(tags = null) {
        try {
            let workingProxies = this.proxies.filter(p => p.status === 'live');
            
            // Filter by tags if specified
            if (tags && Array.isArray(tags) && tags.length > 0) {
                workingProxies = workingProxies.filter(proxy => 
                    proxy.tags && proxy.tags.some(tag => tags.includes(tag))
                );
            }

            if (workingProxies.length === 0) {
                return { success: false, message: 'Không có proxy hoạt động' };
            }

            // Sort by response time and fail count for better selection
            workingProxies.sort((a, b) => {
                const scoreA = (a.responseTime || 999999) + (a.failCount || 0) * 1000;
                const scoreB = (b.responseTime || 999999) + (b.failCount || 0) * 1000;
                return scoreA - scoreB;
            });

            // Select from top 30% of best proxies
            const topCount = Math.max(1, Math.ceil(workingProxies.length * 0.3));
            const topProxies = workingProxies.slice(0, topCount);
            const selectedProxy = topProxies[Math.floor(Math.random() * topProxies.length)];

            // Update last used time
            selectedProxy.lastUsedAt = new Date().toISOString();
            this.saveProxies();

            return { success: true, data: selectedProxy };
        } catch (error) {
            console.error('[ERROR] Error getting random proxy:', error);
            return { success: false, message: 'Lỗi khi lấy proxy ngẫu nhiên' };
        }
    }

    // Clean up dead proxies
    async cleanupDeadProxies(maxFailCount = 5) {
        try {
            const beforeCount = this.proxies.length;
            
            this.proxies = this.proxies.filter(proxy => {
                return proxy.status !== 'dead' || (proxy.failCount || 0) < maxFailCount;
            });

            const removedCount = beforeCount - this.proxies.length;
            
            if (removedCount > 0) {
                this.saveProxies();
                console.log(`[CLEANUP] Removed ${removedCount} dead proxies`);
            }

            return {
                success: true,
                data: {
                    removed: removedCount,
                    remaining: this.proxies.length
                }
            };
        } catch (error) {
            console.error('[ERROR] Error cleaning up proxies:', error);
            return { success: false, message: 'Lỗi khi dọn dẹp proxy' };
        }
    }

    // Rotate proxy for load balancing
    async rotateProxy(currentProxyId, tags = null) {
        try {
            let availableProxies = this.proxies.filter(p => 
                p.status === 'live' && p.id !== currentProxyId
            );

            // Filter by tags if specified
            if (tags && Array.isArray(tags) && tags.length > 0) {
                availableProxies = availableProxies.filter(proxy => 
                    proxy.tags && proxy.tags.some(tag => tags.includes(tag))
                );
            }

            if (availableProxies.length === 0) {
                return { success: false, message: 'Không có proxy khác để xoay' };
            }

            // Sort by last used time (least recently used first)
            availableProxies.sort((a, b) => {
                const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
                const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
                return timeA - timeB;
            });

            const nextProxy = availableProxies[0];
            nextProxy.lastUsedAt = new Date().toISOString();
            this.saveProxies();

            return { success: true, data: nextProxy };
        } catch (error) {
            console.error('[ERROR] Error rotating proxy:', error);
            return { success: false, message: 'Lỗi khi xoay proxy' };
        }
    }

    // Get proxy by ID
    async getProxyById(id) {
        try {
            const proxy = this.proxies.find(p => p.id === id);
            if (!proxy) {
                return { success: false, message: 'Không tìm thấy proxy' };
            }
            return { success: true, data: proxy };
        } catch (error) {
            console.error('[ERROR] Error getting proxy by ID:', error);
            return { success: false, message: 'Lỗi khi lấy proxy' };
        }
    }

    // Update proxy tags
    async updateProxyTags(proxyIds, tags) {
        try {
            if (!Array.isArray(proxyIds) || !Array.isArray(tags)) {
                return { success: false, message: 'Dữ liệu không hợp lệ' };
            }

            let updatedCount = 0;
            
            for (const id of proxyIds) {
                const proxy = this.proxies.find(p => p.id === id);
                if (proxy) {
                    proxy.tags = [...tags];
                    proxy.updatedAt = new Date().toISOString();
                    updatedCount++;
                    
                    // Add new tags to global tags set
                    tags.forEach(tag => this.tags.add(tag));
                }
            }

            if (updatedCount > 0) {
                this.saveProxies();
            }

            return {
                success: true,
                data: { updated: updatedCount }
            };
        } catch (error) {
            console.error('[ERROR] Error updating proxy tags:', error);
            return { success: false, message: 'Lỗi khi cập nhật tags' };
        }
    }

    // Get all available tags
    async getAllTags() {
        try {
            return {
                success: true,
                data: Array.from(this.tags).sort()
            };
        } catch (error) {
            console.error('[ERROR] Error getting tags:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách tags' };
        }
    }
}

// Create singleton instance
const proxyManager = new ProxyManager();

module.exports = proxyManager;