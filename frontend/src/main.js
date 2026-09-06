import './style.css';

import { initNav } from './nav.js';
import { initAccordion } from './accordion.js';

// Dashboard
import { dashboardInitCharts } from './dashboard-charts.js';
import { initDashboardModals, loadDashboardData } from './dashboard.js';
import { renderDashboardNav, initDashboardNav } from './dashboard-nav.js';

// Inventory
import { initInventory } from './inventory.js';

// Sales
import { initSalesPage } from './sales.js';

// Utang (Idinagdag)
import { initUtangModals, fetchUtangData } from './utang.js';

//login process
import { signIn } from './sign-in.js';
import { signUp } from './sign-up.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('side-menu') !== null) {  
    initNav();
  }

  //for login call
  signIn();
  signUp();

  renderDashboardNav();
  initDashboardNav();

  // Dashboard Page Route
  if (document.getElementById('dashboard')) {
    dashboardInitCharts();
    initDashboardModals();
    await loadDashboardData();
  }

  // Inventory Page Route
  if (document.getElementById('inventory-dashboard')) {
    initInventory();
  }

  // Sales Page Route
  if (document.getElementById('sales-dashboard')) {
    await initSalesPage();
  }

  // Utang Page Route (Idinagdag)
  if (document.getElementById('utang-dashboard')) {
    initUtangModals();
    await fetchUtangData();
  }

  // Accordion Setup
  const accordionContainer = document.getElementById('accordion-container');
  if (accordionContainer) {
    initAccordion();
  }
});