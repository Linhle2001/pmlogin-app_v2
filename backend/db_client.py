import sqlite3
import os
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import json

class DatabaseClient:
    def __init__(self, db_path: str = "client_profiles.db"):
        """
        Khởi tạo database client
        """
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """
        Khởi tạo database và tạo các bảng
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Tạo bảng profiles
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS profiles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    browser_type TEXT NOT NULL,
                    user_agent TEXT,
                    proxy_config TEXT,
                    cookies TEXT,
                    local_storage TEXT,
                    session_storage TEXT,
                    fingerprint_config TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                )
            ''')
            
            # Tạo bảng groups
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    color TEXT DEFAULT '#007bff',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tạo bảng profile_group (many-to-many relationship)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS profile_group (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL,
                    group_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE,
                    FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
                    UNIQUE(profile_id, group_id)
                )
            ''')
            
            # Tạo bảng tags
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tags (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    color TEXT DEFAULT '#28a745',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tạo bảng profile_tag (many-to-many relationship)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS profile_tag (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL,
                    tag_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
                    UNIQUE(profile_id, tag_id)
                )
            ''')
            
            # Tạo indexes để tối ưu hiệu suất
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_profile_group_profile ON profile_group(profile_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_profile_group_group ON profile_group(group_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_profile_tag_profile ON profile_tag(profile_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_profile_tag_tag ON profile_tag(tag_id)')
            
            conn.commit()
    
    def get_connection(self):
        """
        Lấy connection đến database
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Để có thể truy cập columns bằng tên
        return conn

    # ==================== PROFILE OPERATIONS ====================
    
    def create_profile(self, name: str, browser_type: str, **kwargs) -> int:
        """
        Tạo profile mới
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Prepare statement
            query = '''
                INSERT INTO profiles (
                    name, browser_type, user_agent, proxy_config, cookies,
                    local_storage, session_storage, fingerprint_config
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            '''
            
            params = (
                name,
                browser_type,
                kwargs.get('user_agent'),
                json.dumps(kwargs.get('proxy_config')) if kwargs.get('proxy_config') else None,
                json.dumps(kwargs.get('cookies')) if kwargs.get('cookies') else None,
                json.dumps(kwargs.get('local_storage')) if kwargs.get('local_storage') else None,
                json.dumps(kwargs.get('session_storage')) if kwargs.get('session_storage') else None,
                json.dumps(kwargs.get('fingerprint_config')) if kwargs.get('fingerprint_config') else None
            )
            
            cursor.execute(query, params)
            profile_id = cursor.lastrowid
            conn.commit()
            return profile_id
    
    def get_profile_by_id(self, profile_id: int) -> Optional[Dict]:
        """
        Lấy profile theo ID
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'SELECT * FROM profiles WHERE id = ? AND is_active = 1'
            cursor.execute(query, (profile_id,))
            
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    def get_profile_by_name(self, name: str) -> Optional[Dict]:
        """
        Lấy profile theo tên
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'SELECT * FROM profiles WHERE name = ? AND is_active = 1'
            cursor.execute(query, (name,))
            
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    def get_all_profiles(self, active_only: bool = True) -> List[Dict]:
        """
        Lấy tất cả profiles
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            if active_only:
                query = 'SELECT * FROM profiles WHERE is_active = 1 ORDER BY name'
                cursor.execute(query)
            else:
                query = 'SELECT * FROM profiles ORDER BY name'
                cursor.execute(query)
            
            return [dict(row) for row in cursor.fetchall()]
    
    def update_profile(self, profile_id: int, **kwargs) -> bool:
        """
        Cập nhật profile
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Tạo dynamic update query
            update_fields = []
            params = []
            
            for field, value in kwargs.items():
                if field in ['name', 'browser_type', 'user_agent']:
                    update_fields.append(f"{field} = ?")
                    params.append(value)
                elif field in ['proxy_config', 'cookies', 'local_storage', 'session_storage', 'fingerprint_config']:
                    update_fields.append(f"{field} = ?")
                    params.append(json.dumps(value) if value else None)
                elif field == 'is_active':
                    update_fields.append(f"{field} = ?")
                    params.append(value)
            
            if not update_fields:
                return False
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            params.append(profile_id)
            
            query = f"UPDATE profiles SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            
            conn.commit()
            return cursor.rowcount > 0
    
    def delete_profile(self, profile_id: int, soft_delete: bool = True) -> bool:
        """
        Xóa profile (soft delete hoặc hard delete)
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            if soft_delete:
                query = 'UPDATE profiles SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            else:
                query = 'DELETE FROM profiles WHERE id = ?'
            
            cursor.execute(query, (profile_id,))
            conn.commit()
            return cursor.rowcount > 0
    # ==================== GROUP OPERATIONS ====================
    
    def create_group(self, name: str, description: str = None, color: str = '#007bff') -> int:
        """
        Tạo group mới
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'INSERT INTO groups (name, description, color) VALUES (?, ?, ?)'
            cursor.execute(query, (name, description, color))
            
            group_id = cursor.lastrowid
            conn.commit()
            return group_id
    
    def get_group_by_id(self, group_id: int) -> Optional[Dict]:
        """
        Lấy group theo ID
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'SELECT * FROM groups WHERE id = ?'
            cursor.execute(query, (group_id,))
            
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    def get_group_by_name(self, name: str) -> Optional[Dict]:
        """
        Lấy group theo tên
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'SELECT * FROM groups WHERE name = ?'
            cursor.execute(query, (name,))
            
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    def get_all_groups(self) -> List[Dict]:
        """
        Lấy tất cả groups
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'SELECT * FROM groups ORDER BY name'
            cursor.execute(query)
            
            return [dict(row) for row in cursor.fetchall()]
    
    def update_group(self, group_id: int, name: str = None, description: str = None, color: str = None) -> bool:
        """
        Cập nhật group
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            update_fields = []
            params = []
            
            if name is not None:
                update_fields.append("name = ?")
                params.append(name)
            
            if description is not None:
                update_fields.append("description = ?")
                params.append(description)
            
            if color is not None:
                update_fields.append("color = ?")
                params.append(color)
            
            if not update_fields:
                return False
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            params.append(group_id)
            
            query = f"UPDATE groups SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            
            conn.commit()
            return cursor.rowcount > 0
    
    def delete_group(self, group_id: int) -> bool:
        """
        Xóa group
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'DELETE FROM groups WHERE id = ?'
            cursor.execute(query, (group_id,))
            
            conn.commit()
            return cursor.rowcount > 0
    
    # ==================== TAG OPERATIONS ====================
    
    def create_tag(self, name: str, color: str = '#28a745') -> int:
        """
        Tạo tag mới
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'INSERT INTO tags (name, color) VALUES (?, ?)'
            cursor.execute(query, (name, color))
            
            tag_id = cursor.lastrowid
            conn.commit()
            return tag_id
    
    def get_tag_by_id(self, tag_id: int) -> Optional[Dict]:
        """
        Lấy tag theo ID
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'SELECT * FROM tags WHERE id = ?'
            cursor.execute(query, (tag_id,))
            
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    def get_tag_by_name(self, name: str) -> Optional[Dict]:
        """
        Lấy tag theo tên
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'SELECT * FROM tags WHERE name = ?'
            cursor.execute(query, (name,))
            
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    def get_all_tags(self) -> List[Dict]:
        """
        Lấy tất cả tags
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'SELECT * FROM tags ORDER BY name'
            cursor.execute(query)
            
            return [dict(row) for row in cursor.fetchall()]
    
    def update_tag(self, tag_id: int, name: str = None, color: str = None) -> bool:
        """
        Cập nhật tag
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            update_fields = []
            params = []
            
            if name is not None:
                update_fields.append("name = ?")
                params.append(name)
            
            if color is not None:
                update_fields.append("color = ?")
                params.append(color)
            
            if not update_fields:
                return False
            
            params.append(tag_id)
            
            query = f"UPDATE tags SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            
            conn.commit()
            return cursor.rowcount > 0
    
    def delete_tag(self, tag_id: int) -> bool:
        """
        Xóa tag
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'DELETE FROM tags WHERE id = ?'
            cursor.execute(query, (tag_id,))
            
            conn.commit()
            return cursor.rowcount > 0
    
    # ==================== PROFILE-GROUP OPERATIONS ====================
    
    def add_profile_to_group(self, profile_id: int, group_id: int) -> bool:
        """
        Thêm profile vào group
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            try:
                query = 'INSERT INTO profile_group (profile_id, group_id) VALUES (?, ?)'
                cursor.execute(query, (profile_id, group_id))
                conn.commit()
                return True
            except sqlite3.IntegrityError:
                # Profile đã có trong group hoặc foreign key constraint
                return False
    
    def remove_profile_from_group(self, profile_id: int, group_id: int) -> bool:
        """
        Xóa profile khỏi group
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'DELETE FROM profile_group WHERE profile_id = ? AND group_id = ?'
            cursor.execute(query, (profile_id, group_id))
            
            conn.commit()
            return cursor.rowcount > 0
    
    def get_profiles_by_group(self, group_id: int) -> List[Dict]:
        """
        Lấy tất cả profiles trong một group
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = '''
                SELECT p.* FROM profiles p
                INNER JOIN profile_group pg ON p.id = pg.profile_id
                WHERE pg.group_id = ? AND p.is_active = 1
                ORDER BY p.name
            '''
            cursor.execute(query, (group_id,))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def get_groups_by_profile(self, profile_id: int) -> List[Dict]:
        """
        Lấy tất cả groups của một profile
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = '''
                SELECT g.* FROM groups g
                INNER JOIN profile_group pg ON g.id = pg.group_id
                WHERE pg.profile_id = ?
                ORDER BY g.name
            '''
            cursor.execute(query, (profile_id,))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def remove_all_profiles_from_group(self, group_id: int) -> bool:
        """
        Xóa tất cả profiles khỏi group
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'DELETE FROM profile_group WHERE group_id = ?'
            cursor.execute(query, (group_id,))
            
            conn.commit()
            return cursor.rowcount > 0
    
    def remove_profile_from_all_groups(self, profile_id: int) -> bool:
        """
        Xóa profile khỏi tất cả groups
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'DELETE FROM profile_group WHERE profile_id = ?'
            cursor.execute(query, (profile_id,))
            
            conn.commit()
            return cursor.rowcount > 0
    
    # ==================== PROFILE-TAG OPERATIONS ====================
    
    def add_tag_to_profile(self, profile_id: int, tag_id: int) -> bool:
        """
        Thêm tag vào profile
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            try:
                query = 'INSERT INTO profile_tag (profile_id, tag_id) VALUES (?, ?)'
                cursor.execute(query, (profile_id, tag_id))
                conn.commit()
                return True
            except sqlite3.IntegrityError:
                # Tag đã có trong profile hoặc foreign key constraint
                return False
    
    def remove_tag_from_profile(self, profile_id: int, tag_id: int) -> bool:
        """
        Xóa tag khỏi profile
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'DELETE FROM profile_tag WHERE profile_id = ? AND tag_id = ?'
            cursor.execute(query, (profile_id, tag_id))
            
            conn.commit()
            return cursor.rowcount > 0
    
    def get_profiles_by_tag(self, tag_id: int) -> List[Dict]:
        """
        Lấy tất cả profiles có tag
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = '''
                SELECT p.* FROM profiles p
                INNER JOIN profile_tag pt ON p.id = pt.profile_id
                WHERE pt.tag_id = ? AND p.is_active = 1
                ORDER BY p.name
            '''
            cursor.execute(query, (tag_id,))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def get_tags_by_profile(self, profile_id: int) -> List[Dict]:
        """
        Lấy tất cả tags của một profile
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = '''
                SELECT t.* FROM tags t
                INNER JOIN profile_tag pt ON t.id = pt.tag_id
                WHERE pt.profile_id = ?
                ORDER BY t.name
            '''
            cursor.execute(query, (profile_id,))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def remove_all_tags_from_profile(self, profile_id: int) -> bool:
        """
        Xóa tất cả tags khỏi profile
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'DELETE FROM profile_tag WHERE profile_id = ?'
            cursor.execute(query, (profile_id,))
            
            conn.commit()
            return cursor.rowcount > 0
    
    def remove_tag_from_all_profiles(self, tag_id: int) -> bool:
        """
        Xóa tag khỏi tất cả profiles
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = 'DELETE FROM profile_tag WHERE tag_id = ?'
            cursor.execute(query, (tag_id,))
            
            conn.commit()
            return cursor.rowcount > 0
    
    # ==================== ADVANCED QUERIES ====================
    
    def search_profiles(self, search_term: str = None, group_ids: List[int] = None, 
                       tag_ids: List[int] = None, browser_type: str = None) -> List[Dict]:
        """
        Tìm kiếm profiles với nhiều điều kiện
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            base_query = '''
                SELECT DISTINCT p.* FROM profiles p
                LEFT JOIN profile_group pg ON p.id = pg.profile_id
                LEFT JOIN profile_tag pt ON p.id = pt.profile_id
                WHERE p.is_active = 1
            '''
            
            conditions = []
            params = []
            
            if search_term:
                conditions.append("p.name LIKE ?")
                params.append(f"%{search_term}%")
            
            if browser_type:
                conditions.append("p.browser_type = ?")
                params.append(browser_type)
            
            if group_ids:
                placeholders = ','.join(['?' for _ in group_ids])
                conditions.append(f"pg.group_id IN ({placeholders})")
                params.extend(group_ids)
            
            if tag_ids:
                placeholders = ','.join(['?' for _ in tag_ids])
                conditions.append(f"pt.tag_id IN ({placeholders})")
                params.extend(tag_ids)
            
            if conditions:
                query = base_query + " AND " + " AND ".join(conditions)
            else:
                query = base_query
            
            query += " ORDER BY p.name"
            
            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]
    
    def get_profile_with_relations(self, profile_id: int) -> Optional[Dict]:
        """
        Lấy profile kèm theo groups và tags
        """
        profile = self.get_profile_by_id(profile_id)
        if not profile:
            return None
        
        profile['groups'] = self.get_groups_by_profile(profile_id)
        profile['tags'] = self.get_tags_by_profile(profile_id)
        
        return profile
    
    def get_statistics(self) -> Dict:
        """
        Lấy thống kê tổng quan
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            stats = {}
            
            # Đếm profiles
            cursor.execute('SELECT COUNT(*) FROM profiles WHERE is_active = 1')
            stats['total_profiles'] = cursor.fetchone()[0]
            
            # Đếm groups
            cursor.execute('SELECT COUNT(*) FROM groups')
            stats['total_groups'] = cursor.fetchone()[0]
            
            # Đếm tags
            cursor.execute('SELECT COUNT(*) FROM tags')
            stats['total_tags'] = cursor.fetchone()[0]
            
            # Đếm profiles theo browser type
            cursor.execute('''
                SELECT browser_type, COUNT(*) 
                FROM profiles 
                WHERE is_active = 1 
                GROUP BY browser_type
            ''')
            stats['profiles_by_browser'] = dict(cursor.fetchall())
            
            return stats

