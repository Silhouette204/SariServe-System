import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

import { showToast } from './toast.js';
import { API_BASE } from './config.js';


const LOW_STOCK_THRESHOLD = 10;

function getLowItems() {
  return inventoryItems
    .filter((i) => i.stock <= LOW_STOCK_THRESHOLD)  // kasama ang Out of Stock
    .sort((a, b) => a.stock - b.stock);             // pinaka-urgent sa taas
}


function openLowStockModal() {
  const lowItems = getLowItems();
  const outCount = lowItems.filter((i) => i.stock === 0).length;

  document.getElementById('low-stock-date').textContent =
    new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('low-stock-total').textContent = lowItems.length;
  document.getElementById('low-stock-low-count').textContent = lowItems.length - outCount;
  document.getElementById('low-stock-out-count').textContent = outCount;

  const tbody = document.getElementById('low-stock-tbody');
  tbody.innerHTML = lowItems.length
    ? lowItems.map((item) => {
        const status = getStockStatus(item.stock);
        return `
          <tr>
            <td class="py-2.5 px-3 font-semibold">${item.name}</td>
            <td class="py-2.5 px-3">${item.category ?? '-'}</td>
            <td class="py-2.5 px-3 text-center font-bold">${item.stock}</td>
            <td class="py-2.5 px-3">
              <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.class}">${status.label}</span>
            </td>
            <td class="py-2.5 px-3"><div class="border-b border-slate-300 h-5"></div></td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="5" class="py-6 px-3 text-center text-slate-400">Walang low stock items ngayon.</td></tr>`;

  document.getElementById('download-low-stock-pdf-btn').disabled = lowItems.length === 0;
  toggleModal('low-stock-modal', true);
}

async function downloadLowStockPdf() {
  const reportEl = document.getElementById('low-stock-report-area');
  const btn = document.getElementById('download-low-stock-pdf-btn');
  if (!reportEl) return;

  btn.disabled = true;

  // Tanggalin pansamantala ang scroll/height limit para makuha ang BUONG listahan
  const original = {
    overflow: reportEl.style.overflow,
    height: reportEl.style.height,
    maxHeight: reportEl.style.maxHeight,
  };
  reportEl.style.overflow = 'visible';
  reportEl.style.height = 'auto';
  reportEl.style.maxHeight = 'none';

  try {
    const canvas = await html2canvas(reportEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      height: reportEl.scrollHeight,
      windowHeight: reportEl.scrollHeight,
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const margin = 10;
    const usableWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const usableHeight = pdf.internal.pageSize.getHeight() - margin * 2;

    // Ilang pixel ng canvas ang katumbas ng 1mm, at ilang pixel ang kasya sa isang page
    const pxPerMm = canvas.width / usableWidth;
    const pagePx = Math.floor(usableHeight * pxPerMm);

    let renderedPx = 0;
    let pageIndex = 0;

    while (renderedPx < canvas.height) {
      const slicePx = Math.min(pagePx, canvas.height - renderedPx);

      // Gumawa ng pansamantalang canvas na hiwa lang ng buong larawan
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = slicePx;
      slice.getContext('2d').drawImage(
        canvas, 0, renderedPx, canvas.width, slicePx, // kunin mula rito
        0, 0, canvas.width, slicePx                   // ilagay dito
      );

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, usableWidth, slicePx / pxPerMm);

      renderedPx += slicePx;
      pageIndex++;
    }

    pdf.save(`SariServe-Low-Stock-${new Date().toLocaleDateString('en-CA')}.pdf`);
    showToast('Low stock list downloaded! Check your downloads folder.', 'success');
  } catch (error) {
    console.error('Error generating PDF:', error);
    showToast('Failed to generate the PDF. Please try again later', 'error');
  } finally {
    reportEl.style.overflow = original.overflow;
    reportEl.style.height = original.height;
    reportEl.style.maxHeight = original.maxHeight;
    btn.disabled = false;
  }
}

function initLowStockModal() {
  document.getElementById('open-low-stock-modal-btn')?.addEventListener('click', openLowStockModal);
  document.getElementById('close-low-stock-modal-btn')?.addEventListener('click', () => toggleModal('low-stock-modal', false));
  document.getElementById('cancel-low-stock-modal-btn')?.addEventListener('click', () => toggleModal('low-stock-modal', false));
  document.getElementById('download-low-stock-pdf-btn')?.addEventListener('click', downloadLowStockPdf);
  document.getElementById('low-stock-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'low-stock-modal') toggleModal('low-stock-modal', false); // click sa backdrop
  });
}

let inventoryItems = [];
let targetDeleteId = null;
// ---------- ROW ACTIONS (3-dots dropdown) ----------
let rowMenuEl = null;
let rowMenuAnchor = null; // ang button na nagbukas ng menu

// Actions cell na gamit ng dalawang table
function rowActionsCell(itemId) {
  return `
    <td class="px-6 py-4 text-right">
      <button type="button"
        onclick="window.toggleRowMenu(this, '${itemId}')"
        aria-label="Row actions" aria-haspopup="menu"
        class="row-menu-btn inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition cursor-pointer">
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>
    </td>
  `;
}

function closeRowMenu() {
  rowMenuEl?.classList.add('hidden');
  rowMenuAnchor = null;
}

function initRowMenu() {
  rowMenuEl = document.createElement('div');
  rowMenuEl.id = 'row-action-menu';
  rowMenuEl.setAttribute('role', 'menu');
  rowMenuEl.className = 'hidden fixed z-40 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg';
  rowMenuEl.innerHTML = `
    <button type="button" data-action="edit" class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
      <i class="fa-solid fa-pen-to-square w-4 text-amber-600"></i> Edit
    </button>
    <button type="button" data-action="delete" class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer">
      <i class="fa-solid fa-trash-can w-4"></i> Delete
    </button>
  `;
  document.body.appendChild(rowMenuEl);

  // Pumili ng Edit o Delete
  rowMenuEl.addEventListener('click', (e) => {
    const option = e.target.closest('[data-action]');
    if (!option) return;

    const id = rowMenuEl.dataset.id;
    closeRowMenu();
    if (option.dataset.action === 'edit') window.triggerEditProduct(id);
    if (option.dataset.action === 'delete') window.triggerDeleteProduct(id);
  });

  // Isara kapag may pinindot sa labas, Escape, scroll, o resize
  document.addEventListener('click', (e) => {
    if (e.target.closest('#row-action-menu, .row-menu-btn')) return;
    closeRowMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRowMenu();
  });
  window.addEventListener('scroll', closeRowMenu, true);
  window.addEventListener('resize', closeRowMenu);
}

window.toggleRowMenu = (btn, id) => {
  if (!rowMenuEl) return;

  // Pinindot ulit ang parehong button, isara
  if (rowMenuAnchor === btn) {
    closeRowMenu();
    return;
  }

  rowMenuAnchor = btn;
  rowMenuEl.dataset.id = id;
  rowMenuEl.classList.remove('hidden');

  const btnRect = btn.getBoundingClientRect();
  const menuRect = rowMenuEl.getBoundingClientRect();
  const gap = 4;

  // Sa ilalim ng button; kung hindi kasya, sa itaas
  let top = btnRect.bottom + gap;
  if (top + menuRect.height > window.innerHeight - 8) {
    top = btnRect.top - menuRect.height - gap;
  }

  rowMenuEl.style.top = `${top}px`;
  rowMenuEl.style.left = `${Math.max(8, btnRect.right - menuRect.width)}px`;
};


// ---------- SHARED HELPERS ----------
function toggleModal(modalId, show = true) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.toggle('hidden', !show);
  modal.classList.toggle('flex', show);
}

