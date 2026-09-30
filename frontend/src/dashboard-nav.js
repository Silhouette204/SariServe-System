import { API_BASE } from './config.js';

export function renderDashboardNav() {
  const dashboardNav = document.querySelector("#dashboard-nav");

  if (!dashboardNav) {
    return;
  }

 dashboardNav.innerHTML = ` 
  <nav class="flex items-center justify-between p-4 bg-secondary text-primary sticky top-0 z-50 px-5 lg:px-10 lg:hidden">
      <div class="flex items-center gap-3">
        <button id="menu-btn" class="cursor-pointer text-2xl text-primary hover:bg-gray-700/50 px-3 py-2 rounded-full lg:hidden transition duration-300">
          <i class="fa-solid fa-bars"></i>
        </button>
        <a href="#" class="text-2xl font-bold tracking-tight text-primary">
          SariServe
        </a>
      </div>
     
    </nav>

    <!-- BACKDROP BACKGROUND -->
    <div id="backdrop" class="fixed inset-0 bg-black/40 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 z-40"></div>

    <!-- SIDEBAR MENU -->
<aside id="side-menu" class="fixed inset-y-0 left-0 w-64 text-primary transition-transform duration-300 z-50 -translate-x-full bg-secondary lg:translate-x-0">

  <div class="flex h-full flex-col justify-between">
    <div>
      <div class="flex flex-row items-center gap-3 mx-6 mt-10">
        <button id="close-menu-btn" class="lg:hidden cursor-pointer text-2xl text-primary hover:bg-gray-700 px-4 py-2 rounded-full transition duration-300">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <span class="text-2xl font-bold text-primary">SariServe</span>
      </div>

     <ul class="flex flex-col gap-2 mx-3 mt-5">
        <li class="flex items-center text-primary hover:bg-gray-700/50 px-4 py-3 rounded-xl transition duration-200 cursor-pointer">
      
          <i class="fa-solid fa-table-columns w-6 text-xl"></i>
          <a href="dashboard.html" class="font-medium ml-2 w-full">Dashboard</a>
        </li>
        <li class="flex items-center text-primary hover:bg-gray-700/50 px-4 py-3 rounded-xl transition duration-200 cursor-pointer">
        
          <i class="fa-solid fa-warehouse  w-6 text-xl"></i>
          <a href="inventory.html" class="font-medium ml-2 w-full">Inventory</a>
        </li>
        <li class="flex items-center text-primary hover:bg-gray-700/50 px-4 py-3 rounded-xl transition duration-200 cursor-pointer">
          <i class="fa-solid fa-bell-concierge w-6 text-xl"></i>
          <a href="sales.html" class="font-medium ml-2 w-full">Sales</a>
        </li>
        <li class="flex items-center text-primary hover:bg-gray-700/50 px-4 py-3 rounded-xl transition duration-200 cursor-pointer">
          <i class="fa-solid fa-address-book w-6 text-xl"></i>
          <a href="utang.html" class="font-medium ml-2 w-full">Utang</a>
        </li>
       
      </ul>
    </div>

    <div>

    <div class= "border border-t-secondary">
    </div>

    <div class="mx-3 mt-5 mb-5 ">

    <div class="flex flex-row items-center gap-3 px-3 mb-3">
    <i class="fa-regular fa-circle-user text-2xl "></i>
    <div>
    <h3 class="font-semibold text-primary"><span id="nav-user-fullname">Loading...</span></h3>
    <p class="text-primary/80 text-sm">Store Owner</p>
    </div>
    </div>

      <a href="index.html" id="logout-btn" class="px-3 flex items-center py-3 rounded-xl hover:bg-gray-700/50 font-medium transition"><i class="fa-solid fa-arrow-right-from-bracket text-primary font-semibold mr-5"></i>
        Logout
      </a>
    </div>
    </div>
  </div>

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

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = async (e) => {
      e.preventDefault();
      try {
        await fetch(`${API_BASE}/api/local-auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } finally {
        window.location.href = 'index.html';
      }
    };
  }


}