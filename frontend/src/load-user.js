export async function loadUserGreeting() {
  try {
    const res = await fetch('/api/local-auth/session', { credentials: 'include' });
    if (!res.ok) return; // not logged in, ok lang mag-leave ng default text

    const { firstName, lastName } = await res.json();
    const fullName = `${firstName} ${lastName}`;

    const navName = document.getElementById('nav-user-fullname');
    if (navName) navName.textContent = fullName;

    const welcomeName = document.getElementById('welcome-user-name');
    if (welcomeName) welcomeName.textContent = firstName; // mas natural na first name lang dito
  } catch (err) {
    console.warn('Failed to load session:', err);
  }
}