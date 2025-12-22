/**
 * Migration: Add shared_on_cloud column to profiles table
 */

async function addSharedOnCloudColumn() {
    console.log('🔄 Running migration: Add shared_on_cloud column...');
    
    try {
        // Use the existing database connection instead of creating new one
        const { getDatabase } = require('../database');
        const db = getDatabase();
        
        // Check if column already exists
        const tableInfo = await db.all("PRAGMA table_info(profiles)");
        const hasSharedOnCloudColumn = tableInfo.some(column => column.name === 'shared_on_cloud');
        
        if (hasSharedOnCloudColumn) {
            console.log('✅ Column shared_on_cloud already exists, skipping migration');
            return true;
        }
        
        // Add the column
        await db.run("ALTER TABLE profiles ADD COLUMN shared_on_cloud INTEGER DEFAULT 0");
        
        console.log('✅ Migration completed: Added shared_on_cloud column');
        return true;
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return false;
    }
}

module.exports = {
    addSharedOnCloudColumn
};