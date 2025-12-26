"""
Main Logic Handler for PMLogin Application
Tách logic xử lý từ index.html sang Python backend
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import asyncio
from pathlib import Path
import re

# Import existing modules
from .db_client import DatabaseClient
from .proxy_manager import ProxyManager

class MainLogicHandler:
    """
    Xử lý logic chính của ứng dụng PMLogin
    Tách từ JavaScript trong index.html sang Python
    """
    
    def __init__(self, db_client: DatabaseClient = None):
        self.logger = logging.getLogger(__name__)
        self.db_client = db_client or DatabaseClient()
        self.proxy_manager = ProxyManager(self.db_client)
        
        # Cache for performance
        self._profiles_cache = None
        self._proxies_cache = None
        self._cache_timestamp = None
        self._cache_ttl = 30  # seconds
        
    def _is_cache_valid(self) -> bool:
        """Kiểm tra cache có còn hợp lệ không"""
        if self._cache_timestamp is None:
            return False
        return (datetime.now() - self._cache_timestamp).seconds < self._cache_ttl
    
    def _update_cache_timestamp(self):
        """Cập nhật timestamp cache"""
        self._cache_timestamp = datetime.now()
    
    # ==================== DASHBOARD LOGIC ====================
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """
        Lấy thống kê cho dashboard
        Thay thế cho updateDashboardStats() trong JavaScript
        """
        try:
            self.logger.info("Getting dashboard statistics...")
            
            # Get profiles count
            profiles_result = self.get_profiles_summary()
            total_profiles = profiles_result.get('total_count', 0)
            
            # Get proxy stats
            proxy_stats = self.get_proxy_statistics()
            
            # Get system info
            system_info = self._get_system_info()
            
            stats = {
                'profiles': {
                    'total': total_profiles,
                    'active': profiles_result.get('active_count', 0),
                    'recent_activity': profiles_result.get('recent_activity', [])
                },
                'proxies': {
                    'total': proxy_stats.get('total', 0),
                    'working': proxy_stats.get('live', 0),
                    'failed': proxy_stats.get('dead', 0),
                    'unchecked': proxy_stats.get('unchecked', 0)
                },
                'system': system_info,
                'last_updated': datetime.now().isoformat()
            }
            
            self.logger.info(f"Dashboard stats: {stats}")
            return {'success': True, 'data': stats}
            
        except Exception as e:
            self.logger.error(f"Error getting dashboard stats: {e}")
            return {'success': False, 'message': str(e)}
    
    def _get_system_info(self) -> Dict[str, str]:
        """Lấy thông tin hệ thống"""
        try:
            # Read version from version.json if exists
            version_file = Path(__file__).parent.parent / 'version.json'
            version = "1.0.0"
            
            if version_file.exists():
                with open(version_file, 'r') as f:
                    version_data = json.load(f)
                    version = version_data.get('version', '1.0.0')
            
            return {
                'version': version,
                'platform': 'Windows',
                'hwid': 'DEMO-HWID-123'
            }
        except Exception as e:
            self.logger.error(f"Error getting system info: {e}")
            return {
                'version': '1.0.0',
                'platform': 'Windows', 
                'hwid': 'DEMO-HWID-123'
            }
    
    # ==================== PROFILES LOGIC ====================
    
    def get_profiles_summary(self) -> Dict[str, Any]:
        """
        Lấy tóm tắt thông tin profiles
        Thay thế cho logic profiles trong JavaScript
        """
        try:
            if self._is_cache_valid() and self._profiles_cache:
                return self._profiles_cache
            
            self.logger.info("Getting profiles summary...")
            
            # Get all profiles from database
            profiles = self.db_client.get_all_profiles()
            
            # Calculate statistics
            total_count = len(profiles)
            active_count = len([p for p in profiles if p.get('status') == 'active'])
            
            # Get recent activity (last 5 profiles)
            recent_profiles = sorted(profiles, 
                                   key=lambda x: x.get('created_at', 0), 
                                   reverse=True)[:5]
            
            recent_activity = []
            for profile in recent_profiles:
                recent_activity.append({
                    'id': profile.get('id'),
                    'name': profile.get('name', 'Unknown'),
                    'action': 'created',
                    'timestamp': profile.get('created_at'),
                    'status': profile.get('status', 'inactive')
                })
            
            result = {
                'total_count': total_count,
                'active_count': active_count,
                'recent_activity': recent_activity,
                'profiles': profiles
            }
            
            # Update cache
            self._profiles_cache = result
            self._update_cache_timestamp()
            
            self.logger.info(f"Profiles summary: {total_count} total, {active_count} active")
            return result
            
        except Exception as e:
            self.logger.error(f"Error getting profiles summary: {e}")
            return {
                'total_count': 0,
                'active_count': 0,
                'recent_activity': [],
                'profiles': []
            }
    
    def create_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tạo profile mới
        Thay thế cho handleCreateProfile() trong JavaScript
        """
        try:
            self.logger.info(f"Creating new profile: {profile_data.get('name')}")
            
            # Validate required fields
            validation_result = self._validate_profile_data(profile_data)
            if not validation_result['valid']:
                return {'success': False, 'message': validation_result['message']}
            
            # Prepare profile data
            processed_data = self._process_profile_data(profile_data)
            
            # Create profile in database
            profile_id = self.db_client.create_profile(processed_data)
            
            if profile_id:
                # Clear cache
                self._profiles_cache = None
                
                self.logger.info(f"Profile created successfully with ID: {profile_id}")
                return {
                    'success': True, 
                    'data': {'id': profile_id, 'name': processed_data['name']},
                    'message': 'Profile đã được tạo thành công!'
                }
            else:
                return {'success': False, 'message': 'Không thể tạo profile trong database'}
                
        except Exception as e:
            self.logger.error(f"Error creating profile: {e}")
            return {'success': False, 'message': f'Lỗi khi tạo profile: {str(e)}'}
    
    def _validate_profile_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate dữ liệu profile"""
        if not data.get('name') or not data['name'].strip():
            return {'valid': False, 'message': 'Tên profile là bắt buộc'}
        
        # Check for duplicate names
        existing_profiles = self.db_client.get_all_profiles()
        existing_names = [p.get('name', '').lower() for p in existing_profiles]
        
        if data['name'].lower().strip() in existing_names:
            return {'valid': False, 'message': 'Tên profile đã tồn tại'}
        
        return {'valid': True, 'message': 'Valid'}
    
    def _process_profile_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Xử lý và chuẩn hóa dữ liệu profile"""
        processed = {
            'name': data['name'].strip(),
            'platform': data.get('platform', 'windows'),
            'browser': data.get('browser', 'chrome'),
            'tags': self._process_tags(data.get('tags', '')),
            'group': data.get('group', ''),
            'note': data.get('note', ''),
            'share_on_cloud': data.get('shareOnCloud', False),
            'auto_start': data.get('autoStart', False),
            'proxy_config': self._process_proxy_config(data),
            'browser_config': self._process_browser_config(data),
            'status': 'inactive',
            'created_at': datetime.now().timestamp(),
            'updated_at': datetime.now().timestamp()
        }
        
        return processed
    
    def _process_tags(self, tags_str: str) -> List[str]:
        """Xử lý tags từ string thành list"""
        if not tags_str:
            return []
        
        tags = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        return tags
    
    def _process_proxy_config(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Xử lý cấu hình proxy"""
        proxy_type = data.get('proxyType', 'none')
        
        config = {'type': proxy_type}
        
        if proxy_type == 'pm_proxy':
            config['pm_proxy_id'] = data.get('pmProxyId')
        elif proxy_type == 'custom':
            config.update({
                'protocol': data.get('proxyProtocol', 'http'),
                'host': data.get('proxyHost', ''),
                'port': data.get('proxyPort', 0),
                'username': data.get('proxyUsername', ''),
                'password': data.get('proxyPassword', '')
            })
        
        return config
    
    def _process_browser_config(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Xử lý cấu hình browser"""
        return {
            'user_agent': data.get('userAgent', ''),
            'screen_width': data.get('screenWidth', 1920),
            'screen_height': data.get('screenHeight', 1080),
            'random_resolution': data.get('randomResolution', False),
            'webrtc': data.get('webrtc', 'disabled'),
            'timezone': data.get('timezone', 'auto'),
            'geolocation': data.get('geolocation', 'auto'),
            'cookies': data.get('cookies', '')
        }
    
    # ==================== PROXY LOGIC ====================
    
    def get_proxy_statistics(self) -> Dict[str, int]:
        """
        Lấy thống kê proxy
        Thay thế cho updateProxyStats() trong JavaScript
        """
        try:
            if self._is_cache_valid() and self._proxies_cache:
                return self._calculate_proxy_stats(self._proxies_cache)
            
            self.logger.info("Getting proxy statistics...")
            
            proxies = self.proxy_manager.get_all_proxies()
            
            # Update cache
            self._proxies_cache = proxies
            self._update_cache_timestamp()
            
            return self._calculate_proxy_stats(proxies)
            
        except Exception as e:
            self.logger.error(f"Error getting proxy statistics: {e}")
            return {'total': 0, 'live': 0, 'dead': 0, 'unchecked': 0}
    
    def _calculate_proxy_stats(self, proxies: List[Dict[str, Any]]) -> Dict[str, int]:
        """Tính toán thống kê proxy"""
        stats = {
            'total': len(proxies),
            'live': 0,
            'dead': 0,
            'unchecked': 0
        }
        
        for proxy in proxies:
            status = proxy.get('status', 'unchecked')
            if status == 'live':
                stats['live'] += 1
            elif status == 'dead':
                stats['dead'] += 1
            else:
                stats['unchecked'] += 1
        
        return stats
    
    def get_all_proxies(self) -> Dict[str, Any]:
        """
        Lấy tất cả proxy
        Thay thế cho loadProxiesFromBackend() trong JavaScript
        """
        try:
            self.logger.info("Getting all proxies...")
            
            proxies = self.proxy_manager.get_all_proxies()
            
            return {
                'success': True,
                'data': proxies,
                'count': len(proxies)
            }
            
        except Exception as e:
            self.logger.error(f"Error getting all proxies: {e}")
            return {'success': False, 'message': str(e), 'data': []}
    
    def create_proxy(self, proxy_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tạo proxy mới
        Thay thế cho saveNewProxy() trong JavaScript
        """
        try:
            self.logger.info(f"Creating new proxy: {proxy_data.get('host')}:{proxy_data.get('port')}")
            
            # Validate proxy data
            validation_result = self._validate_proxy_data(proxy_data)
            if not validation_result['valid']:
                return {'success': False, 'message': validation_result['message']}
            
            # Create proxy
            result = self.proxy_manager.add_proxy(proxy_data)
            
            if result:
                # Clear cache
                self._proxies_cache = None
                
                return {
                    'success': True,
                    'message': 'Proxy đã được thêm thành công!',
                    'data': proxy_data
                }
            else:
                return {'success': False, 'message': 'Không thể thêm proxy vào database'}
                
        except Exception as e:
            self.logger.error(f"Error creating proxy: {e}")
            return {'success': False, 'message': f'Lỗi khi tạo proxy: {str(e)}'}
    
    def _validate_proxy_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate dữ liệu proxy"""
        if not data.get('host') or not data['host'].strip():
            return {'valid': False, 'message': 'Host là bắt buộc'}
        
        port = data.get('port', 0)
        if not isinstance(port, int) or port < 1 or port > 65535:
            return {'valid': False, 'message': 'Port phải trong khoảng 1-65535'}
        
        # Check for duplicates
        existing_proxies = self.proxy_manager.get_all_proxies()
        for proxy in existing_proxies:
            if proxy.get('host') == data['host'] and proxy.get('port') == port:
                return {'valid': False, 'message': 'Proxy này đã tồn tại'}
        
        return {'valid': True, 'message': 'Valid'}
    
    def delete_proxy(self, proxy_identifier: Union[int, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Xóa proxy
        Thay thế cho deleteProxy() trong JavaScript
        """
        try:
            if isinstance(proxy_identifier, dict):
                host = proxy_identifier.get('host')
                port = proxy_identifier.get('port')
                self.logger.info(f"Deleting proxy: {host}:{port}")
            else:
                self.logger.info(f"Deleting proxy with ID: {proxy_identifier}")
            
            result = self.proxy_manager.delete_proxy(proxy_identifier)
            
            if result:
                # Clear cache
                self._proxies_cache = None
                
                return {
                    'success': True,
                    'message': 'Proxy đã được xóa thành công!'
                }
            else:
                return {'success': False, 'message': 'Không thể xóa proxy'}
                
        except Exception as e:
            self.logger.error(f"Error deleting proxy: {e}")
            return {'success': False, 'message': f'Lỗi khi xóa proxy: {str(e)}'}
    
    def bulk_import_proxies(self, proxies_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Import nhiều proxy cùng lúc
        Thay thế cho saveImportProxies() trong JavaScript
        """
        try:
            self.logger.info(f"Bulk importing {len(proxies_data)} proxies...")
            
            success_count = 0
            failed_count = 0
            errors = []
            
            for proxy_data in proxies_data:
                try:
                    # Validate each proxy
                    validation_result = self._validate_proxy_data(proxy_data)
                    if not validation_result['valid']:
                        failed_count += 1
                        errors.append(f"{proxy_data.get('host', 'Unknown')}:{proxy_data.get('port', 'Unknown')} - {validation_result['message']}")
                        continue
                    
                    # Add proxy
                    result = self.proxy_manager.add_proxy(proxy_data)
                    if result:
                        success_count += 1
                    else:
                        failed_count += 1
                        errors.append(f"{proxy_data.get('host')}:{proxy_data.get('port')} - Failed to add to database")
                        
                except Exception as e:
                    failed_count += 1
                    errors.append(f"{proxy_data.get('host', 'Unknown')}:{proxy_data.get('port', 'Unknown')} - {str(e)}")
            
            # Clear cache
            self._proxies_cache = None
            
            return {
                'success': True,
                'data': {
                    'successCount': success_count,
                    'failedCount': failed_count,
                    'totalCount': len(proxies_data),
                    'errors': errors[:10]  # Limit errors to first 10
                },
                'message': f'Import hoàn thành: {success_count} thành công, {failed_count} thất bại'
            }
            
        except Exception as e:
            self.logger.error(f"Error bulk importing proxies: {e}")
            return {'success': False, 'message': f'Lỗi khi import proxy: {str(e)}'}
    
    # ==================== UTILITY METHODS ====================
    
    def parse_proxy_list(self, proxy_text: str, format_type: str) -> List[Dict[str, Any]]:
        """
        Parse danh sách proxy từ text
        Thay thế cho parseProxyList() trong JavaScript
        """
        try:
            lines = [line.strip() for line in proxy_text.split('\n') if line.strip()]
            parsed_proxies = []
            
            for line in lines:
                try:
                    proxy_data = self._parse_single_proxy(line, format_type)
                    if proxy_data:
                        parsed_proxies.append(proxy_data)
                except Exception as e:
                    self.logger.warning(f"Failed to parse proxy line '{line}': {e}")
                    continue
            
            return parsed_proxies
            
        except Exception as e:
            self.logger.error(f"Error parsing proxy list: {e}")
            return []
    
    def _parse_single_proxy(self, line: str, format_type: str) -> Optional[Dict[str, Any]]:
        """Parse một dòng proxy theo format"""
        line = line.strip()
        if not line:
            return None
        
        host = port = username = password = proxy_type = None
        
        try:
            if format_type == 'host:port':
                parts = line.split(':')
                if len(parts) >= 2:
                    host, port = parts[0], int(parts[1])
                    proxy_type = 'http'
            
            elif format_type == 'host:port:username:password':
                parts = line.split(':')
                if len(parts) >= 4:
                    host, port, username, password = parts[0], int(parts[1]), parts[2], parts[3]
                    proxy_type = 'http'
            
            elif format_type == 'type://host:port':
                match = re.match(r'^(\w+)://([^:]+):(\d+)$', line)
                if match:
                    proxy_type, host, port = match.groups()
                    port = int(port)
            
            elif format_type == 'type://host:port:username:password':
                match = re.match(r'^(\w+)://([^:]+):(\d+):([^:]*):(.*)$', line)
                if match:
                    proxy_type, host, port, username, password = match.groups()
                    port = int(port)
            
            elif format_type == 'type://username:password@host:port':
                match = re.match(r'^(\w+)://([^:]*):([^@]*)@([^:]+):(\d+)$', line)
                if match:
                    proxy_type, username, password, host, port = match.groups()
                    port = int(port)
            
            if host and port:
                return {
                    'host': host.strip(),
                    'port': port,
                    'username': username.strip() if username else '',
                    'password': password.strip() if password else '',
                    'type': proxy_type.lower() if proxy_type else 'http',
                    'tags': ['Imported']
                }
        
        except (ValueError, AttributeError) as e:
            self.logger.warning(f"Failed to parse proxy line '{line}': {e}")
        
        return None
    
    def clear_cache(self):
        """Xóa cache"""
        self._profiles_cache = None
        self._proxies_cache = None
        self._cache_timestamp = None
        self.logger.info("Cache cleared")
    
    def get_health_status(self) -> Dict[str, Any]:
        """Kiểm tra trạng thái hệ thống"""
        try:
            # Test database connection
            db_status = self.db_client.test_connection()
            
            # Get basic stats
            profiles_count = len(self.db_client.get_all_profiles())
            proxies_count = len(self.proxy_manager.get_all_proxies())
            
            return {
                'success': True,
                'data': {
                    'database': 'connected' if db_status else 'disconnected',
                    'profiles_count': profiles_count,
                    'proxies_count': proxies_count,
                    'cache_status': 'valid' if self._is_cache_valid() else 'expired',
                    'timestamp': datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error getting health status: {e}")
            return {
                'success': False,
                'message': str(e),
                'data': {
                    'database': 'error',
                    'timestamp': datetime.now().isoformat()
                }
            }


# Singleton instance
_main_logic_handler = None

def get_main_logic_handler() -> MainLogicHandler:
    """Get singleton instance của MainLogicHandler"""
    global _main_logic_handler
    if _main_logic_handler is None:
        _main_logic_handler = MainLogicHandler()
    return _main_logic_handler