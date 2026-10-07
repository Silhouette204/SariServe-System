import { showToast } from './toast.js';
import { API_BASE } from './config.js';

export function signIn(){

const signInForm = document.querySelector('form');

if (signInForm && window.location.pathname.includes('sign-in.html')) {

  const googleBtn = document.getElementById('google-signin-btn'); 

  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      window.location.href = `${API_BASE}/api/auth/google`;
    });
  }

  const errorParam = new URLSearchParams(window.location.search).get('error');
if (errorParam) {
  showToast(
    errorParam === 'google_cancelled'
      ? 'Google sign-in was cancelled.'
      : 'Google sign-in failed. Please try again.',
    'error'
  );
}

  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameOrEmail = document.getElementById('sign-in-username').value.trim();
    const password = document.getElementById('sign-in-password').value.trim();

    if (!usernameOrEmail || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/local-auth/signin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: usernameOrEmail, password }),
      });

      const data = await response.json();

      if (response.ok && data.requiresOtp) {
        showToast(data.message, 'success');
        setTimeout(() => {
          window.location.href = `verify-email.html?email=${encodeURIComponent(data.email)}&purpose=login&channel=${data.channel}&sentTo=${encodeURIComponent(data.sentTo)}`;
        }, 1000);
      } else {
        showToast(data.error || 'Incorrect email or password.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Unable to connect to the server.', 'error');
    }
  });
}

}