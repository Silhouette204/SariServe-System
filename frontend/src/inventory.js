// src/inventory.js
const API_URL = import.meta.env.VITE_API_URL || '';

let inventoryItems = [];
let targetDeleteId = null;

// 1. MAIN INITIALIZER FUNCTION
export async function initInventory() {
  initModals();
  await fetchInventory();
  setupSearchAndFilters();
}

// 2. FETCH DATA FROM BACKEND API
export async function fetchInventory() {
  try {
    const response = await fetch(`${API_URL}/api/inventory`);// pag i-connect mo na yung API_URL sa .env file, pag wala, magiging localhost:3000, kaya para gumana ang system sa labas or sa vercel ay kailangan mo yung API_URL.
    if (!response.ok) throw new Error('Failed to fetch inventory');
    
    inventoryItems = await response.json();
    renderInventorySalesTable(inventoryItems);
    renderInventoryAdjustmentTable(inventoryItems);
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
  <!-- Sales lang: bawas stock, walang "+" -->
  <div class="flex items-center gap-2">
    <button onclick="window.recordSale('${itemId}')" class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition select-none cursor-pointer">
      −
    </button>
    <span class="w-12 text-center font-semibold text-slate-800">${item.stock}</span>
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
  <!-- Adjustment: pareho "+" at "-", walang Sale record -->
  <div class="flex items-center gap-2">
    <button onclick="window.recordAdjustment('${itemId}', -1)" class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition select-none cursor-pointer">
      −
    </button>
    <span class="w-12 text-center font-semibold text-slate-800">${item.stock}</span>
    <button onclick="window.recordAdjustment('${itemId}', 1)" class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition select-none cursor-pointer">
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
function setupSearchAndFilters() {
  const searchInput = document.querySelector('#inventory-dashboard input[type="text"]');
  const categorySelect = document.querySelector('#timeframe'); // Gamitin ang exact ID ng select dropdown mo

  const filterData = () => {
    const query = searchInput?.value.trim().toLowerCase() || '';
    const selectedCategory = categorySelect?.value || 'All Categories';

    const filtered = inventoryItems.filter(item => {
      // Safe access gamit ang optional chaining at fallback
      const productName = (item.name || '').toLowerCase();
      const productCategory = item.category || '';

      const matchesSearch = productName.includes(query);
      const matchesCategory = selectedCategory === 'All Categories' || productCategory === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    renderInventorySalesTable(filtered);
renderInventoryAdjustmentTable(filtered);
    
    // NOTE: Ang KPIs (Total, In Stock, Low Stock, Out of Stock) ay nananatiling nakabatay 
    // sa kabuuang imbentaryo (inventoryItems) para hindi magbago ang store summary kapag nagha-hanap lang.
  };

  if (searchInput) searchInput.addEventListener('input', filterData);
  if (categorySelect) categorySelect.addEventListener('change', filterData);
}

// 7. MODAL CONTROLLERS & API ACTIONS ADD, EDIT, DELETE
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
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to add product');
        }

        // Itong sunod na block ay duplicate na lang at pwede nang tanggalin:
        if (response.ok) {
          await fetchInventory(); // Refresh list from DB
          addForm.reset();
          toggleModal('add-product-modal', false);
        }
      } catch (error) {
        console.error('Error adding product:', error);
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
        }
      } catch (error) {
        console.error('Error updating product:', error);
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
        } else {
          const data = await response.json();
          alert(data.error || 'Failed to delete product');
        }

      } catch (error) {
        console.error('Error deleting product:', error);
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

  const item = inventoryItems.find(
    (i) => String(i._id || i.id) === String(id)
  );

  if (!item) return;

  if (item.stock < quantity) {
    alert('Hindi sapat ang stock!');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/inventory/${id}/sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });

    if (response.ok) {
      const updated = await response.json();
      item.stock = updated.stock;

      renderInventorySalesTable(inventoryItems);
      renderInventoryAdjustmentTable(inventoryItems);
      updateKPIs(inventoryItems);
    }
  } catch (error) {
    console.error('Error recording sale:', error);
  }
};

// Para sa ADJUSTMENT table — bawas/dagdag stock lang, walang Sale record
window.recordAdjustment = async (id, amount, reason = 'OTHER') => {

  const item = inventoryItems.find(
    (i) => String(i._id || i.id) === String(id)
  );
  
  if (!item) return;

  const newStock = Math.max(0, item.stock + amount);

  try {
    const response = await fetch(`${API_URL}/api/inventory/${id}/adjustment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, reason })
    });

    if (response.ok) {
      const updated = await response.json();
    
      item.stock = updated.stock;
      renderInventorySalesTable(inventoryItems);
      renderInventoryAdjustmentTable(inventoryItems);
      updateKPIs(inventoryItems);
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to adjust stock');
    }
    
  } catch (error) {
    console.error('Error recording adjustment:', error);
  }
};

window.triggerEditProduct = (id) => {
  
  const item = inventoryItems.find(
    (i) => String(i._id || i.id) === String(id)
  );
  
  if (item) {
    document.getElementById('edit-product-id').value = id;
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