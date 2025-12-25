"""
PM Login Local Backend API
Xử lý logic nghiệp vụ và database local (không cần authentication)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os
from datetime import datetime
from typing import Optional, List, Dict, Any
import uvicorn

# Import ProxyHandler
from proxy_handler import get_proxy_handler

# Khởi tạo FastAPI app
app = FastAPI(title="PM Login Local API", version="1.0.0")

# CORS middleware để cho phép frontend kết nối
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path
DB_PATH = "pmlogin_local.db"

# Pydantic models
class ProfileCreate(BaseModel):
    name: str
    proxy_host: Optional[str] = None
    proxy_port: Optional[int] = None
    proxy_username: Optional[str] = None
    proxy_password: Optional[str] = None
    user_agent: Optional[str] = None
    browser_type: Optional[str] = "chrome"
    notes: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    proxy_host: Optional[str] = None
    proxy_port: Optional[int] = None
    proxy_username: Optional[str] = None
    proxy_password: Optional[str] = None
    user_agent: Optional[str] = None
    browser_type: Optional[str] = None
    notes: Optional[str] = None

class ProxyCreate(BaseModel):
    name: Optional[str] = None
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    type: str = "http"
    tags: Optional[List[str]] = None

class ProxyUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    type: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ProxyBulkCreate(BaseModel):
    proxies: List[Dict[str, Any]]

# Database functions
def init_database():
    """Khởi tạo database local"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Tạo bảng profiles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            proxy_host TEXT,
            proxy_port INTEGER,
            proxy_username TEXT,
            proxy_password TEXT,
            proxy_protocol TEXT DEFAULT 'http',
            proxy_status TEXT DEFAULT '',
            user_agent TEXT,
            browser_type TEXT DEFAULT 'chrome',
            notes TEXT,
            is_active BOOLEAN DEFAULT 1,
            last_started_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tạo bảng proxies
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS proxies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            username TEXT,
            password TEXT,
            protocol TEXT DEFAULT 'http',
            country TEXT,
            notes TEXT,
            is_active BOOLEAN DEFAULT 1,
            last_checked TIMESTAMP,
            response_time INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tạo bảng tags
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            color TEXT DEFAULT '#007bff',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tạo bảng profile_tags (many-to-many)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS profile_tags (
            profile_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (profile_id, tag_id),
            FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Lấy kết nối database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# API Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "PM Login Local API is running", "version": "1.0.0"}

@app.get("/stats")
async def get_stats():
    """Lấy thống kê tổng quan"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Đếm profiles
        cursor.execute("SELECT COUNT(*) as count FROM profiles WHERE is_active = 1")
        profiles_count = cursor.fetchone()['count']
        
        # Đếm proxies
        cursor.execute("SELECT COUNT(*) as count FROM proxies WHERE is_active = 1")
        proxies_count = cursor.fetchone()['count']
        
        # Đếm tags
        cursor.execute("SELECT COUNT(*) as count FROM tags")
        tags_count = cursor.fetchone()['count']
        
        conn.close()
        
        return {
            "success": True,
            "data": {
                "profiles": profiles_count,
                "proxies": proxies_count,
                "tags": tags_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Profile endpoints
@app.get("/profiles")
async def get_profiles():
    """Lấy danh sách tất cả profiles"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT p.*, GROUP_CONCAT(t.name) as tags
            FROM profiles p
            LEFT JOIN profile_tags pt ON p.id = pt.profile_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            WHERE p.is_active = 1
            GROUP BY p.id
            ORDER BY p.created_at DESC
        """)
        profiles = cursor.fetchall()
        
        profiles_list = []
        for profile in profiles:
            profiles_list.append({
                "id": profile['id'],
                "name": profile['name'],
                "proxy_host": profile['proxy_host'],
                "proxy_port": profile['proxy_port'],
                "proxy_username": profile['proxy_username'],
                "proxy_password": profile['proxy_password'],
                "user_agent": profile['user_agent'],
                "browser_type": profile['browser_type'],
                "notes": profile['notes'],
                "tags": profile['tags'].split(',') if profile['tags'] else [],
                "created_at": profile['created_at'],
                "updated_at": profile['updated_at']
            })
        
        conn.close()
        return {"success": True, "data": profiles_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/profiles")
async def create_profile(profile: ProfileCreate):
    """Tạo profile mới"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO profiles (name, proxy_host, proxy_port, proxy_username, 
                                proxy_password, user_agent, browser_type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            profile.name,
            profile.proxy_host,
            profile.proxy_port,
            profile.proxy_username,
            profile.proxy_password,
            profile.user_agent,
            profile.browser_type,
            profile.notes
        ))
        
        profile_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "data": {"id": profile_id},
            "message": "Profile đã được tạo thành công"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/profiles/{profile_id}")
