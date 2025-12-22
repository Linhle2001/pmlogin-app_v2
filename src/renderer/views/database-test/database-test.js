/**
 * Database Test Renderer Script
 */

class DatabaseTestRenderer {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadStats();
    }

    initializeElements() {
        this.elements = {
            proxyCount: document.getElementById('proxy-count'),
            profileCount: document.getElementById('profile-count'),
            tagCount: document.getElementById('tag-count'),
            groupCount: document.getElementById('group-count'),
            refreshStats: document.getElementById('refresh-stats'),
            runFullTest: document.getElementById('run-full-test'),
            addSampleData: document.getElementById('add-sample-data'),
            testProxies: document.getElementById('test-proxies'),
            testProfiles: document.getElementById('test-profiles'),
            testResults: document.getElementById('test-results'),
            clearResults: document.getElementById('clear-results'),
            backToMain: document.getElementById('back-to-main')
        };
    }

    attachEventListeners() {
        this.elements.refreshStats.addEventListener('click', () => this.loadStats());
        this.elements.runFullTest.addEventListener('click', () => this.runFullTest());
        this.elements.addSampleData.addEventListener('click', () => this.addSampleData());
        this.elements.testProxies.addEventListener('click', () => this.testProxyOperations());
        this.elements.testProfiles.addEventListener('click', () => this.testProfileOperations());
        this.elements.clearResults.addEventListener('click', () => this.clearResults());
        this.elements.backToMain.addEventListener('click', () => this.backToMain());
    }

    async loadStats() {
        try {
            this.log('Loading database statistics...');
            const result = await window.electronAPI.invoke('db:stats');
            
            if (result.success) {
                const stats = result.data;
                this.elements.proxyCount.textContent = stats.proxies || 0;
                this.elements.profileCount.textContent = stats.profiles || 0;
                this.elements.tagCount.textContent = stats.tags || 0;
                this.elements.groupCount.textContent = stats.groups || 0;
                this.log('✅ Stats loaded successfully');
            } else {
                this.log('❌ Failed to load stats: ' + result.message);
            }
        } catch (error) {
            this.log('❌ Error loading stats: ' + error.message);
        }
    }

    async runFullTest() {
        try {
            this.log('🧪 Running full database test...');
            this.disableButtons(true);
            
            const result = await window.electronAPI.invoke('db:test');
            
            if (result.success) {
                this.log('✅ Full database test completed successfully');
            } else {
                this.log('❌ Database test failed: ' + result.message);
            }
            
            await this.loadStats();
        } catch (error) {
            this.log('❌ Error running full test: ' + error.message);
        } finally {
            this.disableButtons(false);
        }
    }

    async addSampleData() {
        try {
            this.log('📝 Adding sample data...');
            this.disableButtons(true);

            // Add sample tags
            this.log('Creating sample tags...');
            await window.electronAPI.invoke('db:tag:create', 'Residential');
            await window.electronAPI.invoke('db:tag:create', 'Datacenter');
            await window.electronAPI.invoke('db:tag:create', 'Premium');

            // Add sample groups
            this.log('Creating sample groups...');
            await window.electronAPI.invoke('db:group:create', 'Social Media');
            await window.electronAPI.invoke('db:group:create', 'E-commerce');

            // Add sample proxies
            this.log('Adding sample proxies...');
            const sampleProxies = [
                {
                    name: 'Sample Proxy 1',
                    host: '192.168.1.100',
                    port: 8080,
                    username: 'user1',
                    password: 'pass1',
                    type: 'http',
                    status: 'live',
                    tags: ['Residential', 'Premium']
                },
                {
                    name: 'Sample Proxy 2',
                    host: '10.0.0.50',
                    port: 3128,
                    type: 'socks5',
                    tags: ['Datacenter']
                },
                {
                    host: '203.0.113.1',
                    port: 1080,
                    username: 'testuser',
                    password: 'testpass',
                    type: 'socks4',
                    status: 'live',
                    tags: ['Premium']
                }
            ];

            for (const proxy of sampleProxies) {
                const result = await window.electronAPI.invoke('db:proxy:add', proxy);
                if (result.success) {
                    this.log(`✅ Added proxy: ${proxy.host}:${proxy.port}`);
                } else {
                    this.log(`❌ Failed to add proxy: ${proxy.host}:${proxy.port}`);
                }
            }

            // Add sample profiles
            this.log('Adding sample profiles...');
            const sampleProfiles = [
                {
                    name: 'Facebook Profile 1',
                    platform: 'Facebook',
                    note: 'Test profile for social media automation',
                    proxy: 'http://user1:pass1@192.168.1.100:8080',
                    status: 'Ready',
                    tags: ['Social', 'Active'],
                    groups: ['Social Media']
                },
                {
                    name: 'Amazon Profile 1',
                    platform: 'Amazon',
                    note: 'E-commerce automation profile',
                    proxy: 'socks5://10.0.0.50:3128',
                    status: 'Ready',
                    tags: ['Shopping', 'Premium'],
                    groups: ['E-commerce']
                },
                {
                    name: 'Instagram Profile 1',
                    platform: 'Instagram',
                    note: 'Social media marketing profile',
                    proxy: 'socks4://testuser:testpass@203.0.113.1:1080',
                    status: 'Ready',
                    tags: ['Social', 'Marketing'],
                    groups: ['Social Media']
                }
            ];

            for (const profile of sampleProfiles) {
                const result = await window.electronAPI.invoke('db:profile:add', profile);
                if (result.success) {
                    this.log(`✅ Added profile: ${profile.name}`);
                } else {
                    this.log(`❌ Failed to add profile: ${profile.name}`);
                }
            }

            this.log('✅ Sample data added successfully');
            await this.loadStats();

        } catch (error) {
            this.log('❌ Error adding sample data: ' + error.message);
        } finally {
            this.disableButtons(false);
        }
    }

    async testProxyOperations() {
        try {
            this.log('🔧 Testing proxy operations...');
            this.disableButtons(true);

            // Get all proxies
            this.log('Getting all proxies...');
            const allProxiesResult = await window.electronAPI.invoke('db:proxy:get-all');
            if (allProxiesResult.success) {
                this.log(`✅ Found ${allProxiesResult.data.length} proxies`);
                allProxiesResult.data.forEach(proxy => {
                    this.log(`  - ${proxy.name || proxy.host + ':' + proxy.port} [${proxy.tags.join(', ')}] (${proxy.status || 'unchecked'})`);
                });
            }

            // Get live proxies
            this.log('Getting live proxies...');
            const liveProxiesResult = await window.electronAPI.invoke('db:proxy:get-live');
            if (liveProxiesResult.success) {
                this.log(`✅ Found ${liveProxiesResult.data.length} live proxies`);
            }

            // Test proxy status update
            if (allProxiesResult.success && allProxiesResult.data.length > 0) {
                const firstProxy = allProxiesResult.data[0];
                this.log(`Testing status update for ${firstProxy.host}:${firstProxy.port}...`);
                
                const updateResult = await window.electronAPI.invoke('db:proxy:update-status', 
                    firstProxy.host, firstProxy.port, 'dead', 1, 'http');
                
                if (updateResult.success) {
                    this.log('✅ Proxy status updated successfully');
                } else {
                    this.log('❌ Failed to update proxy status');
                }
            }

            this.log('✅ Proxy operations test completed');

        } catch (error) {
            this.log('❌ Error testing proxy operations: ' + error.message);
        } finally {
            this.disableButtons(false);
        }
    }

    async testProfileOperations() {
        try {
            this.log('👤 Testing profile operations...');
            this.disableButtons(true);

            // Get all profiles
            this.log('Getting all profiles...');
            const allProfilesResult = await window.electronAPI.invoke('db:profile:get-all');
            if (allProfilesResult.success) {
                this.log(`✅ Found ${allProfilesResult.data.length} profiles`);
                allProfilesResult.data.forEach(profile => {
                    this.log(`  - ${profile.name} [${profile.platform || 'N/A'}] - Groups: [${profile.groups.join(', ')}] - Tags: [${profile.tags.join(', ')}]`);
                });
            }

            // Test profile creation
            this.log('Creating test profile...');
            const testProfile = {
                name: 'Test Profile ' + Date.now(),
                platform: 'Test Platform',
                note: 'This is a test profile',
                proxy: 'No proxy',
                status: 'Ready',
                tags: ['Test', 'Temporary'],
                groups: ['Test Group']
            };

            const createResult = await window.electronAPI.invoke('db:profile:add', testProfile);
            if (createResult.success) {
                this.log(`✅ Created test profile with ID: ${createResult.data.id}`);
                
                // Test profile update
                const updateResult = await window.electronAPI.invoke('db:profile:update', 
                    createResult.data.id, { note: 'Updated test profile' });
                
                if (updateResult.success) {
                    this.log('✅ Profile updated successfully');
                } else {
                    this.log('❌ Failed to update profile');
                }

                // Test profile deletion
                const deleteResult = await window.electronAPI.invoke('db:profile:delete', createResult.data.id);
                if (deleteResult.success) {
                    this.log('✅ Test profile deleted successfully');
                } else {
                    this.log('❌ Failed to delete test profile');
                }
            }

            // Test group operations
            this.log('Testing group operations...');
            const groupsResult = await window.electronAPI.invoke('db:group:get-all');
            if (groupsResult.success) {
                this.log(`✅ Found ${groupsResult.data.length} groups: ${groupsResult.data.join(', ')}`);
                
                if (groupsResult.data.length > 0) {
                    const firstGroup = groupsResult.data[0];
                    const groupProfilesResult = await window.electronAPI.invoke('db:group:get-profiles', firstGroup);
                    if (groupProfilesResult.success) {
                        this.log(`✅ Group '${firstGroup}' has ${groupProfilesResult.data.length} profiles`);
                    }
                }
            }

            this.log('✅ Profile operations test completed');

        } catch (error) {
            this.log('❌ Error testing profile operations: ' + error.message);
        } finally {
            this.disableButtons(false);
        }
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}\n`;
        this.elements.testResults.textContent += logEntry;
        this.elements.testResults.scrollTop = this.elements.testResults.scrollHeight;
        console.log(message);
    }

    clearResults() {
        this.elements.testResults.textContent = 'Results cleared...\n';
    }

    disableButtons(disabled) {
        const buttons = [
            this.elements.runFullTest,
            this.elements.addSampleData,
            this.elements.testProxies,
            this.elements.testProfiles
        ];

        buttons.forEach(button => {
            button.disabled = disabled;
            if (disabled) {
                button.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                button.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    }

    async backToMain() {
        try {
            await window.electronAPI.invoke('nav:to-main');
        } catch (error) {
            console.error('Navigation error:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DatabaseTestRenderer();
});