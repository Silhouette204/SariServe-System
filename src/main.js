import './style.css';

import { initNav } from './nav.js';
import { initAccordion } from './accordion.js';

// Dashboard
import { dashboardInitCharts } from './dashboard-charts.js';
import { initDashboardModals, loadDashboardData } from './dashboard.js';
import { renderDashboardNav, initDashboardNav } from './dashboard-nav.js';

// Inventory
import { initInventory } from './inventory.js';

// Sales (Gawin mong initSalesPage ang i-import)
import { initSalesPage } from './sales.js';

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

  // Sales Page Route Check
  if (document.getElementById('sales-dashboard')) {
    await initSalesPage();
  }
});