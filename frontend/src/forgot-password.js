// forgot-password.js
export function forgotPassword() {

  const forgotForm = document.getElementById('forgot-form');

  if (!forgotForm || !window.location.pathname.includes('forgot-password.html')) return;

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('forgot-email').value.trim();

    if (!email) {
      alert('Ilagay ang email mo.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/local-auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      alert(data.message);

      window.location.href = `verify-reset-code.html?email=${encodeURIComponent(email)}`;
    } catch (error) {
      console.error('Forgot Password Error:', error);
      alert('Hindi makakonekta sa server.');
    }
  });
}