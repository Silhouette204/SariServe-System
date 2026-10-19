import './style.css';

import { initSmoothScroll } from './smooth-scroll.js';
//for smooth scrolling
initSmoothScroll();

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
//scroll animation
gsap.registerPlugin(ScrollTrigger);

import { initAnimations } from './animations.js';

import { initNav } from './nav.js';
import { initAccordion } from './accordion.js';
import { initPasswordToggles } from './password-toggle.js';
import { initFeature } from './features.js';

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
import { verifyEmail } from './verify-email.js';

//forgot-password
import { forgotPassword } from './forgot-password.js';
import { confirmPassword } from './confirm-password.js';
import { verifyResetCode } from './verify-reset-code.js';

//load username or client name
import { loadUserGreeting } from './load-user.js';

document.addEventListener('DOMContentLoaded', async () => {

  initAnimations(); 

  if (document.getElementById('side-menu') !== null) {  
    initNav();
  }

//password-toggle
initPasswordToggles();

  //for login call
  signIn();
  signUp();
  verifyEmail();

  //for forgot-password call
  forgotPassword();
  confirmPassword();
  verifyResetCode();

  //for dashboard
  renderDashboardNav();
  initDashboardNav();

//for username
loadUserGreeting();

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

  //feature setup
  const featureContainer = document.getElementById('feature-container');
  if (featureContainer){
    initFeature();
  }

  ScrollTrigger.refresh();
});