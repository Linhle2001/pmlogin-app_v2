const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

class HwidUtils {
    constructor() {
        this.cachedHwid = null;
    }
    
    /**
     * Get hardware ID based on system information
     * @returns {Promise<string>} Hardware ID
     */
    async getHardwareId() {
        if (this.cachedHwid) {
            return this.cachedHwid;
        }
        
        try {
            const components = await this.gatherSystemComponents();
            const combinedString = components.join('|');
            
            // Create SHA-256 hash
            const hash = crypto.createHash('sha256');
            hash.update(combinedString);
            this.cachedHwid = hash.digest('hex');
            
            console.log('🔧 Hardware ID generated:', this.cachedHwid.substring(0, 16) + '...');
            return this.cachedHwid;
        } catch (error) {
            console.error('❌ Error generating hardware ID:', error);
            // Fallback to basic system info
            return this.getFallbackHwid();
        }
    }
    
    /**
     * Gather system components for HWID generation
     * @returns {Promise<string[]>} Array of system component identifiers
     */
    async gatherSystemComponents() {
        const components = [];
        const platform = os.platform();
        
        try {
            // Basic system info (always available)
            components.push(os.hostname());
            components.push(os.arch());
            components.push(os.platform());
            
            // CPU info
            const cpus = os.cpus();
            if (cpus && cpus.length > 0) {
                components.push(cpus[0].model);
            }
            
            // Memory info
            components.push(os.totalmem().toString());
            
            // Platform-specific components
            if (platform === 'win32') {
                await this.addWindowsComponents(components);
            } else if (platform === 'darwin') {
                await this.addMacComponents(components);
            } else if (platform === 'linux') {
                await this.addLinuxComponents(components);
            }
            
            // Network interfaces (MAC addresses)
            const networkInterfaces = os.networkInterfaces();
            for (const [name, interfaces] of Object.entries(networkInterfaces)) {
                if (interfaces) {
                    for (const iface of interfaces) {
                        if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
                            components.push(iface.mac);
                            break; // Only take first valid MAC
                        }
                    }
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Error gathering some system components:', error.message);
        }
        
        return components.filter(Boolean); // Remove empty values
    }
    
    /**
     * Add Windows-specific components
     * @param {string[]} components Array to add components to
     */
    async addWindowsComponents(components) {
        try {
            // Windows Product ID
            const productId = execSync('wmic os get SerialNumber /value', { 
                encoding: 'utf8', 
                timeout: 5000 
            }).match(/SerialNumber=(.+)/)?.[1]?.trim();
            
            if (productId) {
                components.push(productId);
            }
            
            // Motherboard serial
            const motherboardSerial = execSync('wmic baseboard get SerialNumber /value', { 
                encoding: 'utf8', 
                timeout: 5000 
            }).match(/SerialNumber=(.+)/)?.[1]?.trim();
            
            if (motherboardSerial && motherboardSerial !== 'To be filled by O.E.M.') {
                components.push(motherboardSerial);
            }
            
            // CPU ID
            const cpuId = execSync('wmic cpu get ProcessorId /value', { 
                encoding: 'utf8', 
                timeout: 5000 
            }).match(/ProcessorId=(.+)/)?.[1]?.trim();
            
            if (cpuId) {
                components.push(cpuId);
            }
            
        } catch (error) {
            console.warn('⚠️ Error getting Windows-specific components:', error.message);
        }
    }
    
    /**
     * Add macOS-specific components
     * @param {string[]} components Array to add components to
     */
    async addMacComponents(components) {
        try {
            // Hardware UUID
            const hardwareUuid = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { 
                encoding: 'utf8', 
                timeout: 5000 
            }).match(/Hardware UUID: (.+)/)?.[1]?.trim();
            
            if (hardwareUuid) {
                components.push(hardwareUuid);
            }
            
            // Serial number
            const serialNumber = execSync('system_profiler SPHardwareDataType | grep "Serial Number"', { 
                encoding: 'utf8', 
                timeout: 5000 
            }).match(/Serial Number \(system\): (.+)/)?.[1]?.trim();
            
            if (serialNumber) {
                components.push(serialNumber);
            }
            
        } catch (error) {
            console.warn('⚠️ Error getting macOS-specific components:', error.message);
        }
    }
    
    /**
     * Add Linux-specific components
     * @param {string[]} components Array to add components to
     */
    async addLinuxComponents(components) {
        try {
            // Machine ID
            const machineId = execSync('cat /etc/machine-id 2>/dev/null || cat /var/lib/dbus/machine-id 2>/dev/null', { 
                encoding: 'utf8', 
                timeout: 5000 
            }).trim();
            
            if (machineId) {
                components.push(machineId);
            }
            
            // DMI Product UUID
            const productUuid = execSync('sudo dmidecode -s system-uuid 2>/dev/null', { 
                encoding: 'utf8', 
                timeout: 5000 
            }).trim();
            
            if (productUuid && !productUuid.includes('Permission denied')) {
                components.push(productUuid);
            }
            
        } catch (error) {
            console.warn('⚠️ Error getting Linux-specific components:', error.message);
        }
    }
    
    /**
     * Generate fallback HWID when detailed system info is not available
     * @returns {string} Fallback hardware ID
     */
    getFallbackHwid() {
        const fallbackComponents = [
            os.hostname(),
            os.arch(),
            os.platform(),
            os.totalmem().toString(),
            os.cpus()[0]?.model || 'unknown-cpu'
        ];
        
        const combinedString = fallbackComponents.join('|');
        const hash = crypto.createHash('sha256');
        hash.update(combinedString);
        const fallbackHwid = hash.digest('hex');
        
        console.log('🔧 Fallback Hardware ID generated:', fallbackHwid.substring(0, 16) + '...');
        this.cachedHwid = fallbackHwid;
        
        return fallbackHwid;
    }
    
    /**
     * Clear cached HWID (for testing purposes)
     */
    clearCache() {
        this.cachedHwid = null;
    }
    
    /**
     * Get system information for display
     * @returns {Object} System information object
     */
    getSystemInfo() {
        return {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
            cpuModel: os.cpus()[0]?.model || 'Unknown',
            cpuCores: os.cpus().length
        };
    }
}

// Create singleton instance
const hwidUtils = new HwidUtils();

module.exports = hwidUtils;