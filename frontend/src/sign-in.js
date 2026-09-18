export function signIn(){

const signInForm = document.querySelector('form'); // o lagyan mo ng id ang <form id="signin-form"> sa HTML

if (signInForm && window.location.pathname.includes('sign-in.html')) {
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameOrEmail = document.getElementById('sign-in-username').value.trim();
    const password = document.getElementById('sign-in-password').value.trim();

    if (!usernameOrEmail || !password) {
      alert('Please, Fill up all the blanks');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/local-auth/signin', {
        method: 'POST',
        credentials: 'include', // ← ito yung kulang
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: usernameOrEmail, password }),
      });

      const data = await response.json();

      if (response.ok && data.requiresOtp) {
        window.location.href = `verify-email.html?email=${encodeURIComponent(data.email)}&purpose=login`;
      } else if (!response.ok) {
        alert(data.error || 'Wrong type of email or password');
      } else {
        alert(data.error || 'Wrong type of email or password');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Cannot connect to server.');
    }
  });
}

}