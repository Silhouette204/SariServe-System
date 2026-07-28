// src/dashboardModals.js

export function initDashboardModals() {
  const toggleModal = (modalId, isOpen) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (isOpen) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  // --- 1. Low Stock Modal Triggers ---
  const openLowStock = document.getElementById('open-low-stock-modal-btn');
  const closeLowStock = document.getElementById('close-low-stock-modal-btn');
  
  if (openLowStock) openLowStock.onclick = () => toggleModal('low-stock-modal', true);
  if (closeLowStock) closeLowStock.onclick = () => toggleModal('low-stock-modal', false);

  // --- 2. Recent Transactions Triggers ---
  const openRecent = document.getElementById('open-recent-transactions-modal-btn');
  const closeRecent = document.getElementById('close-recent-transactions-modal-btn');

  if (openRecent) openRecent.onclick = () => toggleModal('recent-transactions-modal', true);
  if (closeRecent) closeRecent.onclick = () => toggleModal('recent-transactions-modal', false);

  // Backdrop click auto-close logic
  window.addEventListener('click', (e) => {
    const lowStockModal = document.getElementById('low-stock-modal');
    const recentModal = document.getElementById('recent-transactions-modal');

    if (e.target === lowStockModal) toggleModal('low-stock-modal', false);
    if (e.target === recentModal) toggleModal('recent-transactions-modal', false);
  });
}