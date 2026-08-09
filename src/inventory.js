// src/inventory-modals.js

export function initInventoryModals() {

  // --- ADD PRODUCT MODAL ---
  const openAddBtn = document.getElementById('open-add-product-btn');
  const closeAddBtn = document.getElementById('close-add-modal-btn');
  const cancelAddBtn = document.getElementById('cancel-add-modal-btn');
  const addForm = document.getElementById('add-product-form');

  const toggleModal = (modalId, show = true) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  if (openAddBtn) openAddBtn.onclick = () => toggleModal('add-product-modal', true);
  if (closeAddBtn) closeAddBtn.onclick = () => toggleModal('add-product-modal', false);
  if (cancelAddBtn) cancelAddBtn.onclick = () => toggleModal('add-product-modal', false);

  if (addForm) {
    addForm.onsubmit = (e) => {
      e.preventDefault();
      const newProduct = {
        name: document.getElementById('add-product-name').value,
        category: document.getElementById('add-product-category').value,
        price: parseFloat(document.getElementById('add-product-price').value),
        stock: 0, // Automatic 0 initial stock
        status: 'Out of Stock' // Automatic initial status
      };

      console.log('Product to Save:', newProduct);
      // Dito tatawagin ang frontend list updater or future Supabase service
      
      addForm.reset();
      toggleModal('add-product-modal', false);
    };
  }

  // --- EDIT PRODUCT MODAL ---
  const openEditBtn = document.getElementById('open-edit-product-btn');
  const closeEditBtn = document.getElementById('close-edit-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-modal-btn');
  const editForm = document.getElementById('edit-product-form');

  if (openEditBtn) openEditBtn.onclick = () => toggleModal('edit-product-modal', true);
  if (closeEditBtn) closeEditBtn.onclick = () => toggleModal('edit-product-modal', false);
  if (cancelEditBtn) cancelEditBtn.onclick = () => toggleModal('edit-product-modal', false);

  // Function para buksan at lagyan ng kasalukuyang data ang Edit Modal
  window.openEditProductModal = (product) => {
    document.getElementById('edit-product-id').value = product.id || '';
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-category').value = product.category;
    document.getElementById('edit-product-price').value = product.price;

    toggleModal('edit-product-modal', true);
  };

  if (editForm) {
    editForm.onsubmit = (e) => {
      e.preventDefault();
      const updatedProduct = {
        id: document.getElementById('edit-product-id').value,
        name: document.getElementById('edit-product-name').value,
        category: document.getElementById('edit-product-category').value,
        price: parseFloat(document.getElementById('edit-product-price').value)
      };

      console.log('Updated Product:', updatedProduct);
      toggleModal('edit-product-modal', false);
    };
  }

  // --- DELETE PRODUCT MODAL ---
  const openDeleteBtn = document.getElementById('open-delete-product-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-modal-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  let targetDeleteId = null;

  if (cancelDeleteBtn) cancelDeleteBtn.onclick = () => toggleModal('delete-product-modal', false);
  if (openDeleteBtn) openDeleteBtn.onclick = () => toggleModal('delete-product-modal', true);
  
  window.openDeleteProductModal = (productId) => {
    targetDeleteId = productId;
    toggleModal('delete-product-modal', true);
  };

  if (confirmDeleteBtn) {
    confirmDeleteBtn.onclick = () => {
      console.log('Deleting Product ID:', targetDeleteId);
      // Logic para alisin ang row sa UI / DB
      toggleModal('delete-product-modal', false);
    };
  }

  // Backdrop click listener
  window.addEventListener('click', (e) => {
    if (e.target.id === 'add-product-modal') toggleModal('add-product-modal', false);
    if (e.target.id === 'edit-product-modal') toggleModal('edit-product-modal', false);
    if (e.target.id === 'delete-product-modal') toggleModal('delete-product-modal', false);
  });
}