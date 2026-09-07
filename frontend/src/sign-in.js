export function signIn(){

const signInForm = document.querySelector('form'); // o lagyan mo ng id ang <form id="signin-form"> sa HTML

if (signInForm && window.location.pathname.includes('sign-in.html')) {
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameOrEmail = document.getElementById('sign-in-username').value.trim();
    const password = document.getElementById('sign-in-password').value.trim();

    if (!usernameOrEmail || !password) {
      alert('Mangyaring punan ang lahat ng espasyo.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/local-auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: usernameOrEmail, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('Login Successful!');
        window.location.href = '/dashboard.html'; // Palitan ng path papunta sa dashboard mo
      } else {
        alert(data.error || 'Mali ang username o password.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Hindi makakonekta sa server.');
    }
  });
}

}