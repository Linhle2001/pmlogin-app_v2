# PMLogin Theme System

Hệ thống theme tập trung cho ứng dụng PMLogin, đảm bảo tính nhất quán về màu sắc, typography và components trên toàn bộ ứng dụng.

## Cấu trúc Files

```
src/renderer/assets/
├── theme.js              # Theme definitions và utilities
├── components.css        # Base component styles sử dụng theme variables
├── profiles_structure.css # Profiles-specific styles
├── profiles_view.css     # ProfilesView styles
└── THEME_SYSTEM.md      # Tài liệu này
```

```
src/renderer/utils/
└── theme-manager.js      # Theme management utilities
```

## Theme Variables

### Primary Colors
```css
--pmlogin-primary: #22c55e           /* Main green */
--pmlogin-primary-dark: #16a34a      /* Darker green for hover */
--pmlogin-primary-light: #4ade80     /* Lighter green for accents */
```

### Status Colors
```css
--pmlogin-success: #22c55e           /* Success green */
--pmlogin-error: #ef4444             /* Error red */
--pmlogin-warning: #f59e0b           /* Warning amber */
--pmlogin-info: #3b82f6              /* Info blue */
```

### Neutral Colors
```css
--pmlogin-gray-50: #f9fafb           /* Lightest gray */
--pmlogin-gray-100: #f3f4f6          /* Very light gray */
--pmlogin-gray-200: #e5e7eb          /* Light gray */
--pmlogin-gray-300: #d1d5db          /* Medium light gray */
--pmlogin-gray-400: #9ca3af          /* Medium gray */
--pmlogin-gray-500: #6b7280          /* Medium dark gray */
--pmlogin-gray-600: #4b5563          /* Dark gray */
--pmlogin-gray-700: #374151          /* Very dark gray */
--pmlogin-gray-800: #1f2937          /* Almost black */
--pmlogin-gray-900: #111827          /* Darkest gray */
```

### Background Colors
```css
--pmlogin-bg-primary: #ffffff        /* Main background */
--pmlogin-bg-secondary: #f9fafb      /* Secondary background */
--pmlogin-bg-card: #ffffff           /* Card background */
--pmlogin-bg-overlay: rgba(0, 0, 0, 0.5) /* Modal overlay */
```

### Text Colors
```css
--pmlogin-text-primary: #111827      /* Primary text */
--pmlogin-text-secondary: #6b7280    /* Secondary text */
--pmlogin-text-muted: #9ca3af        /* Muted text */
--pmlogin-text-white: #ffffff        /* White text */
--pmlogin-text-on-primary: #ffffff   /* Text on primary color */
```

## Component Classes

### Buttons
```css
.pmlogin-btn                         /* Base button */
.pmlogin-btn-primary                 /* Primary button */
.pmlogin-btn-secondary               /* Secondary button */
.pmlogin-btn-danger                  /* Danger button */
.pmlogin-btn-outline                 /* Outline button */
.pmlogin-btn-ghost                   /* Ghost button */

/* Sizes */
.pmlogin-btn-sm                      /* Small button */
.pmlogin-btn-md                      /* Medium button (default) */
.pmlogin-btn-lg                      /* Large button */
.pmlogin-btn-icon                    /* Icon button */
```

### Inputs
```css
.pmlogin-input                       /* Base input */
.pmlogin-input-sm                    /* Small input */
.pmlogin-input-md                    /* Medium input (default) */
.pmlogin-input-lg                    /* Large input */
```

### Cards
```css
.pmlogin-card                        /* Base card */
.pmlogin-card-header                 /* Card header */
.pmlogin-card-body                   /* Card body */
.pmlogin-card-footer                 /* Card footer */
```

### Tables
```css
.pmlogin-table                       /* Base table */
.pmlogin-table-container             /* Table container */
```

### Badges
```css
.pmlogin-badge                       /* Base badge */
.pmlogin-badge-success               /* Success badge */
.pmlogin-badge-error                 /* Error badge */
.pmlogin-badge-warning               /* Warning badge */
.pmlogin-badge-info                  /* Info badge */
.pmlogin-badge-gray                  /* Gray badge */
```

### Modals
```css
.pmlogin-modal-overlay               /* Modal overlay */
.pmlogin-modal                       /* Modal container */
.pmlogin-modal-header                /* Modal header */
.pmlogin-modal-title                 /* Modal title */
.pmlogin-modal-close                 /* Modal close button */
.pmlogin-modal-body                  /* Modal body */
.pmlogin-modal-footer                /* Modal footer */
```

### Toasts
```css
.pmlogin-toast                       /* Base toast */
.pmlogin-toast-success               /* Success toast */
.pmlogin-toast-error                 /* Error toast */
.pmlogin-toast-warning               /* Warning toast */
.pmlogin-toast-info                  /* Info toast */
```

## Cách sử dụng