async def update_profile(profile_id: int, profile: ProfileUpdate):
    """Cập nhật profile"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Kiểm tra profile có tồn tại không
        cursor.execute("SELECT id FROM profiles WHERE id = ? AND is_active = 1", (profile_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Profile không tồn tại")
        
        # Tạo câu lệnh UPDATE động
        update_fields = []
        values = []
        
        for field, value in profile.dict(exclude_unset=True).items():
            update_fields.append(f"{field} = ?")
            values.append(value)
        
        if update_fields:
            update_fields.append("updated_at = ?")
            values.append(datetime.now().isoformat())
            values.append(profile_id)
            
            query = f"UPDATE profiles SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, values)
            conn.commit()
        
        conn.close()
        
        return {
            "success": True,
            "message": "Profile đã được cập nhật thành công"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: int):
    """Xóa profile (soft delete)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Kiểm tra profile có tồn tại không
        cursor.execute("SELECT id FROM profiles WHERE id = ? AND is_active = 1", (profile_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Profile không tồn tại")
        
        # Soft delete
        cursor.execute(
            "UPDATE profiles SET is_active = 0, updated_at = ? WHERE id = ?",
            (datetime.now().isoformat(), profile_id)
        )
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "Profile đã được xóa thành công"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Proxy endpoints
@app.get("/proxies")
async def get_proxies():
    """Lấy danh sách tất cả proxies"""
    try:
        proxy_handler = get_proxy_handler()
        result = proxy_handler.get_all_proxies()
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/proxies")
async def create_proxy(proxy: ProxyCreate):
    """Tạo proxy mới"""
    try:
        proxy_handler = get_proxy_handler()
        proxy_data = proxy.dict()
        result = proxy_handler.add_proxy(proxy_data)
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/proxies/bulk")
async def bulk_create_proxies(request: ProxyBulkCreate):
    """Tạo nhiều proxy cùng lúc"""
    try:
        proxy_handler = get_proxy_handler()
        result = proxy_handler.bulk_add_proxies(request.proxies)
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/proxies/{host}/{port}")
async def delete_proxy_by_host_port(host: str, port: int):
    """Xóa proxy theo host và port"""
    try:
        proxy_handler = get_proxy_handler()
        result = proxy_handler.delete_proxy(host, port)
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=404, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/proxies/{host}/{port}/status")
async def update_proxy_status(host: str, port: int, status: str, fail_count: int = 0, proxy_type: str = None):
    """Cập nhật trạng thái proxy"""
    try:
        proxy_handler = get_proxy_handler()
        result = proxy_handler.update_proxy_status(host, port, status, fail_count, proxy_type)
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=404, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/proxies/stats")
async def get_proxy_stats():
    """Lấy thống kê proxy"""
    try:
        proxy_handler = get_proxy_handler()
        result = proxy_handler.get_proxy_stats()
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tags")
async def get_tags():
    """Lấy danh sách tất cả tags"""
    try:
        proxy_handler = get_proxy_handler()
        result = proxy_handler.get_all_tags()
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Tag endpoints - đã được xử lý trong proxy endpoints ở trên

# Taskbar action endpoints
@app.post("/taskbar/start-profiles")
async def start_profiles(profile_ids: List[int]):
    """Khởi động các profiles đã chọn"""
    try:
        from taskbar import taskbar_handler
        result = await taskbar_handler.start_profiles(profile_ids)
        
        return {
            "success": result.success,
            "message": result.message,
            "affected_count": result.affected_count,
            "data": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/taskbar/stop-profiles")
async def stop_profiles(profile_ids: List[int]):
    """Dừng các profiles đã chọn"""
    try:
        from taskbar import taskbar_handler
        result = await taskbar_handler.stop_profiles(profile_ids)
        
        return {
            "success": result.success,
            "message": result.message,
            "affected_count": result.affected_count,
            "data": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/taskbar/check-proxies")
async def check_proxies(profile_ids: List[int]):
    """Kiểm tra proxy của các profiles đã chọn"""
    try:
        from taskbar import taskbar_handler
        result = await taskbar_handler.check_proxies(profile_ids)
        
        return {
            "success": result.success,
            "message": result.message,
            "affected_count": result.affected_count,
            "data": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UpdateProxyRequest(BaseModel):
    profile_ids: List[int]
    proxy_list: List[str]
    connection_type: str = "Common"
    service: str = "TZ"
    webrtc: str = "Forward"
    enable_change_ip: bool = False

@app.post("/taskbar/update-proxies")
async def update_proxies(request: UpdateProxyRequest):
    """Cập nhật proxy cho các profiles đã chọn"""
    try:
        from taskbar import taskbar_handler
        result = await taskbar_handler.update_proxies(
            profile_ids=request.profile_ids,
            proxy_list=request.proxy_list,
            connection_type=request.connection_type,
            service=request.service,
            webrtc=request.webrtc,
            enable_change_ip=request.enable_change_ip
        )
        
        return {
            "success": result.success,
            "message": result.message,
            "affected_count": result.affected_count,
            "data": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CloneProfilesRequest(BaseModel):
    profile_ids: List[int]
    clone_count: int = 1

@app.post("/taskbar/clone-profiles")
async def clone_profiles(request: CloneProfilesRequest):
    """Clone các profiles đã chọn"""
    try:
        from taskbar import taskbar_handler
        result = await taskbar_handler.clone_profiles(
            profile_ids=request.profile_ids,
            clone_count=request.clone_count
        )
        
        return {
            "success": result.success,
            "message": result.message,
            "affected_count": result.affected_count,
            "data": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/taskbar/delete-profiles")
async def delete_profiles(profile_ids: List[int]):
    """Xóa các profiles đã chọn"""
    try:
        from taskbar import taskbar_handler
        result = await taskbar_handler.delete_profiles(profile_ids)
        
        return {
            "success": result.success,
            "message": result.message,
            "affected_count": result.affected_count,
            "data": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExportProfilesRequest(BaseModel):
    profile_ids: List[int]
    export_format: str = "json"

@app.post("/taskbar/export-profiles")
async def export_profiles(request: ExportProfilesRequest):
    """Export các profiles đã chọn"""
    try:
        from taskbar import taskbar_handler
        result = taskbar_handler.export_profiles(
            profile_ids=request.profile_ids,
            export_format=request.export_format
        )
        
        return {
            "success": result.success,
            "message": result.message,
            "affected_count": result.affected_count,
            "data": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/taskbar/running-profiles")
async def get_running_profiles():
    """Lấy danh sách profiles đang chạy"""
    try:
        from taskbar import taskbar_handler
        running_profiles = taskbar_handler.get_running_profiles()
        
        return {
            "success": True,
            "data": running_profiles
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/taskbar/profiles-stats")
async def get_profiles_stats():
    """Lấy thống kê profiles"""
    try:
        from taskbar import taskbar_handler
        stats = await taskbar_handler.get_profiles_stats()
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Khởi tạo database khi start app
@app.on_event("startup")
async def startup_event():
    init_database()
    print("✅ Local database initialized")
    print("🚀 PM Login Local API started on http://127.0.0.1:8000")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)