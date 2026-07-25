import './style.css'

import { initNav } from './nav.js';
import { initAccordion } from './accordion.js';
import { initCharts } from './charts.js';

import {
    renderDashboardNav,
    initDashboardNav
} from "./dashboard-nav.js";

document.addEventListener('DOMContentLoaded', () => {

    if (document.getElementById('side-menu') !== null) {  
        initNav();
        }
       
        initCharts();

        //you need this two to make the navigation appear ang function
    renderDashboardNav();
    initDashboardNav();

const accordionContainer = document.getElementById('accordion-container');
if (accordionContainer) {
   initAccordion();
}

});