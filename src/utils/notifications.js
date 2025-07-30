// Simple toast notification utility
export const showToast = (message, type = 'success') => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  // Add styles if not already added
  if (!document.querySelector('#toast-styles')) {
    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
      .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2d3748;
        color: #e2e8f0;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        border-left: 4px solid;
        min-width: 300px;
      }
      
      .toast-success {
        border-left-color: #48bb78;
      }
      
      .toast-error {
        border-left-color: #fc8181;
      }
      
      .toast-info {
        border-left-color: #63b3ed;
      }
      
      .toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .toast-content i {
        font-size: 1.2rem;
      }
      
      .toast-success i {
        color: #48bb78;
      }
      
      .toast-error i {
        color: #fc8181;
      }
      
      .toast-info i {
        color: #63b3ed;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
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
    document.head.appendChild(styles);
  }

  // Add to DOM
  document.body.appendChild(toast);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
};
