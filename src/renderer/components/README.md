# Profiles Structure - Electron Implementation

Đây là phiên bản JavaScript (Electron) được chuyển đổi từ Python (PyQt6) của hệ thống quản lý profiles trong pmlogin-app, **sử dụng hệ thống theme tập trung để đảm bảo tính nhất quán và dễ bảo trì**.

## Cấu trúc Files

```
src/renderer/
├── assets/
│   ├── theme.js                # 🎨 Theme definitions và utilities
│   ├── components.css          # 🧩 Base component styles với theme variables
│   ├── profiles_structure.css  # 📋 Profiles-specific styles
│   ├── profiles_view.css       # 🖼️ ProfilesView styles
│   └── THEME_SYSTEM.md        # 📚 Theme system documentation
├── components/
│   ├── profiles_structure.js   # 🏗️ Core ProfilesStructure class
│   └── README.md              # 📖 Tài liệu này
├── utils/
│   └── theme-manager.js        # 🎛️ Theme management utilities
├── views/
│   └── profiles/
│       ├── profiles_view.js    # 🖥️ Main ProfilesView class
│       └── profiles_demo.html  # 🧪 Demo page
└── views/main/
    ├── index.html              # 🏠 Main window (đã tích hợp)
    └── renderer.js             # ⚡ Main renderer (đã tích hợp)
```

## 🎨 Hệ thống Theme Tập trung

### Ưu điểm:
- **Nhất quán**: Tất cả components sử dụng cùng một bộ màu sắc và styles
- **Dễ bảo trì**: Thay đổi theme ở một nơi, áp dụng toàn bộ app
- **Scalable**: Dễ dàng thêm themes mới (dark mode, custom themes)
- **Developer-friendly**: CSS variables và utility classes

### Theme Variables:
```css
/* Primary Colors */
--pmlogin-primary: #22c55e
--pmlogin-primary-dark: #16a34a
--pmlogin-primary-light: #4ade80

/* Status Colors */
--pmlogin-success: #22c55e
--pmlogin-error: #ef4444
--pmlogin-warning: #f59e0b
--pmlogin-info: #3b82f6

/* Component Colors */
--pmlogin-button-primary-bg: #22c55e
--pmlogin-input-border-focus: #22c55e
--pmlogin-text-primary: #111827
```

### Component Classes:
```css
.pmlogin-btn                    /* Base button */
.pmlogin-btn-primary           /* Primary button */
.pmlogin-input                 /* Base input */
.pmlogin-card                  /* Base card */
.pmlogin-table                 /* Base table */
.pmlogin-badge                 /* Base badge */
.pmlogin-modal                 /* Base modal */
.pmlogin-toast                 /* Base toast */
```

## Các Class Chính

### 1. ProfilesStructure
Class core chứa tất cả logic xử lý profiles:
- Tạo taskbar với các nút chức năng
- Tạo bảng hiển thị profiles
- Xử lý các action (start, stop, clone, delete, etc.)
- Quản lý context menu
- Hiển thị dialog (clone, update proxy)

### 2. ProfilesView
Class wrapper tích hợp ProfilesStructure vào main application:
- Quản lý tabs (Cloud, Local, Group, Team)
- Load dữ liệu profiles
- Tích hợp với main window

## Tính năng đã chuyển đổi

### ✅ Đã hoàn thành:
- **Taskbar**: Thanh công cụ với các nút chức năng
- **Table**: Bảng hiển thị profiles với đầy đủ columns
- **Context Menu**: Menu chuột phải cho row và taskbar
- **Clone Dialog**: Dialog nhập số lượng clone
- **Update Proxy Dialog**: Dialog cập nhật proxy
- **Search**: Tìm kiếm profiles
- **Selection**: Chọn multiple profiles
- **Toast Notifications**: Thông báo
- **Responsive Design**: Tương thích mobile

### 🔄 Cần implement:
- Kết nối với database/API thực tế
- Logic xử lý proxy checking
- Export profiles to Excel
- Profile editing integration
- Real-time updates

## Cách sử dụng

### 1. Sử dụng với Theme System (Recommended):
```javascript
import themeManager from '../utils/theme-manager.js';

// Tạo button với theme
const button = themeManager.createButton('Save Profile', 'primary', {
    size: 'md',
    onClick: () => console.log('Saved!')
});

// Hiển thị toast
themeManager.showToast('Profile saved successfully!', 'success');

// Tạo modal
const modal = themeManager.createModal({
    title: 'Confirm Delete',
    body: 'Are you sure you want to delete this profile?'
});
```

