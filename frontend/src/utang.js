// utang.js

let stateCustomers = [];

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

  // 1. ADD CUSTOMER FORM
  const addForm = document.getElementById('add-customer-form');
  if (addForm) {
    addForm.onsubmit = async (e) => {
      e.preventDefault();

      const name = document.getElementById('customer-name')?.value.trim();
      const phone = document.getElementById('customer-phone')?.value.trim();
      const email = document.getElementById('customer-email')?.value.trim();
      const initialUtang = parseFloat(document.getElementById('customer-utang-amount')?.value || 0);

      const payload = { 
        id: `CUST-00${stateCustomers.length + 1}`,
        _id: `cust_db_${Date.now()}`,
        name, 
        phone, 
        email, 
        status: 'current',
        daysOverdue: 0,
        totalDebt: initialUtang, 
        totalPaid: 0,
        payments: [] 
      };

      stateCustomers.unshift(payload);
      applyFiltersAndRender();
      updateDashboardStats(stateCustomers);
      toggleModal('add-customer-modal', false);
    };
  }

  // 2. RECORD PAYMENT FORM
  const paymentForm = document.getElementById('record-payment-form');
  if (paymentForm) {
    paymentForm.onsubmit = async (e) => {
      e.preventDefault();
      
      const customerId = document.getElementById('payment-customer-id')?.value;
      const amountPaid = parseFloat(document.getElementById('payment-amount')?.value || 0);

      if (!amountPaid || amountPaid <= 0) return;

      const customer = stateCustomers.find(c => (c.id === customerId || c._id === customerId));

      if (customer) {
        const balance = customer.totalDebt - customer.totalPaid;
        if (amountPaid > balance) {
          alert("Payment amount cannot exceed remaining balance.");
          return;
        }

        customer.totalPaid += amountPaid;

        if (customer.totalPaid >= customer.totalDebt) {
          customer.status = 'paid';
          customer.daysOverdue = 0;
        }

        if (!customer.payments) customer.payments = [];
        customer.payments.unshift({
          amount: amountPaid,
          date: new Date().toISOString()
        });

        applyFiltersAndRender();
        updateDashboardStats(stateCustomers);
        renderRecentPayments(stateCustomers);
        toggleModal('record-payment-modal', false);
      }
    };
  }

  // Open Modal Helpers
  window.openRecordPaymentModal = (customerId) => {
    const customer = stateCustomers.find(c => (c.id === customerId || c._id === customerId));
    if (!customer) return;

    const balance = (customer.totalDebt || 0) - (customer.totalPaid || 0);
    document.getElementById('payment-customer-id').value = customer.id || customer._id;
    document.getElementById('payment-customer-name').value = customer.name;
    document.getElementById('payment-current-balance').textContent = `₱ ${balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    toggleModal('record-payment-modal', true);
  };

  window.openCustomerDetailsModal = (customerId) => {
    const customer = stateCustomers.find(c => (c.id === customerId || c._id === customerId));
    if (!customer) return;

    const balance = (customer.totalDebt || 0) - (customer.totalPaid || 0);
    document.getElementById('modal-customer-name').textContent = customer.name;
    document.getElementById('modal-customer-phone').textContent = customer.phone || 'N/A';
    document.getElementById('modal-customer-id').textContent = customer.id || customer._id;
    
    document.getElementById('modal-total-debt').textContent = (customer.totalDebt || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    document.getElementById('modal-total-paid').textContent = (customer.totalPaid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    document.getElementById('modal-remaining-balance').textContent = balance.toLocaleString('en-PH', { minimumFractionDigits: 2 });

    const historyContainer = document.getElementById('modal-payment-history-list');
    if (historyContainer) {
      if (!customer.payments || customer.payments.length === 0) {
        historyContainer.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No payments recorded yet.</div>`;
      } else {
        historyContainer.innerHTML = customer.payments.map(p => `
          <div class="p-2.5 flex justify-between items-center text-xs">
            <div>
              <p class="font-semibold text-slate-800">Partial Payment</p>
              <p class="text-[10px] text-slate-400">${new Date(p.date).toLocaleDateString()}</p>
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

  attachCardActionListeners();
  attachSearchAndFilterListeners();
}

export function renderCustomerCards(customerList) {
  const container = document.getElementById('customer-list-container');
  if (!container) return;

  if (!customerList || customerList.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 border border-dashed rounded-2xl">No customer records found.</div>`;
    return;
  }

  container.innerHTML = customerList.map(customer => {
    const initials = customer.name ? customer.name.substring(0, 2).toUpperCase() : 'NA';
    const totalDebt = (customer.totalDebt || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const totalPaid = (customer.totalPaid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const balance = ((customer.totalDebt || 0) - (customer.totalPaid || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const custId = customer.id || customer._id;

    return `
      <div class="border border-secondary shadow-xl bg-boxes rounded-2xl p-5" data-customer-id="${custId}">
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
          <span class="px-2.5 py-0.5 rounded-xl text-xs font-semibold ${customer.status === 'overdue' ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}">
            ${customer.status || 'current'}
          </span>
        </div>

        <div class="mt-4 flex flex-row justify-between items-center">
          <div><p class="text-xs text-slate-400">Total Debt</p><h1 class="text-sm font-bold text-red-600">₱ ${totalDebt}</h1></div>
          <div><p class="text-xs text-slate-400">Paid</p><h1 class="text-sm font-bold text-green-600">₱ ${totalPaid}</h1></div>
          <div><p class="text-xs text-slate-400">Balance</p><h1 class="text-sm font-bold text-slate-800">₱ ${balance}</h1></div>
        </div>

        <div class="mt-4 flex gap-2">
          <button data-action="record-payment" data-id="${custId}" class="flex-1 bg-secondary text-primary py-2 rounded-xl text-xs font-semibold">Record Payment</button>
          <button data-action="view-details" data-id="${custId}" class="flex-1 border border-secondary text-secondary py-2 rounded-xl text-xs font-semibold">View Details</button>
        </div>
      </div>
    `;
  }).join('');
}

function attachCardActionListeners() {
  const container = document.getElementById('customer-list-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const target = e.target.closest('button[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    const customerId = target.getAttribute('data-id');

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

  let filtered = stateCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(query) || customer.phone?.toLowerCase().includes(query);
    let matchesCategory = true;

    if (selectedCategory === 'current') matchesCategory = customer.status === 'current';
    if (selectedCategory === 'overdue') matchesCategory = customer.status === 'overdue';

    return matchesSearch && matchesCategory;
  });

  renderCustomerCards(filtered);
}

function updateDashboardStats(customers) {
  let totalUtang = 0, totalPaid = 0, overdueCount = 0;

  customers.forEach(c => {
    totalUtang += c.totalDebt || 0;
    totalPaid += c.totalPaid || 0;
    if (c.status === 'overdue') overdueCount++;
  });

  const balance = totalUtang - totalPaid;

  const totalUtangEl = document.getElementById('utang-total-utang');
  const totalPaidEl = document.getElementById('utang-total-paid');
  const overdueEl = document.getElementById('utang-overdue-accounts');
  const totalBalanceEl = document.getElementById('utang-total-balance');

  if (totalUtangEl) totalUtangEl.textContent = `₱ ${totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  if (totalPaidEl) totalPaidEl.textContent = `₱ ${totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  if (overdueEl) overdueEl.textContent = overdueCount;
  if (totalBalanceEl) totalBalanceEl.textContent = `₱ ${balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function renderRecentPayments(customers) {
  const container = document.getElementById('utang-transaction');
  if (!container) return;

  const allPayments = [];
  customers.forEach(c => {
    (c.payments || []).forEach(p => {s
      allPayments.push({ customerName: c.name, amount: p.amount, date: new Date(p.date) });
    });
  });

  allPayments.sort((a, b) => b.date - a.date);

  if (allPayments.length === 0) {
    container.innerHTML = `<p class="text-slate-400 text-xs my-4">No payments recorded yet.</p>`;
    return;
  }

  const latest = allPayments[0];
  container.innerHTML = `
    <div>
      <h3 class="font-semibold text-base">${latest.customerName}</h3>
      <div class="flex justify-between items-center border-b border-secondary/20 pb-2">
        <p class="text-xs text-secondary/70">${latest.date.toLocaleDateString()}</p>
        <h3 class="text-green-600 font-bold text-base">₱ ${latest.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</h3>
      </div>
    </div>
  `;
}

export async function fetchUtangData() {
  stateCustomers = [
    {
      id: 'CUST-001',
      _id: 'cust_001',
      name: 'John Doe',
      phone: '0912-345-6789',
      status: 'overdue',
      daysOverdue: 3,
      totalDebt: 1500,
      totalPaid: 500,
      payments: [{ amount: 500, date: '2026-01-15T06:30:00.000Z' }]
    },
    {
      id: 'CUST-002',
      _id: 'cust_002',
      name: 'Maria Santos',
      phone: '0998-765-4321',
      status: 'current',
      daysOverdue: 0,
      totalDebt: 2500,
      totalPaid: 2500,
      payments: [{ amount: 2500, date: '2026-01-10T08:00:00.000Z' }]
    }
  ];

  applyFiltersAndRender();
  updateDashboardStats(stateCustomers);
  renderRecentPayments(stateCustomers);
}