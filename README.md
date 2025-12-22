# PMLogin Electron - Proxy Manager & Automation Platform

Phiên bản Electron.js của PMLogin, được chuyển đổi từ PyQt6 sang công nghệ web hiện đại.

## 🎯 Demo Mode

Để test giao diện mà không cần server thật:

**Thông tin đăng nhập demo:**
- Email: `demo@pmlogin.com`
- Password: `bất kỳ mật khẩu nào`

## 🚀 Tính năng chính

- ✅ **Xác thực người dùng**: Đăng nhập với Hardware ID
- ✅ **Quản lý Proxy**: Thêm, sửa, xóa, test proxy
- ✅ **Session Management**: Ghi nhớ đăng nhập
- ✅ **Auto-update**: Tự động kiểm tra và cập nhật phiên bản mới
- ✅ **Cross-platform**: Hỗ trợ Windows, macOS, Linux
- ✅ **Modern UI**: Giao diện đẹp với Tailwind CSS
- ✅ **Demo Mode**: Test giao diện offline

## 📋 Yêu cầu hệ thống

- Node.js >= 16.x
- npm >= 8.x
- Hệ điều hành: Windows 10+, macOS 10.13+, hoặc Linux

## 🔧 Cài đặt và chạy

### Cách 1: Sử dụng script (Windows)

```bash
# Double-click file start.bat
start.bat
```

### Cách 2: Manual

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy ứng dụng
npm start
```

## 🎮 Hướng dẫn sử dụng

### 1. Đăng nhập Demo
- Mở ứng dụng
- Sử dụng email: `demo@pmlogin.com`
- Nhập bất kỳ mật khẩu nào
- Click "Đăng nhập"

### 2. Đăng nhập thật
- Sử dụng email/password thật của bạn
- Ứng dụng sẽ kết nối với server: `https://pmbackend.site`

### 3. Quản lý Proxy
- Vào tab "Quản lý Proxy"
- Click "Thêm Proxy" để thêm proxy mới
- Test proxy bằng nút "Test"
- Xóa proxy bằng nút "Xóa"

## 📁 Cấu trúc dự án

```
Electronjs_stu/
├── src/
│   ├── main/                    # Main process (Node.js)
│   │   ├── main.js             # Entry point
│   │   ├── preload.js          # Preload script
│   │   ├── ipc_handlers.js     # IPC handlers
│   │   └── services/           # Backend services
│   │       ├── api_client.js   # API client
│   │       ├── hwid_utils.js   # Hardware ID utilities
│   │       └── proxy_mgr.js    # Proxy manager
│   ├── renderer/               # Renderer process (Web)
│   │   └── views/
│   │       ├── login/          # Login page
│   │       │   ├── index.html
│   │       │   └── login_renderer.js
│   │       └── main/           # Main dashboard
│   │           ├── index.html
│   │           └── renderer.js
│   └── assets/                 # Static assets (logo, etc.)
├── storage/                    # Local storage
├── .env                        # Environment variables
├── package.json               # Dependencies
├── version.json               # Version info
├── start.bat                  # Windows start script
└── README.md                  # This file
```

## 🔐 Bảo mật

- Hardware ID được tạo dựa trên thông tin phần cứng máy tính
- Session được lưu trữ an toàn trong userData folder
- API requests sử dụng HTTPS và Bearer token authentication
- Circuit breaker pattern để tránh DDoS
- Input validation và sanitization

## 🌐 API Endpoints

Ứng dụng kết nối với các API sau:

- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/change-password` - Đổi mật khẩu
- `GET /api/user` - Lấy thông tin user
- `GET /api/info/system` - Kiểm tra phiên bản

## 🐛 Debug

Để bật chế độ debug, sửa file `.env`:

```env
DEBUG=true
```

Sau đó chạy lại ứng dụng. DevTools sẽ tự động mở.

## 🎨 Giao diện

### Login Page
- Thiết kế giống với phiên bản PyQt6 gốc
- Logo PMLogin
- Form đăng nhập với validation
- Demo mode notice
- System info (Version, HWID)

### Dashboard
- Sidebar navigation
- Stats cards
- Proxy management table
- Settings panel
- Modern responsive design

## 📝 Changelog

### Version 1.0.0 (2024-12-21)

- ✅ Chuyển đổi hoàn toàn từ PyQt6 sang Electron.js
- ✅ Giao diện mới với Tailwind CSS giống thiết kế gốc
- ✅ Quản lý proxy đầy đủ
- ✅ Xác thực Hardware ID
- ✅ Auto-update system
- ✅ Session management
- ✅ Cross-platform support
- ✅ Demo mode cho testing
- ✅ Logo và branding giống gốc

## 🔧 Build Production

```bash
# Build cho Windows
npm run build:win

# Build cho macOS
npm run build:mac

# Build cho Linux
npm run build:linux

# Build cho tất cả platforms
npm run build
```

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo Pull Request hoặc Issue.

## 📄 License

Copyright © 2024 PMLogin Team. All rights reserved.

## 📞 Liên hệ

- Website: https://pmbackend.site
- Email: support@pmlogin.com
- GitHub: https://github.com/pmlogin

## 🙏 Credits

- Chuyển đổi từ PyQt6 sang Electron.js
- UI Framework: Tailwind CSS
- Icons: Font Awesome
- Runtime: Electron.js & Node.js

---

**Lưu ý**: Đây là phiên bản Electron.js được chuyển đổi từ dự án PyQt6 gốc. Tất cả chức năng đã được giữ nguyên và cải thiện với công nghệ web hiện đại.

## 🚨 Troubleshooting

### Lỗi API 404
- Sử dụng demo mode với email `demo@pmlogin.com`
- Hoặc kiểm tra kết nối internet và thử lại

### Ứng dụng không khởi động
- Kiểm tra Node.js đã cài đặt: `node --version`
- Cài đặt lại dependencies: `npm install`
- Chạy lại: `npm start`

### Hardware ID không tạo được
- Ứng dụng sẽ tự động fallback sang ID ngẫu nhiên
- Không ảnh hưởng đến demo mode