// frontend/src/password-toggle.js
export function initPasswordToggles() {
  document.querySelectorAll('.password-toggle-btn').forEach((btn) => {
    // iwasan ang double-binding kung tatawagin ulit ito
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (!input || !icon) return;

      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      icon.classList.toggle('fa-eye');
      icon.classList.toggle('fa-eye-slash');
    });
  });
}