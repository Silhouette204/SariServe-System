// utang.js

let stateCustomers = [];

// ===== 1. FETCH DATA MULA SA BACKEND =====
export async function fetchUtangData() {
  try {
    const response = await fetch('/api/utang', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch utang data');

    stateCustomers = await response.json();

    applyFiltersAndRender();
    await updateDashboardStats();
    await renderRecentPayments();
  } catch (error) {
    console.error('Error loading utang data:', error);
  }
}

// ===== 2. MODAL SETUP =====
export function initUtangModals() {
  const toggleModal = (modalId, show = true) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      const form = modal.querySelector('form');
      if (form) resetForm(form);
    }
  };

  const resetForm = (form) => {
    form.reset();
    const errorMsg = form.querySelector('[id$="-error-msg"]');
    if (errorMsg) errorMsg.classList.add('hidden');
  };

  // ADD CUSTOMER FORM
  const addForm = document.getElementById('add-customer-form');
  if (addForm) {
    addForm.onsubmit = async (e) => {
      e.preventDefault();

      const name = document.getElementById('customer-name')?.value.trim();
      const phone = document.getElementById('customer-phone')?.value.trim();
      const email = document.getElementById('customer-email')?.value.trim();
      const initialUtang = parseFloat(document.getElementById('customer-utang-amount')?.value || 0);

      try {
        const response = await fetch('/api/utang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, initialUtang }),
        });

        if (response.ok) {
          await fetchUtangData();
          toggleModal('add-customer-modal', false);
        } else {
          const err = await response.json();
          alert(err.error || 'Failed to add customer');
        }
      } catch (error) {
        console.error('Error adding customer:', error);
      }
    };
  }

  // RECORD PAYMENT FORM
  const paymentForm = document.getElementById('record-payment-form');
  if (paymentForm) {
    paymentForm.onsubmit = async (e) => {
      e.preventDefault();

      const customerId = document.getElementById('payment-customer-id')?.value;
      const amountPaid = parseFloat(document.getElementById('payment-amount')?.value || 0);

      if (!amountPaid || amountPaid <= 0) return;

      try {
        const response = await fetch(`/api/utang/${customerId}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amountPaid }),
        });

        if (response.ok) {
          await fetchUtangData();
          toggleModal('record-payment-modal', false);
        } else {
          const err = await response.json();
          alert(err.error || 'Failed to record payment');
        }
      } catch (error) {
        console.error('Error recording payment:', error);
      }
    };
  }

  const debtForm = document.getElementById('add-debt-form');
if (debtForm) {
  debtForm.onsubmit = async (e) => {
    e.preventDefault();

    const customerId = document.getElementById('debt-customer-id')?.value;
    const amount = parseFloat(document.getElementById('debt-amount')?.value || 0);

    if (!amount || amount <= 0) return;

    try {
      const response = await fetch(`/api/utang/${customerId}/debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        await fetchUtangData();
        toggleModal('add-debt-modal', false);
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to add utang');
      }
    } catch (error) {
      console.error('Error adding debt:', error);
    }
  };
}

  // Open Modal Helpers
  window.openRecordPaymentModal = (customerId) => {
    const customer = stateCustomers.find((c) => String(c.id) === String(customerId));
    if (!customer) return;

    document.getElementById('payment-customer-id').value = customer.id;
    document.getElementById('payment-customer-name').value = customer.name;
    document.getElementById('payment-current-balance').textContent =
      `₱ ${customer.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    toggleModal('record-payment-modal', true);
  };

  window.openAddDebtModal = (customerId) => {
    const customer = stateCustomers.find((c) => String(c.id) === String(customerId));
    if (!customer) return;
  
    document.getElementById('debt-customer-id').value = customer.id;
    document.getElementById('debt-customer-name').value = customer.name;
    document.getElementById('debt-current-balance').textContent =
      `₱ ${customer.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    toggleModal('add-debt-modal', true);
  };

  window.openCustomerDetailsModal = (customerId) => {
    const customer = stateCustomers.find((c) => String(c.id) === String(customerId));
    if (!customer) return;

    document.getElementById('modal-customer-name').textContent = customer.name;
    document.getElementById('modal-customer-phone').textContent = customer.phone || 'N/A';
    document.getElementById('modal-customer-id').textContent = `CUST-${String(customer.id).padStart(3, '0')}`;

    document.getElementById('modal-total-debt').textContent =
      customer.totalDebt.toLocaleString('en-PH', { minimumFractionDigits: 2 });
    document.getElementById('modal-total-paid').textContent =
      customer.totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 });
    document.getElementById('modal-remaining-balance').textContent =
      customer.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 });

    const historyContainer = document.getElementById('modal-payment-history-list');
    if (historyContainer) {
      if (!customer.payments || customer.payments.length === 0) {
        historyContainer.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No payments recorded yet.</div>`;
      } else {
        historyContainer.innerHTML = customer.payments.map((p) => `
          <div class="p-2.5 flex justify-between items-center text-xs">
            <div>
              <p class="font-semibold text-slate-800">Partial Payment</p>
              <p class="text-[10px] text-slate-400">${new Date(p.date).toLocaleDateString('en-PH')}</p>
            </div>
            <span class="font-bold text-green-600">+ ₱ ${p.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
        `).join('');
      }
    }

    toggleModal('view-details-modal', true);
  };

  // Button Action Listeners
  document.getElementById('open-add-customer-modal-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleModal('add-customer-modal', true);
  });
  document.getElementById('close-add-customer-modal-btn')?.addEventListener('click', () => toggleModal('add-customer-modal', false));
  document.getElementById('close-record-payment-btn')?.addEventListener('click', () => toggleModal('record-payment-modal', false));
  document.getElementById('close-customer-details-btn')?.addEventListener('click', () => toggleModal('view-details-modal', false));
  document.getElementById('open-customer-all-payment-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleModal('view-all-payment-modal', true);
  });
  document.getElementById('close-customer-all-payment-btn')?.addEventListener('click', () => toggleModal('view-all-payment-modal', false));

  document.getElementById('close-add-debt-btn')?.addEventListener('click', () => toggleModal('add-debt-modal', false));

  document.getElementById('open-paid-history-modal-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderPaidHistoryModal();
    toggleModal('paid-history-modal', true);
  });
  document.getElementById('close-paid-history-modal-btn')?.addEventListener('click', () => toggleModal('paid-history-modal', false));

  attachCardActionListeners();
  attachSearchAndFilterListeners();
}

// ===== 3. RENDER CUSTOMER CARDS =====
export function renderCustomerCards(customerList) {
  const container = document.getElementById('customer-list-container');
  if (!container) return;

  if (!customerList || customerList.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 border border-dashed rounded-2xl">No customer records found.</div>`;
    return;
  }

  const statusBadge = (status) => {
    const map = {
      current: 'bg-green-200 text-green-800',
      overdue: 'bg-orange-200 text-orange-800',
      critical: 'bg-red-200 text-red-800',
      paid: 'bg-slate-200 text-slate-600',
    };
    return map[status] || 'bg-green-200 text-green-800';
  };

  container.innerHTML = customerList.map((customer) => {
      const initials = customer.name ? customer.name.substring(0, 2).toUpperCase() : 'NA';
    
      // BAGO: I-determine ang Add Utang button state
      const canAddDebt = customer.status === 'current' || customer.status === 'paid';
      const addUtangButton = canAddDebt
        ? `<button data-action="add-debt" data-id="${customer.id}" class="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-green-700 transition">+ Add Utang</button>`
        : `<button disabled class="flex-1 bg-slate-200 text-slate-400 py-2 rounded-xl text-xs font-semibold cursor-not-allowed" title="Bayaran muna ang utang bago ulit umutang">
             ${customer.status === 'critical' ? 'Bawal umutang' : 'Bayaran muna'}
           </button>`;
    
      return `
        <div class="border border-secondary shadow-xl bg-boxes rounded-2xl p-5" data-customer-id="${customer.id}">
          <div class="flex flex-row justify-between items-center border-b border-secondary/20 pb-4">
            <div class="flex flex-row items-center">
              <div class="w-10 h-10 flex items-center justify-center text-secondary font-bold bg-green-200 rounded-full shrink-0 text-sm">
                ${initials}
              </div>
              <div class="ml-3">
                <h3 class="font-bold text-base text-slate-800">${customer.name}</h3>
                <p class="text-secondary/80 text-xs">${customer.phone || 'No phone'}</p>
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-xl text-xs font-semibold ${statusBadge(customer.status)}">
              ${customer.status}${customer.status === 'critical' ? ' — Bawal umutang/bumili' : ''}
            </span>
          </div>
    
          <div class="mt-4 flex flex-row justify-between items-center">
            <div><p class="text-xs text-slate-400">Total Debt</p><h1 class="text-sm font-bold text-red-600">₱ ${customer.totalDebt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</h1></div>
            <div><p class="text-xs text-slate-400">Paid</p><h1 class="text-sm font-bold text-green-600">₱ ${customer.totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</h1></div>
            <div><p class="text-xs text-slate-400">Balance</p><h1 class="text-sm font-bold text-slate-800">₱ ${customer.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</h1></div>
          </div>
    
          <div class="mt-4 flex gap-2">
            ${addUtangButton}
            <button data-action="record-payment" data-id="${customer.id}" class="flex-1 bg-secondary text-primary py-2 rounded-xl text-xs font-semibold">Record Payment</button>
            <button data-action="view-details" data-id="${customer.id}" class="flex-1 border border-secondary text-secondary py-2 rounded-xl text-xs font-semibold">View Details</button>
          </div>
        </div>
      `;
    }).join('');
}

function renderPaidHistoryModal() {
  const container = document.getElementById('paid-history-list-container');
  if (!container) return;

  const paidCustomers = stateCustomers.filter((c) => c.status === 'paid');

  if (paidCustomers.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">Wala pang fully paid na customer.</div>`;
    return;
  }

  container.innerHTML = paidCustomers.map((customer) => {
    const lastPayment = customer.payments?.[0];
    const lastPaymentDate = lastPayment ? new Date(lastPayment.date).toLocaleDateString('en-PH') : 'N/A';

    return `
      <div class="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition" data-action="view-details" data-id="${customer.id}">
        <div>
          <p class="font-semibold text-slate-800 text-sm">${customer.name}</p>
          <p class="text-xs text-slate-400">${customer.phone || 'No phone'} • Huling bayad: ${lastPaymentDate}</p>
        </div>
        <div class="text-right">
          <span class="font-bold text-green-600 text-sm">₱ ${customer.totalDebt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          <p class="text-[10px] text-slate-400">Fully Paid</p>
        </div>
      </div>
    `;
  }).join('');

  // Pwedeng i-click para makita ang buong history (gagamit ng existing modal)
  container.querySelectorAll('[data-action="view-details"]').forEach((el) => {
    el.addEventListener('click', () => {
      window.openCustomerDetailsModal(el.getAttribute('data-id'));
    });
  });
}

function statusBadge(status) {
  const map = {
    current: 'bg-green-200 text-green-800',
    overdue: 'bg-orange-200 text-orange-800',
    critical: 'bg-red-200 text-red-800',
    paid: 'bg-slate-200 text-slate-600',
  };
  return map[status] || 'bg-green-200 text-green-800';
}

function attachCardActionListeners() {
  const container = document.getElementById('customer-list-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const target = e.target.closest('button[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    const customerId = target.getAttribute('data-id');

    if (action === 'add-debt') window.openAddDebtModal(customerId);   // ← BAGO
    if (action === 'record-payment') window.openRecordPaymentModal(customerId);
    if (action === 'view-details') window.openCustomerDetailsModal(customerId);
  });
}

function attachSearchAndFilterListeners() {
  const searchInput = document.querySelector('input[placeholder="Search customer..."]');
  const filterDropdown = document.getElementById('timeframe');

  searchInput?.addEventListener('input', applyFiltersAndRender);
  filterDropdown?.addEventListener('change', applyFiltersAndRender);
}

function applyFiltersAndRender() {
  const searchInput = document.querySelector('input[placeholder="Search customer..."]');
  const filterDropdown = document.getElementById('timeframe');

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedCategory = filterDropdown ? filterDropdown.value.toLowerCase() : 'all categories';

  let filtered = stateCustomers.filter((customer) => {
    // BAGO: itago ang fully paid customers sa listahan
    if (customer.status === 'paid') return false;

    const matchesSearch =
      customer.name.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query);

    let matchesCategory = true;
    if (selectedCategory === 'current') matchesCategory = customer.status === 'current';
    if (selectedCategory === 'overdue') matchesCategory = customer.status === 'overdue';
    if (selectedCategory === 'critical') matchesCategory = customer.status === 'critical';

    return matchesSearch && matchesCategory;
  });

  renderCustomerCards(filtered);
}