const findItem = (id) => inventoryItems.find((i) => String(i._id || i.id) === String(id));

// 1. MAIN INITIALIZER FUNCTION
export async function initInventory() {
  initModals();
  initStockModals();
  initLowStockModal();
  initRowMenu();
  await fetchInventory();
  setupSearchAndFilters();
}

// 2. FETCH DATA FROM BACKEND API
export async function fetchInventory() {
  try {
    const response = await fetch(`${API_BASE}/api/inventory`);// pag i-connect mo na yung API_URL sa .env file, pag wala, magiging localhost:3000, kaya para gumana ang system sa labas or sa vercel ay kailangan mo yung API_URL.
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
  } else if (stock <= LOW_STOCK_THRESHOLD) {
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
  closeRowMenu();
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
        <td class="px-6 py-4 font-semibold text-slate-800">${item.stock}</td>
<td class="px-6 py-4">
  <button onclick="window.openSaleModal('${itemId}')" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer">
    <i class="fa-solid fa-cart-shopping"></i> Sell
  </button>
</td>
        <td class="px-6 py-4 font-medium">₱${Number(item.price).toFixed(2)}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.class}">
            ${status.label}
          </span>
        </td>
        ${rowActionsCell(itemId)}
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
        <td class="px-6 py-4 font-semibold text-slate-800">${item.stock}</td>
<td class="px-6 py-4">
  <button onclick="window.openAdjustModal('${itemId}')" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer">
    <i class="fa-solid fa-sliders"></i> Adjust
  </button>
</td>
        <td class="px-6 py-4 font-medium">₱${Number(item.price).toFixed(2)}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.class}">
            ${status.label}
          </span>
        </td>
        ${rowActionsCell(itemId)}
      </tr>
    `;
  }).join('');
}


// 5. UPDATE KPI METRICS
export function updateKPIs(items) {
  const total = items.length;
  const inStock = items.filter(i => i.stock > LOW_STOCK_THRESHOLD).length;
  const lowStock = items.filter(i => i.stock > 0 && i.stock <= LOW_STOCK_THRESHOLD).length;
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
        const response = await fetch(`${API_BASE}/api/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct),
        });

        if (response.ok) {
          await fetchInventory();
          addForm.reset();
          toggleModal('add-product-modal', false);
          showToast('Product was successfully added.', 'success');
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
        const response = await fetch(`${API_BASE}/api/inventory/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });

        if (response.ok) {
          await fetchInventory(); // Refresh list
          toggleModal('edit-product-modal', false);
          showToast('Product updated successfully.', 'success');
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
        const response = await fetch(`${API_BASE}/api/inventory/${targetDeleteId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchInventory();
          showToast('Product deleted.', 'success');
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
    const response = await fetch(`${API_BASE}/api/inventory/${id}/sale`, {
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
    const response = await fetch(`${API_BASE}/api/inventory/${id}/adjustment`, {
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
        showToast(`Sale recorded: ${item.name} x ${quantity}`, 'success');
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
        showToast(`Stock updated for ${item.name}.`, 'success');
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