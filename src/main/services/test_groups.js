/**
 * Test Groups Functionality
 * Script để test các chức năng group management
 */

const { getDatabaseManager } = require('./database_manager');

async function testGroupFunctionality() {
    console.log('🧪 Testing Group Functionality...');
    
    const dbManager = getDatabaseManager();
    await dbManager.initialize();
    
    try {
        // 1. Test tạo groups
        console.log('\n1. Testing group creation...');
        const group1Id = await dbManager.createGroup('Work Profiles');
        const group2Id = await dbManager.createGroup('Personal Profiles');
        const group3Id = await dbManager.createGroup('Test Profiles');
        
        console.log(`✅ Created groups: Work(${group1Id}), Personal(${group2Id}), Test(${group3Id})`);
        
        // 2. Test lấy tất cả groups
        console.log('\n2. Testing get all groups...');
        const allGroups = await dbManager.getAllGroups();
        console.log('✅ All groups:', allGroups);
        
        // 3. Test tạo sample profiles
        console.log('\n3. Creating sample profiles...');
        const profile1Id = await dbManager.addProfile({
            name: 'Profile 1',
            platform: 'Chrome',
            note: 'Work profile',
            proxy: JSON.stringify({ type: 'none' }),
            status: 'Ready',
            tags: ['work', 'important'],
            groups: []
        });
        
        const profile2Id = await dbManager.addProfile({
            name: 'Profile 2',
            platform: 'Firefox',
            note: 'Personal profile',
            proxy: JSON.stringify({ type: 'none' }),
            status: 'Ready',
            tags: ['personal'],
            groups: []
        });
        
        console.log(`✅ Created profiles: ${profile1Id}, ${profile2Id}`);
        
        // 4. Test assign profiles to groups
        console.log('\n4. Testing assign profiles to groups...');
        await dbManager.assignProfilesToGroup([profile1Id], 'Work Profiles');
        await dbManager.assignProfilesToGroup([profile2Id], 'Personal Profiles');
        await dbManager.assignProfilesToGroup([profile1Id, profile2Id], 'Test Profiles');
        
        console.log('✅ Assigned profiles to groups');
        
        // 5. Test get profiles by group
        console.log('\n5. Testing get profiles by group...');
        const workProfiles = await dbManager.getProfilesByGroup('Work Profiles');
        const personalProfiles = await dbManager.getProfilesByGroup('Personal Profiles');
        const testProfiles = await dbManager.getProfilesByGroup('Test Profiles');
        
        console.log('✅ Work Profiles:', workProfiles.map(p => p.name));
        console.log('✅ Personal Profiles:', personalProfiles.map(p => p.name));
        console.log('✅ Test Profiles:', testProfiles.map(p => p.name));
        
        // 6. Test get group stats
        console.log('\n6. Testing group stats...');
        const groupStats = await dbManager.getGroupStats();
        console.log('✅ Group stats:', groupStats);
        
        // 7. Test get profile count for specific group
        console.log('\n7. Testing profile count for groups...');
        const workCount = await dbManager.getProfileCountForGroup('Work Profiles');
        const personalCount = await dbManager.getProfileCountForGroup('Personal Profiles');
        const testCount = await dbManager.getProfileCountForGroup('Test Profiles');
        
        console.log(`✅ Profile counts: Work(${workCount}), Personal(${personalCount}), Test(${testCount})`);
        
        // 8. Test remove profile from group
        console.log('\n8. Testing remove profile from group...');
        await dbManager.removeProfileFromGroup(profile1Id, 'Test Profiles');
        const testProfilesAfterRemove = await dbManager.getProfilesByGroup('Test Profiles');
        console.log('✅ Test Profiles after removal:', testProfilesAfterRemove.map(p => p.name));
        
        // 9. Test delete group
        console.log('\n9. Testing delete group...');
        await dbManager.deleteGroup('Test Profiles');
        const groupsAfterDelete = await dbManager.getAllGroups();
        console.log('✅ Groups after deletion:', groupsAfterDelete);
        
        console.log('\n🎉 All group functionality tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await dbManager.close();
    }
}

// Run test if called directly
if (require.main === module) {
    testGroupFunctionality().catch(console.error);
}

module.exports = { testGroupFunctionality };