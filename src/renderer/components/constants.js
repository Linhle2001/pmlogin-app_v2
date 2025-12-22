// Constants.js - Chứa các hằng số dùng chung cho ứng dụng Electron
// Chuyển đổi từ PyQt6 constants.py

// ======================================================================
// --- ĐƯỜNG DẪN TỆP (FILE PATHS) ---
// ======================================================================
export const LOGO_PATH = "../../assets/logo_full.png";
export const LOGO_ON_PATH = "../../assets/logo_on.png";

// ======================================================================
// --- MÀU SẮC DÙNG CHUNG (THEME COLORS) ---
// ======================================================================

// Màu sắc chính (Primary/Accent) - Green Theme
export const COLOR_PRIMARY_GREEN = "#1ec460";
export const COLOR_PRIMARY_DARK = "#14532d";
export const COLOR_PRIMARY_LIGHT = "#bbf7d0";
export const COLOR_PRIMARY_EXTRA_LIGHT = "#ecfdf5";
export const COLOR_FORM_LOGIN_BG = "#ffffff";
export const COLOR_BORDER = "#000000";

// Màu sắc Nền (Backgrounds)
export const COLOR_UPGRADE_BTN_BG = "#ffffff";
export const COLOR_BG_LIGHT = "#f7fdf7";
export const COLOR_BG_WHITE = "white";
export const COLOR_BG_SIDEBAR = "#f0f0f0";
export const COLOR_BG_ERROR = "#ec1212";

// Màu sắc Active & Hover
export const COLOR_HOVER_BG = "#dcfce7";
export const COLOR_BUTTON_DISABLED = "#e0e0e0";

// Màu sắc Chữ (Text)
export const COLOR_TEXT_DARK = "#111827";
export const COLOR_TEXT_GRAY = "#334155";
export const COLOR_TEXT_SUBTLE = "#6b7280";
export const COLOR_CHECKBOX_BORDER = "#878a87";

// Màu sắc trạng thái (Status Colors)
export const COLOR_ERROR_RED = "#ef4444";
export const COLOR_SUCCESS_GREEN = "#10b981";
export const COLOR_WARNING_BROWN = "#a16207";

// Màu sắc Avatar
export const COLOR_AVATAR_FG = "#ffffff";

// ======================================================================
// --- KÍCH THƯỚC DÙNG CHUNG (SIZES) ---
// ======================================================================

export const SIZE_SIDEBAR_WIDTH = 220;
export const SIZE_TOP_BAR_HEIGHT = 60;
export const SIZE_BUTTON_HEIGHT = 42;
export const SIZE_AVATAR = 38;
export const SIZE_BORDER_RADIUS_WIDGET = 12;
export const SIZE_BORDER_RADIUS_BUTTON = 6;
export const SIZE_BORDER_RADIUS_INPUT = 8;
export const SIZE_SHADOW_PADDING = 8;

// Kích thước Popup (User Menu)
export const SIZE_POPUP_WIDTH = 200;
export const SIZE_POPUP_HEIGHT = 70;

// ======================================================================
// --- CSS CLASSES ---
// ======================================================================

export const CSS_CLASSES = {
    // Button classes
    BTN_PRIMARY: 'btn-primary',
    BTN_SECONDARY: 'btn-secondary',
    BTN_OUTLINE: 'btn-outline',
    BTN_TRANSPARENT: 'btn-transparent',
    BTN_ICON: 'btn-icon',
    BTN_DELETE: 'btn-delete',
    BTN_SMALL: 'btn-small',
    BTN_LARGE: 'btn-large',
    
    // Layout classes
    SIDEBAR: 'sidebar',
    CONTENT_AREA: 'content-area',
    HEADER: 'header',
    
    // Component classes
    CARD: 'card',
    MODAL: 'modal',
    NOTIFICATION: 'notification',
    
    // State classes
    ACTIVE: 'active',
    HOVER: 'hover',
    DISABLED: 'disabled',
    LOADING: 'loading'
};

// ======================================================================
// --- ANIMATION DURATIONS ---
// ======================================================================

export const ANIMATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    FADE_DURATION: 250,
    SLIDE_DURATION: 350
};

// ======================================================================
// --- BREAKPOINTS ---
// ======================================================================

export const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536
};

// ======================================================================
// --- Z-INDEX LAYERS ---
// ======================================================================

export const Z_INDEX = {
    BASE: 1,
    DROPDOWN: 10,
    STICKY: 20,
    FIXED: 30,
    MODAL_BACKDROP: 40,
    MODAL: 50,
    POPOVER: 60,
    TOOLTIP: 70,
    NOTIFICATION: 80,
    MAX: 9999
};