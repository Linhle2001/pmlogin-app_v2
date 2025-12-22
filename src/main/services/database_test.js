/**
 * Database Test - Test các chức năng database
 */

const { getDatabaseManager } = require('./database_manager');

async function testDatabase() {
    console.log('🧪 Starting database tests...\n');

    const dbManager = getDatabaseManager();

    try {
        // Initialize database
        console.log('1. Initializing database...');
        await dbManager.initialize();
        console.log('✅ Database initialized\n');

        // Test stats
        console.log('2. Getting database stats...');
        const initialStats = await dbManager.getStats();
        console.log('📊 Initial stats:', initialStats);
        console.log('');

        // Test tags
        console.log('3. Testing tags...');
        const tagId1 = await dbManager.createTag('Residential');
        const tagId2 = await dbManager.createTag('Datacenter');
        console.log(`✅ Created tags: Residential (${tagId1}), Datacenter (${tagId2})`);
        
        const allTags = await dbManager.getAllTags();
        console.log('📋 All tags:', allTags.map(t => t.name).join(', '));
        console.log('');

        // Test proxies
        console.log('4. Testing proxies...');
        const proxyData1 = {
            name: 'Test Proxy 1',
            host: '192.168.1.100',
            port: 8080,
            username: 'user1',
            password: 'pass1',
            type: 'http',
            status: 'live',
            tags: ['Residential', 'Premium']
        };

        const proxyData2 = {
            host: '10.0.0.50',
            port: 3128,
            type: 'socks5',
            tags: ['Datacenter']
        };

        const proxyId1 = await dbManager.addProxy(proxyData1);
        const proxyId2 = await dbManager.addProxy(proxyData2);
        console.log(`✅ Added proxies: ${proxyId1}, ${proxyId2}`);

        const allProxies = await dbManager.getAllProxies();
        console.log(`📋 All proxies (${allProxies.length}):`);
        allProxies.forEach(p => {
            console.log(`  - ${p.name || p.host + ':' + p.port} [${p.tags.join(', ')}] (${p.status || 'unchecked'})`);
        });
        console.log('');

        // Test groups
        console.log('5. Testing groups...');
        const groupId1 = await dbManager.createGroup('Social Media');
        const groupId2 = await dbManager.createGroup('E-commerce');
        console.log(`✅ Created groups: Social Media (${groupId1}), E-commerce (${groupId2})`);
        console.log('');

        // Test profiles
        console.log('6. Testing profiles...');
        const profileData1 = {
            name: 'Facebook Profile 1',
            platform: 'Facebook',
            note: 'Test profile for social media',
            proxy: 'http://192.168.1.100:8080:user1:pass1',
            status: 'Ready',
            tags: ['Social', 'Active'],
            groups: ['Social Media']
        };

        const profileData2 = {
            name: 'Amazon Profile 1',
            platform: 'Amazon',
            note: 'E-commerce profile',
            proxy: 'socks5://10.0.0.50:3128',
            status: 'Ready',
            tags: ['Shopping'],
            groups: ['E-commerce']
        };

        const profileId1 = await dbManager.addProfile(profileData1);
        const profileId2 = await dbManager.addProfile(profileData2);
        console.log(`✅ Added profiles: ${profileId1}, ${profileId2}`);

        const allProfiles = await dbManager.getAllProfiles();
        console.log(`📋 All profiles (${allProfiles.length}):`);
        allProfiles.forEach(p => {
            console.log(`  - ${p.name} [${p.platform}] - Groups: [${p.groups.join(', ')}] - Tags: [${p.tags.join(', ')}]`);
        });
        console.log('');

        // Test group queries
        console.log('7. Testing group queries...');
        const socialProfiles = await dbManager.getProfilesByGroup('Social Media');
        console.log(`📋 Social Media profiles (${socialProfiles.length}):`);
        socialProfiles.forEach(p => {
            console.log(`  - ${p.name} [${p.platform}]`);
        });
        console.log('');

        // Test proxy status update
        console.log('8. Testing proxy status update...');
        await dbManager.updateProxyStatus('192.168.1.100', 8080, 'dead', 1);
        console.log('✅ Updated proxy status to dead');

        const updatedProxies = await dbManager.getLiveProxies();
        console.log(`📋 Live proxies (${updatedProxies.length}):`);
        updatedProxies.forEach(p => {
            console.log(`  - ${p.host}:${p.port} [${p.tags.join(', ')}]`);
        });
        console.log('');

        // Final stats
        console.log('9. Final database stats...');
        const finalStats = await dbManager.getStats();
        console.log('📊 Final stats:', finalStats);
        console.log('');

        console.log('✅ All database tests completed successfully!');

    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        await dbManager.close();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testDatabase();
}

module.exports = { testDatabase };