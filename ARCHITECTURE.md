# PM Login App v2 - Kiến trúc ứng dụng

## Tổng quan

Ứng dụng PM Login v2 được thiết kế với kiến trúc tách biệt giữa frontend (JavaScript/Electron) và backend (Python) để tối ưu hóa hiệu suất và khả năng bảo trì.

## Kiến trúc

### Frontend (JavaScript/Electron)
- **Vị trí**: `src/`
- **Chức năng**: 
  - Giao diện người dùng
  - Điều hướng và tương tác
  - Quản lý session và authentication
  - Kết nối với các API services

### Backend (Python/FastAPI)
- **Vị trí**: `backend/`
- **Chức năng**:
  - Xử lý logic nghiệp vụ
  - Quản lý database local
  - API endpoints cho profiles, proxies, tags
  - Không xử lý authentication (giữ nguyên logic cũ)

## Phân chia trách nhiệm

### Authentication & Login
- **Xử lý bởi**: Frontend JavaScript (logic cũ)
- **Kết nối**: pmlogin-back server (remote)
- **Files**: 
  - `src/main/services/api_client.js`
  - `src/main/main.js` (handleLogin, checkAutoLogin)

### Profiles, Proxies, Database Local
- **Xử lý bởi**: Backend Python
- **Kết nối**: Local FastAPI server (http://127.0.0.1:8000)
- **Files**:
  - `backend/main.py` (FastAPI server)
  - `src/main/services/python_local_api_client.js` (client)

## Cấu trúc thư mục

```
pmlogin-app_v2/
├── src/                          # Frontend (Electron/JS)
│   ├── main/                     # Main process
│   │   ├── services/
│   │   │   ├── api_client.js     # Remote API (login)
│   │   │   └── python_local_api_client.js  # Local Python API
│   │   ├── main.js               # App controller
│   │   └── ipc_handlers.js       # IPC communication
│   └── renderer/                 # Renderer process (UI)
│
├── backend/                      # Backend (Python/FastAPI)
│   ├── main.py                   # FastAPI server
│   ├── requirements.txt          # Python dependencies
│   └── start_backend.bat         # Start script
│
└── storage/                      # Local data storage
```

## API Endpoints (Python Backend)

### Health Check
- `GET /` - Kiểm tra trạng thái server

### Statistics
- `GET /stats` - Lấy thống kê tổng quan

### Profiles
- `GET /profiles` - Lấy danh sách profiles
- `POST /profiles` - Tạo profile mới
- `PUT /profiles/{id}` - Cập nhật profile
- `DELETE /profiles/{id}` - Xóa profile

### Proxies
- `GET /proxies` - Lấy danh sách proxies
- `POST /proxies` - Tạo proxy mới
- `PUT /proxies/{id}` - Cập nhật proxy
- `DELETE /proxies/{id}` - Xóa proxy

### Tags
- `GET /tags` - Lấy danh sách tags

## Database Schema (SQLite)

### profiles
```sql
CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    proxy_host TEXT,
    proxy_port INTEGER,
    proxy_username TEXT,
    proxy_password TEXT,
    user_agent TEXT,
    browser_type TEXT DEFAULT 'chrome',
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### proxies
```sql
CREATE TABLE proxies (
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
);
```

### tags
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Cách chạy ứng dụng

### 1. Khởi động Backend Python
```bash
cd backend
python main.py
# hoặc chạy file start_backend.bat
```

### 2. Khởi động Frontend Electron
```bash
npm start
# hoặc chạy file start.bat
```

## IPC Communication

Frontend và Python backend giao tiếp thông qua IPC handlers:

### Python Local API Handlers
- `python-local:check-connection`
- `python-local:get-stats`
- `python-local:get-profiles`
- `python-local:create-profile`
- `python-local:update-profile`
- `python-local:delete-profile`
- `python-local:get-proxies`
- `python-local:create-proxy`
- `python-local:update-proxy`
- `python-local:delete-proxy`
- `python-local:get-tags`

## Lợi ích của kiến trúc này

1. **Tách biệt rõ ràng**: Frontend xử lý UI, Backend xử lý logic
2. **Hiệu suất tốt**: Python xử lý database nhanh hơn
3. **Dễ bảo trì**: Code được tổ chức rõ ràng
4. **Mở rộng dễ dàng**: Có thể thêm tính năng mới một cách độc lập
5. **Tương thích**: Giữ nguyên logic login cũ, không ảnh hưởng đến user experience