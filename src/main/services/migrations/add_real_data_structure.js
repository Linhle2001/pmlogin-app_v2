/**
 * Migration: Add real data structure
 * Cập nhật cấu trúc database để lưu thông tin thật thay vì sample data
 */

const { getDatabase } = require('../database');

async function addRealDataStructure() {
    const db = getDatabase();
    
    try {
        console.log('🔄 Running migration: Add real data structure...');
        
        // Thêm cột owner_id vào bảng profiles nếu chưa có
        await db.run(`
            ALTER TABLE profiles ADD COLUMN owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        `).catch(() => {
            // Ignore error if column already exists
            console.log('Column owner_id already exists in profiles table');
        });
        
        // Thêm cột owner_id vào bảng proxies nếu chưa có
        await db.run(`
            ALTER TABLE proxies ADD COLUMN owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        `).catch(() => {
            // Ignore error if column already exists
            console.log('Column owner_id already exists in proxies table');
        });
        
        // Thêm các cột mới cho bảng proxies
        const proxyColumns = [
            'response_time REAL',
            'public_ip TEXT',
            'location TEXT',
            'last_tested TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];
        
        for (const column of proxyColumns) {
            await db.run(`ALTER TABLE proxies ADD COLUMN ${column}`).catch(() => {
                console.log(`Column ${column.split(' ')[0]} already exists in proxies table`);
            });
        }
        
        // Thêm cột created_at cho bảng profiles nếu chưa có
        await db.run(`
            ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `).catch(() => {
            console.log('Column created_at already exists in profiles table');
        });
        
        // Cập nhật cột updated_at và last_started_at trong profiles
        await db.run(`
            ALTER TABLE profiles ADD COLUMN updated_at_new TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `).catch(() => {
            console.log('Column updated_at_new already exists in profiles table');
        });
        
        await db.run(`
            ALTER TABLE profiles ADD COLUMN last_started_at_new TIMESTAMP
        `).catch(() => {
            console.log('Column last_started_at_new already exists in profiles table');
        });
        
        // Thêm cột created_at cho bảng groups nếu chưa có
        await db.run(`
            ALTER TABLE groups ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `).catch(() => {
            console.log('Column created_at already exists in groups table');
        });
        
        console.log('✅ Migration completed: Add real data structure');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

module.exports = {
    addRealDataStructure
};