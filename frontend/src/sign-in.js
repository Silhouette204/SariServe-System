import { showToast } from './toast.js';

export function signIn(){

const signInForm = document.querySelector('form');

if (signInForm && window.location.pathname.includes('sign-in.html')) {
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameOrEmail = document.getElementById('sign-in-username').value.trim();
    const password = document.getElementById('sign-in-password').value.trim();

    if (!usernameOrEmail || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/local-auth/signin', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: usernameOrEmail, password }),
      });

      const data = await response.json();

      if (response.ok && data.requiresOtp) {
        showToast('Login code sent to your email.', 'success');
        setTimeout(() => {
          window.location.href = `verify-email.html?email=${encodeURIComponent(data.email)}&purpose=login`;
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