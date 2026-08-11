import './style.css';

import { initNav } from './nav.js';
import { initAccordion } from './accordion.js';
import { dashboardInitCharts } from './dashboard-charts.js';
import { salesInitCharts } from './sales-charts.js';
import { initDashboardModals, loadDashboardData } from './dashboard.js';
import { initInventory } from './inventory.js'; // Single import lang
import { renderDashboardNav, initDashboardNav } from './dashboard-nav.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('side-menu') !== null) {  
    initNav();
  }

  renderDashboardNav();
  initDashboardNav();

  // Dashboard Page Route Check
  if (document.getElementById('dashboard')) {
    dashboardInitCharts();
    initDashboardModals();
    await loadDashboardData();
  }

    // Inventory Page Route Check
    if (document.getElementById('inventory-dashboard')) {
        initInventory();
      }

      // Patakbuhin kung nandoon ang elements ng sales/utang
  if (typeof initSalesModals === 'function') initSalesModals(); //[cite: 6]
  if (typeof initUtangModals === 'function') initUtangModals(); //[cite: 6]
});