// Notification Component - Simple toast notifications
import * as theme from './constants.js';

export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }
    
    init() {
        this.createContainer();
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notificationContainer';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
        this.container.style.cssText = `
            pointer-events: none;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
        
        // Auto remove
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        return notification;
    }
    
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = 'notification-item p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full opacity-0';
        notification.style.cssText = `
            pointer-events: auto;
            max-width: 100%;
            word-wrap: break-word;
        `;
        
        const { backgroundColor, textColor, icon } = this.getTypeStyles(type);
        notification.style.backgroundColor = backgroundColor;
        notification.style.color = textColor;
        
        notification.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <i class="${icon} text-lg"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <button class="flex-shrink-0 ml-2 text-current opacity-70 hover:opacity-100 transition-opacity">
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>
        `;
        
        // Close button
        const closeBtn = notification.querySelector('button');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });
        
        return notification;
    }
    
    getTypeStyles(type) {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: theme.COLOR_SUCCESS_GREEN,
                    textColor: 'white',
                    icon: 'fas fa-check-circle'
                };
            case 'error':
                return {
                    backgroundColor: theme.COLOR_ERROR_RED,
                    textColor: 'white',
                    icon: 'fas fa-exclamation-circle'
                };
            case 'warning':
                return {
                    backgroundColor: theme.COLOR_WARNING_BROWN,
                    textColor: 'white',
                    icon: 'fas fa-exclamation-triangle'
                };
            default:
                return {
                    backgroundColor: theme.COLOR_PRIMARY_GREEN,
                    textColor: 'white',
                    icon: 'fas fa-info-circle'
                };
        }
    }
    
    remove(notification) {
        if (!notification || !notification.parentNode) return;
        
        // Animate out
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            // Remove from array
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }
    
    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
    }
}

// Global notification manager instance
let notificationManager = null;

export function getNotificationManager() {
    if (!notificationManager) {
        notificationManager = new NotificationManager();
    }
    return notificationManager;
}

// Convenience functions
export function showNotification(message, type = 'info', duration = 5000) {
    return getNotificationManager().show(message, type, duration);
}

export function showSuccess(message, duration = 5000) {
    return showNotification(message, 'success', duration);
}

export function showError(message, duration = 5000) {
    return showNotification(message, 'error', duration);
}

export function showWarning(message, duration = 5000) {
    return showNotification(message, 'warning', duration);
}

export function showInfo(message, duration = 5000) {
    return showNotification(message, 'info', duration);
}