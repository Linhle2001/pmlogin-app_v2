// Message Dialog Component - Chuyển đổi từ PyQt6 message_dialog_style.py
import * as theme from './constants.js';
import { createPrimaryButton, createSecondaryButton } from './button-styles.js';

// ======================================================================
// --- MESSAGE DIALOG CLASS ---
// ======================================================================

export class MessageDialog {
    constructor(options = {}) {
        this.title = options.title || '';
        this.message = options.message || '';
        this.detail = options.detail || '';
        this.type = options.type || 'info'; // 'success', 'warning', 'important', 'error', 'info'
        this.actionText = options.actionText || 'OK';
        this.onConfirm = options.onConfirm || null;
        this.onCancel = options.onCancel || null;
        
        this.overlay = null;
        this.dialog = null;
        this.isVisible = false;
    }
    
    show() {
        if (this.isVisible) return;
        
        this.createOverlay();
        this.createDialog();
        this.centerDialog();
        
        // Add to DOM
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.dialog);
        
        // Show with animation
        requestAnimationFrame(() => {
            this.overlay.style.opacity = '1';
            this.dialog.style.opacity = '1';
            this.dialog.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        
        this.isVisible = true;
        
        // Focus management
        this.focusFirstButton();
        
        // ESC key handler
        this.handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.handleKeyPress);
    }
    
