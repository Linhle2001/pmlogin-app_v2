const { machineId } = require('node-machine-id');
const si = require('systeminformation');
const crypto = require('crypto');

/**
 * Generate Hardware ID based on system information
 * Similar to Python version but using Node.js libraries
 */
async function getHardwareId() {
    try {
        console.log('[SEARCH] Generating Hardware ID...');
        
        // Get machine ID (similar to Python's uuid.getnode())
        const machineIdValue = await machineId();
        console.log('Machine ID:', machineIdValue);
        
        // Get system information
        const [cpu, system, osInfo] = await Promise.all([
            si.cpu(),
            si.system(),
            si.osInfo()
        ]);
        
        // Create hardware fingerprint
        const components = [
            machineIdValue,
            cpu.manufacturer || '',
            cpu.brand || '',
            system.manufacturer || '',
            system.model || '',
            system.serial || '',
            osInfo.platform || '',
            osInfo.arch || ''
        ];
        
        // Filter out empty values and join
        const fingerprint = components
            .filter(component => component && component.trim() !== '')
            .join('|');
        
        console.log('Hardware fingerprint:', fingerprint);
        
        // Generate SHA-256 hash
        const hwid = crypto
            .createHash('sha256')
            .update(fingerprint)
            .digest('hex')
            .substring(0, 32); // Take first 32 characters
        
        console.log('[SUCCESS] Hardware ID generated:', hwid);
        return hwid;
        
    } catch (error) {
        console.error('[ERROR] Error generating Hardware ID:', error);
        
        // Fallback to machine ID only
        try {
            const fallbackId = await machineId();
            const fallbackHwid = crypto
                .createHash('sha256')
                .update(fallbackId)
                .digest('hex')
                .substring(0, 32);
            
            console.log('[WARNING] Using fallback Hardware ID:', fallbackHwid);
            return fallbackHwid;
        } catch (fallbackError) {
            console.error('[ERROR] Fallback Hardware ID generation failed:', fallbackError);
            
            // Last resort: generate random ID (not recommended for production)
            const randomHwid = crypto.randomBytes(16).toString('hex');
            console.log('🎲 Using random Hardware ID:', randomHwid);
            return randomHwid;
        }
    }
}

/**
 * Get detailed system information for debugging
 */
async function getSystemInfo() {
    try {
        const [cpu, system, osInfo, mem, graphics] = await Promise.all([
            si.cpu(),
            si.system(),
            si.osInfo(),
            si.mem(),
            si.graphics()
        ]);
        
        return {
            cpu: {
                manufacturer: cpu.manufacturer,
                brand: cpu.brand,
                family: cpu.family,
                model: cpu.model,
                cores: cpu.cores,
                physicalCores: cpu.physicalCores
            },
            system: {
                manufacturer: system.manufacturer,
                model: system.model,
                version: system.version,
                serial: system.serial,
                uuid: system.uuid
            },
            os: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                release: osInfo.release,
                arch: osInfo.arch,
                hostname: osInfo.hostname
            },
            memory: {
                total: Math.round(mem.total / 1024 / 1024 / 1024), // GB
                available: Math.round(mem.available / 1024 / 1024 / 1024) // GB
            },
            graphics: graphics.controllers.map(gpu => ({
                vendor: gpu.vendor,
                model: gpu.model,
                vram: gpu.vram
            }))
        };
    } catch (error) {
        console.error('Error getting system info:', error);
        return null;
    }
}

/**
 * Validate Hardware ID format
 */
function validateHwid(hwid) {
    if (!hwid || typeof hwid !== 'string') {
        return false;
    }
    
    // Should be 32 character hex string
    const hwidRegex = /^[a-f0-9]{32}$/i;
    return hwidRegex.test(hwid);
}

/**
 * Legacy function name for compatibility
 */
function generate_hwid() {
    return getHardwareId();
}

module.exports = {
    getHardwareId,
    getSystemInfo,
    validateHwid,
    generate_hwid // Legacy compatibility
};