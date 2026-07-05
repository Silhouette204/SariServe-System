import './style.css'

import { initNav } from './nav.js';
import { initAccordion } from './accordion.js';
import {
    renderDashboardNav,
    initDashboardNav
} from "./dashboard-nav.js";


document.addEventListener('DOMContentLoaded', () => {

    if (document.getElementById('side-menu') !== null) {  
        initNav();
        }

        //you need this two to make the navigation appear ang function
    renderDashboardNav();
    initDashboardNav();

const accordionContainer = document.getElementById('accordion-container');
if (accordionContainer) {
   initAccordion();
}

});