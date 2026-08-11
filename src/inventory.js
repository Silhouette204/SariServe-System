// src/inventory.js

// 1. Initial State (Palitan ito ng API fetch query sa hinaharap)
let inventoryItems = [
  { id: '1', name: 'Organic Apples', category: 'Groceries', stock: 120, price: 150.00 },
  { id: '2', name: 'Coca-Cola 1.5L', category: 'Beverages', stock: 5, price: 65.00 },
  { id: '3', name: 'Piattos Cheese', category: 'Snacks', stock: 0, price: 18.00 }
];

let targetDeleteId = null;

// 2. MAIN INITIALIZER FUNCTION
export function initInventory() {
  initModals();
  renderInventoryTable(inventoryItems);
  updateKPIs(inventoryItems);
  setupSearchAndFilters();
}

// 3. HELPER: Calculate Status Badge & Style
function getStockStatus(stock) {
  if (stock === 0) {
    return {
      label: 'Out of Stock',
      class: 'bg-red-50 text-red-700 ring-red-600/20'
    };
  } else if (stock <= 10) {
    return {
      label: 'Low Stock',
      class: 'bg-orange-50 text-orange-700 ring-orange-600/20'
    };
  }
  return {
    label: 'In Stock',
    class: 'bg-green-50 text-green-700 ring-green-600/20'
  };
}

