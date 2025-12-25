# Taskbar Actions - PMLogin App v2

## 📋 Tổng quan

File `taskbar_actions.js` chứa tất cả các chức năng xử lý taskbar được tách riêng từ file chính `profiles_structure.js` để dễ bảo trì và mở rộng.

## 🏗️ Cấu trúc

### Files được tạo/cập nhật:

1. **`src/renderer/components/taskbar_actions.js`** - File chính chứa class TaskbarActions
2. **`src/renderer/components/profiles_structure.js`** - Đã được cập nhật để sử dụng TaskbarActions
3. **`src/main/ipc_handlers.js`** - Đã thêm các IPC handlers mới
4. **`test_taskbar.html`** - File test để kiểm tra các chức năng

## 🚀 Các chức năng đã implement

### Primary Actions (Hàng 1 taskbar):
- ▶️ **Start** - Khởi động profiles đã chọn
- ⏹️ **Stop** - Dừng profiles đã chọn  
- 📁 **Assign to group** - Gán profiles vào group
- 🔗 **Share profiles** - Chia sẻ profiles
- 🔍 **Check proxy** - Kiểm tra proxy
- 🆕 **New fingerprint** - Tạo fingerprint mới

### Secondary Actions (Hàng 2 taskbar):
- 🚀 **Start with app** - Khởi động cùng app
- 🔄 **Update proxy** - Cập nhật proxy
- 📝 **Update profiles** - Cập nhật profiles
- ☁️ **Share on cloud** - Chia sẻ lên cloud
- 🗑️ **Stop share on cloud** - Dừng chia sẻ cloud

### Context Menu Actions:
- 📋 **Copy proxy** - Copy proxy đã chọn
- 🔢 **Copy IDs** - Copy ID profiles
- 📝 **Copy names** - Copy tên profiles  
- 📋 **Copy ID and names** - Copy ID và tên
- 📤 **Export** - Xuất profiles
- 🗑️ **Delete** - Xóa profiles

## 🔧 Cách sử dụng

### 1. Khởi tạo TaskbarActions:

```javascript
const taskbarActions = new TaskbarActions();
```

### 2. Set dữ liệu profiles đã chọn:

```javascript
taskbarActions.setSelectedProfiles([
    { id: '1', name: 'Profile 1', proxy: 'http://proxy1:8080' },
    { id: '2', name: 'Profile 2', proxy: 'socks5://proxy2:1080' }
]);
```

### 3. Set context (local/group):

```javascript
taskbarActions.setContext('local'); // hoặc 'group'
// Nếu là group context:
taskbarActions.setContext('group', 'Group Name');
```

### 4. Gọi các action:

```javascript
// Primary actions
await taskbarActions.startProfiles();
await taskbarActions.stopProfiles();
await taskbarActions.assignToGroup();
await taskbarActions.shareProfiles();
await taskbarActions.checkProxy();
await taskbarActions.newFingerprint();

// Secondary actions  
await taskbarActions.startWithApp();
await taskbarActions.updateProxy();
await taskbarActions.updateProfiles();
await taskbarActions.shareOnCloud();
await taskbarActions.stopShareOnCloud();

// Context menu actions
await taskbarActions.copySelectedProxies();
await taskbarActions.copySelectedIds();
await taskbarActions.copySelectedNames();
await taskbarActions.copySelectedIdAndNames();
await taskbarActions.exportSelectedProfiles();
await taskbarActions.deleteSelectedProfiles();
```

## 🧪 Testing

Mở file `test_taskbar.html` trong browser để test các chức năng:

1. Chọn một hoặc nhiều demo profiles
2. Click các button để test từng chức năng
3. Xem logs và status để kiểm tra kết quả

## 🔌 IPC Handlers

Các IPC handlers mới đã được thêm vào `src/main/ipc_handlers.js`:

- `profile:start-multiple` - Start nhiều profiles
- `profile:stop-multiple` - Stop nhiều profiles  
- `profile:share-multiple` - Share nhiều profiles
- `profile:generate-fingerprint` - Tạo fingerprint
- `profile:set-start-with-app` - Set start with app
- `profile:update-proxy` - Update proxy
- `profile:update-multiple` - Update nhiều profiles
- `profile:share-on-cloud` - Share lên cloud
- `profile:stop-share-on-cloud` - Stop share cloud
- `profile:export-multiple` - Export nhiều profiles
- `profile:delete-multiple` - Delete nhiều profiles
- `proxy:check-multiple` - Check proxy nhiều profiles
- `db:group:remove-profiles` - Remove profiles khỏi group

## 🎨 UI Features

### Toast Notifications:
- Hiển thị thông báo success/error/warning/info
- Auto-hide sau 4 giây
- Có thể đóng thủ công
- Animation slide in/out

### Dialogs:
- **Assign to Group Dialog** - Chọn group để assign
- **Update Proxy Dialog** - Cập nhật proxy với config chi tiết

### Context Menus:
- Hiển thị menu context với positioning thông minh
- Tự động đóng khi click outside
- Support cả taskbar và row context menus

## 🔄 Integration với ProfilesStructure

File `profiles_structure.js` đã được cập nhật để:

1. Import và khởi tạo TaskbarActions
2. Delegate các taskbar actions sang TaskbarActions
3. Giữ lại các UI-specific methods (showCloneDialog, editProfile, etc.)
4. Maintain backward compatibility

## 📝 Notes

- Tất cả các IPC calls hiện tại đang simulate success responses
- Cần implement logic thực tế trong backend
- TaskbarActions class hoàn toàn độc lập và có thể reuse
- Support cả local và group context
- Error handling đầy đủ với try-catch và user feedback

## 🚧 TODO

1. Implement actual backend logic cho các IPC handlers
2. Add more sophisticated error handling
3. Add progress indicators cho long-running operations
4. Add batch operation optimizations
5. Add undo/redo functionality
6. Add keyboard shortcuts support