// ===== 4. DASHBOARD STATS (mula sa /api/utang/stats) =====
async function updateDashboardStats() {
  try {
    const response = await fetch('/api/utang/stats', { cache: 'no-store' });
    if (!response.ok) return;

    const stats = await response.json();

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('utang-total-utang', `₱ ${stats.totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
    setText('utang-total-paid', `₱ ${stats.totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
    setText('utang-overdue-accounts', stats.overdueCount);
    setText('utang-total-balance', `₱ ${stats.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
    setText('prev-utang-customer', stats.totalCustomers);
  } catch (error) {
    console.error('Error loading utang stats:', error);
  }
}

// ===== 5. RECENT PAYMENTS (mula sa /api/utang/payments/recent) =====
async function renderRecentPayments() {
  const container = document.getElementById('utang-transaction');
  if (!container) return;

  try {
    const response = await fetch('/api/utang/payments/recent', { cache: 'no-store' });
    if (!response.ok) return;

    const payments = await response.json();

    if (payments.length === 0) {
      container.innerHTML = `<p class="text-slate-400 text-xs my-4">No payments recorded yet.</p>`;
      return;
    }

    const latest = payments[0];
    container.innerHTML = `
      <div>
        <h3 class="font-semibold text-base">${latest.customerName}</h3>
        <div class="flex justify-between items-center border-b border-secondary/20 pb-2">
          <p class="text-xs text-secondary/70">${new Date(latest.date).toLocaleDateString('en-PH')}</p>
          <h3 class="text-green-600 font-bold text-base">₱ ${latest.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>
    `;

    // Ipopulate din ang "View All Payments" modal
    const allContainer = document.getElementById('all-payments-list-container');
    if (allContainer) {
      allContainer.innerHTML = payments.map((p) => `
        <div class="p-3 flex justify-between items-center text-sm">
          <div>
            <p class="font-semibold text-slate-800">${p.customerName}</p>
            <p class="text-xs text-slate-400">${new Date(p.date).toLocaleString('en-PH')}</p>
          </div>
          <span class="font-bold text-green-600">+ ₱ ${p.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading recent payments:', error);
  }
}