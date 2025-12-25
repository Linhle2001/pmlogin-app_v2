/**
 * Database Service - SQLite database management for Electron app
 * Tương tự như pmlogin-app nhưng sử dụng JavaScript/Node.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = this.getDbPath();
    }

    getDbPath() {
        // Tạo thư mục storage nếu chưa tồn tại
        const storageDir = path.join(__dirname, '../../../storage');
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }
        return path.join(storageDir, 'app.db');
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Database connection error:', err);
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database:', this.dbPath);
                    this.initializeTables()
                        .then(() => resolve(true))
                        .catch(reject);
                }
            });
        });
    }

    async initializeTables() {
        return new Promise((resolve, reject) => {
            // Enable foreign keys
            this.db.run("PRAGMA foreign_keys = ON", (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Create all tables
                this.createTables()
                    .then(() => {
                        console.log('✅ Database tables initialized');
                        // Run migrations after table creation
                        return this.runMigrations();
                    })
                    .then(() => {
                        resolve();
                    })
                    .catch(reject);
            });
        });
    }

    async runMigrations() {
        try {
            console.log('🔄 Running database migrations...');
            
            // Import and run migrations
            const { addSharedOnCloudColumn } = require('./migrations/add_shared_on_cloud');
            await addSharedOnCloudColumn();
            
            const { addRealDataStructure } = require('./migrations/add_real_data_structure');
            await addRealDataStructure();
            
            console.log('✅ All migrations completed');
        } catch (error) {
            console.error('❌ Migration error:', error);
            // Don't throw error, just log it
        }
    }

    async createTables() {
        const tables = [
            // Bảng users - Quản lý người dùng
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                hwid TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )`,

            // Bảng tags - Nhãn phân loại
            `CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Bảng groups - Nhóm profiles
            `CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_name TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Bảng proxies - Thông tin proxy thật
            `CREATE TABLE IF NOT EXISTS proxies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                username TEXT DEFAULT '',
                password TEXT DEFAULT '',
                type TEXT DEFAULT 'http',
                status TEXT DEFAULT 'pending',
                response_time REAL,
                public_ip TEXT,
                location TEXT,
                fail_count INTEGER DEFAULT 0,
                last_tested TIMESTAMP,
                last_used_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                owner_id INTEGER,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Bảng profiles - Thông tin profile thật (lưu tất cả trên client)
            `CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                platform TEXT,
                note TEXT,
                proxy TEXT,
                status TEXT DEFAULT 'Ready',
                shared_on_cloud INTEGER DEFAULT 0,
                server_sync_id TEXT,
                sync_version INTEGER DEFAULT 1,
                last_synced_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_started_at TIMESTAMP,
                owner_id INTEGER,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Bảng profile_group (many-to-many profile <-> group)
            `CREATE TABLE IF NOT EXISTS profile_group (
                profile_id INTEGER NOT NULL,
                group_id INTEGER NOT NULL,
                PRIMARY KEY (profile_id, group_id),
                FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
            )`,

            // Bảng profile_tag (many-to-many profile <-> tag)
            `CREATE TABLE IF NOT EXISTS profile_tag (
                profile_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (profile_id, tag_id),
                FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )`,

            // Bảng proxy_tags (many-to-many proxy <-> tag)
            `CREATE TABLE IF NOT EXISTS proxy_tags (
                proxy_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (proxy_id, tag_id),
                FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )`,

            // Bảng sessions - Quản lý phiên đăng nhập
            `CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Bảng settings - Cài đặt ứng dụng
            `CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];

        // Create indexes for optimization
        const indexes = [
            // Users indexes
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            "CREATE INDEX IF NOT EXISTS idx_users_hwid ON users(hwid)",
            "CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)",
            
            // Proxies indexes
            "CREATE INDEX IF NOT EXISTS idx_proxies_status ON proxies(status)",
            "CREATE INDEX IF NOT EXISTS idx_proxies_last_used ON proxies(last_used_at)",
            "CREATE INDEX IF NOT EXISTS idx_proxies_host_port ON proxies(host, port)",
            "CREATE INDEX IF NOT EXISTS idx_proxies_owner_id ON proxies(owner_id)",
            "CREATE INDEX IF NOT EXISTS idx_proxies_type ON proxies(type)",
            
            // Profiles indexes
            "CREATE INDEX IF NOT EXISTS idx_profiles_owner_id ON profiles(owner_id)",
            "CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status)",
            "CREATE INDEX IF NOT EXISTS idx_profiles_platform ON profiles(platform)",
            
            // Tags indexes
            "CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)",
            
            // Groups indexes
            "CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(group_name)",
            
            // Junction table indexes
            "CREATE INDEX IF NOT EXISTS idx_profile_group_profile ON profile_group(profile_id)",
            "CREATE INDEX IF NOT EXISTS idx_profile_group_group ON profile_group(group_id)",
            "CREATE INDEX IF NOT EXISTS idx_profile_tag_profile ON profile_tag(profile_id)",
            "CREATE INDEX IF NOT EXISTS idx_profile_tag_tag ON profile_tag(tag_id)",
            "CREATE INDEX IF NOT EXISTS idx_proxy_tags_proxy ON proxy_tags(proxy_id)",
            "CREATE INDEX IF NOT EXISTS idx_proxy_tags_tag ON proxy_tags(tag_id)",
            
            // Sessions indexes
            "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)",
            
            // Settings indexes
            "CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)",
            "CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id)"
        ];

        // First create all tables
        for (const sql of tables) {
            await new Promise((resolve, reject) => {
                this.db.run(sql, (err) => {
                    if (err) {
                        console.error('❌ Error creating table:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }

        // Then create all indexes
        for (const sql of indexes) {
            await new Promise((resolve, reject) => {
                this.db.run(sql, (err) => {
                    if (err) {
                        console.error('❌ Error creating index:', err);
                        // Don't reject for index errors, just log them
                        console.warn('⚠️ Continuing despite index error');
                    }
                    resolve();
                });
            });
        }
    }

    disconnect() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err);
                } else {
                    console.log('🔌 Database connection closed');
                }
            });
        }
    }

    // Utility method to run queries with promises
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Utility method to get single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Utility method to get all rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

// Singleton instance
let dbInstance = null;

function getDatabase() {
    if (!dbInstance) {
        dbInstance = new Database();
    }
    return dbInstance;
}

module.exports = {
    Database,
    getDatabase
};