/**
 * CISP Notification System
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.initialized = false;
    }

    init() {
        // Make sure we only initialize once
        if (this.initialized) return;
        
        try {
            // Check if document body is available
            if (!document.body) {
                console.warn('Document body not available, notification system will initialize when DOM is ready');
                document.addEventListener('DOMContentLoaded', () => this.init());
                return;
            }
            
            // Create notification container if it doesn't exist
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                }

                .notification {
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 15px 25px;
                    margin-bottom: 10px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    max-width: 400px;
                    backdrop-filter: blur(5px);
                    animation: slideIn 0.3s ease-out;
                }

                .notification.success {
                    border-left: 4px solid #48bb78;
                }

                .notification.error {
                    border-left: 4px solid #f56565;
                }

                .notification.warning {
                    border-left: 4px solid #ed8936;
                }

                .notification.info {
                    border-left: 4px solid #4299e1;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
            
            this.initialized = true;
            console.log('Notification system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize notification system:', error);
        }
    }

    show(message, type = 'info', duration = 5000) {
        // Make sure we're initialized
        if (!this.initialized) {
            console.warn('Notification system not initialized, initializing now');
            this.init();
        }
        
        // If still not initialized or container doesn't exist, log the message instead
        if (!this.container) {
            console.warn(`Notification (${type}): ${message}`);
            return;
        }
        
        try {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            
            // Convert HTML content to safe text if it's a simple string
            if (typeof message === 'string' && !message.includes('<')) {
                notification.textContent = message;
            } else {
                // If it contains HTML (like for the welcome message), use innerHTML
                notification.innerHTML = message;
            }

            this.container.appendChild(notification);

            // Remove notification after duration
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-out forwards';
                setTimeout(() => {
                    if (notification.parentNode === this.container) {
                        this.container.removeChild(notification);
                    }
                }, 300);
            }, duration);
            
            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            console.warn(`Notification (${type}): ${message}`);
        }
    }
}

// Make it globally available
window.notifications = new NotificationSystem(); 