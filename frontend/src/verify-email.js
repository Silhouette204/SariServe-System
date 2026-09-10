export function verifyEmail() {

  const verifyForm = document.getElementById('verify-form');

  if (!verifyForm || !window.location.pathname.includes('verify-email.html')) return;

  const otpBoxes = document.querySelectorAll('.otp-box');
  const messageEl = document.getElementById('verify-message');
  const subtitleEl = document.getElementById('verify-subtitle');
  const resendLink = document.getElementById('resend-link');

  // kunin ang email mula sa URL query param (ipinasa mula sa sign-up.js)
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');

  if (email) {
    subtitleEl.innerHTML = `Ilagay ang code na ipinadala namin sa <strong>${email}</strong>.`;
  } else {
    subtitleEl.textContent = 'Walang email na nakita. Bumalik sa sign up.';
  }

  // Auto-advance sa susunod na box pag nag-type, at auto-back pag Backspace sa blangkong box
  otpBoxes.forEach((box, index) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/[^0-9]/g, ''); // numbers lang
      if (box.value && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        otpBoxes[index - 1].focus();
      }
    });

    // suportahan ang paste ng buong code nang sabay-sabay
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, otpBoxes.length);
      pasted.split('').forEach((digit, i) => {
        if (otpBoxes[i]) otpBoxes[i].value = digit;
      });
      const nextEmpty = [...otpBoxes].find(b => !b.value);
      (nextEmpty || otpBoxes[otpBoxes.length - 1]).focus();
    });
  });

  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = [...otpBoxes].map(box => box.value).join('');

    if (!email) {
      messageEl.textContent = 'Walang email na nakita. Bumalik sa sign up.';
      messageEl.className = 'text-center text-sm mt-4 mb-4 text-red-500';
      return;
    }

    if (code.length !== 6) {
      messageEl.textContent = 'Kumpletuhin ang 6-digit code.';
      messageEl.className = 'text-center text-sm mt-4 mb-4 text-red-500';
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/local-auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        messageEl.textContent = data.message;
        messageEl.className = 'text-center text-sm mt-4 mb-4 text-green-600';
        setTimeout(() => window.location.href = 'sign-in.html', 1500);
      } else {
        messageEl.textContent = data.error;
        messageEl.className = 'text-center text-sm mt-4 mb-4 text-red-500';
        otpBoxes.forEach(box => box.value = '');
        otpBoxes[0].focus();
      }
    } catch (error) {
      console.error('Verify Error:', error);
      messageEl.textContent = 'Hindi makakonekta sa server.';
      messageEl.className = 'text-center text-sm mt-4 mb-4 text-red-500';
    }
  });

  resendLink.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      const response = await fetch('http://localhost:3000/api/local-auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      messageEl.textContent = response.ok ? 'Naipadala ulit ang code!' : data.error;
      messageEl.className = response.ok
        ? 'text-center text-sm mt-4 mb-4 text-green-600'
        : 'text-center text-sm mt-4 mb-4 text-red-500';
    } catch (error) {
      console.error('Resend Error:', error);
    }
  });
}