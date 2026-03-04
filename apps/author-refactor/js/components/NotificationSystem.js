/**
 * Dataset Generator - Notification System Component
 * Handles all user notifications, alerts, and feedback messages
 */

import { CONSTANTS } from '../core/Constants.js';
import { EventEmitter } from '../core/EventEmitter.js';

export class NotificationSystem extends EventEmitter {
    /**
     * Stub for onAny event forwarding
     */
    onAny(fn) {
      // No-op for now, or could forward all events if needed
    }
  constructor() {
    super();
    this.notifications = new Map();
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    this.container = null;
    this.maxNotifications = 5;
    this.defaultDuration = 5000;
  }

  /**
   * Initialize notification system
   */
  initialize() {
    console.log('🔔 Initializing NotificationSystem...');
    
    this.createNotificationContainer();
    this.bindEventListeners();
    
    this.emit(CONSTANTS.EVENTS.APP_READY, { 
      component: 'NotificationSystem' 
    });
    
    console.log('✅ NotificationSystem initialized');
  }

  /**
   * Create notification container in DOM
   * @private
   */
  createNotificationContainer() {
    // Check if container already exists
    this.container = document.getElementById('notificationContainer');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notificationContainer';
      this.container.className = 'notification-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-label', 'Notifications');
      
      document.body.appendChild(this.container);
    }
  }

  /**
   * Bind event listeners for notification events
   * @private
   */
  bindEventListeners() {
    // Listen for various app events
    this.on(CONSTANTS.EVENTS.ERROR_OCCURRED, (data) => {
      this.showError(data.message, data);
    });

    this.on(CONSTANTS.EVENTS.SYMBOL_ADDED, (data) => {
      this.showSuccess(`Symbol ${data.symbol} added successfully`);
    });

    this.on(CONSTANTS.EVENTS.SYMBOL_REMOVED, (data) => {
      this.showInfo(`Symbol ${data.symbol} removed`);
    });

    this.on(CONSTANTS.EVENTS.SYMBOLS_CLEARED, () => {
      this.showInfo('All symbols cleared');
    });

    this.on(CONSTANTS.EVENTS.CONFIG_LOADED, (data) => {
      if (data.success) {
        this.showSuccess(data.message);
      } else {
        this.showError(data.message);
      }
    });

    this.on(CONSTANTS.EVENTS.CONFIG_SAVED, (data) => {
      if (data.success) {
        this.showSuccess(data.message);
      } else {
        this.showError(data.message);
      }
    });

    this.on(CONSTANTS.EVENTS.CONFIG_CREATED, (data) => {
      this.showInfo(data.message);
    });

    this.on(CONSTANTS.EVENTS.GENERATION_STARTED, (data) => {
      this.showInfo('Dataset generation started...', { persistent: true, id: 'generation' });
    });

    this.on(CONSTANTS.EVENTS.GENERATION_PROGRESS, (data) => {
      this.updateNotification('generation', {
        message: `Generating... ${data.progress.toFixed(0)}%`,
        type: 'info',
        persistent: true,
        progress: data.progress
      });
    });

    this.on(CONSTANTS.EVENTS.GENERATION_COMPLETED, (data) => {
      this.removeNotification('generation');
      if (data.success) {
        this.showSuccess(data.message, { duration: 8000 });
      } else {
        this.showError(data.message);
      }
    });

    this.on(CONSTANTS.EVENTS.EXCHANGE_CHANGED, (data) => {
      this.showInfo(`Switched to ${data.exchange} exchange`);
    });
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {object} options - Notification options
   */
  showSuccess(message, options = {}) {
    this.showNotification(message, 'success', options);
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   * @param {object} options - Notification options
   */
  showError(message, options = {}) {
    this.showNotification(message, 'error', { 
      duration: 8000, 
      ...options 
    });
  }

  /**
   * Show warning notification
   * @param {string} message - Warning message
   * @param {object} options - Notification options
   */
  showWarning(message, options = {}) {
    this.showNotification(message, 'warning', options);
  }

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {object} options - Notification options
   */
  showInfo(message, options = {}) {
    this.showNotification(message, 'info', options);
  }

  /**
   * Show notification with specified type
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {object} options - Notification options
   */
  showNotification(message, type = 'info', options = {}) {
    const notification = {
      id: options.id || this.generateNotificationId(),
      message,
      type,
      timestamp: new Date(),
      duration: options.duration || this.defaultDuration,
      persistent: options.persistent || false,
      progress: options.progress,
      actions: options.actions || []
    };

    // Add to queue
    this.notificationQueue.push(notification);
    
    // Process queue
    this.processNotificationQueue();
  }

  /**
   * Update existing notification
   * @param {string} id - Notification ID
   * @param {object} updates - Updates to apply
   */
  updateNotification(id, updates) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // Apply updates
    Object.assign(notification.data, updates);
    
    // Update DOM element
    this.updateNotificationElement(notification.element, notification.data);
  }

  /**
   * Remove notification by ID
   * @param {string} id - Notification ID
   */
  removeNotification(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    this.hideNotification(notification.element, () => {
      this.notifications.delete(id);
    });
  }

  /**
   * Process notification queue
   * @private
   */
  async processNotificationQueue() {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      
      // Check if we need to remove old notifications
      if (this.notifications.size >= this.maxNotifications) {
        this.removeOldestNotification();
      }

      // Show notification
      await this.displayNotification(notification);
      
      // Small delay between notifications
      await this.delay(100);
    }

    this.isProcessingQueue = false;
  }

  /**
   * Display notification in DOM
   * @param {object} notification - Notification data
   * @private
   */
  async displayNotification(notification) {
    // Check if updating existing notification
    if (this.notifications.has(notification.id)) {
      this.updateNotification(notification.id, notification);
      return;
    }

    // Create notification element
    const element = this.createNotificationElement(notification);
    
    // Store notification
    this.notifications.set(notification.id, {
      element,
      data: notification
    });

    // Add to container
    this.container.appendChild(element);

    // Animate in
    await this.delay(10);
    element.classList.add('visible');

    // Set auto-remove timer if not persistent
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Create notification DOM element
   * @param {object} notification - Notification data
   * @returns {HTMLElement} Notification element
   * @private
   */
  createNotificationElement(notification) {
    const element = document.createElement('div');
    element.className = `notification notification-${notification.type}`;
    element.setAttribute('role', 'alert');
    element.dataset.notificationId = notification.id;

    // Create notification content
    element.innerHTML = this.generateNotificationHTML(notification);

    // Bind events
    this.bindNotificationEvents(element, notification);

    return element;
  }

  /**
   * Generate notification HTML content
   * @param {object} notification - Notification data
   * @returns {string} HTML content
   * @private
   */
  generateNotificationHTML(notification) {
    const icon = this.getNotificationIcon(notification.type);
    let content = `
      <div class="notification-content">
        <div class="notification-icon">${icon}</div>
        <div class="notification-body">
          <div class="notification-message">${this.escapeHtml(notification.message)}</div>
    `;

    // Add progress bar if present
    if (notification.progress !== undefined) {
      content += `
        <div class="notification-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${notification.progress}%"></div>
          </div>
        </div>
      `;
    }

    // Add timestamp
    content += `
          <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
        </div>
    `;

    // Add actions
    if (notification.actions && notification.actions.length > 0) {
      content += `
        <div class="notification-actions">
          ${notification.actions.map(action => `
            <button class="notification-action" data-action="${action.id}">
              ${this.escapeHtml(action.label)}
            </button>
          `).join('')}
        </div>
      `;
    }

    // Add close button (except for persistent notifications)
    if (!notification.persistent) {
      content += `
        <button class="notification-close" aria-label="Close notification" title="Close">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      `;
    }

    content += `</div>`;

    return content;
  }

  /**
   * Update notification element content
   * @param {HTMLElement} element - Notification element
   * @param {object} notification - Updated notification data
   * @private
   */
  updateNotificationElement(element, notification) {
    const messageEl = element.querySelector('.notification-message');
    if (messageEl) {
      messageEl.textContent = notification.message;
    }

    const progressFill = element.querySelector('.progress-fill');
    if (progressFill && notification.progress !== undefined) {
      progressFill.style.width = `${notification.progress}%`;
    }

    const timeEl = element.querySelector('.notification-time');
    if (timeEl) {
      timeEl.textContent = this.formatTime(notification.timestamp);
    }
  }

  /**
   * Bind notification event listeners
   * @param {HTMLElement} element - Notification element
   * @param {object} notification - Notification data
   * @private
   */
  bindNotificationEvents(element, notification) {
    // Close button
    const closeBtn = element.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.removeNotification(notification.id);
      });
    }

    // Action buttons
    const actionBtns = element.querySelectorAll('.notification-action');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const actionId = btn.dataset.action;
        const action = notification.actions.find(a => a.id === actionId);
        if (action && action.handler) {
          action.handler();
        }
        
        // Remove notification after action (unless it's persistent)
        if (!notification.persistent) {
          this.removeNotification(notification.id);
        }
      });
    });

    // Auto-hide on click (for info notifications)
    if (notification.type === 'info' && !notification.persistent) {
      element.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-action, .notification-close')) {
          this.removeNotification(notification.id);
        }
      });
    }
  }

  /**
   * Hide notification with animation
   * @param {HTMLElement} element - Notification element
   * @param {Function} callback - Callback after animation
   * @private
   */
  hideNotification(element, callback) {
    element.classList.remove('visible');
    element.classList.add('removing');

    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      if (callback) callback();
    }, 300);
  }

  /**
   * Remove oldest notification to make room
   * @private
   */
  removeOldestNotification() {
    const oldestId = Array.from(this.notifications.keys())[0];
    if (oldestId) {
      this.removeNotification(oldestId);
    }
  }

  /**
   * Get notification icon for type
   * @param {string} type - Notification type
   * @returns {string} Icon HTML
   * @private
   */
  getNotificationIcon(type) {
    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
      error: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
      info: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
    };

    return icons[type] || icons.info;
  }

  /**
   * Format timestamp for display
   * @param {Date} timestamp - Timestamp to format
   * @returns {string} Formatted time
   * @private
   */
  formatTime(timestamp) {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Escape HTML content
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   * @private
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generate unique notification ID
   * @returns {string} Unique ID
   * @private
   */
  generateNotificationId() {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Delay promise
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    for (const id of this.notifications.keys()) {
      this.removeNotification(id);
    }
  }

  /**
   * Clear notifications by type
   * @param {string} type - Notification type to clear
   */
  clearByType(type) {
    for (const [id, notification] of this.notifications) {
      if (notification.data.type === type) {
        this.removeNotification(id);
      }
    }
  }

  /**
   * Get notification count
   * @returns {number} Current notification count
   */
  getNotificationCount() {
    return this.notifications.size;
  }

  /**
   * Get notifications by type
   * @param {string} type - Notification type
   * @returns {Array} Array of notifications
   */
  getNotificationsByType(type) {
    return Array.from(this.notifications.values())
      .filter(n => n.data.type === type)
      .map(n => n.data);
  }

  /**
   * Show notification with custom actions
   * @param {string} message - Message text
   * @param {Array} actions - Array of action objects
   * @param {object} options - Additional options
   */
  showNotificationWithActions(message, actions, options = {}) {
    this.showNotification(message, options.type || 'info', {
      ...options,
      actions,
      persistent: true
    });
  }

  /**
   * Show confirmation notification
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Confirm callback
   * @param {Function} onCancel - Cancel callback
   */
  showConfirmation(message, onConfirm, onCancel) {
    const actions = [
      {
        id: 'confirm',
        label: 'Confirm',
        handler: onConfirm
      },
      {
        id: 'cancel',
        label: 'Cancel',
        handler: onCancel
      }
    ];

    this.showNotificationWithActions(message, actions, {
      type: 'warning',
      duration: 0
    });
  }
}