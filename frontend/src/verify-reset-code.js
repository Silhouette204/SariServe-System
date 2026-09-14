// verify-reset-code.js
export function verifyResetCode() {

  const resetCodeForm = document.getElementById('reset-code-form');

  if (!resetCodeForm || !window.location.pathname.includes('verify-reset-code.html')) return;

  const otpBoxes = document.querySelectorAll('.otp-box');
  const messageEl = document.getElementById('reset-code-message');
  const subtitleEl = document.getElementById('reset-code-subtitle');

  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');

  const resendLink = document.getElementById('resend-reset-link'); 

  if (email) {
    subtitleEl.innerHTML = `Ilagay ang reset code na ipinadala sa <strong>${email}</strong>.`;
  } else {
    subtitleEl.textContent = 'Walang email na nakita. Bumalik sa forgot password.';
  }

  otpBoxes.forEach((box, index) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/[^0-9]/g, '');
      if (box.value && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        otpBoxes[index - 1].focus();
      }
    });

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

  resetCodeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = [...otpBoxes].map(box => box.value).join('');

    if (!email) {
      messageEl.textContent = 'Walang email na nakita. Bumalik sa forgot password.';
      messageEl.className = 'text-center text-sm mt-4 mb-4 text-red-500';
      return;
    }

    if (code.length !== 6) {
      messageEl.textContent = 'Kumpletuhin ang 6-digit code.';
      messageEl.className = 'text-center text-sm mt-4 mb-4 text-red-500';
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/local-auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        messageEl.textContent = data.message;
        messageEl.className = 'text-center text-sm mt-4 mb-4 text-green-600';
        setTimeout(() => {
          window.location.href = `confirm-password.html?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
        }, 1000);
      } else {
        messageEl.textContent = data.error;
        messageEl.className = 'text-center text-sm mt-4 mb-4 text-red-500';
        otpBoxes.forEach(box => box.value = '');
        otpBoxes[0].focus();
      }
    } catch (error) {
      console.error('Verify Reset Code Error:', error);
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
        body: JSON.stringify({ email, purpose: 'reset' }), // ← 'reset' palagi dito
      });
      const data = await response.json();
      messageEl.textContent = response.ok ? 'Naipadala ulit ang code!' : data.error;
      messageEl.className = response.ok
        ? 'text-center text-sm mt-4 mb-4 text-green-600'
        : 'text-center text-sm mt-4 mb-4 text-red-500';
  
      if (response.ok) {
        otpBoxes.forEach(box => box.value = '');
        otpBoxes[0].focus();
      }
    } catch (error) {
      console.error('Resend Error:', error);
    }
  });
}