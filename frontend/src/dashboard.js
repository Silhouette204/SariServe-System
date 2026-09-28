// src/dashboard.js

import { API_BASE } from './config.js';

import { 
  updateWeeklySalesChart, 
  updateCategoryChart, 
  updateLowStockChart 
} from './dashboard-charts.js';

// --- 1. MODAL HANDLERS ---
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

  const setupTrigger = (btnId, modalId, isOpen) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => toggleModal(modalId, isOpen));
    }
  };

  // Triggers
  setupTrigger('open-low-stock-modal-btn', 'low-stock-modal', true);
  setupTrigger('close-low-stock-modal-btn', 'low-stock-modal', false);
  setupTrigger('open-recent-transactions-modal-btn', 'recent-transactions-modal', true);
  setupTrigger('close-recent-transactions-modal-btn', 'recent-transactions-modal', false);

  // Backdrop click
  window.addEventListener('click', (e) => {
    if (e.target.id === 'low-stock-modal') toggleModal('low-stock-modal', false);
    if (e.target.id === 'recent-transactions-modal') toggleModal('recent-transactions-modal', false);
  });

  // ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleModal('low-stock-modal', false);
      toggleModal('recent-transactions-modal', false);
    }
  });
}

// --- 2. API DATA FETCHING ---
export async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/stats`, {
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('Failed to fetch dashboard data');

    const data = await response.json();

    // 1. KPI Cards Text Updates
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.textContent = val;
    };

    const formatPeso = (val) => `₱ ${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    setText('dash-today-sale', formatPeso(data.todaySales));
    setText('dash-total-product', data.totalProducts ?? 0);
    setText('dash-low-stock', data.lowStockCount ?? 0);
    setText('dash-total-utang', formatPeso(data.totalUtang));

    if (data.prevTodaySales !== undefined) setText('prev-dash-today-sale', formatPeso(data.prevTodaySales));
    if (data.totalUtangCustomers !== undefined) setText('prev-dash-total-utang', data.totalUtangCustomers);

    // 2. Category Percentages Legend
    if (data.categoryPercentages) {
      setText('pct-beverages', `${data.categoryPercentages.beverages || 0}%`);
      setText('pct-food', `${data.categoryPercentages.food || 0}%`);
      setText('pct-nonfood', `${data.categoryPercentages.nonFood || 0}%`);
      setText('pct-frozen', `${data.categoryPercentages.frozen || 0}%`);
      setText('pct-snacks', `${data.categoryPercentages.snacks || 0}%`);
    }

    const setPercent = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      const sign = value >= 0 ? '+' : '';
      el.textContent = `${sign}${value.toFixed(2)}%`;
    };
    
   // Today's Sales: totoong "% change vs kahapon" — may +/- sign
setPercent('kpi-dash-today-sale', data.todaySalesChange);
setPercent('kpi-dash-total-utang', data.totalUtangChange);

// Total Product / Low Stock: "progress gauge" papunta sa 150 cap — walang sign
const setProgress = (id, value) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = `${value.toFixed(2)}%`;
};

setProgress('kpi-dash-total-product', data.totalProductsChange);
setProgress('kpi-dash-low-stock', data.lowStockChange);

    // 3. Update Charts
    if (data.weeklySales) {
      updateWeeklySalesChart(data.weeklySales.amounts, data.weeklySales.days);
    }

    if (data.categories) {
      updateCategoryChart(data.categories.series, data.categories.labels);
    }

    if (data.lowStockItems) {
      updateLowStockChart(data.lowStockItems.quantities, data.lowStockItems.names);
    }

    // 4. Populate Low Stock Modal Table
    if (Array.isArray(data.lowStockTableDetails)) {
      const tableBody = document.getElementById('low-stock-table-body');
      if (tableBody) {
        tableBody.innerHTML = data.lowStockTableDetails.map(item => `
          <tr>
            <td class="py-3 px-2">${item.name}</td>
            <td class="py-3 px-2 text-center text-red-600 font-bold">${item.stock}</td>
            <td class="py-3 px-2 text-center text-slate-400">${item.minThreshold}</td>
          </tr>
        `).join('');
      }
    }

    // 5. Populate Recent Transactions Lists (Dashboard View & Modal)
    if (Array.isArray(data.recentTransactions)) {
      const listContainer = document.getElementById('recent-transactions-list');
      const modalListContainer = document.getElementById('modal-transactions-list');

      if (listContainer) {
        listContainer.innerHTML = data.recentTransactions.slice(0, 5).map(txn => `
          <li class="flex flex-row justify-between items-center border-b border-secondary pb-3 my-3">
            <div>
              <h1 class="text-secondary font-semibold">${txn.customerName}</h1>
              <p class="text-secondary/80 text-sm">${txn.txnCode}</p>
            </div>
            <div>
              <h1 class="text-end font-semibold">₱${Number(txn.amount).toFixed(2)}</h1>
              <p class="py-1 px-2 bg-green-200 text-secondary rounded-xl text-xs text-center">${txn.status}</p>
            </div>
          </li>   
        `).join('');
      }

      if (modalListContainer) {
        modalListContainer.innerHTML = data.recentTransactions.map(txn => `
          <div class="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <p class="font-bold text-slate-800 text-sm">${txn.customerName}</p>
              <p class="text-xs text-slate-400">${txn.itemsSummary}</p>
              <p class="text-[10px] text-secondary font-semibold mt-0.5">${txn.timeAgo}</p>
            </div>
            <span class="font-bold text-emerald-600 text-base">+₱${Number(txn.amount).toFixed(2)}</span>
          </div>
        `).join('');
      }
    }

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}