### 1. Trong CSS
```css
/* Sử dụng CSS variables */
.my-component {
    background-color: var(--pmlogin-primary);
    color: var(--pmlogin-text-on-primary);
    border: 1px solid var(--pmlogin-border-primary);
}

/* Sử dụng component classes */
.my-button {
    @extend .pmlogin-btn;
    @extend .pmlogin-btn-primary;
}
```

### 2. Trong HTML
```html
<!-- Sử dụng component classes trực tiếp -->
<button class="pmlogin-btn pmlogin-btn-primary pmlogin-btn-md">
    Primary Button
</button>

<div class="pmlogin-card">
    <div class="pmlogin-card-header">
        <h3>Card Title</h3>
    </div>
    <div class="pmlogin-card-body">
        Card content here
    </div>
</div>
```

### 3. Trong JavaScript với ThemeManager
```javascript
import themeManager from '../utils/theme-manager.js';

// Tạo button với theme
const button = themeManager.createButton('Click me', 'primary', {
    size: 'md',
    onClick: () => console.log('Clicked!')
});

// Hiển thị toast
themeManager.showToast('Success message!', 'success');

// Tạo modal
const modal = themeManager.createModal({
    title: 'Confirm Action',
    body: 'Are you sure you want to continue?',
    footer: '<button class="pmlogin-btn pmlogin-btn-primary">Yes</button>'
});
document.body.appendChild(modal);

// Lấy theme color
const primaryColor = themeManager.getColor('PRIMARY');
```

### 4. Trong JavaScript thuần
```javascript
// Sử dụng ProfilesStructure với theme support
const profilesStructure = new ProfilesStructure();

// Tạo button với theme
const button = profilesStructure.createThemedButton('Save', 'primary', {
    size: 'md'
});

// Hiển thị toast
profilesStructure.showToast('Profile saved!', 'success');
```

## Best Practices

### 1. Luôn sử dụng theme variables
```css
/* ✅ Good */
.component {
    color: var(--pmlogin-text-primary);
    background-color: var(--pmlogin-bg-card);
}

/* ❌ Bad */
.component {
    color: #111827;
    background-color: #ffffff;
}
```

### 2. Sử dụng component classes khi có thể
```html
<!-- ✅ Good -->
<button class="pmlogin-btn pmlogin-btn-primary">Button</button>

<!-- ❌ Bad -->
<button style="background: #22c55e; color: white; padding: 8px 16px;">Button</button>
```

### 3. Extend component classes thay vì override
```css
/* ✅ Good */
.custom-button {
    @extend .pmlogin-btn;
    @extend .pmlogin-btn-primary;
    /* Custom styles here */
}

/* ❌ Bad */
.custom-button {
    background: #22c55e !important;
    color: white !important;
}
```

### 4. Sử dụng ThemeManager cho dynamic components
```javascript
// ✅ Good
const button = themeManager.createButton('Save', 'primary');

// ❌ Bad
const button = document.createElement('button');
button.style.backgroundColor = '#22c55e';
button.style.color = 'white';
```

## Customization

### Thay đổi theme colors
```javascript
// Cập nhật CSS variables
themeManager.updateCSSProperties({
    '--pmlogin-primary': '#3b82f6',        // Change to blue
    '--pmlogin-primary-dark': '#2563eb'
});
```

### Tạo custom component classes
```css
/* Tạo variant mới cho button */
.pmlogin-btn-custom {
    background-color: var(--pmlogin-info);
    color: var(--pmlogin-text-on-primary);
}

.pmlogin-btn-custom:hover {
    background-color: var(--pmlogin-info-dark);
}
```

### Extend theme object
```javascript
// Trong theme.js
export const customTheme = {
    ...theme,
    CUSTOM: {
        PRIMARY: '#8b5cf6',
        SECONDARY: '#ec4899'
    }
};
```

## Migration Guide

### Từ hardcoded colors sang theme system:

1. **Identify hardcoded colors**
```css
/* Before */
.component {
    background-color: #22c55e;
    color: #ffffff;
    border: 1px solid #e5e7eb;
}
```

2. **Replace với theme variables**
```css
/* After */
.component {
    background-color: var(--pmlogin-primary);
    color: var(--pmlogin-text-on-primary);
    border: 1px solid var(--pmlogin-border-light);
}
```

3. **Sử dụng component classes nếu có**
```css
/* Even better */
.component {
    @extend .pmlogin-btn;
    @extend .pmlogin-btn-primary;
}
```

## Troubleshooting

### Theme variables không hoạt động
1. Kiểm tra `components.css` đã được import
2. Đảm bảo `theme-manager.js` đã được load
3. Kiểm tra console errors

### Component classes không apply
1. Kiểm tra class name spelling
2. Đảm bảo CSS load order đúng
3. Kiểm tra CSS specificity conflicts

### ThemeManager không available
1. Kiểm tra import path
2. Đảm bảo module được load as ES6 module
3. Sử dụng fallback implementation trong ProfilesStructure

## Future Enhancements

- Dark mode support
- Multiple theme variants
- Dynamic theme switching
- Theme customization UI
- CSS-in-JS integration
- Component library expansion