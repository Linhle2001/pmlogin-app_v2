#!/usr/bin/env node

/**
 * Debug Handlers - Test database handlers directly
 */

const path = require('path');

// Set up environment
process.env.NODE_ENV = 'development';

async function testHandlers() {
    console.log('🔍 Testing database handlers...\n');

    try {
        // Import database manager
        const { getDatabaseManager } = require('./src/main/services/database_manager');
        const dbManager = getDatabaseManager();

        console.log('1. Initializing database manager...');
        await dbManager.initialize();
        console.log('✅ Database manager initialized\n');

        console.log('2. Testing bulkAddProxies method...');
        const testProxies = [
            {
                host: '192.168.1.100',
                port: 8080,
                type: 'http',
                tags: ['Test', 'Debug']
            },
            {
                host: '192.168.1.101',
                port: 8080,
                type: 'socks5',
                username: 'user',
                password: 'pass',
                tags: ['Test', 'Auth']
            }
        ];

        const results = await dbManager.bulkAddProxies(testProxies);
        console.log('✅ bulkAddProxies results:', results);
        console.log('');

        console.log('3. Testing getAllProxies method...');
        const allProxies = await dbManager.getAllProxies();
        console.log(`✅ Found ${allProxies.length} proxies`);
        console.log('');

        console.log('4. Testing getStats method...');
        const stats = await dbManager.getStats();
        console.log('✅ Stats:', stats);
        console.log('');

        console.log('✅ All handlers working correctly!');

    } catch (error) {
        console.error('❌ Handler test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run tests
testHandlers();