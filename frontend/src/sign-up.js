import { showToast } from './toast.js';

export function signUp(){

  const signUpForm = document.querySelector('form');
  
  if (signUpForm && window.location.pathname.includes('sign-up.html')) {
    signUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const firstName = document.getElementById('user-create-firstname').value.trim();
      const lastName = document.getElementById('user-create-lastname').value.trim();
      const email = document.getElementById('user-create-email').value.trim();
      const phone = document.getElementById('user-create-phone').value.trim();
      const password = document.getElementById('user-create-password').value.trim();
      const confirmPassword = document.getElementById('user-create-confirm-password').value.trim();
      
      const notificationPrefElement = document.querySelector('input[name="notification_pref"]:checked');
      const notificationPref = notificationPrefElement ? notificationPrefElement.value : 'email';
      
      const termsAgreed = document.getElementById('terms').checked;
  
      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }
  
      if (!termsAgreed) {
        showToast('You must agree to the Terms and Conditions.', 'error');
        return;
      }
  
      if (!phone) {
        showToast('Phone number is required.', 'error');
        return;
      }
  
      try {
        const response = await fetch('http://localhost:3000/api/local-auth/signup', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, email, phone, password, notificationPref }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          showToast('Account created. Please check your email for the verification code.', 'success');
          setTimeout(() => {
            window.location.href = `verify-email.html?email=${encodeURIComponent(email)}`;
          }, 1500);
        } else {
          showToast(data.error || 'An error occurred while creating your account.', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showToast('Unable to connect to the server.', 'error');
      }
    });
  }
  
  }