// 4. RENDER TABLE ROWS
export function renderInventoryTable(items) {
  const tbody = document.querySelector('#stocks tbody');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-slate-400">
          No products found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const status = getStockStatus(item.stock);
    return `
      <tr class="hover:bg-slate-50/50 transition">
        <td class="px-6 py-4 font-medium text-slate-900">${item.name}</td>
        <td class="px-6 py-4">${item.category}</td>
        <td class="px-6 py-4">
          <!-- Stock Adjuster Buttons -->
          <div class="flex items-center gap-2">
            <button onclick="window.adjustStock('${item.id}', -1)" class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition select-none cursor-pointer">
              −
            </button>
            <span class="w-12 text-center font-semibold text-slate-800">${item.stock}</span>
            <button onclick="window.adjustStock('${item.id}', 1)" class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition select-none cursor-pointer">
              +
            </button>
          </div>
        </td>
        <td class="px-6 py-4 font-medium">₱${Number(item.price).toFixed(2)}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.class}">
            ${status.label}
          </span>
        </td>
        <td class="px-6 py-4 text-right">
          <button onclick="window.triggerEditProduct('${item.id}')" class="text-sm font-semibold text-secondary hover:underline mr-3 cursor-pointer">Edit</button>
          <button onclick="window.triggerDeleteProduct('${item.id}')" class="text-sm font-semibold text-red-600 hover:underline cursor-pointer">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

// 5. UPDATE KPI METRICS
export function updateKPIs(items) {
  const total = items.length;
  const inStock = items.filter(i => i.stock > 10).length;
  const lowStock = items.filter(i => i.stock > 0 && i.stock <= 10).length;
  const outOfStock = items.filter(i => i.stock === 0).length;

  const kpiElements = document.querySelectorAll('#inventory-dashboard .text-2xl.font-bold span');
  if (kpiElements.length >= 4) {
    kpiElements[0].textContent = total;
    kpiElements[1].textContent = inStock;
    kpiElements[2].textContent = lowStock;
    kpiElements[3].textContent = outOfStock;
  }
}

// 6. SEARCH & CATEGORY FILTERING
function setupSearchAndFilters() {
  const searchInput = document.querySelector('#inventory-dashboard input[type="text"]');
  const categorySelect = document.querySelector('#inventory-dashboard select');

  const filterData = () => {
    const query = searchInput?.value.toLowerCase() || '';
    const selectedCategory = categorySelect?.value || 'All Categories';

    const filtered = inventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    renderInventoryTable(filtered);
  };

  if (searchInput) searchInput.addEventListener('input', filterData);
  if (categorySelect) categorySelect.addEventListener('change', filterData);
}

// 7. MODAL CONTROLLERS & EVENT LISTENERS
function initModals() {
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

  // ADD MODAL
  const openAddBtn = document.getElementById('open-add-product-btn');
  const closeAddBtn = document.getElementById('close-add-modal-btn');
  const cancelAddBtn = document.getElementById('cancel-add-modal-btn');
  const addForm = document.getElementById('add-product-form');

  if (openAddBtn) openAddBtn.onclick = () => toggleModal('add-product-modal', true);
  if (closeAddBtn) closeAddBtn.onclick = () => toggleModal('add-product-modal', false);
  if (cancelAddBtn) cancelAddBtn.onclick = () => toggleModal('add-product-modal', false);

  if (addForm) {
    addForm.onsubmit = (e) => {
      e.preventDefault();
      const newProduct = {
        id: String(Date.now()),
        name: document.getElementById('add-product-name').value,
        category: document.getElementById('add-product-category').value,
        price: parseFloat(document.getElementById('add-product-price').value),
        stock: parseInt(document.getElementById('add-product-stock').value) || 0
      };

      inventoryItems.push(newProduct);
      renderInventoryTable(inventoryItems);
      updateKPIs(inventoryItems);

      addForm.reset();
      toggleModal('add-product-modal', false);
    };
  }

  // EDIT MODAL
  const closeEditBtn = document.getElementById('close-edit-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-modal-btn');
  const editForm = document.getElementById('edit-product-form');

  if (closeEditBtn) closeEditBtn.onclick = () => toggleModal('edit-product-modal', false);
  if (cancelEditBtn) cancelEditBtn.onclick = () => toggleModal('edit-product-modal', false);

  if (editForm) {
    editForm.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-product-id').value;
      const item = inventoryItems.find(i => i.id === id);

      if (item) {
        item.name = document.getElementById('edit-product-name').value;
        item.category = document.getElementById('edit-product-category').value;
        item.price = parseFloat(document.getElementById('edit-product-price').value);

        renderInventoryTable(inventoryItems);
      }

      toggleModal('edit-product-modal', false);
    };
  }

  // DELETE MODAL
  const cancelDeleteBtn = document.getElementById('cancel-delete-modal-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  if (cancelDeleteBtn) cancelDeleteBtn.onclick = () => toggleModal('delete-product-modal', false);

  if (confirmDeleteBtn) {
    confirmDeleteBtn.onclick = () => {
      if (targetDeleteId) {
        inventoryItems = inventoryItems.filter(i => i.id !== targetDeleteId);
        renderInventoryTable(inventoryItems);
        updateKPIs(inventoryItems);
      }
      toggleModal('delete-product-modal', false);
    };
  }

  // Backdrop clicks
  window.addEventListener('click', (e) => {
    if (e.target.id === 'add-product-modal') toggleModal('add-product-modal', false);
    if (e.target.id === 'edit-product-modal') toggleModal('edit-product-modal', false);
    if (e.target.id === 'delete-product-modal') toggleModal('delete-product-modal', false);
  });
}

// 8. GLOBAL WINDOW ACTIONS (Para sa dynamic table row triggers)
window.adjustStock = (id, amount) => {
  const item = inventoryItems.find(i => i.id === id);
  if (item) {
    item.stock = Math.max(0, item.stock + amount);
    renderInventoryTable(inventoryItems);
    updateKPIs(inventoryItems);
  }
};

window.triggerEditProduct = (id) => {
  const item = inventoryItems.find(i => i.id === id);
  if (item) {
    document.getElementById('edit-product-id').value = item.id;
    document.getElementById('edit-product-name').value = item.name;
    document.getElementById('edit-product-category').value = item.category;
    document.getElementById('edit-product-price').value = item.price;

    const modal = document.getElementById('edit-product-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }
};

window.triggerDeleteProduct = (id) => {
  targetDeleteId = id;
  const modal = document.getElementById('delete-product-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
};