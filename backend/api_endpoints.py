"""
API Endpoints for PMLogin Application
Cung cấp các endpoint để frontend gọi logic Python
"""

import json
import logging
from typing import Dict, Any, List
from flask import Flask, request, jsonify
from flask_cors import CORS

from .main_logic_handler import get_main_logic_handler

class APIEndpoints:
    """
    API Endpoints cho PMLogin Application
    Thay thế các JavaScript function calls bằng HTTP API calls
    """
    
    def __init__(self, app: Flask = None):
        self.logger = logging.getLogger(__name__)
        self.logic_handler = get_main_logic_handler()
        
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialize Flask app với các endpoints"""
        # Enable CORS for all endpoints
        CORS(app)
        
        # Register all endpoints
        self._register_dashboard_endpoints(app)
        self._register_profile_endpoints(app)
        self._register_proxy_endpoints(app)
        self._register_utility_endpoints(app)
        
        self.logger.info("API endpoints registered successfully")
    
    def _register_dashboard_endpoints(self, app: Flask):
        """Register dashboard related endpoints"""
        
        @app.route('/api/dashboard/stats', methods=['GET'])
        def get_dashboard_stats():
            """
            GET /api/dashboard/stats
            Thay thế cho updateDashboardStats() trong JavaScript
            """
            try:
                result = self.logic_handler.get_dashboard_stats()
                return jsonify(result)
            except Exception as e:
                self.logger.error(f"Error in get_dashboard_stats: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/dashboard/health', methods=['GET'])
        def get_health_status():
            """
            GET /api/dashboard/health
            Kiểm tra trạng thái hệ thống
            """
            try:
                result = self.logic_handler.get_health_status()
                return jsonify(result)
            except Exception as e:
                self.logger.error(f"Error in get_health_status: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
    
    def _register_profile_endpoints(self, app: Flask):
        """Register profile related endpoints"""
        
        @app.route('/api/profiles', methods=['GET'])
        def get_profiles():
            """
            GET /api/profiles
            Thay thế cho initializeProfiles() trong JavaScript
            """
            try:
                result = self.logic_handler.get_profiles_summary()
                return jsonify({
                    'success': True,
                    'data': result.get('profiles', []),
                    'summary': {
                        'total_count': result.get('total_count', 0),
                        'active_count': result.get('active_count', 0),
                        'recent_activity': result.get('recent_activity', [])
                    }
                })
            except Exception as e:
                self.logger.error(f"Error in get_profiles: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/profiles', methods=['POST'])
        def create_profile():
            """
            POST /api/profiles
            Thay thế cho handleCreateProfile() trong JavaScript
            """
            try:
                profile_data = request.get_json()
                if not profile_data:
                    return jsonify({'success': False, 'message': 'No data provided'}), 400
                
                result = self.logic_handler.create_profile(profile_data)
                
                if result['success']:
                    return jsonify(result), 201
                else:
                    return jsonify(result), 400
                    
            except Exception as e:
                self.logger.error(f"Error in create_profile: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/profiles/<int:profile_id>', methods=['PUT'])
        def update_profile(profile_id: int):
            """
            PUT /api/profiles/<id>
            Cập nhật profile (sẽ implement sau)
            """
            try:
                profile_data = request.get_json()
                # TODO: Implement update profile logic
                return jsonify({
                    'success': False, 
                    'message': 'Update profile functionality will be implemented'
                }), 501
                
            except Exception as e:
                self.logger.error(f"Error in update_profile: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/profiles/<int:profile_id>', methods=['DELETE'])
        def delete_profile(profile_id: int):
            """
            DELETE /api/profiles/<id>
            Xóa profile (sẽ implement sau)
            """
            try:
                # TODO: Implement delete profile logic
                return jsonify({
                    'success': False,
                    'message': 'Delete profile functionality will be implemented'
                }), 501
                
            except Exception as e:
                self.logger.error(f"Error in delete_profile: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
    
    def _register_proxy_endpoints(self, app: Flask):
        """Register proxy related endpoints"""
        
        @app.route('/api/proxies', methods=['GET'])
        def get_proxies():
            """
            GET /api/proxies
            Thay thế cho loadProxiesFromBackend() trong JavaScript
            """
            try:
                result = self.logic_handler.get_all_proxies()
                return jsonify(result)
            except Exception as e:
                self.logger.error(f"Error in get_proxies: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/proxies/stats', methods=['GET'])
        def get_proxy_stats():
            """
            GET /api/proxies/stats
            Thay thế cho updateProxyStats() trong JavaScript
            """
            try:
                stats = self.logic_handler.get_proxy_statistics()
                return jsonify({'success': True, 'data': stats})
            except Exception as e:
                self.logger.error(f"Error in get_proxy_stats: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/proxies', methods=['POST'])
        def create_proxy():
            """
            POST /api/proxies
            Thay thế cho saveNewProxy() trong JavaScript
            """
            try:
                proxy_data = request.get_json()
                if not proxy_data:
                    return jsonify({'success': False, 'message': 'No data provided'}), 400
                
                result = self.logic_handler.create_proxy(proxy_data)
                
                if result['success']:
                    return jsonify(result), 201
                else:
                    return jsonify(result), 400
                    
            except Exception as e:
                self.logger.error(f"Error in create_proxy: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/proxies/bulk', methods=['POST'])
        def bulk_import_proxies():
            """
            POST /api/proxies/bulk
            Thay thế cho saveImportProxies() trong JavaScript
            """
            try:
                data = request.get_json()
                if not data:
                    return jsonify({'success': False, 'message': 'No data provided'}), 400
                
                proxies_data = data.get('proxies', [])
                if not proxies_data:
                    return jsonify({'success': False, 'message': 'No proxies provided'}), 400
                
                result = self.logic_handler.bulk_import_proxies(proxies_data)
                
                if result['success']:
                    return jsonify(result), 201
                else:
                    return jsonify(result), 400
                    
            except Exception as e:
                self.logger.error(f"Error in bulk_import_proxies: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/proxies/<proxy_id>', methods=['DELETE'])
        def delete_proxy(proxy_id):
            """
            DELETE /api/proxies/<id>
            Thay thế cho deleteProxy() trong JavaScript
            """
            try:
                # Try to parse as int first (for ID), then as host:port
                try:
                    proxy_identifier = int(proxy_id)
                except ValueError:
                    # Parse as host:port format
                    if ':' in proxy_id:
                        host, port = proxy_id.split(':', 1)
                        proxy_identifier = {'host': host, 'port': int(port)}
                    else:
                        return jsonify({'success': False, 'message': 'Invalid proxy identifier'}), 400
                
                result = self.logic_handler.delete_proxy(proxy_identifier)
                
                if result['success']:
                    return jsonify(result)
                else:
                    return jsonify(result), 400
                    
            except Exception as e:
                self.logger.error(f"Error in delete_proxy: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/proxies/test/<int:proxy_id>', methods=['POST'])
        def test_proxy(proxy_id: int):
            """
            POST /api/proxies/test/<id>
            Test proxy (sẽ implement sau)
            """
            try:
                # TODO: Implement proxy testing logic
                return jsonify({
                    'success': False,
                    'message': 'Proxy testing functionality will be implemented'
                }), 501
                
            except Exception as e:
                self.logger.error(f"Error in test_proxy: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
    
    def _register_utility_endpoints(self, app: Flask):
        """Register utility endpoints"""
        
        @app.route('/api/utils/parse-proxies', methods=['POST'])
        def parse_proxy_list():
            """
            POST /api/utils/parse-proxies
            Thay thế cho parseProxyList() trong JavaScript
            """
            try:
                data = request.get_json()
                if not data:
                    return jsonify({'success': False, 'message': 'No data provided'}), 400
                
                proxy_text = data.get('text', '')
                format_type = data.get('format', 'host:port')
                
                if not proxy_text.strip():
                    return jsonify({'success': False, 'message': 'No proxy text provided'}), 400
                
                parsed_proxies = self.logic_handler.parse_proxy_list(proxy_text, format_type)
                
                return jsonify({
                    'success': True,
                    'data': {
                        'proxies': parsed_proxies,
                        'count': len(parsed_proxies),
                        'format': format_type
                    }
                })
                
            except Exception as e:
                self.logger.error(f"Error in parse_proxy_list: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/utils/clear-cache', methods=['POST'])
        def clear_cache():
            """
            POST /api/utils/clear-cache
            Xóa cache hệ thống
            """
            try:
                self.logic_handler.clear_cache()
                return jsonify({
                    'success': True,
                    'message': 'Cache cleared successfully'
                })
                
            except Exception as e:
                self.logger.error(f"Error in clear_cache: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500
        
        @app.route('/api/utils/validate-proxy', methods=['POST'])
        def validate_proxy_data():
            """
            POST /api/utils/validate-proxy
            Validate dữ liệu proxy
            """
            try:
                proxy_data = request.get_json()
                if not proxy_data:
                    return jsonify({'success': False, 'message': 'No data provided'}), 400
                
                validation_result = self.logic_handler._validate_proxy_data(proxy_data)
                
                return jsonify({
                    'success': True,
                    'data': validation_result
                })
                
            except Exception as e:
                self.logger.error(f"Error in validate_proxy_data: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500


def create_api_app() -> Flask:
    """
    Tạo Flask app với tất cả API endpoints
    """
    app = Flask(__name__)
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Initialize API endpoints
    api = APIEndpoints(app)
    
    # Add a simple health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'PMLogin API',
            'version': '1.0.0'
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Endpoint not found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500
    
    return app


if __name__ == '__main__':
    # Run the API server for testing
    app = create_api_app()
    app.run(host='127.0.0.1', port=5000, debug=True)