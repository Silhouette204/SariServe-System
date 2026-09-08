export function verifyEmail() {

  if (!window.location.pathname.includes('verify-email.html')) return;

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const iconEl = document.getElementById('status-icon');
  const titleEl = document.getElementById('status-title');
  const messageEl = document.getElementById('status-message');
  const actionEl = document.getElementById('action-link');

  async function runVerification() {
    if (!token) {
      showError('Walang verification token na nakita sa link.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/local-auth/verify-email?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        showSuccess(data.message || 'Na-verify na ang email mo!');
      } else {
        showError(data.error || 'Hindi ma-verify ang email.');
      }
    } catch (error) {
      console.error('Verify Error:', error);
      showError('Hindi makakonekta sa server.');
    }
  }

  function showSuccess(message) {
    iconEl.innerHTML = '<i class="fa-solid fa-circle-check text-green-500"></i>';
    titleEl.textContent = 'Verified!';
    messageEl.textContent = message;
    actionEl.classList.remove('hidden');
  }

  function showError(message) {
    iconEl.innerHTML = '<i class="fa-solid fa-circle-xmark text-red-500"></i>';
    titleEl.textContent = 'Hindi Na-verify';
    messageEl.textContent = message;
    actionEl.textContent = 'Bumalik sa Sign Up';
    actionEl.href = 'sign-up.html';
    actionEl.classList.remove('hidden');
  }

  runVerification();
}