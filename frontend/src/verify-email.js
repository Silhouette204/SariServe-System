import { showToast } from "./toast";
import {API_BASE} from "./config.js"

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
  const purpose = params.get('purpose'); 

  const channel = params.get('channel');
  const sentTo = params.get('sentTo');

  if (email) {
    const where = channel === 'phone' ? 'your phone number' : 'your email';
    subtitleEl.textContent = `We sent a 6-digit code to ${where} `;
    const strong = document.createElement('strong');
    strong.textContent = (sentTo && sentTo !== 'undefined') ? sentTo : email;
    subtitleEl.appendChild(strong);
  } else {
    subtitleEl.textContent = 'There is no email received, back to sign-up';
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
      messageEl.textContent = 'There is no email received, back to forgot-password';
      messageEl.className = 'text-center text-sm mt-4 mb-4 text-red-500';
      return;
    }

    if (code.length !== 6) {
      messageEl.textContent = 'Must complete 6-Digit verification code';
      messageEl.className = 'text-center text-sm mt-4 mb-4 text-red-500';
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/local-auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code, purpose }),
      });

      const data = await response.json();

      if (response.ok) {
       showToast(data.message, 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1500); // ← dating 'sign-in.html'
      } else {
       showToast(data.error, 'error');
        otpBoxes.forEach(box => box.value = '');
        otpBoxes[0].focus();
      }

    } catch (error) {
      console.error('Verify Error:', error);
      messageEl.textContent = 'Cannot connect to server.';
      messageEl.className = 'text-center text-sm mt-4 mb-4 text-red-500';
    }
  });

  resendLink.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!email) return;
  
    try {
      const response = await fetch(`${API_BASE}/api/local-auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }), // ← idinagdag ang purpose
      });
      const data = await response.json();
      messageEl.textContent = response.ok ? 'The code was resubmit succesfully!' : data.error;
      messageEl.className = response.ok 
        ? 'text-center text-sm mt-4 mb-4 text-green-600'
        : 'text-center text-sm mt-4 mb-4 text-red-500'; 
  
      if (response.ok) {
        showToast('Code Verification Resubmit Succesfully!', 'success');
        otpBoxes.forEach(box => box.value = ''); // ← linisin ang mga box para sa bagong code
        otpBoxes[0].focus();
      } else {
       showToast(data.error || 'Resend failed.', 'error');
      }
    } catch (error) {
      showToast('Cannot connect to server.', 'error');
    }
  });
}