"""
Proxy Handler - Xử lý tất cả logic liên quan đến proxy
Tách riêng từ main.py để tránh code dài
"""

import sqlite3
import json
import os
import time
from typing import List, Dict, Optional, Any
from pathlib import Path


class ProxyHandler:
    """Xử lý tất cả thao tác liên quan đến proxy"""
    
    def __init__(self, db_path: str = None):
        """
        Khởi tạo ProxyHandler
        
        Args:
            db_path: Đường dẫn đến database SQLite. Nếu None, sẽ tự động tìm
        """
        if db_path is None:
            # Tự động tìm database trong thư mục storage
            storage_dir = Path(__file__).parent.parent / "storage"
            db_path = storage_dir / "pmlogin.db"
        
        self.db_path = str(db_path)
        self.ensure_database_exists()
    
    def ensure_database_exists(self):
        """Đảm bảo database và bảng proxy tồn tại"""
        try:
            # Tạo thư mục storage nếu chưa có
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Tạo bảng tags nếu chưa có
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS tags (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL UNIQUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Tạo bảng proxies nếu chưa có
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS proxies (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT,
                        host TEXT NOT NULL,
                        port INTEGER NOT NULL,
                        username TEXT DEFAULT '',
                        password TEXT DEFAULT '',
                        type TEXT DEFAULT 'http',
                        status TEXT DEFAULT NULL,
                        last_used_at REAL DEFAULT 0,
                        fail_count INTEGER DEFAULT 0,
                        tag_id INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE SET NULL
                    )
                """)
                
                # Tạo bảng proxy_tags để lưu multiple tags
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS proxy_tags (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        proxy_id INTEGER NOT NULL,
                        tag_id INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(proxy_id, tag_id),
                        FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE CASCADE,
                        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                    )
                """)
                
                # Tạo index để tối ưu truy vấn
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_proxy_host_port ON proxies(host, port)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_proxy_status ON proxies(status)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_proxy_type ON proxies(type)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_tag_name ON tags(name)")
                
                # Tạo tag mặc định nếu chưa có
                cursor.execute("INSERT OR IGNORE INTO tags (name) VALUES ('Default')")
                cursor.execute("INSERT OR IGNORE INTO tags (name) VALUES ('Imported')")
                
                conn.commit()
                print(f"✅ Database initialized: {self.db_path}")
                
        except Exception as e:
            print(f"❌ Error initializing database: {e}")
            raise
    
    def get_or_create_tag(self, tag_name: str) -> Optional[int]:
        """
        Lấy hoặc tạo tag mới
        
        Args:
            tag_name: Tên tag
            
        Returns:
            int: ID của tag, hoặc None nếu lỗi
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Thử lấy tag hiện có
                cursor.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
                result = cursor.fetchone()
                
                if result:
                    return result[0]
                
                # Tạo tag mới
                cursor.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
                conn.commit()
                return cursor.lastrowid
                
        except Exception as e:
            print(f"❌ Error getting/creating tag '{tag_name}': {e}")
            return None
    
    def add_proxy(self, proxy_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Thêm proxy mới vào database
        
        Args:
            proxy_data: Dict chứa thông tin proxy
                - name: str (optional) - Tên proxy
                - host: str - Host của proxy
                - port: int - Port của proxy
                - username: str (optional) - Username
                - password: str (optional) - Password
                - type: str - Loại proxy (http, https, socks4, socks5)
                - tags: List[str] (optional) - Danh sách tag
        
        Returns:
            Dict với success và data/message
        """
        try:
            # Validate dữ liệu đầu vào
            if not proxy_data.get('host'):
                return {"success": False, "message": "Host là bắt buộc"}
            
            if not proxy_data.get('port') or not isinstance(proxy_data['port'], int):
                return {"success": False, "message": "Port phải là số nguyên"}
            
            if proxy_data['port'] < 1 or proxy_data['port'] > 65535:
                return {"success": False, "message": "Port phải trong khoảng 1-65535"}
            
            # Chuẩn hóa dữ liệu
            host = proxy_data['host'].strip()
            port = int(proxy_data['port'])
            name = proxy_data.get('name', '').strip() or f"{host}:{port}"
            username = proxy_data.get('username', '').strip()
            password = proxy_data.get('password', '').strip()
            proxy_type = proxy_data.get('type', 'http').lower()
            tags = proxy_data.get('tags', ['Default'])
            
            # Validate proxy type
            valid_types = ['http', 'https', 'socks4', 'socks5']
            if proxy_type not in valid_types:
                proxy_type = 'http'
            
            # Đảm bảo tags là list
            if isinstance(tags, str):
                tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
            
            if not tags:
                tags = ['Default']
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Lấy/tạo tag chính (tag đầu tiên)
                primary_tag_id = self.get_or_create_tag(tags[0])
                if not primary_tag_id:
                    return {"success": False, "message": "Không thể tạo tag"}
                
                # Thêm proxy vào database
                cursor.execute("""
                    INSERT INTO proxies (name, host, port, username, password, type, tag_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (name, host, port, username, password, proxy_type, primary_tag_id, time.time()))
                
                proxy_id = cursor.lastrowid
                
                # Thêm các tag bổ sung vào proxy_tags
                for tag_name in tags[1:]:
                    if tag_name and tag_name.strip():
                        tag_id = self.get_or_create_tag(tag_name.strip())
                        if tag_id:
                            try:
                                cursor.execute("""
                                    INSERT INTO proxy_tags (proxy_id, tag_id)
                                    VALUES (?, ?)
                                """, (proxy_id, tag_id))
                            except sqlite3.IntegrityError:
                                pass  # Duplicate, bỏ qua
                
                conn.commit()
                
                print(f"✅ Added proxy ID={proxy_id}: {host}:{port} [tags: {', '.join(tags)}]")
                
                return {
                    "success": True,
                    "data": {
                        "id": proxy_id,
                        "name": name,
                        "host": host,
                        "port": port,
                        "username": username,
                        "password": password,
                        "type": proxy_type,
                        "tags": tags,
                        "status": None,
                        "created_at": time.time()
                    }
                }
                
        except Exception as e:
            print(f"❌ Error adding proxy: {e}")
            return {"success": False, "message": f"Lỗi khi thêm proxy: {str(e)}"}
    
    def bulk_add_proxies(self, proxies_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Thêm nhiều proxy cùng lúc
        
        Args:
            proxies_list: List các dict chứa thông tin proxy
        
        Returns:
            Dict với success và data (results, successCount, totalCount)
        """
        try:
            results = []
            success_count = 0
            
            for proxy_data in proxies_list:
                result = self.add_proxy(proxy_data)
                results.append(result)
                if result.get('success'):
                    success_count += 1
            
            print(f"✅ Bulk add completed: {success_count}/{len(proxies_list)} proxies added")
            
            return {
                "success": True,
                "data": {
                    "results": results,
                    "successCount": success_count,
                    "totalCount": len(proxies_list)
                }
            }
            
        except Exception as e:
            print(f"❌ Error bulk adding proxies: {e}")
            return {"success": False, "message": f"Lỗi khi thêm nhiều proxy: {str(e)}"}
    
    def get_all_proxies(self, tag_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Lấy tất cả proxy từ database
        
        Args:
            tag_id: Nếu có, chỉ lấy proxy có tag chính là tag_id này
        
        Returns:
            Dict với success và data (list proxy)
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                if tag_id is not None:
                    cursor.execute("""
                        SELECT * FROM proxies 
                        WHERE tag_id = ? 
                        ORDER BY id ASC
                    """, (tag_id,))
                else:
                    cursor.execute("SELECT * FROM proxies ORDER BY id ASC")
                
                proxies = cursor.fetchall()
                
                # Chuyển đổi sang dict và thêm tags
                result = []
                for proxy in proxies:
                    proxy_dict = dict(proxy)
                    
                    # Lấy tất cả tags cho proxy này
                    tags = self._get_proxy_tags(proxy_dict['id'])
                    proxy_dict['tags'] = tags
                    
                    result.append(proxy_dict)
                
                print(f"📊 Retrieved {len(result)} proxies from database")
                
                return {"success": True, "data": result}
                
        except Exception as e:
            print(f"❌ Error getting proxies: {e}")
            return {"success": False, "message": f"Lỗi khi lấy danh sách proxy: {str(e)}"}
    
    def _get_proxy_tags(self, proxy_id: int) -> List[str]:
        """
        Lấy danh sách tag cho một proxy
        
        Args:
            proxy_id: ID của proxy
        
        Returns:
            List[str]: Danh sách tên tag (tag chính luôn là phần tử đầu tiên)
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Lấy tag chính từ proxies.tag_id
                cursor.execute("""
                    SELECT t.name
                    FROM tags t
                    INNER JOIN proxies p ON t.id = p.tag_id
                    WHERE p.id = ?
                """, (proxy_id,))
                result = cursor.fetchone()
                primary_tag = result[0] if result else 'Default'
                
                # Lấy các tag bổ sung từ proxy_tags
                cursor.execute("""
                    SELECT DISTINCT t.name
                    FROM tags t
                    INNER JOIN proxy_tags pt ON t.id = pt.tag_id
                    WHERE pt.proxy_id = ?
                    ORDER BY t.name
                """, (proxy_id,))
                additional_tags = [row[0] for row in cursor.fetchall()]
                
                # Tag chính luôn là phần tử đầu tiên
                return [primary_tag] + additional_tags
                
        except Exception as e:
            print(f"❌ Error getting tags for proxy {proxy_id}: {e}")
            return ['Default']
    
    def delete_proxy(self, host: str, port: int) -> Dict[str, Any]:
        """
        Xóa proxy theo host và port
        
        Args:
            host: Host của proxy
            port: Port của proxy
        
        Returns:
            Dict với success và message
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Kiểm tra proxy có tồn tại không
                cursor.execute("SELECT id FROM proxies WHERE host = ? AND port = ?", (host, port))
                proxy = cursor.fetchone()
                
                if not proxy:
                    return {"success": False, "message": "Proxy không tồn tại"}
                
                # Xóa proxy (CASCADE sẽ tự động xóa proxy_tags)
                cursor.execute("DELETE FROM proxies WHERE host = ? AND port = ?", (host, port))
                conn.commit()
                
                print(f"✅ Deleted proxy: {host}:{port}")
                
                return {"success": True, "message": "Proxy đã được xóa"}
                
        except Exception as e:
            print(f"❌ Error deleting proxy: {e}")
            return {"success": False, "message": f"Lỗi khi xóa proxy: {str(e)}"}
    
    def update_proxy_status(self, host: str, port: int, status: str, fail_count: int = 0, proxy_type: str = None) -> Dict[str, Any]:
        """
        Cập nhật trạng thái proxy
        
        Args:
            host: Host của proxy
            port: Port của proxy
            status: Trạng thái mới ('live', 'dead', hoặc None)
            fail_count: Số lần thất bại
            proxy_type: Loại proxy (nếu có)
        
        Returns:
            Dict với success và message
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                if proxy_type and proxy_type != 'unknown':
                    cursor.execute("""
                        UPDATE proxies 
                        SET status = ?, fail_count = ?, last_used_at = ?, type = ?
                        WHERE host = ? AND port = ?
                    """, (status, fail_count, time.time(), proxy_type, host, port))
                else:
                    cursor.execute("""
                        UPDATE proxies 
                        SET status = ?, fail_count = ?, last_used_at = ?
                        WHERE host = ? AND port = ?
                    """, (status, fail_count, time.time(), host, port))
                
                conn.commit()
                
                if cursor.rowcount > 0:
                    print(f"✅ Updated proxy {host}:{port} -> status={status}")
                    return {"success": True, "message": "Cập nhật thành công"}
                else:
                    return {"success": False, "message": "Proxy không tồn tại"}
                
        except Exception as e:
            print(f"❌ Error updating proxy status: {e}")
            return {"success": False, "message": f"Lỗi khi cập nhật proxy: {str(e)}"}
    
    def get_all_tags(self) -> Dict[str, Any]:
        """
        Lấy tất cả tag từ database
        
        Returns:
            Dict với success và data (list tag)
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute("SELECT * FROM tags ORDER BY name")
                tags = cursor.fetchall()
                
                result = [dict(tag) for tag in tags]
                
                return {"success": True, "data": result}
                
        except Exception as e:
            print(f"❌ Error getting tags: {e}")
            return {"success": False, "message": f"Lỗi khi lấy danh sách tag: {str(e)}"}
    
    def get_proxy_stats(self) -> Dict[str, Any]:
        """
        Lấy thống kê proxy
        
        Returns:
            Dict với success và data (stats)
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Tổng số proxy
                cursor.execute("SELECT COUNT(*) FROM proxies")
                total = cursor.fetchone()[0]
                
                # Proxy live
                cursor.execute("SELECT COUNT(*) FROM proxies WHERE status = 'live'")
                live = cursor.fetchone()[0]
                
                # Proxy dead
                cursor.execute("SELECT COUNT(*) FROM proxies WHERE status = 'dead'")
                dead = cursor.fetchone()[0]
                
                # Proxy chưa check
                cursor.execute("SELECT COUNT(*) FROM proxies WHERE status IS NULL")
                unchecked = cursor.fetchone()[0]
                
                stats = {
                    "total": total,
                    "live": live,
                    "dead": dead,
                    "unchecked": unchecked
                }
                
                return {"success": True, "data": stats}
                
        except Exception as e:
            print(f"❌ Error getting proxy stats: {e}")
            return {"success": False, "message": f"Lỗi khi lấy thống kê proxy: {str(e)}"}


# Global instance
proxy_handler = ProxyHandler()


def get_proxy_handler() -> ProxyHandler:
    """Lấy instance của ProxyHandler"""
    return proxy_handler