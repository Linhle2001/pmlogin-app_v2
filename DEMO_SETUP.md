# Demo Setup Guide - PM Login

## 🚀 Quick Setup

### Step 1: Setup Demo Environment
```bash
cd pmlogin-back
python setup_demo.py
```

This will:
- Initialize the SQLite database
- Create test user: `lelinh21102001@gmail.com` (password: `lelinh21102001@gmail.com`)
- Create additional demo users with password `demo123`

### Step 2: Start Backend
```bash
cd pmlogin-back
python start.py
```

Backend will start on `http://localhost:8000`

### Step 3: Start Frontend
```bash
cd pmlogin-app_v2
npm start
```

## 🔐 Login Options

### Option 1: Demo Login (Local Database)
- **Endpoint**: `POST /login-demo`
- **Credentials**:
  - Email: `lelinh21102001@gmail.com`
  - Password: `lelinh21102001@gmail.com`
  
- **Alternative Demo Users**:
  - Email: `demo@pmlogin.com`, Password: `demo123`
  - Email: `test@example.com`, Password: `demo123`
  - Email: `admin@pmlogin.com`, Password: `demo123`

### Option 2: Original Server Login
- **Endpoint**: `POST /login`
- **Server**: `https://dev.pmbackend.site/login`
- **Credentials**: Your existing account from the original server

## 🔧 How It Works

### Demo Mode (Offline)
```
Frontend → Python Backend → Local SQLite Database
    ↓           ↓                    ↓
  Login     Verify Local         Return User
  Request   Credentials          Data + JWT Token
```

### Production Mode (Online)
```
Frontend → Python Backend → dev.pmbackend.site
    ↓           ↓                    ↓
  Login     Forward              Validate
  Request   Credentials          Credentials
    ↓           ↓                    ↓
  Receive   Create Local         Return User
  Token     JWT Token            Data + Token
```

## 📋 Available Endpoints

### Authentication
- `POST /login` - Login with original server
- `POST /login-demo` - Login with local database
- `POST /register` - Register with original server
- `POST /refresh` - Refresh JWT token
- `POST /change-password` - Change password

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🧪 Testing

### Test Backend Only
```bash
cd pmlogin-back
python test_backend.py
```

### Test Original Server Connection
```bash
cd pmlogin-back
python test_original_server.py
```

### Test Demo Login via API
```bash
curl -X POST "http://localhost:8000/login-demo" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lelinh21102001@gmail.com",
    "password": "lelinh21102001@gmail.com",
    "hwid": "test-hwid-123"
  }'
```

## 🔄 Frontend Integration

Your frontend can automatically choose the right login method:

```javascript
// Try original server first, fallback to demo
async function smartLogin(email, password, hwid) {
    try {
        // Try original server
        const result = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, hwid })
        });
        
        if (result.ok) {
            return await result.json();
        }
    } catch (error) {
        console.log('Original server unavailable, trying demo...');
    }
    
    // Fallback to demo login
    const demoResult = await fetch('/login-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, hwid })
    });
    
    return await demoResult.json();
}
```

## 📊 Database

The local SQLite database (`pmlogin.db`) contains:
- **users** - User accounts (local and synced from original server)
- **proxies** - Proxy configurations (stored locally)
- **profiles** - Browser profiles (stored locally)
- **tags** - Tags for organization
- **groups** - Profile groups

## 🛠️ Development

### Add More Demo Users
```python
# In setup_demo.py, add to demo_users list:
demo_users = [
    "demo@pmlogin.com",
    "test@example.com", 
    "admin@pmlogin.com",
    "your-email@example.com"  # Add your email here
]
```

### Reset Demo Environment
```bash
cd pmlogin-back
rm pmlogin.db  # Delete database
python setup_demo.py  # Recreate with fresh data
```

## 🚨 Troubleshooting

### "User not found in local database"
- Run `python setup_demo.py` to create test users
- Or register a new user via the original server

### "Connection refused"
- Make sure backend is running on port 8000
- Check that frontend .env points to `http://localhost:8000`

### "Invalid password"
- For demo users, password is same as email or `demo123`
- For original server users, use your actual password

### Database locked
```bash
cd pmlogin-back
rm pmlogin.db
python setup_demo.py
```

## ✅ Success Indicators

When everything is working:
1. ✅ Backend starts without errors
2. ✅ Database is created with test users
3. ✅ Frontend connects to backend
4. ✅ Login works with demo credentials
5. ✅ Proxy/profile management works
6. ✅ API documentation is accessible

You now have a fully functional PM Login system with both online and offline capabilities!