// backend/lib/sms.js
export async function sendSms(number, message) {
  if (!process.env.SEMAPHORE_API_KEY) {
    console.log(`[SMS not sent, no API key] ${number}: ${message}`);
    return;
  }

  const res = await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      apikey: process.env.SEMAPHORE_API_KEY,
      number,
      message,
    }),
  });

  if (!res.ok) throw new Error(`SMS failed with status ${res.status}`);
}