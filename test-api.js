const apiClient = require('./src/main/services/api_client');
const hwidUtils = require('./src/main/services/hwid_utils');
const axios = require('axios');

async function testApiConnection() {
    console.log('🧪 Testing API Connection...');
    console.log('📡 Base URL:', process.env.BASE_URL || 'https://pm-login.nhatcms.net');
    
    try {
        // Test basic server connectivity
        console.log('\n🌐 Testing basic server connectivity...');
        try {
            const response = await axios.get(process.env.BASE_URL || 'https://pm-login.nhatcms.net', {
                timeout: 10000,
                validateStatus: () => true // Accept any status code
            });
            console.log('✅ Server responded with status:', response.status);
        } catch (error) {
            console.log('❌ Server connectivity failed:', error.message);
        }
        
        // Test API info endpoints
        console.log('\n📊 Testing API info endpoints...');
        try {
            const plansResponse = await axios.get(process.env.API_PLANS_URL || 'https://pm-login.nhatcms.net/api/info/plans', {
                timeout: 10000,
                validateStatus: () => true
            });
            console.log('Plans endpoint status:', plansResponse.status);
            
            const systemResponse = await axios.get(process.env.API_SYSTEM_URL || 'https://pm-login.nhatcms.net/api/info/system', {
                timeout: 10000,
                validateStatus: () => true
            });
            console.log('System endpoint status:', systemResponse.status);
        } catch (error) {
            console.log('❌ Info endpoints failed:', error.message);
        }
        
        // Test hardware ID generation
        console.log('\n🔧 Testing Hardware ID generation...');
        const hwid = await hwidUtils.getHardwareId();
        console.log('✅ Hardware ID:', hwid.substring(0, 16) + '...');
        
        // Test system info
        console.log('\n💻 System Information:');
        const systemInfo = hwidUtils.getSystemInfo();
        console.log(JSON.stringify(systemInfo, null, 2));
        
        // Test different auth endpoints
        console.log('\n🔐 Testing auth endpoints...');
        
        // Test login endpoint with different paths
        const authPaths = [
            '/api/auth/login',
            '/api/login',
            '/auth/login',
            '/login'
        ];
        
        for (const authPath of authPaths) {
            try {
                console.log(`\n🧪 Testing: ${authPath}`);
                const testUrl = (process.env.BASE_URL || 'https://pm-login.nhatcms.net') + authPath;
                const response = await axios.post(testUrl, {
                    email: 'test@example.com',
                    password: 'test123',
                    hwid: hwid
                }, {
                    timeout: 10000,
                    validateStatus: () => true,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                console.log(`Status: ${response.status}`);
                if (response.status !== 404) {
                    console.log('Response data:', JSON.stringify(response.data, null, 2));
                    if (response.status === 200 || response.status === 401 || response.status === 422) {
                        console.log('✅ Found working auth endpoint:', authPath);
                        break;
                    }
                }
            } catch (error) {
                console.log(`❌ ${authPath} failed:`, error.message);
            }
        }
        
        console.log('\n✅ API test completed!');
        
    } catch (error) {
        console.error('❌ API test failed:', error);
    }
}

// Run the test
testApiConnection();