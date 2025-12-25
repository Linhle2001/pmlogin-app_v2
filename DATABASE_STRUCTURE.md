# Cấu trúc Database - PMLogin System

## Tổng quan

Hệ thống PMLogin được thiết kế với kiến trúc client-server, trong đó:

- **Client (pmlogin-app_v2)**: Lưu tất cả thông tin profile, chỉ sync lên server khi được chọn
- **Server (pmlogin-back)**: Chỉ lưu thống kê số lượng profile và chi tiết profile được share

## 1. Client Database (pmlogin-app_v2)

### Bảng Users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    hwid TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

### Bảng Profiles (Lưu tất cả profile)
```sql
CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    platform TEXT,
    note TEXT,
    proxy TEXT,                          -- JSON string
    status TEXT DEFAULT 'Ready',
    shared_on_cloud INTEGER DEFAULT 0,   -- 0: chỉ local, 1: sync lên server
    server_sync_id TEXT,                 -- ID của profile trên server
    sync_version INTEGER DEFAULT 1,      -- Version để sync
    last_synced_at TIMESTAMP,           -- Lần sync cuối
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_started_at TIMESTAMP,
    owner_id INTEGER,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### Bảng Groups
```sql
CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng Tags
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng Proxies
```sql
CREATE TABLE proxies (
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
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### Bảng Many-to-Many
```sql
-- Profile <-> Group
CREATE TABLE profile_group (
    profile_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    PRIMARY KEY (profile_id, group_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Profile <-> Tag
CREATE TABLE profile_tag (
    profile_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (profile_id, tag_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Proxy <-> Tag
CREATE TABLE proxy_tags (
    proxy_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (proxy_id, tag_id),
    FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### Bảng Sessions & Settings
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 2. Server Database (pmlogin-back)

### Bảng Users (Giống client)
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    hwid = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
```

### Bảng Profile Stats (Chỉ lưu số lượng)
```python
class ProfileStats(Base):
    __tablename__ = "profile_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_profiles = Column(Integer, default=0)      # Tổng số profile trên client
    shared_profiles = Column(Integer, default=0)     # Số profile được share
    last_sync_at = Column(DateTime, nullable=True)   # Lần sync cuối
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Bảng Shared Profiles (Chỉ profile được share)
```python
class SharedProfile(Base):
    __tablename__ = "shared_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    client_profile_id = Column(String, nullable=False)  # ID trên client
    name = Column(String, nullable=False)
    platform = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    proxy_info = Column(Text, nullable=True)            # JSON string
    status = Column(String, default="Ready")
    sync_version = Column(Integer, default=1)           # Version để sync
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_started_at = Column(DateTime, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
```

### Bảng Groups & Tags (Chỉ cho shared profiles)
```python
class Group(Base):
    __tablename__ = "groups"
    
    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Bảng Proxies (Giống client)
```python
class Proxy(Base):
    __tablename__ = "proxies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    host = Column(String, nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String, default="")
    password = Column(String, default="")
    type = Column(String, default="http")
    status = Column(String, default="pending")
    response_time = Column(Float, nullable=True)
    public_ip = Column(String, nullable=True)
    location = Column(String, nullable=True)
    fail_count = Column(Integer, default=0)
    last_tested = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
```

## 3. Sync Logic

### Client → Server
1. **Profile Count Sync**: Client gửi tổng số profile và số profile được share
2. **Shared Profile Sync**: Client gửi chi tiết profile khi `shared_on_cloud = 1`
3. **Remove Sync**: Client thông báo server xóa profile khi `shared_on_cloud = 0`

### API Endpoints
```
POST /api/profiles/sync-stats          # Sync số lượng profile
POST /api/profiles/sync-shared         # Sync nhiều shared profiles
POST /api/profiles/sync-single         # Sync một profile
DELETE /api/profiles/shared/{id}       # Xóa shared profile
GET /api/profiles/shared               # Lấy tất cả shared profiles
GET /api/profiles/sync-summary         # Tóm tắt sync
```

## 4. Workflow

### Tạo Profile Mới
1. Client tạo profile trong bảng `profiles`
2. Client sync profile count lên server
3. Nếu user chọn share → Client sync chi tiết profile lên server

### Cập nhật Profile
1. Client cập nhật profile local
2. Nếu profile được share → Client sync cập nhật lên server

### Xóa Profile
1. Nếu profile được share → Client xóa khỏi server trước
2. Client xóa profile local
3. Client sync profile count lên server

### Share/Unshare Profile
1. **Share**: Client set `shared_on_cloud = 1` → sync chi tiết lên server
2. **Unshare**: Client set `shared_on_cloud = 0` → xóa khỏi server

## 5. Lợi ích

- **Hiệu suất**: Server không lưu trữ quá nhiều dữ liệu không cần thiết
- **Bảo mật**: Chỉ profile được user chọn mới được sync lên server
- **Linh hoạt**: Client có thể hoạt động offline, sync khi cần
- **Scalability**: Server chỉ lưu dữ liệu quan trọng, giảm tải database