// Button Styles - Chuyển đổi từ PyQt6 button_style.py
import * as theme from './constants.js';

// ======================================================================
// --- BUTTON STYLE DEFINITIONS ---
// ======================================================================

export function getPrimaryButtonStyle() {
    return `
        background-color: ${theme.COLOR_PRIMARY_GREEN};
        color: ${theme.COLOR_BG_WHITE};
        border: none;
        border-radius: ${theme.SIZE_BORDER_RADIUS_BUTTON}px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 600;
        min-height: 36px;
        cursor: pointer;
        transition: all 0.2s ease;
    `;
}

export function getSecondaryButtonStyle() {
    return `
        background-color: ${theme.COLOR_BG_WHITE};
        color: ${theme.COLOR_TEXT_DARK};
        border: 1px solid ${theme.COLOR_BG_SIDEBAR};
        border-radius: ${theme.SIZE_BORDER_RADIUS_BUTTON}px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        min-height: 36px;
        cursor: pointer;
        transition: all 0.2s ease;
    `;
}

export function getOutlineButtonStyle() {
    return `
        background-color: transparent;
        color: ${theme.COLOR_PRIMARY_GREEN};
        border: 1px solid ${theme.COLOR_PRIMARY_GREEN};
        border-radius: ${theme.SIZE_BORDER_RADIUS_BUTTON}px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 600;
        min-height: 36px;
        cursor: pointer;
        transition: all 0.2s ease;
    `;
}

export function getTransparentButtonStyle() {
    return `
        background-color: transparent;
        color: ${theme.COLOR_TEXT_DARK};
        border: none;
        border-radius: ${theme.SIZE_BORDER_RADIUS_BUTTON}px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        min-height: 36px;
        cursor: pointer;
        transition: all 0.2s ease;
    `;
}

