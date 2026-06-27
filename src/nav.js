export function initNav() {
  const sideNav = document.querySelector('#side-menu');
  const menuBtn = document.querySelector('#menu-btn');
  const closeBtn = document.querySelector('#close-menu-btn');
  const backDrop = document.querySelector('#backdrop');

  // Guard clause para iwas error kung sakaling wala ang mga elemento sa page
  if (!sideNav || !menuBtn || !closeBtn || !backDrop) return;

  // Open Sidebar & Backdrop
  menuBtn.addEventListener('click', () => {
    sideNav.classList.remove('-translate-x-full');
    backDrop.classList.remove('opacity-0', 'pointer-events-none');
    backDrop.classList.add('opacity-100', 'pointer-events-auto');
  });

  // Close Sidebar & Backdrop
  function closeAll() {
    sideNav.classList.add('-translate-x-full');
    backDrop.classList.add('opacity-0', 'pointer-events-none');
    backDrop.classList.remove('opacity-100', 'pointer-events-auto');
  }

  closeBtn.addEventListener('click', closeAll);
  backDrop.addEventListener('click', closeAll);

  // Kusa ring magsasara ang menu kapag may pinindot na link sa loob nito
  const navLinks = sideNav.querySelectorAll('ul li a');
  navLinks.forEach(link => {
    link.addEventListener('click', closeAll);
  });
}