"""
Taskbar Actions Handler - Xử lý các nhiệm vụ taskbar cho PM Login App v2
Tương tự như profiles_structure.py trong pmlogin-app

Chức năng:
- Xử lý các action từ taskbar (start, stop, check proxy, update proxy, etc.)
- Quản lý profiles theo batch (nhiều profiles cùng lúc)
- Xử lý proxy operations
- Export/Import profiles
- Clone profiles
"""

import sqlite3
import json
import asyncio
import aiohttp
import time
from datetime import datetime
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from enum import Enum

# Database path
DB_PATH = "pmlogin_local.db"

class ProxyStatus(Enum):
    """Enum cho trạng thái proxy"""
    CHECKING = "Checking"
    READY = "Ready"
    ERROR = "Proxy Error"
    NO_PROXY = "No proxy"

class ProfileStatus(Enum):
    """Enum cho trạng thái profile"""
    READY = "Ready"
    RUNNING = "Running"
    STOPPED = "Stopped"
    ERROR = "Error"

@dataclass
class ProxyData:
    """Data class cho proxy"""
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    protocol: str = "http"
    country: Optional[str] = None

@dataclass
class TaskbarResult:
    """Kết quả trả về từ các taskbar actions"""
    success: bool
    message: str
    data: Optional[Dict] = None
    affected_count: int = 0

