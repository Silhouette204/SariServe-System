const API_URL = import.meta.env.VITE_API_URL || '';

import { fetchSalesDashboardData } from './sales-services.js';
import { renderSalesChart, renderModalSalesChart } from './sales-charts.js';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

let currentChartData = { labels: [], values: [] };
let currentRecentSales = [];
let currentKpis = {};
let currentTopProducts = [];

export async function initSalesPage() {
  initSalesModals();
  await loadDashboardData('this-week');

  const timeframeSelect = document.getElementById('timeframe');
  if (timeframeSelect) {
    timeframeSelect.addEventListener('change', async (e) => {
      await loadDashboardData(e.target.value);
    });
  }

  const searchInput = document.querySelector('#sales-dashboard input[type="text"]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      const filtered = currentRecentSales.filter((item) =>
        item.invoiceId.toLowerCase().includes(query)
      );
      populateRecentSalesTable(filtered);
    });
  }
}

async function loadDashboardData(timeframe) {
  const data = await fetchSalesDashboardData(timeframe);
  if (!data) return;

  currentChartData = data.chart || { labels: [], values: [] };
  currentRecentSales = data.recentSales || [];
  currentKpis = data.kpis || {};
  currentTopProducts = data.topProducts || [];

  const todayRev = document.getElementById('sales-today-revenue');
  const totalTrans = document.getElementById('sales-total-transaction');
  const avgSale = document.getElementById('sales-average-sale');
  const monthRev = document.getElementById('sales-monthly-revenue');

  if (todayRev) todayRev.textContent = `₱ ${data.kpis.todayRevenue.toFixed(2)}`;
  if (totalTrans) totalTrans.textContent = data.kpis.totalTransactions;
  if (avgSale) avgSale.textContent = `₱ ${data.kpis.avgSale.toFixed(2)}`;
  if (monthRev) monthRev.textContent = `₱ ${data.kpis.monthlyRevenue.toFixed(2)}`;

  const setPercent = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    const sign = value >= 0 ? '+' : '';
    el.textContent = `${sign}${value.toFixed(2)}%`;
  };

  setPercent('kpi-sales-today-revenue', data.kpis.todayRevenueChange);
  setPercent('kpi-sales-total-transaction', data.kpis.totalTransactionsChange);
  setPercent('kpi-sales-average-sale', data.kpis.avgSaleChange);
  setPercent('kpi-sales-monthly-revenue', data.kpis.monthlyRevenueChange);

  const prevTodayRev = document.getElementById('prev-sales-today-revenue');
  const prevTotalTrans = document.getElementById('prev-sales-total-transaction');
  const completedDays = document.getElementById('completed-days');

  if (prevTodayRev) prevTodayRev.textContent = `₱ ${data.kpis.prevTodayRevenue.toFixed(2)}`;
  if (prevTotalTrans) prevTotalTrans.textContent = data.kpis.prevTotalTransactions;
  if (completedDays) completedDays.textContent = data.kpis.completedDays;

  renderSalesChart(data.chart.labels, data.chart.values);

  populateRecentSalesTable(data.recentSales);
  populateTopProducts(data.topProducts);
}

export function initSalesModals() {
  const modal = document.getElementById('export-sales-modal');
  const openBtn = document.getElementById('open-export-modal-btn');
  const closeBtn = document.getElementById('close-export-modal-btn');
  const cancelBtn = document.getElementById('cancel-export-modal-btn');
  const downloadBtn = document.getElementById('download-pdf-btn');

  const toggleModal = (show = true) => {
    if (!modal) return;
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      populateReportModal();
      renderModalSalesChart(currentChartData.labels, currentChartData.values);
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  if (openBtn) openBtn.onclick = () => toggleModal(true);
  if (closeBtn) closeBtn.onclick = () => toggleModal(false);
  if (cancelBtn) cancelBtn.onclick = () => toggleModal(false);

  // BAGO: I-download ang report bilang PDF
  if (downloadBtn) {
    downloadBtn.onclick = async () => {
      const reportEl = document.getElementById('printable-report-area');
      if (!reportEl) return;
  
      // Maghintay sandali para fully render ang chart
      await new Promise(resolve => setTimeout(resolve, 300));
  
      // Temporary alisin ang constraints
      const originalStyles = {
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
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          height: reportEl.scrollHeight,
          windowHeight: reportEl.scrollHeight,
          onclone: (clonedDoc) => {
            const canvases = clonedDoc.querySelectorAll('canvas');
            canvases.forEach(c => {
              c.style.visibility = 'visible';
              c.style.display = 'block';
              c.style.opacity = '1';
            });
          }
        });
  
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
        const pdf = new jsPDF({
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        });
  
        const margin = 10; // 10mm margin sa lahat ng side
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
  
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;
  
        // Kunin ang natural size ng image
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
  
        // Kalkulahin ang scale para kasyahin sa isang page (width O height)
        const ratio = Math.min(
          usableWidth / imgWidth,
          usableHeight / imgHeight
        );
  
        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;
  
        // I-center nang pahalang (optional pero mas maganda)
        const x = margin + (usableWidth - finalWidth) / 2;
        const y = margin;
  
        // Isang page lang
        pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
  
        pdf.save(`SariServe-Sales-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('May problema sa pag-generate ng PDF.');
      } finally {
        // Ibalik ang original styles
        reportEl.style.overflow = originalStyles.overflow;
        reportEl.style.height = originalStyles.height;
        reportEl.style.maxHeight = originalStyles.maxHeight;
      }
    };
  }
}

// BAGO: i-populate ang modal ng totoong datos mula sa DB
function populateReportModal() {
  const dateEl = document.getElementById('report-generated-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('report-today-revenue', `₱${(currentKpis.todayRevenue || 0).toFixed(2)}`);
  setText('report-total-transactions', currentKpis.totalTransactions || 0);
  setText('report-avg-sale', `₱${(currentKpis.avgSale || 0).toFixed(2)}`);
  setText('report-monthly-revenue', `₱${(currentKpis.monthlyRevenue || 0).toFixed(2)}`);

  const topProductsBody = document.getElementById('report-top-products-body');
  if (topProductsBody) {
    topProductsBody.innerHTML = currentTopProducts.map((p) => `
      <tr>
        <td class="py-2 px-3 font-semibold">${p.name}</td>
        <td class="py-2 px-3 text-center">${p.soldCount} pcs</td>
        <td class="py-2 px-3 text-right font-medium">₱${p.totalRevenue.toFixed(2)}</td>
      </tr>
    `).join('') || `<tr><td colspan="3" class="py-3 px-3 text-center text-slate-400">Walang datos</td></tr>`;
  }

  const recentSalesBody = document.getElementById('report-recent-sales-body');
  if (recentSalesBody) {
    recentSalesBody.innerHTML = currentRecentSales.map((s) => `
      <tr>
        <td class="py-2 px-3 text-slate-500">${s.time}</td>
        <td class="py-2 px-3">${s.itemCount} items</td>
        <td class="py-2 px-3 text-right font-semibold text-emerald-600">₱${s.totalAmount.toFixed(2)}</td>
      </tr>
    `).join('') || `<tr><td colspan="3" class="py-3 px-3 text-center text-slate-400">Walang datos</td></tr>`;
  }
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