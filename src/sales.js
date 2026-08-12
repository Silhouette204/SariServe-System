import { fetchSalesDashboardData } from './sales-services.js';
import { renderSalesChart, renderModalSalesChart } from './sales-charts.js';

// Store last fetched chart data para magamit sa modal
let currentChartData = { labels: [], values: [] };

export async function initSalesPage() {
  initSalesModals();
  await loadDashboardData('this-week');

  const timeframeSelect = document.getElementById('timeframe');
  if (timeframeSelect) {
    timeframeSelect.addEventListener('change', async (e) => {
      await loadDashboardData(e.target.value);
    });
  }
}

async function loadDashboardData(timeframe) {
  const data = await fetchSalesDashboardData(timeframe);
  if (!data) return;

  // Save reference para sa modal preview
  currentChartData = data.chart || { labels: [], values: [] };

  // 1. Populate KPI Cards (Inayos ang IDs)
  const todayRev = document.getElementById('sales-today-revenue');
  const totalTrans = document.getElementById('sales-total-transaction');
  const avgSale = document.getElementById('sales-average-sale');
  const monthRev = document.getElementById('sales-monthly-revenue');

  if (todayRev) todayRev.textContent = `₱ ${data.kpis.todayRevenue.toFixed(2)}`;
  if (totalTrans) totalTrans.textContent = data.kpis.totalTransactions;
  if (avgSale) avgSale.textContent = `₱ ${data.kpis.avgSale.toFixed(2)}`;
  if (monthRev) monthRev.textContent = `₱ ${data.kpis.monthlyRevenue.toFixed(2)}`;

  // 2. Render Main Chart
  renderSalesChart(data.chart.labels, data.chart.values);

  // 3. Populate Tables & Lists
  populateRecentSalesTable(data.recentSales);
  populateTopProducts(data.topProducts);
}

export function initSalesModals() {
  const modal = document.getElementById('export-sales-modal');
  const openBtn = document.getElementById('open-export-modal-btn');
  const closeBtn = document.getElementById('close-export-modal-btn');
  const cancelBtn = document.getElementById('cancel-export-modal-btn');

  const toggleModal = (show = true) => {
    if (!modal) return;
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      
      // I-render ang modal chart gamit ang dynamic chart data mula sa DB
      renderModalSalesChart(currentChartData.labels, currentChartData.values);
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  if (openBtn) openBtn.onclick = () => toggleModal(true);
  if (closeBtn) closeBtn.onclick = () => toggleModal(false);
  if (cancelBtn) cancelBtn.onclick = () => toggleModal(false);
}

function populateRecentSalesTable(transactions = []) {
  const tbody = document.querySelector('#sales-dashboard table tbody');
  if (!tbody) return;

  if (transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No recent transactions</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(item => `
    <tr class="hover:bg-slate-50/30 transition">
      <td class="px-6 py-5 font-semibold text-secondary">${item.invoiceId}</td>
      <td class="px-6 py-5 text-slate-800">${item.customerName || 'Walk-in'}</td>
      <td class="px-6 py-5 text-slate-500">${item.itemCount} items</td>
      <td class="px-6 py-5">
        <span class="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-600/10">
          ${item.paymentMethod}
        </span>
      </td>
      <td class="px-6 py-5">
        <div class="flex flex-col">
          <span class="font-medium text-slate-800">${item.time}</span>
          <span class="text-xs text-slate-400">${item.date}</span>
        </div>
      </td>
      <td class="px-6 py-5 text-right font-bold text-slate-900 text-base">
        ₱${item.totalAmount.toFixed(2)}
      </td>
    </tr>
  `).join('');
}

function populateTopProducts(products = []) {
  const ul = document.querySelector('#sales-dashboard ul');
  if (!ul) return;

  ul.innerHTML = products.map((prod, index) => `
    <li>
      <div class="flex flex-row items-center justify-between w-full gap-3 py-2">
        <div class="flex items-center gap-3">
          <span class="bg-secondary py-2 px-4 rounded-xl text-base font-bold text-primary shrink-0">${index + 1}</span>
          <div>
            <h1 class="text-secondary font-semibold text-base leading-tight">${prod.name}</h1>
            <p class="text-secondary/80 text-sm"><span>${prod.soldCount}</span> sold</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <h3 class="text-secondary font-bold text-xl">₱ <span>${prod.totalRevenue.toFixed(2)}</span></h3>
        </div>
      </div>
    </li>
  `).join('');
}