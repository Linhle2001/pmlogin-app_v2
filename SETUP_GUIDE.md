# PM Login Setup Guide

## Quick Start (Recommended)

### Option 1: Use the Batch Script (Windows)
```bash
# Run this from the root directory
start_full_app.bat
```

This will automatically:
1. Start the Python backend on port 8000
2. Wait 3 seconds
3. Start the Electron frontend

### Option 2: Manual Setup

#### Step 1: Start the Backend
```bash
cd pmlogin-back
pip install -r requirements.txt
python start.py
```

The backend will start on `http://localhost:8000`

#### Step 2: Start the Frontend
```bash
cd pmlogin-app_v2
npm install  # if not already installed
npm start
```

## Testing the Setup

### Test the Backend
```bash
cd pmlogin-back
python test_backend.py
```

### Test the Frontend
1. Open the Electron app
2. Try logging in with:
   - Email: `demo@pmlogin.com`
   - Password: `demo123`
   - Or register a new account

## Configuration

### Backend Configuration (pmlogin-back/.env)
```env
DATABASE_URL=sqlite:///./pmlogin.db
SECRET_KEY=your-secret-key-here
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

### Frontend Configuration (pmlogin-app_v2/.env)
```env
BASE_URL=http://localhost:8000
API_PLANS_URL=http://localhost:8000/api/info/plans
API_SYSTEM_URL=http://localhost:8000/api/info/system
```

## API Endpoints

The backend provides these main endpoints:

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `POST /refresh` - Token refresh
- `POST /change-password` - Change password

### Proxy Management
- `POST /api/proxy/get-all` - Get all proxies
- `POST /api/proxy/add` - Add proxy
- `POST /api/proxy/test` - Test proxy
- `POST /api/proxy/import` - Import proxies

### Profile Management
- `POST /api/profile/get-all` - Get all profiles
- `POST /api/create-profile` - Create profile
- `POST /api/update-profile` - Update profile

### System
- `GET /health` - Health check
- `GET /api/info/plans` - Get subscription plans
- `GET /api/info/system` - Get system info

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Change PORT in pmlogin-back/.env
PORT=8001
```

**Database errors:**
```bash
# Delete the database file and restart
cd pmlogin-back
rm pmlogin.db
python start.py
```

**Module not found:**
```bash
cd pmlogin-back
pip install -r requirements.txt
```

### Frontend Issues

**Connection refused:**
- Make sure the backend is running on port 8000
- Check that BASE_URL in .env points to http://localhost:8000

**Login fails:**
- Register a new user first
- Or use demo credentials: demo@pmlogin.com / demo123

**Electron won't start:**
```bash
cd pmlogin-app_v2
npm install
npm start
```

## Features Available

### ✅ Working Features
- User authentication (register/login)
- Proxy management (add/edit/delete/test)
- Profile management (create/edit/delete)
- Database operations
- Import/export functionality
- System information
- Health monitoring

### 🔄 In Development
- Advanced proxy testing
- Bulk operations
- Statistics dashboard
- Cloud synchronization

## Development

### Backend Development
```bash
cd pmlogin-back
# Install in development mode
pip install -e .
# Run with auto-reload
python start.py
```

### Frontend Development
```bash
cd pmlogin-app_v2
# Run in development mode
npm run dev
```

## Production Deployment

### Backend
```bash
# Set production environment
DEBUG=False
SECRET_KEY=your-production-secret-key

# Run with gunicorn
pip install gunicorn
gunicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
# Build the Electron app
npm run build
```

## Support

If you encounter issues:

1. Check the console logs in both backend and frontend
2. Verify the configuration files
3. Test the backend endpoints directly using the API docs
4. Make sure all dependencies are installed

The setup should work out of the box with the provided configuration!