# Ví dụ sử dụng
if __name__ == "__main__":
    # Khởi tạo database
    db = DatabaseClient("test_profiles.db")
    
    # Tạo một số dữ liệu mẫu
    try:
        # Tạo groups
        work_group_id = db.create_group("Work", "Profiles for work", "#007bff")
        personal_group_id = db.create_group("Personal", "Personal profiles", "#28a745")
        
        # Tạo tags
        social_tag_id = db.create_tag("Social Media", "#ff6b6b")
        ecommerce_tag_id = db.create_tag("E-commerce", "#4ecdc4")
        
        # Tạo profiles
        profile1_id = db.create_profile(
            name="Facebook Profile",
            browser_type="chrome",
            user_agent="Mozilla/5.0...",
            proxy_config={"host": "127.0.0.1", "port": 8080}
        )
        
        profile2_id = db.create_profile(
            name="Amazon Profile", 
            browser_type="firefox",
            user_agent="Mozilla/5.0..."
        )
        
        # Thêm profiles vào groups
        db.add_profile_to_group(profile1_id, work_group_id)
        db.add_profile_to_group(profile2_id, personal_group_id)
        
        # Thêm tags vào profiles
        db.add_tag_to_profile(profile1_id, social_tag_id)
        db.add_tag_to_profile(profile2_id, ecommerce_tag_id)
        
        # Test queries
        print("All profiles:", db.get_all_profiles())
        print("Profile with relations:", db.get_profile_with_relations(profile1_id))
        print("Statistics:", db.get_statistics())
        
    except Exception as e:
        print(f"Error: {e}")