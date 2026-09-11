// confirm-password.js
export function confirmPassword() {

  const confirmForm = document.getElementById('confirm-form');

  if (!confirmForm || !window.location.pathname.includes('confirm-password.html')) return;

  const subtitleEl = document.getElementById('confirm-subtitle');
  const messageEl = document.getElementById('confirm-message');

  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');
  const code = params.get('code'); // ← galing na sa URL, hindi sa input

  if (email && subtitleEl) {
    subtitleEl.innerHTML = `Ilagay ang bagong password para sa <strong>${email}</strong>.`;
  }

  confirmForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('confirm-new-password').value.trim();
    const repeatPassword = document.getElementById('confirm-repeat-password').value.trim();

    if (!email || !code) {
      messageEl.textContent = 'Walang email o code na nakita. Bumalik sa forgot password.';
      messageEl.className = 'text-center text-sm mt-4 text-red-500';
      return;
    }

    if (newPassword !== repeatPassword) {
      messageEl.textContent = 'Hindi magkatugma ang password.';
      messageEl.className = 'text-center text-sm mt-4 text-red-500';
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/local-auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        messageEl.textContent = data.message;
        messageEl.className = 'text-center text-sm mt-4 text-green-600';
        setTimeout(() => window.location.href = 'sign-in.html', 1500);
      } else {
        messageEl.textContent = data.error;
        messageEl.className = 'text-center text-sm mt-4 text-red-500';
      }
    } catch (error) {
      console.error('Confirm Password Error:', error);
      messageEl.textContent = 'Hindi makakonekta sa server.';
      messageEl.className = 'text-center text-sm mt-4 text-red-500';
    }
  });
}