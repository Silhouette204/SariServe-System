export function renderDashboardNav() {
  const dashboardNav = document.querySelector("#dashboard-nav");

  if (!dashboardNav) {
    return;
  }

 dashboardNav.innerHTML = ` 
  <nav class="flex items-center justify-between p-4 bg-dark text-primary sticky top-0 z-50 px-5 lg:px-10">
      <div class="flex items-center gap-3">
        <button id="menu-btn" class="cursor-pointer text-2xl text-primary hover:bg-gray-700/50 px-3 py-2 rounded-full lg:hidden transition duration-300">
          <i class="fa-solid fa-bars"></i>
        </button>
        <a href="#" class="text-2xl font-bold tracking-tight text-primary">
          SariServe
        </a>
      </div>

      <div class="hidden lg:flex flex-row gap-6 font-medium">
        <a href="index.html" class="hover:text-gray-300 transition">Home</a>
        <a href="#about" class="hover:text-gray-300 transition">About</a>
        <a href="#experiences" class="hover:text-gray-300 transition">Experience</a>
        <a href="#latest-work" class="hover:text-gray-300 transition">Projects</a>
      </div>

      <div class="hidden lg:block">
        <a href="./dashboard.html" class="hover:text-gray-300 font-medium transition">Login</a>
      </div>
    </nav>

    <!-- BACKDROP BACKGROUND -->
    <div id="backdrop" class="fixed inset-0 bg-black/40 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 z-40"></div>

    <!-- SIDEBAR MENU -->
    <aside id="side-menu" class="fixed top-0 left-0 h-screen w-64 text-primary transition-transform duration-300 z-50 transform -translate-x-full bg-secondary">
      <div class="flex flex-row items-center gap-3 m-5">
        <button id="close-menu-btn" class="cursor-pointer text-2xl text-primary hover:bg-gray-700 px-4 py-2 rounded-full transition duration-300">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <span class="text-2xl font-bold text-primary">SariServe</span>
      </div>

      <ul class="flex flex-col gap-2 mx-3 mt-5">
        <li class="flex items-center text-primary hover:bg-gray-700/50 px-4 py-3 rounded-xl transition duration-200 cursor-pointer">
          <i class="fa-solid fa-house w-6 text-xl"></i>
          <a href="index.html" class="font-medium ml-2 w-full">Home</a>
        </li>
        <li class="flex items-center text-primary hover:bg-gray-700/50 px-4 py-3 rounded-xl transition duration-200 cursor-pointer">
          <i class="fa-solid fa-address-card w-6 text-xl"></i>
          <a href="#about" class="font-medium ml-2 w-full">About</a>
        </li>
        <li class="flex items-center text-primary hover:bg-gray-700/50 px-4 py-3 rounded-xl transition duration-200 cursor-pointer">
          <i class="fa-solid fa-bell-concierge w-6 text-xl"></i>
          <a href="#experiences" class="font-medium ml-2 w-full">Services</a>
        </li>
        <li class="flex items-center text-primary hover:bg-gray-700/50 px-4 py-3 rounded-xl transition duration-200 cursor-pointer">
          <i class="fa-solid fa-address-book w-6 text-xl"></i>
          <a href="#latest-work" class="font-medium ml-2 w-full">Contacts</a>
        </li>
        <li class="border-t border-gray-700 my-2"></li> 
        <li class="flex items-center text-primary hover:bg-gray-700/50 px-4 py-3 rounded-xl transition duration-200 cursor-pointer">
          <i class="fa-solid fa-right-to-bracket w-6 text-xl"></i>
          <a href="./dashboard.html" class="font-medium ml-2 w-full">Login</a>
        </li>
      </ul>
    </aside>
 `
}

export function initDashboardNav() {
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