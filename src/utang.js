// utang.js

// Global state variable to hold fetched customer data
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
    
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.classList.remove('border-rose-500');
      input.classList.add('border-slate-200');
    });
  };

  // 1. ADD CUSTOMER FORM SUBMIT
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
        name, 
        phone, 
        email, 
        status: 'current',
        daysOverdue: 0,
        totalDebt: initialUtang, 
        totalPaid: 0,
        payments: [] 
      };

      try {
        stateCustomers.unshift(payload);
        applyFiltersAndRender();
        updateDashboardStats(stateCustomers);
        
        toggleModal('add-customer-modal', false);
      } catch (err) {
        console.error(err);
      }
    };
  }

  // 2. RECORD PAYMENT FORM SUBMIT
  const paymentForm = document.getElementById('record-payment-form');
  if (paymentForm) {
    paymentForm.onsubmit = async (e) => {
      e.preventDefault();
      
      const customerId = document.getElementById('payment-customer-id')?.value;
      const amountPaid = parseFloat(document.getElementById('payment-amount')?.value || 0);
      const paymentErrorMsg = document.getElementById('payment-error-msg');

      if (!amountPaid || amountPaid <= 0) {
        if (paymentErrorMsg) paymentErrorMsg.classList.remove('hidden');
        return;
      }

      const customer = stateCustomers.find(c => (c.id || c._id) === customerId);

      if (customer) {
        const balance = customer.totalDebt - customer.totalPaid;
        
        if (amountPaid > balance) {
          alert("Payment amount cannot exceed remaining balance.");
          return;
        }

        // 1. Update totalPaid
        customer.totalPaid += amountPaid;

        // 2. Auto status update kapag cleared na
        if (customer.totalPaid >= customer.totalDebt) {
          customer.status = 'paid';
          customer.daysOverdue = 0;
        }

        // 3. Record payment transaction
        if (!customer.payments) customer.payments = [];
        customer.payments.unshift({
          amount: amountPaid,
          date: new Date().toISOString()
        });

        // 4. Update UI
        applyFiltersAndRender();
        updateDashboardStats(stateCustomers);
        toggleModal('record-payment-modal', false);
      }
    };
  }

  // Modal Openers
  window.openRecordPaymentModal = (customerId) => {
    const customer = stateCustomers.find(c => (c.id || c._id) === customerId);
    if (!customer) return;

    const balance = (customer.totalDebt || 0) - (customer.totalPaid || 0);

    document.getElementById('payment-customer-id').value = customer.id || customer._id;
    document.getElementById('payment-customer-name').value = customer.name;
    document.getElementById('payment-current-balance').textContent = `₱ ${balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    toggleModal('record-payment-modal', true);
  };

  window.openCustomerDetailsModal = (customerId) => {
    const customer = stateCustomers.find(c => (c.id || c._id) === customerId);
    if (!customer) return;

    const balance = (customer.totalDebt || 0) - (customer.totalPaid || 0);

    document.getElementById('modal-customer-name').textContent = customer.name;
    document.getElementById('modal-customer-phone').innerHTML = `<i class="fa-solid fa-phone text-xs"></i> ${customer.phone || 'N/A'}`;
    document.getElementById('modal-customer-id').textContent = customer.id || customer._id;
    
    document.getElementById('modal-total-debt').textContent = (customer.totalDebt || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    document.getElementById('modal-total-paid').textContent = (customer.totalPaid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    document.getElementById('modal-remaining-balance').textContent = balance.toLocaleString('en-PH', { minimumFractionDigits: 2 });

    // Render Dynamic Payment History
    const historyContainer = document.getElementById('modal-payment-history-list');
    if (historyContainer) {
      if (!customer.payments || customer.payments.length === 0) {
        historyContainer.innerHTML = `
          <div class="p-6 text-center text-xs text-slate-400">
            No payments recorded yet for this customer.
          </div>
        `;
      } else {
        historyContainer.innerHTML = customer.payments.map(payment => {
          const dateStr = new Date(payment.date).toLocaleDateString('en-US', {
            month: 'short', day: '2-digit', year: 'numeric'
          });
          const timeStr = new Date(payment.date).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
          });

          return `
            <div class="p-3 flex justify-between items-center hover:bg-slate-50/50 transition">
              <div class="flex items-center gap-3">
                <div class="bg-green-100 text-green-700 p-2 rounded-lg">
                  <i class="fa-solid fa-arrow-down-left text-xs"></i>
                </div>
                <div>
                  <p class="text-xs font-semibold text-slate-800">Partial Payment</p>
                  <p class="text-[11px] text-slate-400">${dateStr} • ${timeStr}</p>
                </div>
              </div>
              <span class="text-sm font-bold text-green-600">+ ₱ ${(payment.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          `;
        }).join('');
      }
    }

    toggleModal('view-details-modal', true);
  };

  // Static Button Modal Listeners
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

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('fixed') && e.target.id.endsWith('-modal')) {
      toggleModal(e.target.id, false);
    }
  });

  // Attach dynamic event delegation for rendered list buttons
  attachCardActionListeners();
  // Attach search and filter event listeners
  attachSearchAndFilterListeners();
}

// Render dynamic customer cards list
export function renderCustomerCards(customerList) {
  const container = document.getElementById('customer-list-container');
  if (!container) return;

  if (!customerList || customerList.length === 0) {
    container.innerHTML = `
      <div class="border border-secondary/30 bg-boxes rounded-2xl p-8 text-center text-secondary/60">
        <i class="fa-solid fa-user-slash text-2xl mb-2"></i>
        <p>No customer records found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = customerList.map(customer => {
    const initials = customer.name
      ? customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'NA';

    const statusLower = customer.status?.toLowerCase();
    const isOverdue = statusLower === 'overdue';
    const isPaid = statusLower === 'paid';

    let statusBg = 'bg-green-200 border-green-800 text-green-800';
    if (isOverdue) statusBg = 'bg-orange-200 border-orange-800 text-orange-800';
    if (isPaid) statusBg = 'bg-blue-200 border-blue-800 text-blue-800';

    const daysOverdueText = isOverdue 
      ? `<p class="text-sm text-red-800"><i class="fa-regular fa-clock"></i> <span>${customer.daysOverdue || 0}</span> days overdue</p>`
      : `<p class="text-sm text-slate-500"><i class="fa-regular fa-circle-check"></i> Up to date</p>`;

    const totalDebt = (customer.totalDebt || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const totalPaid = (customer.totalPaid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const balance = ((customer.totalDebt || 0) - (customer.totalPaid || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 });

    return `
      <div class="border border-secondary shadow-xl bg-boxes rounded-2xl p-5 hover:border-slate-400 transition" data-customer-id="${customer._id || customer.id}">
        
        <!-- Header -->
        <div class="flex flex-row justify-between items-center border-b border-secondary pb-5">
          <div class="flex flex-row items-center">
            <div class="w-12 h-12 flex items-center justify-center text-secondary text-lg font-bold bg-green-200 rounded-full shrink-0">
              <span>${initials}</span>
            </div>
            <div class="ml-3">
              <h3 class="font-bold text-lg text-slate-800">${customer.name}</h3>
              <p class="text-secondary/80 text-sm">${customer.phone || 'No phone provided'}</p>

              <div class="flex flex-row gap-3 mt-2 items-center">
                <p class="utang-classified border px-2.5 py-0.5 rounded-2xl text-xs font-semibold ${statusBg}">
                  <span>${customer.status || 'current'}</span>
                </p>
                ${daysOverdueText}
              </div>
            </div>
          </div>

          <button class="p-2 text-secondary hover:text-slate-800 transition" aria-label="Customer options">
            <i class="fa-solid fa-ellipsis-vertical text-lg"></i>
          </button>
        </div>

        <!-- Totals Row -->
        <div class="mt-4">
          <div class="flex flex-row justify-between items-center">
            <div>
              <p class="text-secondary/80 text-xs">Total Debt</p>
              <h1 class="text-lg font-bold text-red-600">₱ ${totalDebt}</h1>
            </div>
            <div>
              <p class="text-secondary/80 text-xs">Paid</p>
              <h1 class="text-lg font-bold text-green-600">₱ ${totalPaid}</h1>
            </div>
            <div>
              <p class="text-secondary/80 text-xs">Balance</p>
              <h1 class="text-lg font-bold text-slate-800">₱ ${balance}</h1>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-5">
          <div class="flex flex-row gap-3 justify-between items-center">
            <button data-action="record-payment" data-id="${customer._id || customer.id}" class="flex-1 bg-secondary font-semibold text-primary py-2.5 rounded-xl hover:bg-primary transition border border-secondary hover:text-secondary text-center text-sm">Record Payment</button>
            <button data-action="view-details" data-id="${customer._id || customer.id}" class="flex-1 text-secondary font-semibold border border-secondary hover:bg-secondary transition hover:text-primary py-2.5 rounded-xl text-center text-sm">View Details</button>
          </div>
        </div>

      </div>
    `;
  }).join('');
}

// Event Delegation for Dynamic Action Buttons inside customer cards
function attachCardActionListeners() {
  const container = document.getElementById('customer-list-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const target = e.target.closest('button[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    const customerId = target.getAttribute('data-id');

    if (action === 'record-payment') {
      window.openRecordPaymentModal(customerId);
    } else if (action === 'view-details') {
      window.openCustomerDetailsModal(customerId);
    }
  });
}

// Search and Filter Handlers
function attachSearchAndFilterListeners() {
  const searchInput = document.querySelector('input[placeholder="Search customer..."]');
  const filterDropdown = document.getElementById('timeframe');

  if (searchInput) {
    searchInput.addEventListener('input', applyFiltersAndRender);
  }

  if (filterDropdown) {
    filterDropdown.addEventListener('change', applyFiltersAndRender);
  }
}

function applyFiltersAndRender() {
  const searchInput = document.querySelector('input[placeholder="Search customer..."]');
  const filterDropdown = document.getElementById('timeframe');

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedCategory = filterDropdown ? filterDropdown.value.toLowerCase() : 'all categories';

  let filtered = stateCustomers.filter(customer => {
    const matchesName = customer.name.toLowerCase().includes(query);
    const matchesPhone = customer.phone ? customer.phone.toLowerCase().includes(query) : false;
    const matchesSearch = matchesName || matchesPhone;

    let matchesCategory = true;
    if (selectedCategory === 'current') {
      matchesCategory = customer.status?.toLowerCase() === 'current';
    } else if (selectedCategory === 'overdue') {
      matchesCategory = customer.status?.toLowerCase() === 'overdue';
    } else if (selectedCategory === 'critical') {
      matchesCategory = customer.status?.toLowerCase() === 'overdue' && (customer.daysOverdue || 0) >= 7;
    }

    return matchesSearch && matchesCategory;
  });

  renderCustomerCards(filtered);
}

// Stat Card Counter Updates
function updateDashboardStats(customers) {
  let totalUtang = 0;
  let totalPaid = 0;
  let overdueCount = 0;

  customers.forEach(c => {
    totalUtang += c.totalDebt || 0;
    totalPaid += c.totalPaid || 0;
    if (c.status?.toLowerCase() === 'overdue') overdueCount++;
  });

  const balance = totalUtang - totalPaid;

  const statCards = document.querySelectorAll('#utang-dashboard .grid-cols-2 > div');
  if (statCards.length >= 4) {
    statCards[0].querySelector('h1 span').textContent = `₱ ${totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    statCards[0].querySelector('p span').textContent = customers.length;

    statCards[1].querySelector('h1 span').textContent = `₱ ${totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    statCards[2].querySelector('h1 span').textContent = overdueCount;

    statCards[3].querySelector('h1 span').textContent = `₱ ${balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  }
}

// Fetch Initial Data
export async function fetchUtangData() {
  try {
    const mockCustomers = [
      {
        id: 'CUST-001',
        name: 'John Doe',
        phone: '0912-345-6789',
        status: 'overdue',
        daysOverdue: 3,
        totalDebt: 1500,
        totalPaid: 500,
        payments: [
          { amount: 500, date: '2026-01-15T06:30:00.000Z' }
        ]
      },
      {
        id: 'CUST-002',
        name: 'Maria Santos',
        phone: '0998-765-4321',
        status: 'current',
        daysOverdue: 0,
        totalDebt: 2500,
        totalPaid: 2500,
        payments: [
          { amount: 2500, date: '2026-01-10T08:00:00.000Z' }
        ]
      }
    ];

    stateCustomers = mockCustomers;
    applyFiltersAndRender();
    updateDashboardStats(stateCustomers);
  } catch (error) {
    console.error('Error fetching utang data:', error);
  }
}