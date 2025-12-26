"""
IPC Handler for PMLogin Application
Xử lý các IPC calls từ Electron frontend đến Python backend
"""

import json
import logging
from typing import Dict, Any, List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

from .main_logic_handler import get_main_logic_handler

class IPCHandler:
    """
    IPC Handler để xử lý calls từ Electron frontend
    Thay thế JavaScript logic bằng Python backend calls
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logic_handler = get_main_logic_handler()
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Map method names to handler functions
        self.method_handlers = {
            # Dashboard methods
            'get_dashboard_stats': self._handle_get_dashboard_stats,
            'get_health_status': self._handle_get_health_status,
            
            # Profile methods
            'get_profiles_summary': self._handle_get_profiles_summary,
            'create_profile': self._handle_create_profile,
            
            # Proxy methods
            'get_all_proxies': self._handle_get_all_proxies,
            'get_proxy_statistics': self._handle_get_proxy_statistics,
            'create_proxy': self._handle_create_proxy,
            'delete_proxy': self._handle_delete_proxy,
            'bulk_import_proxies': self._handle_bulk_import_proxies,
            
            # Utility methods
            'parse_proxy_list': self._handle_parse_proxy_list,
            'clear_cache': self._handle_clear_cache,
        }
        
        self.logger.info("IPC Handler initialized with %d method handlers", len(self.method_handlers))
    
    async def handle_ipc_call(self, method: str, args: List[Any] = None) -> Dict[str, Any]:
        """
        Handle IPC call từ Electron frontend
        
        Args:
            method: Tên method cần gọi
            args: Arguments cho method
            
        Returns:
            Dict chứa kết quả hoặc error
        """
        try:
            self.logger.info(f"🔄 Handling IPC call: {method} with args: {args}")
            
            if method not in self.method_handlers:
                return {
                    'success': False,
                    'message': f'Unknown method: {method}',
                    'available_methods': list(self.method_handlers.keys())
                }
            
            handler = self.method_handlers[method]
            
            # Run handler in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._run_handler,
                handler,
                args or []
            )
            
            self.logger.info(f"✅ IPC call {method} completed successfully")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Error handling IPC call {method}: {e}")
            return {
                'success': False,
                'message': f'Error in {method}: {str(e)}',
                'error_type': type(e).__name__
            }
    
    def _run_handler(self, handler, args):
        """Run handler function with args"""
        try:
            if args:
                return handler(*args)
            else:
                return handler()
        except Exception as e:
            self.logger.error(f"Handler error: {e}")
            raise
    
    # ==================== DASHBOARD HANDLERS ====================
    
    def _handle_get_dashboard_stats(self) -> Dict[str, Any]:
        """Handle get_dashboard_stats call"""
        return self.logic_handler.get_dashboard_stats()
    
    def _handle_get_health_status(self) -> Dict[str, Any]:
        """Handle get_health_status call"""
        return self.logic_handler.get_health_status()
    
    # ==================== PROFILE HANDLERS ====================
    
    def _handle_get_profiles_summary(self) -> Dict[str, Any]:
        """Handle get_profiles_summary call"""
        return self.logic_handler.get_profiles_summary()
    
    def _handle_create_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle create_profile call"""
        return self.logic_handler.create_profile(profile_data)
    
    # ==================== PROXY HANDLERS ====================
    
    def _handle_get_all_proxies(self) -> Dict[str, Any]:
        """Handle get_all_proxies call"""
        return self.logic_handler.get_all_proxies()
    
    def _handle_get_proxy_statistics(self) -> Dict[str, int]:
        """Handle get_proxy_statistics call"""
        return self.logic_handler.get_proxy_statistics()
    
    def _handle_create_proxy(self, proxy_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle create_proxy call"""
        return self.logic_handler.create_proxy(proxy_data)
    
    def _handle_delete_proxy(self, proxy_identifier) -> Dict[str, Any]:
        """Handle delete_proxy call"""
        return self.logic_handler.delete_proxy(proxy_identifier)
    
    def _handle_bulk_import_proxies(self, proxies_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Handle bulk_import_proxies call"""
        return self.logic_handler.bulk_import_proxies(proxies_data)
    
    # ==================== UTILITY HANDLERS ====================
    
    def _handle_parse_proxy_list(self, proxy_text: str, format_type: str = 'host:port') -> List[Dict[str, Any]]:
        """Handle parse_proxy_list call"""
        return self.logic_handler.parse_proxy_list(proxy_text, format_type)
    
    def _handle_clear_cache(self) -> Dict[str, Any]:
        """Handle clear_cache call"""
        self.logic_handler.clear_cache()
        return {
            'success': True,
            'message': 'Cache cleared successfully'
        }
    
    def get_available_methods(self) -> List[str]:
        """Get list of available methods"""
        return list(self.method_handlers.keys())
    
    def close(self):
        """Close the IPC handler and cleanup resources"""
        if self.executor:
            self.executor.shutdown(wait=True)
        self.logger.info("IPC Handler closed")


# Global instance
_ipc_handler = None

def get_ipc_handler() -> IPCHandler:
    """Get singleton instance của IPCHandler"""
    global _ipc_handler
    if _ipc_handler is None:
        _ipc_handler = IPCHandler()
    return _ipc_handler


# Electron IPC integration functions
def setup_electron_ipc_handlers(ipc_main):
    """
    Setup IPC handlers cho Electron main process
    
    Args:
        ipc_main: Electron's ipcMain object
    """
    handler = get_ipc_handler()
    
    @ipc_main.handle('python-backend:main-logic')
    async def handle_main_logic_call(event, data):
        """
        Handle main logic calls từ renderer process
        
        Expected data format:
        {
            "method": "method_name",
            "args": [arg1, arg2, ...]
        }
        """
        try:
            method = data.get('method')
            args = data.get('args', [])
            
            if not method:
                return {
                    'success': False,
                    'message': 'Method name is required'
                }
            
            result = await handler.handle_ipc_call(method, args)
            return result
            
        except Exception as e:
            logging.error(f"Error in IPC handler: {e}")
            return {
                'success': False,
                'message': str(e),
                'error_type': type(e).__name__
            }
    
    @ipc_main.handle('python-backend:get-methods')
    def handle_get_methods(event):
        """Get available methods"""
        return {
            'success': True,
            'data': handler.get_available_methods()
        }
    
    @ipc_main.handle('python-backend:health')
    def handle_health_check(event):
        """Health check endpoint"""
        return {
            'success': True,
            'message': 'Python backend is healthy',
            'available_methods': len(handler.get_available_methods())
        }
    
    logging.info("✅ Electron IPC handlers setup completed")


# For testing purposes
if __name__ == '__main__':
    import asyncio
    
    async def test_ipc_handler():
        """Test IPC handler functionality"""
        handler = get_ipc_handler()
        
        # Test dashboard stats
        print("Testing dashboard stats...")
        result = await handler.handle_ipc_call('get_dashboard_stats')
        print(f"Dashboard stats: {result}")
        
        # Test proxy stats
        print("\nTesting proxy stats...")
        result = await handler.handle_ipc_call('get_proxy_statistics')
        print(f"Proxy stats: {result}")
        
        # Test available methods
        print(f"\nAvailable methods: {handler.get_available_methods()}")
        
        handler.close()
    
    # Run test
    asyncio.run(test_ipc_handler())