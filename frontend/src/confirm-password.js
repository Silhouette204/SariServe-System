// confirm-password.js
import { showToast } from './toast.js';
import { API_BASE } from './config.js';

export function confirmPassword() {

  const confirmForm = document.getElementById('confirm-form');

  if (!confirmForm || !window.location.pathname.includes('confirm-password.html')) return;

  const subtitleEl = document.getElementById('confirm-subtitle');

  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');
  const code = params.get('code');

  if (email && subtitleEl) {
    subtitleEl.innerHTML = `Enter a new password for <strong>${email}</strong>.`;
  }

  confirmForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('confirm-new-password').value.trim();
    const repeatPassword = document.getElementById('confirm-repeat-password').value.trim();

    if (!email || !code) {
      showToast('No email or code found. Please go back to forgot password.', 'error');
      return;
    }

    if (newPassword !== repeatPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/local-auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Password successfully reset. You can now sign in.', 'success');
        setTimeout(() => window.location.href = 'sign-in.html', 1500);
      } else {
        showToast(data.error || 'Unable to reset password.', 'error');
      }
    } catch (error) {
      console.error('Confirm Password Error:', error);
      showToast('Unable to connect to the server.', 'error');
    }
  });
}