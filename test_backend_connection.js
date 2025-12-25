/**
 * Test Backend Connection
 * Kiểm tra kết nối với backend API
 */

const http = require('http');

async function testBackendConnection() {
    console.log('🔄 Testing backend connection...');
    
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/health',
        method: 'GET',
        timeout: 5000
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('✅ Backend connection successful:', result);
                    resolve(true);
                } catch (error) {
                    console.log('✅ Backend responded but not JSON:', data);
                    resolve(true);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Backend connection failed:', error.message);
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            console.error('❌ Backend connection timeout');
            resolve(false);
        });

        req.end();
    });
}

async function testProxyEndpoints() {
    console.log('🔄 Testing proxy endpoints...');
    
    // Test health endpoint first
    const isHealthy = await testBackendConnection();
    if (!isHealthy) {
        console.log('❌ Backend is not running. Please start the backend server first.');
        return;
    }
    
    // Test proxy endpoints (these will fail without auth, but we can see if they exist)
    const endpoints = [
        '/api/db/proxy/get-all',
        '/api/db/tag/get-all',
        '/api/proxies'
    ];
    
    for (const endpoint of endpoints) {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 3000
        };

        await new Promise((resolve) => {
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 401) {
                        console.log(`✅ Endpoint ${endpoint} exists (401 Unauthorized - expected)`);
                    } else if (res.statusCode === 422) {
                        console.log(`✅ Endpoint ${endpoint} exists (422 Validation Error - expected)`);
                    } else {
                        console.log(`ℹ️ Endpoint ${endpoint} responded with status ${res.statusCode}`);
                    }
                    resolve();
                });
            });

            req.on('error', (error) => {
                console.error(`❌ Endpoint ${endpoint} failed:`, error.message);
                resolve();
            });

            req.on('timeout', () => {
                req.destroy();
                console.error(`❌ Endpoint ${endpoint} timeout`);
                resolve();
            });

            req.write('{}');
            req.end();
        });
    }
}

// Run tests
testProxyEndpoints().then(() => {
    console.log('🏁 Backend connection test completed');
}).catch((error) => {
    console.error('❌ Test failed:', error);
});