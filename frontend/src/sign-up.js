import { showToast } from './toast.js';
import { API_BASE } from './config.js';
import { attachPasswordStrength, isPasswordValid } from './password-strength.js';

export function signUp() {

  const signUpForm = document.querySelector('form');

  if (signUpForm && window.location.pathname.includes('sign-up.html')) {

    const passwordInput = document.getElementById('user-create-password');
    attachPasswordStrength(passwordInput);

    // --- Google OAuth: nasa labas ng submit para ma-attach agad pag-load ---
    const googleBtn = document.getElementById('google-signin-btn');

    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        const qs = API_BASE ? '' : `?origin=${encodeURIComponent(window.location.origin)}`;
        window.location.href = `${API_BASE}/api/auth/google${qs}`;
      });
    }

    // --- Error toast galing sa Google redirect ---
    const errorParam = new URLSearchParams(window.location.search).get('error');
    if (errorParam) {
      showToast(
        errorParam === 'google_cancelled'
          ? 'Google sign-in was cancelled.'
          : 'Google sign-in failed. Please try again.',
        'error'
      );
    }

    // --- Normal sign-up submit ---
    signUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = signUpForm.querySelector('button[type="submit"]');
      if (submitBtn.disabled) return;

      const firstName = document.getElementById('user-create-firstname').value.trim();
      const lastName = document.getElementById('user-create-lastname').value.trim();
      const email = document.getElementById('user-create-email').value.trim();
      const phone = document.getElementById('user-create-phone').value.trim();
      const password = document.getElementById('user-create-password').value.trim();
      const confirmPassword = document.getElementById('user-create-confirm-password').value.trim();

      const notificationPrefElement = document.querySelector('input[name="notification_pref"]:checked');
      const notificationPref = notificationPrefElement ? notificationPrefElement.value : 'email';

      const termsAgreed = document.getElementById('terms').checked;

      if (!isPasswordValid(password)) {
        showToast('Password does not meet the requirements.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      if (!termsAgreed) {
        showToast('You must agree to the Terms and Conditions.', 'error');
        return;
      }

      if (notificationPref === 'phone' && !phone) {
        showToast('Phone number is required for SMS notifications.', 'error');
        return;
      }

      submitBtn.disabled = true;

      try {
        const response = await fetch(`${API_BASE}/api/local-auth/signup`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, email, phone, password, notificationPref }),
        });

        const data = await response.json();

        if (response.ok) {
          showToast('Account created. Please check your email for the verification code.', 'success');
          setTimeout(() => {
            window.location.href = `verify-email.html?email=${encodeURIComponent(email)}&channel=${data.channel}&sentTo=${encodeURIComponent(data.sentTo)}`;
          }, 1500);
        } else {
          showToast(data.error || 'An error occurred while creating your account.', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showToast('Unable to connect to the server.', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
}