    hide() {
        if (!this.isVisible) return;
        
        // Hide with animation
        this.overlay.style.opacity = '0';
        this.dialog.style.opacity = '0';
        this.dialog.style.transform = 'translate(-50%, -50%) scale(0.95)';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            if (this.dialog && this.dialog.parentNode) {
                this.dialog.parentNode.removeChild(this.dialog);
            }
            
            // Cleanup
            document.removeEventListener('keydown', this.handleKeyPress);
            this.isVisible = false;
        }, 200);
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'message-dialog-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: ${theme.Z_INDEX.MODAL_BACKDROP};
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        // Click overlay to close
        this.overlay.addEventListener('click', () => {
            this.hide();
            if (this.onCancel) this.onCancel();
        });
    }
    
    createDialog() {
        this.dialog = document.createElement('div');
        this.dialog.className = 'message-dialog';
        this.dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            width: 500px;
            max-width: 90vw;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            z-index: ${theme.Z_INDEX.MODAL};
            opacity: 0;
            transition: all 0.2s ease;
            padding: 30px;
        `;
        
        // Prevent click propagation
        this.dialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Create content
        this.createHeader();
        this.createBody();
        this.createFooter();
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.className = 'dialog-header';
        header.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        `;
        
        // Icon
        const { iconText, iconColor } = this.getIconAndColor();
        const icon = document.createElement('div');
        icon.innerHTML = iconText;
        icon.style.cssText = `
            width: 40px;
            height: 40px;
            background-color: ${iconColor};
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            margin-right: 12px;
            flex-shrink: 0;
        `;
        
        // Title
        const title = document.createElement('h3');
        title.textContent = this.title;
        title.style.cssText = `
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: ${theme.COLOR_TEXT_DARK};
            flex: 1;
        `;
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            width: 32px;
            height: 32px;
            background-color: ${theme.COLOR_BG_SIDEBAR};
            color: ${theme.COLOR_TEXT_SUBTLE};
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.2s ease;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.backgroundColor = '#e0e0e0';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.backgroundColor = theme.COLOR_BG_SIDEBAR;
        });
        
        closeBtn.addEventListener('click', () => {
            this.hide();
            if (this.onCancel) this.onCancel();
        });
        
        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(closeBtn);
        this.dialog.appendChild(header);
    }
    
    createBody() {
        const body = document.createElement('div');
        body.className = 'dialog-body';
        body.style.cssText = `
            margin-bottom: 30px;
        `;
        
        // Message
        const message = document.createElement('p');
        message.textContent = this.message;
        message.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 14px;
            color: ${theme.COLOR_TEXT_DARK};
            line-height: 1.5;
        `;
        
        body.appendChild(message);
        
        // Detail (if provided)
        if (this.detail) {
            const detail = document.createElement('p');
            detail.textContent = this.detail;
            detail.style.cssText = `
                margin: 0;
                font-size: 13px;
                color: ${this.getDetailColor()};
                font-weight: 500;
            `;
            body.appendChild(detail);
        }
        
        this.dialog.appendChild(body);
    }
    
    createFooter() {
        const footer = document.createElement('div');
        footer.className = 'dialog-footer';
        footer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        `;
        
        if (this.type === 'important') {
            // Cancel button for important dialogs
            const cancelBtn = this.createButton('Hủy', 'secondary', () => {
                this.hide();
                if (this.onCancel) this.onCancel();
            });
            footer.appendChild(cancelBtn);
            
            // Action button
            const actionBtn = this.createButton(this.actionText, 'delete', () => {
                this.hide();
                if (this.onConfirm) this.onConfirm();
            });
            footer.appendChild(actionBtn);
        } else {
            // OK button for other types
            const okBtn = this.createButton('OK', this.getButtonType(), () => {
                this.hide();
                if (this.onConfirm) this.onConfirm();
            });
            footer.appendChild(okBtn);
        }
        
        this.dialog.appendChild(footer);
    }
    
    createButton(text, type, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            min-width: 80px;
        `;
        
        // Apply button style based on type
        if (type === 'secondary') {
            button.style.backgroundColor = theme.COLOR_BG_WHITE;
            button.style.color = theme.COLOR_TEXT_DARK;
            button.style.border = `1px solid ${theme.COLOR_BG_SIDEBAR}`;
            
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = theme.COLOR_HOVER_BG;
                button.style.borderColor = theme.COLOR_PRIMARY_GREEN;
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = theme.COLOR_BG_WHITE;
                button.style.borderColor = theme.COLOR_BG_SIDEBAR;
            });
        } else if (type === 'delete') {
            button.style.backgroundColor = '#ef4444';
            button.style.color = 'white';
            
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#dc2626';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '#ef4444';
            });
        } else {
            // Primary button styles based on dialog type
            const { backgroundColor, hoverColor } = this.getButtonColors();
            button.style.backgroundColor = backgroundColor;
            button.style.color = 'white';
            
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = hoverColor;
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = backgroundColor;
            });
        }
        
        button.addEventListener('click', onClick);
        return button;
    }
    
    getIconAndColor() {
        switch (this.type) {
            case 'success':
                return { iconText: '✓', iconColor: '#10b981' };
            case 'warning':
                return { iconText: '[WARNING]', iconColor: '#f59e0b' };
            case 'important':
                return { iconText: '[WARNING]', iconColor: '#ef4444' };
            case 'error':
                return { iconText: '✕', iconColor: '#ef4444' };
            default:
                return { iconText: 'ℹ️', iconColor: theme.COLOR_PRIMARY_GREEN };
        }
    }
    
    getDetailColor() {
        switch (this.type) {
            case 'success':
                return '#10b981';
            case 'warning':
                return '#f59e0b';
            case 'important':
            case 'error':
                return '#ef4444';
            default:
                return theme.COLOR_TEXT_SUBTLE;
        }
    }
    
    getButtonType() {
        switch (this.type) {
            case 'success':
            case 'warning':
            case 'error':
            case 'important':
                return this.type;
            default:
                return 'primary';
        }
    }
    
    getButtonColors() {
        switch (this.type) {
            case 'success':
                return { backgroundColor: '#10b981', hoverColor: '#059669' };
            case 'warning':
                return { backgroundColor: '#f59e0b', hoverColor: '#d97706' };
            case 'error':
            case 'important':
                return { backgroundColor: '#ef4444', hoverColor: '#dc2626' };
            default:
                return { backgroundColor: theme.COLOR_PRIMARY_GREEN, hoverColor: theme.COLOR_PRIMARY_DARK };
        }
    }
    
    centerDialog() {
        // Dialog is already centered with CSS, but we can adjust if needed
    }
    
    focusFirstButton() {
        const buttons = this.dialog.querySelectorAll('button');
        if (buttons.length > 0) {
            // Focus the last button (OK or Action button)
            buttons[buttons.length - 1].focus();
        }
    }
}

// ======================================================================
// --- CONVENIENCE FUNCTIONS ---
// ======================================================================

export function showSuccess(options = {}) {
    const dialog = new MessageDialog({
        title: options.title || 'Thành công',
        message: options.message || '',
        detail: options.detail || '',
        type: 'success',
        onConfirm: options.onConfirm
    });
    dialog.show();
    return dialog;
}

export function showWarning(options = {}) {
    const dialog = new MessageDialog({
        title: options.title || 'Cảnh báo',
        message: options.message || '',
        detail: options.detail || '',
        type: 'warning',
        onConfirm: options.onConfirm
    });
    dialog.show();
    return dialog;
}

export function showImportant(options = {}) {
    const dialog = new MessageDialog({
        title: options.title || 'Quan trọng',
        message: options.message || '',
        detail: options.detail || '',
        type: 'important',
        actionText: options.actionText || 'Xóa',
        onConfirm: options.onConfirm,
        onCancel: options.onCancel
    });
    dialog.show();
    return dialog;
}

export function showError(options = {}) {
    const dialog = new MessageDialog({
        title: options.title || 'Lỗi',
        message: options.message || '',
        detail: options.detail || '',
        type: 'error',
        onConfirm: options.onConfirm
    });
    dialog.show();
    return dialog;
}

export function showInfo(options = {}) {
    const dialog = new MessageDialog({
        title: options.title || 'Thông báo',
        message: options.message || '',
        detail: options.detail || '',
        type: 'info',
        onConfirm: options.onConfirm
    });
    dialog.show();
    return dialog;
}

// ======================================================================
// --- CONFIRM DIALOG ---
// ======================================================================

export function showConfirm(options = {}) {
    return new Promise((resolve) => {
        const dialog = new MessageDialog({
            title: options.title || 'Xác nhận',
            message: options.message || '',
            detail: options.detail || '',
            type: 'important',
            actionText: options.actionText || 'Xác nhận',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
        });
        dialog.show();
    });
}