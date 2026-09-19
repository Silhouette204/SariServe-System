// src/inventory.js
const API_URL = import.meta.env.VITE_API_URL || '';

let inventoryItems = [];
let targetDeleteId = null;

// ---------- SHARED HELPERS ----------
function toggleModal(modalId, show = true) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.toggle('hidden', !show);
  modal.classList.toggle('flex', show);
}

function showToast(message, kind = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-opacity duration-300 ${
    kind === 'error' ? 'bg-red-600' : 'bg-emerald-600'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

const findItem = (id) => inventoryItems.find((i) => String(i._id || i.id) === String(id));

// 1. MAIN INITIALIZER FUNCTION
export async function initInventory() {
  initModals();
  initStockModals();
  await fetchInventory();
  setupSearchAndFilters();
}

// 2. FETCH DATA FROM BACKEND API
export async function fetchInventory() {
  try {
    const response = await fetch(`${API_URL}/api/inventory`);// pag i-connect mo na yung API_URL sa .env file, pag wala, magiging localhost:3000, kaya para gumana ang system sa labas or sa vercel ay kailangan mo yung API_URL.
    if (!response.ok) throw new Error('Failed to fetch inventory');

    inventoryItems = await response.json();
    applyFilters();
    updateKPIs(inventoryItems);
  } catch (error) {
    console.error('Error loading inventory:', error);
  }
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

// Renders both tables using the current search text + category.
// Called after every fetch / sale / adjustment so the filter never resets.
function applyFilters() {
  const query = document.querySelector('#inventory-dashboard input[type="text"]')?.value.trim().toLowerCase() || '';
  const category = document.querySelector('#timeframe')?.value || 'All Categories';

  const filtered = inventoryItems.filter(item =>
    (item.name || '').toLowerCase().includes(query) &&
    (category === 'All Categories' || item.category === category)
  );

  renderInventorySalesTable(filtered);
  renderInventoryAdjustmentTable(filtered);
}

// 4. RENDER TABLE ROWS
export function renderInventorySalesTable(items) {
  const salesTbody = document.querySelector('#sales-tbody');
  if (!salesTbody) return;

  if (items.length === 0) {
    salesTbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-slate-400">
          No products found.
        </td>
      </tr>
    `;
    return;
  }

  salesTbody.innerHTML = items.map(item => {
    const status = getStockStatus(item.stock);
    const itemId = item._id || item.id; // Compatible sa MongoDB (_id) o SQL (id)

    return `
      <tr class="hover:bg-slate-50/50 transition">
        <td class="px-6 py-4 font-medium text-slate-900">${item.name}</td>
        <td class="px-6 py-4">${item.category}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <span class="w-12 text-center font-semibold text-slate-800">${item.stock}</span>
            <button onclick="window.openSaleModal('${itemId}')" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer">
              <i class="fa-solid fa-cart-shopping"></i> Sell
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
          <button onclick="window.triggerEditProduct('${itemId}')" class="text-sm font-semibold text-secondary hover:underline mr-3 cursor-pointer">Edit</button>
          <button onclick="window.triggerDeleteProduct('${itemId}')" class="text-sm font-semibold text-red-600 hover:underline cursor-pointer">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

export function renderInventoryAdjustmentTable(items) {
  const adjustmentTbody = document.querySelector('#adjustment-tbody');
  if (!adjustmentTbody) return;

  if (items.length === 0) {
    adjustmentTbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-slate-400">
          No products found.
        </td>
      </tr>
    `;
    return;
  }

  adjustmentTbody.innerHTML = items.map(item => {
    const status = getStockStatus(item.stock);
    const itemId = item._id || item.id; // Compatible sa MongoDB (_id) o SQL (id)

    return `
      <tr class="hover:bg-slate-50/50 transition">
        <td class="px-6 py-4 font-medium text-slate-900">${item.name}</td>
        <td class="px-6 py-4">${item.category}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <span class="w-12 text-center font-semibold text-slate-800">${item.stock}</span>
            <button onclick="window.openAdjustModal('${itemId}')" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer">
              <i class="fa-solid fa-sliders"></i> Adjust
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
          <button onclick="window.triggerEditProduct('${itemId}')" class="text-sm font-semibold text-secondary hover:underline mr-3 cursor-pointer">Edit</button>
          <button onclick="window.triggerDeleteProduct('${itemId}')" class="text-sm font-semibold text-red-600 hover:underline cursor-pointer">Delete</button>
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
// NOTE: Ang KPIs ay nananatiling nakabatay sa kabuuang imbentaryo (inventoryItems)
// para hindi magbago ang store summary kapag nagha-hanap lang.
function setupSearchAndFilters() {
  document.querySelector('#inventory-dashboard input[type="text"]')?.addEventListener('input', applyFilters);
  document.querySelector('#timeframe')?.addEventListener('change', applyFilters);
}

// 7. MODAL CONTROLLERS & API ACTIONS ADD, EDIT, DELETE
function initModals() {
  // ADD MODAL
  const openAddBtn = document.getElementById('open-add-product-btn');
  const closeAddBtn = document.getElementById('close-add-modal-btn');
  const cancelAddBtn = document.getElementById('cancel-add-modal-btn');
  const addForm = document.getElementById('add-product-form');

  if (openAddBtn) openAddBtn.onclick = () => toggleModal('add-product-modal', true);
  if (closeAddBtn) closeAddBtn.onclick = () => toggleModal('add-product-modal', false);
  if (cancelAddBtn) cancelAddBtn.onclick = () => toggleModal('add-product-modal', false);

  if (addForm) {
    addForm.onsubmit = async (e) => {
      e.preventDefault();
      const newProduct = {
        name: document.getElementById('add-product-name').value,
        category: document.getElementById('add-product-category').value,
        price: parseFloat(document.getElementById('add-product-price').value),
        stock: parseInt(document.getElementById('add-product-stock').value, 10) || 0
      };

      try {
        const response = await fetch(`${API_URL}/api/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct),
        });

        if (response.ok) {
          await fetchInventory();
          addForm.reset();
          toggleModal('add-product-modal', false);
          showToast('Product was successfully added.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          showToast(errorData.error || 'Failed to add product', 'error');
        }
      } catch (error) {
        console.error('Error adding product:', error);
        showToast('Connection problem. Please try again.', 'error');
      }
    };
  }

  // EDIT MODAL
  const closeEditBtn = document.getElementById('close-edit-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-modal-btn');
  const editForm = document.getElementById('edit-product-form');

  if (closeEditBtn) closeEditBtn.onclick = () => toggleModal('edit-product-modal', false);
  if (cancelEditBtn) cancelEditBtn.onclick = () => toggleModal('edit-product-modal', false);

  if (editForm) {
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-product-id').value;
      const updatedData = {
        name: document.getElementById('edit-product-name').value,
        category: document.getElementById('edit-product-category').value,
        price: parseFloat(document.getElementById('edit-product-price').value)
      };

      try {
        const response = await fetch(`${API_URL}/api/inventory/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });

        if (response.ok) {
          await fetchInventory(); // Refresh list
          toggleModal('edit-product-modal', false);
          showToast('Product updated successfully.');
        } else {
          const data = await response.json().catch(() => ({}));
          showToast(data.error || 'Failed to update product', 'error');
        }
      } catch (error) {
        console.error('Error updating product:', error);
        showToast('Connection problem. Please try again.', 'error');
      }
    };
  }

  // DELETE MODAL
  const cancelDeleteBtn = document.getElementById('cancel-delete-modal-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  if (cancelDeleteBtn) cancelDeleteBtn.onclick = () => toggleModal('delete-product-modal', false);

  if (confirmDeleteBtn) {
    confirmDeleteBtn.onclick = async () => {
      if (!targetDeleteId) return;

      try {
        const response = await fetch(`${API_URL}/api/inventory/${targetDeleteId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchInventory();
          showToast('Product deleted.');
        } else {
          const data = await response.json().catch(() => ({}));
          showToast(data.error || 'Failed to delete product', 'error');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Connection problem. Please try again.', 'error');
      } finally {
        toggleModal('delete-product-modal', false);
      }
    };
  }

  // Backdrop clicks
  window.addEventListener('click', (e) => {
    if (e.target.id === 'add-product-modal') toggleModal('add-product-modal', false);
    if (e.target.id === 'edit-product-modal') toggleModal('edit-product-modal', false);
    if (e.target.id === 'delete-product-modal') toggleModal('delete-product-modal', false);
  });
}

// 8. GLOBAL WINDOW ACTIONS
// Para sa SALES table — bawas stock + gumagawa ng Sale record
window.recordSale = async (id, quantity = 1) => {
  const item = findItem(id);
  if (!item) return false;

  if (item.stock < quantity) {
    showToast('Not enough stock.', 'error');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/inventory/${id}/sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast(data.error || 'Failed to record sale', 'error');
      return false;
    }

    const updated = await response.json();
    item.stock = updated.stock;
    applyFilters();
    updateKPIs(inventoryItems);
    return true;
  } catch (error) {
    console.error('Error recording sale:', error);
    showToast('Connection problem. Please try again.', 'error');
    return false;
  }
};

// Para sa ADJUSTMENT table — bawas/dagdag stock lang, walang Sale record
window.recordAdjustment = async (id, amount, reason = 'OTHER') => {
  const item = findItem(id);
  if (!item) return false;

  try {
    const response = await fetch(`${API_URL}/api/inventory/${id}/adjustment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, reason })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast(data.error || 'Failed to adjust stock', 'error');
      return false;
    }

    const updated = await response.json();
    item.stock = updated.stock;
    applyFilters();
    updateKPIs(inventoryItems);
    return true;
  } catch (error) {
    console.error('Error recording adjustment:', error);
    showToast('Connection problem. Please try again.', 'error');
    return false;
  }
};

window.triggerEditProduct = (id) => {
  const item = findItem(id);
  if (!item) return;

  document.getElementById('edit-product-id').value = id;
  document.getElementById('edit-product-name').value = item.name;
  document.getElementById('edit-product-category').value = item.category;
  document.getElementById('edit-product-price').value = item.price;

  toggleModal('edit-product-modal', true);
};

window.triggerDeleteProduct = (id) => {
  targetDeleteId = id;
  toggleModal('delete-product-modal', true);
};

// 9. STOCK MODALS (SELL + ADJUST)
function initStockModals() {
  // Close / cancel buttons + backdrop
  ['sale', 'adjust'].forEach((name) => {
    const modalId = `${name}-modal`;
    document.getElementById(`close-${name}-modal-btn`)?.addEventListener('click', () => toggleModal(modalId, false));
    document.getElementById(`cancel-${name}-modal-btn`)?.addEventListener('click', () => toggleModal(modalId, false));
    document.getElementById(modalId)?.addEventListener('click', (e) => {
      if (e.target.id === modalId) toggleModal(modalId, false);
    });
  });

  // SALE: confirm
  document.getElementById('sale-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    if (btn) btn.disabled = true; // iwas double submit (double Sale record)

    try {
      const id = document.getElementById('sale-product-id').value;
      const quantity = parseInt(document.getElementById('sale-quantity').value, 10);
      const item = findItem(id);

      const ok = await window.recordSale(id, quantity);
      if (ok) {
        toggleModal('sale-modal', false);
        showToast(`Sale recorded: ${quantity} × ${item.name}`);
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  // ADJUSTMENT: confirm
  document.getElementById('adjust-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    if (btn) btn.disabled = true;

    try {
      const id = document.getElementById('adjust-product-id').value;
      const direction = document.getElementById('adjust-direction').value;
      const quantity = parseInt(document.getElementById('adjust-quantity').value, 10);
      const reason = document.getElementById('adjust-reason').value;
      const item = findItem(id);

      if (direction === 'remove' && quantity > item.stock) {
        showToast('Cannot remove more than the current stock.', 'error');
        return; // dumadaan pa rin sa finally
      }

      const amount = direction === 'remove' ? -quantity : quantity;
      const ok = await window.recordAdjustment(id, amount, reason);
      if (ok) {
        toggleModal('adjust-modal', false);
        showToast(`Stock updated for ${item.name}.`);
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

// Openers (tinatawag ng inline onclick sa rows)
window.openSaleModal = (id) => {
  const item = findItem(id);
  if (!item) return;

  if (item.stock === 0) {
    showToast('This item is out of stock.', 'error');
    return;
  }

  document.getElementById('sale-product-id').value = id;
  document.getElementById('sale-product-name').textContent = item.name;
  document.getElementById('sale-current-stock').textContent = item.stock;

  const qty = document.getElementById('sale-quantity');
  qty.value = 1;
  qty.max = item.stock; // native validation: hindi puwedeng lumampas sa stock

  toggleModal('sale-modal', true);
};

window.openAdjustModal = (id) => {
  const item = findItem(id);
  if (!item) return;

  document.getElementById('adjust-product-id').value = id;
  document.getElementById('adjust-product-name').textContent = item.name;
  document.getElementById('adjust-current-stock').textContent = item.stock;
  document.getElementById('adjust-direction').value = 'add';
  document.getElementById('adjust-quantity').value = 1;
  document.getElementById('adjust-reason').value = 'OTHER';

  toggleModal('adjust-modal', true);
};