class TaskbarHandler:
    """Handler chính cho các taskbar actions"""
    
    def __init__(self):
        self.db_path = DB_PATH
        self.running_profiles = set()  # Set các profile ID đang chạy
        
    def get_db_connection(self):
        """Lấy kết nối database"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    # === PROFILE MANAGEMENT ===
    
    async def start_profiles(self, profile_ids: List[int]) -> TaskbarResult:
        """Khởi động các profiles đã chọn"""
        try:
            if not profile_ids:
                return TaskbarResult(
                    success=False,
                    message="Không có profile nào được chọn"
                )
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            started_count = 0
            errors = []
            
            for profile_id in profile_ids:
                try:
                    # Lấy thông tin profile
                    cursor.execute(
                        "SELECT * FROM profiles WHERE id = ? AND is_active = 1",
                        (profile_id,)
                    )
                    profile = cursor.fetchone()
                    
                    if not profile:
                        errors.append(f"Profile ID {profile_id} không tồn tại")
                        continue
                    
                    # Kiểm tra profile đã chạy chưa
                    if profile_id in self.running_profiles:
                        errors.append(f"Profile '{profile['name']}' đã đang chạy")
                        continue
                    
                    # Simulate start profile (trong thực tế sẽ khởi động browser)
                    success = await self._start_single_profile(profile)
                    
                    if success:
                        self.running_profiles.add(profile_id)
                        
                        # Cập nhật trạng thái và last_started_at
                        cursor.execute("""
                            UPDATE profiles 
                            SET updated_at = ?, last_started_at = ?
                            WHERE id = ?
                        """, (
                            datetime.now().isoformat(),
                            datetime.now().isoformat(),
                            profile_id
                        ))
                        
                        started_count += 1
                    else:
                        errors.append(f"Không thể khởi động profile '{profile['name']}'")
                        
                except Exception as e:
                    errors.append(f"Lỗi khi khởi động profile ID {profile_id}: {str(e)}")
            
            conn.commit()
            conn.close()
            
            # Tạo message kết quả
            if started_count > 0:
                message = f"Đã khởi động {started_count} profile(s)"
                if errors:
                    message += f". {len(errors)} lỗi xảy ra"
                
                return TaskbarResult(
                    success=True,
                    message=message,
                    affected_count=started_count,
                    data={"errors": errors} if errors else None
                )
            else:
                return TaskbarResult(
                    success=False,
                    message="Không thể khởi động profile nào",
                    data={"errors": errors}
                )
                
        except Exception as e:
            return TaskbarResult(
                success=False,
                message=f"Lỗi hệ thống: {str(e)}"
            )
    
    async def stop_profiles(self, profile_ids: List[int]) -> TaskbarResult:
        """Dừng các profiles đã chọn"""
        try:
            if not profile_ids:
                return TaskbarResult(
                    success=False,
                    message="Không có profile nào được chọn"
                )
            
            stopped_count = 0
            errors = []
            
            for profile_id in profile_ids:
                try:
                    if profile_id not in self.running_profiles:
                        errors.append(f"Profile ID {profile_id} không đang chạy")
                        continue
                    
                    # Simulate stop profile
                    success = await self._stop_single_profile(profile_id)
                    
                    if success:
                        self.running_profiles.discard(profile_id)
                        stopped_count += 1
                    else:
                        errors.append(f"Không thể dừng profile ID {profile_id}")
                        
                except Exception as e:
                    errors.append(f"Lỗi khi dừng profile ID {profile_id}: {str(e)}")
            
            # Tạo message kết quả
            if stopped_count > 0:
                message = f"Đã dừng {stopped_count} profile(s)"
                if errors:
                    message += f". {len(errors)} lỗi xảy ra"
                
                return TaskbarResult(
                    success=True,
                    message=message,
                    affected_count=stopped_count,
                    data={"errors": errors} if errors else None
                )
            else:
                return TaskbarResult(
                    success=False,
                    message="Không thể dừng profile nào",
                    data={"errors": errors}
                )
                
        except Exception as e:
            return TaskbarResult(
                success=False,
                message=f"Lỗi hệ thống: {str(e)}"
            )
    
    async def _start_single_profile(self, profile: sqlite3.Row) -> bool:
        """Khởi động một profile (simulate)"""
        try:
            # Simulate browser startup delay
            await asyncio.sleep(0.5)
            
            # Trong thực tế sẽ:
            # 1. Tạo browser instance với proxy
            # 2. Load profile data (cookies, localStorage, etc.)
            # 3. Khởi động browser window
            
            print(f"🚀 Started profile: {profile['name']}")
            return True
            
        except Exception as e:
            print(f"❌ Error starting profile {profile['name']}: {e}")
            return False
    
    async def _stop_single_profile(self, profile_id: int) -> bool:
        """Dừng một profile (simulate)"""
        try:
            # Simulate browser shutdown delay
            await asyncio.sleep(0.2)
            
            # Trong thực tế sẽ:
            # 1. Save profile data (cookies, localStorage, etc.)
            # 2. Close browser window
            # 3. Clean up resources
            
            print(f"⏹️ Stopped profile ID: {profile_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error stopping profile {profile_id}: {e}")
            return False
    
    # === PROXY OPERATIONS ===
    
    async def check_proxies(self, profile_ids: List[int]) -> TaskbarResult:
        """Kiểm tra proxy của các profiles đã chọn"""
        try:
            if not profile_ids:
                return TaskbarResult(
                    success=False,
                    message="Không có profile nào được chọn"
                )
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Lấy thông tin profiles và proxies
            placeholders = ','.join(['?' for _ in profile_ids])
            cursor.execute(f"""
                SELECT id, name, proxy_host, proxy_port, proxy_username, proxy_password
                FROM profiles 
                WHERE id IN ({placeholders}) AND is_active = 1
            """, profile_ids)
            
            profiles = cursor.fetchall()
            
            if not profiles:
                conn.close()
                return TaskbarResult(
                    success=False,
                    message="Không tìm thấy profile nào hợp lệ"
                )
            
            # Cập nhật trạng thái "Checking" cho tất cả profiles
            for profile in profiles:
                cursor.execute("""
                    UPDATE profiles 
                    SET proxy_status = ?, updated_at = ?
                    WHERE id = ?
                """, (ProxyStatus.CHECKING.value, datetime.now().isoformat(), profile['id']))
            
            conn.commit()
            
            # Kiểm tra proxy song song
            check_tasks = []
            for profile in profiles:
                if profile['proxy_host'] and profile['proxy_port']:
                    proxy_data = ProxyData(
                        host=profile['proxy_host'],
                        port=profile['proxy_port'],
                        username=profile['proxy_username'],
                        password=profile['proxy_password']
                    )
                    task = self._check_single_proxy(profile['id'], proxy_data)
                    check_tasks.append(task)
                else:
                    # Không có proxy
                    cursor.execute("""
                        UPDATE profiles 
                        SET proxy_status = ?, updated_at = ?
                        WHERE id = ?
                    """, (ProxyStatus.NO_PROXY.value, datetime.now().isoformat(), profile['id']))
            
            # Chờ tất cả proxy check hoàn thành
            if check_tasks:
                results = await asyncio.gather(*check_tasks, return_exceptions=True)
                
                # Cập nhật kết quả vào database
                live_count = 0
                dead_count = 0
                error_count = 0
                
                for i, result in enumerate(results):
                    if isinstance(result, Exception):
                        error_count += 1
                        continue
                    
                    profile_id, status, response_time = result
                    
                    if status == ProxyStatus.READY:
                        live_count += 1
                    elif status == ProxyStatus.ERROR:
                        dead_count += 1
                    else:
                        error_count += 1
                    
                    # Cập nhật database
                    cursor.execute("""
                        UPDATE profiles 
                        SET proxy_status = ?, updated_at = ?
                        WHERE id = ?
                    """, (status.value, datetime.now().isoformat(), profile_id))
            
            conn.commit()
            conn.close()
            
            # Tạo message kết quả
            total_checked = len(profiles)
            message_parts = [f"Đã kiểm tra {total_checked} proxy(s)"]
            
            if live_count > 0:
                message_parts.append(f"{live_count} live")
            if dead_count > 0:
                message_parts.append(f"{dead_count} dead")
            if error_count > 0:
                message_parts.append(f"{error_count} lỗi")
            
            return TaskbarResult(
                success=True,
                message=", ".join(message_parts),
                affected_count=total_checked,
                data={
                    "live": live_count,
                    "dead": dead_count,
                    "errors": error_count
                }
            )
            
        except Exception as e:
            return TaskbarResult(
                success=False,
                message=f"Lỗi khi kiểm tra proxy: {str(e)}"
            )
    
    async def _check_single_proxy(self, profile_id: int, proxy_data: ProxyData) -> tuple:
        """Kiểm tra một proxy đơn lẻ"""
        try:
            start_time = time.time()
            
            # Tạo proxy URL
            if proxy_data.username and proxy_data.password:
                proxy_url = f"{proxy_data.protocol}://{proxy_data.username}:{proxy_data.password}@{proxy_data.host}:{proxy_data.port}"
            else:
                proxy_url = f"{proxy_data.protocol}://{proxy_data.host}:{proxy_data.port}"
            
            # Test proxy bằng cách request đến httpbin
            timeout = aiohttp.ClientTimeout(total=10)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(
                    'http://httpbin.org/ip',
                    proxy=proxy_url
                ) as response:
                    if response.status == 200:
                        response_time = int((time.time() - start_time) * 1000)
                        return (profile_id, ProxyStatus.READY, response_time)
                    else:
                        return (profile_id, ProxyStatus.ERROR, 0)
                        
        except Exception as e:
            print(f"❌ Proxy check failed for profile {profile_id}: {e}")
            return (profile_id, ProxyStatus.ERROR, 0)
    
    async def update_proxies(self, profile_ids: List[int], proxy_list: List[str], 
                           connection_type: str = "Common", service: str = "TZ", 
                           webrtc: str = "Forward", enable_change_ip: bool = False) -> TaskbarResult:
        """Cập nhật proxy cho các profiles đã chọn"""
        try:
            if not profile_ids:
                return TaskbarResult(
                    success=False,
                    message="Không có profile nào được chọn"
                )
            
            if not proxy_list:
                return TaskbarResult(
                    success=False,
                    message="Danh sách proxy trống"
                )
            
            # Parse proxy list
            parsed_proxies = []
            for proxy_line in proxy_list:
                proxy_data = self._parse_proxy_line(proxy_line.strip())
                if proxy_data:
                    parsed_proxies.append(proxy_data)
                else:
                    return TaskbarResult(
                        success=False,
                        message=f"Proxy không hợp lệ: {proxy_line}"
                    )
            
            if not parsed_proxies:
                return TaskbarResult(
                    success=False,
                    message="Không có proxy hợp lệ nào"
                )
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            updated_count = 0
            
            # Cập nhật proxy cho từng profile
            for i, profile_id in enumerate(profile_ids):
                # Lấy proxy theo round-robin
                proxy_data = parsed_proxies[i % len(parsed_proxies)]
                
                try:
                    # Cập nhật thông tin proxy
                    cursor.execute("""
                        UPDATE profiles 
                        SET proxy_host = ?, proxy_port = ?, proxy_username = ?, 
                            proxy_password = ?, proxy_protocol = ?, proxy_status = ?,
                            updated_at = ?
                        WHERE id = ? AND is_active = 1
                    """, (
                        proxy_data.host,
                        proxy_data.port,
                        proxy_data.username,
                        proxy_data.password,
                        proxy_data.protocol,
                        "",  # Reset proxy status
                        datetime.now().isoformat(),
                        profile_id
                    ))
                    
                    if cursor.rowcount > 0:
                        updated_count += 1
                        
                except Exception as e:
                    print(f"❌ Error updating proxy for profile {profile_id}: {e}")
            
            conn.commit()
            conn.close()
            
            if updated_count > 0:
                return TaskbarResult(
                    success=True,
                    message=f"Đã cập nhật proxy cho {updated_count} profile(s)",
                    affected_count=updated_count
                )
            else:
                return TaskbarResult(
                    success=False,
                    message="Không thể cập nhật proxy cho profile nào"
                )
                
        except Exception as e:
            return TaskbarResult(
                success=False,
                message=f"Lỗi khi cập nhật proxy: {str(e)}"
            )
    
    def _parse_proxy_line(self, line: str) -> Optional[ProxyData]:
        """Parse một dòng proxy với format: [type://]host:port:username:password"""
        if not line:
            return None
        
        try:
            # Xử lý protocol
            if "://" in line:
                parts = line.split("://", 1)
                protocol = parts[0].lower()
                line = parts[1]
            else:
                protocol = "http"
            
            if protocol not in ['http', 'https', 'socks4', 'socks5']:
                return None
            
            # Parse host:port:username:password
            parts = line.split(":")
            
            if len(parts) < 2:
                return None
            
            host = parts[0].strip()
            
            try:
                port = int(parts[1].strip())
                if port < 1 or port > 65535:
                    return None
            except ValueError:
                return None
            
            username = parts[2].strip() if len(parts) > 2 else None
            password = parts[3].strip() if len(parts) > 3 else None
            
            return ProxyData(
                host=host,
                port=port,
                username=username,
                password=password,
                protocol=protocol
            )
            
        except Exception as e:
            print(f"❌ Error parsing proxy line '{line}': {e}")
            return None
    
    # === PROFILE OPERATIONS ===
    
    async def clone_profiles(self, profile_ids: List[int], clone_count: int = 1) -> TaskbarResult:
        """Clone các profiles đã chọn"""
        try:
            if not profile_ids:
                return TaskbarResult(
                    success=False,
                    message="Không có profile nào được chọn"
                )
            
            if clone_count < 1 or clone_count > 20:
                return TaskbarResult(
                    success=False,
                    message="Số lượng clone phải từ 1 đến 20"
                )
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            total_cloned = 0
            
            for profile_id in profile_ids:
                # Lấy thông tin profile gốc
                cursor.execute(
                    "SELECT * FROM profiles WHERE id = ? AND is_active = 1",
                    (profile_id,)
                )
                original_profile = cursor.fetchone()
                
                if not original_profile:
                    continue
                
                # Clone profile theo số lượng yêu cầu
                for i in range(clone_count):
                    clone_name = f"{original_profile['name']} - Copy {i + 1}"
                    
                    cursor.execute("""
                        INSERT INTO profiles (
                            name, proxy_host, proxy_port, proxy_username, proxy_password,
                            user_agent, browser_type, notes, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        clone_name,
                        original_profile['proxy_host'],
                        original_profile['proxy_port'],
                        original_profile['proxy_username'],
                        original_profile['proxy_password'],
                        original_profile['user_agent'],
                        original_profile['browser_type'],
                        original_profile['notes'],
                        datetime.now().isoformat(),
                        datetime.now().isoformat()
                    ))
                    
                    total_cloned += 1
            
            conn.commit()
            conn.close()
            
            if total_cloned > 0:
                return TaskbarResult(
                    success=True,
                    message=f"Đã clone {total_cloned} profile(s)",
                    affected_count=total_cloned
                )
            else:
                return TaskbarResult(
                    success=False,
                    message="Không thể clone profile nào"
                )
                
        except Exception as e:
            return TaskbarResult(
                success=False,
                message=f"Lỗi khi clone profiles: {str(e)}"
            )
    
    async def delete_profiles(self, profile_ids: List[int]) -> TaskbarResult:
        """Xóa các profiles đã chọn (soft delete)"""
        try:
            if not profile_ids:
                return TaskbarResult(
                    success=False,
                    message="Không có profile nào được chọn"
                )
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Dừng các profiles đang chạy trước khi xóa
            running_profiles_to_stop = [pid for pid in profile_ids if pid in self.running_profiles]
            if running_profiles_to_stop:
                await self.stop_profiles(running_profiles_to_stop)
            
            # Soft delete profiles
            placeholders = ','.join(['?' for _ in profile_ids])
            cursor.execute(f"""
                UPDATE profiles 
                SET is_active = 0, updated_at = ?
                WHERE id IN ({placeholders}) AND is_active = 1
            """, [datetime.now().isoformat()] + profile_ids)
            
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            if deleted_count > 0:
                return TaskbarResult(
                    success=True,
                    message=f"Đã xóa {deleted_count} profile(s)",
                    affected_count=deleted_count
                )
            else:
                return TaskbarResult(
                    success=False,
                    message="Không có profile nào được xóa"
                )
                
        except Exception as e:
            return TaskbarResult(
                success=False,
                message=f"Lỗi khi xóa profiles: {str(e)}"
            )
    
    # === EXPORT/IMPORT ===
    
    def export_profiles(self, profile_ids: List[int], export_format: str = "json") -> TaskbarResult:
        """Export các profiles đã chọn"""
        try:
            if not profile_ids:
                return TaskbarResult(
                    success=False,
                    message="Không có profile nào được chọn"
                )
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Lấy thông tin profiles
            placeholders = ','.join(['?' for _ in profile_ids])
            cursor.execute(f"""
                SELECT * FROM profiles 
                WHERE id IN ({placeholders}) AND is_active = 1
            """, profile_ids)
            
            profiles = cursor.fetchall()
            conn.close()
            
            if not profiles:
                return TaskbarResult(
                    success=False,
                    message="Không tìm thấy profile nào để export"
                )
            
            # Chuyển đổi sang dict
            export_data = []
            for profile in profiles:
                profile_dict = dict(profile)
                # Loại bỏ các field không cần thiết
                profile_dict.pop('id', None)
                profile_dict.pop('is_active', None)
                export_data.append(profile_dict)
            
            # Tạo filename với timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"profiles_export_{timestamp}.{export_format}"
            
            if export_format == "json":
                import json
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(export_data, f, indent=2, ensure_ascii=False)
            else:
                return TaskbarResult(
                    success=False,
                    message="Format export không được hỗ trợ"
                )
            
            return TaskbarResult(
                success=True,
                message=f"Đã export {len(export_data)} profile(s) vào file {filename}",
                affected_count=len(export_data),
                data={"filename": filename}
            )
            
        except Exception as e:
            return TaskbarResult(
                success=False,
                message=f"Lỗi khi export profiles: {str(e)}"
            )
    
    # === UTILITY METHODS ===
    
    def get_running_profiles(self) -> List[int]:
        """Lấy danh sách profile IDs đang chạy"""
        return list(self.running_profiles)
    
    def is_profile_running(self, profile_id: int) -> bool:
        """Kiểm tra profile có đang chạy không"""
        return profile_id in self.running_profiles
    
    async def get_profiles_stats(self) -> Dict[str, int]:
        """Lấy thống kê profiles"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Tổng số profiles
            cursor.execute("SELECT COUNT(*) as total FROM profiles WHERE is_active = 1")
            total = cursor.fetchone()['total']
            
            # Profiles đang chạy
            running = len(self.running_profiles)
            
            # Profiles có proxy
            cursor.execute("""
                SELECT COUNT(*) as with_proxy 
                FROM profiles 
                WHERE is_active = 1 AND proxy_host IS NOT NULL AND proxy_host != ''
            """)
            with_proxy = cursor.fetchone()['with_proxy']
            
            # Proxy status stats
            cursor.execute("""
                SELECT proxy_status, COUNT(*) as count
                FROM profiles 
                WHERE is_active = 1 AND proxy_status IS NOT NULL AND proxy_status != ''
                GROUP BY proxy_status
            """)
            proxy_stats = {row['proxy_status']: row['count'] for row in cursor.fetchall()}
            
            conn.close()
            
            return {
                "total": total,
                "running": running,
                "stopped": total - running,
                "with_proxy": with_proxy,
                "without_proxy": total - with_proxy,
                "proxy_ready": proxy_stats.get(ProxyStatus.READY.value, 0),
                "proxy_error": proxy_stats.get(ProxyStatus.ERROR.value, 0),
                "proxy_checking": proxy_stats.get(ProxyStatus.CHECKING.value, 0)
            }
            
        except Exception as e:
            print(f"❌ Error getting profiles stats: {e}")
            return {}

# Global instance
taskbar_handler = TaskbarHandler()