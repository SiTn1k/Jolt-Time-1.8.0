/**
 * Error Toast Notifications
 * 
 * Provides user-friendly error/success messages via toast notifications.
 * Automatically initializes on first use.
 */

let toastContainer: HTMLElement | null = null;
let animationStyle: HTMLStyleElement | null = null;

function injectStyles() {
  if (animationStyle) return;
  
  animationStyle = document.createElement('style');
  animationStyle.textContent = `
    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(120%); opacity: 0; }
    }
    
    @keyframes fadeIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(-20px); opacity: 0; }
    }
    
    .toast-container {
      position: fixed;
      top: 60px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
    
    .toast {
      pointer-events: auto;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease;
      font-family: 'Exo 2', sans-serif;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
    }
    
    .toast.error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }
    
    .toast.success {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
    }
    
    .toast.warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }
    
    .toast.info {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }
    
    .toast.removing {
      animation: slideOut 0.3s ease forwards;
    }
  `;
  document.head.appendChild(animationStyle);
}

export function initErrorToasts() {
  if (typeof document === 'undefined') return;
  injectStyles();
  
  toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

function createToast(
  message: string,
  type: 'error' | 'success' | 'warning' | 'info',
  duration: number
) {
  if (!toastContainer) initErrorToasts();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer!.appendChild(toast);
  
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  return toast;
}

/**
 * Show error toast notification
 */
export function showError(message: string, duration = 5000): void {
  console.error('[Error]', message);
  try {
    createToast(message, 'error', duration);
  } catch {
    // Fallback to console if DOM not available
    console.error(message);
  }
}

/**
 * Show success toast notification
 */
export function showSuccess(message: string, duration = 3000): void {
  console.log('[Success]', message);
  try {
    createToast(message, 'success', duration);
  } catch {
    console.log(message);
  }
}

/**
 * Show warning toast notification
 */
export function showWarning(message: string, duration = 4000): void {
  console.warn('[Warning]', message);
  try {
    createToast(message, 'warning', duration);
  } catch {
    console.warn(message);
  }
}

/**
 * Show info toast notification
 */
export function showInfo(message: string, duration = 3000): void {
  console.info('[Info]', message);
  try {
    createToast(message, 'info', duration);
  } catch {
    console.info(message);
  }
}

/**
 * Helper to handle async operations with toast notifications
 */
export async function withToast<T>(
  promise: Promise<T>,
  {
    loadingMessage,
    successMessage,
    errorMessage,
    duration = 5000
  }: {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    duration?: number;
  }
): Promise<T | null> {
  if (loadingMessage) {
    showInfo(loadingMessage, 0); // Will be replaced
  }
  
  try {
    const result = await promise;
    if (successMessage) {
      showSuccess(successMessage, duration);
    }
    return result;
  } catch (error) {
    const message = errorMessage || (error instanceof Error ? error.message : 'Unknown error');
    showError(message, duration);
    return null;
  }
}