export function getIconButtonStyle(size = 32) {
    return `
        background-color: transparent;
        border: none;
        border-radius: ${theme.SIZE_BORDER_RADIUS_BUTTON}px;
        width: ${size}px;
        height: ${size}px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
}

export function getDeleteButtonStyle() {
    return `
        background-color: ${theme.COLOR_BG_ERROR};
        color: ${theme.COLOR_BG_WHITE};
        border: none;
        border-radius: ${theme.SIZE_BORDER_RADIUS_BUTTON}px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 600;
        min-height: 36px;
        cursor: pointer;
        transition: all 0.2s ease;
    `;
}

export function getSmallButtonStyle() {
    return `
        background-color: ${theme.COLOR_PRIMARY_GREEN};
        color: ${theme.COLOR_BG_WHITE};
        border: none;
        border-radius: 4px;
        padding: 4px 12px;
        font-size: 12px;
        font-weight: 600;
        min-height: 28px;
        cursor: pointer;
        transition: all 0.2s ease;
    `;
}

export function getLargeButtonStyle() {
    return `
        background-color: ${theme.COLOR_PRIMARY_GREEN};
        color: ${theme.COLOR_BG_WHITE};
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        min-height: 48px;
        cursor: pointer;
        transition: all 0.2s ease;
    `;
}

// ======================================================================
// --- BUTTON CREATION FUNCTIONS ---
// ======================================================================

export function createPrimaryButton(text, onClick = null) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'btn btn-primary';
    button.style.cssText = getPrimaryButtonStyle();
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = theme.COLOR_PRIMARY_DARK;
        button.style.transform = 'translateY(-1px)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = theme.COLOR_PRIMARY_GREEN;
        button.style.transform = 'translateY(0)';
    });
    
    // Disabled state
    button.addEventListener('disabled', () => {
        button.style.backgroundColor = theme.COLOR_BUTTON_DISABLED;
        button.style.color = theme.COLOR_TEXT_SUBTLE;
        button.style.cursor = 'not-allowed';
    });
    
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    
    return button;
}

export function createSecondaryButton(text, onClick = null) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'btn btn-secondary';
    button.style.cssText = getSecondaryButtonStyle();
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = theme.COLOR_HOVER_BG;
        button.style.borderColor = theme.COLOR_PRIMARY_GREEN;
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = theme.COLOR_BG_WHITE;
        button.style.borderColor = theme.COLOR_BG_SIDEBAR;
    });
    
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    
    return button;
}

export function createOutlineButton(text, onClick = null) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'btn btn-outline';
    button.style.cssText = getOutlineButtonStyle();
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = theme.COLOR_PRIMARY_GREEN;
        button.style.color = theme.COLOR_BG_WHITE;
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'transparent';
        button.style.color = theme.COLOR_PRIMARY_GREEN;
    });
    
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    
    return button;
}

export function createIconButton(iconText, onClick = null, size = 32) {
    const button = document.createElement('button');
    button.innerHTML = iconText;
    button.className = 'btn btn-icon';
    button.style.cssText = getIconButtonStyle(size);
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = theme.COLOR_HOVER_BG;
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'transparent';
    });
    
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    
    return button;
}

export function createDeleteButton(text, onClick = null) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'btn btn-delete';
    button.style.cssText = getDeleteButtonStyle();
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#dc2626';
        button.style.transform = 'translateY(-1px)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = theme.COLOR_BG_ERROR;
        button.style.transform = 'translateY(0)';
    });
    
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    
    return button;
}

// ======================================================================
// --- UTILITY FUNCTIONS ---
// ======================================================================

export function applyButtonStyle(button, styleType = 'primary') {
    const styleMap = {
        'primary': getPrimaryButtonStyle(),
        'secondary': getSecondaryButtonStyle(),
        'outline': getOutlineButtonStyle(),
        'transparent': getTransparentButtonStyle(),
        'icon': getIconButtonStyle(),
        'delete': getDeleteButtonStyle(),
        'small': getSmallButtonStyle(),
        'large': getLargeButtonStyle()
    };
    
    if (styleMap[styleType]) {
        button.style.cssText = styleMap[styleType];
        button.className = `btn btn-${styleType}`;
        
        // Add hover effects based on type
        addHoverEffects(button, styleType);
    } else {
        console.warn(`Unknown button style type '${styleType}'`);
    }
}

function addHoverEffects(button, styleType) {
    switch (styleType) {
        case 'primary':
        case 'small':
        case 'large':
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = theme.COLOR_PRIMARY_DARK;
                button.style.transform = 'translateY(-1px)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = theme.COLOR_PRIMARY_GREEN;
                button.style.transform = 'translateY(0)';
            });
            break;
            
        case 'secondary':
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = theme.COLOR_HOVER_BG;
                button.style.borderColor = theme.COLOR_PRIMARY_GREEN;
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = theme.COLOR_BG_WHITE;
                button.style.borderColor = theme.COLOR_BG_SIDEBAR;
            });
            break;
            
        case 'outline':
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = theme.COLOR_PRIMARY_GREEN;
                button.style.color = theme.COLOR_BG_WHITE;
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = 'transparent';
                button.style.color = theme.COLOR_PRIMARY_GREEN;
            });
            break;
            
        case 'transparent':
        case 'icon':
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = theme.COLOR_HOVER_BG;
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = 'transparent';
            });
            break;
            
        case 'delete':
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#dc2626';
                button.style.transform = 'translateY(-1px)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = theme.COLOR_BG_ERROR;
                button.style.transform = 'translateY(0)';
            });
            break;
    }
}

// ======================================================================
// --- CSS STYLES FOR INJECTION ---
// ======================================================================

export function getButtonCSS() {
    return `
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            text-decoration: none;
            outline: none;
            user-select: none;
            transition: all 0.2s ease;
        }
        
        .btn:focus {
            outline: 2px solid ${theme.COLOR_PRIMARY_LIGHT};
            outline-offset: 2px;
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            pointer-events: none;
        }
        
        .btn:active {
            transform: translateY(0) !important;
        }
        
        .btn-primary:hover {
            background-color: ${theme.COLOR_PRIMARY_DARK} !important;
            transform: translateY(-1px);
        }
        
        .btn-secondary:hover {
            background-color: ${theme.COLOR_HOVER_BG} !important;
            border-color: ${theme.COLOR_PRIMARY_GREEN} !important;
        }
        
        .btn-outline:hover {
            background-color: ${theme.COLOR_PRIMARY_GREEN} !important;
            color: ${theme.COLOR_BG_WHITE} !important;
        }
        
        .btn-transparent:hover,
        .btn-icon:hover {
            background-color: ${theme.COLOR_HOVER_BG} !important;
        }
        
        .btn-delete:hover {
            background-color: #dc2626 !important;
            transform: translateY(-1px);
        }
    `;
}