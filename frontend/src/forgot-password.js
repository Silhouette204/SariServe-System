import { showToast } from './toast.js';
import { API_BASE } from './config.js';

export function forgotPassword() {

  const forgotForm = document.getElementById('forgot-form');

  if (!forgotForm || !window.location.pathname.includes('forgot-password.html')) return;

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('forgot-email').value.trim();

    if (!email) {
      showToast('Please enter your email.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/local-auth/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Something went wrong.', 'error');
        return;
      }
      showToast('If an account exists for this email, a reset code has been sent.', 'success');

      const channel = data.channel || 'email';
      const sentTo = data.sentTo || email;

      setTimeout(() => {
        window.location.href = `verify-reset-code.html?email=${encodeURIComponent(email)}&channel=${channel}&sentTo=${encodeURIComponent(sentTo)}`;
      }, 1500);
    } catch (error) {
      console.error('Forgot Password Error:', error);
      showToast('Unable to connect to the server.', 'error');
    }
  });
}