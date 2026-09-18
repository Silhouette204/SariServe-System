// frontend/src/toast.js
let toastContainer = null;

function getContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-xs';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'info', duration = 3500) {
  const container = getContainer();

  const styles = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-secondary',
  };

  const toast = document.createElement('div');
  toast.className = `${styles[type] || styles.info} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium opacity-0 translate-x-4 transition-all duration-300`;
  toast.textContent = message;

  container.appendChild(toast);

  // trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-x-4');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}