/**
 * Test groups loading
 */

const { getDatabaseManager } = require('./src/main/services/database_manager');

async function testGroups() {
    console.log('🧪 Testing groups loading...\n');

    const dbManager = getDatabaseManager();

    try {
        await dbManager.initialize();
        
        console.log('1. Getting all groups...');
        const groups = await dbManager.getAllGroups();
        console.log('Groups:', groups);
        console.log('Groups type:', typeof groups);
        console.log('Groups length:', groups.length);
        
        if (groups.length > 0) {
            console.log('First group:', groups[0]);
            console.log('First group type:', typeof groups[0]);
            console.log('First group keys:', Object.keys(groups[0]));
        }
        
        console.log('\n✅ Groups test completed');
        
    } catch (error) {
        console.error('❌ Groups test failed:', error);
    } finally {
        await dbManager.close();
    }
}

testGroups();