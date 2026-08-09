export function initUtangModals() {
  
  // Generic helper function para magbukas/magsara ng kahit anong modal
  const toggleModal = (modalId, show = true) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      
      // Auto reset ng form kapag isinara
      const form = modal.querySelector('form');
      if (form) resetForm(form);
    }
  };

  // Helper para linisin ang inputs at validation colors
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

  // ==========================================
  // 1. ADD CUSTOMER MODAL
  // ==========================================
  const openAddBtn = document.getElementById('open-add-customer-modal-btn');
  const closeAddBtn = document.getElementById('close-add-customer-modal-btn');
  const addForm = document.getElementById('add-customer-form');
  const addErrorMsg = document.getElementById('form-error-msg');

  if (openAddBtn) openAddBtn.onclick = (e) => {
    e.preventDefault();
    toggleModal('add-customer-modal', true);
  };
  if (closeAddBtn) closeAddBtn.onclick = () => toggleModal('add-customer-modal', false);

  if (addForm) {
    addForm.onsubmit = (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('customer-name');
      const phoneInput = document.getElementById('customer-phone');
      const emailInput = document.getElementById('customer-email');
      const amountInput = document.getElementById('customer-amount');

      const inputs = [nameInput, phoneInput, emailInput, amountInput];
      let isValid = true;

      inputs.forEach((input) => {
        if (!input || !input.value.trim()) {
          isValid = false;
          input.classList.remove('border-slate-200');
          input.classList.add('border-rose-500');
        } else {
          input.classList.remove('border-rose-500');
          input.classList.add('border-slate-200');
        }
      });

      if (!isValid) {
        if (addErrorMsg) addErrorMsg.classList.remove('hidden');
        return;
      }

      if (addErrorMsg) addErrorMsg.classList.add('hidden');
      alert('Customer added successfully!');
      toggleModal('add-customer-modal', false);
    };
  }

  // ==========================================
  // 2. RECORD PAYMENT MODAL
  // ==========================================
  const openPaymentBtn = document.getElementById('open-record-payment-btn');
  const closePaymentBtn = document.getElementById('close-record-payment-btn');
  const paymentForm = document.getElementById('record-payment-form');
  const paymentErrorMsg = document.getElementById('payment-error-msg');


  if (openPaymentBtn) openPaymentBtn.onclick = (e) => {
    e.preventDefault();
    toggleModal('record-payment-modal', true);
  };
  if (closePaymentBtn) closePaymentBtn.onclick = () => toggleModal('record-payment-modal', false);

  // Global window handler para magamit mula sa dynamic table rows
  window.openRecordPaymentModal = (customerId, currentBalance) => {
    const idInput = document.getElementById('payment-customer-id');
    const balanceText = document.getElementById('payment-current-balance');

    if (idInput) idInput.value = customerId;
    if (balanceText) balanceText.textContent = `₱${parseFloat(currentBalance || 0).toFixed(2)}`;

    toggleModal('record-payment-modal', true);
  };

  if (paymentForm) {
    paymentForm.onsubmit = (e) => {
      e.preventDefault();
      const amountInput = document.getElementById('payment-amount');
      const amountPaid = amountInput ? parseFloat(amountInput.value) : 0;

      if (!amountPaid || amountPaid <= 0) {
        if (paymentErrorMsg) paymentErrorMsg.classList.remove('hidden');
        if (amountInput) amountInput.classList.add('border-rose-500');
        return;
      }

      console.log('Payment recorded:', amountPaid);
      toggleModal('record-payment-modal', false);
    };
  }

//Customer View Details
const openCustomerDetailstBtn = document.getElementById('open-customer-details-btn');
const closeCustomerDetailstBtn = document.getElementById('close-customer-details-btn');

if (openCustomerDetailstBtn) openCustomerDetailstBtn.onclick = (e) => {
  e.preventDefault();
  toggleModal('view-details-modal', true);
};
if (closeCustomerDetailstBtn) closeCustomerDetailstBtn.onclick = () => toggleModal('view-details-modal', false);

 //View All Customer Payment
  const openCustomerPaymentBtn = document.getElementById('open-customer-all-payment-btn');
  const closeCustomerPaymentBtn = document.getElementById('close-customer-all-payment-btn');

  if (openCustomerPaymentBtn) openCustomerPaymentBtn.onclick = (e) => {
    e.preventDefault();
    toggleModal('view-all-payment-modal', true);
  };
  if (closeCustomerPaymentBtn) closeCustomerPaymentBtn.onclick = () => toggleModal('view-all-payment-modal', false);


  // Back-drop click listener para isara ang kahit anong open modal
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('fixed') && e.target.id.endsWith('-modal')) {
      toggleModal(e.target.id, false);
    }
  }); 
}