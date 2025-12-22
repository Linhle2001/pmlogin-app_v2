/**
 * Script để thêm shared_on_cloud column vào profiles table
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addSharedColumn() {
    console.log('🔧 Adding shared_on_cloud column to profiles table...');
    
    const dbPath = path.join(__dirname, 'storage', 'app.db');
    const db = new sqlite3.Database(dbPath);
    
    try {
        // Check if column already exists
        const tableInfo = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(profiles)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const hasSharedColumn = tableInfo.some(col => col.name === 'shared_on_cloud');
        
        if (hasSharedColumn) {
            console.log('✅ Column shared_on_cloud already exists');
            return;
        }
        
        // Add the column
        await new Promise((resolve, reject) => {
            db.run("ALTER TABLE profiles ADD COLUMN shared_on_cloud INTEGER DEFAULT 0", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ Successfully added shared_on_cloud column');
        
        // Verify the column was added
        const newTableInfo = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(profiles)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log('📋 Updated table structure:');
        newTableInfo.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} (default: ${col.dflt_value})`);
        });
        
    } catch (error) {
        console.error('❌ Error adding column:', error);
    } finally {
        db.close();
    }
}

// Run the script
addSharedColumn().then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
}).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
});