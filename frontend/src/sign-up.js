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
    
    // Kunin ang napiling notification preference (email o phone)
    const notificationPrefElement = document.querySelector('input[name="notification_pref"]:checked');
    const notificationPref = notificationPrefElement ? notificationPrefElement.value : 'email';
    
    const termsAgreed = document.getElementById('terms').checked;

    if (password !== confirmPassword) {
      alert('Hindi magkatugma ang password at confirm password.');
      return;
    }

    if (!termsAgreed) {
      alert('Kailangan mong sumang-ayon sa Terms and Conditions.');
      return;
    }

    if (!phone) {
      alert('Kailangan ng phone number.');
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
        alert('Matagumpay ang paggawa ng account! Paki-check ang email mo para sa verification code.');
        window.location.href = `verify-email.html?email=${encodeURIComponent(email)}`;
      } else {
        alert(data.error || 'May nangyaring error sa pag-rehistro.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Hindi makakonekta sa backend server.');
    }
  });
}

}