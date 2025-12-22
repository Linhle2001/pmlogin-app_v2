/**
 * PMLogin Theme Manager - Centralized theme management utility
 * 
 * This utility provides functions to:
 * - Apply theme variables to DOM
 * - Get theme colors programmatically
 * - Switch between themes (if needed in future)
 * - Generate CSS classes dynamically
 */

import { theme, applyThemeToDocument, getThemeColor } from '../assets/theme.js';

class ThemeManager {
    constructor() {
        this.currentTheme = 'default';
        this.isInitialized = false;
    }

    /**
     * Initialize theme manager and apply theme to document
     */
    init() {
        if (this.isInitialized) return;
        
        try {
            // Apply theme variables to document root
            applyThemeToDocument();
            
            // Add theme class to body
            document.body.classList.add('pmlogin-theme');
            
            this.isInitialized = true;
            console.log('[SUCCESS] ThemeManager initialized successfully');
        } catch (error) {
            console.error('[ERROR] Error initializing ThemeManager:', error);
        }
    }

    /**
     * Get a theme color by path
     * @param {string} colorPath - Dot notation path to color (e.g., 'BUTTON.PRIMARY_BG')
     * @returns {string} Color value
     */
    getColor(colorPath) {
        return getThemeColor(colorPath);
    }

    /**
     * Get all theme colors
     * @returns {object} Theme object
     */
    getTheme() {
        return theme;
    }

    /**
     * Create a CSS class with theme colors
     * @param {string} className - Class name
     * @param {object} styles - Style object with theme color paths
     * @returns {string} CSS class string
     */
    createCSSClass(className, styles) {
        let cssString = `.${className} {\n`;
        
        Object.entries(styles).forEach(([property, colorPath]) => {
            const color = this.getColor(colorPath);
            const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
            cssString += `  ${cssProperty}: ${color};\n`;
        });
        
        cssString += '}';
        return cssString;
    }

    /**
     * Apply dynamic styles to an element
     * @param {HTMLElement} element - Target element
     * @param {object} styles - Style object with theme color paths
     */
    applyStyles(element, styles) {
        Object.entries(styles).forEach(([property, colorPath]) => {
            const color = this.getColor(colorPath);
            const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
            element.style.setProperty(cssProperty, color);
        });
    }

    /**
     * Create a button with theme styles
     * @param {string} text - Button text
     * @param {string} variant - Button variant (primary, secondary, danger, etc.)
     * @param {object} options - Additional options
     * @returns {HTMLButtonElement} Styled button element
     */
    createButton(text, variant = 'primary', options = {}) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `pmlogin-btn pmlogin-btn-${variant}`;
        
        // Apply size if specified
        if (options.size) {
            button.classList.add(`pmlogin-btn-${options.size}`);
        }
        
        // Apply additional classes
        if (options.className) {
            button.className += ` ${options.className}`;
        }
        
        // Add event listeners
        if (options.onClick) {
            button.addEventListener('click', options.onClick);
        }
        
        return button;
    }

    /**
     * Create an input with theme styles
     * @param {string} type - Input type
     * @param {object} options - Input options
     * @returns {HTMLInputElement} Styled input element
     */
    createInput(type = 'text', options = {}) {
        const input = document.createElement('input');
        input.type = type;
        input.className = 'pmlogin-input';
        
        // Apply size if specified
        if (options.size) {
            input.classList.add(`pmlogin-input-${options.size}`);
        }
        
        // Set attributes
        if (options.placeholder) input.placeholder = options.placeholder;
        if (options.value) input.value = options.value;
        if (options.disabled) input.disabled = options.disabled;
        
        // Apply additional classes
        if (options.className) {
            input.className += ` ${options.className}`;
        }
        
        return input;
    }

    /**
     * Create a card with theme styles
     * @param {object} options - Card options
     * @returns {HTMLDivElement} Styled card element
     */
    createCard(options = {}) {
        const card = document.createElement('div');
        card.className = 'pmlogin-card';
        
        if (options.header) {
            const header = document.createElement('div');
            header.className = 'pmlogin-card-header';
            header.innerHTML = options.header;
            card.appendChild(header);
        }
        
        if (options.body) {
            const body = document.createElement('div');
            body.className = 'pmlogin-card-body';
            body.innerHTML = options.body;
            card.appendChild(body);
        }
        
        if (options.footer) {
            const footer = document.createElement('div');
            footer.className = 'pmlogin-card-footer';
            footer.innerHTML = options.footer;
            card.appendChild(footer);
        }
        
        return card;
    }

    /**
     * Create a badge with theme styles
     * @param {string} text - Badge text
     * @param {string} variant - Badge variant (success, error, warning, info, gray)
     * @returns {HTMLSpanElement} Styled badge element
     */
    createBadge(text, variant = 'gray') {
        const badge = document.createElement('span');
        badge.textContent = text;
        badge.className = `pmlogin-badge pmlogin-badge-${variant}`;
        return badge;
    }

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `pmlogin-toast pmlogin-toast-${type}`;
        
        const icons = {
            success: '[SUCCESS]',
            error: '[ERROR]',
            warning: '[WARNING]',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    /**
     * Create a modal with theme styles
     * @param {object} options - Modal options
     * @returns {HTMLDivElement} Modal overlay element
     */
    createModal(options = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'pmlogin-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'pmlogin-modal';
        
        if (options.title) {
            const header = document.createElement('div');
            header.className = 'pmlogin-modal-header';
            
            const title = document.createElement('h3');
            title.className = 'pmlogin-modal-title';
            title.textContent = options.title;
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'pmlogin-modal-close';
            closeBtn.innerHTML = '✕';
            closeBtn.addEventListener('click', () => overlay.remove());
            
            header.appendChild(title);
            header.appendChild(closeBtn);
            modal.appendChild(header);
        }
        
        if (options.body) {
            const body = document.createElement('div');
            body.className = 'pmlogin-modal-body';
            body.innerHTML = options.body;
            modal.appendChild(body);
        }
        
        if (options.footer) {
            const footer = document.createElement('div');
            footer.className = 'pmlogin-modal-footer';
            footer.innerHTML = options.footer;
            modal.appendChild(footer);
        }
        
        overlay.appendChild(modal);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        
        return overlay;
    }

    /**
     * Update CSS custom properties dynamically
     * @param {object} properties - Object with CSS custom property names and values
     */
    updateCSSProperties(properties) {
        const root = document.documentElement;
        Object.entries(properties).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    /**
     * Get current theme mode (for future dark mode support)
     * @returns {string} Current theme mode
     */
    getThemeMode() {
        return this.currentTheme;
    }

    /**
     * Check if dark mode is preferred by system
     * @returns {boolean} True if dark mode is preferred
     */
    isDarkModePreferred() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * Listen for system theme changes
     * @param {function} callback - Callback function when theme changes
     */
    onSystemThemeChange(callback) {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', callback);
        }
    }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeManager.init();
    });
} else {
    themeManager.init();
}

// Export singleton instance
export default themeManager;

// Also export class for custom instances if needed
export { ThemeManager };