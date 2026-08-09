import './style.css'

import { initNav } from './nav.js';
import { initAccordion } from './accordion.js';
import { dashboardInitCharts } from './dashboard-charts.js';
import { salesInitCharts } from './sales-charts.js';
import { initDashboardModals } from './dashboard.js';
import { initInventoryModals } from './inventory.js';
import { initSalesModals } from './sales.js';
import { initUtangModals } from './utang.js';


import {
    renderDashboardNav,
    initDashboardNav
} from "./dashboard-nav.js";

document.addEventListener('DOMContentLoaded', () => {

    if (document.getElementById('side-menu') !== null) {  
        initNav();
        }
       
        dashboardInitCharts();
        salesInitCharts();

        //you need this two to make the navigation appear ang function
    renderDashboardNav();
    initDashboardNav();

    //modals
    initDashboardModals();

    //inventory
    initInventoryModals();

    //sales
    initSalesModals();

    //utang modals
    initUtangModals();
   
    
const accordionContainer = document.getElementById('accordion-container');
if (accordionContainer) {
   initAccordion();
}

});