### 2. Sử dụng ProfilesStructure trực tiếp:
```javascript
const profilesStructure = new ProfilesStructure();

// Tạo taskbar với theme support
const taskbar = profilesStructure.createTaskbar('local');
container.appendChild(taskbar);

// Tạo table với theme support
const table = profilesStructure.createProfilesTable('local');
container.appendChild(table);

// Populate data
profilesStructure.populateTable(profilesData, table);

// Sử dụng themed components
const button = profilesStructure.createThemedButton('Action', 'primary');
profilesStructure.showToast('Success!', 'success');
```

### 3. Sử dụng ProfilesView (recommended):
```javascript
const container = document.getElementById('profilesContainer');
const profilesView = new ProfilesView(container);

// ProfilesView tự động sử dụng theme system
```

### 4. Sử dụng CSS Classes trực tiếp:
```html
<!-- Buttons -->
<button class="pmlogin-btn pmlogin-btn-primary pmlogin-btn-md">Primary</button>
<button class="pmlogin-btn pmlogin-btn-secondary pmlogin-btn-sm">Secondary</button>

<!-- Cards -->
<div class="pmlogin-card">
    <div class="pmlogin-card-header">
        <h3>Profile Settings</h3>
    </div>
    <div class="pmlogin-card-body">
        Content here
    </div>
</div>

<!-- Inputs -->
<input type="text" class="pmlogin-input pmlogin-input-md" placeholder="Profile name">

<!-- Badges -->
<span class="pmlogin-badge pmlogin-badge-success">Active</span>
<span class="pmlogin-badge pmlogin-badge-error">Error</span>
```

### 3. Xem demo:
Mở file `src/renderer/views/profiles/profiles_demo.html` trong browser để xem demo.

## Context Types

Hệ thống hỗ trợ 2 context chính:

### Local Context
- Hiển thị tất cả profiles
- Có các nút: Assign to group, Share profiles, Share on cloud
- Menu taskbar: Copy proxy, Copy IDs, Export, Delete

### Group Context  
- Hiển thị profiles theo group
- Không có nút Share on cloud
- Delete sẽ chỉ remove khỏi group, không xóa hoàn toàn

## Customization

### Thay đổi theme colors:
```javascript
import themeManager from '../utils/theme-manager.js';

// Cập nhật màu sắc theme
themeManager.updateCSSProperties({
    '--pmlogin-primary': '#3b82f6',        // Đổi sang màu xanh dương
    '--pmlogin-primary-dark': '#2563eb'
});
```

### Tạo custom component:
```css
/* Sử dụng theme variables */
.my-custom-component {
    background-color: var(--pmlogin-primary);
    color: var(--pmlogin-text-on-primary);
    border: 1px solid var(--pmlogin-border-primary);
    border-radius: 6px;
    padding: 8px 16px;
}

/* Extend existing classes */
.my-custom-button {
    @extend .pmlogin-btn;
    @extend .pmlogin-btn-primary;
    /* Custom styles here */
}
```

### Thêm action mới:
1. Thêm button vào `createTaskbar()` hoặc `createContextMenu()`
2. Thêm handler trong `handleTaskbarAction()` hoặc `handleContextMenuAction()`
3. Implement logic trong method mới sử dụng theme system

### Thay đổi columns:
Chỉnh sửa `createProfilesTable()` và `createProfileRow()` methods, sử dụng theme classes.

## Integration với Main App

ProfilesView đã được tích hợp vào main window:
1. Import scripts trong `index.html`
2. Initialize trong `renderer.js`
3. Handle view switching
4. Auto refresh khi switch tab

## API Integration

Để kết nối với backend, thay thế mock data trong:
- `ProfilesView.loadProfilesData()`
- Các action methods trong `ProfilesStructure`

Example:
```javascript
async loadProfilesData() {
    try {
        const profiles = await window.electronAPI.getProfiles();
        this.profilesData = profiles;
    } catch (error) {
        console.error('Failed to load profiles:', error);
        this.profilesData = [];
    }
}
```

## Browser Compatibility

- Chrome/Chromium: ✅ Full support
- Firefox: ✅ Full support  
- Safari: ✅ Full support
- Edge: ✅ Full support

## Performance Notes

- Table sử dụng virtual scrolling cho large datasets
- Batch loading cho nhiều profiles
- Debounced search
- Lazy loading cho context menus

## Troubleshooting

### ProfilesView không hiển thị:
1. Kiểm tra console errors
2. Đảm bảo CSS files được load
3. Kiểm tra container element tồn tại

### Context menu không hoạt động:
1. Kiểm tra z-index conflicts
2. Đảm bảo event listeners được attach
3. Kiểm tra click outside logic

### Styles bị lỗi:
1. Kiểm tra CSS import order
2. Xem conflicts với Tailwind CSS
3. Kiểm tra responsive breakpoints