// src/nav.js
export function initNav() {
 
  // 3. Kunin ang mga kakailanganing DOM elements para sa Control Actions pagkatapos mai-render
  const sideNav = document.getElementById('side-menu');
  const menuBtn = document.getElementById('menu-btn');
  const closeBtn = document.getElementById('close-menu-btn');
  const backDrop = document.getElementById('backdrop');

  if (!sideNav || !menuBtn || !closeBtn || !backDrop) {
    console.warn("SariServe Nav Warning: May kulang na element sa initialization.");
    return;
  }

  // 4. Open Sidebar & Backdrop Click Event Controller
  menuBtn.onclick = function() {
    sideNav.classList.remove('-translate-x-full');
    backDrop.classList.remove('opacity-0', 'pointer-events-none');
    backDrop.classList.add('opacity-100', 'pointer-events-auto');
  };

  // 5. Close Sidebar & Backdrop Action Function
  function closeAll() {
    sideNav.classList.add('-translate-x-full');
    backDrop.classList.add('opacity-0', 'pointer-events-none');
    backDrop.classList.remove('opacity-100', 'pointer-events-auto');
  }

  closeBtn.onclick = closeAll;
  backDrop.onclick = closeAll;

  // Kusa ring magsasara kapag nag-click ng links sa loob ng sidebar menu
  const navLinks = sideNav.querySelectorAll('ul li a');
  navLinks.forEach(link => {
    link.onclick = closeAll;
  });
}