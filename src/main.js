import './style.css';

import { initNav } from './nav.js';
import { initAccordion } from './accordion.js';
import { dashboardInitCharts } from './dashboard-charts.js';
import { salesInitCharts } from './sales-charts.js';
import { initDashboardModals, loadDashboardData } from './dashboard.js';
import { initInventoryModals } from './inventory.js';
import { initSalesModals } from './sales.js';
import { initUtangModals } from './utang.js';


import {
    renderDashboardNav,
    initDashboardNav
} from "./dashboard-nav.js";

document.addEventListener('DOMContentLoaded', async () => {

    if (document.getElementById('side-menu') !== null) {  
        initNav();
        }

        //you need this two to make the navigation appear ang function
    renderDashboardNav();
    initDashboardNav();
    
       // 2. Chart Initializers (Initial Empty State)
        dashboardInitCharts();
        salesInitCharts();


    //modals
    //dashboard
    initDashboardModals();

    //inventory
    initInventoryModals();

    //sales
    initSalesModals();

    //utang modals
    initUtangModals();
   
  // 4. Accordion setup  
const accordionContainer = document.getElementById('accordion-container');
if (accordionContainer) {
   initAccordion();
}

// 5. Fetch & Load Database Data into Cards & Charts
await loadDashboardData();

});