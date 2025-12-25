/**
 * User Repository - Quản lý dữ liệu người dùng thật
 */

const { getDatabase } = require('../database');
const crypto = require('crypto');

class UserRepository {
    constructor() {
        this.db = getDatabase();
    }

    // Tạo hash password
    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    // Tạo user mới
    async createUser(userData) {
        const { email, password, hwid } = userData;
        const hashedPassword = this.hashPassword(password);
        
        const result = await this.db.run(
            `INSERT INTO users (email, hashed_password, hwid, created_at) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [email, hashedPassword, hwid]
        );
        
        return this.getUserById(result.id);
    }

    // Lấy user theo ID
    async getUserById(id) {
        return await this.db.get(
            `SELECT id, email, hwid, is_active, created_at, last_login 
             FROM users WHERE id = ?`,
            [id]
        );
    }

    // Lấy user theo email
    async getUserByEmail(email) {
        return await this.db.get(
            `SELECT * FROM users WHERE email = ?`,
            [email]
        );
    }

    // Xác thực user
    async authenticateUser(email, password) {
        const hashedPassword = this.hashPassword(password);
        const user = await this.db.get(
            `SELECT id, email, hwid, is_active FROM users 
             WHERE email = ? AND hashed_password = ? AND is_active = 1`,
            [email, hashedPassword]
        );
        
        if (user) {
            // Cập nhật last_login
            await this.db.run(
                `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
                [user.id]
            );
        }
        
        return user;
    }

    // Cập nhật HWID
    async updateHwid(userId, hwid) {
        await this.db.run(
            `UPDATE users SET hwid = ? WHERE id = ?`,
            [hwid, userId]
        );
    }

    // Lấy tất cả users
    async getAllUsers() {
        return await this.db.all(
            `SELECT id, email, hwid, is_active, created_at, last_login 
             FROM users ORDER BY created_at DESC`
        );
    }

    // Vô hiệu hóa user
    async deactivateUser(userId) {
        await this.db.run(
            `UPDATE users SET is_active = 0 WHERE id = ?`,
            [userId]
        );
    }

    // Kích hoạt user
    async activateUser(userId) {
        await this.db.run(
            `UPDATE users SET is_active = 1 WHERE id = ?`,
            [userId]
        );
    }
}

module.exports = UserRepository;